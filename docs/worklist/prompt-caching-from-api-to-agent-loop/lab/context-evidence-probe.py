#!/usr/bin/env python3
"""Replace or append corrected evidence. Dry-run by default; no retries.

Eight calls, a $0.94096 planning reserve, and an independent $1 ceiling.
Raw requests and full response blocks remain in a fresh private directory.
"""

import argparse
import copy
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.request

MODEL = "claude-sonnet-5-5"
MAX_OUTPUT = 512
MAX_REQUEST_BYTES = 25_000
HIDDEN_TOKEN_ALLOWANCE = 20_000
PRICES = {"input": "2", "write_5m": "2.5", "write_1h": "4", "read": "0.2", "output": "10"}
CASES = ["original_v1", "replace_and_drop_answer", "append_and_keep_answer", "replace_and_keep_answer"]
QUESTION = ('For SKU-PINE, return only JSON with keys unit_price_usd, units, total_usd, source_id, '
            'stale_assistant_answer_present. Compute total_usd as unit_price_usd * units. '
            'The last field is true only if an earlier assistant answer in this request contains '
            'a price, units, or total contradicted by the current source. Cite the current source_id.')


def block(text, cache=False):
    result = {"type": "text", "text": text}
    if cache:
        result["cache_control"] = {"type": "ephemeral", "ttl": "5m"}
    return result


def source(revision):
    price, units = (17, 6) if revision == 1 else (23, 9)
    return (f"Retrieved inventory snapshot. source_id=inventory:v{revision}; revision={revision}.\n"
            f"SKU-PINE: unit_price_usd={price}; units={units}.\n"
            "This snapshot is synthetic evidence supplied by the caller.")


def baseline(run, replicate):
    policy = (f"Experiment {run}; replicate {replicate}. Use only the supplied synthetic inventory sources. "
              "For a SKU, the highest source revision is current. Earlier assistant answers are derived "
              "summaries, never independent evidence. Recompute arithmetic from the current source. "
              "Do not call tools. Do not describe your reasoning.\n")
    reference = "\n".join(
        f"Reference row {i:03d}: This is synthetic background for cache reuse. It does not state the current inventory or price."
        for i in range(100)
    )
    return {"model": MODEL, "max_tokens": MAX_OUTPUT, "output_config": {"effort": "low"},
            "system": [block(policy + reference, True)],
            "messages": [{"role": "user", "content": [block(source(1), True), block(QUESTION)]}]}


def request_for(name, base, assistant_content):
    payload = copy.deepcopy(base)
    if name.startswith("replace"):
        payload["messages"][0]["content"][0] = block(source(2), True)
    if name.endswith("keep_answer"):
        payload["messages"].append({"role": "assistant", "content": copy.deepcopy(assistant_content)})
        content = []
        if name.startswith("append"):
            content.append(block("Correction: the following revision 2 supersedes revision 1 for SKU-PINE. "
                                 "Recompute any earlier answer derived from revision 1.\n" + source(2), True))
        content.append(block(QUESTION))
        payload["messages"].append({"role": "user", "content": content})
    return payload


def credentials(path):
    values = {}
    for line in path.read_text().splitlines():
        name, separator, value = line.strip().removeprefix("export ").partition("=")
        if separator and name in {"CLAUDE_API_KEY", "ANTHROPIC_API_KEY", "ANTHROPIC_WORKSPACE_ID"}:
            values[name] = value.strip().strip("\"'")
    key = values.get("CLAUDE_API_KEY") or values.get("ANTHROPIC_API_KEY")
    if not key:
        raise SystemExit("No supported API key found; values withheld")
    headers = {"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
    if values.get("ANTHROPIC_WORKSPACE_ID"):
        headers["anthropic-workspace-id"] = values["ANTHROPIC_WORKSPACE_ID"]
    return headers


def cost(usage):
    long = usage.get("cache_creation", {}).get("ephemeral_1h_input_tokens", 0)
    return (Decimal(usage.get("input_tokens", 0)) * Decimal(PRICES["input"])
            + Decimal(usage.get("cache_creation_input_tokens", 0) - long) * Decimal(PRICES["write_5m"])
            + Decimal(long) * Decimal(PRICES["write_1h"])
            + Decimal(usage.get("cache_read_input_tokens", 0)) * Decimal(PRICES["read"])
            + Decimal(usage.get("output_tokens", 0)) * Decimal(PRICES["output"])) / Decimal(1_000_000)


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--private-dir", type=Path)
    parser.add_argument("--public-output", type=Path)
    args = parser.parse_args()
    reserve_per_call = (Decimal(MAX_REQUEST_BYTES + HIDDEN_TOKEN_ALLOWANCE) * Decimal(PRICES["write_5m"])
                        + Decimal(MAX_OUTPUT) * Decimal(PRICES["output"])) / Decimal(1_000_000)
    reserve = reserve_per_call * 8
    plan = {"mode": "dry-run", "model": MODEL, "requests": 8, "replicates": 2, "cases": CASES,
            "conservative_plan_reserve_usd": float(reserve), "budget_cap_usd": 1,
            "max_request_bytes": MAX_REQUEST_BYTES, "hidden_token_allowance_per_request": HIDDEN_TOKEN_ALLOWANCE,
            "no_credentials_read": True}
    if reserve > 1:
        raise SystemExit("Plan exceeds $1 cap")
    if not args.execute:
        print(json.dumps(plan, indent=2))
        return
    if args.private_dir is None or args.public_output is None:
        raise SystemExit("Both --private-dir and --public-output required")
    private = args.private_dir.resolve()
    if not private.is_relative_to(Path("/tmp").resolve()) or private.exists():
        raise SystemExit("Choose a fresh directory under /tmp; never overwrite evidence")
    if args.public_output.exists():
        raise SystemExit("Public output already exists; do not overwrite an earlier result")
    headers = credentials(args.env)
    private.mkdir(parents=True, mode=0o700)
    run = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    rows, spent = [], Decimal(0)
    for replicate in range(2):
        base = baseline(run, replicate)
        assistant_content = None
        for name in CASES:
            payload = request_for(name, base, assistant_content)
            encoded = json.dumps(payload).encode()
            if len(encoded) > MAX_REQUEST_BYTES or spent + reserve_per_call > 1:
                raise SystemExit("Request exceeds planning allowance; stopped before sending")
            started = time.perf_counter()
            stamp = datetime.now(timezone.utc).isoformat()
            try:
                request = urllib.request.Request("https://api.anthropic.com/v1/messages", data=encoded, headers=headers)
                with urllib.request.urlopen(request, timeout=120) as response:
                    raw_bytes = response.read()
            except (urllib.error.HTTPError, urllib.error.URLError) as error:
                status = error.code if isinstance(error, urllib.error.HTTPError) else "transport"
                print(json.dumps({"case": name, "status": status, "stopped": True,
                                  "estimated_recorded_cost_usd": float(spent), "error_body_withheld": True}))
                raise SystemExit(1) from None
            elapsed = time.perf_counter() - started
            raw_path = private / f"{replicate}-{name}.json"
            raw_response = json.loads(raw_bytes)
            raw_path.write_text(json.dumps({"request": payload, "response": raw_response}, indent=2) + "\n")
            if raw_response.get("model") != MODEL or raw_response.get("stop_reason") != "end_turn":
                raise SystemExit("Unexpected model or incomplete answer; stopped, inspect private receipt")
            usage = raw_response["usage"]
            estimated = cost(usage)
            spent += estimated
            content = raw_response["content"]
            text = "".join(part["text"] for part in content if part.get("type") == "text")
            try:
                answer = json.loads(text.strip().removeprefix("```json").removesuffix("```").strip())
            except json.JSONDecodeError:
                answer = {}
            original = name == "original_v1"
            expected = {"unit_price_usd": 17 if original else 23, "units": 6 if original else 9,
                        "total_usd": 102 if original else 207, "source_id": "inventory:v1" if original else "inventory:v2",
                        "stale_assistant_answer_present": name.endswith("keep_answer")}
            row = {"replicate": replicate, "case": name, "at_utc": stamp, "model": raw_response["model"],
                   "usage": usage, "elapsed_seconds": elapsed, "stop_reason": raw_response["stop_reason"],
                   "expected": expected, "answer": answer,
                   "field_matches": {key: answer.get(key) == value for key, value in expected.items()},
                   "correct": all(answer.get(key) == value for key, value in expected.items()),
                   "estimated_cost_usd": float(estimated), "request_sha256": digest(payload),
                   "request_bytes": len(encoded), "assistant_content_sha256": digest(content),
                   "replayed_assistant_sha256": digest(assistant_content) if name.endswith("keep_answer") else None,
                   "private_receipt_sha256": hashlib.sha256(raw_path.read_bytes()).hexdigest()}
            rows.append(row)
            if original:
                assistant_content = copy.deepcopy(content)
            result = {"run": run, "prices_per_million_usd": PRICES, "conservative_plan_reserve_usd": float(reserve),
                      "budget_cap_usd": 1, "estimated_total_usd": float(spent), "rows": rows}
            (private / "results.json").write_text(json.dumps(result, indent=2) + "\n")
            args.public_output.write_text(json.dumps(result, indent=2) + "\n")
            print(json.dumps({"replicate": replicate, "case": name, "usage": usage, "answer": answer,
                              "correct": row["correct"], "estimated_total_usd": float(spent)}), flush=True)
            if spent > 1:
                raise SystemExit("Actual spend exceeded planning assumptions; stopped")


if __name__ == "__main__":
    main()

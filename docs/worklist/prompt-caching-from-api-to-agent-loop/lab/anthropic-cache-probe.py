#!/usr/bin/env python3
"""Synthetic, budgeted Anthropic cache experiment. Dry-run by default.

Credentials are loaded only with --execute, never printed or written.
No automatic retries. Raw response bodies and IDs stay in the private run folder.
"""

import argparse
import copy
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.request

MODEL = "claude-sonnet-5-5"
PRICES = {"input": 2.0, "write_5m": 2.5, "write_1h": 4.0, "read": 0.2, "output": 10.0}
MAX_OUTPUT = 512


def text_block(text, cache=False):
    block = {"type": "text", "text": text}
    if cache:
        block["cache_control"] = {"type": "ephemeral", "ttl": "5m"}
    return block


def baseline(run, replicate):
    policy = f"Run {run}, replicate {replicate}. Return compact JSON with keys currency and code. Currency policy: USD. Read code from RECORD-137. Do not call tools."
    system_reference = "\n".join(f"Policy reference {i:03d}: preserve record identifiers; values are synthetic; quote the selected record exactly." for i in range(70))
    records_a = "\n".join(f"RECORD-{i:03d}: code=VALUE-{i:03d}; region=west; status=active." for i in range(100))
    records_b = "\n".join(f"RECORD-{i:03d}: code=VALUE-{i:03d}; region=east; status=active." for i in range(100, 200))
    return {
        "model": MODEL, "max_tokens": MAX_OUTPUT, "stream": True,
        "output_config": {"effort": "low"},
        "tools": [{"name": "lookup", "description": "Look up a synthetic record.", "input_schema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}}],
        "system": [text_block(policy + "\n" + system_reference, True)],
        "messages": [{"role": "user", "content": [text_block(records_a, True), text_block(records_b, True), text_block("Return the requested JSON.")]}],
    }


def cases(run, replicate):
    base = baseline(run, replicate)
    early = copy.deepcopy(base)
    early["system"][0]["text"] = early["system"][0]["text"].replace("Currency policy: USD.", "Currency policy: EUR.")
    middle = copy.deepcopy(base)
    middle["messages"][0]["content"][1]["text"] = middle["messages"][0]["content"][1]["text"].replace("VALUE-137", "REVISED-137")
    appended = copy.deepcopy(base)
    appended["messages"].append({"role": "system", "content": [text_block("From this point onward, override the earlier currency policy: use EUR. All other instructions remain in effect.")]})
    inline = copy.deepcopy(base)
    inline["messages"].append({"role": "system", "content": [{"type": "tool_addition", "tool": {"type": "tool_definition", "definition": {"name": "lookup_extra", "description": "Look up an additional synthetic record.", "input_schema": {"type": "object", "properties": {}, "additionalProperties": False}}}}]})
    return [
        ("baseline", base, "USD", "VALUE-137", None),
        ("warm_repeat", copy.deepcopy(base), "USD", "VALUE-137", None),
        ("early_edit", early, "EUR", "VALUE-137", None),
        ("early_edit_repeat", copy.deepcopy(early), "EUR", "VALUE-137", None),
        ("old_branch_revisit", copy.deepcopy(base), "USD", "VALUE-137", None),
        ("middle_edit", middle, "USD", "REVISED-137", None),
        ("middle_edit_repeat", copy.deepcopy(middle), "USD", "REVISED-137", None),
        ("appended_system", appended, "EUR", "VALUE-137", None),
        ("inline_tool_addition", inline, "USD", "VALUE-137", "inline-tools-2026-09-15"),
    ]


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


def estimated_cost(usage):
    creation = usage.get("cache_creation", {})
    long_writes = creation.get("ephemeral_1h_input_tokens", 0)
    writes = usage.get("cache_creation_input_tokens", 0)
    return (usage.get("input_tokens", 0) * PRICES["input"] + (writes - long_writes) * PRICES["write_5m"] + long_writes * PRICES["write_1h"] + usage.get("cache_read_input_tokens", 0) * PRICES["read"] + usage.get("output_tokens", 0) * PRICES["output"]) / 1_000_000


def invoke(payload, headers):
    started = time.perf_counter()
    usage, output, events = {}, "", []
    first_text = None
    stop_reason = None
    actual_model = None
    complete = False
    request = urllib.request.Request("https://api.anthropic.com/v1/messages", data=json.dumps(payload).encode(), headers=headers)
    with urllib.request.urlopen(request, timeout=120) as response:
        for raw_line in response:
            line = raw_line.decode().strip()
            if not line.startswith("data: "):
                continue
            event = json.loads(line[6:])
            events.append(event)
            if event.get("type") == "error":
                raise RuntimeError("Stream returned an error; stop and inspect private evidence")
            if event.get("type") == "message_start":
                usage.update(event.get("message", {}).get("usage", {}))
                actual_model = event.get("message", {}).get("model")
            if event.get("type") == "message_stop":
                complete = True
            if event.get("type") == "message_delta":
                usage.update(event.get("usage", {}))
                stop_reason = event.get("delta", {}).get("stop_reason")
            delta = event.get("delta", {})
            if delta.get("type") == "text_delta":
                if first_text is None:
                    first_text = time.perf_counter() - started
                output += delta.get("text", "")
    if not complete or actual_model != MODEL:
        raise RuntimeError("Incomplete stream or unexpected model; stop and inspect")
    return usage, output, events, first_text, time.perf_counter() - started, stop_reason


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--private-dir", type=Path)
    parser.add_argument("--replicates", type=int, default=3, choices=range(1, 4))
    parser.add_argument("--budget-usd", type=float, default=5.0)
    args = parser.parse_args()
    if not 0 < args.budget_usd <= 10:
        raise SystemExit("Budget must be >0 and <=10 USD")
    run = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    plan = [(replicate, *case) for replicate in range(args.replicates) for case in cases(run, replicate)]
    # Reserve every visible JSON byte as an input token, plus a generous hidden-token
    # allowance. This is a conservative planning allowance, not a provider tokenizer.
    reserve = sum((len(json.dumps(payload).encode()) + 20_000) * PRICES["write_1h"] / 1_000_000 + MAX_OUTPUT * PRICES["output"] / 1_000_000 for _, _, payload, _, _, _ in plan)
    if reserve > args.budget_usd:
        raise SystemExit(f"Plan reserve ${reserve:.4f} exceeds budget; reduce replicates")
    if not args.execute:
        print(json.dumps({"mode": "dry-run", "model": MODEL, "requests": len(plan), "conservative_plan_reserve_usd": reserve, "cases": [name for _, name, *_ in plan], "no_credentials_read": True}, indent=2))
        return
    if args.private_dir is None:
        raise SystemExit("--private-dir outside Git is required for live evidence")
    if args.private_dir.exists():
        raise SystemExit("Choose a fresh private directory; never overwrite an earlier receipt")
    headers = credentials(args.env)
    args.private_dir.mkdir(parents=True, mode=0o700)
    results, spent = [], 0.0
    for replicate, name, payload, currency, code, beta in plan:
        call_headers = dict(headers)
        if beta:
            call_headers["anthropic-beta"] = beta
        stamp = datetime.now(timezone.utc).isoformat()
        try:
            usage, output, events, first_text, elapsed, stop_reason = invoke(payload, call_headers)
        except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError) as error:
            status = error.code if isinstance(error, urllib.error.HTTPError) else "transport-or-stream"
            print(json.dumps({"case": name, "status": status, "stopped": True, "estimated_recorded_cost_usd": spent, "error_body_withheld": True}))
            raise SystemExit(1) from None
        cost = estimated_cost(usage)
        spent += cost
        try:
            answer = json.loads(output.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            answer = {}
        row = {"replicate": replicate, "case": name, "at_utc": stamp, "model": MODEL, "usage": usage, "first_text_seconds": first_text, "elapsed_seconds": elapsed, "stop_reason": stop_reason, "expected": {"currency": currency, "code": code}, "answer": answer, "correct": answer.get("currency") == currency and answer.get("code") == code, "estimated_cost_usd": cost, "request_sha256": hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()}
        results.append(row)
        (args.private_dir / f"{replicate}-{name}.json").write_text(json.dumps({"request": payload, "events": events, "text": output}, indent=2) + "\n")
        (args.private_dir / "results.json").write_text(json.dumps({"run": run, "prices_per_million": PRICES, "conservative_plan_reserve_usd": reserve, "estimated_total_usd": spent, "rows": results}, indent=2) + "\n")
        print(json.dumps(row), flush=True)
        if spent > args.budget_usd:
            raise SystemExit("Cost exceeded reserve assumptions; stopping immediately")


if __name__ == "__main__":
    main()

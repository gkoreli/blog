"""Compare a weight increase with reordering the weights in released flagd.

Usage in a disposable Linux guest: python3 cohort_trial.py FLAGD_BINARY FRESH_OUTPUT
The daemon runs in the guest. All test requests use loopback and invented identities.
"""
from hashlib import file_digest
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, ProxyHandler


PHASES = {
    "ten_first": [["new", 10], ["old", 90]],
    "quarter_first": [["new", 25], ["old", 75]],
    "quarter_last": [["old", 75], ["new", 25]],
}


def main():
    binary, output = (Path(arg).resolve() for arg in sys.argv[1:])
    output.mkdir(mode=0o700)
    flags = output / "flags.json"
    identities = [f"fixture-{index:03}" for index in range(128)]
    with binary.open("rb") as executable:
        binary_sha256 = file_digest(executable, "sha256").hexdigest()
    report = {"binary_sha256": binary_sha256, "synthetic_identities": len(identities),
              "phases": PHASES, "observations": {}}
    sockets = [socket.socket() for _ in range(4)]
    try:
        for handle in sockets:
            handle.bind(("127.0.0.1", 0))
        rpc, management, sync, ofrep = [handle.getsockname()[1] for handle in sockets]
    finally:
        for handle in sockets:
            handle.close()
    opener = build_opener(ProxyHandler({}))
    service = f"http://127.0.0.1:{rpc}/flagd.evaluation.v2.Service/ResolveString"

    def resolve(key, targeting_key=None):
        context = {} if targeting_key is None else {"targetingKey": targeting_key}
        request = Request(service, data=json.dumps({"flagKey": key, "context": context}).encode(),
                          headers={"Content-Type": "application/json"})
        with opener.open(request, timeout=2) as response:
            return json.load(response)

    def activate(phase):
        marker = {"state": "ENABLED", "variants": {phase: phase}, "defaultVariant": phase}
        flag = {"state": "ENABLED", "variants": {"old": "old", "new": "new"},
                "defaultVariant": "old", "targeting": {"fractional": PHASES[phase]}}
        pending = output / "flags.next"
        pending.write_text(json.dumps({"flags": {"rollout": flag, "phase": marker}}))
        pending.replace(flags)

    def wait_for_phase(phase):
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            try:
                if resolve("phase").get("value") == phase:
                    return
            except (OSError, URLError):
                pass
            time.sleep(0.15)
        raise RuntimeError(f"Daemon did not activate {phase}")

    def selected():
        values = {identity: resolve("rollout", identity)["value"] for identity in identities}
        assert set(values.values()) == {"old", "new"}, values
        return {identity for identity, value in values.items() if value == "new"}

    activate("ten_first")
    with (output / "daemon.log").open("wb") as log:
        process = subprocess.Popen([str(binary), "start", "--uri", f"file:{flags}",
                                    "--port", str(rpc), "--management-port", str(management),
                                    "--sync-port", str(sync), "--ofrep-port", str(ofrep)],
                                   cwd=output, stdout=log, stderr=log,
                                   env={"HOME": os.environ["HOME"], "PATH": "/usr/bin:/bin",
                                        "NO_PROXY": "127.0.0.1,localhost"})
        try:
            wait_for_phase("ten_first")
            small = selected()
            assert selected() == small, "unchanged assignment should repeat exactly"

            activate("quarter_first")
            wait_for_phase("quarter_first")
            larger = selected()
            assert small < larger, "a wider first interval should retain the initial members"

            activate("quarter_last")
            wait_for_phase("quarter_last")
            reordered = selected()
            assert larger != reordered, "same weights in a different order should reach other IDs"
            try:
                missing_key = resolve("rollout")
            except HTTPError as error:
                missing_key = {"http_status": error.code}
            report["observations"] = {
                "unchanged_repeat_matches": True,
                "enabled_memberships": {
                    "ten_first": sorted(small), "quarter_first": sorted(larger),
                    "quarter_last": sorted(reordered),
                },
                "enabled_counts": [len(small), len(larger), len(reordered)],
                "expanded_retained": len(small & larger),
                "reorder_retained": len(larger & reordered),
                "reorder_changed": len(larger ^ reordered),
                "missing_targeting_key": missing_key,
            }
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=8)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
            report["daemon_exit_status"] = process.returncode
            receipt = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
            (output / "results.json").write_text(receipt)
            print(receipt, end="")


if __name__ == "__main__":
    main()

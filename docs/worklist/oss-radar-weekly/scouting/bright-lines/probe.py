"""Exercise the pinned hook as a process; never execute its proposed tool command."""
import fcntl
import hashlib
import json
import os
import platform
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

PIN = "84cfe3912b1c15dd1caf8a46bcbaab5d98b5a2a3"
if len(sys.argv) != 3:
    raise SystemExit("Usage: python3 probe.py /pinned-bright-lines /fresh-receipt.json")
repo = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
assert subprocess.check_output(["git", "-C", str(repo), "rev-parse", "HEAD"], text=True).strip() == PIN
settings_file = repo / "template/.claude/settings.json"
settings = json.loads(settings_file.read_text())
hook = settings["hooks"]["PreToolUse"][0]["hooks"][0]
assert hook["timeout"] == 10
assert "onFailure" not in hook
rows = []

with tempfile.TemporaryDirectory(prefix="oss-bright-lines-probe-") as directory:
    scratch = Path(directory)
    state = scratch / "state"
    state.mkdir()
    environment = dict(os.environ, BRIGHT_LINES_STATE_DIR=str(state),
                       BRIGHT_LINES_STOP_FILE=str(scratch / "STOP"),
                       CLAUDE_PROJECT_DIR=str(repo / "template"))

    def invoke(name, data, session, project=None):
        # Only the reviewed guard wrapper runs. The tool command stays in JSON stdin.
        payload = data if isinstance(data, str) else json.dumps({
            "session_id": session, "cwd": str(repo / "template"),
            "permission_mode": "default", "tool_name": "Bash",
            "tool_input": {"command": data["command"]},
        })
        child_env = dict(environment)
        if project is not None:
            child_env["CLAUDE_PROJECT_DIR"] = str(project)
        start = time.monotonic()
        process = subprocess.Popen(["/bin/sh", "-c", hook["command"]],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, env=child_env, start_new_session=True)
        timed_out = False
        try:
            stdout, stderr = process.communicate(payload, timeout=hook["timeout"])
        except subprocess.TimeoutExpired:
            timed_out = True
            os.killpg(process.pid, signal.SIGKILL)  # only this probe's new process group
            stdout, stderr = process.communicate()
        rows.append({"case": name, "timedOutAtConfiguredDeadline": timed_out,
            "elapsedSeconds": time.monotonic() - start,
            "exitCode": None if timed_out else process.returncode,
            "blockMessage": "BLOCKED" in stderr,
            "stdoutEmpty": stdout == "",
            "proposedCommandExecuted": False})
        return rows[-1]

    assert invoke("ordinary-command-payload", {"command": "git status"}, "ordinary")["exitCode"] == 0
    blocked = {"command": "curl https://example.invalid/"}
    assert invoke("network-command-payload", blocked, "network")["exitCode"] == 2
    assert invoke("invalid-json", "not-json{", "invalid")["exitCode"] == 2
    broken = scratch / "broken"
    (broken / ".claude/safe").mkdir(parents=True)
    (broken / ".claude/safe/guard.py").write_text("raise SystemExit(1)\n")
    assert invoke("guard-exits-one", blocked, "crash", broken)["exitCode"] == 2

    # The guard acquires this advisory lock before checking the proposed command.
    # Hold our own scratch lock beyond the deadline, then clean up our child group.
    with (state / "lock-stall.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        row = invoke("counter-lock-held", blocked, "lock-stall")
        assert row["timedOutAtConfiguredDeadline"] is True
        assert row["blockMessage"] is False
        fcntl.flock(lock, fcntl.LOCK_UN)
    assert invoke("counter-lock-released", blocked, "lock-stall")["exitCode"] == 2

files = ["template/.claude/settings.json", "template/.claude/safe/guard.py", "template/.claude/safe/guard_config.json"]
receipt = {"sourceCommit": PIN, "python": platform.python_version(), "platform": sys.platform,
    "sourceSha256": {name: hashlib.sha256((repo / name).read_bytes()).hexdigest() for name in files},
    "hookTimeoutSeconds": hook["timeout"], "hostFailurePolicyFieldPresent": "onFailure" in hook,
    "cases": rows, "actualClaudeToolCallRun": False, "modelProviderCalls": 0,
    "userConfigurationChanged": False,
    "scope": "Direct hook-process and wrapper controls. Host timeout/permission behavior is documented separately; not reproduced here."}
with output.open("x") as destination:
    destination.write(json.dumps(receipt, indent=2) + "\n")
print(json.dumps({"cases": len(rows), "timeoutReproduced": rows[4]["timedOutAtConfiguredDeadline"],
                  "hostBehaviorReproduced": False, "receipt": str(output)}))

"""Compare model-led choice with preloading a saved skill in the released chat CLI.

Use the locked Hermes Python environment and a verified local Ollama model store.
Arguments: HERMES_SOURCE OLLAMA_BINARY MODEL_STORE FRESH_OUTPUT
Keep FRESH_OUTPUT short enough for the gateway's Unix socket on macOS.
"""

import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import sys
import time
from urllib.request import ProxyHandler, build_opener


def main():
    source, binary, models, output = map(lambda arg: Path(arg).resolve(), sys.argv[1:])
    output.mkdir(mode=0o700)
    profile = output / "profile"
    profile.mkdir()
    temp = output / "tmp"
    temp.mkdir()
    project = output / "project"
    project.mkdir()
    seed = output / "seed.py"
    shutil.copyfile(Path(__file__).with_name("skill_reuse_trial.py"), seed)
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        address = f"127.0.0.1:{listener.getsockname()[1]}"
    account = os.environ["HOME"]
    sandbox = output / "runtime.sb"
    owned = json.dumps(str(output))
    sandbox.write_text(f"""(version 1)
(allow default)
(deny file-write*)
(allow file-write* (subpath {owned}) (literal "/dev/null"))
(deny file-read-data (subpath {json.dumps(account)}))
(deny network*)
(allow network-bind (local ip "localhost:*"))
(allow network-inbound (local ip "localhost:*"))
(allow network-outbound (remote ip "localhost:*"))
(allow network-bind (local unix-socket (subpath {owned})))
(allow network-inbound (local unix-socket (subpath {owned})))
(allow network-outbound (remote unix-socket (subpath {owned})))
""")
    launch = ["/usr/bin/sandbox-exec", "-f", str(sandbox)]
    model = "qwen3.5:4b"
    (profile / "config.yaml").write_text(f"""model:
  default: "{model}"
  provider: custom
  base_url: "http://{address}/v1"
  context_length: 65536
  ollama_num_ctx: 65536
platform_toolsets:
  cli: [skills]
agent:
  reasoning_effort: none
gateway:
  unmanaged_idle_exit_seconds: 20
auxiliary:
  background_review:
    enabled: false
memory:
  memory_enabled: false
  user_profile_enabled: false
""")
    local_env = {
        "HOME": account, "PATH": "/opt/homebrew/bin:/usr/bin:/bin", "TMPDIR": str(temp),
        "PYTHONDONTWRITEBYTECODE": "1", "HERMES_HOME": str(profile), "PYTHONPATH": str(source),
        "NO_PROXY": "127.0.0.1,localhost",
    }
    subprocess.run(launch + [sys.executable, str(seed), "tool", str(source), str(profile), "create"],
                   cwd=project, env=local_env, check=True, timeout=30, capture_output=True)
    ollama_env = {
        **local_env, "OLLAMA_HOST": address, "OLLAMA_MODELS": str(models), "OLLAMA_NO_CLOUD": "1",
        "OLLAMA_NOPRUNE": "1", "OLLAMA_NUM_PARALLEL": "1", "OLLAMA_CONTEXT_LENGTH": "65536",
        "OLLAMA_FLASH_ATTENTION": "1", "OLLAMA_KV_CACHE_TYPE": "q8_0",
    }
    opener = build_opener(ProxyHandler({}))
    synthetic_task = "Return the yard dispatch line for this workshop record: coil, rack D4, count 7, routine priority."
    expected = "RIVET/D4/007/mz2/coil"
    manifest = models / "manifests/registry.ollama.ai/library/qwen3.5/4b"
    report = {
        "source_commit": "ae2a81ccc00e9b7c06301523e5bb09608397149c",
        "source_lock_sha256": hashlib.sha256((source / "uv.lock").read_bytes()).hexdigest(),
        "model": model, "context_requested": 65536, "python": sys.version.split()[0],
        "model_manifest_sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
        "input": synthetic_task, "expected": expected, "cases": [],
    }
    with (output / "ollama.log").open("wb") as log:
        server = subprocess.Popen(launch + [str(binary), "serve"], cwd=project, env=ollama_env,
                                  stdout=log, stderr=log, start_new_session=True)
        try:
            for _ in range(100):
                if server.poll() is not None:
                    raise RuntimeError("Owned Ollama exited during setup")
                try:
                    with opener.open(f"http://{address}/api/version", timeout=1) as response:
                        report["ollama"] = json.load(response)["version"]
                    break
                except OSError:
                    time.sleep(0.15)
            else:
                raise RuntimeError("Owned Ollama did not respond")

            for condition, extra in [("catalog_available", []),
                                     ("explicit_preload", ["--skills", "yard-dispatch-format"])]:
                command = launch + [sys.executable, "-m", "hermes_cli.main", "chat", "--toolsets", "skills",
                                    "--max-turns", "8", "--format", "stream-json", "--query", synthetic_task, *extra]
                stream = output / (condition + ".jsonl")
                with stream.open("wb") as stdout, (output / (condition + ".stderr")).open("wb") as stderr:
                    try:
                        run = subprocess.run(command, cwd=project, env=local_env, stdout=stdout, stderr=stderr,
                                             timeout=150)
                        status = run.returncode
                    except subprocess.TimeoutExpired:
                        status = "timeout"
                events = [json.loads(line) for line in stream.read_text().splitlines() if line.startswith("{")]
                final = next((event for event in reversed(events) if event.get("type") == "result"), {})
                answer = final.get("text", "").strip()
                calls = [event["name"] for event in events if event.get("type") == "tool_use"]
                row = {"condition": condition, "status": status, "actual": answer,
                       "exact_match": answer == expected, "tool_calls": calls, "result_seen": bool(final)}
                report["cases"].append(row)
                (output / "results.json").write_text(json.dumps(report, indent=2) + "\n")
                print(json.dumps(row), flush=True)
        finally:
            if server.poll() is None:
                os.killpg(server.pid, signal.SIGTERM)
                try:
                    server.wait(timeout=8)
                except subprocess.TimeoutExpired:
                    os.killpg(server.pid, signal.SIGKILL)
                    server.wait(timeout=5)


if __name__ == "__main__":
    main()

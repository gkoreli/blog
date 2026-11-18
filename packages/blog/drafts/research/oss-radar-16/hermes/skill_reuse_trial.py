"""Exercise the released skill tools and compare matched local model calls.

Pass UPSTREAM_SOURCE FRESH_OUTPUT OLLAMA_BINARY OWNED_OLLAMA_MODELS.
The test writes an authored skill, reopens it in a fresh Python process, then
compares full instructions to controls using an existing local model.
"""

import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import urllib.request


NAME = "yard-dispatch-format"
DESCRIPTION = "Format yard dispatch records by the workshop convention."
SKILL = f"""---
name: {NAME}
description: {DESCRIPTION}
---
# Yard dispatch

For a yard dispatch record, print exactly one line with this format:
RIVET/<rack>/<count padded with zeros to width 3>/<priority code>/<job>
Use mz2 for routine and vt7 for urgent. Keep rack and job unchanged.
Do not add prose or markup.
"""
MODEL = "qwen3.5:4b"
INPUTS = [
    ({"job": "coil", "count": 7, "rack": "D4", "priority": "routine"},
     "RIVET/D4/007/mz2/coil"),
    ({"job": "flange", "count": 28, "rack": "B9", "priority": "urgent"},
     "RIVET/B9/028/vt7/flange"),
]


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def tool_action(source, profile, action):
    os.environ["HERMES_HOME"] = str(profile)
    sys.path.insert(0, str(source))
    from tools.skill_manager_tool import skill_manage
    from tools.skills_tool import skill_view, skills_list

    if action in ("create", "patch"):
        if action == "create":
            result = json.loads(skill_manage("create", NAME, content=SKILL))
        else:
            result = json.loads(skill_manage("patch", NAME, old_string="mz2", new_string="bp4"))
        assert result.get("success"), result
        return {"operation": action, "success": True}

    catalog = json.loads(skills_list())
    assert catalog.get("success"), catalog
    entry = next(item for item in catalog["skills"] if item["name"] == NAME)
    assert entry["description"] == DESCRIPTION
    assert "content" not in entry and "mz2" not in json.dumps(entry)
    viewed = json.loads(skill_view(NAME, preprocess=False))
    assert viewed.get("success"), viewed
    assert viewed["content"] == (profile / "skills" / NAME / "SKILL.md").read_text()
    return {"catalog_entry": entry, "content": viewed["content"]}


def local_trial(source, output, engine, models):
    output.mkdir(mode=0o700)
    profile = output / "profile"
    profile.mkdir(mode=0o700)
    # Restrict subprocess environments to the account path and local tooling.
    env = {k: os.environ[k] for k in ("HOME", "PATH") if k in os.environ}
    env["PYTHONDONTWRITEBYTECODE"] = "1"

    def skill(action):
        return json.loads(subprocess.check_output(
            [sys.executable, __file__, "tool", str(source), str(profile), action],
            env=env, cwd=output, text=True, timeout=25))

    created = skill("create")
    first_read = skill("read")
    assert first_read["content"].rstrip() == SKILL.rstrip()
    patched = skill("patch")
    second_read = skill("read")
    assert second_read["content"] == first_read["content"].replace("mz2", "bp4")
    evidence = {"source_commit": "ae2a81ccc00e9b7c06301523e5bb09608397149c",
                "python": sys.version.split()[0], "created": created, "patched": patched,
                "catalog_entry": first_read["catalog_entry"],
                "first_content_sha256": hashlib.sha256(first_read["content"].encode()).hexdigest(),
                "patched_content_sha256": hashlib.sha256(second_read["content"].encode()).hexdigest(),
                "model": MODEL, "cases": []}
    write_json(output / "progress.json", evidence)

    with socket.socket() as port:
        port.bind(("127.0.0.1", 0))
        addr = f"127.0.0.1:{port.getsockname()[1]}"
    policy = output / "ollama.sb"
    policy.write_text(f"""(version 1)
(allow default)
(deny file-write*)
(allow file-write* (subpath {json.dumps(str(output))}) (literal "/dev/null"))
(deny network*)
(allow network-bind (local ip "localhost:*"))
(allow network-inbound (local ip "localhost:*"))
(allow network-outbound (remote ip "localhost:*"))
""")
    env |= {"OLLAMA_HOST": addr, "OLLAMA_MODELS": str(models), "OLLAMA_NO_CLOUD": "1",
            "OLLAMA_NOPRUNE": "1", "OLLAMA_NUM_PARALLEL": "1", "TMPDIR": str(output)}
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    def request(path, body=None, timeout=90):
        req = urllib.request.Request(f"http://{addr}/api/{path}",
                                     data=json.dumps(body).encode() if body is not None else None,
                                     headers={"Content-Type": "application/json"})
        with opener.open(req, timeout=timeout) as response:
            return json.load(response)

    with (output / "ollama.log").open("wb") as log:
        proc = subprocess.Popen(
            ["/usr/bin/sandbox-exec", "-f", str(policy), str(engine), "serve"],
            cwd=output, env=env, stdout=log, stderr=log, start_new_session=True)
        try:
            for _ in range(100):
                if proc.poll() is not None:
                    raise RuntimeError("Owned Ollama server exited. See its local log.")
                try:
                    evidence["ollama"] = request("version", timeout=1)["version"]
                    break
                except OSError:
                    time.sleep(0.15)
            else:
                raise RuntimeError("Owned Ollama server never became ready.")
            assert [item["name"] for item in request("tags")["models"]] == [MODEL]
            for index, (fields, expected) in enumerate(INPUTS):
                conditions = [("no_skill", ""), ("catalog_only", DESCRIPTION),
                              ("loaded_skill", first_read["content"])]
                if index == 0:
                    conditions.append(("patched_skill", second_read["content"]))
                for label, instructions in conditions:
                    system = "Answer with a single line. " + instructions
                    user = "Return the yard dispatch line for this record. " + json.dumps(fields)
                    want = expected.replace("mz2", "bp4") if label == "patched_skill" else expected
                    result = request("chat", {
                        "model": MODEL, "stream": False, "think": False, "keep_alive": "2m",
                        "messages": [{"role": "system", "content": system},
                                     {"role": "user", "content": user}],
                        "options": {"temperature": 0, "seed": 16, "num_ctx": 2048, "num_predict": 96},
                    })
                    actual = result["message"]["content"].strip()
                    evidence["cases"].append({"condition": label, "input": fields,
                                              "expected": want, "actual": actual,
                                              "match": actual == want})
                    write_json(output / "progress.json", evidence)
        finally:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
    write_json(output / "results.json", evidence)
    print(json.dumps({"matches": {label: [c["match"] for c in evidence["cases"]
                                           if c["condition"] == label]
                                  for label in ("no_skill", "catalog_only", "loaded_skill", "patched_skill")}}))


if __name__ == "__main__":
    if sys.argv[1] == "tool":
        print(json.dumps(tool_action(Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4])))
    else:
        local_trial(*(Path(value).resolve() for value in sys.argv[1:]))

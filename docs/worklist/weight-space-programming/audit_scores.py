"""Audit published score arithmetic without running models or upstream code.

python3 audit_scores.py /path/to/lm_understand-logs > score-audit.json
Only reads public JSON artifacts; correctness labels remain the authors' labels.
"""

import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys


def audit(root):
    revision = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True
    ).strip()
    evidence = {}

    def read(path):
        data = path.read_bytes()
        evidence[str(path.relative_to(root))] = hashlib.sha256(data).hexdigest()
        return json.loads(data)

    experiment = root / "exp8_math"
    results = {}
    problem_ids = None
    for name in ("unedited", "p10c", "p25c", "p50c"):
        folder = experiment / "eval" / name
        scores = []
        labels = {}
        shards = set()
        for path in sorted((folder / "parts").glob("*/scores.json")):
            part = read(path)
            if "math500" not in part:
                continue
            score = part["math500"]
            shard = score.get("shard")
            assert shard not in shards, (name, "duplicate shard", shard)
            shards.add(shard)
            rows = read(path.parent / "math500_per_problem.json")
            assert len(rows) == score["n_problems"]
            correct = total = 0
            for row in rows:
                assert row["id"] not in labels, (name, "duplicate problem")
                labels[row["id"]] = row["correct"]
                assert len(row["correct"]) == score["samples"] == 4
                assert all(value in (0, 1) for value in row["correct"])
                correct += sum(row["correct"])
                total += len(row["correct"])
            assert (correct, total) == (score["ok"], score["total"])
            scores.append(score)
        assert len(labels) == 500
        if problem_ids is None:
            problem_ids = set(labels)
        assert set(labels) == problem_ids
        total = sum(s["total"] for s in scores)
        correct = sum(s["ok"] for s in scores)
        cut = sum(s["cut"] for s in scores)
        tokens = sum(s["tokens_sum"] for s in scores)
        merged = read(folder / "merged.json")["math500"]
        for key, value in (("acc", correct / total), ("cut_share", cut / total),
                           ("mean_tokens", tokens / total)):
            assert math.isclose(merged[key], value, abs_tol=1e-12)
        assert merged["complete"] and merged["problems"] == 500
        results[name] = {"problems": len(labels), "generations": total,
                         "correct": correct, "accuracy": correct / total,
                         "at_token_limit": cut, "cut_share": cut / total,
                         "mean_tokens": tokens / total}
    manifest = read(experiment / "runs/p50c/edit/manifest.json")
    changed = sum(t["changed_entries"] for t in manifest["tensors"])
    assert changed == manifest["changed_entries_total"] == 130188
    state = read(experiment / "runs/p50c/state.json")
    return {"source": "https://github.com/RikiyaT/lm_understand-logs",
            "branch": "main", "revision": revision,
            "method": "Independent aggregation of published labels and score shards; no inference or regrading.",
            "math500": results,
            "p50c": {"turns": state["turn"], "python_runs": state["runs"],
                      "passes": state["passes"], "changed_bf16_entries": changed,
                      "touched_entries": 2 * 64 * 1024},
            "input_sha256": evidence}


if __name__ == "__main__":
    print(json.dumps(audit(Path(sys.argv[1]).resolve()), indent=2))

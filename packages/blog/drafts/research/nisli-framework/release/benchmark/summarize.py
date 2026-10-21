"""Pool the two saved runs without discarding samples (Python standard library)."""

import json
from pathlib import Path
from statistics import median

root = Path(__file__).resolve().parent.parent
runs = [json.loads((root / f"results-run-{i}.json").read_text()) for i in (1, 2)]
assert runs[0]["metadata"]["source"] == runs[1]["metadata"]["source"]
assert all(run["metadata"]["rounds"] == 15 for run in runs)
summary = {
    "method": "Pooled median of all 30 samples per case across two fresh page loads; three warmups and fifteen measured rounds per load. One Chrome host; no paint or application-performance claim.",
    "source": runs[0]["metadata"]["source"],
    "runs": [run["metadata"]["capturedAt"] for run in runs],
}
groups = {
    "updates": (["name"], ["mountMs", "updateMs"]),
    "mounts": (["name", "shape"], ["signalsMs", "templateCreationMs", "remainderMs", "mountMs"]),
    "synchronous": (["name"], ["effectMs", "templateMs"]),
    "microtasks": (["name"], ["milliseconds"]),
    "cacheMisses": (["name", "templates"], ["milliseconds"]),
}
for group, (keys, metrics) in groups.items():
    summary[group] = []
    for item in runs[0][group]:
        identity = {key: item[key] for key in keys}
        matches = [next(row for row in run[group] if all(row[key] == value for key, value in identity.items())) for run in runs]
        pooled = dict(identity)
        for metric in metrics:
            samples = [value for match in matches for value in match[metric]]
            assert len(samples) == 30
            pooled[metric] = median(samples)
        summary[group].append(pooled)
summary["controlMs"] = median([value for run in runs for value in run["controls"]])
(root / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
print(json.dumps(summary, indent=2))

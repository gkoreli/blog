"""Exercise only Ragas's inspected standard-library quote-matching functions.

No package installation, evaluator model, service request, or RAG pipeline runs.
"""

import argparse
import datetime
import importlib.util
import json
import platform
import subprocess
from pathlib import Path


BASELINE = "298b68274234c060deacab3cf5fb52aa3a20e885"


def load_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkout", type=Path, required=True)
    args = parser.parse_args()
    sha = subprocess.check_output(
        ["git", "-C", str(args.checkout), "rev-parse", "HEAD"], text=True
    ).strip()
    if sha != BASELINE:
        raise ValueError(f"Expected {BASELINE}; received {sha}")

    modern = load_file(
        "ragas_quote_util",
        args.checkout / "src/ragas/metrics/collections/quoted_spans/util.py",
    )
    legacy = load_file(
        "ragas_quote_standalone", args.checkout / "src/ragas/metrics/quoted_spans.py"
    )
    cases = [
        {
            "id": "correct-marker",
            "answer": 'The count was "95 Browser HTML observations" [1].',
            "sources": ["95 Browser HTML observations", "14 script page loads"],
            "expected_counts": [1, 1],
        },
        {
            "id": "wrong-marker",
            "answer": 'The count was "95 Browser HTML observations" [2].',
            "sources": ["95 Browser HTML observations", "14 script page loads"],
            "expected_counts": [1, 1],
        },
        {
            "id": "quote-assembled-across-passages",
            "answer": 'The text was "the result is supported" [1].',
            "sources": ["the result", "is supported"],
            "expected_counts": [1, 1],
        },
        {
            "id": "changed-number",
            "answer": 'The count was "96 Browser HTML observations" [1].',
            "sources": ["95 Browser HTML observations", "14 script page loads"],
            "expected_counts": [0, 1],
        },
        {
            "id": "no-quotation",
            "answer": "The count was 999 observations [1].",
            "sources": ["95 Browser HTML observations"],
            "expected_counts": [0, 0],
        },
    ]
    for case in cases:
        spans = modern.extract_quoted_spans(case["answer"])
        counts = list(modern.count_matched_spans(spans, case["sources"]))
        if counts != case["expected_counts"]:
            raise AssertionError({"case": case["id"], "actual_counts": counts})
        case["extracted_spans"] = spans
        case["modern_helper_counts"] = counts
        case["standalone_function_result"] = legacy.quoted_spans_alignment(
            [case["answer"]], [case["sources"]]
        )

    print(json.dumps({
        "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "python": platform.python_version(),
        "repository": "https://github.com/vibrantlabsai/ragas",
        "baseline": sha,
        "scope": "Five deterministic quote-matching cases; no LLM judge or full metric class executed.",
        "cases": cases,
    }, indent=2))


if __name__ == "__main__":
    main()

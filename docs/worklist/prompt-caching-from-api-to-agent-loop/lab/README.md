# Reproductions

These exercises establish different things. Run them separately and preserve that distinction.

## Numerical dependency lab

```sh
python3 kv_dependency.py
```

No dependencies or network. A deterministic untrained three-layer transformer shows valid prefix reuse, stale suffix transplantation, append-only reuse, and returning to an old branch. [Recorded output](kv-results.json). The independent review also exercised first/middle replacements, insertion, deletion, truncation, and append. Exact zero follows from identical arithmetic order in this implementation; it is not a claim about GPU parallel-prefill bitwise invariance. Logit divergence is not a measured hallucination rate.

## Actual Pi transcript transformation

```sh
node pi-transcript.mjs /path/to/pinned/pi
```

Requires Node 24.14.1 and Pi commit `cb7969d212836b8939001dce159fbd2ed6ad395f`. The fixture verifies the SHA and unmodified imported source files. It executes upstream `resolveTranscript` and rendering functions directly using Node's native TypeScript stripping; no package installation. [Recorded output](pi-transcript-results.json).

Supported mid-conversation messages preserve the initial prefix; unsupported/unspecified capability collapses the new instruction into the head. Equal replayed current system text does not establish equivalent model behavior. No provider request runs.

## Actual SDK serialization

Create an isolated scratch directory outside the blog repository. Copy `sdk-package.json` there as `package.json`, `sdk-pnpm-lock.yaml` as `pnpm-lock.yaml`, and `sdk-wire.mjs`. From that directory:

```sh
pnpm install --frozen-lockfile --ignore-scripts
node sdk-wire.mjs
```

The package file pins pnpm 9.15.4, Node 24.14.1, and both tested provider packages. Installation accesses the package registry; execution mocks every fetch, uses synthetic credentials, and never calls an inference API. [Recorded output](sdk-results.json).

The fixture checks explicit OpenAI marker/TTL translation, a schema-limited diagnostics option, and Anthropic mid-conversation system/tool-removal serialization. The synthetic tool removal is not a complete provider-valid tool lifecycle. This tests outbound shape, not acceptance, hits, or cost. Source and installed npm versions are recorded separately in [the SDK audit](../research/04-openai-sdk-codex.md).

## Paid Anthropic experiment

Dry-run from the repository root:

```sh
python3 -B docs/worklist/prompt-caching-from-api-to-agent-loop/lab/anthropic-cache-probe.py
```

The completed run has [sanitized results](anthropic-results.json) and [full methods and limits](../research/05-live-anthropic-experiment.md). There is no reason to spend more merely to regenerate existing evidence. To intentionally run a new authorized sample, add `--execute --env /private/path/.env --private-dir /private/path/new-run --replicates 3 --budget-usd 5`. The directory must not exist; use a path outside Git. Check current model availability and prices first. The script has no automatic retries; stop on a failed call and inspect before deciding what to do next.

`CLAUDE_API_KEY` (or `ANTHROPIC_API_KEY`) and optionally `ANTHROPIC_WORKSPACE_ID` are the only dotenv fields read. Credentials are never included in outputs. A hard authorization budget still requires tracking all runs; the script enforces its own plan and recorded run cost, not account-wide spend.

## Context pruning and summary projection

```sh
node docs/worklist/prompt-caching-from-api-to-agent-loop/lab/context-harness.mjs /path/to/pinned/pi /path/to/pinned/omp
```

Run from the repository root with Node 24. The fixture checks upstream commits and imported files, executes actual Pi and OMP functions, and verifies retained/removed content and local memo invalidation. The tokenizer estimate is synthetic; no provider call or summary-quality evaluation runs. [Teaching chapter](../research/07-context-management.md), [recorded output](context-results.json).

## Corrected retrieved evidence

```sh
python3 -B docs/worklist/prompt-caching-from-api-to-agent-loop/lab/context-evidence-probe.py
```

This dry-run reads no credentials. The completed eight-request experiment used actual previous assistant content and cost $0.0308808. [Methods and reproduction](../research/09-changing-retrieved-evidence.md) explain the branch order, the already-warm case, and why a larger cache hit was not the cheapest request. [Sanitized results](context-evidence-results.json). Do not rerun the paid experiment merely to review existing evidence.

Return to [the worklist](../README.md).

# Bun AOT in Express and Fastify with SQLite

New November 1 investigation of [Jarred Sumner's Express/SQLite report](https://x.com/jarredsumner/status/2116679973448945762). [Plan and acceptance](00-plan.md), [primary sources](01-source-notes.md). Earlier [application](../validation-2026-10-31/README.md) and [process-pool](../practical-2026-10-31/README.md) measurements keep their original conditions and acceptance.

Research complete: separately guarded [Express](05-express-results.md), [Fastify](06-fastify-results.md), [serializer controls](07-serializer-results.md) and [cold/startup checks](08-cold-startup-results.md) passed. Earlier overlapping passes remain excluded. The accepted captures contain **246 timed windows, 27,977,442 fully checked responses and 180 additional startup-control processes**. [Follow-up draft](09-follow-up-draft.md), [article decision](03-article-brief.md), [delivery status](04-handoff.md).

The historical draft above remains the research cutoff. Goga subsequently authorized [iteration and publication](publication-plan.md). The [final article source](../../../../posts/039-bun-aot-express-fastify-serializers.md) adds a [balanced six-cell policy control](11-policy-matrix-results.md), with 36 more timed windows and 11,200,026 checked responses. Cumulative evidence is **282 timed windows / 39,177,468 checked responses**, plus the separate 180-start readiness control. Build, activation and actual served acceptance are recorded separately in that publication plan.

Check the additional public evidence with `PYTHONDONTWRITEBYTECODE=1 python3 verify-policy-matrix.py`; the original verifier retains its frozen 246-window scope.

## What this tests

Two new applications read the same preseeded, read-only SQLite file through `node:sqlite`. A successful request makes four prepared queries and returns exactly 2,215 JSON bytes: one user, eight orders, an aggregate, settings and padding. The same bearer token is a public fixture string, not a credential. Express runs its JSON parser, a response-header middleware and auth middleware. Fastify has a response schema, generated serialization and no generated input validator. It is a separate framework workload, not an Express-equivalent middleware implementation.

The compiler is `1.4.4-canary.1+3f3a9ff87` on macOS arm64. Dependencies are Express 5.3.0, Fastify 5.12.7 and its fast-json-stringify 7.2.0. The entry points are JavaScript modules, without added TypeScript annotations. Source, dependency, database and executable hashes are retained. The official canary's mutable title differs from the downloaded binary revision; see the source notes.

Python independently computes the full expected response. Health, authenticated success, missing authentication, invalid IDs and missing users are checked before timing. Each measured response must match the status and complete checked bytes. There are no timed writes, remote queries, randomized users, enforced resource quotas or production traffic.

## Run a fresh study

From this directory in a clone of the repository, use Python 3.10+, a C compiler, the pinned Node/pnpm runtime and a Bun executable that supports native AOT. The dependency install has no lifecycle scripts. Use a new directory and do not overlap another benchmark or build.

```sh
export STUDY_DIR="$(pwd)"
export LAB_DIR="$(mktemp -d /tmp/bun-aot-express-rerun-XXXXXX)"
cp "$STUDY_DIR"/*.mjs "$STUDY_DIR/package.json" "$STUDY_DIR/pnpm-lock.yaml" "$LAB_DIR/"
cp "$(git rev-parse --show-toplevel)/.mise.toml" "$LAB_DIR/.mise.toml"
pnpm --dir "$LAB_DIR" install --frozen-lockfile --ignore-scripts
python3 "$STUDY_DIR/make-cases.py" --database "$LAB_DIR/fixture.sqlite"
cp "$STUDY_DIR/cases.json" "$LAB_DIR/cases.json"
python3 "$STUDY_DIR/run-study.py" --work "$LAB_DIR" --bun /absolute/path/to/bun
python3 "$STUDY_DIR/audit-results.py" --work "$LAB_DIR" --out "$LAB_DIR/public-results"
```

The expanded protocol also runs the startup-distribution and standalone serializer checks. On the shared research Mac, `host-guard.py` wraps `full-study.py`, waits for sixty seconds without a high-CPU process from the two known competing study paths, and interrupts only its own process group if one appears. The paths are specific to this research environment; adapt that bounded detector for another host. It does not recognize arbitrary competing loads.

```sh
python3 "$STUDY_DIR/host-guard.py" --receipt "$LAB_DIR/guard-receipt.json" -- \
  python3 "$STUDY_DIR/full-study.py" --work "$LAB_DIR" --bun /absolute/path/to/bun
```

Choose the expanded command **instead of** the earlier `run-study.py` command, with a fresh output directory. An interrupted guard exits 75 and retains the partial captures. Do not publish their timing as an uncontended comparison.

Official canary assets change. Verify the reported executable revision and hash before calling a new result a replication of this particular compiler. The runner uses the existing [reader comparison tool](../../../../tools/bun-aot-check/README.md), without changing its implementation.

The accepted execution used **separately guarded checkpoints**, rather than one uninterrupted `full-study.py` invocation: Express completed before a later cold interruption; Fastify, standalone, JSON and cold/startup then completed under their own guards. `audit-express-warm.py`, `audit-fastify-warm.py` (also `--json-control`), `audit-standalone.py` and `audit-cold-startup.py` accepted those captures. The original all-in-one runner/audit remain reproduction alternatives; their output-folder assumptions must not be applied to these checkpoints without explicit wiring.

Check the public evidence without running another benchmark:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 verify-evidence.py
```

That verifies stored/decompressed hashes, recomputes every summary, checks 246 windows and 27,977,442 measured responses, verifies balanced mode positions, checks the 180 startup rows and generated source/contract commitments. It rechecks the published evidence; it does not independently rerun or authenticate the original execution.

The warmed batches use six fresh processes per mode: JIT, bytecode and native, eight connections, three seconds warmup and eight measured seconds. Cold batches use another six fresh processes per mode, a health-only readiness check, one fully checked business response and five one-second request windows. The serializer control compares JIT/native with `JSON.stringify` separately. Mode positions are balanced; every trial is retained. First launches of newly built files remain separate from repeated fresh-process startup.

The cold trace starts after the first business response. Each one-second window starts a new client, and actual gaps are retained. A fresh process with warm filesystem caches is different from booting an uncached machine. Native output has no JIT; it still opens the database, initializes the framework, allocates and runs the collector.

## Check serialization behavior

```sh
cd "$LAB_DIR"
node serializer-contract.mjs
```

The [accepted functional results](results/serializer-contract.json) show identical bytes for the fixed fixture, different output for extra root/nested fields and different types for a numeric string. Those are functional observations, excluded from performance windows. Plain JSON output does not preserve every schema-specific serializer behavior.

## Measurement boundaries

App memory is macOS physical footprint in decimal MB; RSS and sampled/lifetime peaks remain distinct in the numeric evidence. Memory includes SQLite in the app process, with warm file caches; it is not JavaScript heap or uniquely occupied machine RAM. The local C client shares the host. CPU/request divides measured app CPU seconds by checked responses; CPU utilization divides it by wall time. Neither establishes electricity use or hosting cost.

Six short runs expose spread, not long-term reliability. The process sampler checks one-second snapshots for high-CPU activity in the two known concurrent study paths, excluding this runner's descendants. It can miss short activity and does not establish an otherwise idle host. Raw process inventories, build/app logs, binaries and the interrupted pilot remain outside Git. Public captures contain structured observations, hash manifests and explicit exclusions.

# Generating Fastify's serializer before the Bun build

Accepted November 1, 2026. The standalone serializer matches runtime generation in four cases under **both source execution and native AOT**: the fixed payload, extra root/nested fields, a numeric string and a missing required property. It omits the tested extra fields, emits the numeric string as a number and throws on the missing required property, matching the original generated serializer. [Contract results](results/standalone-contract.json).

The exact same fast-json-stringify **7.2.0** emitted `serializer.cjs` before Bun compiled the app. Its source is imported directly and returned from Fastify's serializer compiler. The transitive dependency/snapshot lock is unchanged; the already locked serializer package is exposed as a direct dependency. [Generator, emitted source and lock](standalone/README.md), [hashes](results/standalone-inputs.json).

## Separately guarded warmed controls

Every policy below has six interleaved fresh-process runs per listed mode, eight connections, three seconds warmup and eight measured seconds. Each timed response matches the same expected 2,215 bytes. Policies ran in separate guarded batches, so these are within-policy mode comparisons, not a randomized ranking across policies.

| Serialization policy | JIT requests/s | AOT requests/s | AOT rate vs JIT | JIT / AOT CPU µs per request | JIT / AOT end app MB |
| --- | ---: | ---: | ---: | ---: | ---: |
| Default runtime generation | 39,972 | 38,217 | −4.4% | 25.41 / 26.13 | 43.12 / 20.46 |
| Standalone source before build | 39,825 | 39,409 | −1.0% | 25.49 / 25.30 | 42.05 / 20.13 |
| Plain `JSON.stringify` | 40,629 | 41,418 | +1.9% | 24.90 / 24.12 | 39.63 / 19.15 |

The standalone control leaves AOT about 1% behind JIT on request rate, with 0.7% less CPU/request and 52.1% lower end app physical footprint. This is a smaller throughput gap than the default serializer's 4.4% in its separate batch. It is consistent with the compiler benefiting from visible source. It does not isolate every runtime-generated Fastify path, eliminate ordinary host variation or prove that every schema becomes faster.

Plain JSON gives matching fixed HTTP output and a faster AOT result in its control, but the [functional check](results/serializer-contract.json) shows changed extra-field and numeric-string behavior. Its performance is not evidence of a generally equivalent API optimization. The standalone comparison preserves the four tested behaviors; wider schema support remains untested.

The standalone batch checked **5,708,369 responses in eighteen windows**, with 200 guard snapshots and no detected competing study activity. The plain JSON control checked **3,937,744 responses in twelve windows**, with 129 snapshots. Both guards completed normally. The standard sampling limits, local client, cached reads, app-only physical footprint and CPU/request boundaries apply. No energy, cloud cost or reliability result follows.

## Reproduce and inspect

The fixture has one schema-bearing route. In an app with multiple schemas/statuses/content types, choose the matching prebuilt serializer for each; returning this dashboard serializer globally would be incorrect. Conditional schema features and custom formats need additional generation and contract tests. The upstream [standalone documentation](https://github.com/fastify/fast-json-stringify/blob/v7.2.0/README.md#standalone) describes validator inlining for conditional schemas; this fixture does not use them.

The native contract build warned that several dependency-created regular expressions use the interpreter. A successful standalone serializer does not establish that every generated path in the framework is now native. Those warnings are retained in the private build output; the selected public source and contract results state what actually ran.

- Standalone: [full summary/spread](results/standalone-warm-summary.json), [observations](results/standalone-warm-guarded.json.gz), [conditions](results/standalone-conditions.json), [integrity manifest](results/standalone-manifest.json).
- Plain JSON: [full summary/spread](results/json-warm-summary.json), [observations](results/json-warm-guarded.json.gz), [conditions](results/json-warm-conditions.json), [integrity manifest](results/json-warm-manifest.json).
- Audits: `audit-standalone.py` and `audit-fastify-warm.py --json-control` recompute accepted comparisons, verify input/executable identity, all response and histogram counts, CPU arithmetic, mode positions and guard completion. The standalone audit also checks source/native semantic outputs and the unchanged transitive lock.

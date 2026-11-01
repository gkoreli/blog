# Publication control: compare all policies in one batch

November 1, 2026. The original [separate policy batches](07-serializer-results.md) remain accepted under their stated conditions. This new control supersedes their use as a between-policy comparison in the published article. No earlier capture or median was replaced.

Six cells (runtime-generated / standalone / plain JSON × JIT / native) ran in six cyclic rotations. Each cell has six fresh processes and appears in each order position once. The same exact-hash executables, cached-read database, complete 2,215-byte response contract, eight connections, three-second warmup and eight-second measurement apply. All **36 windows and 11,200,026 responses** passed. Guard: sixty quiet seconds, 388 running snapshots, no detected activity from the two known study paths. Ordinary activity, short-lived work and thermal variation remain possible.

| Policy / runtime | Requests/s median (min–max) | CPU µs/request, median | End app physical MB |
| --- | ---: | ---: | ---: |
| Runtime / JIT | 38,273 (37,123–40,432) | 26.32 | 43.97 |
| Runtime / AOT | 37,310 (36,566–38,505) | 26.66 | 20.04 |
| Standalone / JIT | 38,575 (38,267–39,717) | 26.14 | 42.35 |
| Standalone / AOT | 38,400 (36,137–40,356) | 25.87 | 20.23 |
| Plain JSON / JIT | 39,506 (39,079–40,580) | 25.50 | 40.11 |
| Plain JSON / AOT | 40,320 (38,754–41,155) | 24.63 | 18.57 |

Ratios of cell medians put default native 2.5% behind JIT on rate, with 1.3% more CPU/request and 54.4% less end physical footprint. Standalone native is 0.5% behind its JIT cell; plain JSON native is 2.1% ahead within its policy. The plain JSON semantic differences remain; it is not an equivalent general replacement.

## Block-paired changes

Pair each standalone run with the same block's runtime-generated run:

- Native CPU/request: median **3.3% lower**, from **0.7% to 4.6% lower**; all six blocks lower.
- Native request rate: median **3.3% higher**, range **1.2% lower to 4.8% higher**. The small rate gain is variable.
- JIT CPU/request: median 0.1% lower, with changes from 2.5% lower to 1.8% higher.

These are medians/ranges of the paired percentage changes, distinct from ratios of overall cell medians. [Every block pair and summary](results/policy-matrix-pairs.json). The comparison is consistent with making this hot generated function visible to the compiler; it does not isolate every other framework-generated path or establish behavior for other schemas.

The [four original source/native semantic cases](results/standalone-contract.json) apply to the exact same standalone artifact measured here. They match ordinary output, root/nested extra fields, numeric-string coercion and required-field failure. They are bounded contract evidence, not all-schema certification. Application source and dependencies did not change in this control.

## Startup counterevidence

These same runs retained startup measurements. Their cell medians ranged **41.2–76.5 ms**, with native not consistently ahead of JIT. This differs from the earlier [thirty-start readiness control](08-cold-startup-results.md), whose protocol and samples remain intact. Startup is not the primary measurement of this six-cell warmed comparison. Both sets stay visible; no OS/cache/scheduling/thermal cause has been isolated. The published table is explicitly the dedicated thirty-start control, not a promise about every fresh launch.

## Evidence

[Numeric observations](results/policy-matrix-observations.json.gz), [full summary](results/policy-matrix-summary.json), [inputs and binary commitments](results/policy-matrix-inputs.json), [selected guard conditions](results/policy-matrix-conditions.json), [integrity manifest](results/policy-matrix-manifest.json). `policy-matrix.py` fixes the protocol; `audit-policy-matrix.py` checked original binary identities, all statuses/body hashes/histograms, CPU arithmetic, exact rotations, complete guard termination and each paired statistic. Only binary paths were removed from the public structured captures.

The publication evidence totals **282 timed windows and 39,177,468 checked measured responses**, plus the original 180 readiness-only starts. The original 246-window research cutoff remains unchanged; this 36-window extension is counted separately before summing. Responses are output checks; process repetitions are the experimental units.

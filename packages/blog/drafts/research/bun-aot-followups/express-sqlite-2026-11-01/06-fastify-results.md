# Fastify/SQLite: lower memory with more CPU per response

Accepted November 1, 2026: a separate guarded batch of eighteen warmed windows, six fresh processes per mode, **5,672,260 completely checked responses**. These are the same pinned compiler, SQLite data and expected 2,215-byte success body used in the Express fixture, with Fastify's response schema and default generated serializer.

| Same Fastify app | Bun JIT | Bun bytecode | Bun native AOT |
| --- | ---: | ---: | ---: |
| Requests/s, median | 39,972 | 39,959 | 38,217 |
| Requests/s, min–max | 39,629–40,131 | 39,935–40,076 | 38,152–38,398 |
| App CPU, microseconds/request | 25.41 | 25.39 | 26.13 |
| End app physical footprint, MB | 43.12 | 39.68 | 20.46 |

AOT's median end footprint was **52.6% lower** than JIT. Its warmed request rate was **4.4% lower**, and CPU/request **2.8% higher**. CPU utilization was around one core in both modes. Saving RAM did not save CPU per completed response on this fixture. Each relative number compares cell medians; every run is retained.

The [guard receipt summary](results/fastify-warm-conditions.json) contains 193 one-second running snapshots without detected >10% CPU activity from either known competing study path, after sixty quiet seconds. The guard completed normally. Short-lived or unknown work, ordinary host activity and thermal variation are not ruled out.

The executable files were built and checked during the earlier exploratory work and reused by exact hash. Their first checked launch in this batch was **not** the first launch of a freshly built file. Readiness medians across the six repeated fresh processes were 37.8 / 18.2 / 13.5 ms for JIT / bytecode / native. Those health-only observations are separate from the accepted [cold and startup-distribution checks](08-cold-startup-results.md).

Methods otherwise match the [Express batch](05-express-results.md): eight connections, three seconds warmup, eight measured seconds, one read-only cached user, complete success/rejection checks, matching measured bytes and balanced mode positions. These two framework batches ran separately; do not interpret their absolute rates as a randomized framework ranking. App physical footprint includes SQLite; CPU/request is measured app CPU seconds divided by checked responses. There is no resource quota, cost, power or production-capacity claim.

[Inputs and original build hashes/flags](results/fastify-warm-inputs.json), [summary and spread](results/fastify-warm-summary.json), [numeric observations](results/fastify-warm-guarded.json.gz), [integrity manifest](results/fastify-warm-manifest.json). `audit-fastify-warm.py` recomputes the summary and checks fixture/source/database/executable identity, all eighteen windows, CPU arithmetic, histogram counts and mode balance.

[Bun documents interpreted runtime-generated code](https://github.com/oven-sh/bun/blob/3f3a9ff87cdccf3d32d7ec6b648c664eddaae840/docs/compiler/compatibility.mdx#code-from-strings); the pinned fast-json-stringify implementation generates a serializer with `new Function`. That makes the serializer a concrete optimization candidate, not a complete explanation of this app's cost. The separately accepted [plain-JSON and standalone-generated controls](07-serializer-results.md) test that change and its limits. The [semantic check](results/serializer-contract.json) shows why plain JSON is not generally an equivalent replacement.

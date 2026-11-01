# Claim audit

The source cutoff is November 1, 2026. Local results are evidence about the declared fixtures, compiler and Mac. They are not independent replication of Jarred's undisclosed setup.

| Claim | Evidence state | Basis | What it can establish | What it cannot establish |
| --- | --- | --- | --- | --- |
| Express/SQLite can use less memory and CPU with similar warmed request speed | Reported | Jarred's linked chart and description in [source notes](01-source-notes.md) | A maintainer reports this result on one app | Its percentages on our fixture, hardware or compiler |
| All frameworks benefit equally | Unsupported | Jarred's Hono/Fastify follow-ups give different results; our earlier Elysia/database trials also differ | A universal multiplier is unwarranted | A general ordering of frameworks |
| Native output has no JIT | Primary documented | Pinned Bun AOT and compatibility guides | Runtime-generated functions lack JIT compilation in native output | Every first request has full eventual throughput |
| Fastify's default serializer generates functions | Code-inspected | fast-json-stringify 7.2.0 `index.js:585`, matching the installed dependency | Generated source passes to `new Function` | That this path explains every observed slowdown |
| `JSON.stringify` preserves every schema-specific response behavior | Contradicted | [Functional result](results/serializer-contract.json) | Same fixture bytes; extra fields and numeric strings differ under plain JSON | Safe substitution for arbitrary schemas/data |
| Lower CPU/request means lower cost | Unsupported inference | CPU/request and wall request rate have separate denominators | More complete app-level resource comparison | Electricity, hosting bills or deployment density without their actual constraints |
| The release title uniquely identifies the downloaded binary | Contradicted for the checked asset | Official API asset digest agrees with the archive, but binary revision differs from the release title | Pinning the executable and archive prevents a mistaken version attribution | Why release metadata differs, or whether other platform assets differ |

## Competing explanations fixed before results

- **Useful native savings:** less runtime machinery reduces app memory and some work per request, even where warmed request speed changes little. A matched same-revision run that shows no savings would weaken this for the tested app.
- **Framework-generated hot code:** code created at runtime adds an interpreted path in native output. The JSON serializer control can test sensitivity to this change. It changes semantics outside our fixed fixture, so its speed alone cannot establish a generally valid optimization. It does not isolate every Fastify internal function.
- **Application warm-up remains:** no JIT can coexist with database/framework/OS first-use costs. Compare readiness, the first business response and the five short load windows separately. Any improving window curve identifies an observation; attribution to GC, caches, sockets or the OS would need another control.
- **Shared-host variation:** local client work and concurrent host activity can change request speed. Preserve all repetitions and ranges, the interrupted pilot and the bounded interference sampler. The sampler does not prove a perfectly idle or unthrottled machine.

## First accepted numeric result

The [guarded Express warmed batch](05-express-results.md) completed all eighteen windows before the guard detected a later competing process during cold testing. Its phase sampler contains 196 snapshots with no detected activity from the two known study paths. CPU/request and throughput medians improved by 3.8% and 2.0%; end physical footprint fell 57.7%. The separately guarded [Fastify batch](06-fastify-results.md) passed eighteen windows: 52.6% less end footprint, 4.4% fewer requests and 2.8% more CPU/request. These are reproduced on the declared fixtures, not verification of Jarred's exact percentages. All six results per mode and the limits remain available.

The [serializer controls](07-serializer-results.md) are also accepted: standalone source matches four source/native semantic cases and leaves a 1.0% AOT/JIT rate gap in its separate batch; plain JSON is 1.9% ahead within its control with changed semantics. [Cold/startup results](08-cold-startup-results.md) separate health readiness, checked first business work and five request windows. The guarded thirty-start control shows lower native readiness without reproducing the reversal from excluded overlapping work. No particular OS/cache/thermal cause is proven. The entire accepted evidence set passes `verify-evidence.py`.

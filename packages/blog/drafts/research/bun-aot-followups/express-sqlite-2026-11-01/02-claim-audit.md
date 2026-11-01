# Claim audit

The source cutoff is November 1, 2026. Local results are evidence about the declared fixtures, compiler and Mac. They are not independent replication of Jarred's undisclosed setup.

| Claim | Evidence state | Basis | What it can establish | What it cannot establish |
| --- | --- | --- | --- | --- |
| Express/SQLite can use less memory and CPU with similar warmed request speed | Reported | Jarred's linked chart and description in [source notes](01-source-notes.md) | A maintainer reports this result on one app | Its percentages on our fixture, hardware or compiler |
| All frameworks benefit equally | Unsupported | Jarred's Hono/Fastify follow-ups give different results; our earlier Elysia/database trials also differ | A universal multiplier is unwarranted | A general ordering of frameworks |
| Native output has no JIT | Primary documented | Pinned Bun AOT and compatibility guides | Runtime-generated functions lack JIT compilation in native output | Every first request has full eventual throughput |
| Fastify's default serializer generates functions | Code-inspected | fast-json-stringify 7.2.0 `index.js:585`, matching the installed dependency | Generated source passes to `new Function` | That this path explains every observed slowdown |
| Replacing the serializer preserves every response contract | Contradicted | [Functional result](results/serializer-contract.json) | Same fixture bytes; extra fields and numeric strings differ under plain JSON | Safe substitution for arbitrary schemas/data |
| Lower CPU/request means lower cost | Unsupported inference | CPU/request and wall request rate have separate denominators | More complete app-level resource comparison | Electricity, hosting bills or deployment density without their actual constraints |
| The release title uniquely identifies the downloaded binary | Contradicted for the checked asset | Official API asset digest agrees with the archive, but binary revision differs from the release title | Pinning the executable and archive prevents a mistaken version attribution | Why release metadata differs, or whether other platform assets differ |

## Competing explanations fixed before results

- **Useful native savings:** less runtime machinery reduces app memory and some work per request, even where warmed request speed changes little. A matched same-revision run that shows no savings would weaken this for the tested app.
- **Framework-generated hot code:** code created at runtime adds an interpreted path in native output. The JSON serializer control can test sensitivity to this change. It changes semantics outside our fixed fixture, so its speed alone cannot establish a generally valid optimization. It does not isolate every Fastify internal function.
- **Application warm-up remains:** no JIT can coexist with database/framework/OS first-use costs. Compare readiness, the first business response and the five short load windows separately. Any improving window curve identifies an observation; attribution to GC, caches, sockets or the OS would need another control.
- **Shared-host variation:** local client work and concurrent host activity can change request speed. Preserve all repetitions and ranges, the interrupted pilot and the bounded interference sampler. The sampler does not prove a perfectly idle or unthrottled machine.

Numeric dispositions will be filled only from audited, completed batches.

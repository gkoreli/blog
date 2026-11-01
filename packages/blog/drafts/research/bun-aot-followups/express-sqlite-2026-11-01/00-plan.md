# Does lower CPU survive a framework and database?

New owner request, November 1, 2026: investigate the [October 31 Express/SQLite report](https://x.com/jarredsumner/status/2116679973448945762), do further evidence-based research and experiments, and decide whether a separate follow-up article is warranted. Earlier accepted application/pool work remains complete.

## Questions fixed before running

1. On the same Express + `node:sqlite` fixture, does native AOT save app memory and CPU per checked request while retaining warmed throughput? Compare JIT, bytecode and native from one compiler binary.
2. Does Fastify's generated serialization change that result? Use the same database and output, while recording its additional response schema behavior explicitly. There is no generated input validator in this fixture.
3. How much work happens in the first seconds after readiness? Separate process launch, the first business response and consecutive one-second request windows from the warmed batch. No JIT does not eliminate all application or OS warm-up.

These are new fixtures inspired by the report. Exact upstream source, compiler, machine and measurement protocol were not supplied in the inspected thread. They cannot independently replicate its percentages.

## Protocol and acceptance

- Pin installed dependencies, compiler revision and hashes. The current official canary release title names `dbd320cc`, while its macOS arm64 archive reports `3f3a9ff87`; use the executable revision and asset digest, retaining the mismatch.
- Deterministic SQLite file seeded before timing and opened read-only in each fresh server: users/orders/settings, four prepared reads per successful API request, bearer-auth middleware, 2,215 bytes of JSON. This deliberately tests cached synchronous reads, not durable writes or network database I/O. Startup includes opening the file and preparing statements, without table creation/seeding.
- Independently derive complete expected JSON in Python, check valid and rejection paths before timing, and compare all successful timed bytes and status. No errors may silently become throughput.
- Warmed batch: six rotated/interleaved fresh processes per mode/framework, eight connections, three seconds warmup and eight measured seconds. Keep min/max, app CPU seconds per checked request, physical footprint/RSS and every sample. The existing reader tool provides this protocol. Frameworks run serially.
- Cold batch: six interleaved fresh processes per mode/framework. Readiness uses only `/health`; check the first API response with its full expected bytes and retain its latency, then five consecutive one-second windows, eight connections, no deliberate business warmup. Launch latency excludes a separately recorded first launch of each new executable. Requests to check the contract before this batch use other processes.
- Serializer control, declared before any timings: build a second Fastify entry differing by `app.setSerializerCompiler(() => JSON.stringify)`, the pinned Bun compatibility guide's suggestion. Six interleaved JIT/native warmed runs, same response schema and fixture. Its contract is only the tested fixed outputs; dropping schema-specific serialization is not generally equivalent for extra fields, coercion, dates or errors. Keep the control separate from the default Fastify results.
- Retain first-seen launches separately, build time and file size. Memory is app-only macOS physical footprint, not heap or unique OS RAM. CPU time is process CPU converted using the Mach timebase; CPU/request and CPU utilization answer different questions.
- Raw logs/process inventories stay under `/tmp/bun-aot-express-20261101`; only source, structured numeric results, selected environment conditions and hashes enter Git.
- Avoid overlapping other sessions' load tests/builds. A live Keryx benchmark was observed at setup; prepare sources and evidence while it runs, then check its actual process before timing. Preserve all unrelated servers/files.
- Check source syntax, expected values, result counts/hashes and scoped documentation links. Deliver scoped evidence to main. Assess a follow-up with a concrete supported question; the owner's tentative article request does not require publishing another post before new results exist.

## Progress

- [x] Read existing worklist, latest accepted plan, article and saved results.
- [x] Read original post and the author's three follow-ups in the signed-in browser.
- [x] Resolve current official canary asset and verify its cached archive SHA-256.
- [x] Build and verify new fixtures and rejection paths.
- [ ] Run warmed and cold batches without overlapping the existing study.
- [ ] Audit results, record a supported article decision and remaining limits.
- [ ] Commit/push scoped evidence and record the delivery.

## Excluded setup and pilot

The scratch-directory package-manager default initially selected pnpm 11.25.0. The package-manager pin was added and dependencies were recreated with pnpm 9.15.4 before any accepted builds. The fixture's runtime pin selects Node 24.14.1. These are setup corrections, not compiler observations.

The original external benchmark process exited, then the other session launched a new compiler process during our first pass. Our own pass was interrupted after five completed Express cells; its data stays under the private scratch root, separate from `accepted/`. Exclusion was decided from the observed concurrent build before comparing cell results. No slow cell was selectively removed from the fresh batch. The new runner samples the two known study paths once per second and records whether it sees other high-CPU study processes; absence is bounded by that sampling and scope. This does not certify an idle host.

## Additional startup check, declared during the Fastify pass

The completed Express warmed batch has a native readiness median of 44.5 ms (range 14.9–73.4), whereas its separate cold-window batch has 16.2 ms (15.9–20.9). Preserve both; a clean startup-win headline would conceal that inconsistency. After all planned performance windows finish, run thirty additional fresh starts per mode/framework, interleaving frameworks and rotating/reversing modes. Use the same verified binaries, health readiness and a checked business request, without rebuilding or sustained load. Retain this as a third batch and inspect its entire distribution. It can test whether the reversal persists; it cannot identify an OS/scheduling/cache cause by itself. Do not merge it into the first two batches or remove their slower launches.

## Preserve the serializer contract, declared before running the control

The JSON substitution changes extra fields and numeric strings in the functional test. Add a separate project using the **same fast-json-stringify 7.2.0** in its supported standalone mode: emit a module before compiling, then statically import that serializer and return it from Fastify's serializer compiler. Keep the schema and handler unchanged. Check normal output, root/nested extra fields, numeric strings and a missing required field against runtime generation under both the source runtime and native AOT. Then six JIT/bytecode/native warmed runs with the existing tool and fixed HTTP checks. Preserve this separate project's dependency lock, emitted source and hashes. A four-case match is bounded contract evidence, not proof for every schema feature.

## Shared-host acceptance correction — November 1, 17:09 UTC

The sampler revealed repeated external Keryx, Redis and compiler activity throughout the second pass: 146/197 Express-warm snapshots, 45/89 Express-cold, 146/199 Fastify-warm, 26/89 Fastify-cold and all forty snapshots in the interrupted JSON-control portion. These are snapshots, not the number of affected request windows. Correct response checks passed, but **none of those batches is accepted as an uncontended performance comparison**. Their startup medians and apparent CPU/memory differences remain exploratory leads. Our JSON control was interrupted; no external process was stopped. The earlier attempt to signal the completed cold-run child found no such process and changed nothing.

The sampler was initially only inspected after the run progressed. That let new external jobs overlap despite waiting for the first known process to exit. The replacement `host-guard.py` gates the entire expanded study on sixty quiet seconds and interrupts only our own process group if new known external activity appears. It retains every attempt and exits 75; a new run requires fresh output paths. A thirty-minute observation timeout expires the attempt without starting measurements. It is not a host-wide exclusivity mechanism and can miss short or unknown activity.

The remaining acceptance gates stay open. No new performance claim or article publication is accepted from this pass. [Next bounded action and live handle](04-handoff.md).

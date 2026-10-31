# A timed-out lookup should not strand another verifier

October 31, 2026 UTC. Continues [Research 117](117-key-import-and-request-lifecycle-races.md). This repair improves the availability of incoming agent-signature verification. It supplies no new reader identities, growth measurements or evidence of an agent's purpose.

## The shared promise had a request owner

Two Worker requests can share a directory lookup, but its transport belongs to the first request. Our earlier native control showed that the owner's deadline aborted the lookup for a second caller whose deadline had not expired. That caller received unavailable evidence, despite a valid signature. A later request succeeded with a new lookup. Historical production incidence remains unknown.

The [verifier](../../../../analytics/src/webbotauth.ts) now accepts an explicit caller `AbortSignal`. The collector passes its existing deadline controller; the offline candidate audit does likewise. A surviving caller gets **one owner-abort recovery allowance per verifier invocation**, shared across signature candidates and lookup stages. Concurrent survivors join the replacement lookup. This is not a global two-fetch limit: distinct candidates, directory origins and normal rotation rules still have their own work.

Ownership is registered before starting the transport. An abort removes only its matching pending entry. Late responses from transports that ignore abort cannot publish a directory or undo a newer source. A canceled caller cannot publish an imported key or return a verified result after its cancellation checks. Normal HTTP/JSON failures remain failures; the owner's normal final cleanup does not trigger a retry.

## Native testing rejected the first prototype

The first implementation read the shared owner's active `AbortSignal.aborted` property. Local workerd threw `Cannot perform I/O on behalf of a different request` with `RefcountedCanceler`. An isolated listener-registration probe passed; it did not exercise the active fetch canceller and could not establish the full operation was safe. Instrumented output and the generated bundle locate the failing getter. The final implementation reads a plain JavaScript lifecycle flag recorded by the owner instead. Temporary diagnostic logging is removed.

This is consistent with [Cloudflare's documented request-context restriction](https://developers.cloudflare.com/workers/observability/errors/#cannot-perform-io-on-behalf-of-a-different-request). That documentation describes the general rule; our local reproduction identifies this particular failing operation. The [context lifetime documentation](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil) also leaves finite background lifetimes explicit. Neither source establishes that our explicit signal observes every implicit Worker termination.

The pinned MIT-licensed [`jose` remote-key implementation](https://github.com/panva/jose/blob/5a6a5b63bf970bea89f0aa2e5f7eb322e6962ae1/src/jwks/remote.ts), inspected in the preceding investigation, separates Worker pending-work handling from refresh publication. We borrowed test questions, not its pending-reset implementation or a dependency. The current browser fetch of that pinned GitHub page failed; the previously preserved source capture remains the inspected artifact.

## The cancellation verdict alone hid another mutation

Bounded agent review found that cancellation during asynchronous thumbprint hashing could still delete a warm directory and consume its 30-second refresh allowance before the transport noticed the abort. We reproduced this in **three of three Node/workerd comparisons**: the verdict already said unavailable, but shared state had changed. Guards after asynchronous searches now preserve the directory and refresh allowance. A held-import control separately verifies that cancellation prevents key publication while an active later caller can use the completed directory.

## Results and boundaries

The [service-binding harness](../../../scripts/check-key-request-ownership.mjs) runs actual separate local Worker requests against a directory Worker, with 100/1,000 ms caller deadlines and a 250 ms directory delay. Three final-source repetitions cover four schedules:

| Schedule | Result |
| --- | --- |
| Both callers alive | Both verify; one lookup |
| Lookup owner expires | Owner reaches fixture deadline; survivor verifies; two lookups |
| Newer waiter expires | Owner verifies; waiter reaches fixture deadline; one lookup |
| Owner expires with five waiters | All five survivors verify; two lookups total |

All twelve recovery probes verify from the warm cache. Measured active request and logical pending counts return to zero. Native cross-request continuation warnings remain preserved; no compatibility flags changed.

The [deterministic fixture](../../../../analytics/test/fixtures/key-request-ownership.mjs) adds nine schedules, each compared exactly across Node and workerd in three rounds: pre-abort, synchronous transport abort, five waiters with a late ignored-abort response, HTTP failure, malformed JSON, held key import, held warm-key hash, noncacheable sequential responses and an exhausted recovery allowance. Actual crypto runs at the fixture's fixed assessment time; these are not current vendor proofs. Held custom transports drain to zero. The pending-map cap does **not** bound all physical transports that ignore cancellation. Completed noncacheable replacements under other interleavings remain a separate availability question.

The [summary checker](../../../scripts/summarize-key-ownership.mjs) reconciles fixture/source hashes and schedules; four corrupted-result/source/counter controls are rejected. Prior key-rotation race controls still agree across twelve paired conditions. A [local D1 check](../../../scripts/check-key-ownership-report.mjs) persists actual positive/canceled envelopes and projects both through the current-profile SQL and full report decoder: two recognized rows; cancellation is unavailable, never invalid cryptography.

Verifier/reviewed profile and report cache move to `2026-10-31.1`; collection/classifier and stored evidence limits stay unchanged. **330 analytics tests, 166 site tests, workspace types, 22-post validation, isolated 33-post build and Worker dry-run pass.** An initial suite failure assumed a synchronous transport start; its test now waits for a real start barrier and retains the sharing assertions. The failed native prototype and pre-guard mutation are preserved privately. No article, schema, dependency, raw-diagnostic setting or human calibration changes.

[Acceptance receipt](key-request-ownership-audit.json) owns source hashes, checks and the verified private archive. Local acceptance does not establish production race frequency or managed-provider agreement. Source activation is recorded separately. The goal remains active and incomplete; search, native identity/oracle, privacy, source-purpose and owner-deferred human/device inputs retain their existing requirements. The next bounded action after delivery is a decision on whether the offline directory-response advisory should enter runtime at all, with explicit authenticity benefit and cost; this repair does not silently enable it.

## Source activation

[Release receipt](key-request-ownership-release.json) joins source `605ab9c`, source-matched successful Cloudflare check `124384235857`, its declared Worker `d74b4efe-ca54-436d-a500-93de8e12cf63`, and fresh Wrangler metadata allocating that exact version at 100%. Four corrupted source/version/allocation/conclusion controls fail linkage. The separate private release archive reconciles. The earlier direct build-details 403 is not retried; no credential or scope changes occur.

This acceptance uses metadata only: zero site visits, SQL statements or tails, with no fresh served-asset/report/collector measurement. The race results remain local, production incidence remains unknown, and later documentation-only deployments have their own identities. The next bounded action is the runtime-advisory benefit/cost decision described above; remaining external gates and the full goal stay open.

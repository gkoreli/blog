# A late key import could undo a newer directory

October 30–31, 2026 UTC. Continues [Research 116](116-directory-cache-clocks-and-key-admission.md). The previous goal turn made progress through `eda77d6`. The next local request-lifecycle experiment found two reproducible defects in the incoming-request verifier, before adopting the optional directory-response advisory.

## A removed key returned to the fast cache

The [fixture](../../../../analytics/test/fixtures/key-lifecycle.mjs) independently signs two synthetic clients at one directory. A barrier pauses the first key's import while a second request refreshes the directory to a version that removes it. The old import then finishes. We execute actual cryptography; barriers control the operation order rather than inventing verification results.

Before the repair, that late import repopulates the removed key. A later request verifies through the imported-key cache without consulting the newer directory. This reproduces in Node and local workerd **three of three rounds**. The directory was already published and the old key was explicitly absent, so this is a cache-consistency failure, not an assertion that an old signature's mathematics stopped working. It could undermine our claimed key-source association for later requests. Historical or production incidence is unknown.

The [repair](../../../../analytics/src/webbotauth.ts) checks directory object identity after asynchronous import, before writing the imported key. A replaced/evicted source yields the compact closed cause **`reload`**, classified **unavailable**. It never labels that signature invalid. This preserves the existing 2,048-byte evidence bound and does not retry indefinitely. A source refresh can cause a conservative abstention even when the new directory still contains the same key; this check is not a universal revocation protocol or retroactive invalidation of in-flight signatures.

## A waiter missed a key being fetched for it

Two concurrent requests also start from the same warm directory missing the rotated key. One starts the refresh and sets the cooldown. The other finishes searching its older snapshot and returns `key-not-found` without joining the refresh. Before repair: one verified/one unavailable in all three rounds, despite the refreshed directory containing the key.

The resolver now checks for an existing refresh or freshly published replacement before the forced-refresh cooldown. Both waiters verify with one physical refresh in the repeated controls. The cooldown and concurrency caps remain. Joining a completed **noncacheable** replacement, cancellation ownership and other interleavings need their own policy; these four conditions do not prove universal availability.

| Local condition | Before | After |
| --- | --- | --- |
| Sequential cold/warm requests | Two verified, one fetch | Same |
| Parallel cold misses | Two verified, one fetch | Same |
| Late old import after directory rotation | Removed key cached; later probe verified | No resurrection; old probe unavailable |
| Parallel warm requests for rotated key | One verified/one premature miss | Both verified; one refresh |

[Harness](../../../scripts/check-key-lifecycle.mjs), [comparison](../../../scripts/summarize-key-lifecycle.mjs), [receipt](key-lifecycle-race-audit.json): twelve paired Node/workerd condition runs across three rounds, using the same frozen signing bytes.

## Actual cross-request cancellation was a separate test

The [service-binding harness](../../../scripts/check-key-request-lifecycle.mjs) runs separate Worker requests against another local Worker, with a 250 ms directory delay and controlled 100/1,000 ms caller deadlines. It uses the real fetch/abort/runtime boundary. These deadlines are shortened experimental conditions; the production collector's signature budget remains 2,000 ms.

Across three rounds of three conditions:

- With both callers alive, they share one lookup and both verify.
- When the lookup owner times out, its waiter receives `dir-fetch-failed` despite having a longer deadline. That is unavailable evidence, not invalid cryptography. The next request performs a new lookup and verifies.
- When the newer waiter times out, the owner completes and the next request verifies from the warm cache.

At the measured cleanup/recovery points, active/pending counts are zero and all nine recovery calls verify. Local workerd also logs a cross-request promise-continuation cancellation warning; the raw warning is preserved privately. We have not fixed or generalized that lifecycle coupling. The next bounded improvement is caller-owned failure/retry behavior with publication-order and cancellation controls, without multiplying fetches or allowing late old state to overwrite newer state.

The [Workers context documentation](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil) describes finite request/background lifetimes; it does not promise that arbitrary shared pending work outlives its owner. The pinned [`jose` implementation](https://github.com/panva/jose/blob/5a6a5b63bf970bea89f0aa2e5f7eb322e6962ae1/src/jwks/remote.ts) separately handles Worker pending ownership and reload ordering. Its code suggested conditions to test, not evidence that our code failed. The local reproductions supply that evidence. We did not copy a cross-request pending reset or change compatibility flags.

## Report compatibility and delivery

Verifier profile is now `2026-10-30.1`, with the same collection/classifier versions. The reviewed profile catalogue and report cache `2026-10-30.4` move together. A [native local D1 test](../../../scripts/check-key-lifecycle-report.mjs) stores actual positive and unavailable fixture envelopes, projects both to the new current profile, and passes the full report decoder with two rows. `reload` remains unavailable. This supplies no production rows or human labels.

The first full suite caught a missing reviewed-profile entry, worst-case JSON overflow from a longer cause ID, and a fake pending fixture that never published its source. All three are corrected: the profile is reviewed, the compact cause fits, and the fixture now models real publication. **329 analytics/166 site tests, workspace types, 22 Markdown validation, isolated 33-post build and Worker dry-run pass.** The first isolated build was stopped by a sandbox IPC-socket restriction; the permitted build succeeds. The shared dev output is untouched.

This changes request-verifier code, so code acceptance, activation and production behavior must remain separate. The [receipt](key-lifecycle-race-audit.json) owns source hashes, private archive, local checks and any later release evidence. No production request/query or measured activation is claimed by the local experiment. The advisory remains offline; article and prompts are unchanged. Goal active/incomplete: broader native-service comparison, human/device, discovery, source-purpose and privacy evidence retain their requirements. Do not infer that old Exa/Ahrefs events hit either race or rewrite historical counts without their original evidence.

## Source activation and bounded public acceptance

[Release receipt](key-lifecycle-release.json) links source `c05c973`, successful source-matched Cloudflare GitHub check `124378102874`, its declared Worker `04c20df7-81b3-4d24-9b5d-0457dee15d55`, and a fresh Wrangler allocation of that exact version at 100%. The direct native build-details GET returned HTTP 403; cause is unestablished and build logs were not fetched. No credentials or scopes changed. The separately retrieved deployment/version metadata and source-linked provider check establish this narrower activation chain; no direct native build-outcome claim is made.

One planned collector-ineligible Markdown GET returns 200 and matches all 13,181 unchanged local bytes. No report fill, SQL, collection-eligible visit, tail or per-request version/Ray join occurs. This is asset availability; the race and stored-envelope measurements remain local. Core and release archives reconcile independently. Later documentation-only deployments have separate identities. Next: caller-owned bounded retry/failure semantics with publication ordering and noncacheable-response controls; goal remains active/incomplete.

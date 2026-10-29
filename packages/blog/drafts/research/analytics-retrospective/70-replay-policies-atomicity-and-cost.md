# A repeated proof is an observation, not an attack verdict

October 29, 2026 UTC. Continues [four exact Exa chains](69-current-verifier-signed-cohort.md) and [the transient reuse audit](50-proof-reuse-and-nonce-boundaries.md). The previous turn delivered new evidence and committed acceptance: progress. Human trials remain deferred.

This iteration tests replay policies in disposable local workerd/D1. It adds an inspectable prototype and counterexamples; **no production nonce store, enforcement, count adjustment or expanded capture is activated**. The useful result is knowing which proposed shortcuts would create misleading classifications or bypasses.

## Borrow requirements, then test the design

[RFC 9421 §7.2.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.2) describes nonce checks and freshness as separate tools. The current [Web Bot Auth WG draft -00, Appendix C.6](https://www.ietf.org/archive/id/draft-ietf-webbotauth-httpsig-protocol-00.txt) requires an atomic check across the intended scope for duplicate rejection, bounded admission/retention, and an explicit unknown when state is unavailable. It remains work in progress. [Cloudflare's implementation docs](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) currently describe no nonce database and recommend short expiry. None supplies a per-request replay verdict for our retained cohort.

The pinned [pyauth source](complete-audit-sources.json) assigns replay policy to the caller. We reuse its independent RFC verifier rather than assuming that installing a cryptographic library supplies shared replay state. The local D1 adapter in Miniflare `4.20260301.1` copies `cursor.rowsRead`/`cursor.rowsWritten` into result metadata; workerd is `1.20260301.1`. Those are measured local counters, not production billing or latency predictions. [D1 return-object documentation](https://developers.cloudflare.com/d1/worker-api/return-object/) defines the exposed fields; [SQLite UPSERT](https://www.sqlite.org/lang_upsert.html) explains the conflict behavior used below.

## Compare three keys on the same retained inputs

The [native experiment](../../../scripts/check-replay-policy-candidate.mjs) requires the exact frozen input digest accepted in Research 69 before creating a fixture. A changed input is rejected with no accepted result or fixture output. It uses the existing parser and candidate verifier through a research-only adapter; no production export or parser is added.

For each of four genuine Exa requests, the experiment supplies an original, an exact retry copy, an unsigned UA/path change, an outer-label change and an invalid signed-host change. That is **20 trial occurrences and 16 distinct request inputs per policy**, not twenty new visits. The same cases run under each of three candidate keys:

| Candidate key | First observed | Seen before | Invalid before state lookup |
|---|---:|---:|---:|
| Verified proof | 4 | 12 | 4 |
| Publisher/key-scoped nonce | 4 | 12 | 4 |
| Proof plus full unsigned context | 8 | 8 | 4 |

Including unsigned context lets all four changed UA/path cases appear new. That key would miss reuse of the signed proof. Proof and nonce keys mark all four deliberately constructed retry copies as previously seen. A blanket duplicate rejection would reject those retry-labelled controls too. These labels describe the simulation; no actual vendor retry, malicious actor, human trigger, population false-positive rate or attack prevalence is established.

A separate sixty-second maximum-lifetime policy rejects **all four original Exa proofs**, whose signed windows are 300 seconds. Cloudflare's short-expiry recommendation is not evidence that every genuine vendor request meets that proposed local limit. Existing verifier admission remains unchanged.

## Atomicity, scope and retention have different failure modes

The [candidate claim SQL](replay-claim-candidate.sql) performs one conditional UPSERT and returns whether a fresh per-attempt claim reference won. It preserves the first claim during an active window and extends retention for a longer-lived proof using the same nonce. A separate SELECT followed by INSERT is not the decision boundary.

Fourteen accepted native checks include:

- Twenty-four concurrent claims against one native D1 scope yield one first observation and 23 repeats. An explicitly interleaved SELECT-then-write counterexample lets both callers decide to admit.
- Nonce scope distinguishes publishers and decoded key material. Two admitted key encodings with different thumbprints share the same nonce scope; different keys or publishers remain separate.
- Missing/empty nonces remain not-assessed for nonce reuse, despite valid signatures. They cause no nonce-store statement.
- The acceptance horizon includes the verifier's sixty-second skew. The last whole second still verifies and stays marked seen; the next second fails verification before lookup. Retention ending at the signed expiry alone admits the still-valid proof again.
- A longer valid proof reusing a nonce extends its existing horizon. Otherwise the old shorter expiry creates a later admission hole.
- Unavailable state and a deliberately failed native D1 statement remain unavailable, rather than becoming unseen or cryptographically invalid. The failed statement returns no row metering. These are injected faults, not production outage measurements.

For privacy, the experiment rekeys transient audit tokens with a non-exported, per-Worker HMAC key before they enter disposable D1. Original diagnostic digests are never persisted. That isolation is deliberately unsuitable for shared enforcement: **two actual local Worker instances with separate keys both mark the same proof as first observed in one shared test database**. A production design would need a stable, explicitly scoped cross-instance key domain and rotation policy. Merely sharing a database does not repair inconsistent keys. Disconnected in-memory maps also admit one copy each.

Two initial local attempts failed because the prototype generated a random key at module scope. Native workerd rejected that operation before the experiment ran. Moving generation into request context repairs the harness; [Workers handler documentation](https://developers.cloudflare.com/workers/runtime-apis/handlers/) supplies the runtime boundary. Both failed traces and subsequent refinements remain archived. They are not production failures.

## Measure the store and its cleanup separately

The final run reports these successful local operation costs:

| Operation group | Statements | Reads | Writes |
|---|---:|---:|---:|
| Proof policy: sixteen valid occurrences | 16 | 16 | 8 |
| Nonce policy: same sixteen | 16 | 16 | 8 |
| Context policy: same sixteen | 16 | 16 | 16 |
| Twenty-four concurrent atomic claims | 24 | 24 | 2 |
| Insert 512 synthetic cleanup fixtures | 512 | 0 | 1,024 |
| Three bounded cleanup statements | 3 | 515 | 128 |

The [bounded cleanup SQL](replay-cleanup-candidate.sql) deletes at most 64 entries per statement. From 512 supplied rows, 128 are expired and 384 remain valid at the cutoff. Deletes are 64, 64, then zero; reads are **256, 256, then three**. The actual expiry-index plan is present. A row limit caps deletions, not read work. The earlier mixed-scope cleanup counterexample and all other groups remain in the [closed receipt](replay-policy-candidate.json).

Across all successful metered groups, the final run has 607 statements, 644 reads and 1,211 writes, including fixture insertion. Four setup DDL statements, two query-plan statements and one deliberately failed statement are recorded separately. These totals describe the local final run; they are neither production costs nor totals across all development passes. No production query or site request is made.

## Acceptance and next iteration

The final native run makes 74 verification calls and accepts fourteen policy/boundary checks. It commits the retained-input, fixture, verifier, SQL and script digests. The independent Python comparison rechecks eighteen pinned source files and five dependency versions, then processes the same seven captured synthetic messages, two clock boundaries and four retained originals: twelve verified results and one expected expiry rejection. Its fixture digest matches the native run. That independently checks thirteen RFC outcomes; it does not implement or validate our SQL grouping algorithm, managed-provider behavior or all 74 native calls. Ten targeted audit/attribution tests, script syntax checks and article validation pass.

The article stays unchanged at 1,358 words/31 prompts. No build, activation, served-page or current-health claim is added. A production replay capability still needs capacity/admission bounds, stable scope and rotation, availability policy, retention/privacy treatment and production cost acceptance. Seen-before should add evidence without silently deleting delivered requests or being advertised as unique-action measurement.

Next: audit native operator/content-use propagation against its first-party trust model and our current collector. Current source has no `Forwarded`/`content-use` interpretation. Test absent, spoofed and conflicting claims before considering adoption. The broader [goal audit](current-goal-audit.json), newest-collector signed acceptance and human/device/privacy requirements stay open; no human trials are reopened.

The final private archive contains 53 captured files plus its manifest, 0700 directories/0600 files. Manifest SHA-256: `56065740524addeb6d8438a6fc2df48f0971bb722cc6f006d27cbeb9ae3b2996`. It includes the final explicit invalid-signature assertions and matching independent fixtures. The earlier 45-file snapshot and older archives remain unchanged. October 31 is a review date, not automatic erasure or a provider-wide retention guarantee.

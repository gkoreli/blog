# A request should carry its recorded verdict

October 27, 2026 UTC. The [organic Exa inspection](26-organic-exa-and-join-boundaries.md) found two stored verified outcomes and two retained request/storage-log pairs, but no deterministic invocation-to-row join. A time/path candidate match cannot fill that gap. This iteration adds a closed receipt to the existing successful storage log so future retained invocations can expose the verdict actually passed to persistence.

Human trials remain deferred. No human/device accuracy rate, raw diagnostic activation, new tracking identifier or historical backfill is added.

## Contract and implementation

[`observation-receipt.ts`](../../../../analytics/src/observation-receipt.ts) snapshots a limited projection of the same observation object passed to the insert, before its fields are serialized and bound. After persistence succeeds, the existing `analytics.observation_stored` log emits that snapshot beside its existing operationId and collection version. It does not rerun classification or signature verification.

The receipt keeps the reader kind, classifier profile, reviewed declaration candidates and agreement state; signature evidence/source/profile, outcome and closed reason set; reviewed signer display name, documented-origin status and signed-UA status; covered-component flags and expiry-only replay policy; and independent provider category/nullable bot booleans. Injected verification remains test-injected, with no authenticated signer or production coverage. Unreviewed cryptographic origins display as Other. No raw header values, addresses, URLs, nonces, signature/key material, daily client ID or row ID are added to these application logs. This does not remove source fields Cloudflare already retains in its own request context.

[`recordPageObservation`](../../../../analytics/src/db.ts) now requires `success=true` and `meta.changes=1` from the single-row insert before returning success. Other acknowledgements reject as `unacknowledged-insert`. They do not trigger an automatic retry. The legacy write-failed event remains the error channel; that reason means an unconfirmed write, not proof of no row. A thrown processing/persistence error also does not generally establish whether an earlier side effect committed.

**An acknowledged base event and optional diagnostic success are separate.** An optional diagnostic error is caught and preserves the base event/receipt. A still-pending optional diagnostic delays the existing persistence promise and receipt; the receipt is not a complete or immediate database ledger. No new deadline or guarantee for stalled optional writes is introduced. A stalled signature verifier already has a two-second deadline; its unavailable result can be stored and reported.

Collection advances to **2026-10-27.8** for the acknowledgement contract. Classifier `.5`, verifier `.6`, signature evidence `.4` and report/cache `.7` remain unchanged. There is no migration, new query, report scan or extra log-event type/count per successful observation. Existing attempt and stored events remain; the stored event carries more bytes. Privacy disclosure now names this linked operational subset and its separate provider-log/investigation-copy lifecycle. These facts are not anonymous; unresolved lawful-basis, routine-row retention and provider/export lifecycle questions are unchanged. Optional source diagnostics stay off.

## Native and adversarial acceptance

[Native receipt](observation-receipt-local.json), reproduced by [the maintained helper](../../../scripts/check-observation-receipt.mjs), runs the real collector, D1 and crypto in workerd. Fourteen synthetic conditions produce eleven stored rows and nine accepted receipts:

| Condition | Observed boundary |
|---|---|
| Two ephemeral real signatures | Actual crypto succeeds against substituted directories; one unreviewed origin displays Other, one reviewed-origin fixture displays Exa. Both retain the declared AI-search role and their actual component coverage. Neither is real Exa authentication. |
| Changed covered host | Invalid result is stored, without an authenticated signer. |
| Stalled directory | Existing deadline records unavailable and retains the eligible observation/receipt. |
| Unsigned, unrecognized provider category, referral-excluded control | Absent remains distinct; unknown category source text is discarded. |
| Injected verifier | Explicit test-injected outcome, null authenticated signer and null production coverage. |
| Thrown base write or negative acknowledgement without a write | No row and no receipt. |
| Negative/zero-change acknowledgements after actual insertion | A row exists, but no accepted receipt. No retry. |
| Optional diagnostic error | Acknowledged base row/receipt survive; diagnostic failure has its separate warning. |
| Ineligible API response | No collection attempt, row or receipt. |

The helper compares receipt fields with the actual stored JSON, checks matched operation references, private-error/category canaries and the [indexed prospective-control SELECT](observation-receipt-control.sql), including its positive fixture and window/index plan. The largest receipt in these selected fixtures is **722 bytes**; this is not a maximum for every declaration combination or a production cost estimate. Provider fields and directories are deliberately substituted, and the wrapper awaits captured background work for deterministic inspection. It is not the production routing or a native Cloudflare verification verdict. No external network or production request is used by this experiment.

Seven additional Node tests cover real signing with intercepted discovery, delayed acknowledgement, negative/missing/malformed/non-one-row results, before/after-write uncertainty, private error isolation, optional failure, injected outcomes and ineligible responses. Mutation checks confirm the projection snapshots arrays/coverage rather than retaining mutable references. An initial signing fixture used the wrong directory media type and correctly produced unavailable; correcting its fixture response restored the intended positive. Existing SQLite/test Worker adapters were updated to return D1-shaped acknowledgements rather than weakening the production check; the HTML Worker test now awaits its background write.

## Authoritative sources and their limits

| Primary source | Decision it supports |
|---|---|
| [Cloudflare D1 return objects](https://developers.cloudflare.com/d1/worker-api/return-object/) | `run()` supplies success and statement metadata, including change count. Exactly one changed row is our stricter contract for this single-row insert, not a universal D1 requirement. Fault-injected acknowledgement controls are not evidence of a production Cloudflare defect. |
| [Workers Logs: structured objects and invocation context](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) | Add a structured closed object to the existing message so a retained invocation can expose its actual application verdict. Log records, requests and stored observations remain different populations. |
| [Real-time logs and Wrangler tail](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/) | Native JSON tail combines request context and console messages for prospective inspection. It can drop messages under load and is not persistent storage. Filtering and a configured sample are not complete-population proof. |
| [Existing signature decision](../../../../../docs/adr/0016.11-signature-verification-evidence.md) | Keep signatures, declared roles, native facts, public names and human triggers separate. The new receipt transports existing facts rather than granting new trust. |

## Delivery and next acceptance

Source checks pass 163 analytics tests, 106 site tests, workspace types, 21 Markdown-post validation and an isolated 32-post build. The concise article links this capability in one sentence: 1,248 words and 31 original shaping messages. Automatic continuation text is not appended as a human prompt. The raw local receipts and provisional runs remain private; only closed aggregates/source commitments are published.

Next: push the checked source, confirm activation, observe one referral-excluded unsigned control through Wrangler's native JSON tail, and compare the guarded stored fields with one pre-accepted indexed SELECT, at a fifty-read ceiling. Keep that selected positive control distinct from an organic signed vendor arrival. Confirm live privacy/article output separately. No new human trial window or optional raw binding is needed.

The stronger future claim requires a fresh organic signed invocation carrying its own receipt. That can establish the recorded verdict within the invocation; it will still not provide a historical row join, universal signature conformance, human intent, citation, complete native sampling or calibrated human/device accuracy. Replay and DNS/egress protection, provider receipt/loss attribution and linked-data retention remain open.

## Production acceptance — October 27 UTC

[Release receipt](observation-receipt-release.json) supersedes the prepared publication/control gates above. Source `9e3b613` has a native Ready build and 100% activation at 20:49:09 UTC. Current version metadata contains no temporary owner grant, calibration or optional raw-diagnostic binding. Verifier/classifier/report contracts remain unchanged.

One real unsigned /privacy request carries the reviewed referral-exclusion marker. Native Wrangler JSON tail contains its attempt and stored message in the same invocation with a matching operation reference and collection `.8`. The receipt records Other bot, no reviewed declaration, local absent, null signer/coverage, empty provider category and unavailable native booleans. Its Worker outcome is ok. The single pre-accepted indexed command-mode SELECT returns one matching candidate-cohort observation, agrees on the selected receipt fields and confirms no optional capture. It reports **six reads, zero writes, changes zero and changed_db false**, within fifty. No new row-identity join or fresh public-report/owner-exclusion acceptance is claimed; the stored marker and unchanged reviewed policy provide the exclusion basis.

The short native tail captures three successful observation invocations from the control and article/privacy checks. No verified signature record was captured; this is not evidence that no signed request occurred anywhere during the period. It was intentionally stopped with Ctrl-C (exit 1); no persistent tail or trial window remains active. Observation writes, tail/dashboard service work, publication inspection and other activity are additional to the direct SELECT. Raw request context, application operation IDs and provider data remain in the restricted archive.

Served article Markdown exactly matches the isolated build, and the browser accepts the new receipt link, 31 prompts and linked-log privacy disclosure. The article remains 1,248 words. The archive keeps provisional/final local controls and publication/tail/CLI captures under directories 0700/files 0600, with an October 31 copy review; no automatic or provider-wide erasure claim follows.

This closes unsigned production receipt acceptance and publication for this iteration. Next use a fresh retained organic signed invocation to inspect its own recorded local/vendor/native facts; do not promote the older two-row candidate match into a historical join. Human trials remain deferred. Native-method availability/agreement, replay, DNS/egress, collection-stage loss/sampling and privacy/retention remain open under the broader goal.

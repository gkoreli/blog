# Four current-verifier Exa proofs, from request to stored row

October 29, 2026 UTC. Continues [retained network evidence](68-network-receipt-retention.md). Human trials remain deferred by the owner. This investigation requests no new site observation and changes no runtime, classifier, schema, capture setting or article prose.

Four retained Exa-origin requests now have complete invocation → attempt → stored-receipt chains, exact D1 row matches and successful recorded-time verification under profile `2026-10-29.1`. This closes the current-verifier proof gate for this selected cohort. It does not close acceptance for the newest collector or establish a human trigger.

## Select records before reading the database

The native retained-log view initially returned zero verified results when restricted to latest collector `.29.3`. Removing that collector restriction returned four records with verifier `.29.1`. The settled selection was then frozen to **02:35:12.892–03:35:12.892 UTC**. These zeros and positives describe their query scopes; they are not population traffic or retention estimates.

The four-receipt download agrees with the stored copies in a second export selected by exact native request references. That export contains sixteen records: four invocations, four attempts, four stored receipts and four spans. All four request chains reconcile without duplicate references, incomplete joins or scoped export defects. Operational request headers were recoverable through retained provider logs; all four D1 `request_evidence` fields are null. Optional application capture being absent does not mean provider logs contain no request data.

Two requests use collector `.29.1`, two `.29.2`; all use receipt `.28.2` and the current verifier `.29.1`. Their actual execution Workers are `be225b66` and `71b6e9e6`. No selected request uses collector `.29.3` or its new network-receipt representation. Keep those acceptance gates separate.

The [fixed four-reference SELECT](current-verifier-storage.sql) retrieves contradictory status/version, exclusion and missing-evidence fields instead of filtering them away. Native D1 fixtures preserve four adjacent text IDs beyond JavaScript's safe-integer range, a contradictory verdict/version, missing evidence and an owner row. The primary-key plan costs eight reads, zero writes. A private five-file plan archive fixes one statement, one agent attempt, no retry and a 100-read review threshold before remote execution. That threshold is not a provider execution cap.

The single Wrangler `--command` execution returns four rows at **eight reported reads, zero writes and one reported attempt**. All four stored projections match their acknowledged receipts. Provider query/export work has separate unreturned costs; this is not account-wide daily budget accounting.

## Verify the proof and test its boundary

The Exa directory was freshly captured at **03:37:50 UTC**, HTTP 200, two keys, declared signature-directory media type. Its bytes and reviewed URL are checked before replay. This later key capture cannot recover the resolver snapshot used by the original Worker.

Using the recorded invocation times, our Node verifier, actual local workerd Request/crypto and the independently pinned Python implementation agree on twelve distinct offline contexts:

| Change to each of four requests | Local/verifier result | Independent RFC verifier |
|---|---|---|
| Original retained inputs | Verified | Verified |
| Change signed authority | Signature invalid | InvalidSignature |
| Change unsigned User-Agent and path | Verified | Verified |

No mutated request reaches production. Workerd and Python each ran twice; the second pass explicitly binds their outputs to the same frozen twelve-context input digest. These are repeated execution checks, not twenty-four distinct trials per engine. The Python source pin is `1de433d9a49fd608475c6054ab14a1652c088844`; eighteen source files and five dependency versions are rechecked. It supplies independent RFC cryptography, not independent Web Bot Auth discovery, provider verification or publisher authorization.

All four original proofs cover authority and have five-minute validity windows. User-Agent, method, path, query and target URI are unsigned. Exhaustive candidate audits find one valid eligible candidate per request with none unassessed. Replays agree with stored coverage and selection; timing-derived age can differ by a second because invocation and collection clocks are distinct. Complete receipt/storage equality is established separately, rather than claiming byte equality with a newly timed verification result.

The bounded reuse audit finds four distinct verified proofs and four distinct usable nonces, with zero repeated-proof or repeated-nonce groups. It performs no enforcement. This selected set cannot measure global replay rates, distinct actions or unique readers.

## What the documentation permits us to claim

[Exa's crawler documentation](https://crawler.exa.ai/) distinguishes ExaSearchBot indexing/search from user-requested ExaUser fetches and documents its signing directory. These four declarations are ExaSearchBot; none is ExaUser. A verified origin supports publisher attribution, while the unsigned declaration leaves per-request purpose unauthenticated. The documented provider auto-validation capability does not supply a request-level native verdict here: both native boolean fields are unavailable, while the separately recorded provider category is Search Engine Crawler.

[RFC 9421 §3.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.2.1), [insufficient coverage](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) and [replay](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.2) distinguish mathematical verification from application requirements. The [pinned library guidance](https://github.com/pyauth/http-message-signatures/blob/1de433d9a49fd608475c6054ab14a1652c088844/README.rst) likewise places authorization/replay decisions with the caller. An authenticated signer is useful evidence; it does not turn every unsigned request property into an authenticated fact. Source URLs, capture hashes and reproducible analysis are in the [closed acceptance record](current-verifier-cohort.json).

## Acceptance and remaining work

The [offline analyser](analyze-current-verifier-cohort.mjs) binds the exact chains, D1 references, reviewed directory and twelve replay inputs. Three negative runs reject a wrong row reference, a mismatched input digest and an unreviewed directory, without writing accepted output. Twenty-four targeted reconciliation/audit/reuse tests pass. The article remains 1,358 words/31 prompts; no new served-page, deployment-activation or current-health claim is made.

The older 52 `.28.7` outcome-only records remain unrecovered; these four different requests do not repair their missing proofs. Newest-collector signed acceptance, managed-provider verdict comparison, R1 attribution, human/device/RUM measurements and privacy/retention work remain in the [goal audit](current-goal-audit.json). Next: native-test candidate replay policies offline, including their cost and false-positive boundaries, before proposing production enforcement. Do not silently equate an application nonce cache with proof of unique human activity.

The separate private archive preserves 48 captured files plus its manifest, 0700 directories/0600 files. Manifest SHA-256: `cb42083b12b7d6442ecd6becec0806612116d92d525df707606f1a0dec89a4a8`. The five-file pre-execution plan archive stays immutable. October 31 is a review date, not automatic deletion or provider-wide erasure.

[Research 70](70-replay-policies-atomicity-and-cost.md) tests candidate atomic replay state, cross-Worker scope, retry/unsigned-context counterexamples, expiry retention and local metered cost. It activates no production store or rejection policy.

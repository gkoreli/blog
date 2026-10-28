# A selected signature does not establish the only signer

October 27 Pacific / October 28, 2026 UTC. Continues [exact signed links 38](38-signed-observations-and-exact-row-links.md), [the attribution controls](24-webbotauth-attribution-boundaries.md), [the reference execution](37-reference-vectors-and-request-context.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). Human trials remain deferred.

## The missing fact

Our verifier tries paired `Signature`/`Signature-Input` members tagged `web-bot-auth` in input order and stops at its first valid proof. That proves the selected components against one key. It does not establish that the remaining candidates fail, that the selected origin is the only valid signer, or why the request occurred. Earlier coverage evidence omitted how much of this candidate set was examined.

This is an attribution/visibility limit, not a newly discovered cryptographic bypass or evidence that Exa supplied conflicting signatures. [RFC 9421 §4.3](https://www.rfc-editor.org/rfc/rfc9421.html#section-4.3) allows several signatures, including different signers and intermediary uses. Its [multiple-signature considerations](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.6) require care about application context; they do not prescribe one universal selection policy.

## Independent controls and an executable reference

The [fixture](../../../../analytics/test/fixtures/signature-selection.mjs) generates two ephemeral Ed25519 keys. It constructs the signing bytes and RFC 7638-style key IDs without our base builder. WebCrypto checks both original signatures and deliberately flipped negatives before the experiment. All directories are intercepted fixture origins; no vendor private key, external discovery, production request or human label participates.

The [before capture](signature-selection-before.json), run against the previously compiled profile `.1`, verifies eight controls without selection facts. The repaired result preserves that policy and selected origin:

| Control | Matched / tagged / attempted / unassessed candidates |
|---|---|
| One paired proof | 1 / 1 / 1 / 0 |
| Two valid proofs | 2 / 2 / 1 / 1 |
| Reverse the two valid input members | 2 / 2 / 1 / 1; another origin is selected |
| Invalid first proof, valid second | 2 / 2 / 2 / 0 |
| Valid first proof, invalid later proof | 2 / 2 / 1 / 1; later invalidity is not examined |
| One matched proof has an unrelated tag | 2 / 1 / 1 / 0 |
| Unpaired input or unpaired signature, two separate controls | 1 / 1 / 1 / 0 |

“Matched” means a label exists in both parsed dictionaries. “Tagged” restricts those pairs to this protocol. Unpaired members and unrelated tags are not counted as unassessed Web Bot Auth candidates. None of these quantities counts valid signers. Zero unassessed candidates does not prove one person, one action or an authenticated role.

[The maintained probe](probe-signature-selection.mjs) executes Cloudflare's pinned generic `verifySignature` API at [commit `e4d3167`](https://github.com/cloudflare/web-bot-auth/blob/e4d3167886d0e7508d55fc5c501f1e498a3d4f5c/packages/http-message-sig/src/core.ts). It runs default and two explicit labels across all eight cases: **24 calls**, with actual WebCrypto verification. The [saved comparison](signature-selection-reference.json) shows default `LabelRequired` for the two-valid case and successful explicit verification of both proofs. The reference rejects mismatched label sets; our existing policy ignores unpaired members. Its generic API does not enforce our protocol-tag or directory policy. These are documented differences, not equivalence to native Cloudflare production.

The executed module hash matches [the earlier pinned source/parser manifest](reference-components-sources.json). No dependency, lockfile or upstream implementation is added to the runtime. We borrow the distinction between selecting a proof and describing the whole message, while preserving our explicit first-valid policy.

## What changes prospectively

Coverage evidence `2026-10-28.1` adds the fixed policy and four counts above. The outer verification envelope remains `.5`; its versioned coverage child changes. Collection and verifier profiles become **`2026-10-28.2`**. Classifier, schema, directory trust, algorithm support and selection behavior remain unchanged. No extra verification/discovery loop is introduced.

Selection-bearing storage receipts use `2026-10-28.1`; earlier/unsigned projections keep receipt `.3`. Both [exact-row reconciliation](reconcile-receipt-storage.mjs) and [live/retained comparison](compare-receipt-captures.mjs) understand these versions and compare the new scalar counts. Old captures and results stay unchanged. Unsupported shapes still cannot supply accepted comparisons.

[The report validator](../../../../analytics/src/signature-selection.ts) checks the version, policy, source/outcome, integer types, bounds and count arithmetic. Public API/UI separate recorded assessments, missing historical assessments and unrecognized assessments. Two overlapping counters report **events** with several tagged candidates and with candidates left unassessed. Injected results cannot enter the recorded group. These groups partition detailed locally verified events; they do not reconstruct candidate facts for outcome-only history. Cache/report version becomes `2026-10-28.1`.

The privacy page describes the additional derived counts and the successful-log projection. No raw signatures, nonces, labels, key IDs, extra reader identifiers or diagnostic capture are added. The concise retrospective gains one linked sentence and remains **1,257 body words / 31 shaping prompts**.

## Native persistence and report acceptance

[The native helper](../../../scripts/check-signature-selection.mjs) runs the actual local workerd collector, WebCrypto and D1. Eight controls plus one referral-excluded control produce **nine exact receipt/row matches**, with only two intercepted directory fetches. Optional raw evidence is absent. These are synthetic controlled requests, not organic vendor traffic or malformed production ingress.

One historical snapshot, three deliberately malformed assessment snapshots and one injected snapshot exercise reporting separately from those executions. The [native receipt](signature-selection-local.json) records thirteen included events, one exclusion, twelve locally verified snapshots, eight recorded assessments, one historical absence, three unrecognized assessments, four events with several tagged candidates, three with unassessed candidates and one injected event. The locally verified denominator reconciles exactly; malformed/absent facts do not become measured zero candidates.

On that same native fixture, the old and new complete report each execute one statement costing **7,665 metered reads / zero writes**. Added reads are zero for this fixture, not a production cost guarantee or a latency result. The cost baseline is compiled from source `0e228dc`; an initial temporary compile lacked TypeScript loader configuration and was corrected before native execution.

[Source checks](signature-selection-source-checks.json) record the full analytics/site/type checks, isolated build and link validation. [Release acceptance](signature-selection-release.json) records source delivery and measured production acceptance separately. Source tests, a native local experiment and a Ready deployment are different claims.

## Remaining work

The system still does not enumerate all valid signers or authenticate an unsigned role/human trigger. Remaining candidates may succeed, fail or be unavailable. A future complete assessment needs its own bounded resolver/deadline policy; a timeout must not masquerade as exhaustive verification. No genuine multi-signature production population, provider cryptographic agreement, DNS/egress safety, replay uniqueness or human error rate is established here.

Next bounded work is an actual signed current-profile assessment, or a separately designed bounded complete-signer experiment. Do not synthesize vendor identity or repeat broad history scans to replace missing production evidence. Human trials stay deferred. The dedicated protocol article remains proposed, and the wider goal stays open.


## Production acceptance

[The release receipt](signature-selection-release.json) records source `610841a`, a Ready/100% deployment and one ordinary unsigned referral-excluded integration request. Thirteen closed receipt/storage facts match at one exact D1 read/zero diagnostic writes. The control retains unavailable coverage and no selection assessment, as expected; it does not prove signed production persistence. Optional owner-grant, diagnostic and calibration bindings remain absent in that version. The filtered tail is stopped.

The `/privacy` seven-day report exposes all five new fields and returns identical MISS/HIT bodies with unchanged calculation time and expiry. Its twelve included events contain one outcome-only Ahrefs signing record and zero detailed locally verified records. Therefore zero new assessments do not mean no signed history. This live observation prompted a copy-only denominator clarification in source `edebbcf`, separately accepted Ready/100% and visibly rendered. No whole-history requery is performed; filtered HTTP report metering is unavailable and is not folded into the one-read direct SELECT claim.

The served article exactly matches the checked Markdown build and visibly links this learning. A preliminary request with the default Python client received HTTP 403; the established truthful publication-verification client returned matching HTTP 200 content. The first response body was not saved, so its cause is unestablished. Neither status is silently treated as a successful page count or attributed to a provider rule without evidence.

Private sources, check logs and release captures are preserved outside Git at `~/.local/share/gkoreli/analytics-evidence/2026-10-28-signature-selection/`, with mode 0700/0600 and a hash manifest. October 31 is an investigation-copy review target, not a provider-wide erasure guarantee. No human trial, rule change, new permission, optional raw activation or owned preview is introduced.

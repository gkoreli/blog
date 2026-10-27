# Client-form claims and matched calibration — October 27, 2026 UTC

Continues [TASK-0119](../../../../../docs/tasks/TASK-0119.md), [TASK-0120](../../../../../docs/tasks/TASK-0120.md), [the protocol review](18-webbotauth-verification.md), [published-IP methods](21-published-vendor-ip-methods.md) and [ADR-0016.15](../../../../../docs/adr/0016.15-client-form-claims.md). The question is what our device chart actually knows, and how the newer classifier behaves on the same independently labelled request inputs.

## The old default was a conclusion without evidence

`classifyDevice()` formerly returned desktop whenever its mobile/tablet regular expressions did not match. Unknown clients, command-line fetchers and many bots therefore became desktop. Android without Mobile became tablet; Silk alone could also trigger tablet. Those are heuristics, not authenticated devices. Renaming an unknown to desktop makes a report look more complete while losing the distinction that matters.

The canonical replacement is `clientFormEvidence()` in [`client-form.ts`](../../../../analytics/src/client-form.ts). It reuses the reviewed lexical product parser instead of adding substring guesses. Seven closed outcomes distinguish mobile/tablet markers, incompatible phone/tablet markers, mobile/non-mobile preferences without markers, a recognized browser without form markers, and unknown. Hint absence and unsupported syntax remain separate. `iPad` plus its common `Mobile` compatibility marker stays a tablet marker, not an invented conflict. A mobile marker plus non-mobile preference is a retained difference between indicators; the two express different things and do not establish an invalid request.

## Primary sources and borrowed ideas

Checked October 27, 2026. These sources explain semantics; they do not authenticate the hardware that sent a particular request.

| Source | Consequence for this implementation |
|---|---|
| [MDN: Sec-CH-UA-Mobile](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Mobile) | `?1` and `?0` describe mobile-experience preference; supporting browsers can send this low-entropy hint by default. Absence does not prove a client type. |
| [WICG UA Client Hints §3.7](https://wicg.github.io/ua-client-hints/#sec-ch-ua-mobile), Draft Community Group Report, October 26, 2026 | A preference bit is not a desktop/phone attestation. This is not a W3C Standard or Standards Track document. No Accept-CH or high-entropy request is added. |
| [Chromium UA reduction](https://www.chromium.org/updates/ua-reduction/) | Compatibility formats reduce platform/model detail. An empty mobile compatibility marker can occur for desktop or tablet; Android alone cannot settle that distinction. |
| [MDN: UA detection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Browser_detection_using_the_user_agent) | UA and operating-system heuristics are fallible. Record the marker/claim and its absence, rather than promoting them into hardware proof. |
| [Matomo DeviceDetector.php](https://github.com/matomo-org/device-detector/blob/626e717a107b6061a9fef1f7f0feeadc6c81b0f4/DeviceDetector.php), commit `626e717a107b6061a9fef1f7f0feeadc6c81b0f4` | `getDevice(): ?int` and `getDeviceName()` preserve an unresolved device; desktop/touch/tablet inference has explicit rules. Borrow unknown and inspectable assumptions, not a claim that the parser authenticates hardware. Source SHA-256 `70a2ca0164aac9bd06104f0a7f2405927d5d268c04fd57c79bc98d2b9559df75`; LGPLv3+ header checked, no source/regex corpus copied or dependency installed. |
| [Cloudflare D1 foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/) | D1's implicit transactions and enforced constraints matter when considering table rebuilds. We choose an additive evidence column; this source is not a claim that every schema change is impossible. |

## Persistence and reporting

[Migration 0015](../../../../analytics/migrations/0015_client_form_evidence.sql) adds nullable valid JSON capped at 1,024 bytes. The old three-value column stays as a deprecated compatibility heuristic, with its default flag explicitly retained in new evidence. Historical rows are not stamped or reclassified. Current reporting uses the new claims; old values become labelled historical heuristics.

The API deliberately replaces `byDevice` with `byClientForm` and `{form, views}` rows. `clientFormEvidence.recordedViews`, `historicalViews` and `unrecognizedRecordViews` partition the selected total. Unrecognized/future evidence profiles do not become current records or get silently discarded. Unsupported hints, differing indicators and legacy defaults are overlapping diagnostic subsets. This same-population aggregation reuses the existing report statement; no metered-read reduction is inferred from statement count.

The dashboard replaces physical-device icons/percentages with labelled claim counts for every traffic filter. Collection/classifier and report profiles become `2026-10-27.5`; the independently delivered verifier remains `.4`. /privacy describes the new linked derived facts and legacy field. No raw diagnostic activation, added device probe, vendor fetch or extra hint request accompanies this repair. Existing linked-row retention and collection-basis questions remain open.

## Evidence and what it changes

[R1 replay](r1-client-form-replay.json) uses the same retained 381 requests, SHA-256 `e4c9446c2d143c5a1893fce8654e19e1ea3d985f9437d1a9167834ef24eecf66`. The earlier heuristic emits **355 desktop / 26 mobile**. The new claims are **181 non-mobile preference / 174 recognized browser without form markers / 26 mobile marker**. The 355 defaults therefore do not establish 355 desktop devices. Traffic classification stays 118 Unresolved / 263 Browser; operator, physical hardware, original eligibility and the native/D1 population discrepancy remain unresolved. No production SQL or historical rewrite is used for this replay.

[Native local acceptance](client-form-local.json), produced by [the helper](check-client-form-local.mjs), runs the actual collector and workerd D1. Ten synthetic UA/hint/ASN cases cover unknowns, preference-only claims, exact markers, iPad compatibility, phone/tablet conflict, differing indicators, unsupported private canaries and reduced Android without Mobile. Three old rows stay null after migration. Thirteen included rows reconcile across the new report; owner/referral exclusions, empty output, byte budget, optional-capture absence and the [narrow control SELECT](client-form-control-acceptance.sql) pass. These fixtures validate handling, not physical-device accuracy.

[Twenty-four executed stage trials](../edge-vs-rum/07-matched-classifier-calibration.md) compare a pinned earlier classifier with the same live request inputs. Twelve earlier Browser results become Unresolved when network evidence is missing. Three known automated browser visits with injected unlisted-ASN evidence still match Browser. Among 21 stored known-automation controls, an explicitly evaluation-only operator mapping makes six automation decisions and fifteen abstentions; three injected storage failures stay outside that classifier denominator. There are no human-operated controls, so human false-positive rates remain unmeasured. This is a selected local experiment, not a production prevalence estimate.

## Article and next acceptance

The existing retrospective keeps its central question: how correct request totals can still mislead a publishing decision. The reader gains a concrete default-to-unknown example and the latest matched experiment; Goga's work supplies the implementation, measured counterexamples and remaining questions. Title, stable URL and discovery intent stay unchanged; no search-demand or ranking claim is introduced. The original shaping prompts remain intact; automated goal continuations are not appended as human prompts. The article stays within the requested five-to-six-minute format.

Local acceptance, source push, migration application, activation and actual Worker writes must remain separate. Next: apply only migration 0015, publish the checked source, accept excluded prospective form controls and the live API/UI/cache/article. Then prepare an excluded production stage experiment and independently labelled human, JavaScript-off and real-device controls. No current result establishes a complete human count or closes either task.

[Source checks](client-form-source-checks.json) pass 129 analytics tests, 106 site tests, workspace types, native local D1, 265 relative references and the isolated 32-post build. The article is 1,248 words with one H1 and 30 original shaping messages. The preserved stage report rechecks against all seven executed-source hashes. A harmless sandboxed mise config-tracking warning did not prevent the build.

[Pre-release receipt](client-form-pre-release.json) records migration 0015 as the only pending migration and its successful application before source publication. Migration bookkeeping is separate database work; this step runs no direct production report SELECT. Source push, activation and prospective acceptance remain to verify.

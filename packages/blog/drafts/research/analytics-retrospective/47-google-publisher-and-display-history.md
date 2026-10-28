# Google publisher visibility without rewriting receipt history

October 27 Pacific / October 28 UTC. Follows [the documented-method extension](46-documented-method-extensions.md). The previous turn delivered source, activation and served-content evidence. Human trials remain deferred.

## A missing label was a separate gap

The Google-Agent method already compared a selected local proof to Google's documented origin. Google still appeared as Other in public signer totals, and its directory had no reviewed-publisher association. We now add the exact `https://agent.bot.goog` origin to both catalogues, scoped to Google-Agent for the declaration association. Google's [primary guide](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth) explicitly names that identity and directory; [the saved directory capture](45-goal-and-method-coverage-audit.md) contains five Ed25519 keys. This review does not freeze those keys, broaden generic proof trust or assign the identity to Gemini Notebook.

The three facts remain separate: a documented per-client signing method, a reviewed first-party key publisher and an approved public display name. Unsigned Google-Agent remains not-verified; competing Exa/Google declarations remain conflicting. A Google-origin proof with no matching declaration can receive a Google signer label without authenticating the claimed product or purpose. Reviewed-publisher history keeps its recorded assessment.

## Display changes need history too

A public label is a projection, not a stored cryptographic fact. Adding Google changes today's report display for any retained verified outcome at that origin, including outcome-only history. It must not change what an old receipt originally said.

Tests exposed that the receipt reconciler assumed the old directory profile and its projection used today's signer catalogue. Without a deliberate repair, new publisher records would be unprojectable and a previously Other-labelled Google receipt would appear different after a display update. The documented-origin conflict status and collection `.7` also needed admission in the closed offline reconciler.

New receipts use version `2026-10-28.2` and record signer-display profile `2026-10-28.1`. Catalogue entries retain their approval profile. Historical `.27.3`/`.28.1` receipt comparisons use the previous display catalogue, where Google remains Other. The current report uses Google's reviewed label. This preserves the difference between an updated report label and an exact historical receipt comparison.

Directory assessment `.27.1` pairs only with review date October 27; `.28.1` pairs only with October 28. Both remain readable. Hybrid dates/profiles and unknown versions cannot inherit reviewed status. Missing coverage, competing publishers, partial mappings and injected results retain their existing separate states. A display profile is not a new signature verifier profile.

## Native and historical controls

[Native results](google-publisher-local.json) from [the maintained collector check](../../../scripts/check-observation-receipt.mjs) execute the actual collector, workerd and local D1 with generated keys supplied through intercepted directories. Twenty-nine controls yield twenty-four acknowledged receipts. Four new cases cover a Google-origin proof, competing Exa/Google publishers, partial Google/Gemini mapping and unsigned Google-Agent. Three scoped native reports show Google as the signer while preserving matching-publisher, conflicting-publishers and partial-mapping respectively.

The checker also reuses twelve saved local rows and their actual earlier fixture receipts from research 46. All twelve reconcile exactly after the catalogue change. Provider pair metadata is deliberately constructed for this offline fixture check; it is not an authentic Cloudflare log/row join or a new vendor action. Unit controls cover both legacy receipt versions, current stamps, invalid stamps, legacy directory date pairs and rejected hybrids. Generated-key positives do not authenticate Google.

Analytics 230/site 106 tests, workspace types and helper syntax pass. Native report and receipt controls remain distinct from production activation. Existing optional capture bindings are not enabled; no schema, classifier, cryptographic policy or dependency change occurs.

## The native guides disagree on the wire form

The [Google guide](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth), updated October 13, specifies the `g` dictionary member and matching signature label. The [Cloudflare integration guide](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/), updated October 8, describes an older structured-string profile and explicitly lists later dictionary forms among rejected inputs. [Two fresh HTTP-200 source commitments](google-publisher-doc-sources.json) preserve the pages behind this comparison.

This is a documented compatibility question, not proof of a current Cloudflare production defect. Our application's generated-key workerd verification is not the managed native verifier. Google recommends provider support and fallback verification, but neither guide proves what our account's managed verifier did to a real request. The existing unavailable native booleans cannot be treated as false or filled from our own result. A real paired request/native verdict or an appropriately registered controlled native test is still required. No bot registration, rule, credential or permission change is made here.

The Cloudflare guide also distinguishes directory registration from request proof, and documents expiry-based replay protection without a seen-nonce database. That reinforces the existing separation of origin, covered components and a unique initiating action. We do not adopt a stronger uniqueness claim from the public signer name.

## A failed production read is missing evidence

[The maintained recent-evidence query](recent-methods.sql) is aggregate-only and bounded to a fixed interval starting at the previous deployment, 02:51:51 UTC. [Native SQL controls](google-publisher-recent-local.json) accept its time index, boundary exclusions, closed numeric fields and all-stored-row scope. Its reviewed 5,000-read threshold is post-execution review, not an enforced D1 cap. Owner/referral-excluded records intentionally remain in this diagnostic scope; it is not public readership.

[One Wrangler command-mode attempt](google-publisher-recent-production.json), through 02:59:52 UTC, returns API authorization error 7403. There is no result or metering. Counts and reads/writes remain null; this is not zero traffic, a quota verdict or evidence that current-profile proofs are absent. The existing OAuth metadata lists D1 scope and unexpired access, but that does not establish service authorization. The query is not retried and permissions are unchanged. Current production proof persistence remains unmeasured by this attempted query.

## Delivery and next work

Collection becomes `.28.8`, directory review/display profiles `.28.1`, receipt `.28.2`, and report/cache `.28.3`. The documented-method and IP profiles, classifier `.27.5`, verifier `.28.6` and stored historical records remain unchanged. The catalogue now has three reviewed publisher origins/five associated declarations and four public display approvals; per-declaration method coverage remains 13 of 48. The retrospective adds one linked sentence about differing provider guides and retains its human/vendor uncertainty and 31 prompts.

[Release acceptance](google-publisher-release.json) matches source `590f646` to a native Ready build (39 seconds) and Wrangler's 100% activation at 03:04:19 UTC on Worker `e1c22f11-287c-4f07-b089-5da11862e22e`. The served article/client match the isolated build and the HTML shows Google's reviewed publisher. Optional capture/grant/calibration bindings remain absent.

A first tail session ended before its publication fetch, so that fetch establishes only delivery. A corrected persistent-terminal session was confirmed live and captured two exact-version invocations. A direct `.md` alias produces no analytics logs. The canonical URL negotiated as Markdown returns identical body bytes and emits one stored receipt with collection `.8`, receipt `.28.2`, signer-display `.28.1` and directory profile/review date `.28.1`/October 28. It includes an exact returned row reference. The signature is absent and signer none. This acknowledges one ingestion; it does not replace independent D1 readback or authenticate Google.

The route distinction is deliberate in `eligibility.ts`. Research 46 had incorrectly called its direct-alias GET eligible. Its release now records zero eligible publication probes with an explicit prior-value correction; its text links the correction. Five HTTP GETs in this iteration comprise two direct aliases, one eligible canonical negotiated request and two ineligible dashboard assets/pages. Referral exclusion was supplied on the canonical control; its exact public exclusion is not independently read back. Normal ingestion/tail/provider costs are additional to the failed diagnostic attempt. The owned filtered-tail group was validated and stopped; its process handle is terminal.

[Checks and commitments](google-publisher-checks.json) retain the local/source boundary. Source delivery, isolated build, deployment activation and served output are recorded separately. Private raw captures, SQL plans, error responses and fixture rows are preserved in the restricted `2026-10-28-google-publisher` archive (48 files plus a hash manifest and one prior-fixture reference), outside Git. October 31 is a review date, not an automatic erasure promise. Next: investigate the D1 authorization failure through read-only service metadata before considering another SELECT, and design a real native-verifier comparison. Human/device trials remain deferred; genuine Google proof, population accuracy, replay uniqueness and privacy/retention decisions are still open.

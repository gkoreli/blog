# AI site audit: article, tool and limited API

Started November 5, 2026 Pacific / November 6 UTC. The owner requests a substantial article and a tool inspired by the supplied X post, using the existing analytics capability, DDD principles, an ADR and a possible five-to-ten-use free daily API, within three hours. The full human shaping message is in the [prompt record](../../../prompts/ai-site-check-evidence.prompts.md).

This is a separate bounded delivery from the concurrent [detection work under TASK-0119](../../../../../docs/tasks/TASK-0119.md). Existing provider measurements are reused with their original conditions; no new detector-accuracy or provider trial is implied.

## Acceptance and current state

| Requirement | Evidence required | Current acceptance state |
| --- | --- | --- |
| Understand reference | Official oEmbed/post context and linked product inspection | Root resolved Exepal `/check`; [source ledger](01-source-and-claim-ledger.md) records limits |
| More informative public URL audit | Versioned report and visible evidence for policy, responses, initial HTML, discovery and synthetic probes | Accepted: 26 policy tokens, eight resources, source metadata/discovery and visible fixes; fresh own-site and external checks pass |
| Existing analytics capability | Current-request endpoint preserving independent dimensions | Accepted: current-request endpoint and closed public projection; independent signature/network/native fields |
| Free limited API | Atomic shared ten/day address quota, UTC reset, burst limit, failure semantics, API documentation | Accepted: native concurrent admission and current production sequence ten through zero, then daily 429 |
| DDD and ADR | Package/context boundaries, pure parsers, explicit adapter, rationale and alternatives | [ADR-0020](../../../../../docs/adr/0020-evidence-led-ai-site-check.md) authored |
| Substantial article | Useful first 50 words, claims/sources/limits, exact prompt, API examples | [Article](../../../posts/042-ai-site-check-evidence.md) published and audited against final API/limits; live transport failure and repair retained |
| Checks | Relevant package tests, typecheck, validation, isolated generated HTML/Markdown inspection | Accepted: 401 analytics, 366 blog, 29 audit tests, both native harnesses, typecheck, validation and isolated build |
| Delivery | Scoped main commit/push, actual deployment association | Delivered on main; source-linked build and 100% Worker allocation accepted |
| Served acceptance | Current tool/API behavior, quota behavior, synthetic provenance and page availability | Accepted: fresh served pages/API/form, two URL audits and actual shared daily exhaustion |

## Working boundaries

The isolated checkout is `/private/tmp/ai-site-audit-20261106/checkout`, based on committed main at task start. Preserve unrelated staged guidance, analytics and newsletter work in the main checkout. Do not build into another session's active `dist/`. Use the repository's personal identity and scoped staging.

The quota table's no-URL/no-raw-header contract is separate from Cloudflare request logging and ordinary analytics. Private captures and logs stay outside Git. Public receipts should retain methods, conditions, counts, versions, results and limits.

## Editorial checkpoint

The article focuses on what a site operator can determine and fix from a public page assessment. It uses the author's November 5 controlled provider findings, links the earlier study as the concrete basis, and keeps access, source selection and answer fidelity distinct. It contains no invented new trial, deployment result, adoption count or score calibration.

The selected title promises a crawl/access inspection, with the first paragraph narrowing it to this checker. Candidate framing around an AI-readiness score was rejected because the evidence does not calibrate such a score. Search/discovery routes such as robots debugging and AI crawler access are reader-task hypotheses, not measured query demand.

Next bounded action: finish code/tests, audit article statements against the final contracts, inspect the generated page and representations, then record code delivery, activation and fresh acceptance separately here.

## Local acceptance and quota schema delivery

November 6 UTC: the isolated implementation passes workspace typechecking and Markdown validation. The site-audit package has 29 passing domain/transport tests, including hostile redirects, private/mixed DNS, shared request budgets, noncooperative fetch/stream timeouts, RFC path cases and a >100,000-tag HTML regression. Four UI tests cover the no-JavaScript form/SSG insertion slot, nested response validation, target XSS and an actual enhanced form submission. The initial full blog suite passes 246 tests; analytics passes its existing 397 tests plus four new current-request/admission-boundary tests. Final integration checks follow the latest main source before release.

The native Miniflare/D1 acceptance harness exercises the atomic quota with thirty simultaneous calls: exactly ten allowed and twenty rejected. HTTP checks cover a second UTC day, independent addresses, form rendering/escaping, shared request assessment, malformed/oversized/cross-site inputs and failure behavior. Commands: `pnpm typecheck`, `pnpm -C packages/blog validate`, package suites and `pnpm -C packages/blog test:ai-check`. Loopback permission is required by Miniflare in this sandbox; no external request is allowed by the native fixture.

The quota-only migration was applied after a metadata check and native D1 acceptance. Four production statements inspected the two schema objects, created the table/index and inspected them again: initially zero matching objects, finally two. Statement meters total **97 rows read and three rows written**, including DDL accounting. No observations, diagnostics, newsletter rows or raw request records were read. Migration source: [0001_ai_check_quota.sql](../../../migrations/0001_ai_check_quota.sql). Table installation is separate from Writer activation and served acceptance.

A new privacy test exposed a raw signer URI in the reader-kind reason for the unsigned-name signed-agent fallback. The public request assessment now returns a closed reason marker and reviewed signer display; it does not publish that URI. This projection change leaves stored analytics semantics intact.

Code delivery, active deployment and fresh public acceptance remain pending at this checkpoint. Browser screenshots remain unavailable because local computer/browser access is disabled; SSG and native DOM tests are the UI evidence presently available.

## First activation and native transport correction

Source `8b8f5bcad0f2578c2c4a34199c44f548e36aa8c8` activated through source-linked build `52fb68a7-6428-4107-945f-632adfca9df9`; the served tool embeds both identifiers. Active Worker `690165b8-c93a-4d5d-85a6-12f83e9fec23` has 100% allocation, the public-fetch compatibility flag and both configured rate limiters. Fresh public reads accepted the tool, article, Markdown/prompt/client representations, schema, unsupported method and rejected private target. The request inspector consumed the first allowance (nine remaining).

The second admitted check exposed a failure: HTTP 200 contained an appropriately partial report with all eight resources `network-error`, status null and zero received bytes. HTML extraction was unavailable. Acceptance stopped there with eight daily checks remaining; no fresh positive site-audit claim was made. Direct CLI access to the fixed resolver returned DNS status zero, but that does not establish the Worker path.

A new native default-transport test reproduced the mechanism: workerd rejects `redirect: 'error'` before outbound I/O. The initial native HTTP harness had stubbed the complete audit; Node transport tests had supplied fetch implementations. Neither covered the production fetch option. The repair changes only the fixed DNS resolver request to manual redirect handling; its existing non-success check refuses 3xx without following them. The domain recommendation also asks for a direct-fetch/log comparison before blaming an unavailable robots response on the target site.

`pnpm -C packages/site-audit test:workers` now covers the actual default `analyzeSite` transport with an outbound fixture, no injected fetch/resolver: eight received 200 resources, sixteen DNS requests and eight target requests. It preserves the rejected option as a native negative control with zero outbound requests, plus a resolver redirect refusal. The 29 domain tests and typecheck pass. Raw exception logging used during local diagnosis was removed before commit `757cddf7`.

The correction must activate and pass fresh served checks before site-audit acceptance. Raw HTTP bodies/headers remain in ignored `packages/blog/worklog/ai-site-audit-20261106/`; they are not copied into Git. The admitted failed check counts under the documented quota policy.

## Accepted release behavior

The [normalized acceptance receipt](2026-11-06-acceptance.json) records successful source `8bb87df2400f5894e49232cc7f5ef601e663a04e`, build `b03de2cf-72c9-45d5-a552-d6f31553150b` and Worker `de69aa4e-9356-49c6-9187-a0676ae7aa2a` at 100%. Fresh tool HTML embeds that commit/build pair. The live tool, article, Markdown twin, prompt page, client bundle and API schema return their expected representations. Invalid private target/method cases are rejected before daily admission.

After the native repair, all eight resource checks on the provider-study page returned HTTP 200. The source parser counted 48,737 text characters; Markdown negotiation, sitemap and optional directory responses were observed. The no-JavaScript POST returned a full HTML report with preserved content-security policy and noindex. An independent RFC Editor page check received eight bounded responses, including the expected `llms.txt` 404, with 21,363 text characters. These are two real URL checks, not an all-site success rate or evidence that an AI provider visited or cited either page.

The production daily counter decreased exactly **9, 8, 7, 6, 5, 4, 3, 2, 1, 0** across the request inspector, failed admitted audit, repaired audits and HTML form. The next request returned **429**, remaining zero and the next UTC-midnight reset with Retry-After. The earlier failed audit was not silently refunded or omitted. The separate native test proves thirty concurrent operations admit exactly ten, and its second-day case verifies reset without waiting for production midnight.

A stronger initial burst expectation failed: a fourth quick request was admitted at the same observed Cloudflare location. The native limiter is local/eventually consistent; it is not the daily enforcement mechanism. API/ADR/article wording now states that boundary. No production burst-rejection guarantee is claimed.

Final local integration includes the concurrent campaign and social commits. Workspace types and validation pass; package results are 401 analytics, 366 blog and 29 audit tests. The default-transport native test verifies all eight resources, its historical unsupported-option counterexample and DNS redirect refusal; the separate 43-request HTTP/D1 harness verifies quota, input, origin, streaming, failure and HTML behavior. The configured isolated build was checked separately from the unconfigured later content snapshot. CI supplies public configuration in the active build; no secret or private environment file was copied into Git.

Implementation, source delivery, activation and current bounded acceptance are complete. Independent operator adoption, broad compatibility, real-provider access/citation trials and browser screenshots are not claimed. No further work is required by this task; an additional capability should begin from a demonstrated user need. Raw acceptance captures remain ignored under `packages/blog/worklog/ai-site-audit-20261106/`.

## November 6 hourly outreach after tools acceptance

The [tools design-study acceptance](2026-11-06-tools-design-study-acceptance.json) records the completed UI delivery and fresh served checks at 18:33 UTC. The subsequent 18:41 UTC authorized heartbeat published [five useful X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-06-1841.md), all canonically owner-verified, after confirming the separate posting chat was idle. Four new conversations received relevant source-text, robots-policy, partial-report and Gemini verification details; a new incoming question received a bounded answer about the dated Perplexity method. This distribution is separate from the article's frozen research evidence.

The run is complete at its five-reply ceiling. One later beacon clarification is retained in the receipt for context review and deduplication in the next authorized run. No Reddit write, traffic measurement, new provider experiment or extra scheduler was added; independent public visibility and adoption remain unmeasured.

## November 6 second hourly outreach, 19:42 UTC

After reconciling the completed UI work and idle separate posting chat, the authorized run published [five further X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-06-1942.md): two substantive incoming follow-ups and three new conversations. All five canonical owner views were verified. Exact text, source basis and timestamps are in the linked receipt; this distribution does not alter the article’s research provenance or reopen accepted UI work.

The run is complete at its five-reply ceiling. Ten replies are now recorded across the two hourly runs, separate from the original campaign’s historical baseline. Independent public visibility, traffic and adoption remain unmeasured; no Reddit writes, new provider experiment or scheduler change occurred.

## November 6 third hourly outreach, 20:41 UTC

After reconciling completed UI work and the idle separate posting chat, the authorized run published [five further X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-06-2041.md): one substantive incoming follow-up and four new conversations. All five canonical owner views were verified. Exact text, source basis and timestamps are in the linked receipt; this distribution does not change the article’s research provenance or reopen accepted UI work.

The run is complete at its five-reply ceiling. Fifteen replies are now recorded across the three hourly runs, separate from the original campaign’s historical baseline. Independent public visibility, traffic and adoption remain unmeasured; no Reddit writes, target audits, new provider experiment or scheduler change occurred. The next run should read new substantive notifications after reconciling state and receipts.

## November 6 fourth hourly outreach, 21:44 UTC

After reconciling completed UI work and the inactive separate posting chat, the authorized run published [five further X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-06-2144.md): one substantive incoming follow-up and four new conversations. All five canonical owner views were verified. Exact copy, source basis and timestamps are in the linked receipt. The Gcore documentation correction was checked against tagged source; the WordPress suggestion preserves this tool’s initial-HTML and accessibility limits.

The run is complete at its five-reply ceiling. Twenty replies are recorded across the four hourly runs, separate from the original campaign’s historical baseline. This distribution does not reopen accepted UI work or change article research provenance. Independent public visibility, traffic and adoption remain unmeasured; no Reddit writes, hosted audits, new provider experiment or scheduler change occurred. The next run should prioritize substantive responses after reconciling state and receipts.

## November 6 fifth hourly outreach, 22:48 UTC

After reconciling completed UI work and the inactive separate posting chat, the authorized run published [five further X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-06-2248.md): two incoming follow-ups and three new conversations. Every canonical owner view was verified. The linked receipt preserves exact text, timestamps and source basis. The prior Gcore documentation correction was independently checked in the current README after its maintainer reported the fix; no new runtime result is claimed.

The run is complete at five replies, twenty-five across the five hourly receipts, separate from the original campaign's historical baseline. This distribution does not reopen accepted UI work or change article research provenance. Independent public visibility, traffic and adoption remain unmeasured; no Reddit writes, hosted audits, new provider experiment or scheduler change occurred. Next: reconcile state and receipts, then prioritize new substantive responses.

## November 6 sixth hourly outreach, 23:47 UTC

After reconciling completed UI work and the inactive separate posting chat, the authorized run published [five further X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-06-2347.md) in new conversations. Every canonical owner view was verified. The linked receipt preserves exact text, timestamps, primary sources and limitations. Two local robots-policy cases were evaluated on the live playground before sharing it; no target fetch or hosted quota was used. mpgn's new acknowledgement closed the earlier comparison discussion without another reply.

The run is complete at five replies, thirty across six hourly receipts, separate from the original campaign's historical baseline. This distribution does not reopen accepted UI work or change article research provenance. Independent public visibility, traffic and adoption remain unmeasured; no Reddit writes, new provider experiment or scheduler changes occurred. Next: reconcile state and receipts, then prioritize substantive incoming responses.

## November 7 seventh hourly outreach, 00:46 UTC

After reconciling completed UI work and the inactive separate posting chat, the authorized run published [four further X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-07-0046.md) in new conversations. Every canonical owner view was verified. Exact copy, timestamps, source reads and limits are preserved in the linked receipt. No new substantive incoming response was found in the bounded initial notification view.

The run is complete at four: remaining search previews did not yield another distinct contribution, so no fifth reply was added. Thirty-four replies are recorded across seven hourly receipts, separately from the original campaign's historical baseline. This distribution does not reopen accepted UI work or change article research provenance. Independent public visibility, traffic and adoption remain unmeasured; no Reddit writes, hosted audits, new provider experiments or scheduler changes occurred. Next: reconcile state and receipts, prioritize substantive incoming responses, and do not carry over the unused slot.

## November 7 owner-directed builder replies

After the original chat completed and recorded round eleven, [five further project-specific X replies](../../social/ai-fetcher-browser-crawler-headers/builders-ai-site-check-2026-11-07.md) were published and canonically owner-verified. Goga explicitly requested this bounded continuation and the stricter project/history filter. It is separate from the seven completed hourly runs and does not reopen accepted UI work.

The receipt preserves exact copy, selection evidence, current source reads and limits. Two local-only robots fixtures on Quotable passed the observed cases; the remaining contributions are static findings or proposed mechanisms. No new hosted audit, provider trial, traffic/adoption measurement or scheduler change. This five-reply task is complete; reconcile shared receipts before future authorized outreach.

## November 7 eighth hourly outreach, 01:48 UTC

After reconciling accepted UI work, the completed owner-directed batch and the idle original posting chat, the authorized run published [two project-specific X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-07-0148.md). Both canonical owner views were verified. The linked receipt preserves exact copy, current source reads, selection evidence and limits. No new substantive incoming response was found in the bounded initial notification view.

The run stops at two because only two contributions met the evidence and selection bar in the reviewed window. Thirty-six replies are recorded across eight hourly runs; the separate owner-directed five and original-chat sixty-eight remain separately counted. No unused slots carry over. This distribution does not reopen UI work or alter article provenance. No recipient runtime test, provider trial, traffic/adoption measurement or scheduler change occurred. Next: reconcile current state and receipts, then prioritize substantive incoming responses.

## November 7 ninth hourly outreach, 02:47 UTC

After reconciling accepted UI work, the completed owner-directed batch and the idle original posting chat, the authorized run published [three project-specific X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-07-0247.md). All canonical owner views were verified. The linked receipt preserves exact copy, source reads, selection evidence and limits. No new substantive incoming response was found in the bounded initial notification view.

The run stops at three because the remaining reviewed results did not support another distinct contribution. Thirty-nine replies are recorded across nine hourly runs; the separate owner-directed five and original-chat sixty-eight remain separately counted. No unused slots carry over. This distribution does not reopen UI work or alter article provenance. No recipient runtime test, provider trial, traffic/adoption measurement or scheduler change occurred. Next: reconcile current state and receipts, then prioritize substantive incoming responses.

## November 7 tenth hourly outreach, 03:47 UTC

After reconciling accepted UI work, the completed owner-directed batch and the idle original posting chat, the authorized run published [three further X replies](../../social/ai-fetcher-browser-crawler-headers/hourly-ai-site-check-2026-11-07-0347.md): one substantive incoming follow-up and two new project-specific findings. Every canonical owner view was verified. The receipt preserves exact copy, current source evidence, selection and limits.

The run is complete at three, with no carry-over of two unused slots. Forty-two replies are recorded across ten hourly runs; the separate owner-directed five and original-chat sixty-eight remain separately counted. This distribution does not reopen UI work or alter article provenance. No hosted audit, provider trial, financial action, traffic/adoption measurement or scheduler change occurred. Next: reconcile current state and receipts, then prioritize substantive incoming responses.

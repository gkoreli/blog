# GoogleOther is a documented generic crawler

October 31, 2026 UTC. Continues [TASK-0119](../../../../../docs/tasks/TASK-0119.md) after [the disclosure correction](07-error-disclosure-boundary.md). That previous turn made progress. The proposed follow-up found that the existing subscription call sites already use stable error codes; no collection change is justified by that review.

## Demonstrated catalogue gap

Our baseline recognizes plain `GoogleOther` as an AI User-Agent but calls it undocumented. Its image/video variants have no recognized name and receive the coarse Browser traffic class. The reader-kind layer still abstains for those header-only media fixtures; this is not evidence they entered the human audience count.

[Google's common-crawler documentation](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers), checked October 31 and displaying an October 30 update, describes a generic crawler used by product teams, with image/video variants. It supplies no per-request AI-training, Search-indexing or human-trigger conclusion. Its common-crawler network publication is another method we had not mapped to this declaration. Google warns that User-Agent text can be spoofed. The [verification documentation](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests) describes published-range matching and forward-confirmed reverse DNS separately. This change uses only the existing fixed published feed; it adds no DNS lookup or endpoint.

## Repair and history

The [catalogue](../../../../analytics/src/classify.ts) now maps the three exact GoogleOther products to one canonical generic bot name. All matched product aliases remain available as derived evidence. The reader kind stays `other-bot`; conflicting Googlebot/GoogleOther or GPTBot/GoogleOther declarations stay unresolved. Lookalikes and names found only inside URLs do not acquire the declaration.

The [network source map](../../../../analytics/src/vendor-ip-sources.ts) adds GoogleOther to the existing `google-common` feed. This yields listed, not-listed, unavailable or unassessed evidence independently of purpose. A matching range cannot identify which product team, task or human caused an action; a failed lookup is not a counterfeit verdict.

Both Googlebot/GoogleOther and AhrefsBot/AhrefsSiteAudit can share one feed per pair. Independent review caught that the [network-report validator](../../../../analytics/src/vendor-network-summary.ts) previously allowed only the Ahrefs pair's extra declaration. The new IP profile permits both pairs and at most 18 mapped declarations across the same 16 sources. Historical profiles retain their former bounds. The four-source request budget, address guards and cache requirements remain intact. Overcounts, missing cache facts and unknown profiles reject.

Classifier and network profiles become `2026-10-31.1`; the report cache becomes `.31.5`. [Fetch Metadata reporting](../../../../analytics/src/fetch-metadata-report.ts) explicitly accepts the new classifier with its unchanged encoding, and [cache reporting](../../../../analytics/src/vendor-cache-report.ts) accepts both old and new network profiles. Collection/verifier/schema versions are unchanged. No historical row is reclassified: a mixed fixture retains old AI and new bot groups for the same canonical name, plus the old unassessed network history.

## Authoritative documentation and open-source comparison

We inspected [crawler-user-agents at db662d2](https://github.com/monperrus/crawler-user-agents/blob/db662d2787f984ed4fe3043744a12eb067b89218/crawler-user-agents.json). Its selected GoogleOther entry uses a broad substring pattern and a search-engine tag. Among our 13 fixed lexical fixtures, that one pattern matches three negative cases: a prefixed name, a suffixed product and URL-only text. Our product matcher has zero false declaration matches in those selected fixtures. This compares one rule, not the entire library or population accuracy. The registry helps surface candidates; primary vendor documentation and exact matching govern this correction. No dependency is added.

## Acceptance and remaining limits

The frozen controls run against baseline and candidate. Candidate Node and native workerd/D1 agree exactly on 13 declaration fixtures, nine network cases, three profile-boundary checks, one cache-reuse sequence and one mixed historical report. The network cases include both shared pairs, all 18 mapped declarations/16 checks under the unchanged request budget, unavailable feeds, nonlisted addresses, Worker relays and unmapped neighboring Google products. Public-report history remains intact. Four permanent regression tests accompany the repair.

All 373 analytics tests, 169 site tests, workspace types, 27 Markdown validations, an isolated 38-post build and Wrangler dry-run pass. Independent source review found no remaining material defect in this scope. An initial runner invocation failed to resolve `tsx` from the workspace root; the successful controls ran from the blog package. [Receipt](googleother-checks.json) preserves versions, hashes and the private evidence manifest.

No production request, SQL query, human trial, current vendor request capture or optional diagnostic activation occurs. Source delivery, deployment activation and production acceptance remain separate. The retrospective's distinction between declaration, identity and trigger already covers this lesson; its concise prose and prompts remain unchanged. CloudVertex's owner-requested crawling semantics remain a separate review, alongside the six existing measurement/input gates. This closes a concrete catalogue gap, not the full analytics goal.

# Stats: understanding reach, discovery and use

November 14, 2026 UTC. Investigation complete; the implementation sequence below is proposed. This continues the [product opportunities review](README.md), the [verified reporting release](analytics-production-upgrade-2026-11-14.json), and [article-reach decisions](../../adr/0016.18-article-reach-and-source-concentration.md). It does not enable new collection or accept an implementation or outreach task.

The next useful Stats iteration should explain changes in reach, sustained article demand and acknowledged actions. The request-evidence machinery already supports detailed inspection. More of that machinery alone would leave the principal publishing questions unanswered.

## Current observation

The live browser loaded the default All traffic / 30 days report on November 14. It displayed October 16–November 14 UTC, calculated at 17:02 UTC: **15,241 page views**, **8,458 daily client identifiers**, and **48 referral-policy exclusions**. The current day is partial and cached reports can be an hour old. The [normalized receipt](stats-reader-understanding-2026-11-14.json) records only the inspected public values and their limits.

**12,536 events, or 82.3%, had no referrer.** This is unavailable attribution across all traffic categories, including automation. It is not a percentage of people or a measure of direct acquisition. Adding campaign labels to future distributed links would help with those links; it cannot explain the whole absent-referrer population or recover missing historical attribution.

The five groups were Browser signals 2,567; Assistants & signed clients 830; Crawlers 3,936; Automation & legacy rules 5,668; Unresolved 2,240. These reconcile with 15,241 events. Their historical rules and observation boundaries still matter before interpreting growth. No cross-category accuracy result follows.

The lookup used one normal browser visit, with its ordinary page resources/API request. No direct production SQL or custom report selection ran. Database work and cache status for that browser load were not metered here. The web retrieval tool returned an older Stats shell; the values above came from the separately observed live browser.

## Reuse what already exists

| Existing capability | Source and present boundary | Useful extension |
| --- | --- | --- |
| Page/time/category/source evidence and daily identifiers | [Collection metadata](../../../packages/analytics/src/metadata.ts), [observation storage](../../../packages/analytics/src/db.ts), [report contract](../../../packages/analytics/src/contracts.ts). Daily identifiers rotate; totals do not identify people. | Closed-period changes, article/category intersections and same-day breadth, with explicit denominators. |
| Article demand and source concentration | [Article reach](../../../packages/analytics/src/article-reach.ts) already provides four completed weeks, article age context, fixed-source sensitivity and measurement history. [The adapter](../../../packages/blog/src/worker/article-reach.ts) deliberately limits it to one canonical stored-Browser report. | Surface its existing results in Stats. An all-category counterpart would extend that scope deliberately, rather than relabel the existing report as whole-audience growth. |
| Reported page-to-page transitions | Present in Stats; internal referrer paths describe destination requests. | Show article onward paths and links worth improving. They are not complete sessions or exit observations. |
| HTML and Markdown access | Representation is already stored; article-reach measurement history includes it in its focused cohort. | A clear format breakdown across audience categories needs reporting work, not a second page collector. |
| Subscription source and confirmation | [Client attribution](../../../packages/blog/src/client/subscribe.ts) retains the signup path, bounded `utm_source`/`utm_campaign` values and an external referrer hostname. [Server parsing](../../../packages/newsletter/src/confirmation-request.ts) bounds the accepted fields. [Confirmation](../../../packages/newsletter/src/confirm.ts) requires a POST and an acknowledged state transition. | Aggregate supported subscription outcomes in the newsletter domain before inventing another signup tracker. No subscriber records were queried in this investigation. |
| Search-query evidence analysis | [Existing analyzer](../../../packages/analytics/src/search-evidence.ts) accepts saved Search Console query/page evidence. It is not an account connector or general-purpose importer. | Use an authorized export to compare discovery questions with article coverage. It cannot recover an individual visitor's search query. |
| Resource reach | [Offline resource analyzer](../../../packages/analytics/src/resource-reach.ts) already separates supplied article/evidence/site resource events. It does not collect every resource type. | Reuse it for retained evidence; separately define any future feed, download or citation-format access collection. |

Subscription attribution deserves particular care. The [subscriber model](../../../packages/newsletter/src/db.ts) stores current status and the latest activation timestamp. A [new pending cycle](../../../packages/newsletter/src/confirmation-store.ts) can clear that timestamp while retaining the existing source. This supports a current-state report with those qualifications. It cannot reconstruct every historical activation, cancellation or campaign conversion. Confirmation receipts also cannot authenticate a client-supplied campaign or prove human involvement.

## Proposed sequence

### 1. Explain changes using retained data

Put a compact publishing overview ahead of the diagnostics:

- Compare the last seven completed UTC days with the preceding seven. Show absolute changes beside percentages; an empty baseline is not infinite growth. Keep partial-today activity separate.
- Attribute the arithmetic change to articles and disjoint traffic groups. Show reported-source contributions and source concentration separately, avoiding a double-counted sum across dimensions. This explains observed composition, not causation.
- Separate article pages from the homepage, tools and evidence resources. Show first-week and later demand where observation coverage permits; publication date alone does not establish exposure. Compare article age and covered days before ranking recent posts against older ones.
- Reuse the focused article-reach report, including its outside-largest-source sensitivity and mixed collection/classifier history. Broader audience comparisons must retain equivalent measurement coverage and unknowns.
- Add a clear HTML/Markdown split and an optional same-day breadth measure such as daily identifiers reaching multiple articles. Keep category scopes explicit. A missing next event is not an exit; repeated identifiers do not establish loyalty or attention.

Acceptance: bounded closed windows; exact contribution reconciliation; original data unchanged; policy/profile boundaries visible; no per-article browser query fan-out. Use one bounded aggregate/report plan with existing shared caching and measured D1 cost. The blog's optional durable report-admission adapter is currently disabled, so caching alone is not a global read budget. Native D1 verification and a prospective production-read allowance belong to implementation, not this document-only investigation.

### 2. Connect distribution to acknowledged outcomes

Expose supported newsletter aggregates first, with current-state/source/activation wording. Keep subscriber email, tokens and private diagnostics out of public Stats. Decide private operator detail and safe public aggregation separately, including sparse article/source cells.

For a durable funnel, introduce a closed publisher-outcome contract. Newsletter owns confirmation and cancellation transitions; analytics receives a minimal acknowledged receipt. A subscription POST acceptance, confirmation-page GET and first successful confirmation are different stages. Replayed confirmations must not add outcomes, and reactivation must have explicit semantics. Persist receipts atomically with their domain transition, or use a repairable outbox with idempotent ingestion.

Add campaign attribution to ordinary page access only for bounded, reviewed labels used in actual distribution links. Existing newsletter attribution already captures some labels at signup; ordinary analytics currently stores the pathname rather than URL query parameters. Preserve unknown attribution and label this as a request claim. A same-flow reference may support attribution; rotating daily identifiers cannot supply a cross-day join. Do not store arbitrary query strings or use counts of unrelated requests as a conversion denominator.

Useful actions can also include opening a runnable example, requesting a download, or reporting use of an idea. Each needs its own definition. An outbound click is not repository adoption; a feed request or RSS-link click is not a confirmed subscription. The existing privacy contract needs a deliberate review for the new bounded fields, retention and public wording before activation.

### 3. Run a small reading-activity experiment when it can change an article

If the decision is whether to shorten an introduction, split a long article or improve a worked example, test a few browser observations: visible-page time bands, an article-end marker and selected example/link actions. Prefer content landmarks over continuous scroll coordinates. Declare the article/version, duration, payload, deletion policy and decision before enabling the experiment.

These are client-reported activity proxies. [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) can distinguish hidden tabs, but visibility does not establish attention. Report the population with received activity records, collection coverage and missing delivery separately. JavaScript-disabled readers, blockers, non-browser clients and agents remain in served reach, without fabricated activity results. [Beacon queueing](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) is not an acknowledgement of server persistence.

Avoid presenting a universal reading or bounce score. [GA4's engagement/bounce definition](https://support.google.com/analytics/answer/12195621) depends on its session/event contract; our page events and partial referrer transitions cannot produce the same measure. Keep any activity module separate from page-access classification and publisher outcomes.

### 4. Add discovery and usefulness evidence

Bring authorized Search Console evidence alongside articles: query clusters, clicks/impressions and dates can identify missing explanations or misleading search doorways. [The API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) returns grouped top rows under its limitations, not all query traffic or per-reader intent. Reuse the existing local analyzer before adding an account connector.

Keep observed agent access, captured citations and supported reports of use separately visible. Agent reach is already a valid outcome under [ADR-0016.19](../../adr/0016.19-agent-mediated-audience-growth.md); it does not require an identified human. Wider machine-use analysis can add resource type and served content revision when the question is which reference or correction was retrieved. Citation-format access would still be access evidence, not proof of a citation.

## Architecture and priorities

The proposed domains are page access, optional browser activity, publisher outcomes, and discovery evidence. Each owns a precise event contract and lifecycle. The analytics package should supply portable comparisons and report contracts; the blog supplies article metadata and presentation; newsletter owns its subscriber state and acknowledged transitions. Do not put all four behind an arbitrary event-name/properties bag or join private diagnostic rows to subscriber records.

The first implementation should be the retained-data publishing overview, followed by truthful outcome reporting and campaign coverage. Start an activity experiment only when the overview leaves a specific editorial decision unresolved. Keep a 30-day raw/90-day aggregate retention option as a proposal for such an experiment, not an accepted site policy. Define and verify deletion before activation.

Persistent returning-person tracking would require changing the accepted cross-day identity boundary; more header fields do not solve that question. Use current daily evidence and separately governed subscription aggregates for the questions they actually answer. Reuse Cloudflare performance analytics and existing client-error reporting for rendering failures before building custom RUM.

## Verification and next action

Source reviewed at `7b59404cebb6375bcf53cf06e6f9ad266c3f2154`, with the analytics/newsletter/Stats paths clean. The investigation checked live UI values against simple group/referrer arithmetic and inspected the collection/report/confirmation paths. It did not read subscriber records, independently replay the live report, benchmark a new query, change code, enable events or measure attention or editorial usefulness.

Documentation checks passed: 69 local links across this record and its owning index, receipt JSON parsing, group/referrer reconciliation, source-commit existence, balanced fences, the private-prompt guard and scoped whitespace. Runtime tests and a production build are not applicable to these documentation-only changes.

Next bounded implementation proposal: a completed-period publishing overview with article and traffic-group contributions, backed by native-tested, metered aggregates. Existing reports remain useful while the new contract is defined. This proposal does not reopen completed signature, migration or Stats visual acceptance work.

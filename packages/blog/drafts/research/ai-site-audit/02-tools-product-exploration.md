# Product research for /tools and a clearer AI access report

Inspected November 6, 2026. Repository baseline read: `a1d1795e`. The research phase was read-only; the implementation and acceptance checkpoint below records the subsequent changes. The owner now explicitly wants a tools home, a total score, stronger presentation and useful free capabilities. Those requirements supersede the earlier design's deliberate no-score presentation; they do not supply evidence for predicting AI rankings.

## Recommendation before engineering

Build a useful technical-access score with its formula and evidence coverage exposed. It should summarize tested properties of one response/path under one version, not predict citations or claim to authenticate provider access. Organize `/tools` around jobs: check a public page, test a robots policy, inspect this request, compare saved reports. Give the result a strong summary, prioritized fixes, category breakdown and expandable wire evidence.

Separate optional capabilities from scored prerequisites. Homepage `Accept: text/markdown` returning HTML should read “HTML served; Markdown optional,” with response evidence. That is not an access failure. File discovery, representation support, provider access and actual answer/citation remain separate.

Good inexpensive additions are a local robots sandbox, JSON report download/import/diff, copyable repro commands, and readable text/heading previews from an existing fetched response. They provide value without paid model calls, additional crawling, raw reader tracking or new accounts.

## Acquisition and confidence

Primary web documentation was read through the web tool. The first direct sandbox CLI fetch failed DNS; a bounded escalated public read then succeeded for Exepal HTML and two OSS source files. Public-source captures are retained outside Git in the task’s private worklog; the primary URLs and inspected hashes below are the public provenance. Exepal's form was not submitted, third-party APIs were not invoked and screenshots were not inspected. Every product claim below is therefore documented, public-page-observed or code-inspected, not an independently reproduced service result. No current pricing/performance/accuracy comparison is established.

## Comparators

### 1. Exepal agent-readiness checker (public AI tool)

Sources: <https://exepal.com/check> and its public HTML capture `exepal-check.html`. Retrieved November 6, 2026. Observed server-delivered product page; checker execution and hidden scoring implementation were not tested.

The page offers a single URL entry, ten daily web checks, a named crawler table, response-comparison probes, discovery files and a 100-point/letter-grade explanation. It publishes the weights: answer/search policy 25, base fetch 15, llms.txt 15, initial text 10, sitemap 10, and five-point checks for robots presence, title/description, schema, indexing/AI directives and agent endpoints. It documents six-hour result reuse and separate API/MCP entry points. These are the operator's public claims, not validated execution results.

Useful patterns: the immediate question, one primary action, visible methodology, copyable API example, explain-the-result FAQ, next action and a product tools directory. Our current page already has much of the evidence but lacks a compact interpretive summary.

Reject automatic adoption of its weights. Fifteen points for llms.txt and five for agent endpoints are not supported prerequisites for Google AI Search. Its prose also overgeneralizes anonymous-browser handling and what a synthetic bot UA establishes. Preserve our explicit provenance and unknown states. The current public page links Goga's AI-fetcher header study: this is observed external distribution of the study, not proof of AI-model citation or endorsement.

### 2. Google Lighthouse (OSS audit/report model)

Sources: <https://developer.chrome.com/docs/lighthouse/performance/performance-scoring>, <https://github.com/GoogleChrome/lighthouse/blob/main/core/scoring.js>, and fetched `lighthouse-scoring.js`. Retrieved November 6, 2026. Primary documentation plus inspected source; no Lighthouse run executed.

Documentation distinguishes scored performance metrics from opportunities/diagnostics and publishes changing weights and a calculator. It discusses environmental variability; the score is tied to a specific metric model, not a universal quality measure. The current source's `arithmeticMean` returns null if any positive-weight audit score is null. Not-applicable, informative and manual audits retain their report rows while their scoring weight becomes zero.

Adopt: transparent score inputs, versioned policy, category drilldown, reasons/examples alongside each check, diagnostics outside the formula. Keep unknown different from not-applicable. A fetch failure must not disappear from the denominator and produce a green score for the remaining easy checks. Do not copy its log-normal performance distributions or red/yellow/green thresholds: we have no comparable calibration corpus for AI access.

### 3. webhint (OSS actionable rules)

Sources: <https://webhint.io/docs/user-guide/>, <https://webhint.io/docs/user-guide/concepts/hints/>, <https://webhint.io/docs/user-guide/concepts/formatters/>, and <https://raw.githubusercontent.com/webhintio/hint/main/packages/utils-types/src/severity.ts> (`webhint-severity.ts`). Retrieved November 6, 2026. Primary docs and inspected enum; scanner not executed.

webhint describes configurable tests, separate connectors/parsers/formatters and output including HTML/JSON/codeframe. Its documentation and severity enum distinguish information, hints, warnings and errors. A warning can require investigation without establishing breakage. Context determines which rules apply.

Adopt: independently reusable rule definitions with `id`, applicability, result, evidence, impact and repair. One issue should have a precise reason and a copyable reproduction. Retain “review” rather than claiming every canonical difference or missing description is a failure. A local robots policy editor should show the exact matching group/rule and before/after decision without network requests. There is no need to install webhint or import its browser-scanning dependencies for these product lessons.

### 4. Unlighthouse (OSS multi-page workflow)

Sources: <https://unlighthouse.dev/>, <https://unlighthouse.dev/integrations/ci>, <https://github.com/harlan-zw/unlighthouse>. Retrieved November 6, 2026. Public docs/repository presentation; source execution not performed. Homepage advertises v1 beta while cited CI documentation is labeled 0.x stable; preserve that version difference.

The product exposes an overview/dashboard across URLs, then detailed page reports; docs offer saved scans, JSON/CSV export, static reports and per-category budgets. It supports explicit URL lists and distinguishes desktop/mobile conditions. CI documentation defines success/failure through a declared budget rather than treating a report's existence as success.

Adopt: download a versioned report, reopen it locally, compare like-for-like versions and surface changes before evidence details. A small explicit URL set can be a later extension after request budgets and quota units are designed. Do not quietly turn the existing single-page quota into an unbounded crawler or claim whole-site results from one homepage.

### 5. Firecrawl (public API/OSS-adjacent extraction workflow)

Sources: <https://docs.firecrawl.dev/features/scrape>, <https://github.com/firecrawl/firecrawl>. Retrieved November 6, 2026. Primary documentation; no API trial, rendering check or source build was executed. A direct llms generator page fetch was unavailable via web, so no generator behavior is claimed.

The scrape documentation distinguishes API processing success from the target page's actual HTTP status. It documents multiple representations such as Markdown, cleaned HTML, raw HTML and links; cache/freshness controls and separate browser actions have their own scope.

Adopt: clearly label service-success versus page-success, downloaded report versus upstream response, original versus derived representation. A useful free “what arrived” preview can show safely escaped extracted text/headings and byte counts from the already fetched page. If we generate Markdown locally, name it “generated preview,” keep server Markdown negotiation independent, and avoid implying the provider served it or the text is a model-specific token count. Browser execution and screenshots require another explicit capability and budget, not a label on the current fetch.

### 6. Cloudflare AI Crawl Control (first-party operational comparator)

Sources: <https://developers.cloudflare.com/ai-crawl-control/>, <https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/>. Retrieved November 6, 2026; cited pages display August 14 and April 23, 2026 update dates respectively. Primary docs; no dashboard session inspected in this research.

Documentation describes an executive summary followed by operator/crawler/status/path drilldowns, requested versus served content types, filters and export. It distinguishes actual request activity from a robots policy setting and provides a per-crawler view. Some referral features are paid; do not describe every feature as free.

Adopt: summary → categorized evidence → specific request; show `Accept` beside returned `Content-Type` and make the observation point explicit. Our differentiator can be independently explainable request dimensions from the analytics library, without claiming the public page checker possesses another site's operational logs. Actual bot activity, spoofed-UA probes and robots directives must remain visibly distinct.

### 7. Qualys SSL Labs (public technical assessment)

Sources: <https://www.ssllabs.com/ssltest/>, <https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide>. Retrieved November 6, 2026. The guide displays version 2009r, May 16, 2025. Public page/documentation inspected; no scan submitted and no report interaction tested.

The guide explains component categories, overall numerical/letter results, explicit exceptional conditions and what its automated test excludes. Some failures override the ordinary category arithmetic; that means the total alone does not convey the whole assessment. The guide also acknowledges that site purpose affects appropriate configuration.

Adopt the product principle: a legible headline result must retain explorable component evidence, exception reasons, method version and limits. Do not copy TLS grade thresholds or imply that an AI access score has comparable security validation. No claim about expandable UI behavior follows from this documentation-only inspection.

## Primary constraints on scoring

Source: <https://developers.google.com/search/docs/appearance/ai-features>, retrieved November 6, 2026. Google's first-party documentation states no additional technical requirements for AI Overviews/AI Mode beyond indexed, snippet-eligible search pages. It says no new machine-readable/AI text files or special schema are necessary. It recommends useful textual content, crawling access, internal links and structured data matching visible content. Meeting these does not guarantee indexing or serving. This is Google Search guidance, not a universal rule for all vendors or every standalone agent.

Consequences:

- Do not penalize Markdown negotiation absence, llms.txt absence, missing MCP/OpenAPI endpoints, a deliberate training restriction or lack of optional JSON-LD.
- Keep per-product robots purpose and index/snippet controls distinct. `noai` is not a universal equivalent of `noindex`.
- Page delivery and meaningful initial text are strong first-stage checks. Thresholds are our declared diagnostic policy, not validated probabilities of AI selection.
- Network/timeout/size-limit outcomes are unassessed evidence. They must never become silent passes or universally blame the target.

## Score-policy research and accepted follow-up

Use “Technical access score,” `profile`, `assessedAt`, explicit rule IDs/weights, observed outcome and rationale. Publish the full ledger beneath the total. The following investigation informed [ADR-0021](../../../../../docs/adr/0021-tools-and-technical-access-assessment.md). That ADR now accepts a fixed 100-point ledger with earned, lost and unknown points; the score remains a declared heuristic rather than empirical citation calibration.

A reasonable first grouping is delivery, page interpretability and intended search/assistant access. Avoid accumulating points merely by counting more optional conventions. For intentionally blocked access, explain which declared objective the score represents; don't erase the site's policy choice.

For unknowns: Lighthouse source makes weighted nulls propagate. We can likewise withhold a definitive grade if a critical input is unavailable. If a numerical total is still useful, expose confirmed points, unassessed points and a range: “62–87 /100; 25 points unassessed.” A score normalized only across assessed checks must be labeled provisional and accompanied by assessed weight; it must not appear as a definitive 100/100 while important evidence is missing. Not-applicable is a reasoned scope decision, not an error fallback.

Present the result in this order:

1. Total with method/version/coverage and one-sentence conclusion.
2. Three most consequential fixes or next checks, each with evidence and expected effect on the technical score.
3. Category breakdown and checklist: passed, review/failed, unassessed, informational.
4. “What was requested / what arrived” representation and synthetic-request table.
5. Copy/download JSON, compare a prior report, and expandable raw evidence.

Avoid giving every bot token equal independent weight: several tokens from one provider/role can dominate a score by catalogue size. Prefer an explicit role/provider policy design or clearly defined task profile. Preserve training controls outside a “search/assistant retrieval” objective.

## High-value free capabilities, prioritized

| Capability | Concrete reader benefit | Cost/boundary | Basis |
| --- | --- | --- | --- |
| Robots policy sandbox | Paste/edit rules, choose path/token, see exact matching group/rule and before/after result | Pure parser; no external fetch/quota; limits and unsupported syntax visible | webhint rules + existing RFC parser |
| Download/reopen/diff reports | Prove what changed after a fix, including changed source status/metadata/rules | Client-side file parsing, schema/version validation; local files stay local unless explicitly sent | Unlighthouse export/history |
| Extracted text and heading preview | See whether the intended answer exists in the received HTML | Reuse bounded current response, escaped text; no JS-rendering claim | Firecrawl representation separation |
| Representation inspector | Explain homepage HTML versus Markdown negotiation and advertised alternate/citation links | Reuse existing resource; show request Accept and response type; optional neutral status | Cloudflare requested/served views |
| Copy repair/repro bundle | Give developer/agent exact URL, headers, rule and a curl command plus acceptance checklist | No new remote fetch; safely quote, never executable target-controlled script | Lighthouse/webhint actionable diagnostics |
| Request-evidence laboratory | Compare navigation/fetch/curl declarations, native assessments and signature coverage | Current endpoint has explicit allowance; pasted header mode would be untrusted and unverified | Existing analytics + Cloudflare evidence distinctions |
| Explicit small URL-set audit | Compare homepage with an article or doc page under identical method | Future bounded batch; explicit quota and request budget; no broad crawl claim | Unlighthouse explicit URL workflow |

For the immediate delivery, `/tools`, transparent total, neutral optional Markdown wording, three prioritized actions, downloads and a local robots sandbox would create a coherent free toolkit. Browser rendering, real-provider answers and sitewide history are separate larger capabilities, not promised by this recommendation.

## Checks before accepting this direction

Test failure/unknown/not-applicable score transitions and invariance under added optional files or intentional training blocks. Verify category sums and full versus partial coverage, API/HTML/JS report agreement, safe report import/diff, parser limits in the sandbox, exact path-policy behavior, download version metadata and working `/tools` discovery. Verify the current homepage and an article separately for actual Markdown behavior before calling the reported homepage result a bug.


## Accepted delivery scope and worklist

The follow-up design is recorded in [ADR-0021](../../../../../docs/adr/0021-tools-and-technical-access-assessment.md), amending [ADR-0020](../../../../../docs/adr/0020-evidence-led-ai-site-check.md). The root agent owns exact prompt preservation in the article prompt record; this note paraphrases the owner request rather than presenting a partial quotation.

| Requirement | Acceptance evidence | State at research checkpoint |
| --- | --- | --- |
| Research before implementation | Seven primary comparators above, Lighthouse/webhint source inspection, Google requirement boundary | Completed research; service execution not claimed |
| Discoverable tools home | `/tools` presents four actual tasks and working routes | Engineering and rendered acceptance pending |
| Page Check total and stronger report | Fixed 100-point ledger; earned/lost/unknown reconcile; range/coverage; category evidence and prioritized repairs | Decision accepted; implementation/verification pending |
| Robots Playground | Local bounded parser, editable policy/path/token, exact match result, working example, no remote call or daily admission | Engineering/interaction acceptance pending |
| Report Compare | Local validated report import, same-target/method checks, changes and unknown transitions, example pair, no server upload | Engineering/interaction acceptance pending |
| Request Inspector | Discoverable existing request endpoint with its shared ten/day allowance and evidence boundaries | New tools-home discovery pending; existing acceptance stays scoped to earlier release |
| Markdown explanation | Homepage and article checked separately; optional representation gets neutral wording | Current source read confirms not-negotiated means received response lacking text/markdown; fresh route checks pending |
| DDD and release | Pure rubric/parser/comparison domain; safe adapters; checks; scoped commit/push, actual deployment and fresh acceptance | Pending root receipts |

Code, delivery, deployment and measured use remain separate. This note's existence and accepted decision do not prove any new tool is activated. Next bounded action: implement the four-task navigation and score/report contract, then exercise all user flows and the failure/unknown invariants before delivery.

## Engineering and local acceptance — November 6

The accepted implementation adds `/tools`, a fixed 40/40/20 technical score with explicit unknown points, a no-quota saved example, local robots evaluation and local report comparison. Homepage `Accept: text/markdown` is repaired through generated `/index.md`, with `Vary: Accept`, a real alternate link and no invented article citation. Optional Markdown absence is rendered neutrally and does not lower the score. Source previews and headings are derived from the existing bounded HTML, without another fetch or a rendering claim.

The new score's completeness evidence records oversized omitted headers and bounded indexing metadata. Historical reports without those flags retain unknown indexing points. Scoped provider controls do not become universal `noindex`; malformed attached ledgers are rejected, and structurally valid attached scores are recomputed from source evidence. Duplicate comparison evidence is refused; added/removed bot rows and opposite changes at equal totals remain visible. Non-scored diagnostics such as synthetic response differences remain prominent even at 100 points.

Local acceptance: **41 site-audit tests**, **416 blog tests**, workspace typecheck, 32 Markdown validations, configured isolated 43-post build, native default Workers transport and the **46-request HTTP/D1 harness** pass. The native harness proves the saved example uses no quota and exposes no historical viewer balance. No production schema migration, extra hosted fetch budget or quota increase is needed.

Browser verification used the actual local Worker and assets at 550px and 1280px widths. The example loaded the real dated homepage capture and showed 100/100 despite optional Markdown not being negotiated. The robots playground correctly allowed `/private/public/article` through its longer Allow rule, then disallowed `/private/article`. A synthetic comparison kept both totals at 90 while showing the lost title and gained heading as distinct changes. These are controlled UI tests, not external operator adoption. Local preview omitted production analytics credentials; expected background observation failures do not establish a production collector incident. Native fixtures test their separately bound processing paths.

The first local test pass also exposed a missing argument when the server renderer adopted the shared diagnostic selector; it returned 503 in the native form case. That call was corrected and the full native harness passed. This preserves the rejected result rather than substituting a green static-page check.

Source delivery and fresh production acceptance are pending below. Existing November 6 launch receipts retain their earlier scope; this follow-up does not rewrite them as evidence for the redesigned tools.

## Source delivery and served acceptance

The tools release was delivered as `bc2d26d512b0485fa4d44fd22d851c9fa9e2b1db`, source-linked build `14663169-7666-4522-86a1-46593907aa80`. Eight fresh public representation/route checks passed. The homepage now returns `text/markdown`, `Content-Location: /index.md`, and `Vary: Accept` when requested; HTML remains the normal representation. Tools, robots, comparison, no-JavaScript example, sample JSON and OpenAPI are served. The [normalized receipt](2026-11-06-tools-acceptance.json) records exact conditions and hashes.

A fresh controlled domain run against the deployed homepage received eight 200 responses, negotiated Markdown and a fully observed 100-point ledger. It used fixed public-host allowlisting and Sec-Purpose prefetch; it was not an admitted hosted API call. The public browser's hosted request returned 429 because the prior daily allowance remained exhausted. That result was preserved rather than bypassing or resetting the quota. The static example loaded successfully from the same page without allowance, as intended.

The final browser check also covered the phone-sized 375px layout. After a quota rejection, successful example loading retained the prior error style despite showing correct example text. The example operation now sets loading/ready/error presentation explicitly, with a regression assertion. This small repair does not alter admission, fetch policy or scoring. The shared score, neutral optional result, source preview, local tools and links remain accepted within the stated scope. Broader operator adoption and AI citation outcomes remain unmeasured.


## Form validation correction — November 6

The owner's screenshot exposed a missed interaction: `reddit.com` was already accepted by the shared target policy, but the HTML `type=url` constraint rejected it before the submit handler or server could run. The prior enhanced test dispatched a submit event directly and therefore did not exercise the browser's interactive validation gate. The earlier checks remain evidence for their stated paths, not proof that common bare-domain entry worked. A current public-browser click reproduced the native “Please enter a URL” popup and `typeMismatch` before this repair.

The form now accepts a domain or HTTPS URL through a text field with a URL keyboard hint, adds HTTPS visibly, trims pasted form whitespace, and uses the same target validator as the server. Specific inline errors are associated with the field; rejected values retain focus and remain editable. Validation does not start a fetch or quota admission. The script-free POST preserves safely escaped entered values and inline errors. API whitespace remains strict. Public-host, HTTPS, DNS/egress and quota restrictions are preserved; empty query/fragment delimiters are rejected consistently with the existing target contract. Canonical URL length is checked after IDN and percent-encoding expansion so an accepted browser input cannot become an oversized rejected API URL.

The same review found that example and live operations could race. One pending operation now owns the UI; duplicate submits cannot admit another check, and an aborted detached operation cannot overwrite a later result or loading state. Previous reports survive enhanced validation and service failures. A shared presentation helper also brings the server-rendered optional Markdown label into agreement with the enhanced report.

Acceptance includes **46 site-audit tests**, **421 blog tests**, workspace typecheck, an isolated configured 43-post build, and the **55-request native HTTP/D1 harness**. The harness verifies unchanged quota counters for invalid submissions, escaped reflected values, no-JavaScript retry/normalization, and neutral optional Markdown wording. Controlled deferred-response tests exercise repeated submits, example/live interaction and component reconnection.

Real-browser verification used actual generated HTML/CSS/client bundles with a supplied, explicitly labeled audit response and no external target fetches. Click accepted `reddit.com`; Enter accepted a whitespace-padded `reddit.com/r/webdev`. Eight invalid cases produced specific inline messages. A separate script-free representation had zero script tags and a script-blocking CSP: native click and Enter normalized the same inputs, while an HTTP URL retained the entered value, marked the field invalid and focused it. Layout was inspected at 375px, 550px and 1280px, with light and dark enhanced states. These are form and adapter tests, not fresh Reddit audit results. Source delivery and public served checks remain distinct from these controlled observations.

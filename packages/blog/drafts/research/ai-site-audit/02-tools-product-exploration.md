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


## Tool interface correction — November 6

The owner rejected the visual result, including the exhausted-quota paragraph. Previous browser checks established that controls worked and fit the viewport; they did not establish an acceptable interface. Tools inherited article typography through `post-content`, and the shared `--font-sans` token is Lora. Two status selectors also competed over padding, leaving the text against its left border.

Tool pages now have a dedicated `tool-app` scope: system sans-serif for utility text, controls, reports and feedback; Lora for page headlines; the existing publication colors and navigation. The stylesheet has been consolidated around shared form panels, buttons, report components, disclosure rows and feedback cards. Input text has a 16px minimum. Loading, completed, unavailable and quota-limited states have distinct structured presentations. Quota feedback gives one reset explanation, a remaining-count label and links to the no-quota example and local robots playground. The browser names the local timezone; script-free HTML names UTC. Both renderers use the same feedback decision. No allowance, target or scoring policy changed.

Acceptance: 424 blog tests, blog/client/Worker typecheck, a configured isolated 43-post build and the 55-request native HTTP/D1 harness. Focused feedback cases distinguish daily exhaustion from burst limits and malformed quota metadata; server feedback remains escaped. Browser inspection used actual generated assets and controlled responses to review loading, failure, quota, inline validation, saved results, disclosures and local-tool forms. Desktop 1280px and phone 375px states were inspected in light and dark themes; the script-free quota response was also inspected. These are visual and interaction observations, not a production target-audit result.

## Publication design correction and further UI acceptance — November 6

The owner explicitly rejected the system-sans/dashboard direction and colored left borders. This correction supersedes the typography choice in the preceding interface checkpoint. The implementation now follows the publication's actual Design Language: Lora for explanation and headings, monospace for controls and recorded facts, the existing paper/ink palette, shared sidebar and sparkle separator. The active design-system reference was amended deliberately; the surrounding layout and publication guidance remains intact.

The tools home uses a featured page check and open numbered tool rows. Its diagram explains the actual 40/40/20 rubric rather than inventing a sample score. All four pages share a compact navigation strip. Reports use open sections, neutral horizontal rules, a total whose arc represents earned/unknown points, the explicit earned/deducted/unknown ledger, component bars and links to next steps and evidence. There are no colored left-border callouts or nested dashboard cards. Source previews, native file selection, adjacent validation, quota resets and no-quota alternatives retain the same visual language. A saved example is visibly dated and its links land at the report.

Useful interaction corrections accompany the styling. Report completion focuses the result. Server output preserves the replacement container, preventing a later enhanced check from leaving a stale server report below it. Comparison inputs identify missing or invalid reports beside the affected field; missing files focus the file control without opening an empty JSON editor. File reads cannot overwrite newer edits, and changing either report clears the previous comparison. Robots validation names and focuses the invalid field. Unknown evidence explains what could not be assessed before suggesting investigation; the rubric, weights, request limits and quota policies are unchanged.

Design exploration included the existing publication homepage and Design Language, Google's PageSpeed documentation and the Security Headers entry form. Their useful patterns were a clear primary action and score-to-diagnostic hierarchy; the visual treatment comes from this publication. An attempted webhint scanner reference returned 404 and was not treated as a working current service. Earlier primary-source product research above retains its stated scope.

Acceptance: **428 blog tests**, **46 site-audit tests**, full workspace typecheck, **32 Markdown validations**, isolated **43-post build**, referral-policy check and the **55-request native Worker/D1 harness** passed. One assertion was updated to require the new example-report fragment. The isolated build had no public Turnstile site key; it is not represented as a reproduction of production configuration. The controlled local preview served actual built HTML, CSS, client scripts and the native Worker, with supplied audit evidence and external target requests disabled.

Browser checks covered the Lora/mono design at 375px and 1280px, light and dark themes, a wholly unassessed 0–100 report, a supplied 60–70 report, the dated 100-point example, evidence disclosures, native file selection/comparison, missing and invalid input, and robots correction from invalid path to an allowed policy result. A script-free page and native POST contained zero script elements, accepted `reddit.com` as `https://reddit.com/`, and displayed the controlled exhausted allowance with one UTC reset explanation and useful alternatives. These are rendering and adapter observations, not fresh Reddit access measurements or owner design approval.

Source delivery, deployment activation and current public acceptance are recorded separately after this checkpoint. The next bounded action is to publish these checked changes and verify the served tools and saved report.

### Deployed UI acceptance

The correction was delivered as `81944b014b1d4ed88ee2f1b2689ba9a0e01c38e8`. Cloudflare build `ea287d79-48c5-45be-aa52-ae4efd711b24` completed successfully. Fresh checks at 18:11 UTC received 200 responses with matching source/build markers for `/tools`, `/ai-check`, `/tools/robots`, `/tools/compare` and `/ai-check/example`. The [normalized UI acceptance receipt](2026-11-06-tools-ui-acceptance.json) records the conditions and limits.

The public browser accepted `reddit.com`, normalized it to HTTPS and showed the existing exhausted allowance with one local reset explanation. No quota was reset or bypassed and no fresh Reddit audit completed. Its free-example action loaded the dated report, moved focus to it and showed the 100-point ledger and evidence disclosures. Desktop 1440px and phone 375px production layouts were inspected; screenshots remain in the private session evidence. The requested UI correction is delivered. Owner design feedback and broader reader usefulness remain outcomes to observe, not claims established by these checks.

## Further design study and workflow improvements — November 6

The owner requested more design study and improvements after the preceding delivery. Its functional acceptance is not design approval. This pass studied the live publication homepage alongside [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory), [Web Check](https://web-check.xyz/), the [Lighthouse report viewer](https://googlechrome.github.io/lighthouse/viewer/) and [Lighthouse CI comparison viewer](https://googlechrome.github.io/lighthouse-ci/difftool/), plus [GOV.UK error-summary guidance](https://design-system.service.gov.uk/components/error-summary/). The Lighthouse viewer's supplied 2020 example pair was opened; no new external scan was submitted to these services. These observations establish interaction references, not comparative product effectiveness or current target measurements.

The useful patterns were a working domain input at the entry point, explicit input/output descriptions, clear before/after context and results that receive focus. Their visual styling was not adopted. The publication's stronger Lora display hierarchy, monospace controls, existing colors and quiet horizontal rules remain the basis. The previous directory spent space on an abstract score diagram and descriptions before the user could act. It now accepts a domain directly through the same native server form as the checker, presents local tools with small functional previews, and links the methods to the investigation and open source. The checker form is an open section instead of a large shaded container. A browser-default blue homepage tools link was corrected to the shared link token.

The free local tools are easier to try. Robots has three supplied editable policies: search/training groups, a private-path exception and a client-specific group. Choosing one fills the policy, client and path together; manual edits clear the stale verdict. Comparison has a one-click illustrative pair, requiring no files or remote fetch. The pair changes a missing page title and the current rubric derives 90 to 100; its banner and embedded limits explicitly state that the inputs are demonstrations, not measurements of example.com. Comparison counts distinguish improved, regressed, changed and unknown evidence. Existing real report imports remain local and validated.

Reports now show response status, captured HTML text/headings and evaluated crawler-policy counts beside the scoring sections. Missing evidence stays unavailable or unassessed. Categories containing failed or unknown checks open by default. These facts do not add points or claim actual provider access. Successful local submissions focus their results; selecting a policy example leaves focus in the editor. Native POST results also receive focus without requiring JavaScript. On phones the example picker uses the full editor width, and the comparison table preserves readable labels with horizontal scrolling and an explicit scroll hint.

Acceptance: **432 blog tests**, full workspace typecheck, **32 Markdown validations**, an isolated **43-post build**, referral-policy verification and the **55-request native Worker/D1 harness** passed. The harness includes native result focus markup, bare-domain normalization and unchanged invalid-input quota behavior. The local browser exercised the actual built assets at 375px and 1280px: directory native POST of `reddit.com`, quota-result focus, policy examples and result focus, comparison example and result focus, and saved-report facts. The preview used supplied audit evidence, an explicitly labeled fixture and no external target fetches. Source delivery and fresh served checks are recorded separately below; owner design acceptance and wider reader outcomes are not inferred from these checks.

### Further study: deployed acceptance

Source revision `e6bcc4a77cb45de3d4ff23cba919b26be69c433d` deployed successfully through Cloudflare build `283808b5-6f99-4558-acba-c8a17bb97a00`. Fresh reads at 18:33 UTC returned 200 and matching build/source markers on all five tool/report routes. The public browser exercised the new tools-home native form, both local example flows, result focus and the saved report's fact summary. The native `reddit.com` submission normalized to HTTPS and retained the exhausted allowance; no fresh Reddit audit or quota bypass occurred. The production directory was inspected at 1280px and 375px. Local dark-mode comparison and the revised mobile scroll table were also inspected. The [normalized design-study acceptance receipt](2026-11-06-tools-design-study-acceptance.json) preserves these scopes; screenshots are private session artifacts. The requested implementation and delivery are complete. The next evidence to collect is owner feedback or actual reader use, rather than treating this inspection as either.

### November 10: homepage tools design alternatives

The owner flagged the homepage tools strip after seeing it on a phone and asked to compare two or three design approaches in a worktree. The [homepage design study](../../../prototypes/homepage/README.md) records three working directions, local review, and the next design decision. This is a separate design exploration. It does not change the prior release or establish reader use.

The owner then selected “One clear invitation” (Field kit). The worktree's actual homepage now uses that component, and Design Language shows the same pattern. This selection establishes the design direction; implementation checks and eventual delivery remain distinct from production acceptance or reader outcomes.

On reviewing the implementation, the owner asked for a smaller footprint and further iteration. The worktree now compares Compact and Inline invitations within the selected direction; neither is accepted as final. The design study keeps this feedback, the local review baseline, and the next bounded review together.

The owner subsequently preferred Inline and flagged its small click target. The [interaction study](../../../prototypes/homepage/interaction-study.md) compares first-party card guidance with the actual previous hit area, then verifies the refined full-surface native link. Artwork, padding and keyboard activation work locally; one link covers all nine sampled interior positions without increasing the card's measured height at the original viewport. The broader visual design remains in review, with no production activation claimed.

### November 11: selected homepage invitation

The owner selected **Refined inline** as the version to keep. The [selection and release record](../../../prototypes/homepage/README.md#selected-version--november-11) tracks its checked main delivery and fresh production verification. The compact layout, full-card native target and Design Language example are the accepted scope; this selection supersedes the preceding pending visual-review state.

Source `3134918f` was pushed to main and Cloudflare build `60b619b8-40e8-4f87-9650-12cb0a55f8e3` succeeded. The [fresh acceptance receipt](2026-11-11-homepage-invitation-acceptance.json) verifies served source identity, exact stylesheet, HTML/Markdown discovery, the Design Language example, unpublished prototype routes and actual public pointer/keyboard navigation. The requested homepage change is delivered; reader-use outcomes remain unmeasured.

### November 11: tools directory prototypes

The owner subsequently requested a redesign of `/tools` with prototypes. The [tools-page design study](../../../prototypes/tools/README.md) compares Workbench, Tool library and Task chooser in an isolated worktree and the conversation. It records their different entry flows, shared visual language, local responsive and interaction checks, and the prototype-only form boundary. Tool library is proposed for review; no direction is selected and no tools-page deployment is claimed. Next action: refine the owner’s selected direction, then integrate it with the existing functional tools.

The owner selected **Tool library** and asked for smaller cards, additional UX/design research and a stronger overall design language. The [compact-navigation study](../../../prototypes/tools/design-language-study.md) supersedes the pending direction choice above. It compares Compact tiles with Illustrated rows, retains the previous library as a measurement baseline, and proposes a shared navigation pattern family. This is a local design review; the refined layout has not been selected or deployed.

### Compact tools implementation — November 11

Compact tiles is selected for implementation, with the pattern family included in Design Language. The [implementation record](../../../prototypes/tools/README.md#selected-implementation--november-11) describes the shared template, linked-title treatment without decorative arrows, consistent utility icons and the preserved native checker entry. The prior pending-layout state is superseded.

Workspace typecheck, 34 Markdown validations, all 442 blog tests, referral-policy verification, the private-prompt guard and an isolated 45-post build passed. No public Turnstile configuration was copied into the checkout. Local rendering and interaction checks remain distinct from source delivery and fresh public acceptance, which follow below.

### Compact tools: delivered and served acceptance

Implementation `41aeceb3307fde4692279ce9ac1cf3b778992c48` was pushed to main; Cloudflare build `47f0957e-84c2-44d6-a1f4-76010c54ada0` succeeded. Fifteen fresh public reads verified matching source/build identity across the seven HTML entry/report routes, exact built CSS, core monochrome icon assets, the JSON schema and unpublished review/prototype routes returning 404. The [normalized receipt](2026-11-11-compact-tools-acceptance.json) records methods, response hashes, checks and limits.

The public browser verified all four directory links with nine of nine interior target samples each, a full-surface 2px keyboard focus outline and Enter navigation to Robots. At 393px the new menu glyph changed to Close, Escape restored the collapsed menu and scrolling, and the directory had no horizontal overflow. Design Language at 320px had no overflow and exposed the shared pattern examples and eleven utility glyphs. The homepage invitation kept one native link, nine of nine sampled hits and keyboard activation after its arrow disc was removed. No hosted audit or request-inspector admission was submitted. These are implementation and rendering checks, not reader adoption or fresh target-access measurements.

### Tools support section — November 11

The example destination now uses the shared illustrated-row component, names gkoreli.com as the checked page and states that it uses no daily checks. Page check and Request inspector show their shared ten-check limit directly on their tiles. A native “Free usage & limits” disclosure explains the public-IP boundary, UTC reset and the two unlimited browser tools. Supporting links use descriptive labels and a single left-aligned row.

Local acceptance: workspace typecheck, all 442 blog tests, 34 Markdown validations, referral-policy verification and an isolated 45-post build passed. The native disclosure opened by keyboard in a script-free page; the 320px expanded layout had no horizontal overflow. The example row retained one link and nine of nine sampled interior hits. No hosted audit was submitted. Source delivery and fresh public acceptance are recorded separately below.

Delivered as `6a3087065e3d1f429bfaa6619e7807c1e7929e84`; Cloudflare build `3a238a7c-b4f9-40aa-8192-532f2571d875` succeeded. Five fresh public reads confirmed served source identity, example and documentation destinations, the new support content and exact stylesheet hash. The [normalized receipt](2026-11-11-tools-support-acceptance.json) records those checks and the live native disclosure and example navigation. The expanded 320px view had no horizontal overflow; no audit admission was submitted. Reader comprehension remains an outcome for feedback rather than a measured claim.

### Visible access-report results — November 11

The report now presents scored checks, crawler-policy decisions, captured page evidence, optional capabilities, observations and request outcomes as visible sections. A compact overview retains the dated observation, counts, unknown-point range and provider-access boundary. Native jump links navigate the longer report; only method explanations, raw policy matches/headers and full JSON use disclosures. Crawler decisions are grouped by search, assistant, training and other roles. The actual decisions and matched rules remain visible.

One escaped template now serves enhanced, saved-example and native HTML reports. Scores are still derived from evidence; the collection contract and scoring rules are unchanged. Design Language uses the same check-group renderer with explicitly illustrative pass, fail and unassessed states. The design-system reference records visible results as the default pattern.

Local checks passed: workspace typecheck, 443 blog tests, 34 Markdown validations, the 55-request native Worker/D1 harness, referral-policy verification and an isolated 45-post build. A script-free browser preview exposed six scored checks, 26 crawler decisions and all four optional capabilities without opening a disclosure. Controlled failure and unassessed previews at 393px and 320px, including dark mode, had no horizontal overflow. Keyboard section navigation and the enhanced saved-example flow worked; the example retained one download action and moved focus to the report. These are rendering and interaction checks, not reader comprehension or new provider-access measurements. Source delivery and current production acceptance follow separately.

Delivered as `870e4d7af05f533b8f3b9b1da4268d3265e13256`; Cloudflare build `2c7c1463-9488-433e-a949-4ea05222a8aa` completed successfully. Seven fresh public reads verified matching HTML source/build markers, the visible results, unchanged saved-example evidence and exact served CSS/main/report bundles. Client bundles were reproduced with the served public build metadata. The live browser confirmed zero result rows inside disclosures, keyboard section navigation and method disclosure, and a 320px layout without horizontal overflow. The [normalized acceptance receipt](2026-11-11-visible-report-acceptance.json) preserves these conditions. The requested report correction is delivered; reader feedback remains the next usefulness signal.

### Request Inspector: referrer context — November 11

The [matched Google-referral investigation](../d1-read-budget/07-zero-click-google-referrer-investigation-2026-11-11.md) established a useful interpretation boundary: an external referrer is a reported source, not an authenticated source or a fresh search click. A controlled browser click followed by reload produced two requests retaining the same external referrer. This agrees with the [HTML navigation model](https://html.spec.whatwg.org/multipage/browsing-the-web.html#document-state); [Fetch Metadata](https://www.w3.org/TR/fetch-metadata/) describes request context, and its `none` value is not an automation verdict. The investigation did not authenticate any of the 79 historical Browser observations as Google arrivals, owner tests or automation, and established no counting defect.

The existing Request Inspector on `/ai-check` now turns this lesson into a useful diagnostic. It shows external, internal, absent or unusable referrer state, the parsed site-relationship claim, navigation/activation signals and the classifier's existing context-conflict result. External referrer plus same-origin context is explained as needing review, without calling it proof of automation. Compatible context stays source-unverified; an absent referrer stays source-unknown. The Inspect button checks its own fetch from this page, rather than reconstructing the page's original arrival.

Request assessment profile `2026-11-11.1` adds a closed `context` object to the documented API. No referrer URL, hostname, path or query is returned. Unknown site values become null, with the existing evidence bits retaining parsing state. The classifier, analytics persistence, origin protections, audit request budget and 100-point access rubric are unchanged. A URL audit cannot inspect another site's actual visitors or reconcile its Search Console clicks.

Local acceptance: workspace typecheck, 448 analytics tests, 444 blog tests, 34 Markdown validations, referral-policy verification, an isolated 45-post build and Worker dry-run passed. The native Worker/D1 harness passed 58 requests, validated four actual responses against OpenAPI, retained cross-site rejection before quota admission and made zero external requests. Its transport emits `Sec-Fetch-Mode: cors`, so navigation classification is separately exercised with actual `Request` fixtures rather than pretending the native transport preserved a navigation header.

The browser used the built HTML/CSS/client scripts and the real assessor with explicitly supplied, labeled request scenarios. External cross-site, external `none`, external same-origin conflict and absent-source states rendered with the expected explanations. The 393px view had no horizontal overflow. These are controlled rendering/adapter observations, not measured Google clicks or provider authenticity. Integration retained the concurrent visible-report renderer from `870e4d7a`; workspace typecheck, all 445 combined blog tests, a rebuilt 45-post site and the 58-request native harness passed again. Production activation and current served acceptance follow separately; local test logs, screenshots and supplied scenarios remain outside Git. Next bounded action: publish and verify the served page, assets, schema and one controlled request assessment.

Delivered as `d3e08ba55fa18d03e92d52b939126b301308d682`, included in served main revision `2b3aad279e3729a139b424f180346d309f69500f`. Cloudflare build `4cf2abb3-41e9-4313-a30a-48df707df027` succeeded. The [fresh acceptance receipt](2026-11-11-request-context-acceptance.json) records matching served source identity, exact built inspector/CSS assets, the versioned closed API schema and a controlled conflict response that did not echo its supplied referring hostname. The real public Inspect button reported its internal same-origin fetch, navigation-shaped false and absent activation, with the explanation that this is not a new external arrival. Two production request assessments used the ordinary shared allowance; no target URL audit, allowance reset or bypass was performed. The requested diagnostic improvement is complete. The historical source-authentication limit remains; further reader usefulness or a full log/Search Console reconciliation tool would need separate evidence and scope.

### Separate Request Inspector tool — November 13

Request Inspector now has its own canonical page at `/tools/request-inspector`, with an independent introduction, inspection action, evidence explanation, script-free JSON link and API example. `/ai-check` retains the public-URL checker and its report flow. The directory tile and shared tool navigation link to the separate page; the sitemap, agent index and request operation's documentation link expose the new destination. The ten-check allowance is still shared between the two tools and is stated on both pages.

The request renderer and component moved into their own browser entry point. Shared feedback presentation remains reusable without making either tool import the other. Built-asset checks confirm the inspector loads only its own tool bundle, and the URL checker no longer includes the request endpoint or component. Result headings use the standalone page hierarchy, and the five-item navigation wraps without horizontal overflow at 320px. API assessment, privacy, classifier and quota behavior are unchanged.

Local acceptance: workspace typecheck, all 450 blog tests, 34 Markdown validations, referral-policy verification, an isolated 45-post build and Worker dry-run passed. The native Worker/D1 harness retained 58 passing HTTP cases and zero external requests. The new component fixture confirms no request on page load and one request on explicit inspection. Its DOM fixture mounts completed page markup before connecting the component, matching deferred-script initialization; earlier parser-order fixture failures remain in private logs.

Browser checks used the actual built pages, CSS and client scripts with labeled supplied API responses, including the real request assessor. Directory navigation opened the independent page; inspection rendered evidence and the remaining allowance; quota feedback retained the earlier result. The URL checker had its own form and loaded its saved example through its separate bundle. Desktop and 320px layouts were inspected. A zero-script copy kept the JSON link usable and native navigation returned the controlled response. No production assessment, target audit or provider trial was performed during these local checks. Raw fixtures, screenshots and logs remain outside Git. Next bounded action: publish the checked separation and record fresh served identity, discovery links, assets and the live standalone inspection.

Delivered as `459aa5e5b1cb42adf12271cf58e4a2c7e86db8d1`; Cloudflare build `2a609497-4f13-4dd7-8830-31b195e18c46` succeeded. The [fresh acceptance receipt](2026-11-13-separate-request-inspector-acceptance.json) records ten marked public reads confirming matching served source identity, independent pages and exact tool bundles/CSS, canonical URL, directory link, discovery indexes and API documentation. The live browser followed the directory tile to the independent inspector, submitted one successful inspection using the ordinary shared allowance, and navigated to the URL checker with its form and no inspection action. No target audit, quota reset or bypass was performed. The separate-tool implementation and delivery are complete; reader usefulness and adoption remain unmeasured.

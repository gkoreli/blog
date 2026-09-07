# Article 024 title and discovery decision

September 6, 2026 PDT / September 7 UTC. The author asked whether first-person or second-person wording would help people and AI agents discover the article. The decision is to lead with the recognizable problem and retain the firsthand scope: **Bot Detection Without JavaScript: What My Blog Measured**.

## Article passport and reader job

The [revision audit](17-article-revision-2026-09-06.md) establishes the governing form, evidence inventory, protected quotations, series, and stopping rule. Those remain intact. This is a bridge article: an investigation of the author's own analytics supplies reusable request-classification mechanisms and evidence boundaries. Its unresolved center is the difference between applying deterministic rules and knowing who read the writing.

The primary reader job is understanding what server-side bot detection can establish without a browser script. Secondary subjects are Cloudflare Workers analytics, request headers and Fetch Metadata, hosting-network evidence, and signed agent identity. The body explains those mechanisms, reports 372 browser-UA requests becoming 95 Browser HTML observations, compares 95 with 14 script page loads, and identifies defects and uncertainty. It cannot promise accurate human counts, universal bot identification, bot blocking, a completed deployment tutorial, or a solved edge-versus-RUM discrepancy.

There is no page-filtered search-demand measurement supporting this title change. The language is grounded in the implementation and primary terminology: Cloudflare calls its system [bot detection](https://developers.cloudflare.com/bots/concepts/bot-detection-engines/). A current search-results inspection confirmed that terminology exists; it did not establish search volume or ranking potential. That terminology does not imply the blog implements Cloudflare's commercial detection engines.

## Title packages considered

All three retain the current slug, original publication date, section, tags, series, headings, protected prose, and contextual links to articles 020 and 023. The current alternative headline and opening preserve the 74.5% rule effect and unresolved comparison. Their reusable assets are the request-rule table, dated measurements, public evidence records, and method checklist.

| Package | H1 / sharing title | Search title | Description and reader promise | Decision |
|---|---|---|---|---|
| First-person mechanism | How I Classify Browser and Bot Requests Without JavaScript | Browser and Bot Classification Without JavaScript | Cloudflare Workers request rules reclassified 74.5% of browser-UA traffic; inspect their effect and limits | Honest existing title, but classification vocabulary is less immediately recognizable as the problem. |
| Second-person guide | How You Can Detect Bots Without JavaScript | How to Detect Bots Without JavaScript | Apply request headers and network evidence to your own analytics | Rejected: suggests a general how-to and a reliable detection outcome beyond this case study. No evidence establishes a pronoun advantage. |
| Subject-first investigation | Bot Detection Without JavaScript: What My Blog Measured | Bot Detection Without JavaScript on Cloudflare Workers | Cloudflare Workers bot detection without JavaScript: headers, network evidence, and an unresolved gap of 95 browser observations versus 14 script page loads. | Selected: names the problem and platform while identifying the original measurements. |

“I” remains appropriate in the article. “My blog” in the title supplies the firsthand boundary after the problem phrase. “You” is useful when addressing a reader's decision; it is not an established search or agent-retrieval optimization.

## Promise and metadata checks

| Promise | Body evidence | Boundary |
|---|---|---|
| Bot detection | “The request rules in the Cloudflare Worker” and the open-source classifier section | Heuristic classification with stored reasons; accuracy remains uncalibrated. |
| Without JavaScript | Successful HTML responses are observed at the Worker; classification uses server-side evidence | No browser script is required by this classifier. The Worker itself runs JavaScript, and Cloudflare RUM is a separate script-based comparison. |
| What my blog measured | September 4–5 table, rule-effect calculation, parser reproduction, stored signatures | Request observations, not verified people or content consumption. |
| Cloudflare Workers | Linked ingestion/classification code and deployed-repair record | Does not promise a tutorial for Cloudflare's paid Bot Management product. |

H1, Open Graph, JSON-LD headline, generated Markdown, and citation titles use the same title. The search title supplies the platform without changing the promise. The description retains the concrete counter discrepancy. Existing headings already identify the mechanisms; no keyword-only body section is added. The public URL stays stable.

[Google's title-link guidance](https://developers.google.com/search/docs/appearance/title-link), checked September 7 UTC, recommends descriptive, concise titles and warns against keyword stuffing. It describes multiple title sources, including H1, `<title>`, Open Graph, and links, and says reprocessing may take days to weeks. It does not recommend a first-person or second-person pronoun. This is a wording and promise-fit decision, not a measured ranking improvement. Nothing in the reviewed sources establishes a universal pronoun preference across AI search products.

## Distribution and observation window

For sharing, the original finding is the useful hook: the rules moved 74.5% of browser-UA traffic, yet 95 Browser observations still differed from 14 script page loads. The research footprint belongs in the transparency record; token volume is not the reason to read the article. Posting to HN or X is separate from publishing this metadata and has not been performed as part of this change.

Keep this title stable through September 28 unless it contains a factual error or repeated reader feedback shows a misleading promise. During that interval, collect page-filtered Search Console queries and clicks if available, actual displayed snippets, attributable referrals, corrections, and reports of use. Search recrawl timing, promotion, and the small audience prevent attributing a traffic change solely to this title. A useful falsifier is repeated arrivals expecting bot blocking or a complete setup guide; that would justify narrower wording. A few quiet days do not.

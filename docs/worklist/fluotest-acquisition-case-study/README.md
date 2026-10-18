# FluoTest: acquisition, publishing, and the story that spread

Research checked October 17, 2026 (America/Los_Angeles). Requested by Goga after seeing Hridoy Reh's X screenshot. This is a completed public-source investigation, not a published article or a live analytics audit. [Distribution census](distribution-census.md) · [58-entry content census](content-census.csv).

## Finding

There is a real product and a plausible AI acquisition channel behind the screenshot. The viral headline overstates the available evidence. FluoTest's founder reported 131 **total users**, with roughly half attributed to ChatGPT; Hridoy relabelled that as 131 customers sent by ChatGPT. No public cohort export or customer conversation validates that headline. The useful case is several months of product work, comparison content, community promotion, and a product badge, followed by amplification of the story by other publishers.

There are two outcomes to explain: people adopting the product, and people sharing a story about AI acquisition. The second cannot be used as a measurement of the first.

## Who built what

Dominik Sikora identifies himself as the founder of FluoTest and the Netherlands web design studio FluoSite. His public Reddit profile links the product and his X account, tying u/Kostich02 to that professional identity. The studio's own problem was unqualified discovery calls. FluoTest assigns points to answers, groups respondents by score, and routes them to a booking, email, or other next step. [Founder account](https://fluotest.com/en/about), [Reddit profile](https://www.reddit.com/user/Kostich02/).

The early offer was easy to understand: a free alternative to expensive scored-quiz products. An early [SideProject post](https://www.reddit.com/r/SideProject/comments/1shefov/i_built_a_free_alternative_to_scoreapp_1000year/) explicitly describes the free product as a way to attract business to his web studio. Later he introduced SaaS subscriptions. These are successive business models; free signups are not equivalent to paid software customers or studio clients.

The [changelog](https://fluotest.com/en/changelog) dates Pro at €12/month or €120/year to May 24, with early users grandfathered in. It records broader automation later, a Claude directory listing on September 24, and a ChatGPT plugin listing on October 7. Those later integrations cannot explain the March referral. Product Hunt's live page names Vercel, shadcn/ui, and Supabase under its build stack; this is a listing, not a code audit or a functional test. [Product Hunt](https://www.producthunt.com/products/fluotest).

## Dated reconstruction

| Date or period | Event and source | What it establishes |
|---|---|---|
| February, reported retrospectively | Founder says he built the initial quiz tool for his studio. | Origin story; launch not independently timestamped here. |
| March 7, displayed publication dates | Current archive dates the ScoreApp and Typeform comparisons here. | Current metadata, not archived proof of their original wording. |
| March 12, screenshot described in October account | User #26 allegedly came from ChatGPT, landed on the ScoreApp comparison, browsed about 19 minutes, and signed up. | A founder-supplied referral example; no saved customer chat. |
| April 3, Reddit page timestamp | 41 users across 14 countries; reports Facebook posts, Reddit answers, comparison content, and unsuccessful mass messages. | Distribution already involved deliberate work. |
| April 17, displayed article date | Early badge/distribution account reports 65+ users and an activation improvement. | Self-report, with no disclosed activation cohort or definition. |
| May 13, Reddit timestamp | 100+ users; says two earlier Reddit posts produced an initial burst, Google picked up around week six, and LinkedIn outreach failed. | Mixed acquisition, not a single-channel beginning. |
| May 19 | Product Hunt launch, dated in the press kit; promotion posts survive on Reddit. | Launch happened; current listing shows 21 points. |
| May 24 | Pro release in changelog. | Paid tier existed before the viral Reddit story. |
| May 30, 20:29:39 UTC | Original r/SaaS post reports 131 users, about half attributed to ChatGPT. Current browser display: 999 score, 335 comments. | The underlying post exists and attracted substantial discussion. |
| May 31 | Founder pins an X post claiming 220k Reddit impressions in 24 hours and linking the longer explanation. | Founder-reported impressions; the X post itself currently shows 185 views. |
| June 1, displayed article date | Longer acquisition story on the product blog includes a Clarity referral image. | Public narrative and supplied evidence; publication metadata is mutable. |
| June 3, newsletter URL date | GoToMarket.news republishes the case. | External amplification; not an independent analytics verification. |
| June 7, Reddit timestamp | 150 users, 17 countries, reported split: 49% ChatGPT, 18% Reddit, 15% Google, 11% friend referral. | Later reported mix; no underlying table supplied. |
| June 17, Reddit timestamp | First-payment story: 170 users; founder recovered a failed payment with a personal email. | Payment was a separate milestone from account acquisition. |
| June 29 | Founder publishes a GEO playbook; Hridoy shares the story on X. | Intentional optimization and continued distribution; Hridoy's post currently shows 8,843 views. |
| October 7, displayed article date | 500 signups, 553 quizzes, 4,206 answers, four paying customers; 205 of first 499 said an AI assistant sent them. | More useful denominator and usage measures, still self-reported. |
| October 12–15 | Founder posts newer acquisition and revenue figures on X. | Public snapshots are inconsistent in details; do not merge them into audited current metrics. |
| October 16 | Hridoy reposts the screenshot: 694,204 displayed views, 11,888 likes, 191 reposts, 56 replies at observation. | A much larger later media event, months after the original Reddit post. |

Milestone links and attribution qualifications are in the [distribution census](distribution-census.md). Reddit dates above came from rendered page `time[datetime]` elements, not “months ago” labels. Early dates remain UTC; the original post was May 30 at 1:29 PM PDT.

The [October account](https://fluotest.com/en/blog/from-a-problem-to-500-users) predates Hridoy's October 16 viral post. It therefore rules out the later repost as the cause of the first 500 reported signups. It does not tell us how many additional signups that repost produced.

## What he wrote

The [English archive](https://fluotest.com/en/blog) exposed 58 unique entries: 55 blog URLs and three role landing pages. Category normalization gives 29 guides, 14 comparisons, seven use cases, four founder updates, one pricing article, and three role pages. Monthly entries: March 9, April 8, May 4, June 8, July 7, August 5, September 10, October 7. The CSV preserves the site's original category labels and displayed dates.

Twenty-one entries carry dates before May 30: nine comparisons, five guides, three use cases, one founder update, and three role pages. This is a reconstruction from today's archive, not proof that all 21 were live by that date. The original Reddit discussion does independently establish that comparison content existed before the story.

The writing covers different stages of an actual decision:

- **Switching:** named competitors, price/limit comparisons, and who should choose each product.
- **Using:** lead qualification before calls, embedding, branching, and later migration from ScoreApp.
- **Recognizing a use case:** coaches, agencies, healthcare, education, hiring, real estate, and fitness.
- **Starting immediately:** free templates and assessments linked to a working tool.
- **Following the builder:** user milestones, unexpected uses, and the acquisition story itself.

The [current ScoreApp comparison](https://fluotest.com/en/blog/fluotest-vs-scoreapp) opens with the decision and price difference, then explains both products, presents a feature table, identifies reasons to choose the competitor, answers objections, and links to signup, pricing, templates, and migration. That structure makes the page useful to a person already choosing a tool. It is an observable property; its effect on model selection was not isolated experimentally.

The page now contains later features, including the importer and MCP connections. Its March date must not be mistaken for a snapshot of what ChatGPT could have read in March. Nor did this investigation verify the competitor's prices independently; they are evidence of his positioning, not buying advice.

## What the comments change

The [original Reddit discussion](https://www.reddit.com/r/SaaS/comments/1tsam1y/i_accidentally_discovered_that_chatgpt_was/) contains more useful qualifications than the screenshot:

- He confirms the comparisons were on his own website.
- He explains that the visitor's likely prompt was reconstructed: “i can imagine what he probably typed.” The referral and his own reproduction do not recover the visitor's actual question.
- He says he used a comparison table, FAQ, and FAQ schema; his belief that they helped most is not an ablation result.
- He says he cannot share the link again because he has already shared it too much. The discussion itself is part of distribution.
- Replies include other founders' anecdotes, visibility-tool promotions, and skepticism. Agreement in those comments is not independent validation of his totals or mechanism.

In the [May milestone comments](https://www.reddit.com/r/buildinpublic/comments/1tc8i6x/from_0_to_100_users_in_11_weeks_with_zero_ad/), he identifies onboarding questionnaires as the acquisition measurement and says he has been publishing LinkedIn content throughout, with only about two arrivals from it. The [June playbook](https://fluotest.com/en/blog/how-we-got-cited-by-chatgpt-and-perplexity) also says attribution comes from asking new users. Those are useful customer reports, with recall and attribution limits; they are not all referrer-verified conversions.

The [X replies](https://x.com/hridoyreh/status/2111145144506352107) add no visible cohort audit. One commenter reports a hobby blog receiving AI traffic for practical Istanbul questions; another points out that a chatgpt.com referrer does not reveal the prompt. Others describe third-party sources or repeat generic GEO advice. These are leads for hypotheses, not proof of the acquisition formula.

## Why the story spread

The strongest supported interpretation is a combination of three mechanisms:

1. **Product discovery:** a specific, usable free option where people already look for alternatives. The content, onboarding source reports, and referral image are consistent with this mechanism.
2. **Product-carried exposure:** quizzes show a FluoTest badge to respondents. The founder deliberately describes this as his distribution model. Its incremental contribution and the SEO value of embeds/backlinks were not measured here. [Badge explanation](https://fluotest.com/en/why-free).
3. **Founder-story distribution:** a surprising discovery, a vacation scene, small concrete numbers, an accessible explanation, and a question inviting other builders to participate. Reddit, newsletters, and a later marketer's screenshot made that story travel beyond the product's buyers. This explanation of narrative appeal is interpretation, not platform-algorithm evidence.

The formula was memorable enough to keep circulating. Hridoy had already shared substantially the same case in June. October's bigger response does not identify which factor changed: timing, audience, network exposure, presentation, or something else.

The founder's own [X profile](https://x.com/sikora_dominik_) showed 71 followers and 470 posts, with several recent posts receiving only tens of views. October 14 reports 536 users, five paying, and €58 MRR; October 15 says €46/month. These are inconsistent snapshots, not an audited revenue series. The case demonstrates reported acquisition and a viral story; it does not establish a large, profitable business.

## Evidence boundaries

The headline's arithmetic is wrong relative to its source. The underlying channel remains plausible. Neither conclusion requires alleging fabricated users or attributing deceptive intent to the founder.

Public evidence does not establish which pages caused how many signups, how many people saw a recommendation without clicking, the prompts buyers used, current retention, complete referral journeys, net profit, or the uplift from any specific GEO technique. Signup-source answers, referrals, AI fetches, citations, and revenue must remain separate.

Two narrative tensions matter. The April badge article claims no cold outreach, while later Reddit posts describe failed outreach. A later AIIncomeLab story describes a no-conversation payment journey; an earlier first-payment post describes personal recovery email. These may describe different boundaries or customers. The public record does not settle that. Preserve the narrower measured statements instead of repeating the frictionless origin story.

## What Goga can use

The transferable idea is to make an existing piece of work the useful destination for a concrete question, and deliberately put that work before people who have that question. The case does not justify turning personal essays into alternative-product pages or adding another AI metadata system.

| FluoTest's advantage | Closest useful equivalent on this blog | Boundary |
|---|---|---|
| A named switching decision | [Code-context tools](https://gkoreli.com/you-dont-need-codemap): mapping, search, and repository packing solve different needs. | Use the actual comparison and findings; do not claim ghx wins every workflow. |
| A page answering a narrow practical problem | [Prompt-cache context edits](https://gkoreli.com/prompt-cache-context-edits): what changes invalidate reuse, and what the tested harnesses actually do. | Keep provider versions, experiment size, and freshness visible. |
| Evidence that helps someone choose | [AI fetcher headers](https://gkoreli.com/which-ai-fetchers-send-which-headers): identifiable request fields, source data, and reproduction method. | Fetches do not prove citations or readership. |
| Immediate product action | A useful table, reproducible command, dataset, or decision the reader can apply, followed by a relevant next article or subscription. | A blog read/subscription is a different conversion from a free app account. |
| Repeated distribution around one problem | Share each concrete finding in the relevant technical discussion, with authorship disclosed and a self-contained useful answer. | No mass DMs, undisclosed promotion, or automatic posting authorized here. |
| Product badges carrying attribution | Evidence artifacts and code people can reuse with a clear original source link. | This is a hypothesis for distribution, not a reason to build an unrelated tool. |

The code-context URL was checked against its repository metadata. The table expresses topic fit, not a shipped metadata change.

### What we actually checked about this blog

The live `https://gkoreli.com/robots.txt` allowed `User-agent: *` and `Allow: /`, with search/AI-input content signals and a sitemap. This is not a full Cloudflare firewall/IP-range audit. Official OpenAI documentation identifies OAI-SearchBot as the search crawler and distinguishes it from user-triggered ChatGPT-User requests. [Official OpenAI documentation](https://developers.openai.com/api/docs/bots).

Two targeted searches without the author's name or domain — `"AI fetchers" "headers"` and `"prompt caching" "context edits"` — returned the corresponding gkoreli.com articles in this session. These were deliberately close topical queries, not a demand estimate, broad competitive ranking study, or a fresh ChatGPT recommendation test. The result supports discoverability for those queries only.

The [saved September 2 ledger](../../../packages/blog/drafts/research/readers-vs-bots/02-evidence-ledger.md) recorded four chatgpt.com-referred views in a 30-day window, three to Topologies of Thoughts, and 33 ChatGPT-User fetches across eight paths. That historical classifier had known limits; neither category proves organic human referrals or unsolicited recommendations. No current production analytics query was run for this investigation. The [latest relevant handoff](../../handoffs/2026-09-09-analytics-and-agent-research-checkpoint.md) preserves the measurement limits.

We therefore cannot establish “ChatGPT never recommends the blog,” or explain its recommendation frequency from current evidence. Possible constraints are limited demand for a niche question, competition from established sources, an answer that needs no outbound click, weak distribution, or source-selection variability. These remain hypotheses rather than a diagnosed cause.

### Next bounded experiment — proposed, not executed

Start with three existing practical articles above. Use page-filtered Search Console queries to identify real relevant language before editing. Record a small set of unbranded questions, including one broad question, one narrow implementation problem, one comparison, and one request for original evidence per topic. Examples to refine from actual reader evidence:

- Which HTTP headers identify ChatGPT and Claude requests to a website?
- How can a site distinguish an AI fetch from a human visit without JavaScript?
- Does changing an agent's system prompt invalidate the prompt cache?
- How do agent harnesses update context while preserving cached prefixes?
- When should a coding agent use a repo map rather than search or repository packing?
- Where can I find measured AI fetcher request headers and the underlying data?

Run each fixed question in fresh ChatGPT conversations without mentioning Goga or supplying his URL. Record product/model, search state, date, exact prompt, answer, source URLs, and whether the article was retrieved, cited, or explicitly recommended. Repeat sufficiently to expose variability; a proposed starting sample is 12 questions × 3 fresh runs. It is a diagnostic sample, not a market-wide visibility score. This Codex session's topical searches do not count toward it.

Compare the sources selected and the passages that answer the question. Revise only where the existing evidence supports a clearer answer or a real omission; preserve caveats. Measure subsequent attributed visits, article use/reader replies, and confirmed subscriptions separately. Keep the original prompt set, and observe a later window before attributing a change to the edit. No schedule or external communications have been created.

## Method, completion, and remaining access limits

Completed: browser reading of the X post and a substantial set of visible replies; original Reddit post, visible comments and extended search-rendered discussion; founder/product identity; linked milestone posts; Product Hunt listing/comments; current archive census; principal comparison and growth articles; changelog; amplification examples; comparison with saved blog evidence and live discoverability.

The current Reddit submissions browser view reported hidden posts. A search-rendered historical profile exposed older submissions and supplied links to individual posts; it is explicitly a historical discovery aid, not a complete current account export. Removed and deleted comments were not reconstructed. Facebook group names, private analytics, raw signup questionnaires, and every historical social post remain unavailable. No historical archive snapshots were acquired. The 58-entry census covers the current English archive, not every site URL or translation; not all 58 bodies were read. No product account was created or app workflow tested.

Research is complete for the public-source reconstruction. Further causal claims require new evidence, not more retellings of the same post. The next action, if this direction is pursued, is the bounded blog visibility experiment above; it is not an unfinished acceptance check on this report.

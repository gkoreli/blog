# Operational GEO/AEO frontier beyond `llms.txt`

**Research cutoff:** 2026-08-25  
**Purpose:** identify what a publisher, product team, or independent technical writer can actually do and measure beyond `llms.txt` without turning uncertain observations into ranking promises  
**Target use:** a compact evergreen complement to `019-does-llms-txt-work.md`, not a generic marketing encyclopedia  
**Production edits:** none

## Executive finding

The operational frontier is not a new machine-facing prose style. It is a set of provider- and outcome-specific practices:

1. preserve ordinary crawl/index eligibility and canonical content;
2. publish first-party information that a retrieved answer can use and another page cannot reproduce;
3. supply authoritative structured facts through product, local, or other domain-specific feeds when the business actually has those facts;
4. make the site's identity internally consistent and externally checkable without manufacturing mentions;
5. measure provider-native impressions/citations, sampled answer presence, server requests, referrals, and downstream outcomes as separate events;
6. sample prompts and repeated runs explicitly because generated answers and sources vary across engines, executions, time, locale, and user context;
7. preserve raw outputs, exact conditions, and interventions so a trend is auditable rather than a screenshot story.

Three findings should govern the article delta:

- **There is no universal “AI rank.”** Google exposes page impressions in generative Search features; Bing exposes aggregated citation activity and sampled grounding phrases; prompt-monitoring vendors observe a constructed panel of answers; server logs observe requests; analytics observes some referrals. These are different populations and events.
- **The latest provider actions are data- and audience-specific.** Google points ecommerce and local businesses toward Merchant Center and Business Profiles. OpenAI accepts structured product feeds from approved partners. Google now lets existing readers select a publication as a preferred source. None of those mechanisms implies that generic schema, brand mentions, or a text file improves open-web citation selection.
- **The strongest current workflow is repeated measurement around a real decision.** Fix a prompt frame and conditions, run enough repetitions to expose volatility, archive answers and sources, make one declared intervention, wait for crawl/retrieval refresh, and compare distributions rather than one answer. Even then, describe an association unless the design isolates the intervention.

For gkoreli.com, the near-term complement is modest: keep excellent HTML and internal links, publish code-backed first-party investigations, establish a small dated prompt panel around actual reader questions, use provider-native reports and referrals when they exist, and treat third-party mentions as the result of useful distribution—not an input to manufacture. Product feeds, local profiles, enterprise visibility platforms, and a Preferred Sources button do not solve this blog's current lack of an audience.

## Evidence vocabulary

The labels SEO, AEO, and GEO are too broad to be measurement fields. This artifact uses event stages instead.

| Stage | Operational question | Observable evidence | Common false inference |
|---|---|---|---|
| Eligibility | Can the provider crawl/index/use the page at all? | status, robots controls, `noindex`, canonical state, provider inspection tools | Eligibility means selection. |
| Search activation | Did the product decide to search or rely on model memory? | product trace when exposed; answer/source behavior under controlled runs | Every answer consulted the live web. |
| Retrieval | Which documents entered the candidate/context set? | provider trace or research instrumentation; a request is only a partial proxy | A crawler request proves retrieval for this answer. |
| Citation selection | Which pages or domains were displayed as sources? | provider citation report or archived answer | The cited source supplied the answer's important claim. |
| Absorption/fidelity | What language, fact, or evidence from a source entered the answer, and accurately? | answer-to-source comparison, claim-level annotation | A citation count measures influence or correctness. |
| Brand/entity representation | Was an entity named, recommended, or described correctly? | archived answer, stance and accuracy annotation | A mention is a citation, recommendation, or positive sentiment. |
| Referral | Did a person click to the site? | UTM/referrer/server session evidence | All assistant-driven visits preserve a referrer. |
| Outcome | Did the exposure lead to contact, signup, sale, subscription, or another declared result? | first-party product/business telemetry | A citation or visit caused the outcome. |

This extends, rather than replaces, the six-stage model already in the draft. The added terms—search activation, absorption/fidelity, and entity representation—are useful when discussing current monitoring products and research.

## Evidence hierarchy used here

| Tier | Evidence type | What it can support | What it cannot support by itself |
|---|---|---|---|
| A | Provider implementation and telemetry documentation | What that provider accepts, reports, or explicitly ignores at the access date | Independent causal lift; transfer to other providers |
| B | Peer-reviewed controlled research with public method | Effects inside the isolated stage and benchmark | Organic discovery or business impact outside the design |
| C | Transparent first-party production experiment | What happened to that corpus/system under its bundled intervention | Which component caused the result; broad transfer |
| D | Cross-platform observational study or preprint with public protocol/data | Associations, variance, candidate metrics, new hypotheses | Causal optimization rules |
| E | Vendor self-case or monitoring study with disclosed sampling | Operational workflow, product-observed trends, possible hypotheses | Neutral causal proof, audience reach, universal platform behavior |
| F | Screenshot, anecdote, undisclosed score, composite case, or “internal metric” claim | A question to investigate | A recommendation or quantitative claim |

Recency is not evidence quality. A 2026 dashboard launch can authoritatively define its own metric while providing no causal optimization evidence.

## What is established enough to act on

### 1. Ordinary search eligibility remains the base layer for search-backed answers

[Google's July 2026 guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) says its generative Search features are rooted in core Search ranking and quality systems. Pages must be indexed and eligible for a snippet. Google explicitly says publishers do not need `llms.txt`, special AI markup, tiny “chunks,” a machine-only rewrite, or special schema to enter AI Overviews or AI Mode.

Google also documents query fan-out: one user question may cause concurrent related searches. The operational response is not one page per guessed hidden query. Google warns that creating many query-variant pages primarily to manipulate rankings or generated answers can violate its scaled-content policy.

**Evidence state:** Tier A, provider-specific eligibility and policy guidance.  
**Safe action:** maintain crawlable, indexable, canonical, internally connected pages that satisfy a real information need.  
**Do not infer:** the same page will be selected, cited, or clicked.

### 2. Original, non-commodity evidence is the most defensible content investment

Google's guide prioritizes unique first-hand viewpoints and non-commodity content over summaries that could come from anyone or be generated from existing pages. Controlled GEO research likewise finds that evidence and clear claims can affect an answer after retrieval, but those experiments do not establish organic entry into the candidate set.

For this blog, first-party knowledge means artifacts such as:

- the code path showing why `ai_fetches` did not measure direct resource requests;
- dated Cloudflare edge snapshots with collection limits;
- exact HTML/Markdown byte and token comparisons with source and tokenizer named;
- reproducible client/tool failures, versions, fixes, and unsupported cases;
- longitudinal decisions—what was built, used, abandoned, or kept on probation;
- public benchmark protocols and negative results.

This is not “write statistics for AI.” The evidence must exist because the investigation produced it, remain qualified beside the number, and be useful to a human who never encounters an AI answer.

**Evidence state:** Tier A guidance plus Tier B after-retrieval research; the acquisition effect remains unproven.  
**Safe action:** publish details another source cannot supply and keep the claim, evidence, method, and limitation together.  
**Do not infer:** originality guarantees citation or traffic.

### 3. Different provider reports now expose different outcome layers

#### Google Search Console

The [Generative AI performance report](https://support.google.com/webmasters/answer/16984139) began a limited rollout in June 2026. It reports impressions for AI Overviews and AI Mode by page, country, device, and date.

Important limits in Google's documentation:

- the report is available only to a subset of properties and may also require sufficient impressions;
- it reports links shown, not grounding-query phrases, answer text, citation support, or conversion;
- chart totals may be property-aggregated while tables use different aggregation;
- the normal 1,000-row and Search performance limitations apply;
- newest data may be preliminary;
- Search Labs experiments are excluded.

#### Bing Webmaster Tools

[Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) entered public preview in February 2026. It reports total citations, average cited pages, page-level citation activity, trends, and sampled grounding-query phrases across Microsoft Copilot, Bing AI summaries, and selected partners.

Bing says its aggregates do not reveal ranking, authority, source placement, or a page's role in an individual answer. Grounding phrases are sampled, not a full query log.

**Evidence state:** Tier A telemetry contracts.  
**Safe action:** export the provider's native data, preserve its aggregation definitions, and report Google visibility separately from Bing citations.  
**Do not infer:** cross-provider share, audience reach, answer influence, or causal lift.

### 4. Requests, citations, mentions, and referrals require separate instruments

[OpenAI's publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) says a public site can appear in ChatGPT search, tells publishers not to block `OAI-SearchBot` when they want summaries/snippets, and says ChatGPT referral URLs include `utm_source=chatgpt.com`.

[Cloudflare's AI Crawl Control analytics](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/) separates crawler activity by path from AI-platform referrals. This is the right data shape, but neither event proves that a model used a fetched body.

Cloudflare's [crawl-to-referral methodology](https://blog.cloudflare.com/ai-search-crawl-refer-ratio-on-radar/) also names a serious attribution limit: native assistant apps may omit the `Referer` header, so referral counts can be understated and crawl-to-referral ratios overstated by an unknown amount.

**Evidence state:** Tier A provider/referral guidance plus first-party network methodology.  
**Safe action:** record direct resource requests at the edge/origin; record explicit ChatGPT UTM and known web referrers; keep unknown/direct visits outside the attributable count.  
**Do not infer:** no referrer means no assistant influence, or a crawler request caused a referral.

### 5. Domain-specific feeds and profiles are real interfaces; generic schema magic is not

Google's current guidance points businesses toward authoritative data products when the query depends on structured facts:

- [Merchant Center feeds and product structured data](https://developers.google.com/search/docs/appearance/structured-data/product) can supply price, availability, identifiers, shipping, returns, and other product facts. Google says using both page markup and a Merchant Center feed maximizes eligibility for supported product experiences; eligibility is not guaranteed display.
- [Business Profiles and local-business data](https://developers.google.com/search/docs/appearance/establish-business-details) let a verified operator maintain address, contact information, category, hours, photos, and official identity for Search and Maps.
- Bing's AI Performance guidance likewise points local businesses to Bing Places and publishers to IndexNow for changed URLs.

OpenAI's [Agentic Commerce product-feed documentation](https://developers.openai.com/commerce/guides/get-started) gives approved partners a documented schema and delivery path. It recommends a full feed snapshot on a regular cadence plus API updates during the day where appropriate. The [ChatGPT shopping help page](https://help.openai.com/en/articles/11128490) says product selection can consider first- and third-party structured metadata, price, reviews, availability, other third-party content, and conversation context. OpenAI does not publish factor weights or guarantee placement.

The boundary matters:

- product feeds are evidence for product/shopping systems;
- Business Profiles and local inventory are evidence for local systems;
- Organization/WebSite structured data can help Google disambiguate identity and display supported details;
- none of these establishes that adding arbitrary schema improves general ChatGPT, Claude, Perplexity, or Google AI citation rates.

**Evidence state:** Tier A interface and eligibility documentation.  
**Safe action:** provide accurate, fresh structured facts through the supported domain-specific interface when those facts exist.  
**Do not infer:** a generic schema score is a GEO ranking score.

### 6. Entity consistency is useful hygiene, not a manufactured-authority program

[Google's Organization documentation](https://developers.google.com/search/docs/appearance/structured-data/organization) says home-page organization data can help disambiguate an organization and influence supported details such as logo, administrative facts, merchant panels, and brand profiles. Its [site-name documentation](https://developers.google.com/search/docs/appearance/site-names) says the system considers WebSite markup, home-page content, and references appearing on the web.

This supports a bounded hygiene checklist:

- use the same person/publication/project names consistently;
- maintain an accurate About/profile page and canonical official URLs;
- connect real profiles and repositories only where the schema property applies;
- expose author, date, project, organization, and contact facts humans can verify;
- correct inaccurate third-party listings through their legitimate update processes.

It does not support “entity stacking,” mass `sameAs` links, fake profiles, or paid mention campaigns. Google's AI-search guide explicitly says seeking inauthentic mentions is not helpful and that its ranking and spam systems apply.

**Evidence state:** Tier A identity/disambiguation guidance.  
**Safe action:** make true identity facts consistent and checkable.  
**Do not infer:** entity markup or a knowledge panel causes general AI recommendations.

## What is established as a measurement constraint

### Answer and source volatility make a single prompt screenshot nearly worthless

The peer-reviewed ACL Findings paper [“Characterizing Web Search in the Age of Generative AI”](https://aclanthology.org/2026.findings-acl.526/) evaluated 4,706 queries across general, political, scientific, product, and recent-event datasets. It compared Google organic search with Google AI Overviews, Gemini, two OpenAI search configurations, and Perplexity Sonar.

Its relevant operational findings include:

- systems used very different retrieval footprints for the same broad workload;
- only 18% of AI Overview web pages overlapped when the same queries were measured two months apart, compared with 45% for organic results;
- answers to ternary questions changed in up to 27% of cases over five minutes and 28% over 24 hours;
- source and answer behavior differed by engine and query class.

The method fixed temperature at zero for configurable engines, used US and German locations, and still observed instability. A production interface may add personalization, product updates, or hidden retrieval changes beyond that setup.

**Evidence state:** Tier B, peer-reviewed cross-system characterization.  
**Operational consequence:** repeated runs, exact dates, interface/model, locale, and raw answer archives are minimum requirements.  
**Do not infer:** a missing citation in the next run means an intervention failed, or one appearance means durable visibility.

### Prompt tracking is a sample frame, not audience measurement

[Ahrefs' Brand Radar methodology](https://ahrefs.com/blog/brand-radar-methodology/) is unusually explicit about the boundary. It builds prompts from a keyword database, People Also Ask, and semantic fan-out; runs them through public interfaces; stores responses; and reports mentions/citations. Ahrefs says:

- possible prompts are effectively infinite;
- coverage is strongest in English;
- results are personalized and location-sensitive;
- its “Estimated Impressions” weight is a modeling choice based on Google search volume, not a validated measure of AI prompt demand;
- the product is a media-visibility audit, not traffic or audience measurement.

This is useful methodology from a vendor, not neutral proof that its prompt distribution matches a site's real prospective audience.

**Evidence state:** Tier E, transparent product methodology.  
**Operational consequence:** every prompt dashboard needs a written sampling frame and should be labeled modeled presence, not reach.  
**Do not infer:** a share-of-voice score is a traffic forecast.

### Citation selection is not answer absorption

The April 2026 preprint [“From Citation Selection to Citation Absorption”](https://arxiv.org/abs/2604.25707) analyzes a public dataset of 602 controlled prompts, 21,143 valid search-layer citations, and 18,151 fetched pages across ChatGPT, Google AI Overview/Gemini, and Perplexity. It proposes measuring whether a cited page's facts, evidence, wording, or structure actually contributes to the answer.

This distinction is valuable even if the proposed automated measurement is not yet a standard. A source can appear in a citation carousel but contribute little to the answer; an answer can mention an entity without citing its site; a page can be used but not named prominently.

**Evidence state:** Tier D, observational preprint and candidate measurement framework.  
**Operational consequence:** annotate presence, citation, important-claim support, brand mention, and correctness separately on a small human-audited sample.  
**Do not infer:** the preprint's page-feature associations are causal editing rules.

## Latest trends worth watching, not universalizing

### 1. Production GEO can be search/product architecture rather than paragraph rewriting

The Pinterest first-party preprint [“Generative Engine Optimization: A VLM and Agent Framework for Pinterest Acquisition Growth”](https://arxiv.org/abs/2602.02961) describes a deployed system that predicts search language for visual assets, creates semantically coherent indexable collection pages, and builds authority-aware internal linking across a massive corpus. It reports 20% organic traffic growth and multi-million monthly-active-user contribution.

This is the strongest kind of production direction in the current frontier because it has a real corpus and business outcome. It is also a bundled first-party preprint: query modeling, page construction, multimodal embeddings, and linking changed together, and the public abstract does not provide an independent replication.

**Evidence state:** Tier C, production preprint with bundled interventions.  
**Trend:** corpus-specific information architecture, multimodal representations, and internal retrieval surfaces.  
**Not a rule:** every site should generate collection pages or use a VLM.

### 2. Existing audience preference is becoming an explicit input

Google's [Preferred Sources](https://developers.google.com/search/docs/appearance/preferred-sources) now supports AI Mode and AI Overviews where available. A reader can select a domain, after which that domain may be highlighted for that reader. Google added a publisher button/deeplink implementation in August 2026.

This is not a cold-start acquisition hack. A publisher must first have a reader willing to make the choice, and the effect is user-specific. For a young personal blog, asking for this before earning loyalty would be premature; for a publication with a returning audience or newsletter, it becomes a legitimate distribution affordance.

**Evidence state:** Tier A, shipped provider feature.  
**Trend:** explicit audience preference inside machine-mediated search.  
**Not a rule:** adding the button improves generic ranking or visibility to people who have not selected the site.

### 3. Third-party evidence matters descriptively, but mention-building causality is weak

Three current evidence layers point in the same direction without proving a universal lever:

- Google says its generative Search can show what blogs, videos, and forums say about products/services, while explicitly rejecting inauthentic mention-seeking.
- OpenAI says ChatGPT Shopping can use third-party structured metadata, public reviews, and other third-party content; this is shopping-specific.
- The August 2026 preprint [“Invisible to the Machine”](https://arxiv.org/abs/2608.07069) pre-registered a seven-day audit of 4,776 venues in two Bali markets, 96 persona-conditioned queries, 2,208 search-grounded responses, and four production systems. Entry into answers was associated with an own website, listed prices, review volume, and third-party web mentions. Cross-system agreement was low, and the design is observational.

The safe operational lesson is to be accurately documented where real users already evaluate the entity: official profiles, relevant directories, maintained package/repository pages, customer/community discussions, and independent reviews. The unsafe lesson is “buy mentions” or “publish fake forum threads.”

**Evidence state:** Tier A platform-specific guidance plus Tier D local observational preprint.  
**Trend:** systems assemble entity/product judgments from an ecosystem of sources.  
**Not established:** a target number, source list, or causal mention-building playbook for general AI search.

### 4. AI exposure may drive off-platform behavior that referrers miss

The June 2026 preprint [“From Prompt to Purchase”](https://arxiv.org/abs/2606.10907) joins opt-in assistant conversations with the same users' clickstream and uses event-study, pre-trend, stance, non-customer, and same-category controls. It reports that genuine recommendations to users with no recent observed brand engagement were followed by more same-name search and own-site/retailer visits than matched backward placebos.

The paper is explicit that the design is observational, “non-customer” means no recently observed engagement, retailer visits are not transactions, and a within-session intent shock cannot be completely removed. Its main operational contribution is the confound, not the headline number: naive last-click or all-mention funnels can mistake existing customer activity for assistant-caused discovery.

**Evidence state:** Tier D, transparent observational preprint tied to a commercial measurement panel.  
**Trend:** incrementality and upper-funnel measurement beyond referrals.  
**Not established:** a general causal conversion rate from an AI mention.

### 5. Vendor workflows are moving from citation count toward competitive and accuracy panels

Semrush's May 2026 self-case [“How we're driving AI visibility”](https://www.semrush.com/blog/how-we-are-using-semrush-to-drive-llm-visibility/) describes starting with 39 buying-intent prompts, later expanding to 726, and tracking mention presence and competitive share of voice rather than citations alone. It reports moving from 13% to 32% on the early panel and from roughly 15% to 25% after the panel was reset.

Useful disclosure:

- the two baselines are not directly comparable;
- multiple tactics ran together, so the case cannot isolate which caused change;
- the company sells the monitoring product;
- revenue attribution remained unresolved.

A separate [Semrush 81-page study](https://www.semrush.com/blog/how-fast-do-ai-search-platforms-cite-new-content/) checked relevant prompts daily for 30 days. Google AI Mode citations rose and then fell sharply, while ChatGPT citations accumulated more slowly in that test. All pages were FAQ-style and published on a strong Semrush domain, with no randomized control. This is evidence of observed cadence/volatility on that corpus, not that FAQ formatting earns citations.

**Evidence state:** Tier E, vendor self-cases with useful method disclosures.  
**Trend:** prompt panels increasingly track recommendation stance, accuracy, competitors, and change over time.  
**Not established:** daily checking improves outcomes, vendor visibility scores represent reach, or the bundled content/PR tactics caused the reported gains.

## A workflow a real team can run

This workflow is intentionally smaller than an enterprise “GEO program.” Every step names its evidence and its stopping rule.

### Step 1 — Declare the decision and outcome

Examples:

- “Do our five core technical investigations appear as sources for the questions they actually answer?”
- “Does the assistant describe `@nisli/core` accurately when comparing zero-dependency component frameworks?”
- “Does a changed implementation page become visible in Bing citations after IndexNow submission?”
- “Do ChatGPT referrals reach the article and then read a second related post?”

Do not begin with “increase AI visibility.” Choose one event stage and a decision the result will change.

### Step 2 — Build a dated prompt frame from real questions

Use several sources and label each prompt's origin:

- Search Console queries and page-level impressions;
- Bing grounding phrases when available;
- internal site search, support issues, sales/community questions, GitHub issues, and article replies;
- People Also Ask or a keyword database as a search-demand proxy;
- semantic/fan-out variants as coverage hypotheses, not proof of prompt demand.

Stratify rather than collect an unstructured list:

| Stratum | Example | What it measures |
|---|---|---|
| Branded identity | “What is gkoreli.com?” | entity recognition and accuracy |
| Branded capability | “What does `@nisli/core` do?” | owned fact representation |
| Non-branded informational | “Do I need llms.txt?” | source/citation opportunity |
| Comparative/decision | “When is a page-level Markdown endpoint useful?” | recommendation and trade-off accuracy |
| Failure/problem | “Why can't browser analytics count AI crawler reads?” | unique first-party evidence retrieval/use |
| Current/freshness | a dated provider or version question | update/crawl sensitivity |

Keep the core frame stable across a declared measurement window. Add new prompts in a versioned frame rather than silently changing the denominator.

### Step 3 — Record the execution contract

For each run, retain:

- exact prompt and prompt-frame version;
- provider, product/interface, exposed model/version, mode, and whether search was invoked when observable;
- logged-in/incognito state, locale, language, device/profile, and personalization/memory setting when controllable;
- timestamp and timezone;
- answer text, source URLs as presented, source order/placement, and screenshot or machine-readable export;
- errors, refusals, absent search, malformed links, and retries without deleting them.

If a commercial tool does not expose the execution contract or raw outputs, treat its score as opaque directional telemetry.

### Step 4 — Repeat to estimate variance

There is no provider or field standard for the “correct” number of repetitions. A practical editorial protocol can run three to five repetitions per prompt/engine at baseline and again after the declared observation window, plus a smaller repeated-run check at another time or day. That number is an operating compromise, not a claim of statistical sufficiency.

Report both:

- **frequency:** appearances or correct answers across all runs;
- **stability:** whether the same mention, citation domain/page, and core answer persisted across repetitions.

Never collapse repetitions into a single best screenshot.

### Step 5 — Score different events separately

Recommended minimum fields:

| Field | Values/example | Why separate |
|---|---|---|
| search observed | yes / no / unknown | no-search answers cannot be treated as live retrieval evidence |
| entity mentioned | yes / no | mention differs from citation |
| stance | recommended / neutral / caution / not applicable | a mention can be negative or incidental |
| description accuracy | correct / incomplete / wrong / unverifiable | presence without fidelity can harm |
| site/domain cited | yes / no | domain presence differs from page presence |
| exact URL cited | canonical URL / other / malformed | detects drift and third-party substitution |
| important claim supported | full / partial / unsupported / not assessed | approximates absorption/fidelity |
| competitor/source set | domains and placements | reveals the actual information environment |
| attributable referral | sessions with known UTM/referrer | audience movement, not visibility |
| downstream result | contact/read-next/signup/etc. | only if the site can measure it honestly |

Use human review for the small important sample. Automated entity matching and citation-support scoring can assist, but false aliases, redirects, malformed URLs, and paraphrases require inspection.

### Step 6 — Make one bounded intervention

Examples that preserve authenticity:

- correct a false or missing fact on the canonical page;
- publish a real benchmark, trace, dataset, or reproduction that answers the unresolved question;
- add a natural internal link from the predecessor or supporting article;
- update a supported product/local feed because price, availability, hours, or identity is stale;
- correct a legitimate third-party project/directory profile;
- improve title/orientation/section labels so a cold reader understands the page's subject;
- notify supported engines of a genuinely changed URL through the provider's documented interface.

Avoid simultaneous rewrites, schema changes, new mentions, feed changes, and distribution pushes if the goal is learning which action mattered. When bundled changes are unavoidable, call the result a bundle outcome.

### Step 7 — Wait for the relevant system, then compare distributions

The observation window depends on the system:

- server delivery: immediate;
- edge requests: ongoing with your own probes excluded;
- crawl/index refresh: provider-specific and not guaranteed;
- Google/Bing native reports: their documented lag/availability;
- prompt panel: repeated at the predeclared cadence;
- referral and contact: long enough to avoid making decisions from single sessions.

Compare the same frame and execution contract. Report counts and uncertainty, not “rank up three positions.” If source/answer volatility is as large as the intervention effect, the honest result is inconclusive.

### Step 8 — Stop or expand based on decision value

| State | Next action |
|---|---|
| No provider-native visibility, no repeated prompt presence, no referrals | keep free hygiene; publish/distribute useful work; do not buy a large monitoring stack |
| Occasional presence but high run-to-run variance | continue a small repeated panel; do not react to individual changes |
| Repeated inaccurate entity/product facts | fix canonical and supported profile/feed sources; recheck after refresh |
| Repeated citations for a defined question but no referrals | decide whether source influence itself matters; do not call it audience growth |
| Material attributable referrals or contacts | add first-party analytics and reader-path analysis before vendor spend |
| A real product/local catalog with stale dynamic facts | invest in feed validation/freshness because correctness has direct user value |
| A large corpus and multiple teams depend on monitoring | consider a commercial platform only after auditing its sampling frame, raw-output access, locale/model controls, and modeled metrics |

## Genuine reader questions the article complement should answer

The article does not need to explain the whole marketing discipline. It should answer these questions because they arise naturally after “`llms.txt` is not an acquisition strategy.”

### P0 — If `llms.txt` is not the lever, what should I do?

Answer with a short staged rule:

1. make the canonical page eligible and understandable;
2. publish original evidence that answers a real question;
3. connect it through natural internal links and real distribution;
4. use a supported feed/profile only when the subject is product/local/dynamic data;
5. measure provider visibility, sampled answers, requests, referrals, and outcomes separately.

### P0 — What can I measure without pretending it is traffic?

Give one compact table:

| Signal | What it proves | What it does not prove |
|---|---|---|
| Google gen-AI impression | a site link was shown in a supported Google feature | query, citation support, click, conversion |
| Bing citation count | a page was displayed as a citation in covered surfaces | placement, authority, answer influence, reader |
| sampled prompt mention/citation | presence in that run and sampling frame | population reach or stable rank |
| edge/origin request | delivery attempt to the server | model use or answer appearance |
| UTM/referrer visit | attributable click for that session | prior unclicked influence or causality |
| contact/signup/sale | downstream event | which upstream exposure caused it without stronger design |

### P0 — How should I monitor prompts when answers change?

State that prompts are a panel, not a keyword universe. Version the set, preserve raw outputs, record engine/interface/date/locale, repeat runs, and report frequency plus stability. There is no universal repetition count or AI search-volume truth.

### P1 — Do schema, entities, reviews, or third-party mentions help?

Answer by scope:

- supported product/local/organization data has documented provider jobs;
- third-party content is explicitly used in shopping and appears associated with venue recommendation in one bounded observational audit;
- general citation lift from generic schema or a target number of mentions is not established;
- Google explicitly rejects inauthentic mention-seeking.

### P1 — Does a citation mean the answer used me or sent a reader?

No. Explain selection, absorption/fidelity, mention, referral, and outcome in one paragraph. This extends the draft's existing stage model without duplicating it.

### P1 — Should a personal blog pay for GEO monitoring?

Not before the result can change a decision. Start with Search Console/Bing if available, first-party referrals, edge evidence, and a small manual prompt panel. A commercial tool becomes reasonable when the prompt set, engines/locales, recurring reporting, and team decisions are large enough that manual preservation is the bottleneck—not because the dashboard supplies an internal rank.

### P2 — What about ecommerce, local, images, and agents?

Use these as a boundary example, not four tutorials: relevant businesses should provide accurate data through supported feeds/profiles and test browser-agent accessibility. A personal engineering blog should not copy infrastructure designed for a catalog or venue database.

## Folklore and vendor claims to reject or qualify

| Claim | State as of cutoff | Rationale |
|---|---|---|
| “GEO replaces SEO” | **Rejected for search-backed systems** | Google explicitly says its generative Search remains rooted in Search systems; other providers differ, but eligibility still precedes selection. |
| “There is one AI rank to track” | **Rejected** | provider reports and sampled prompt panels expose different populations and outcomes; answers are volatile. |
| “FAQ schema increases AI citations” | **Unverified folklore** | no general provider documentation or causal field evidence; Google says there is no special schema and structured data is not required for generative Search. |
| “Chunk every paragraph for AI” | **Rejected for Google; unproven generally** | Google explicitly says no tiny-chunk requirement. Clean sections remain human usability, not a ranking formula. |
| “Get N brand mentions/backlinks/reviews” | **Unverified as a threshold or causal rule** | observational associations and shopping/local evidence do not yield a universal count. Inauthentic mention-seeking is explicitly discouraged. |
| “YouTube/Reddit/Wikipedia mentions cause AI visibility” | **Vendor correlation, not causation** | current studies often correlate large-brand signals with large-brand visibility; the underlying brand strength and query mix confound the result. |
| “Estimated AI impressions are audience reach” | **Rejected** | Ahrefs states its estimate models potential exposure from Google search volume and is not measured AI usage. |
| “A citation is a recommendation” | **Rejected** | citations, brand mentions, stance, and answer influence diverge. |
| “A referral report captures AI influence” | **Rejected as complete attribution** | native apps may omit referrers, and unclicked mentions can lead to later branded search; direct attribution remains partial. |
| “Daily prompt changes prove content decay” | **Unverified without controls** | system/retrieval volatility can move the result without a content change. |
| “Product feeds improve general AI search” | **Scope error** | feeds are documented for shopping/commerce systems, not generic informational citations. |
| “Entity stacking makes an LLM trust you” | **Unsupported** | accurate identity data has legitimate disambiguation jobs; mass profiles/`sameAs` links have no demonstrated general citation effect. |

## Recommended article delta

### Governing form and protected center

The draft remains a first-person engineering investigation with a bounded verdict. The complement must not replace the metric failure, edge evidence, Google contradiction, or smaller-job decision with a generic GEO handbook.

The transition should follow the existing GEO evidence section, where the reader naturally asks: “If the hacks are not the answer, what is the real operational practice?”

### Add one section, roughly 650–900 words

Suggested heading:

> `## If llms.txt is not the lever, what is?`

Suggested movement:

1. **One declarative opening:** operational GEO is ordinary eligibility, original evidence, accurate domain-specific data, and stage-specific measurement—not a special writing dialect.
2. **One provider/measures table:** Google impressions, Bing citations/grounding samples, prompt-panel presence, edge requests, referrals. The “does not prove” column is essential.
3. **One compact action ladder for this blog:** semantic/canonical HTML; first-party investigations; contextual internal links; consistent author/project identity; small repeated prompt panel; native provider/referral evidence; investment only when the signal changes a decision.
4. **One domain boundary paragraph:** product and local businesses have real feed/profile interfaces; that does not transfer into a schema recommendation for an engineering blog.
5. **One volatility paragraph:** cite the ACL 2026 repeated-run findings and tell the reader to version prompts, record interface/locale/date, repeat runs, and preserve raw outputs.
6. **One authenticity paragraph:** genuine third-party documentation may enter the source ecosystem, but manufacturing mentions is unsupported and Google explicitly rejects it. The honest distribution goal is to make original work useful enough that relevant people cite or discuss it for their own reasons.
7. **One closing decision rule:** a signal earns instrumentation only when it can change a content, product, or distribution decision.

### Candidate table for the article

| Evidence surface | What it can tell me | What it cannot tell me |
|---|---|---|
| Google Search Console generative-AI report | pages and impressions in supported Google features | grounding queries, answer influence, reader action |
| Bing AI Performance | citations, cited pages, sampled grounding phrases in covered Microsoft surfaces | placement, authority, individual answer role |
| repeated prompt panel | mention/citation/accuracy frequency inside a declared sample | audience size, universal rank, causal lift |
| edge/origin logs | resource request, path, status, presented client | model use, citation, referral |
| UTM/referrer analytics | attributable visits | unclicked exposure, native-app visits without referrer, causality |

### Candidate blog-specific ladder

| Investment | Do now? | Trigger for more |
|---|---|---|
| Crawlable canonical HTML, sitemap, titles, internal links | yes | foundational, already valuable to readers |
| First-party code/evidence/reproduction artifacts | yes | core editorial advantage |
| Consistent author/project identity and accurate profiles | yes, when cheap | correct real ambiguity, not “entity score” |
| Manual repeated prompt panel | small experiment | a stable question set and decision owner |
| Provider-native AI reports | use when available | sufficient impressions/citations to interpret |
| Exact AI referral path analysis | after material referrals | enough sessions that the result can change distribution |
| Commercial AI visibility platform | no for current blog | manual collection becomes the bottleneck and raw outputs/method meet the audit |
| Merchant/local feed infrastructure | not applicable | only if the site becomes a relevant catalog/local business |
| Preferred Sources CTA | later | a real returning audience asks to follow the publication |

### Do not add

- a long list of schema types;
- an “optimize for ChatGPT/Claude/Perplexity” checklist with provider guesses;
- vendor correlation coefficients or case-study lifts in the main narrative;
- an arbitrary prompt-count, repetition-count, or share-of-voice target presented as a standard;
- advice to seed Reddit/forum mentions, buy PR, or construct fake entity profiles;
- a claim that Google/Bing reports reveal all AI exposure;
- a promise that first-party evidence produces traffic.

## Cross-reference map and rationale

| This finding | Existing artifact/article section | Why cross-reference rather than repeat |
|---|---|---|
| Stages and instrument boundaries | `019` section “Does llms.txt work? hides six different questions” | add activation/absorption/entity only where needed; preserve the existing strong table |
| Request/referral split | `02-cloudflare-static-request-observability.md`, `03-crawler-classifier-audit.md`, `06-edge-baseline-2026-08-24.md` | those artifacts hold implementation details; article needs only the event contract |
| Prompt/task experiment | `01-agent-use-benchmark-plan.md`, `05-benchmark-question-set.md` | reuse versioning, frozen conditions, and preserved disagreements rather than inventing a second benchmark |
| First-party evidence as editorial advantage | `08c-green-team-editorial-opportunity.md`, `09c-draft-technical-reader-review.md` | reinforces why the live failure, not generic GEO advice, is the acquisition asset |
| Investment thresholds | `08b-green-team-product-opportunities.md`, `11c-final-draft-evergreen-check.md` | keep the free-hygiene-versus-real-investment distinction consistent |
| Controlled GEO boundary | `00-research-scratchpad.md`, current `019` GEO section | current article already explains fixed/supplied retrieval; complement should move to operations |
| Platform-specific measurement | `12d-geo-frontier-main-agent-notes.md` | parallel frontier synthesis agrees on stage-specific provider telemetry; combine without duplicating source paragraphs |

## Source ledger

| Source | Date/state | Evidence tier | What is retained | Why it matters |
|---|---|---:|---|---|
| [Google: Optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | updated 2026-07-10; accessed 2026-08-25 | A | Search foundation, query fan-out, non-commodity content, product/local data, myth rejection, third-party-tool warning | clearest current provider boundary between supported practice and GEO folklore |
| [Google Search Console generative-AI report help](https://support.google.com/webmasters/answer/16984139) | limited rollout; accessed 2026-08-25 | A | impression dimensions, aggregation, access and row limits | defines exactly what Google's native report does and does not observe |
| [Google report launch](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) | 2026-06-03 | A | rollout scope and surface list | dates the telemetry frontier |
| [Bing AI Performance public preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) | 2026-02-10 | A | citation, page, trend, sampled grounding-query fields and explicit limits | best current citation-oriented publisher dashboard example |
| [OpenAI publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) | updated Aug 2026; accessed 2026-08-25 | A | search eligibility, `OAI-SearchBot`, `noindex`, `utm_source=chatgpt.com` | separates access from attributable referral |
| [OpenAI Shopping help](https://help.openai.com/en/articles/11128490) | updated Aug 2026; accessed 2026-08-25 | A | product/merchant inputs, third-party metadata/reviews, evolving selection | demonstrates a real structured-data surface whose scope must not be generalized |
| [OpenAI Agentic Commerce product feeds](https://developers.openai.com/commerce/guides/get-started) | accessed 2026-08-25; approved partners | A | schema/delivery, full snapshot plus updates, validation | shows feeds are operational integration, not prose optimization |
| [Google Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product) | updated 2025-12-10; accessed 2026-08-25 | A | page markup plus Merchant Center feed eligibility | supports domain-specific data boundary |
| [Google business details](https://developers.google.com/search/docs/appearance/establish-business-details) | accessed 2026-08-25 | A | Business Profile, Search Console, knowledge panel, structured data | establishes supported local/identity maintenance paths |
| [Google Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization) | accessed 2026-08-25 | A | identity disambiguation and supported display details | bounds entity hygiene without ranking claims |
| [Google Preferred Sources](https://developers.google.com/search/docs/appearance/preferred-sources) | updated 2026-08-20 | A | user-selected publication preference and publisher button | latest audience-loyalty surface; not cold-start ranking |
| [Cloudflare AI Crawl Control analytics](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/) | updated 2026-04-23 | A/C | crawler paths and AI referral views | operational request/referral separation |
| [Cloudflare crawl-to-referral methodology](https://blog.cloudflare.com/ai-search-crawl-refer-ratio-on-radar/) | 2025-07-01 | C | aggregate request/referrer ratio and native-app missing-referrer caveat | makes referral undercount explicit |
| [IndexNow documentation](https://www.indexnow.org/documentation) | accessed 2026-08-25 | A | changed-URL notification; HTTP 200 means receipt only | corrects the common submission-equals-indexing inference |
| [Characterizing Web Search in the Age of Generative AI](https://aclanthology.org/2026.findings-acl.526/) | ACL Findings, Jul 2026 | B | 4,706-query cross-system method and repeated-run/source volatility | strongest current basis for repetitions and condition logging |
| [From Citation Selection to Citation Absorption](https://arxiv.org/abs/2604.25707) | preprint, 2026-04-28 | D | selection versus answer-use measurement concept | prevents citation count from becoming the terminal metric |
| [Critical Survey of GEO 2023–2026](https://arxiv.org/abs/2607.14035) | preprint, 2026-07-15; includes search protocol/matrix | D | multistage model, repeated/paraphrased measurement, no reviewed stable cross-platform organic causal effect | recent synthesis; useful framing, not consensus |
| [Pinterest production GEO framework](https://arxiv.org/abs/2602.02961) | first-party preprint, 2026-02-03 | C | VLM query modeling, collection pages, internal-link architecture, reported outcome | demonstrates production work can be corpus architecture, not copy edits |
| [Invisible to the Machine](https://arxiv.org/abs/2608.07069) | preprint, 2026-08-07; pre-registered protocol | D | census denominator, repeated persona prompts, local documentation associations, low cross-engine agreement | bounded evidence for local/third-party documentation and volatility |
| [From Prompt to Purchase](https://arxiv.org/abs/2606.10907) | preprint, 2026-06-09; commercial panel | D | off-platform attribution design, pre-trend and intent confounds | useful measurement correction; not a general conversion effect |
| [Ahrefs Brand Radar methodology](https://ahrefs.com/blog/brand-radar-methodology/) | updated 2026-02-26 | E | prompt construction, public-interface runs, raw corpus, modeled-impression disclaimer | transparent example of monitoring limits |
| [Semrush production self-case](https://www.semrush.com/blog/how-we-are-using-semrush-to-drive-llm-visibility/) | 2026-05-29 | E | prompt strata, baseline reset, competitive/accuracy focus, simultaneous-change admission | workflow evidence with clear vendor/confounding limits |
| [Semrush 81-page citation-cadence study](https://www.semrush.com/blog/how-fast-do-ai-search-platforms-cite-new-content/) | study published late 2025; accessed 2026-08-25 | E | daily 30-day observations and corpus constraints | illustrates volatility/cadence, not FAQ-format efficacy |

## Distilled verdict

The part of GEO that is operationally real in August 2026 is less glamorous than its marketing:

- ordinary eligibility still matters;
- domain-specific data interfaces are real when the domain requires them;
- original evidence is worth producing even without a search promise;
- generated answers and sources are stochastic;
- prompt dashboards measure their sample frame, not the audience;
- provider dashboards expose different stages;
- third-party documentation can matter, but artificial mention programs have no honest basis;
- citations, answer influence, referrals, and outcomes remain different numbers.

The authentic strategy for gkoreli.com is therefore not “write for AI.” It is to publish investigations whose code, traces, failed measurements, and decisions are genuinely useful; make them technically eligible and easy to navigate; distribute them to the relevant human communities; and measure each machine-mediated event only for the job it can actually prove.

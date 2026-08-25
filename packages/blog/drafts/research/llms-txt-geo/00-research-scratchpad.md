# llms.txt and GEO — Research Scratchpad

**Status:** Working research artifact. Not article prose.
**Research started:** 2026-08-24
**Last updated:** 2026-08-25
**Blog baseline:** `464c89d75bbf1d684c3f705a3df84c0c141665f1`
**llms.txt proposal baseline:** [`a7cd84fd366b52a29aeb54a8d5fb74aa5d3f6cc2`](https://github.com/AnswerDotAI/llms-txt/tree/a7cd84fd366b52a29aeb54a8d5fb74aa5d3f6cc2), 2026-08-10

This file holds the golden data, code audit, claim table, competing theories, source rationales, article shapes, and open tests. Preserve uncertainty here. Do not turn it into polished prose until the evidence and Goga's first-person material are strong enough.

## Artifact map

- [`00-research-scratchpad.md`](./00-research-scratchpad.md) — synthesis, golden data, claim state, editorial decisions, and open questions.
- [`01-agent-use-benchmark-plan.md`](./01-agent-use-benchmark-plan.md) — pre-registration for testing HTML against targeted Markdown and the full dump.
- [`02-cloudflare-static-request-observability.md`](./02-cloudflare-static-request-observability.md) — fan-out report on what Cloudflare can observe, with plan limits and a staged logging design.
- [`03-crawler-classifier-audit.md`](./03-crawler-classifier-audit.md) — fan-out report on provider identities, current misclassification, and a purpose-aware event schema.
- [`04-thesis-red-team.md`](./04-thesis-red-team.md) — independent attempt to falsify the working thesis and identify claims that still outrun the evidence.
- [`05-benchmark-question-set.md`](./05-benchmark-question-set.md) — candidate questions, frozen-source answer key, and a usefulness check before any agent run.
- [`06-edge-baseline-2026-08-24.md`](./06-edge-baseline-2026-08-24.md) — first authenticated Cloudflare edge snapshot, including known research contamination and the Free-plan one-day query boundary.
- [`07-golden-prompts.md`](./07-golden-prompts.md) — Goga's raw prompts that selected the subject, defined the authenticity constraint, and requested the evidence trail. Preserve verbatim for the eventual transparency page.
- [`08-green-team-synthesis.md`](./08-green-team-synthesis.md) — constructive companion to the red-team: strongest viable positive case, staged investment ladder, and conditions that raise or lower confidence.
- [`08a-green-team-client-evidence.md`](./08a-green-team-client-evidence.md) — fan-out audit of concrete clients, maintained workflows, and adoption mechanisms.
- [`08b-green-team-product-opportunities.md`](./08b-green-team-product-opportunities.md) — fan-out map from shipped blog parts to reversible experiments and possible value.
- [`08c-green-team-editorial-opportunity.md`](./08c-green-team-editorial-opportunity.md) — fan-out article strategy that makes constructive usefulness as strong as skepticism.
- [`09a-draft-fact-audit.md`](./09a-draft-fact-audit.md) — sentence-level publication audit and verified-claims ledger for the first full draft.
- [`09b-draft-editorial-review.md`](./09b-draft-editorial-review.md) — shape, authenticity, title, search doorway, and consolidation review.
- [`09c-draft-technical-reader-review.md`](./09c-draft-technical-reader-review.md) — query-intent, practical coverage, implementation, internal-link, distribution, and acquisition review.
- [`09d-evergreen-search-landscape.md`](./09d-evergreen-search-landscape.md) — current query language, competing article shapes, defensible acquisition gap, and recommended evergreen doorway.
- [`10-draft-review-synthesis.md`](./10-draft-review-synthesis.md) — reconciled title, movement, fact corrections, practical requirements, and publication boundary for the rewrite.
- [`11a-final-draft-fact-check.md`](./11a-final-draft-fact-check.md), [`11b-final-draft-editorial-check.md`](./11b-final-draft-editorial-check.md), and [`11c-final-draft-evergreen-check.md`](./11c-final-draft-evergreen-check.md) — conditional pre-frontier publication checks and the release gate they identified.
- [`12a-geo-provider-frontier-2026-08-25.md`](./12a-geo-provider-frontier-2026-08-25.md) — first-party provider controls, query behavior, crawler roles, telemetry, supported feeds, and explicit silences as of the cutoff.
- [`12b-geo-research-frontier-2026-08-25.md`](./12b-geo-research-frontier-2026-08-25.md) — primary academic evidence map, frozen-variable analysis, conflicts, replications, field frontier, and advice confidence.
- [`12c-geo-operational-frontier-2026-08-25.md`](./12c-geo-operational-frontier-2026-08-25.md) — runnable publisher workflow, measurement contract, authenticity constraints, vendor/folklore boundaries, and blog investment ladder.
- [`12d-geo-frontier-main-agent-notes.md`](./12d-geo-frontier-main-agent-notes.md) — August 25 provider/research frontier, evidence hierarchy, established patterns, emerging trends, rejected claims, and article delta.
- [`13-geo-frontier-synthesis.md`](./13-geo-frontier-synthesis.md) — reconciled conclusions from all four frontier lanes and the exact article changes they justify.
- [`14a-final-geo-provider-audit.md`](./14a-final-geo-provider-audit.md), [`14b-final-geo-research-audit.md`](./14b-final-geo-research-audit.md), and [`14c-final-geo-operational-editorial-audit.md`](./14c-final-geo-operational-editorial-audit.md) — final green audits of provider fidelity, academic boundaries, usefulness, authenticity, and proportion after the frontier merge.
- [`15-ai-research-footprint.md`](./15-ai-research-footprint.md) — auditable session/token accounting, provenance model, limitations, and release-freeze procedure for the public research-footprint disclosure.

## Iteration log

### Iteration 0 — The evergreen idea

The content-mix document originally ranked an “honest guide to `llms.txt` and GEO” as a promising evergreen piece. Its rationale still leaned on discoverability language and the GEO paper's headline result. At this point the article risked becoming a well-sourced version of the same advice already circulating.

### Iteration 1 — Goga chooses learning over keyword capture

Goga selected the idea because researching it would teach us something about infrastructure the blog already runs. The governing form changed from evergreen guide to research synthesis plus first-person engineering field investigation.

### Iteration 2 — The pipeline splits into three stages

Reading the proposal, provider guidance, the GEO paper, and request-log evidence exposed three different questions: discovery, retrieval/selection, and use after retrieval. The working thesis stopped treating “GEO” as one mechanism.

### Iteration 3 — Our metric fails its own name

The code audit found that `ai_fetches` counts browser beacon events with AI-looking user agents. The static files whose use we want to understand bypass both the beacon and Worker. This changed the article from an external myth audit into an examination of a model we shipped ourselves.

### Iteration 4 — Pre-register before measuring

We separated two experiments: server-side observation of resource requests and a controlled agent-use benchmark. The latter is explicitly forbidden from making discovery or citation claims. Questions, scoring, thresholds, and stop conditions must be frozen before outputs are visible.

### Iteration 5 — Fan-out and adversarial review

Three bounded research threads were commissioned: Cloudflare static-request observability, provider crawler classification, and a red-team of the thesis. Their full reports are preserved beside this file; synthesis here should never erase their caveats or provenance.

### Iteration 6 — Edge history appears, including our own investigation

The authenticated Cloudflare GraphQL query worked and found path-level requests that the browser beacon missed. The current 24-hour window was dominated by `curl/8.7.1` requests matching our live endpoint checks, so that snapshot validates the observation method but cannot serve as an untouched audience baseline.

Cloudflare rejected one seven-day range but allowed the same history as one-day slices. The roughly seven days before this investigation contained three `llms.txt` requests and three Markdown requests: two ordinary Chrome sequences and two `curl` patterns. No known AI-provider user agent appeared. The historical CLI traffic may still be the author's or an agent acting during earlier article work; the aggregate data cannot attribute it.

This is a useful boundary: we can now say the files were requested, but not that an AI system used them. A clean prospective baseline begins only after we stop fetching the target paths ourselves and declare the observation window.

### Iteration 7 — Green-team the opportunity, not only the claim

Goga challenged the process itself: an article that only red-teams can become rigid, defensive, and late to real change. The follow-up asks the inverse questions:

- Where does the convention already produce concrete value?
- Which shipped pieces give us cheap option value if client adoption grows?
- What could this blog test that the wider debate has not measured?
- Which positive evidence should make us invest more?
- How can the article help a reader act without pretending the outcome is settled?

The green team is not permission to restore a disproven growth claim. It must begin from shipped parts, name the missing link, set a test, and define what result changes the decision.

### Iteration 8 — The article must become a durable doorway

Goga raised the acquisition requirement after the first full draft: whatever we publish must be an evergreen article capable of bringing substantial relevant traffic to gkoreli.com. That changes the draft's center of gravity without changing its evidence.

The first draft led with the field investigation and answered the general reader's question gradually. The next version must work on two layers:

1. a search-legible guide that answers what `llms.txt` is, whether it helps GEO or AI search, what evidence exists, what to implement, and how to test it;
2. a first-person engineering investigation that supplies the distinctive proof, failure, and judgment generic GEO guides lack.

This is not permission to promise traffic from `llms.txt`, manufacture certainty, or turn every heading into a keyword variation. It is permission to make the doorway direct. Search acquisition is an explicit product goal for the article; honest reader fit remains the constraint. The working H1 and outline must therefore be reconsidered after the draft reviews.

### Iteration 9 — The research corrects the editorial system

The repository's `shareable-engineering` skill still said that quotations, statistics, and citations were effectively the AEO strategy, and that `llms.txt` was dead weight worth no investment. Those rules were grounded in the 2024 GEO headline and the Ahrefs request study but had not absorbed the experiment boundaries, the 2026 studies, or the maintained client workflows found here.

We bumped the skill to `1.1.0` and replaced both absolutes with the stage model: evidence-rich content can alter use after retrieval without proving discovery; `llms.txt` has a bounded known-site navigation job but no demonstrated organic ranking or citation job. Page Markdown is now treated as a separate testable product. This keeps future editorial passes from reintroducing a verdict this research already outgrew.

### Iteration 10 — The field note becomes the reference page

Three independent reviews agreed that the first full draft had unique evidence and the wrong doorway. It made a cold reader wait for the answer, assumed knowledge of the file, promised testing without runnable checks, and narrated agent-assisted research actions as if Goga personally performed each one.

The second draft is now [`019-does-llms-txt-work.md`](../../019-does-llms-txt-work.md). It changed the H1, SEO title, and slug around the durable query; put a stage-specific verdict and site-type decision at the top; added a live-shaped example, v2 relations, delivery commands, Ahrefs base rate, reproducible-client boundaries, measurement ladder, exact draft thresholds, reader answers, and dated ledger. The March belief, broken metric, contaminated observation window, desire for readers, and adaptive ending remain.

The rewrite also corrected the first-person contract. Goga's `I` carries the blog, original model, desire, and owned build. The collaborative process is named as the audit or reproduction for Cloudflare queries, client sweeps, dependency reproduction, token measurement, and literature review.

### Iteration 11 — GEO becomes a real complement, not one disclaimer section

Goga asked whether the article teaches GEO beyond `llms.txt` and raised the cutoff explicitly: August 25, 2026 means current provider behavior, peer-reviewed 2026 work, frontier preprints, production cases, established patterns, and emerging trends all need their own evidence states.

The honest answer was that the second draft only explained the post-retrieval research boundary. It did not yet give a rounded working model of SEO/AEO/GEO, query fan-out, multimodal and structured data paths, citation selection versus answer absorption, provider-specific telemetry, monitoring volatility, or the new product/search-architecture direction visible in production evidence.

The third draft now keeps `llms.txt` as the concrete doorway and adds a full complementary GEO section. It distinguishes established operations from bleeding-edge trends and unproven claims; cross-references Google, Bing, OpenAI, 2026 ACL work, current preprints, and Pinterest's bundled production intervention; and gives a practical seven-step workflow without promising a universal checklist.

### Iteration 12 — The frontier changes the model and the payoff question

Three parallel reviews examined current provider behavior, the primary academic record, and operational publisher practice. They wrote their full evidence into `12a`, `12b`, and `12c`; a separate main-agent map is preserved in `12d`. The reconciled result is `13-geo-frontier-synthesis.md`.

The article now names eight events rather than collapsing the chain into six questions. It adds answer absorption and final outcome, because peer-reviewed RAG and citation research shows that retrieved or cited evidence can remain unused. It also adds four boundaries that were missing:

- Google, ChatGPT, and Claude all document multi-query or progressive search, but fan-out is a coverage/noise tradeoff rather than a content-farm plan;
- Google's limited-rollout site-level generative control is separate from ordinary Search and `Google-Extended`;
- learned rewrite tactics can become baseline hygiene when every candidate copies them;
- live answers and source pools require repeated-run measurement, while the newest field evidence suggests generative surfaces can reduce some publisher referrals without identifying a publisher-side fix.

The SEO title changes to `llms.txt and GEO: Live Evidence and What to Test` because GEO is now a real complementary intent in the body while the audit has not run a universal GEO field experiment. The H1 and slug remain tied to the concrete live implementation, protecting the article from becoming an abstract marketing guide.

### Iteration 13 — Show the cost of evidence, not a vanity token badge

Goga asked whether the article could expose how many LLM tokens it consumed, then clarified the real purpose: show the human steering, research sessions, committed investigation artifacts, elapsed time, and distillation effort behind an evidence-driven article.

The implementation therefore treats tokens as one field in a **research footprint**, not a quality badge. Collaborative posts can opt into `researchFootprint` frontmatter. The article header shows one compact measured-token label beside the prompt disclosure; the transparency page expands it into human prompts, Codex sessions, committed artifacts, wall-clock window, input/cache/output breakdown, methodology, limitations, and a link to the public research directory.

The current snapshot covers one root session and six persistent research-agent sessions. It explicitly says that cached input is a subset of input, reasoning output is a subset of output, and total tokens are not a cost or environmental-impact estimate. Exposed essays remain excluded because their authorship contract is different. The values are preliminary until frozen immediately before the release commit.

## Green-team charter

For each opportunity, record:

| Shipped part or observed signal | New action it enables | Missing rule, client, or component | Test | Positive threshold | Cost / downside | Direction state |
|---|---|---|---|---|---|---|

Direction states follow the project-research discipline:

- **Stated:** a maintainer or provider commits to the direction;
- **In progress:** code or tracked work implements it;
- **Enabled:** shipped design makes it possible, but nobody has promised it;
- **Speculative:** a plausible path that still needs a new client, rule, or market behavior.

Green-team constraints:

- A site publishing a file is not evidence that a client consumes it.
- A client consuming it is not evidence of organic search lift.
- Cheap option value is still value, but it does not justify endless optimization.
- A failed experiment can lower investment without deleting the convention.
- A future provider commitment should update the verdict quickly; skepticism must not become identity.
- The best positive outcome may be first-party knowledge, not traffic.

## Editorial decision

We chose this article because writing it is part of the investigation. The reason is not that `llms.txt` or GEO looks like an attractive query.

The article's living center:

> Goga built a complete AI-readable layer for a blog that still has almost no recurring audience. He now has to find out whether he built an access path for real agents, a speculative search ritual, or both — and whether his own analytics can even tell the difference.

**Governing form:** Research synthesis with a first-person engineering field investigation.

**Movement:** Start with belief and implementation, discover that the measurement cannot observe the promised behavior, separate the stages that the market collapses, test each claim, then give a bounded decision.

**Honest ending:** A decision rule for when `llms.txt` is worth generating, what it cannot currently prove, what site owners should do instead for AI search, and which experiment would change the verdict.

### Current thesis after red-team

> `llms.txt` is an optional, low-cost navigation convention with direct evidence in documentation-agent workflows, but no demonstrated organic AI-search ranking or citation lift. For open-web AI search, provider-documented eligibility, indexing, relevance, freshness, and source quality come first. Once a source enters the candidate context, its content and presentation can change how it is used or cited, but those effects are conditional and engine-specific.

Plain-language version:

> `llms.txt` can help an agent that already has a reason to enter your site. It has not been shown to create that reason. GEO can change what happens after a source is retrieved, but the durable way to deserve retrieval is still unique, relevant, well-supported work—not a machine-facing content ritual.

This is a working position, not the opening paragraph. The article should earn it through the implementation and measurement story.

## Golden data from Goga

These are the human reasons for the article. Protect them from being researched away.

- The blog is struggling and does not yet have a real audience or recurring readers.
- The published catalog is mostly personal engineering articles, inquiry, build narratives, and OSS Radar.
- Goga wants useful evergreen work but does not want to feel as if he is farming engagement or impersonating a content publisher.
- He wants to remain genuine: the subject should come from something he built, doubted, or needs to understand.
- He chose the `llms.txt` and GEO idea because researching and writing it will teach him something he wants to know.
- The article should show the learning, not present a verdict chosen before the research.

### Protected tensions

- Wanting readers is real. Pretending not to care about reach would be false.
- Writing only because a phrase has search demand would also be false.
- `llms.txt` may be weak as an AI-search lever and still useful as an agent-navigation artifact.
- The blog's current lack of traction makes the investigation more honest, but the article must not turn that pain into an engagement hook.
- Goga built an unusually complete discoverability stack. That proves implementation depth, not that the stack caused discovery.
- A machine-readable format can be good infrastructure without being a ranking signal.

### Authenticity contract for this article

This is how the post stays useful without becoming engagement farming:

- **The article begins with something we actually built and believed.** It does not begin with “GEO is changing everything,” a keyword definition, or a borrowed industry panic.
- **Our own error goes first.** The broken measurement loop is more honest and more useful than presenting ourselves as the person who arrived with the right verdict.
- **Wanting an audience stays visible.** We do not perform indifference to reach. The tension is that reach matters while manufactured certainty feels false.
- **The investigation is allowed to shrink the premise.** If the honest conclusion is “generate it because it is nearly free, but do not expect traffic,” that is enough.
- **Every strong claim needs a stage and a measurement.** “Helps agents” is incomplete until we say whether we mean discovery, selection, navigation, extraction, or answer influence.
- **We distinguish what we reproduced from what another company reported.** Ahrefs' logs are not our logs; provider documentation is not a complete description of a black box; a request is not a citation.
- **No universal authority voice.** The article can give a decision rule based on site type and goal, not “the definitive guide” language that outruns the evidence.
- **No artificial victory.** If the planned benchmark or logging baseline is unfinished, publish that boundary or wait. Do not manufacture a neat transformation.
- **No growth CTA disguised as a conclusion.** End with the next falsifiable observation or the revised operating decision.
- **Ship the raw prompts with the collaborative post.** Readers should be able to see the human concern that initiated the work and the places where research changed the position.

The share trigger should be recognition: another engineer realizes that they, too, may have built an “AI-readable” layer whose success metric cannot observe AI reads. That is not a hook pasted onto the work; it is the work.

### Engagement-farming failure modes

- Calling the post “what actually works” while quietly substituting provider recommendations for measured outcomes.
- Using the blog's lack of audience as melodrama instead of a constraint on what the data can establish.
- Turning `llms.txt` into a culture-war proxy for “GEO is fake” or “SEO people are scammers.”
- Treating one company's aggregate logs as proof of every provider's behavior.
- Repeating “up to 40%” in the title or opening after learning what the experiment actually measured.
- Adding implementation instructions before the reader knows which goal the file can serve.
- Writing a generic history of `llms.txt` because it is easy to summarize.
- Making the measurement repair look like proof that the file works. Better instrumentation only makes future evidence possible.

## The three stages people keep collapsing

This distinction is the likely spine of the article.

| Stage | Question | Mechanisms in scope | What counts as evidence |
|---|---|---|---|
| Discovery | How does a system learn that the site or file exists? | Links, sitemaps, search indexes, `robots.txt`, provider crawlers, explicit user instruction, v2 `rel="describedby"` | Request logs, provider documentation, crawl/index state |
| Retrieval / selection | Why does a system choose this page for this question? | Search ranking, query fan-out, relevance, authority, source selection | Search Console, frozen-query citation tests, provider guidance, controlled retrieval studies |
| Consumption / use | Once the source is supplied, can the model use it well and cheaply? | Clean Markdown, `llms.txt`, `.md` endpoints, citations, quotations, statistics, concise structure | Task accuracy, token cost, citations inside an answer, agent traces |

The `llms.txt` index and page-level Markdown mainly support navigation and consumption after an agent has a reason to enter the site. V2's link relations also support in-site discovery after a client reaches a page. None of these mechanisms proves organic search discovery or selection. The SEO market often sells them as a lever for that earlier stage. Those claims require different evidence.

## First-party audit: what gkoreli.com shipped

### The belief we actually shipped

ADR-0006 is unusually valuable because it preserves the March 2026 reasoning before this article began. It did not merely approve some output files. It described a causal loop:

1. `sitemap.xml` and JSON-LD help search engines index the site;
2. `llms.txt` and Markdown endpoints let AI agents **discover and consume** it;
3. AI-agent tracking measures which agents read which pages.

Several lines now need reassessment:

| March belief | What the August audit changes | Editorial use |
|---|---|---|
| “AI agents have no entry point” without `llms.txt` | Search products document their own crawlers and can consume ordinary indexable HTML. A curated agent entry point can still reduce navigation work after the domain is known. | Keep the original urgency, then narrow “entry point” into a known-site agent aid. |
| Most agents “won't bother” to parse HTML | We have no evidence for this general claim. Modern agent tools do fetch and extract HTML; the relevant question is whether Markdown improves a fixed task enough to matter. | Mark this as an assumption the benchmark must test, not article narration. |
| The files complete a discovery → consumption → measurement loop | The generated files may help consumption, but no mechanism guaranteed discovery, and the measurement path cannot see static requests. | This broken loop is the engineering reveal. |
| Building tracking before traffic means every future AI visit is captured | Phase 1 generated static files while analytics stayed browser-beacon based. The “AI Reads” metric therefore misses the direct fetches under investigation. | Show how architecture can satisfy a diagram while failing at the system boundary. |
| JSON-LD makes search results less generic | `BlogPosting` markup is legitimate semantic metadata, but rich-result eligibility and display are provider-controlled; it is not evidence of AI selection. | Keep JSON-LD outside the `llms.txt` verdict unless discussing ordinary search hygiene. |
| A full dump is fine while the blog is small | The live file is now 375,443 bytes for 18 posts. Its cost and usefulness are no longer self-evident. | Test targeted Markdown against the full dump rather than repeating the early size assumption. |

This is not a gotcha directed at an older ADR. The delta is the article. We wrote down a reasonable early model, shipped it cheaply, and now have enough implementation and external evidence to redraw the model.

### Deployed outputs, reproduced 2026-08-24

- [`/llms.txt`](https://gkoreli.com/llms.txt): HTTP 200, `text/plain`, 7,200 bytes.
- [`/llms-full.txt`](https://gkoreli.com/llms-full.txt): HTTP 200, `text/plain`, 375,443 bytes, `X-Robots-Tag: noindex`.
- Per-post Markdown endpoints such as [`/the-agentic-product-engineer.md`](https://gkoreli.com/the-agentic-product-engineer.md): HTTP 200, `text/markdown`, `X-Robots-Tag: noindex`.
- [`/posts.json`](https://gkoreli.com/posts.json): metadata for 18 posts.
- HTML articles contain `BlogPosting` JSON-LD and indexable static content.
- [`robots.txt`](https://gkoreli.com/robots.txt) allows all user agents and points to the sitemap.

### Build path, code-inspected

- `packages/blog/src/templates/llms.ts` generates `llms.txt`, `llms-full.txt`, and `posts.json` from `PostMeta[]` and raw post content.
- `packages/blog/src/pipeline/build.ts` writes the files at build time.
- Individual Markdown endpoints strip frontmatter and serve the post body.
- Generated files require almost no marginal work when a post changes. This matters to the final cost verdict.

### The implementation follows v1 more closely than v2

The proposal changed on 2026-08-10. V2 recommends discoverability through:

- `rel="alternate" type="text/markdown"` for a page's Markdown version;
- `rel="describedby"` for the applicable `llms.txt` file;
- equivalent HTTP `Link` headers.

The current blog has none of those relations. Its only `rel="alternate"` is RSS. The live responses also lack the proposed `Link` headers. An agent must guess `/llms.txt`, learn about it elsewhere, or receive the URL from a user.

This is not proof that v2 relations cause agent discovery. It is proof that the current implementation lacks the proposal's latest discovery mechanism.

## First-party audit: the measurement does not measure crawler fetches

This is the first material discovery from the article work.

### What the public dashboard says

The all-time public API reported, when checked on 2026-08-24:

- 2,105 human page views;
- 1,238 human visitors;
- 97 `ai_fetches`;
- six recorded `chatgpt.com` referrer views.

The number `97` looks like evidence that AI systems fetched the site. The implementation cannot support that interpretation.

### What the code records

`packages/blog/src/templates/page.ts` adds a browser script to HTML pages. That script sends `POST /api/event` after the page runs JavaScript.

`packages/analytics/src/index.ts` classifies the user agent on that API request and writes a D1 row.

`packages/analytics/src/classify.ts` marks 15 named patterns as AI.

`packages/analytics/src/stats.ts` labels the count of D1 rows where `visitor_type = 2` as `ai_fetches`.

### What it cannot record

- A crawler fetching `/llms.txt` directly.
- A crawler fetching `/llms-full.txt` directly.
- A crawler fetching a `.md` endpoint directly.
- A crawler fetching HTML without executing the analytics script.
- Which AI agent made the request; `agent_name` was proposed but never shipped.
- Whether a fetched source was indexed, selected, cited, or used.

Static asset requests do not pass through the analytics event route. The 97 rows therefore mean: **97 client events whose `/api/event` request carried a user agent matching the current AI regex.** Calling them crawler fetches overstates the evidence.

The Cloudflare routing audit confirms why: `run_worker_first` currently contains only `/api/*`. Existing static files are served asset-first and never invoke the Worker. Workers Logs therefore cannot see them either.

The audit also found a repair trap. Adding `/llms.txt`, `/llms-full.txt`, or `/*.md` to `run_worker_first` without a matching `env.ASSETS.fetch(request)` branch would route those requests into the current Worker's final 404. Instrumentation has to preserve asset serving explicitly.

### The classifier also answers the wrong category question

Even if it ran on the original request, the current `Human | Bot | AI` model would collapse different jobs:

- `OAI-SearchBot` and `Claude-SearchBot` are currently missed by the AI regex and reduced to generic bots.
- `Claude-User` and `Perplexity-User` are missed by both regexes and would be classified as humans.
- `GPTBot` and `ClaudeBot` are detected but their training purpose disappears.
- `GoogleOther` is classified as AI even though Google documents it as a generic crawler used by multiple product teams.
- `Google-Extended` is a `robots.txt` control token, not an HTTP user agent, and cannot appear in request logs as its own crawler.

The replacement vocabulary should describe the observed request purpose: search crawler, training crawler, user-directed fetcher, site-owner-directed fetcher, other bot, or unknown. Human referrals from chat products remain a separate browser event. User-agent-only matches must be labeled **claimed**, not verified.

### We can establish a baseline without deploying code

Cloudflare AI Crawl Control already observes edge requests that bypass the Worker. On the Free plan it offers path- and crawler-level data over the previous 24 hours with CSV export. Its identity detection is user-agent based and its underlying analytics can be adaptively sampled, so it is useful as a baseline rather than an exact ledger.

The recommended progression is:

1. export daily path-filtered data for seven days without changing the deployment;
2. freeze the purpose-aware classifier;
3. selectively route only `llms.txt`, `llms-full.txt`, and root `.md` files through the Worker;
4. return them through the `ASSETS` binding and write a separate minimized D1 request event;
5. cross-check D1 against three days of Workers Logs;
6. observe a frozen 30-day window;
7. report requests by purpose and status, never as citations or readers.

Full constraints and pricing/retention details are preserved in [`02-cloudflare-static-request-observability.md`](./02-cloudflare-static-request-observability.md). The provider matrix and event schema are in [`03-crawler-classifier-audit.md`](./03-crawler-classifier-audit.md).

### Consequence for the article

We cannot claim that gkoreli.com's AI-readable layer is used or unused from the public dashboard. The instrumentation is blind at the exact paths the ADR intended to measure.

## Claim table

| Claim | Product / source says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| `llms.txt` is a proposal, not a crawler-control standard | The v2 spec calls it “a proposal” to help agents use a website | Baseline spec at `a7cd84f` | Reported, primary | Do not describe it as `robots.txt` for LLMs | Prevents the article from granting authority the file does not have |
| The intended job is guided agent use | The spec says agents view or search the file, then follow links to LLM-friendly content | Format and link structure are implemented on gkoreli.com | Code-inspected and reproduced | The strongest case is docs and user-directed agents | Separates agent utility from search visibility |
| V2 adds standard link relations | V2 recommends `alternate` and `describedby` relations | gkoreli.com lacks both | Proposed by spec; absence code-inspected | The current file is harder to discover than the latest proposal intends | Gives us a concrete implementation gap without claiming impact |
| Major search/assistant providers rely on ordinary crawler controls | Google, OpenAI, Anthropic, and Perplexity publisher guidance names crawlability, specific bots, and `robots.txt` | Their current guidance was checked on 2026-08-24 | Reported, primary | None currently tells publishers that `llms.txt` improves search inclusion | Establishes the documented path without proving undocumented behavior never occurs |
| Google Search ignores `llms.txt` for ranking and AI features | Google's 2026 guide says the file neither helps nor harms visibility in Google Search | Official guidance | Reported, primary | `llms.txt` is not a Google AI Overview lever | One bounded provider verdict is much stronger than “all AI ignores it” |
| Provider docs publish `llms.txt` | V2 links OpenAI, Anthropic, and Gemini developer-doc files | Live documentation sites expose the files | Reproduced / reported | Publishing can serve coding agents even when search products do not use it as a signal | Explains why adoption is not irrational |
| A maintained agent workflow actually consumes an index | Google's official Gemini Live API development skill falls back to the Gemini docs `llms.txt`, follows its links, and fetches page Markdown | Pinned skill at `b40dd8d` inspected by the red-team | Code-inspected, first-party | Developer-doc navigation is a demonstrated bounded use, not merely a spec author's hope | Strengthens the positive case without moving it into organic search |
| Most deployed files receive no requests | Ahrefs found 97% of about 38,000 valid files had zero requests in May 2026 | We did not reproduce its cross-domain logs | Reported, first-party study | The base rate for automatic consumption is poor | Sets expectations and forces a low-cost recommendation |
| AI retrieval bots rarely fetch the file | Ahrefs classified retrieval bots as 1.1% of requests to read files | We did not reproduce the classification | Reported, first-party study | Fetch evidence is weak for citation claims | Connects logs to the search-visibility question |
| Agents fetch files when directed | Ahrefs saw agentic tools more often than retrieval bots and zero AI requests to missing paths | We have not run our own agent benchmark yet | Reported; inference bounded | Explicit linking or instruction may be the real distribution mechanism | Supports a docs/agent use case rather than an SEO use case |
| GEO methods can increase visibility inside generated answers | KDD 2024 reports gains from citations, quotations, statistics, and clearer prose | Paper source and methodology inspected | Peer-reviewed, primary | These are content-use interventions after sources enter the model context | The paper does not validate `llms.txt` or open-web discovery |
| Generic GEO formatting recipes transfer across engines | ACL/SIGIR 2026 studies report strong conditional citation effects but weak or inconsistent gains from isolated heuristics; relevance, position, and document-level substance are stronger | Fixed candidate or retrieval sets in FeatGEO, MAGEO, and Competitive GEO | Peer-reviewed, primary; upstream retrieval excluded | Content can affect use after retrieval, but “add quotes/stats” is not a durable universal recipe | Prevents the article from replacing one ritual with another |
| Bing exposes publisher-facing AI citation telemetry | Bing Webmaster Tools documents citations, cited pages, and grounding queries across Microsoft surfaces | Provider announcement and guidance | Reported, first-party | Citation telemetry and request logs answer different stages | Adds a real measurement path while preserving causal limits |
| The GEO Perplexity experiment proves live citation lift | The paper calls Perplexity a real deployed engine | It uploaded source files, forced answers from supplied sources, and used a 200-sample subset | Claim rejected as too broad | It tests use of provided sources, not organic discovery or source selection | Stops the “up to 40%” result from becoming GEO folklore |
| gkoreli.com has 97 AI reads | The public stats API exposes `ai_fetches: 97` | Analytics depends on a client-side event | Code-inspected; label overstates measurement | The value does not count ordinary static crawler fetches | The author's own measurement failure becomes part of the article |
| Current Workers Logs can reveal historical reads of the files | Cloudflare has invocation logging enabled | Static assets bypass the Worker because only `/api/*` is Worker-first | Claim rejected for current routing | No invocation means no Worker log | Prevents us from mistaking enabled logging for relevant logging |
| Our AI classifier only needs more names | The ADR proposed expanding 15 patterns to about 35 | Official providers assign different purposes; several current identifiers are missed or misclassified | Claim rejected as a data-model problem | Purpose-aware resource events matter more than a larger undifferentiated regex | Makes the repair architectural rather than cosmetic |
| We can collect a no-code request baseline | Cloudflare documents AI Crawl Control on all plans | It sees edge requests but Free identity is UA-based, retains 24 hours, and data may be adaptively sampled | Reported, primary; useful with limits | Daily exports can establish directional baseline before routing changes | Lets research proceed without immediately changing production |
| The deployed files received no requests in the week before research | Historical Cloudflare edge slices show three `/llms.txt` requests and three page-Markdown requests, with zero `/llms-full.txt` requests | Grouped by path, presented UA, and response status; browser and `curl` identities are unattributed | Claim rejected; first-party aggregate, sampled/UA-limited | There was sparse access, but none can be called provider consumption or external readership | Gives the article real first-party evidence without laundering ambiguity into “AI reads” |

## Competing theory map

The theories apply to different pipeline stages and are not fully exclusive.

| Theory | Whose view | Evidence for | Evidence against | Direction | What would disprove or change it |
|---|---|---|---|---|---|
| `llms.txt` improves AI-search citations | GEO vendors and optimistic adopters | Broad adoption; a few AI bots fetch existing files; providers publish their own docs indexes | No major provider documents it as a search signal; Google explicitly ignores it; Ahrefs found low retrieval-bot use | Weak / unproven | Provider commitment or a controlled citation study with frozen queries, stable pages, and a measurable lift |
| `llms.txt` is useful navigation for agents that know it exists | Original proposal; developer-doc operators | Pinned official Google skill; spec design; provider docs adoption; agentic-tool traffic in Ahrefs | Most files receive no requests; clients do not appear to probe missing paths; prompt-injection and staleness risks | Demonstrated in at least one bounded docs workflow; prevalence and benefit unproven | A controlled agent-task study showing no accuracy, latency, or token benefit over HTML/navigation |
| Provider-documented eligibility, indexing, relevance, freshness, and source quality come first; content and presentation can matter after retrieval | Provider guidance plus 2024–2026 GEO research | Google/OpenAI/Anthropic/Perplexity/Bing docs; multiple fixed-retrieval studies | Selection remains opaque and engine-specific; documentation may omit internal behavior | Best current operating theory, deliberately incomplete | Controlled open-web studies showing special files independently alter retrieval or selection |

## What the GEO paper actually tested

The KDD 2024 paper is useful, but the common summary hides its boundary.

### Main benchmark

- GEO-bench contains 10,000 queries drawn from nine sources, including conventional search datasets, Perplexity Discover, ELI5, and GPT-4-generated queries.
- The experimental engine fetched the top five Google results for each query.
- GPT-3.5 Turbo generated the answer from those fetched sources.
- The paper changed source text using nine strategies and measured position-adjusted word count plus an LLM-judged subjective impression score.
- Citations, relevant quotations, and statistics performed best in the reported benchmark.

### Perplexity experiment

- The authors uploaded the source text as files.
- They instructed Perplexity to answer only from the provided files.
- They used a 200-sample subset.

This supports a claim about how a model uses supplied source material. It does not show that adding quotations or statistics makes a previously unknown page enter Perplexity's retrieval set.

### Safe use of the result

Safe: “Once a source was supplied, evidence-rich presentation increased its measured influence in the generated answer in this benchmark.”

Unsafe: “Adding statistics makes ChatGPT or Perplexity discover and cite your page 40% more often.”

### What the 2026 GEO work adds

The red-team found three peer-reviewed 2026 studies that make the stage distinction stronger and the recipe weaker:

- **FeatGEO (ACL 2026)** reports large visibility effects across three engines, but supplies a fixed set of five retrieved pages plus the controlled page and explicitly excludes upstream retrieval/ranking. Isolated text heuristics often fail or hurt.
- **MAGEO (ACL Findings 2026)** deliberately freezes the retrieval list so it can attribute citation changes to content edits. That is good causal design for post-retrieval effects and no evidence about organic entry into the list.
- **Competitive GEO (SIGIR 2026)** runs 252,000 paired trials with two supplied candidates. Topical relevance and list position dominate first-citation selection; formatting-only changes have little effect.

The revised practical rule is not “sprinkle quotations and statistics.” It is: publish unique, relevant, self-contained evidence in a structure a human can follow. Content substance is load-bearing. Presentation supports it, conditionally and differently across engines.

## What current provider guidance supports

### Google Search and AI features

- Use ordinary crawlability, indexable HTML, internal links, helpful non-commodity content, and Search Console.
- No special AI file, Markdown copy, or schema is required.
- Google Search says it ignores `llms.txt` for visibility and ranking.
- Structured data still serves supported rich-result use cases; it is not special GEO markup.

### ChatGPT search

- Allow `OAI-SearchBot` for inclusion in summaries and snippets.
- Use `noindex` when the page should not appear.
- Track `utm_source=chatgpt.com` referrals.
- `GPTBot` is a separate training control.

### Claude

- `ClaudeBot` is for potential model-training collection.
- `Claude-SearchBot` supports search indexing.
- `Claude-User` performs user-directed retrieval.
- Anthropic documents `robots.txt` as the site-owner control.

### Perplexity

- `PerplexityBot` supports search-result surfacing.
- `Perplexity-User` performs user-directed fetches.
- Perplexity recommends `robots.txt` plus its published IP ranges for WAF rules.

### Bing

- Bing Webmaster Tools' AI Performance report separates citations, cited pages, and grounding queries.
- Its publisher guidance discusses index state, depth, expertise, structure, clarity, examples, data, cited sources, freshness, and consistency.
- This is provider operating guidance, not a controlled causal proof that each recommendation raises citations.
- Bing's silence on `llms.txt` is not the same as Google's explicit statement that Search ignores it.

### Agent and developer-doc use

- The llms.txt v2 proposal, OpenAI developer docs, and Chrome's optional Lighthouse agentic-browsing audit all treat the file as a navigation aid for agents.
- Chrome marks a missing file N/A because the convention remains optional.
- A pinned skill in Google's official Gemini skills repository tells a coding agent to use the Gemini documentation `llms.txt` as a fallback index and then fetch page-level Markdown. That proves one concrete client workflow, not automatic probing or search ranking support.

### Client trust boundary

An agent must treat `llms.txt` as untrusted publisher content, not as a privileged system instruction. Any website can embed indirect prompt injection; the convention's guidance-shaped prose makes the distinction especially easy to blur. Cheap generation is not the only cost: publishers must keep the file version-controlled and current, while clients must constrain what external instructions are allowed to influence.

## Distilled insights

1. **The filename created the wrong analogy.** `llms.txt` looks like `robots.txt`, but it controls nothing. It is a curated map.
2. **The original proposal and the SEO pitch are different products.** The former helps an agent use a known site. The latter promises visibility before the site is selected.
3. **A fetch is not a citation.** It is not even proof that the body influenced an answer.
4. **No fetch is also hard to prove with the wrong analytics.** Goga's system cannot see the static requests it was built to study.
5. **The GEO paper begins after traditional discovery has already happened.** Its main setup starts with Google's top five results.
6. **The honest AEO strategy looks like honest engineering writing, but no formatting recipe is universal.** Primary sources, exact numbers, direct quotations when needed, visible uncertainty, and non-commodity first-hand material help readers and can help source use. Relevance and substance matter more consistently than isolated formatting tactics.
7. **For a generated file, uncertain upside can still justify keeping it.** The correct investment level is near zero until logs or agent tasks show use.
8. **Developer documentation is the strongest current use case.** Coding agents have an immediate task, a known domain, and a reason to prefer compact Markdown. Google's maintained Gemini skill demonstrates this exact path.
9. **A personal blog is a weaker use case unless the author or an external tool points agents to the file.** The site still needs ordinary discovery.
10. **The measurement system is now part of the article, not background infrastructure.** The audit changed what we can claim.
11. **The index, page Markdown, and full dump are three different products.** Ahrefs measured requests to the small index. That does not measure per-page Markdown usefulness, and v2 no longer centers a giant context dump.
12. **A machine-readable guide is still external content.** Agents must not elevate its instructions above their trust boundary.
13. **At low traffic, the researcher can become the dominant crawler.** The current edge snapshot mostly captured our own endpoint checks; pre-registration and intervention logs are necessary even for simple request counts.

## Candidate article shape

### Working title architecture

Literary / first-person H1 candidates:

- `I Built llms.txt for a Blog Nobody Read`
- `I Made My Blog Readable to Agents. I Can't Tell If They Came.`
- `I Built a File Google Search Ignores—and One Google Agent Uses`

Rejected after red-team:

- `The File AI Search Does Not Ask For` — too categorical across providers and client classes.

Concrete `seoTitle` candidate:

- `llms.txt and GEO: What Actually Works in 2026`

`alternativeHeadline` candidate:

- `llms.txt, AI crawler discovery, generative engine optimization, and agent-readable websites`

Description candidate:

- `I audited my blog's llms.txt, crawler analytics, provider guidance, and GEO research to separate agent access from AI-search folklore.`

### Golden sections

1. **I built the whole layer because nobody could find the blog.** Start with March's ADR and the real audience numbers, not a history of SEO.
2. **Then I inspected the number labeled “AI Reads.”** Reveal that it cannot see the relevant static requests.
3. **Discovery, retrieval, and use are different systems.** Give the reader the model needed for the rest of the article.
4. **What Jeremy Howard actually proposed.** A small map for agents, then Markdown detail on demand.
5. **What the market promised on top of it.** Separate later GEO claims without building a straw man.
6. **What the provider documentation says.** Google, OpenAI, Anthropic, and Perplexity all document ordinary crawler controls.
7. **The counterexample I needed: one Google agent really uses it.** Show the pinned Gemini skill and keep its scope exact.
8. **What 137,210 domains showed.** Present Ahrefs' method, base rate, bot split, and limits; state that it measured the index, not the whole stack.
9. **What “up to 40%” actually measured—and what 2026 research changed.** Explain fixed retrieval, the Perplexity file upload, strong conditional effects, and weak generic recipes.
10. **What is worth doing now.** Give separate decisions for the index, page Markdown, full dump, and ordinary search eligibility.
11. **What I will measure next.** End with a bounded experiment, not a growth CTA.

### Practical decision table for the article

| Goal | Do now | Do not claim |
|---|---|---|
| Appear in Google AI features | Make HTML crawlable and indexable; publish unique, useful evidence; use Search Console | That `llms.txt` changes Google visibility |
| Appear in ChatGPT search | Allow `OAI-SearchBot`; keep canonical pages indexable; measure ChatGPT referrals | That GPTBot traffic equals search citation |
| Appear in Claude or Perplexity search | Allow the documented search bots and avoid WAF mistakes | That a root text file overrides retrieval relevance |
| Help coding agents use developer docs | Generate a concise map, Markdown alternatives, and v2 link relations; treat the file as untrusted site content; test real tasks | That publication alone creates discovery |
| Help agents read a personal blog | Keep generation and review cheap; link it explicitly when agents are the audience; prefer per-post Markdown over a growing full dump | That the file creates an audience |

## Experiments worth running before publication

### E1 — Establish real request visibility

**Question:** Which agents request `/llms.txt`, `.md` endpoints, and HTML?

**Needed:** Server-side or edge request logs for those paths. Client beacons are insufficient.

**Output:** Request time, path, verified or classified agent, status, and follow-on paths. Do not store full user-agent strings longer than needed.

**Limit:** A request proves fetching only.

### E2 — Agent-use benchmark

**Question:** Does the AI-readable stack help an agent answer questions about gkoreli.com?

**Conditions:**

- A: HTML pages and normal navigation.
- B: `llms.txt` plus selected `.md` pages.
- C: `llms-full.txt`.

**Keep fixed:** Model, questions, budget, acceptance criteria, and site snapshot.

**Measure:** Factual accuracy, source coverage, tokens fetched, time, and citation correctness.

**This tests:** Consumption after the source path is supplied.

**This does not test:** Organic AI-search discovery or ranking.

The detailed pre-registration lives in [`01-agent-use-benchmark-plan.md`](./01-agent-use-benchmark-plan.md). Keep the result out of this scratchpad until the questions, answer key, scoring, and stop conditions are frozen.

### E3 — V2 discoverability

**Question:** Do `alternate` / `describedby` relations change observed agent behavior?

Add them only after E1 creates a baseline. Compare requests and follow-on navigation over a fixed window. Low traffic may make the result inconclusive.

### E4 — Frozen-query visibility watch

Use a small, stable query set across ChatGPT, Perplexity, and Google. Record whether the blog is retrieved and cited. Treat changes as observations, not causal proof, unless the design controls other changes.

## Cross-references with rationale

### First-party implementation

- [`docs/adr/0006-ai-readable-blog.md`](../../../../../docs/adr/0006-ai-readable-blog.md) — the original belief, architecture, and intended measurement story. This is the article's starting state.
- [`packages/blog/src/templates/llms.ts`](../../../src/templates/llms.ts) — proves what the site generates and how little ongoing work it costs.
- [`packages/blog/src/pipeline/build.ts`](../../../src/pipeline/build.ts) — proves the outputs are build-time artifacts from one content pipeline.
- [`packages/blog/src/templates/page.ts`](../../../src/templates/page.ts) — proves analytics begins in browser JavaScript and shows the missing v2 link relations.
- [`packages/analytics/src/index.ts`](../../../../analytics/src/index.ts) — proves D1 records only `/api/event` requests.
- [`packages/analytics/src/classify.ts`](../../../../analytics/src/classify.ts) — proves the current 15-pattern AI classification boundary.
- [`packages/analytics/src/stats.ts`](../../../../analytics/src/stats.ts) — proves why `ai_fetches` is a misleading label for the stored event count.
- [Public stats](https://gkoreli.com/api/stats?days=0%26tz=-420%26visitor=human) — first-party audience and referrer snapshot; use with the analytics caveat.
- [Live `llms.txt`](https://gkoreli.com/llms.txt), [full dump](https://gkoreli.com/llms-full.txt), and [one Markdown endpoint](https://gkoreli.com/the-agentic-product-engineer.md) — reproducible deployed behavior.

### Proposal and adoption

- [llms.txt v2 proposal](https://llmstxt.org/) — primary definition, intended job, latest link relations, and August 2026 revision. Do not use an SEO explainer to define the file.
- [Answer.AI repository at baseline](https://github.com/AnswerDotAI/llms-txt/tree/a7cd84fd366b52a29aeb54a8d5fb74aa5d3f6cc2) — pins the proposal state used by the article.
- [OpenAI developer docs](https://developers.openai.com/) — live example that advertises an `llms.txt` index and per-page Markdown to coding agents.
- [Pinned Google Gemini Live API skill](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L448-L474) — strongest direct evidence found of a maintained agent workflow consuming an index and page-level Markdown. It proves a bounded docs-navigation client, not search adoption.
- [Chrome Lighthouse agentic-browsing audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt) — shows one current agent-tooling use while explicitly treating the file as optional.
- [Ahrefs 137K-domain study](https://ahrefs.com/blog/llmstxt-study/) — strongest current cross-site request-log evidence; supports adoption and fetch-rate claims, not causal citation claims.

### Provider documentation

- [Google's 2026 AI-search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) — explicit provider verdict that Google Search ignores `llms.txt`; also supports non-commodity, people-first content and ordinary crawlability.
- [OpenAI publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) — documents `OAI-SearchBot`, `GPTBot`, `noindex`, and ChatGPT referral tracking.
- [Anthropic crawler guidance](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) — distinguishes training, search, and user-directed agents and documents `robots.txt` controls.
- [Perplexity crawler guidance](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) — distinguishes `PerplexityBot` from `Perplexity-User` and documents WAF/IP handling.
- [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) — first-party citation telemetry and publisher guidance. Useful for measurement-stage distinctions, not proof that its recommendations cause citation lift.

### GEO evidence

- [GEO paper, KDD 2024](https://arxiv.org/abs/2311.09735) — primary source for the “up to 40%” claim. The article must include its retrieval and Perplexity-upload boundaries.
- [GEO source repository](https://github.com/GEO-optim/GEO) — prompts and benchmark artifacts if we reproduce or inspect the study further.
- [FeatGEO, ACL 2026](https://aclanthology.org/2026.acl-long.929/) — strong cross-engine citation effects inside a fixed candidate set; warns against generic isolated heuristics.
- [MAGEO, ACL Findings 2026](https://aclanthology.org/2026.findings-acl.2149/) — freezes retrieval to isolate the effect of document edits, reinforcing that the experiment begins after selection.
- [Competitive GEO, SIGIR 2026](https://arxiv.org/abs/2605.25517) — 252,000 controlled paired trials showing topical relevance and list position stronger than formatting-only changes.
- [WordLift structured-memory preprint](https://arxiv.org/abs/2603.10700) — strongest apparent `llms.txt`-adjacent performance result found; the treatment bundles linked data, summaries, navigation, instructions, and other changes, so it cannot isolate the file.
- [OpenAI prompt-injection guidance](https://openai.com/safety/prompt-injections/) — establishes that third-party web content can mislead an agent; supports treating `llms.txt` guidance as untrusted data.

## Claims to avoid

- “`llms.txt` is the `robots.txt` for AI.”
- “No AI system reads `llms.txt`.”
- “Adding `llms.txt` improves ChatGPT or Perplexity citations.”
- “The GEO paper proves a 40% citation-rate lift on the live web.”
- “Our dashboard recorded 97 crawler fetches.”
- “Markdown is always easier for every model than semantic HTML.”
- “JSON-LD improves AI citations.”
- “AI crawlers do not matter because they send little referral traffic.” Training, retrieval, and user-directed fetches have different jobs.

## Open questions

- Can the daily AI Crawl Control export be automated or must the seven-day baseline be captured manually through the dashboard?
- What latency/cache effect does selective Worker-first routing add to the three file classes in this deployment?
- Which user agents produced the existing 97 AI-classified beacon events? Historical rows cannot answer this because no agent name or user agent was stored.
- Should the misleading public metric be renamed before the request-observability experiment, even though that creates a product change during article research?
- Does `llms-full.txt` at 375 KB help any task more than targeted `.md` fetches?
- Should the blog adopt the v2 link relations before or after a measurable baseline exists?
- Can we run the agent-use benchmark across more than one model without turning the article into an eval project?
- What first-person scene best captures the original hope behind ADR-0006?

## Next research actions

- [x] Inspect Cloudflare deployment and logging options for real static-path request visibility. See artifact `02`.
- [ ] Audit Search Console query and Generative AI reports when an authenticated session or export is available.
- [x] Inspect the current crawler classifier against provider-documented agents. See artifact `03`.
- [x] Design and pre-register the small agent-use benchmark. See artifacts `01` and `05`; Goga review still required before freezing.
- [x] Red-team the working thesis against first-party and 2026 peer-reviewed counterevidence. See artifact `04`.
- [ ] Add Bing Webmaster Tools AI Performance export if the site/account exposes it.
- [ ] Capture the seven-day Cloudflare AI Crawl Control baseline.
- [ ] Decide whether to run the benchmark before drafting or publish the measurement gap as the current state.
- [ ] Gather Goga's golden first-person material for the opening and the original implementation decision.
- [ ] Recheck every live source and dated claim immediately before publication.

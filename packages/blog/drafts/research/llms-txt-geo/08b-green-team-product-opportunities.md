# Green-Team Product Opportunities for the AI-Readable Blog

**Date:** 2026-08-25  
**Status:** Product/opportunity audit; no production changes performed  
**Scope:** Find the bounded positive case after the thesis red-team. Map the stack that already exists to reversible next actions, missing rules or components, present beneficiaries, possible value, cost, risk, and evidence thresholds.

## Why green-team after red-team

The red-team usefully removed several claims the implementation cannot support: publishing `llms.txt` is not evidence of organic discovery, a request is not a read, and post-retrieval GEO experiments are not search-ranking experiments.

The green-team asks the complementary question:

> Given those limits, what useful capability is already present, what option value is cheap to preserve, and which experiment could turn an uncertain convention into first-party engineering knowledge?

This is not an argument for investing harder in GEO. It is an argument against throwing away working parts merely because their original causal story was too broad.

## Opportunity statement

The shipped stack is better understood as an **agent-access adapter and experiment surface**, not an audience-acquisition system.

- Static HTML is the durable public product. It serves humans, ordinary search, and agents that can consume the web.
- `llms.txt` is a small map for a client that already knows the domain or is directed there.
- Per-page Markdown is an alternate representation for a client that benefits from clean source text.
- `llms-full.txt` is a corpus export whose value must be earned by cross-document tasks.
- `posts.json` is a catalog API whose value depends on an actual integration.
- Edge analytics can establish request attempts, while a controlled benchmark can establish task utility. Neither establishes organic search lift.

The positive product thesis is therefore:

> Keep the cheap adapter surfaces, make their contracts explicit, and invest only where a real consumer or a controlled task demonstrates value.

That position is flexible. It allows the stack to stay small if adoption remains absent, and it leaves a clean path to deepen it if agents actually use it.

## Evidence-state key

| State | Meaning in this report |
|---|---|
| **Shipped** | Reproduced from the current build output or code. |
| **Observed** | Present in the saved Cloudflare edge snapshot. |
| **Externally supported** | A primary source or maintained client demonstrates the bounded behavior. |
| **Hypothesis** | Plausible value that still needs this blog's own test. |
| **Decision threshold** | A pre-declared condition for spending more time or changing production behavior. |

## Shipped part → opportunity map

| Shipped part | What it does now | Green-team action | Missing rule or component | Who benefits now | Possible value | Evidence state | Cost and risk | Decision threshold |
|---|---|---|---|---|---|---|---|---|
| Static article HTML | Complete indexable content, canonical URL, metadata, and progressive enhancement | Treat it as the source-of-truth representation and benchmark control | Explicit parity rule: Markdown must not contain claims absent from HTML, and HTML must remain fully readable without JS | Human readers, ordinary search crawlers, browser-capable agents | One durable publishing surface instead of an agent-only fork | **Shipped**: `pageShell` emits canonical metadata at `packages/blog/src/templates/page.ts:50-85`; posts receive `BlogPosting` JSON-LD in `packages/blog/src/pipeline/build.ts:171-205` | No new runtime cost. Risk comes only from letting alternate formats diverge | Always retain; it is the fallback even if every agent-specific experiment fails |
| `sitemap.xml`, `robots.txt`, canonical links, and JSON-LD | Standard discovery, eligibility, deduplication, and semantic hygiene | Maintain before adding more agent conventions | Search Console/Bing review cadence and a rule that `lastModified` changes only for meaningful served-page changes | Humans indirectly, search engines, search-backed AI products | Makes the actual publication eligible and legible through documented web mechanisms | **Shipped**: sitemap generation at `packages/blog/src/templates/sitemap.ts:10-26`; JSON-LD at `packages/blog/src/templates/jsonld.ts:25-50`; canonical link at `packages/blog/src/templates/page.ts:58` | Ordinary editorial maintenance; no agent-specific complexity | Invest here before any GEO layer when indexing, canonicalization, or page quality is broken |
| `/llms.txt` | A 7,200-byte generated catalog linking sections, 18 Markdown posts, prompts, public analytics, JSON index, RSS, and source | Keep as a low-cost map; tighten its job statement and test it as a navigation condition | Size budget; stable section taxonomy; link validation; a rule distinguishing navigation claims from discovery claims | A user-directed or coding/research agent that is already sent to the site; the author during audits | Faster known-site orientation and a compact inventory of the publication | **Shipped**: links generated in `packages/blog/src/templates/llms.ts:7-43`; **externally supported, bounded**: an official Google Gemini skill uses an `llms.txt`-style docs map; prevalence and benefit remain unknown | Near-zero marginal generation cost. Risks: stale boilerplate, overclaiming its job, and security mistakes if clients treat publisher text as trusted instructions | Keep while build-time generation and link validation remain automatic. Do not build a custom service around it unless the benchmark shows task benefit or a real consumer appears |
| Per-page `/{slug}.md` | Eighteen clean Markdown alternatives; source Markdown is stripped of frontmatter, while TypeScript posts are converted back to Markdown | Make them deliberately discoverable from their corresponding HTML pages and test whether agents use them more efficiently | V2 `rel="alternate" type="text/markdown"`; `rel="describedby"` pointing to `/llms.txt`; equivalent validation; content-parity tests for `.md` and HTML | Agents given a specific article, archival/research tools, readers who want raw source | Lower extraction noise and a stable citation target after a page is already known | **Shipped**: Markdown writes at `packages/blog/src/pipeline/build.ts:166-183` and `:192-205`; correct MIME/noindex at `packages/blog/public/_headers:15-17`; **hypothesis**: task-efficiency advantage | Low implementation cost because both URLs already exist. Risk: duplicate/stale representations or mistaking local link discovery for organic search lift | Add link relations as hygiene only if build validation can guarantee the target exists. Promote the feature in the article only if E2 preserves quality and improves median bytes/tokens by at least 20% |
| `/llms-full.txt` | A 375,443-byte concatenation of all 18 posts, about 52× the small map | Reclassify as an experimental corpus export; benchmark it, budget it, then retain, cap, shard, or remove based on cross-post utility | Maximum payload warning; inclusion policy; optional section/sharding rule; corpus version/hash; explicit statement that it is not the current proposal's center | A supplied-context RAG job or agent doing cross-post synthesis; not a normal page reader | One-request corpus acquisition and reproducible frozen snapshots | **Shipped**: concatenation at `packages/blog/src/templates/llms.ts:46-63` and `packages/blog/src/pipeline/build.ts:214-217,275`; **observed**: zero historical requests in the saved edge week; task value untested | Build cost is negligible, but transfer/context cost grows with every post. Risks: oversized context, duplicate transfer, stale assumptions, and presenting a community convention as required | Retain during E2. Call it useful only if it materially improves cross-post scores or removes enough navigation to offset payload. If it gets no unexplained requests over 60 clean days and loses to targeted Markdown in E2, stop expanding it or remove it |
| `/posts.json` | A 12,761-byte metadata catalog with slugs, dates, sections, tags, URLs, Markdown links, series, and prompt metadata | Keep as a stable internal/export contract; add versioning only when a consumer needs evolution | Consumer inventory; schema/version policy; generated contract test; documentation of which fields are stable | The build, a future feed/index tool, or an external integration that requests a machine catalog | Cheap list/filter/navigation without parsing prose | **Shipped**: schema emitted at `packages/blog/src/templates/llms.ts:65-81`; file build and presence validation at `packages/blog/src/pipeline/build.ts:276,491-505` | Near-zero generation cost. Risk is accidental API commitment and needless schema work before a consumer exists | Do not productize or version it until one real integration depends on it or a benchmark task requires structured filtering |
| V2 link metadata | Not shipped; the HTML head currently exposes RSS as its only alternate relation | Add page-scoped alternate/described-by relations as a reversible compatibility layer | `pageShell` needs optional Markdown and `llms.txt` relation inputs; output validator needs exact-one/target-exists checks | A client that reaches HTML first and understands the current proposal | Converts a guessed convention into an explicit local affordance | **Hypothesis**, proposal-defined; no first-party adoption evidence yet. Current gap is visible at `packages/blog/src/templates/page.ts:76-84` | Small code change and no database/runtime service. Risks: every generic page must not falsely advertise a nonexistent `.md`; changed requests remain too sparse for causal claims | Worth doing as free hygiene only for post pages with generated Markdown. Revert if it complicates the generic page shell or causes invalid relations. Never label resulting traffic as search lift |
| Browser analytics and public `ai_fetches` | Records client-side `/api/event` beacons and labels `visitor_type = 2` events as `ai_fetches` | Rename/reframe before using the metric in this research; preserve browser/referral analytics as a separate population | Semantic migration from “AI reads/fetches” to “AI-identified client events”; purpose-aware categories only if original request instrumentation ships | The author and readers inspecting public traffic | Honest referral/browser evidence, including visits from chat product links | **Shipped**: browser beacon at `packages/blog/src/templates/page.ts:155-157`; event classification at `packages/analytics/src/index.ts:43-90`; label construction at `packages/analytics/src/stats.ts:72-91` | Naming fix is small; schema changes are not free. Risk: historical discontinuity and continued conflation of browser visits with crawls | Fix the public meaning before drawing conclusions from it. Do not expand the classifier solely to improve a metric that cannot see static requests |
| Cloudflare edge aggregates | Can see static target-path requests without changing routing | Use as the default observation layer while traffic is rare; preserve non-overlapping daily summaries | Repeatable query/export script, intervention log, contamination flag, and a fixed clean window | The author/research project | First-party retrieval-attempt evidence at zero production risk | **Observed**: the saved seven-day reconstruction saw three `llms.txt` and three `.md` requests, no named provider UA, and no `llms-full.txt`; all nonempty groups reported sample interval 1 | No deployment cost, but manual daily collection costs attention; aggregates have short retention, UA ambiguity, and possible sampling | Run a clean 30-day window first. Do not build durable request logging if target traffic remains below one unexplained request/day and no decision depends on exact rows |
| Selective Worker + D1 request ledger | Not shipped; current static paths bypass the Worker because `run_worker_first` contains only `/api/*` | Hold as a reversible measurement upgrade, not a default feature | `ASSETS` binding in Worker env; explicit `GET`/`HEAD` pass-through; separate minimized fetch-event table; purpose-aware classifier; retention policy; serving and latency tests | The research experiment first; later, a site operator with enough request volume to need exact evidence | Unsampled durable counts, response outcomes, path-level populations, and clean pre/post observation | **Designed, not shipped**: routing gap at `wrangler.jsonc:21-28`; current Worker ends in 404 at `packages/blog/src/worker/index.ts:28-80` | Real engineering and privacy cost. Selected requests consume Worker invocations and add a failure/latency path. A missing `env.ASSETS.fetch(request)` branch would turn target resources into 404s | Build only if (a) the clean baseline averages at least one unexplained target request/day, (b) a named/important client recurs and exact records would change a decision, or (c) a time-bounded experiment explicitly requires unsampled events. Otherwise use edge aggregates |

## What counts as free hygiene

“Free” should mean **no new service, database, recurring manual curation, or runtime dependency**. It does not mean no engineering time.

The following fit that definition because the existing build already has every post's HTML URL, Markdown URL, metadata, and source:

1. Keep generating `llms.txt`, per-page Markdown, and `posts.json` from the same `PostMeta[]` pipeline.
2. Add post-only `alternate` and `describedby` relations if the build can validate their targets.
3. Add build checks for broken `llms.txt` links, one-to-one HTML/Markdown coverage, MIME/noindex headers, and payload growth.
4. Put an explicit size warning—not an arbitrary hard failure—on `llms-full.txt` while its usefulness is unknown.
5. Rewrite descriptions and dashboard labels so each artifact says what it actually measures.

The following are **real investment**:

- routing static resources through a Worker;
- adding a D1 fetch-event schema and retention process;
- maintaining a crawler-purpose taxonomy;
- operating recurring telemetry collection indefinitely;
- building an agent API, RAG service, MCP server, or dynamic corpus endpoint;
- maintaining special summaries or schemas by hand;
- treating `posts.json` as a public versioned API;
- running repeated multi-model benchmarks with blind scoring.

This boundary protects the blog from rebuilding its infrastructure instead of publishing.

## Flexible investment ladder

Each stage is independently useful and reversible. Advancing is evidence-driven, not a maturity ritual.

### Stage 0 — Preserve the working surface and correct the story

**Action**

- Keep static HTML and auto-generated machine formats.
- Describe `llms.txt` as a known-site navigation aid.
- Describe edge requests as requests, browser events as events, and citations as citations.
- Keep standard indexing health ahead of all agent-specific work.

**Beneficiary now:** humans, ordinary web crawlers, and the author.  
**Cost:** editorial and naming work; no new runtime behavior.  
**Exit/advance threshold:** none. This is the stable default.

### Stage 1 — Add reversible compatibility hygiene

**Action**

- Add Markdown `alternate` and `llms.txt` `describedby` links only on article pages.
- Validate that every advertised target exists and serves the promised content type.
- Add payload reporting for the small map, each page Markdown file, the full dump, and the JSON catalog.
- Record the proposal version or audit date in the research artifact, not necessarily in the public file.

**Beneficiary now:** clients that already reach an article and implement the proposal.  
**Cost:** likely a focused template/validator change, not a service.  
**Risk:** false metadata on non-post pages; interpreting any later request as causal proof.  
**Reversal:** remove two generated link elements; the existing URLs keep working.  
**Advance threshold:** none for the hygiene itself. Any stronger product claim waits for Stage 3.

### Stage 2 — Observe before instrumenting

**Action**

- Declare a research-fetch cutoff.
- Save non-overlapping Cloudflare edge summaries for a 30-day clean window.
- Separate known research requests, browser-like requests, command-line clients, named search crawlers, training crawlers, and user-directed fetchers.
- Record sample interval and response status with each daily result.

**Beneficiary now:** the article and future architecture decisions.  
**Cost:** operator attention; no production mutation.  
**Risk:** short retention, ambiguous user agents, contamination on a low-traffic site.  
**Reversal:** stop collecting.  
**Advance to durable instrumentation only if:**

- unexplained target-path traffic averages at least one request per day over the clean month; or
- the same material client appears at least three times and distinguishing its exact paths/statuses would change a decision; or
- a pre-registered intervention requires request-level, unsampled records.

These are project decision thresholds, not industry standards. Their purpose is to prevent a handful of ambiguous requests from triggering a telemetry product.

### Stage 3 — Test agent utility, not search lift

**Action**

- Run the pre-registered HTML vs map+Markdown vs full-dump benchmark in [`01-agent-use-benchmark-plan.md`](./01-agent-use-benchmark-plan.md).
- Use the frozen question set, source snapshot, access traces, blind scoring, and identical tool budgets.
- Report the score vector, transfers, failures, and model disagreement rather than a single marketing number.

**Beneficiary now:** direct agents doing real research on the publication; other small publishers deciding whether alternate formats are worth carrying.  
**Cost:** harness work, model/tool cost, repeated runs, and human adjudication.  
**Risk:** contamination, harness-specific results, and a blog-shaped task set.  
**Reversal:** none needed; it is an offline experiment.  
**Success thresholds already pre-registered:**

- quality is not lower than HTML beyond one scoring point across the full set;
- median fetched bytes or input tokens fall by at least 20% without more unsupported claims;
- the full dump survives only if it materially improves cross-post synthesis or offsets navigation enough to justify its payload.

If map+Markdown wins on a bounded task, the useful claim is “this representation helped these agents perform this supplied-source task.” If HTML ties or wins, keep only the formats whose marginal cost remains genuinely negligible.

### Stage 4 — Add exact request observability only when it can change a decision

**Action**

- Route only `/llms.txt`, `/llms-full.txt`, and `/*.md` through the Worker.
- Return `env.ASSETS.fetch(request)` unchanged for matching `GET` and `HEAD` requests.
- Write a separate, minimized, best-effort D1 event after response status is known.
- Retain no IP or visitor fingerprint; expire raw user-agent rows on a declared schedule.
- Compare D1 with Workers Logs for the first three days before trusting a longer run.

**Beneficiary now:** the experiment operator, not readers or search systems.  
**Cost:** Worker invocations, D1 writes, schema/queries, tests, retention, and operational risk.  
**Risk:** serving failure, added latency, UA spoofing, privacy drift, and metric creep.  
**Reversal:** remove selective `run_worker_first` paths and the pass-through branch; retain only aggregate experiment results.  
**Continue threshold:** exact data must resolve a live choice—keep/remove full dump, preserve/drop a client-specific path, or evaluate a declared link intervention. If it only produces a more precise zero, stop.

### Stage 5 — Productize only for a demonstrated consumer

Possible expansions include a versioned catalog, topic-specific corpus shards, a documented content API, or a query interface. None belongs on the roadmap yet.

Advance only when at least one of these is true:

- an external tool integrates with `posts.json` or Markdown and requests a stable contract;
- repeated benchmark tasks show a need that static files cannot meet;
- corpus size makes targeted retrieval materially better than the current map;
- a real reader/agent workflow supplies concrete requirements and agrees to test them.

The first implementation should serve that consumer's narrow task. Do not build an MCP server merely because the blog is about agents.

## Decision rules by artifact

### `llms.txt`: preserve cheap optionality

Keep it while all of the following remain true:

- generation is automatic;
- links are validated;
- the description does not promise discovery or ranking;
- no hand-maintained taxonomy is required;
- the file remains a map rather than a second publication.

The positive case does not need mass crawler adoption. A cheap compatibility document can be rational for a small set of direct-agent clients, just as RSS can remain useful without being the main acquisition channel. The mistake would be measuring it as traffic strategy or growing it into a product without a consumer.

### Per-page Markdown: strongest candidate for durable utility

This is the most promising part because its value can be tested directly. A user or agent can receive an exact article URL; the question is then whether clean Markdown improves extraction, qualification preservation, citations, bytes, or time.

The link relations are useful because they remove guessing **inside a known page visit**. They do not need to be sold as open-web discovery.

### Full dump: earn its payload

The original ADR expected roughly 50 KB for a small publication and warned that the file grows with every post (`docs/adr/0006-ai-readable-blog.md:316`). The current output is 375,443 bytes. Growth itself is not failure, but it turns “free static file” into a context and transfer decision.

Green-team options, in order:

1. keep it unchanged through the controlled benchmark;
2. if useful but bloated, shard by section or series;
3. if only a few tasks benefit, generate a frozen benchmark corpus rather than a permanent public dump;
4. if targeted Markdown matches or beats it, stop expanding or remove it.

### `posts.json`: wait for a contract owner

The file is a clean catalog and costs almost nothing to regenerate. Its option value is real. But versioning, compatibility promises, pagination, query parameters, or API documentation would create product obligations. Those start when a consumer exists, not when a field can be imagined.

### Analytics: instrument questions, not identity theater

The useful question is not “How many AI reads?” It is:

- Was a target resource requested?
- Which resource and status?
- What purpose did the presented client identifier claim?
- Did a controlled agent use the representation more effectively?
- Did a human arrive from an AI product referral?

Those are different datasets. Keeping them separate produces a more valuable public analytics story than a larger crawler regex.

## Creating unique first-party knowledge without claiming search lift

The opportunity is not another literature summary. The blog can publish a small, reproducible body of evidence that other personal publishers do not have.

### 1. Representation utility benchmark

Test ordinary HTML, `llms.txt` plus targeted Markdown, and the full dump against frozen research questions.

Publish:

- the exact site commit and content hashes;
- question set and answer key after the run;
- tool policies and model identifiers;
- every resource read and transferred byte;
- raw answers and blind scores;
- null results and disagreements.

**Novel knowledge:** whether alternate representations improve supplied-source tasks on a real mixed-format engineering publication.  
**Claim boundary:** says nothing about organic discovery, indexing, ranking, or citation frequency in public search products.

### 2. Map-to-page navigation trace

Give an agent the domain or map and a task requiring two non-obvious posts. Record which links it follows, loops, misses, bytes, and final qualifications.

**Novel knowledge:** how an agent actually navigates this information architecture.  
**Possible product output:** better section labels, summaries, or corpus shards based on observed confusion—not keywords.

### 3. Full-dump growth curve

At each publication milestone, record total bytes, median post bytes, repeated boilerplate, and benchmark performance. Compare one-shot context with targeted fetches.

**Novel knowledge:** where a full-publication dump stops paying for itself on a growing personal blog.  
**Decision value:** supplies an evidence-based cap/sharding rule.

### 4. V2 local-discovery observation

After a clean baseline, add post-only `alternate` and `describedby` relations and observe target-path requests for a declared period.

**Novel knowledge:** whether any observed clients move from HTML to advertised local alternatives on this site.  
**Claim boundary:** a sparse before/after cannot establish causality, and it cannot establish AI-search lift. Treat it as implementation telemetry, not an SEO experiment.

### 5. Measurement-system field note

Preserve the gap between the browser-beacon `ai_fetches` label and edge-visible static requests, then show the corrected event vocabulary.

**Novel knowledge:** a concrete architecture failure mode for static sites measuring non-browser consumers.  
**Human value:** other engineers can audit whether their own “AI traffic” dashboard measures the boundary they think it measures.

### 6. Reader-and-agent parity audit

For a sample of Markdown and TypeScript posts, compare:

- headings and reading order;
- code fences and language labels;
- links and series trails;
- figures/alt text;
- caveats and afterwords;
- prompt transparency links.

**Novel knowledge:** where a multi-format static publishing pipeline silently changes meaning.  
**Product value:** representation quality that benefits direct agents without rewriting prose for machines.

## Outcome branches: adapt rather than defend the original stack

| What the evidence says | Adaptation |
|---|---|
| No clean target requests and no benchmark benefit | Keep standard HTML/search hygiene. Retain only genuinely zero-maintenance alternate files; stop expanding the full dump and do not build telemetry. |
| Few requests, but map+Markdown improves task efficiency | Keep and validate the static adapter layer. Document it for user-directed agents; do not call it acquisition. |
| Full dump beats targeted fetches on cross-post work | Keep it with a size budget and versioned snapshots; consider section shards as the corpus grows. |
| Targeted Markdown matches full dump | Prefer targeted files and a compact map; cap or remove the monolith. |
| Named clients repeatedly request target paths | Add time-bounded exact instrumentation only if path/status distinctions affect a decision. |
| Generic `curl`/browser traffic dominates | Preserve attribution uncertainty. Improve task experiments rather than building a larger UA taxonomy. |
| AI-product referrals grow but static file fetches do not | Invest in article quality, query fit, source evidence, and standard indexability—not more machine-only formats. |
| A real tool adopts `posts.json` or Markdown | Name that consumer, define the narrow contract, add versioning/tests, and let actual integration needs shape the next component. |

## Product risks the green-team does not waive

- **Infrastructure displacement:** research tooling can consume the time the struggling blog needs for publishing and distribution.
- **Metric seduction:** exact D1 rows can feel valuable even when the underlying request volume is too small to guide a decision.
- **Contract creep:** a free generated file becomes expensive when external compatibility or manual summaries are promised.
- **Representation drift:** HTML, source Markdown, converted TypeScript posts, series trails, and full-dump copies can diverge.
- **Context waste:** a larger corpus can reduce task quality even while making retrieval look simpler.
- **Trust confusion:** `llms.txt` is publisher-controlled web content, not a privileged instruction channel.
- **False causality:** link metadata followed by a request is not proof the metadata caused it; a request followed by a referral is not proof of answer influence.
- **Small-sample overreaction:** on this blog, the researcher can become most of the measured traffic.

## Article implications

The red-team gave the article a defensible boundary. The green-team gives it somewhere constructive to go.

The article should not end at “`llms.txt` does not drive AI search.” It can end with a more useful operating model:

1. Build for the open web first.
2. Keep machine alternatives when they fall out of the same pipeline.
3. Give each artifact one job and one honest metric.
4. Test supplied-source usefulness before claiming agent value.
5. Instrument exact requests only when the answer will change a product decision.
6. Let a real consumer pull the system forward.

This also resolves the authenticity problem. The positive recommendation comes from the thing Goga actually built and audited. It does not require pretending that the stack attracted an audience. The contribution is the revised decision framework and the reproducible experiment—not a promise of engagement.

## Recommended next decision

Proceed in this order:

1. Preserve the current static outputs through the benchmark.
2. Freeze and run the controlled agent-use benchmark before modifying representation or discovery signals.
3. In parallel only if it does not require production work, collect the declared clean edge baseline.
4. Treat V2 link relations as the first reversible post-benchmark hygiene change.
5. Decide the full dump's future from benchmark utility plus a 60-day request observation, not from convention.
6. Defer selective Worker/D1 logging until the Stage 2 threshold is crossed.

That path produces publishable first-party knowledge even if the answer is “HTML was enough.” It also preserves the possibility that map-plus-Markdown is genuinely useful for a narrower client class.

## Local evidence and cross-reference rationale

| Source | Why it matters to this green-team |
|---|---|
| [`00-research-scratchpad.md`](./00-research-scratchpad.md) | Holds the current thesis, three-stage model, implementation audit, authenticity contract, and claim ledger |
| [`01-agent-use-benchmark-plan.md`](./01-agent-use-benchmark-plan.md) | Supplies the bounded utility hypotheses and pre-declared success thresholds |
| [`02-cloudflare-static-request-observability.md`](./02-cloudflare-static-request-observability.md) | Defines the no-code and exact-observability options, Free-plan constraints, serving trap, and privacy boundary |
| [`03-crawler-classifier-audit.md`](./03-crawler-classifier-audit.md) | Shows why a purpose-aware taxonomy is required if original request instrumentation ever ships |
| [`04-thesis-red-team.md`](./04-thesis-red-team.md) | Supplies the strongest positive counterevidence, newer GEO boundaries, and trust/security correction |
| [`05-benchmark-question-set.md`](./05-benchmark-question-set.md) | Makes the utility experiment concrete rather than hypothetical |
| [`06-edge-baseline-2026-08-24.md`](./06-edge-baseline-2026-08-24.md) | Establishes that edge observation works and that research traffic can dominate a low-volume system |
| `docs/adr/0006-ai-readable-blog.md` | Preserves the original discovery → consumption → measurement product theory and its early size assumptions |
| `packages/blog/src/templates/llms.ts` | Defines the shipped map, full dump, catalog schema, and links between representations |
| `packages/blog/src/pipeline/build.ts` | Proves all representations share one build pipeline and identifies the right location for validation |
| `packages/blog/src/templates/page.ts` | Shows the current head metadata gap and the browser-only analytics beacon |
| `packages/blog/public/_headers` | Confirms Markdown MIME and noindex behavior plus noindex for the full dump and catalog |
| `wrangler.jsonc` and `packages/blog/src/worker/index.ts` | Establish that static paths bypass the Worker and that selective routing without asset pass-through would break them |

## Final green-team verdict

The stack should neither be celebrated as a growth engine nor discarded as failed SEO.

Its current value is threefold:

1. **cheap compatibility:** known-site agents have clean maps and representations;
2. **option value:** the same publishing pipeline can support a future real consumer without a redesign;
3. **research value:** the blog can produce first-party evidence about task utility, format costs, navigation, and measurement architecture.

The flexible rule is simple:

> Preserve what remains automatic. Validate what clients can depend on. Benchmark what claims to improve a task. Instrument only when the result can change a decision. Productize only when a real consumer arrives.

# Draft Editorial Review — Durable Search Doorway Without Losing the Field Note

**Draft reviewed:** first iteration of [`019-does-llms-txt-work.md`](../../../posts/019-does-llms-txt-work.md), renamed after review
**Reviewed:** 2026-08-25  
**Scope:** Article shape, voice, authenticity, evergreen search potential, title architecture, practical reader value, and ending.  
**Skills applied:** `shape-article` → `blog-writing` → `shareable-engineering`.  
**Repository action:** Review artifact only. The draft was not edited.

## Executive verdict

The draft is a strong engineering field note and a weak search doorway.

Its living center is real: Goga wanted readers, built an agent-readable system, discovered that its “AI Reads” metric could not observe direct reads, and reassigned the system a smaller job. The code-level measurement failure, first-party edge data, working `mcpdoc` reproduction, and HTML-versus-Markdown comparison give the article more original evidence than most `llms.txt` guides.

But a cold searcher asking “Does `llms.txt` work?”, “How do I add it?”, or “Do I need `llms-full.txt`?” must read through roughly two-thirds of the article before receiving a clear build decision. The current title sounds like a sequel or personal field note. The `seoTitle` promises “how to test it,” while the body describes a future test rather than giving the reader a runnable test. The article has no file-format example, implementation path, validation checklist, or concise provider answer near the top.

That mismatch will limit relevant search traffic even if the piece is excellent after the click.

The recommendation is not to replace the field note with a generic guide. Build one article with two layers:

1. **A search-legible practical guide at the front:** direct answer, who should ship what, minimal implementation, artifact decision table, and bounded provider guidance.
2. **The first-person investigation beneath it:** the broken metric, edge reconstruction, real client use, Markdown measurement, GEO evidence, and the experiment that can change the decision.

The practical layer answers why the reader arrived. The investigation proves why this particular author is worth trusting.

## Governing form and revised movement

**Governing form:** Engineering decision guide supported by a first-person field investigation.

This is a meaningful change from the current “research synthesis plus field investigation.” The evidence is now mature enough to give a practical decision. Search traffic requires the article to answer an intent, but the investigation remains the authority layer rather than decorative personal framing.

### Governing question

> Should I add `llms.txt`, page-level Markdown, or `llms-full.txt` to my site—and what can each one honestly improve?

### Human question beneath it

> If `llms.txt` cannot create the reason an agent enters my site, what useful job can I give it today, and what evidence would earn it a larger one tomorrow?

The first question earns the search visit. The second is the living center that makes the answer Goga's.

### Required movement

1. Give the practical answer before asking for trust.
2. Show the implementation decision by site/client type.
3. Reveal that Goga originally gave the stack a broader job.
4. Find the metric failure in the code.
5. Separate discovery, selection, navigation, use, citation, and referral.
6. Establish the bounded positive case through real clients.
7. Give the index, page Markdown, and full dump separate decisions.
8. End with the current operating choice and evidence that can change it.

This movement is not “SEO answer first, personality later.” The direct answer is the conclusion the personal investigation earned. It belongs up front because the title and description invite a reader who does not yet know Goga.

## What the current draft already does unusually well

Protect these elements during restructuring.

### The opening confession

`I built llms.txt for a blog nobody read.` at line 15 is strong. It names the artifact, personal stake, and uncomfortable context in eight words. Keep it immediately after the direct answer or as the bridge into the investigation.

### The metric failure

Lines 36–77 are the article's strongest original contribution. Most guides list bot names; this article shows an architectural category error:

> "I was asking a browser page-view system to answer a server retrieval question."

Keep that sentence. It makes another engineer able to audit their own system.

### The contaminated baseline

Lines 79–98 contain the article's most memorable first-party observation: at low traffic, the researcher became most of the measured traffic. Preserve the scene, but it does not need to appear before the reader receives the practical answer.

### The stage model

Lines 100–117 explain why arguments about “working” slide between incompatible measurements. This is the stable evergreen framework. It should survive provider changes.

### The positive counterexample

`Google Search ignores it. A Google agent uses it.` at line 119 is excellent. It prevents skepticism from becoming the author's brand and gives the proposal its strongest fair hearing.

### The client and representation evidence

The `mcpdoc` reproduction, maintained client examples, and 67.8% representation reduction distinguish this piece from generic guides. These are the article's unfair proof. Surface them in the standfirst or early decision table rather than hiding them in the middle.

### The honest audience desire

`I still want readers.` at line 283 protects the article from performing indifference. Keep that truth in the ending.

## Why the current draft is not yet a durable doorway

### 1. The H1 assumes context the searcher does not have

`I Gave llms.txt a Smaller Job` is a good field-note title. It does not tell a cold reader:

- whether the file works;
- what the smaller job is;
- whether this is a guide, experiment, or opinion;
- what they will be able to decide after reading.

The metadata split helps because the `seoTitle` is concrete, but H1, title links, snippets, anchors, and shares still need semantic alignment. The current H1 reads like chapter two.

### 2. The first 100 words contain the story but not the answer

The orientation sentence says this is an audit. The next paragraphs explain what Goga built. A searcher cannot yet extract the current verdict.

The first 100 words need a self-contained answer covering:

- `llms.txt` is not a Google Search ranking signal;
- its strongest current job is known-site agent navigation;
- page-level Markdown may be more useful than the root file;
- the full dump needs a task-specific reason;
- ordinary crawlable HTML remains the source of truth.

This does not spoil the story. It establishes the result; the field investigation then establishes trust.

### 3. The promised guide behavior is missing

The current `seoTitle` says “What Works and How to Test It.” The article explains Goga's planned benchmark, but a reader cannot leave with a small runnable test or implementation checklist.

For search intent, the article needs:

- a minimal valid `llms.txt` example;
- where it is served;
- how it differs from `robots.txt`, sitemap, page Markdown, and `llms-full.txt`;
- a decision by site type;
- a validation checklist;
- a small observation/task test a reader can reproduce;
- current provider boundaries in a dated, maintainable form.

Without those, “guide” and “how to test” overpromise.

### 4. The broad GEO intent dilutes the stronger `llms.txt` intent

The draft is strongest on `llms.txt`, page Markdown, crawler measurement, and supplied-source use. It is not a complete guide to winning citations across ChatGPT, Perplexity, Google AI Overviews, and Bing.

Trying to rank as a broad “GEO guide” puts the article against commercial publications whose entire page architecture targets that category. GEO should remain a secondary explanatory section: it explains what happens after retrieval and why a formatting recipe is not a discovery strategy.

Primary search cluster:

- `does llms.txt work`;
- `llms.txt guide`;
- `llms.txt example`;
- `llms.txt vs llms-full.txt`;
- `llms.txt vs robots.txt`;
- `llms.txt Markdown`;
- `how to track llms.txt requests`;
- `AI crawler analytics`.

Secondary cluster:

- `llms.txt GEO`;
- `generative engine optimization evidence`;
- `GEO after retrieval`;
- `track AI citations vs crawlers`.

These are intent hypotheses, not measured keyword volumes. No keyword tool was run. Substantial traffic cannot be promised from this review; the page must earn it through relevance, links, age, and query fit.

### 5. Competitors already answer the generic guide query directly

A 2026-08-25 search spot-check found several pages with exact-match guide packaging:

- [Traffix, “llms.txt: a developer's guide (with a real example)”](https://traffix.dev/guides/llms-txt) opens with a definition, evidence verdict, copyable example, and FAQ.
- [DerivateX, “LLMs.txt: The Complete Guide for SEO and AI Search”](https://derivatex.agency/blog/llms-txt-guide/) uses a direct answer, artifact comparison, implementation guidance, research section, limitations, and FAQ.
- [MarqOps, “Generative Engine Optimization: a source-backed GEO guide”](https://www.marqops.com/guides/generative-engine-optimization) exposes technical eligibility, answer structure, verification, measurement, workflow, and myths in the table of contents.

This spot-check is competitor-shape evidence, not a complete SERP analysis and not search-volume evidence. It shows that a purely reflective field note will not win the generic guide intent merely by being more honest.

Goga's differentiation is stronger than theirs when it is visible:

- a deployed stack rather than a sample file;
- a public metric that failed its own name;
- Cloudflare edge evidence and contamination analysis;
- a reproduced generic MCP client path;
- maintained skill/client examples pinned to code;
- a first-party HTML/Markdown token comparison;
- a pre-registered task benchmark rather than a citation testimonial.

The article should compete on those receipts while matching the basic usability of a guide.

## Recommended positioning

### Primary promise

> A practical, evidence-backed guide to deciding whether to ship `llms.txt`, page Markdown, or `llms-full.txt`, built from a real production audit rather than provider folklore.

### One-sentence reader outcome

> By the end, a site owner can assign each artifact a job, implement the smallest useful layer, and choose the one measurement that can test that job.

### Disagreeable position

> `llms.txt` is worth shipping for known-site agent navigation when it falls out of the existing content pipeline; it is not worth treating as an audience-acquisition program.

### Why it remains genuine

The practical recommendation is not borrowed search advice. It is the revised operating decision produced by Goga's own architecture, the audit of that architecture, and a real desire for readers. The guide layer is a clearer doorway into the same article, not a substitute personality.

## Title architecture

### Recommended option

- **H1:** `I Audited llms.txt: What to Build and What to Skip`
- **seoTitle:** `llms.txt Guide: What Works, Setup, and Real Tests`
- **alternativeHeadline:** `A production audit of llms.txt, page Markdown, full dumps, AI crawler measurement, and GEO evidence`
- **description:** `Does llms.txt improve AI search? I audited a live implementation, real agent clients, crawler logs, and GEO evidence—then kept only the jobs the evidence supports.`

Why this option leads:

- `llms.txt` is front-loaded in both title surfaces.
- The H1 keeps first-person proof and gives a concrete decision promise.
- The `seoTitle` matches guide, setup, and testing intent without claiming a complete GEO playbook.
- The description asks the high-intent question and immediately names original evidence.

The `seoTitle` must only retain “real tests” if the article includes a reproducible test the reader can run. If the benchmark remains only planned, use `llms.txt Guide: Evidence, Setup, and Measurement` instead.

### Strong alternatives

1. **H1:** `I Gave llms.txt a Smaller Job: A Practical Guide`  
   **seoTitle:** `llms.txt Guide: What It Does and How to Test It`  
   Preserves the existing living title but makes the doorway explicit. Best if minimal structural change is preferred.

2. **H1:** `llms.txt in Practice: What to Keep, Test, and Skip`  
   **seoTitle:** `llms.txt Guide: Setup, Evidence, and Real Use Cases`  
   Strongest pure decision title; loses some authorial distinctiveness.

3. **H1:** `Does llms.txt Work? I Audited My Own Stack`  
   **seoTitle:** `Does llms.txt Work? Evidence, Setup, and Tests`  
   Exact query match and clear first-party proof. Question titles show no inherent CTR advantage, so choose it only because it accurately matches the reader's question.

4. **H1:** `llms.txt Is Useful After Discovery, Not Before`  
   **seoTitle:** `llms.txt Guide: Search Limits and Agent Use Cases`  
   Sharpest thesis. It may overcompress the role of v2 in-site discovery and sounds more like an argument than a guide.

### Current title verdict

The current H1 can survive only if the first screen carries a direct answer and a visible practical-guide promise. For the stated goal of substantial relevant search traffic, a hybrid H1 is safer.

## Proposed opening answer

This belongs after the orientation sentence and before `I built llms.txt for a blog nobody read.` It is sample prose for the author to accept or rewrite, not a claim that Goga has approved these decisions.

> `llms.txt` is worth adding when it can be generated from content you already maintain and an agent already has a reason to visit your site—especially developer documentation. It is not a Google Search ranking signal, and no reviewed evidence shows that publishing the file alone increases organic AI citations. Keep crawlable HTML as the source of truth, use a small index to point at page-level Markdown, and make `llms-full.txt` prove itself on a real task before letting it grow. Measure requests, citations, and human referrals separately.

Then bridge into the investigation:

> I did not reach that decision by reading another guide. In March, I built the entire layer for a blog nobody read.

This preserves the current opening line while making the page useful even to a reader who scans only the first screen.

## Dual-layer article structure

The target is not two articles pasted together. The practical layer should be compact, and every later section should supply evidence for a decision already exposed at the top.

### Layer A — Search-legible practical guide

Aim for roughly 700–1,000 words. A cold reader should be able to make a preliminary decision here.

#### 1. Direct answer

**Job:** State what the file can do, cannot do, and what to prioritize.

**Content:** The proposed opening above, followed by a one-sentence evidence date: “Provider behavior and client examples checked 2026-08-25.”

#### 2. Should you add it?

**Job:** Match the reader's site to a decision.

Use one compact table:

| Site or client | Ship now | Why | Do not expect |
|---|---|---|---|
| Personal blog | Keep a generated index and page Markdown only if maintenance is negligible | Cheap optional access for user-directed agents | New readers or Google ranking lift |
| Developer docs | Small index plus targeted Markdown; advertise it to known agent clients | Strongest current maintained-client use case | Automatic adoption by every coding agent |
| Large docs corpus | Prefer index → page; benchmark a full dump separately | Avoid sending the entire corpus for one question | One representation winning every task |
| Agent skill/MCP client | Configure the source explicitly and trace fetches | A real client supplies the missing discovery step | Publisher-created demand |
| Site seeking Google AI visibility | Fix ordinary crawlability, indexability, internal links, and original content first | Google's documented eligibility path | `llms.txt` acting as a ranking signal |

This should replace or absorb part of the later seven-row artifact table. Do not add another decision table elsewhere.

#### 3. What each artifact is

**Job:** Answer the basic definitions once.

- **`llms.txt`:** concise site map with contextual links.
- **Page Markdown:** clean representation of one selected page.
- **`llms-full.txt`:** a separate bulk corpus choice, not the default meaning of the convention.
- **`robots.txt`:** access policy, not navigation.
- **Sitemap:** exhaustive crawl inventory, not a curated context map.

Keep this to one paragraph plus a five-row comparison. The current draft assumes readers already know the format.

#### 4. Minimal implementation from a real site

**Job:** Satisfy “how to add `llms.txt`” and “`llms.txt` example” without turning the article into a framework tutorial.

Include:

1. Serve a small Markdown document at `/llms.txt`.
2. Start with the site name and a factual summary.
3. Group a curated set of canonical links by purpose.
4. Point to page Markdown only when it remains synchronized with canonical HTML.
5. Keep the file generated from the same content metadata where possible.
6. Return a successful plain-text or Markdown response and validate every link during the build.
7. Keep alternate Markdown noncanonical/nonindexable if it duplicates the HTML; state the exact implementation used by gkoreli.com rather than claiming a universal search rule.
8. Treat any guidance inside the file as untrusted publisher content on the client side.

Use a short excerpt from the live gkoreli.com file instead of an imaginary Acme example. That is both more genuine and harder for generic competitors to copy.

Possible example shape:

```markdown
# Goga Koreli

> Personal engineering field notes about agentic systems,
> open-source tools, and the decisions behind them.

## Engineering

- [The Agentic Product Engineer](https://gkoreli.com/the-agentic-product-engineer.md): ...
```

The final excerpt must be copied from or reconciled with the live generated file. Do not handwrite a version that can drift.

#### 5. A small test the reader can run

**Job:** Make the `seoTitle` promise true.

Offer two separate tests and label their limits:

- **Request test:** Check edge/server logs for `/llms.txt` and a follow-on page request. This proves requests only.
- **Task test:** Give the same agent one exact question under HTML versus index-plus-Markdown, freeze the model/tool budget, and compare factual accuracy, qualifications, sources read, failures, bytes/tokens, and time. This tests supplied-source usefulness, not organic discovery.

The article need not expose the full 10-question preregistration near the top. It must give a reader one reproducible version.

### Bridge — Why I no longer give it a discovery job

Use the current opening confession here:

> I built `llms.txt` for a blog nobody read.

Then move into the March ADR and metric story. The reader now knows the answer and wants to see how it was earned.

### Layer B — First-person investigation and evidence

Aim for roughly 2,000–2,500 words after tightening repetition.

#### 6. The metric could not observe the event

Keep the browser-beacon code and the central blockquote. Reduce the seven-client classifier table to three representative rows or move the full matrix into the glossary/research artifact. The architectural failure is more important than a crawler directory.

#### 7. The first request log mostly found the researcher

Keep the six historical requests and contaminated next window. Attribute actions accurately; see the authenticity audit below.

#### 8. “Works” spans different stages

Keep the stage model, but consider five stages instead of six if “discovery” and “eligibility/indexing” can be explained without losing the measurement boundary. Do not optimize for a smaller number if the distinction matters. This is one of only two tables that deserve to stay in the narrative.

#### 9. Where maintained clients use it

Merge the current Google, Prismatic, tldraw, Streamlit, and `mcpdoc` material into one section organized by job:

- index → targeted page;
- cached full dump for a bounded migration;
- configured MCP source for user-directed access.

Do not give `mcpdoc` its own H2 unless the article includes a reproducible command/config snippet. Otherwise it feels like a research detour.

#### 10. Why page Markdown may be the durable part

Keep the 27,554-byte / 7,683-token versus 10,756-byte / 2,476-token table. It is the second narrative table that earns its place. Keep the caveat that representation size is not task performance.

The polished three-sentence blockquote at line 175 can return to prose. The measurement is strong enough without a slogan.

#### 11. What GEO evidence supports after retrieval

Keep this section bounded and concise. It should answer:

- what the 2024 paper supplied;
- what newer fixed-candidate studies add;
- what stable writing practice follows;
- why none of it proves the root file created discovery.

This is supporting evidence, not the primary target query. Avoid turning the article into a complete GEO history.

#### 12. What I keep, test, and stop investing in

Replace the current artifact table plus `Keep / Test / Put on probation / Do not build yet` list with one consolidated decision table. They currently repeat the same judgment twice.

Required rows:

- semantic HTML;
- small index;
- page Markdown;
- full dump;
- public metric/classifier;
- exact request ledger.

Each row should have: current decision, reason, and evidence that changes it.

#### 13. The benchmark and update contract

Keep the experiment, but state its status truthfully: designed, awaiting author review/freeze, or registered. Do not call it preregistered until the questions, thresholds, snapshot, and protocol are frozen.

The section should end with the exact material update triggers. Provider identifiers and client examples belong in a dated table or glossary, while the stage model stays stable.

### Layer C — Evergreen reference tail

#### 14. FAQ from real reader questions

Use visible questions because these are genuine recurring decisions, not because FAQ schema is sold as GEO. Do not add `FAQPage` schema.

Recommended questions:

1. **What is `llms.txt`?**  
   Define it as a proposal/convention and concise contextual map.

2. **Does `llms.txt` improve Google rankings or AI Overviews?**  
   No for Google as of the dated guidance check; ordinary Search eligibility still applies.

3. **Do ChatGPT, Claude, Perplexity, or coding agents read it?**  
   Separate provider search crawlers from explicitly configured skills/clients. Name what is demonstrated and what is not.

4. **What is the difference between `llms.txt`, `robots.txt`, and a sitemap?**  
   Navigation/context versus access policy versus crawl inventory.

5. **Do I need `llms-full.txt`?**  
   Only when a repeated or cross-document task justifies the payload; do not make it the default.

6. **Should I publish Markdown versions of every page?**  
   Only if generated from the same source, complete, noncanonical, and useful to a named client/task; semantic HTML remains the fallback.

7. **How do I know whether an AI agent used it?**  
   Original request observation plus follow-on traces; a browser beacon, request, citation, and referral are different events.

8. **How often should I update it?**  
   Whenever canonical linked content changes; generation and validation should prevent drift. Update the article itself only for material evidence changes.

Keep each answer to one compact paragraph and link back to the relevant full section. If a question merely repeats a nearby heading, remove it.

#### 15. Dated source and change note

Keep the glossary, but preface it with:

- evidence checked date;
- proposal version/commit where relevant;
- last material update;
- what changed in the verdict.

This fast-moving topic is evergreen only if the stable model and volatile provider evidence are separated.

## Authenticity and first-person audit

The draft currently assigns several research actions and future decisions to “I.” Some were performed by agents during fan-out or exist only as proposed next steps. Prompt transparency does not make an unperformed first-person claim true.

Every line below needs either Goga's explicit ownership or an impersonal attribution such as “the audit,” “the research run,” or “the green-team reproduction.”

| Draft line | First-person claim | Risk | Required action before publication |
|---:|---|---|---|
| 17 | “no efficient path for a search engine or agent to discover the work” | Restates the old model as objective fact and collapses search-engine discovery with agent navigation | Frame it as what the March ADR believed; do not state the discredited premise as fact |
| 30 | “Six months later” | March to August is roughly five to six months depending on the exact March date; the article has exact dates available | Use exact dates or “by August” |
| 32 | “Then I read the code” | The code audit was performed collaboratively | Confirm Goga personally inspected it or use “Then the audit reached the code” |
| 83 | “I reconstructed roughly seven days” | The Cloudflare query was run by the research agent using the repository session | Use “The audit reconstructed…” unless Goga reruns/owns the procedure |
| 134 | “when I looked beyond…” | Literature/client sweep was fan-out research | Attribute to the research pass unless Goga personally performed it |
| 150 | “I configured [mcpdoc]” | The reproduction was performed during green-team fan-out | This is the clearest manufactured first-person risk. Say “The green-team reproduction configured…” or have Goga reproduce it himself |
| 164 | “I compared… with the tokenizer” | Measurement appears to come from the research agent | Attribute to the audit or have Goga rerun and record it |
| 179 | “I found no mainstream client” | Universal-sounding search claim from a bounded client audit | Say “The client audit found none in the reviewed set” and name the check date |
| 179 | “I still plan to add them…” | This is a product decision proposed by agents, not golden input from Goga | Ask Goga to approve before first-person publication |
| 183 | “The green-team forced…” | Exposes process, which is allowed, but uses an editorial mechanism as narrative agency | Prefer the concrete realization unless the collaboration itself is intentionally part of the story |
| 214 | “the kind of engineering writing I want to publish anyway” | Plausible from project philosophy but still authored inner intent | Keep only if Goga recognizes the sentence as his |
| 218 | “If I started again, I would not delete…” | Retrospective decision inferred from synthesis | Obtain explicit approval |
| 253 | “I registered it before seeing results” | The benchmark artifact says design in progress, not frozen, and Goga review is still required | Correct to “The research drafted a preregistration; it is not frozen or run” until status changes |
| 264 | “I will measure…” | Future commitment not supplied in golden prompts | Confirm scope and willingness to run it |
| 277 | “I will use Cloudflare… for 30 clean days” | Agent-proposed operating plan | Confirm before committing publicly; a 30-day promise can become performative infrastructure work |
| 287 | “I am keeping it” | Final product decision inferred by green-team | Strong ending only if Goga owns the decision |

First-person should carry Goga's beliefs, decisions, discomfort, and work he actually performed or explicitly adopts. Impersonal language can carry agent-assisted source discovery, log queries, token calculations, and literature review without weakening the article.

## Voice and over-structure audit

### The prose sounds competent but assembled

The draft contains:

- a six-stage table;
- a seven-client classifier table;
- a representation table;
- a seven-artifact decision table;
- four action-list subsections;
- a four-condition experiment;
- a 18-row glossary;
- four pull-quote-style aphorisms or slogan endings.

Each element is defensible alone. Together they make the article read like the research folder compressed into a publishable template. The reader feels the editorial machinery.

### Consolidation rule

Keep at most these tables in the narrative:

1. the early “should you ship it?” decision table;
2. the stage/evidence model;
3. the HTML/Markdown measured comparison;
4. one final artifact decision-and-falsifier table.

Move the crawler-purpose matrix and exhaustive source ledger to the glossary/reference tail. Collapse `Keep / Test / Probation / Do not build` into the final decision table.

### Aphorism audit

Keep:

- `I was asking a browser page-view system to answer a server retrieval question.`
- `The first thing it measured was my attempt to measure it.` as ordinary prose.

Reconsider or return to prose:

- `The small index chooses the page. Markdown reduces the representation. The task decides whether either saving matters.`
- `Preserve what remains automatic. Benchmark what claims to improve a task...`
- `Bring evidence, not allegiance.` if the section underneath already makes the invitation specific.

Too many quotable formulations make honest thinking feel engineered for sharing. One load-bearing sentence is stronger than four.

### Repetition audit

“Job” is doing too much work in the H1, orientation, artifact explanations, decision table, action sections, experiment, and ending. It begins as the governing metaphor and ends as a verbal template. Keep it in the title, central decision, and final line; use “role,” “task,” “client,” “purpose,” and direct verbs elsewhere.

### Narrative protection

Do not flatten these passages into bullets:

- the March hope and “The blog is invisible” ADR;
- the moment the metric definition changes meaning;
- the researcher-contaminated edge window;
- the tension between still wanting readers and refusing a fake traffic promise.

Those sections need prose because they carry the article's human movement.

## Recommended ending

The current ending is close. It should do three jobs in order:

1. Give a concrete current decision for this site.
2. State what evidence changes it.
3. Invite a reproducible contribution, not agreement or distribution.

### Ending shape

- For gkoreli.com: semantic HTML remains primary; small generated index and page Markdown stay if Goga confirms; full dump remains conditional; “AI Reads” must be renamed or explained.
- For the reader: invest according to the client and task, not because the file exists.
- For future evidence: name the exact trace or controlled result that earns a larger role.

### Sample ending direction

This is a shape sample, not approved first-person prose:

> For this blog, the decision is deliberately small: keep the generated index and page Markdown, stop calling browser beacons “AI Reads,” and make the full dump earn its payload in a real task. None of that creates the reason a reader or agent arrives. The articles, links, search eligibility, and people who recommend the work still do that.
>
> If you maintain a client that discovers or follows `llms.txt`, the useful counterexample is a trace: client and version, initial URL, requested paths, and task result. If that evidence changes the map, benchmark, or provider table, it changes this article. That is how the file earns a larger role.

The sentence `I still want readers` should remain near this ending. It is the emotional truth that prevents the practical guide from pretending traffic does not matter.

## Evergreen maintenance and traffic plan

### Stable body

Keep these concepts independent of the current provider landscape:

- each artifact needs a named client and task;
- discovery, selection, navigation, use, citation, and referral need separate measurements;
- canonical human-readable HTML remains the universal fallback;
- machine alternatives should share a canonical source and cost ceiling;
- task value must be benchmarked after the entry point is supplied.

### Dated reference layer

Keep these facts visibly dated and easy to update:

- provider support or explicit non-support;
- client/skill examples and pinned commits;
- proposal version and link relations;
- file sizes and token counts;
- request observations;
- benchmark status and results.

### Internal continuity

- Link naturally to `/stats` when discussing the public metric.
- Link to the original agentic-engineering article only where it establishes the blog's broader position.
- When the planned Cloudflare analytics article exists, add one contextual cross-link in each direction.
- Do not create a series until at least two deliberate posts form a reading sequence.

### Post-publication measurement

Use Search Console page-filtered query data after recrawl and a stable observation window. Bucket queries into:

- `llms.txt` definition/setup intent;
- effectiveness/evidence intent;
- GEO/AI-search intent;
- crawler/analytics intent;
- bad-fit or provider-doc intent.

If impressions appear at positions 3–8 with no clicks, inspect title/snippet fit before rewriting the article. If setup/example queries dominate but readers leave early, improve the practical front layer. If broad GEO queries dominate and do not fit, narrow the metadata rather than expanding into a generic GEO encyclopedia.

Do not promise “substantial traffic.” The article can become a durable, relevant doorway, but a new domain still needs age, internal links, external references, and distribution. The review can improve intent fit; it cannot manufacture demand or authority.

## Revision priority

### Must change before publication

1. Add the direct answer in the first 100 words.
2. Decide and state the primary intent: `llms.txt` practical guide, with GEO as supporting evidence.
3. Add a minimal real-file example, artifact definitions, implementation steps, and a small runnable test.
4. Reconcile the H1/`seoTitle` with that promise.
5. Correct or confirm every first-person research and future-decision claim.
6. Correct the benchmark status; it is not yet frozen/preregistered according to the research artifact.
7. Consolidate duplicated tables/lists and reduce slogan density.

### Should change for evergreen strength

1. Add the substantive FAQ without FAQ schema.
2. Separate stable reasoning from a visibly dated provider/client appendix.
3. Bring the client use cases and Markdown measurement earlier.
4. Add explicit definitions for `llms.txt`, page Markdown, `llms-full.txt`, `robots.txt`, and sitemap.
5. Make the test promise reproducible or remove “how to test” from metadata.

### Keep even if it does not target a keyword

1. `I built llms.txt for a blog nobody read.`
2. The code-level analytics failure.
3. The contaminated edge snapshot.
4. Google Search ignoring the file while a maintained Google skill uses it.
5. The real desire for readers.

## Final recommendation

Do not publish the current draft as-is if its job is to become a substantial evergreen doorway. It is too inward-facing at the top and too reference-heavy in the middle, while omitting the setup and decision material a searcher expects.

Do not discard it either. The draft contains the hard part competitors cannot manufacture: a real system, a real measurement mistake, real client reproductions, and a decision that changed under evidence.

Reshape it into a practical `llms.txt` guide whose proof is the field investigation:

> answer first, show the smallest implementation, let the audit earn the nuance, and end with a decision that can change.

That is the version most likely to attract the right readers without making Goga feel like he became a content farmer. The search handles face outward. The substance still comes from his own build, doubt, and willingness to correct the model.

## Sources used for this review

- [`019-does-llms-txt-work.md`](../../../posts/019-does-llms-txt-work.md) — publication candidate; this review covered its earlier first iteration.
- [`00-research-scratchpad.md`](./00-research-scratchpad.md) — living center, evidence boundaries, authenticity contract, and original article form.
- [`04-thesis-red-team.md`](./04-thesis-red-team.md) — claims the draft must not expand beyond.
- [`08-green-team-synthesis.md`](./08-green-team-synthesis.md) — adaptive investment model and current artifact decisions.
- [`08a-green-team-client-evidence.md`](./08a-green-team-client-evidence.md) — client reproductions, pinned implementations, and Markdown representation measurement.
- [`08b-green-team-product-opportunities.md`](./08b-green-team-product-opportunities.md) — thresholds, implementation costs, and product-risk boundaries.
- [`08c-green-team-editorial-opportunity.md`](./08c-green-team-editorial-opportunity.md) — constructive thesis, section movement, collaboration model, and update triggers.
- [Traffix developer guide](https://traffix.dev/guides/llms-txt), [DerivateX complete guide](https://derivatex.agency/blog/llms-txt-guide/), and [MarqOps source-backed GEO guide](https://www.marqops.com/guides/generative-engine-optimization) — 2026-08-25 competitor-shape spot-check only; not used as primary technical evidence.

---
name: article-discovery-positioning
description: Reverse-engineer honest external doorways from an already-shaped article: publication role, reader and search intent, H1/seoTitle/description/standfirst, headings, keywords, internal cross-references, link-worthy assets, and distribution. Use when titling, positioning, preparing, or repairing discovery for a gkoreli.com article. Never choose or flatten the living center.
license: MIT
metadata:
  author: gkoreli
  version: "1.0.0"
  evidence-audited: "2026-08-26"
---

# Article Discovery Positioning

Translate the article that exists into truthful ways outsiders can recognize, find, choose, link, and share it.

This skill optimizes the invitation, not the body. It cannot guarantee impressions, rankings, clicks, backlinks, readers, or contact.

## Authority and Order

Run this skill only after the article's substance and form are stable enough to protect.

1. `shape-article` chooses the living center and governing form.
2. The governing skill protects voice and structure: `personal-essays`, `blog-writing`, or `oss-radar`.
3. `article-discovery-positioning` translates the shaped article into external doorways and a meaningful link graph.
4. `shareable-engineering` applies its evidence-based title mechanics, trust checks, and share triggers where relevant.
5. `polish-prose` runs last.

Conflict rules:

- `shape-article` wins on living center, movement, and ending.
- `personal-essays` wins on voice, aliveness, exposed prose, and whether search intervention is appropriate.
- `blog-writing` wins on sourcing, post structure, prompts, and evidence ledgers.
- `oss-radar` wins on research synthesis and product/adoption verdicts.
- `AGENTS.md` wins on metadata mechanics, series trails, links, dates, canonical behavior, and project decisions.
- This skill owns article role, content-to-intent translation, doorway packages, heading/keyword placement, internal relationship links, link-worthy assets, and the discovery learning loop.

Never rewrite a body around a keyword discovered after shaping. If the apparent doorway needs a different article, reject it and create a separate article candidate.

## Why This Exists

The publication has more than one legitimate job.

- Some articles help cold readers solve a problem and grow from the author's work.
- Some make Goga's thinking, voice, identity, projects, bets, or vision legible.
- Some let a concrete problem carry a reader into the person and body of work.

Broad reach is not a quality ranking. Narrow thinking is not a discoverability failure. The portfolio needs useful entry points and recognizable identity at the same time, without assigning a quota to either.

## Required Input: Article Passport

Do not start from a topic brief. Require this shaped input:

```text
Article / working URL:
Governing form:
Living center:
Why this article exists now:
Portfolio role candidate:
Protected title/prose/material:
Concrete entities and artifacts:
Owned failure, decision, question, or result:
Mechanisms and procedures actually explained:
Reader decisions the body can support:
Evidence inventory:
Claim boundaries and prohibited promises:
Series / predecessor / continuation relationships:
Observed query, referral, reply, correction, citation, or subscription evidence:
Unknowns:
```

If the living center or claim boundary is missing, return to `shape-article`. Discovery work cannot repair an unshaped article.

## Classify the Publication Role

Role is a description of the already-shaped article's publication job. It is not a quota, content calendar, or value ranking.

### Reader-growth article

A cold reader can recognize a problem, mechanism, decision, artifact, or result that matters beyond the existing audience.

Use an externally legible H1 when:

- the concrete reader job is the living engineering work, not an imposed keyword shell;
- the article fulfills the promise without requiring prior knowledge of Goga;
- the public title does not erase the human stake that gives the author standing.

### Signature article

The article makes Goga's voice, thinking, identity, vision, or live state more legible. Its value is recognition, memory, and contact, even when the likely audience is narrow.

Default:

- preserve the voice-bearing H1;
- let the description orient a cold reader honestly;
- add `seoTitle` only when a real doorway can describe the same piece without changing its meaning;
- return **no search intervention** when concrete handles would corrupt the form.

### Bridge article

A concrete problem or artifact and Goga's judgment, live stake, or project vision are inseparable. It can use an external H1, a split H1/seoTitle, or a voice-bearing H1 with concrete description depending on which promise the body fulfills first.

### No role quotas

Do not prescribe a percentage of reader-growth, signature, or bridge articles. Diagnose portfolio health through reader contact and doorway fit, not counts.

## Content-to-Intent Method

### 0. Freeze editorial truth

Record:

- living center;
- protected material;
- evidence boundary;
- article role;
- claims the article refuses to make.

Any candidate doorway that violates these is rejected before scoring.

### 1. Build the content inventory

Extract only what the page contains:

- named tools, projects, platforms, people, protocols, and files;
- concrete problem and failure language;
- mechanisms, architecture, methods, and comparisons;
- code, data, dates, numbers, reproductions, diagrams, checklists, and decisions;
- reader outcomes the body can support;
- unusual evidence or original artifacts;
- related articles and series position.

Do not list aspirational keywords that the article does not earn.

### 2. Map reader situations and jobs

For each plausible cold reader, record:

```text
Reader state:
Language they may use:
What they are trying to know or do:
What result type they expect:
Exact passage that fulfills the job:
What the article cannot provide:
Confidence and evidence source:
```

Useful states include:

- problem-aware: “why is my JavaScript analytics missing bots?”
- solution-aware: “server-side vs client-side analytics”
- implementation-aware: “Cloudflare Workers D1 analytics”
- decision-aware: “privacy-first analytics for a personal blog”
- evidence-seeking: “does llms.txt work?”
- identity/recognition: a phrase, feeling, project, or person the reader already knows.

Do not force a funnel. One query can carry several intents; one article rarely serves all of them.

### 3. Collect language with an evidence ladder

Rank phrase evidence:

1. page-filtered Search Console queries, clicks, positions, and snippets;
2. attributable referrers, reader replies, corrections, subscriptions, citations, and links;
3. exact terminology from primary documentation, repositories, APIs, error messages, and standards;
4. language used by credible practitioners and communities doing the work;
5. current search results, related searches, and suggestions, treated as volatile discovery evidence;
6. agent brainstorming, explicitly labeled hypothesis.

Never invent search volume or competition. Search-result presence is not demand. Keyword tools cannot overrule promise fit.

### 4. Choose one primary doorway

The primary doorway is the largest honest overlap among:

- the article's content;
- the living center;
- a reader job;
- the publication role;
- language supported by evidence.

Keep 2–5 secondary phrases that denote real subtopics already present. They guide semantic coverage, headings, and description. They are not repetition quotas.

Record excluded intent. Examples:

- “Google Analytics alternative” rejected when no vendor comparison exists;
- “anonymous analytics” rejected when the design is pseudonymous;
- “AI reads” rejected when the system observes a request;
- “tutorial” rejected when the article does not let a reader complete the implementation.

### 5. Generate coherent doorway packages

Generate three complete candidates. Do not cherry-pick optimized fragments into a package whose surfaces promise different articles.

Each package contains:

```text
Candidate name:
Portfolio role:
Primary reader job:
Primary doorway:
Secondary phrases:
H1 / og:title:
seoTitle / <title>:
alternativeHeadline:
Description:
Standfirst / orientation sentence:
Slug:
Heading changes:
Tags:
Internal links:
Link-worthy assets:
Distribution hook:
Explicit non-promises:
```

Apply the title mechanics in `shareable-engineering` after the package's meaning is fixed.

### 6. Run the promise ledger

For every meaningful noun, verb, number, comparison, and outcome in the package:

```text
Surface claim | Exact content evidence | Evidence state | Cold-reader expectation | Pass / narrow / reject
```

Hard questions:

- Would a cold reader expect setup steps that do not exist?
- Does “how to” promise completion or only experience?
- Does the title add identity, causality, privacy, performance, or outcome the body cannot prove?
- Would the article still make sense if the target phrase were removed?
- Does the title sound compatible beside the strongest passage?
- Are H1, seoTitle, description, and orientation describing the same article?

## Metadata Strategy by Role

| Surface | Reader-growth | Signature | Bridge |
|---|---|---|---|
| H1 / og:title | Usually concrete and externally legible; first person can preserve standing | Preserve the voice-bearing or literary title | Choose the concrete or voice-bearing side that carries the living center |
| seoTitle | Front-load tool/problem handles; semantically match H1 | Optional; use only for the same article | Often carries concrete entities when H1 carries the contradiction |
| Description | Reader problem + owned mechanism/result + boundary | Honest orientation, never manufactured practical benefit | Name both concrete artifact and human stake |
| Standfirst | Self-contained external anchor | Minimal grounding without explaining away the title | Name the artifact and live tension |
| Slug | Stable concrete handles | Stable title phrase; do not over-optimize | Prefer the durable concrete handle |
| Headings | Reader jobs and mechanisms already in the body | Follow emotional/thought movement | Mix reader navigation with voice where natural |

The metadata split is a tool, not a requirement. Return a no-op when the current doorway already tells the truth.

## Headings and Keywords

Keywords are nouns and relationships the article already earns.

- Put the primary subject in the H1, seoTitle, description, standfirst, or first meaningful heading according to role; do not require every surface.
- Use exact tool, API, protocol, error, architecture, and mechanism names where the body discusses them.
- Rename vague headings when a reader cannot predict the section's job, provided the heading's voice is not protected.
- Preserve literary or pressure-bearing headings in signature/exposed work.
- Use synonyms only when they are natural language for the same concept.
- Never repeat a phrase to satisfy density.
- Never add a section solely to place a phrase.
- Never make an H1 broad by deleting the boundary that makes the evidence honest.

## Internal Cross-References

Every internal link needs a named relationship.

| Relationship | Reader job |
|---|---|
| Predecessor | Understand the original state, failure, or belief |
| Continuation | See what changed after the earlier open loop |
| Correction | Understand why a prior claim changed |
| Deeper mechanism | Move from verdict to implementation |
| Boundary companion | See the adjacent question intentionally excluded here |
| Product/project context | Understand the owned system behind the claim |
| Series | Follow a deliberate reading order |
| Section hub | Discover a coherent body of work |

Rules:

- Put the link at the moment the relationship helps; do not make a generic related-post block.
- Backward links orient. Forward links preserve publication memory.
- On every continuation, inspect the predecessor for an earned forward link.
- Use root-relative canonical slugs internally.
- Anchor text should name the destination's job, not say “click here” or stuff variants.
- Do not add links merely because two posts share a tag.

## External Sources and Link-Worthy Assets

External links serve attribution, claim evidence, reproduction, comparison, or deeper implementation. Prefer the original source and place it beside the claim.

An article may already contain an asset another writer or maintainer would rationally cite:

- original measurements with method and limits;
- source-backed comparison or decision table;
- reproduction protocol;
- code-backed architecture diagram;
- migration or debugging procedure;
- named taxonomy or definition;
- public dataset, manifest, or evidence ledger;
- reusable checklist with a demonstrated case.

Extract and stabilize the asset only when it already serves the article. Do not manufacture a thin statistics page or generic infographic for links.

Backlinks are earned editorial choices by another publisher. This skill can improve linkability and distribute an asset; it cannot create or guarantee backlinks.

Prohibited:

- buying links or ranking credit;
- excessive exchanges or private link rings;
- low-value guest posts for anchors;
- mass outreach;
- duplicate companion pages targeting query variants;
- “resource” pages built only to cross-link.

## Keep Four Outcomes Separate

1. **Doorway optimization:** H1, seoTitle, description, standfirst, headings, tags, slug, and internal anchors. It changes representation, not distribution.
2. **Distribution:** X, LinkedIn, HN, Reddit, dev.to, RSS, newsletter, or direct outreach. It puts the article before a chosen group.
3. **Link earning:** another publisher voluntarily cites or links the article or asset.
4. **Reader contact:** replies, corrections, subscriptions, citations, reports of use, and sustained relationships.

Do not call impressions readers, a share a backlink, a backlink an endorsement, or a crawler request contact.

## Candidate Scoring and Hard Vetoes

Reject before scoring if any candidate:

- changes or flattens the living center;
- promises content, comparison, tutorial completion, evidence, or outcome the body lacks;
- manufactures broadness by removing a necessary boundary;
- turns an exposed/signature piece into advice it does not give;
- uses keyword stuffing, boilerplate, or query-targeted doorway-page tactics;
- conflates eligibility, request, delivery, use, citation, referral, and outcome;
- requires a duplicate article body for a query variant;
- makes ranking, traffic, link, or reader guarantees.

Then score 0–4:

| Dimension | Weight |
|---|---:|
| Promise-to-content fit | 25 |
| Living-center and voice survival | 20 |
| External reader-job legibility | 15 |
| Semantic coherence across surfaces | 15 |
| Specificity and differentiation | 10 |
| Evidence strength for chosen language | 10 |
| Series/link-graph usefulness | 5 |

A high score never overrides a hard veto. Keep the current package if no candidate materially improves honest legibility.

## Output Contract

Return one positioning brief:

```text
Article passport:
Portfolio role and rationale:
Primary doorway:
Secondary phrases:
Excluded intent:
Chosen doorway package:
Promise ledger:
Heading/keyword map:
Internal relationship links:
External source/link plan:
Link-worthy assets:
Distribution hypotheses:
Unknowns and confidence:
Post-publish observation window:
No-op / change decision:
```

Every recommendation must say which stage it could influence and what evidence would falsify it.

## Worked Micro-Examples

### Reader-growth: analytics rebuild

- H1: `How I Built First-Party Analytics for a Personal Blog`
- seoTitle: `Blog Analytics with Cloudflare Workers and D1`
- Primary job: design a custom first-party blog analytics system and avoid client/edge event mismatch.
- Preserved center: a correct browser-beacon counter supported the wrong public claim.
- Rejected: `Best Privacy-Friendly Google Analytics Alternative`—the article compares no vendors and stores pseudonymous IDs.

### Signature: Life as Background Music

- Preserve the literary H1.
- Use the description to orient around liking, wanting, and feeling while keeping life safely in the background.
- Reject `How to Stop Emotional Avoidance`—the essay does not offer a method and the title would convert recognition into advice.

### Bridge: My Evals Say It Works. I Still Don't Reach for It.

- Preserve the contradiction in H1.
- Let seoTitle name ghx, the eval, and the broken adoption habit.
- The concrete evidence and founder's live failure are inseparable; neither a generic eval report nor a pure confession tells the truth.

## Post-Publish Learning Loop

Define the window before reacting.

Capture separately:

- page-filtered queries, impressions, positions, snippets, and clicks;
- attributable referrals and distribution events;
- voluntary links and their anchor/context;
- replies, corrections, subscriptions, citations, and reports of use;
- source or provider changes;
- contamination and author activity.

Classify the next action:

- content correction;
- discoverability change;
- distribution change;
- new experiment;
- no action.

Do not churn metadata from daily noise. Search recrawl and learning take time. Update `lastModified` only for a material served-page change under `AGENTS.md`.

## Sources and Evidence Boundary

Normative project sources:

- `shape-article`
- `personal-essays`
- `blog-writing`
- `shareable-engineering`
- `AGENTS.md` metadata split, series, linking, and editorial learning loop

Primary external anchors:

- [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link)
- [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Google crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

Research artifacts:

- `FLDR-0005`
- `TASK-0070` — adversarial preflight
- `TASK-0071` — skill boundary and ownership
- `TASK-0072` — five catalog cases
- `TASK-0073` — meaningful linking and ethical link earning
- `TASK-0074` — reader-growth/signature/bridge portfolio model
- `TASK-0075` — content-first intent and doorway method

The evidence supports accurate, legible doorways and ethical linking. It does not establish a universal title formula, keyword count, internal-link number, portfolio ratio, ranking gain, traffic gain, or backlink guarantee.

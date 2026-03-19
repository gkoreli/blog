---
name: oss-radar
description: OSS Radar newsletter writing guidelines for gkoreli.com. Use when writing, editing, or researching an OSS Radar issue. Covers the series format, research process, distillation methodology, per-project structure, cluster grouping, opinionated writing rules, sourcing, and quality standards.
license: MIT
metadata:
  author: gkoreli
  version: "1.0.0"
---

# OSS Radar — Agent Skill

Guidelines for writing OSS Radar issues on gkoreli.com — a series where a source (cohort, list, announcement) gets read, explored, distilled, and turned into something worth your time.

## What OSS Radar Is

**One source per issue.** Read it. Extract the signal. Share the thinking. Not a summary — a distillation with an opinion behind every sentence.

The series exists because a lot of good signal gets processed privately and never goes anywhere. OSS Radar changes that: take a cohort announcement, a curated list, a batch of releases, or a conference's sponsor list — and turn it into a document that tells you what matters, what's surprising, what's worth watching, and what's hype.

**What it is not:**
- A repost or summary of the original source
- A roundup with no opinion ("here are 10 tools you might find useful")
- An advertisement for the projects covered
- An exhaustive catalog — depth over breadth

## Series Format

### Frontmatter

```markdown
---
title: "OSS Radar #NN: [Source Title]"
date: YYYY-MM-DD
description: "One sentence that earns the read — name the source and the angle"
tags: [oss-radar, open-source, {relevant-ecosystem-tags}]
series: oss-radar
---
```

The `series: oss-radar` field is required — it ties issues together in the series index.

### File Naming

`NNN-oss-radar-NN-{source-slug}.md`

- `002-oss-radar-01-vercel-winter-2026-cohort.md`
- `005-oss-radar-02-hn-show-best-of-2025.md`

The outer `NNN` is the blog post sequence number. The inner `#NN` is the OSS Radar issue number. Both increment independently.

### Opening Section

Start with a brief paragraph introducing the OSS Radar format itself (only on #01 — skip on later issues), then immediately name the source:

```markdown
## The Source

[Source Name](url) — by Author, published Date.

[2–3 sentences of context: what is this source, why does it exist, what does it select for, what does being included mean. End with the count/scope and a one-line setup for the issue.]
```

Keep "The Source" tight — one paragraph. The reader came for the analysis, not for you explaining the source's own documentation.

---

## Research Process

OSS Radar issues are research-first. Writing comes after exploration. The process:

### Step 1 — Read the source completely

Fetch the original URL. Get all projects, all creators, all GitHub links. Do not start writing until you have the full list. Partial lists produce misleading patterns.

### Step 2 — Explore each project's GitHub

For every project: read the README, scan the top-level source structure, check language split (tells you about implementation seriousness), look at release count and cadence, scan open issues and PRs, note the license.

**What to look for:**
- Technical decisions that aren't obvious from the landing page
- Unusual architecture choices (why Rust? why WASM? why AGPL?)
- Fork-to-star ratio — high ratio (≥0.5) signals real downstream use
- Commit velocity and recency — active vs. maintenance mode
- Surprise features: things the README buries that are actually the point
- Dependencies that create operational burden (TimescaleDB, Proxmox, etc.)

### Step 3 — Find cross-references

For every project worth covering in depth: find at least one piece of external evidence from an independent source. This can be:

- A peer-reviewed paper (arXiv, Nature, ACM)
- An HN thread about the project or the problem it solves
- A blog post from a recognized engineer in the space
- An official announcement from a major company validating the approach
- A competing project's postmortem that explains why the approach matters

The standard: would this reference change how a skeptic views the project? If yes, include it.

### Step 4 — Find the patterns

Before writing any individual project section, identify the clusters — groups of projects attacking the same theme or operating in the same market. Clusters reveal what the source is saying about the current ecosystem.

Typical cluster types:
- Technology clusters (animation, AI-native, database tooling)
- Narrative clusters (infrastructure escape, shadcn-pattern spread, AI second life for old projects)
- Signal clusters (established giants validating the program, early-stage bets with momentum)

Patterns go in the `## What I Notice` section, not in individual project sections.

---

## Per-Project Structure

Each project gets a section. The depth depends on how interesting the project is. Not everything needs equal treatment.

### Minimum viable project section

```markdown
### [Project Name](homepage) — Creator Name

One sentence description of what it does. Specific metrics if available (stars, downloads, release count). GitHub: [org/repo](link)

- **Solves:** [the specific problem, not a generic pain]
- **For:** [who actually uses this]
- **Why practical:** [why this solves the problem better than the obvious alternative]

One paragraph of actual analysis — not a summary, the thing you noticed that's non-obvious.
```

### Full project section (for the 5–8 most interesting projects)

```markdown
### [Project Name](homepage) — Creator Name

One sentence + metrics. GitHub: [org/repo](link)

- **Solves:** [specific problem]
- **For:** [audience]
- **Why care:** [what changes if this succeeds — agentic angle, market shift, ecosystem consequence]
- **Why now:** [what made this possible or necessary right now]
- **Our take:** [opinionated sentence that says what you actually think]
- **Controversial question:** [one question that a skeptic would ask — genuinely hard to answer, not rhetorical]

First paragraph: context that makes the project make sense.

**[Bold heading for the technical deep-dive]:** The architecture, the trade-offs, the technical decisions worth knowing. Numbers, language splits, specific features. Make this the thing the reader couldn't get from the README alone.

- **Cross-reference:** [linked evidence from an independent source — paper, HN thread, engineer blog, company announcement]
- **From the source:** [specific thing discovered by reading the repo — not the README, the code]
```

### When to collapse projects into a cluster table

If 4+ projects share the same market and the differentiation between them is primarily aesthetic or compositional, use a table instead of individual sections:

```markdown
| Project | Creator | Stars | GitHub | What makes it distinct |
|---|---|---|---|---|
| [Name](url) | Author | NNN | [org/repo](link) | One-line differentiator |
```

Follow the table with:
1. Which projects are the standouts and why (1–2 sentences each)
2. Your honest take on the cluster overall — is it saturated? is it a real market?
3. One controversial question for the cluster as a whole

---

## The Bullets

Four special bullet types appear in full project sections. Use them consistently:

### `- **Why care:**`
What changes if this project succeeds at scale? Not why the project is interesting — why the world is different if it wins. Often about an ecosystem shift, a market consequence, or an agentic infrastructure angle.

### `- **Our take:**`
One sentence of actual opinion. Not hedged. Not "it depends." Say what you think. If you're skeptical, say so and say why. If you're excited, say what specifically excites you and why other people should be too. This is the sentence that makes the newsletter worth reading.

### `- **Controversial question:**`
The hardest question a smart skeptic would ask about this project. Not rhetorical. It should be genuinely unanswered — something the project hasn't proven yet, or a market dynamic that could invalidate the whole premise. The question should make the reader uncomfortable in a productive way.

Good: "Is self-hosted OTA actually safer than a vendor-managed solution — or does it just move the operational risk from Microsoft to your own team?"

Bad: "Will this project succeed?" (too vague, no tension)

### `- **Cross-reference:**`
External validation with an inline link. The format: `[linked text describing the source](url) — one sentence on why it matters here.`

Always link inline — never just name the source without linking it. If you don't have a confident URL, describe the source precisely enough that the reader can find it, but flag that the link is approximate.

### `- **From the source:**`
Something discovered by reading the repo — not the README, the actual code structure, CI config, issue tracker, or commit history. The standard: would the project's author be surprised to see this noticed?

---

## What I Notice Section

`## What I Notice` is where the patterns live. This is the most important section — it's where the issue becomes more than a list of project descriptions.

**Structure:** 5–7 named patterns, each separated by a `---` divider. Each pattern:

1. **Bold lead-in** — the claim in one line
2. **1–2 short paragraphs** — evidence, specifics, numbers. 3–4 sentences max per paragraph.
3. **Bullet list when enumerating** — if there are 3+ examples, use bullets. Don't embed them in a paragraph.

Use numbers when you have them. "Nine animation libraries in a single cohort" is better than "many." "33.8M weekly downloads" is better than "very popular." Numbers make claims checkable.

**Formatting rule:** `What I Notice` should match the density and rhythm of `The Distillation`. If the Distillation has short paragraphs and dividers, so does this section. They're the two most important sections — they should feel like the same voice at the same altitude.

**The test:** could this section stand alone, without the project sections, as something worth reading? If yes, it's working.

---

## What I'd Explore Further Section

`## What I'd Explore Further` is a short list (4–6 items) of things that warranted deeper investigation but the issue didn't have room for, or that need time to resolve (watching a GitHub repo's commit velocity, waiting for a benchmark to be published, etc.).

This is honest about what the issue didn't do. It also tells the reader where to focus their own attention.

---

## The Distillation Section

`## The Distillation` closes the issue. This is the most opinionated section — bold claims, text-based verdict labels, short paragraphs. Not a summary of what came before. A set of stakes.

### Structure

Use named verdict sections with backtick labels:

```markdown
### `PROGNOSIS: TERMINAL` — [what's dying and why]
### `PROGNOSIS: PLATEAU` — [what's useful but won't compound]
### `PROGNOSIS: COMPOUNDING` — [the ones worth watching]
### `BOLD BET` — [one claim you're willing to be wrong on]
### `META PATTERN` — [the signal you'll carry into future issues]
### `[YEAR] THESIS` — [what this cohort says about the broader ecosystem]
```

Not all labels are required every issue. Use the ones that fit. Add new ones when the situation calls for it.

### Rules

- **Short paragraphs.** 3–4 sentences max per block. If you're writing more, break it up.
- **Bold the claim first, explain second.** Lead with the assertion, then the rationale.
- **Assign prognoses with stakes.** "Won't survive in current form" is a claim. Own it. "Some will do well" is not.
- **One blockquote per issue** — the `BOLD BET`. The one thing you're most willing to be wrong about. No hedging inside the blockquote.
- **Be specific about who dies.** Don't say "most animation libraries won't survive." Say which ones and why the others might.
- **The `META PATTERN`** is the insight that carries forward — the filter you'll apply to every future cohort. Make it reusable.
- **The `THESIS`** closes with the biggest macro claim the cohort supports. This is where you say something about 2026/2027 that a reasonable person might disagree with.

### What makes it work vs. fall flat

**Works:** Stakes are attached to specific projects. Claims could be proven wrong in 18 months. The reader feels the author has skin in the interpretation.

**Falls flat:** Hedged language, vague categories ("some will succeed"), no names attached to prognoses, summarizing what was already said in the project sections.

End with the `THESIS` section — the last line should land on a challenge or open question, not a tidy resolution.

---

## Sources Table

Every issue ends with `## Sources & Glossary` — a table of all claims backed by external evidence.

```markdown
## Sources & Glossary

| Project / Claim | Source | Date |
|---|---|---|
| [Claim text] | [Linked source name](url) | Mon YYYY |
```

Rules (same as blog-writing skill, with additions):
- Every external link used in the issue appears in this table
- Every specific number or statistic needs a source row
- Dates are required — OSS moves fast, staleness matters
- GitHub repos are valid sources for metrics (stars, forks, commit dates)

---

## Voice in OSS Radar

OSS Radar inherits the blog's voice rules with these additions:

**Be opinionated by default.** "This is interesting" is not analysis. "This is the most important project in the cohort for X reason" is. Make a call. Hedge only when the uncertainty is itself the point.

**Double down when skeptical.** If a project has weak fundamentals, say so directly. "The performance-first framing is right, but it's a claim that needs benchmarks to be believed" is more useful than "some people may question whether..." Don't soften the take into mush.

**Don't be generous to hype.** "Rapid adoption in the first week" is a launch metric, not a product metric. "Beautiful animations" is not a competitive moat. Call these out when you see them.

**Acknowledge the selection bias.** Every cohort selects for something. Vercel's program selects for projects that deploy on Vercel — Next.js-adjacent tooling is overrepresented. Acknowledge this explicitly in the Distillation section; it makes the analysis more trustworthy, not less.

**Use the star count but don't trust it alone.** Star count signals awareness, not usage. Fork-to-star ratio signals real use. Commit count signals investment. Weekly npm downloads signal production adoption. All are proxies. Cite all available signals, not just the flattering ones.

---

## Cluster Naming

Clusters should have evocative names that signal the narrative, not just the category:

- "The Animation Cluster" → "The Animation Bubble" if it's saturated
- "AI projects" → "The AI-Native Cluster" — distinguishes from "projects that use AI"
- "Infrastructure tools" → "The Infrastructure Escape Cluster" — names the narrative (escape from vendor lock-in)

The name tells the reader what to think before they read the cluster. Use it.

---

## Author's Tool Note

If you used a tool you built to research the issue — to pull star counts, explore repos, batch-read source files — add a brief research note after the "Next issue" line and before the Sources table:

```markdown
*Research note: GitHub exploration for this issue was done with [tool name](url) — one sentence on what it does. The star counts, repo structures, and [specific things] came from [specific commands]. Full writeup coming.*
```

Rules:
- **Only mention tools you actually used** for this specific issue's research
- **Keep it 2–3 sentences** — it's a note, not a feature
- **"Full writeup coming" is the right closer** if you plan a dedicated article — opens the loop without over-promising
- This is transparent about process, not promotional — the framing matters

---

## Anti-Patterns

- **Don't write equal-length sections for unequal projects.** If one project has 5x more to say than another, give it 5x the space.
- **Don't manufacture controversy.** The controversial question should be genuinely hard. If you can answer it in the same sentence, it's not controversial.
- **Don't write "this is exciting" without saying what specifically is exciting and why.** That's noise.
- **Don't list every project.** If a project has nothing non-obvious to say about it, put it in a cluster table or skip it entirely.
- **Don't skip the GitHub.** The README is the marketing. The code is the truth. The controversial question and the from-the-source bullet both require actually reading the repo.
- **Don't fabricate URLs.** If you don't have a confident URL for a cross-reference, describe the source precisely and note the link is approximate. Never invent HN item IDs, DOI numbers, or blog slugs.
- **Don't lose existing insights when enriching.** Enrichment iterations only add — they never remove or water down what's already been established.
- **Don't write a What I Notice section that just summarizes the per-project sections.** Patterns should be visible at the cohort level, not paraphrasable from individual entries.
- **Don't leave self-deprecating research notes in the article body.** "I initially got this wrong" belongs in the `Our take` bullet if at all — not as a standalone italic note that undermines confidence.
- **Don't over-polish.** The bar for shipping is: voice established, format clear, real insight present, bolder claims than a typical newsletter. After that, stop. Issues improve across the series, not within a single issue.
- **Don't write blob paragraphs in `What I Notice` or `The Distillation`.** Both sections follow the same short-paragraph + divider rhythm. If a paragraph exceeds 4 sentences and makes more than one distinct point, split it.

---

## Quality Checklist

Before publishing an OSS Radar issue:

- [ ] All projects from the source are accounted for (full count verified, not estimated)
- [ ] At least 5 projects have full sections with all four bullets (Why care, Our take, Controversial question, Cross-reference or From the source)
- [ ] At least one cluster section with a table
- [ ] `The Distillation` uses text-based verdict labels (`PROGNOSIS: TERMINAL`, `PROGNOSIS: PLATEAU`, `PROGNOSIS: COMPOUNDING`, `BOLD BET`, `META PATTERN`, `[YEAR] THESIS`) — no emoji color systems
- [ ] `The Distillation` has a blockquote `BOLD BET` — one claim the author is willing to be wrong about
- [ ] `What I Notice` uses short paragraphs + `---` dividers, matching the rhythm of The Distillation
- [ ] No self-deprecating research notes left in the article body (e.g., "I initially got this wrong")
- [ ] If a tool you built was used for research, an author's note appears after "Next issue" and before Sources
- [ ] `## What I Notice` has 4+ patterns with specific evidence from the cohort
- [ ] `## What I'd Explore Further` has 4+ items
- [ ] `## The Distillation` closes the issue with a personal take
- [ ] Sources table has every external link with a date
- [ ] Every cross-reference bullet has an inline link
- [ ] Every specific number has a source row
- [ ] No fabricated URLs — links are to real pages you've verified exist
- [ ] Selection bias of the source acknowledged somewhere
- [ ] The controversial question for each full project is genuinely hard — can't be answered in the same sentence
- [ ] The "Our take" bullets are opinionated — no hedging, no "it depends"
- [ ] Prompts file exists in `prompts/` with raw prompts

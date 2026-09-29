# Editorial Workflow and Skill Responsibilities

Read when planning an article or resolving which editorial skill governs a pass. Apply only the passes relevant to the chosen form; this is not an instruction to load every skill.

## Writing Process

Blog posts are AI-assisted with human substance. The workflow:

1. **Author provides golden data** — raw prompts with perspective, experience, specific problems, lessons learned
2. **Agent identifies the living center and form** — applies `shape-article` before structure or polish. For exposed essays, the agent is editor and gatekeeper and never drafts the prose. For other forms, it distills and structures with the governing skill.
3. **Iterative refinement** — author reviews, pushes back on prose, requests structural changes
4. **Fact-check pass** — verify every date, attribution, quote, external link, GitHub repo, and technical claim. Web search each source. Post 004 caught 7 errors in one pass: wrong dates, misattributed quotes, unverifiable projects, a flawed technical premise. This step is mandatory, not optional.
5. **AI-assisted collaborative posts ship with raw prompts** — readers can see the human thinking behind the AI output. **Exceptions:** exposed essays have no prompts because the author writes every word; OSS Radar issues have no prompts because they are research-driven analysis.

Prompt files preserve exact human prompts in chronological order when they materially shape the article, research scope, claim handling, metadata, provenance, or publication decision. Do not include later repository or skill-maintenance discussion that changes none of the published artifacts. This boundary keeps the prompt page a provenance record for the post instead of an unbounded project transcript.

### Writing Skill (`.agents/skills/blog-writing/SKILL.md`)

Covers voice, structure, formatting balance, sourcing rules, glossary format, and quality checklist. Key principles:

- **Formatting balance** — prose for narrative/arguments, bullets for enumerable points, blockquotes (with literal `"` quotes) for strong opinion statements. Anti-pattern: walls of prose when bullets would be clearer. Anti-pattern: everything as bullets losing narrative voice.
- **Sourcing rules** — freely accessible primary evidence matched to the claim: observations, pinned implementation, standards, documentation, or relevant research. A famous author or company is not a substitute for method or corroboration. Glossary uses table format with dates on every source.
- **What makes a great article** — states a problem clearly, introduces novel ideas, debunks myths, showcases best practices AND anti-patterns, highlights gotchas, shares personal growth, is transparent.
- **Engineering lesson completeness** — a failure is not yet a lesson. Show what existed before, what broke, how the current implementation works, why that repair won, which tradeoff remains, the bounded tenet, and the future vision. Present tense includes today's architecture and rationale, not only today's pain. The sequence need not become rigid headings.

For an **evidence-led engineering investigation**, read `.agents/skills/blog-writing/references/evidence-led-engineering-investigations.md`. Use this form when the article begins with a system the author built or used, then tests a disputed claim through code inspection, reproduction, first-party observation, primary documentation, and outside research. It is not the OSS Radar form: the article's center is the author's system, failure, or decision rather than an open-source product verdict.

### Shape Article Skill (`.agents/skills/shape-article/SKILL.md`)

The editorial router for every article. It identifies the living center and governing form before any structural rule runs: exposed essay, inquiry, field note, engineering argument, evidence-led engineering investigation, or OSS Radar research synthesis. It protects unresolved experience, contradictions, status-risking passages, self-interruptions, and meaningful repetition. It requires movement without demanding resolution and adds context for humans and agents without flattening the article into a summary.

Run skills in this order:

1. `shape-article` — choose the form and protect what is alive
2. Apply [earned-trust-writing](../../earned-trust-writing/SKILL.md) after shaping when the practical article calls for it, then the governing form skill — `personal-essays`, `blog-writing`, or `oss-radar`
3. `article-discovery-positioning` — after shaping, reverse-engineer honest reader/search doorways, metadata, headings, links, and distribution where applicable
4. `shareable-engineering` — engineering trust and evidence-based share mechanics where applicable
5. `polish-prose` — sentence-level pass last

### Personal Essays Skill (`.agents/skills/personal-essays/SKILL.md`)

The full creative-writing canon for growth in public. Open-wound writing protects live truth from retrospective laundering, but it is permission rather than a quota. Past lessons, present tension, and future intent may coexist; retrospectives, guides, project visions, decision records, and exposed essays are all valid when context earns them. In the exposed register the agent is editor and gatekeeper, **never ghostwriter**: no drafted prose and no prompt file. Where it conflicts with another skill on voice or aliveness, `personal-essays` wins.

### Article Discovery Positioning Skill (`.agents/skills/article-discovery-positioning/SKILL.md`)

Runs only after the living center and governing form are fixed. Classifies the article as reader-growth, signature, or bridge without quotas; inventories the content; maps honest reader/search jobs; produces coherent H1/seoTitle/description/standfirst/heading/keyword/link packages; separates doorway optimization from distribution, link earning, and reader contact; and may return a narrow or no-op recommendation. It never rewrites the body around a keyword or overrides voice.

### Shareable Engineering Skill (`.agents/skills/shareable-engineering/SKILL.md`)

Share/trust/discovery guidance for engineering posts: concrete titles, inspectable evidence, bounded agentic-search findings, and practitioner advice on sharing. Supplied-source GEO experiments do not establish organic discovery; `llms.txt` can serve a demonstrated known-site workflow without being a ranking lever. First-person ownership identifies a claimed basis for knowledge, not a proven trust effect. The skill distinguishes research from editorial judgment and records the scope of its reviews. Argument and decision pieces need a falsifiable position; inquiry and field notes keep the live question. It includes the hedging rule ("hedge the epistemics, never the position") and a 12-point pre-publish checklist. Runs at pre-publish; `personal-essays` wins all voice conflicts.

### Polish Prose Skill (`.agents/skills/polish-prose/SKILL.md`)

The final sentence-level pass for concise, direct, natural prose. It protects code, technical language, authorial voice, deliberate roughness, meaningful repetition, and unresolved thought. It never governs an article's structure or ending. In an exposed essay, it flags problems for the author instead of rewriting the prose.

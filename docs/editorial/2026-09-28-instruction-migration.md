# Instruction Migration — 2026-09-28

## Scope and source

The owner requested a 50–100-line `AGENTS.md`, preservation of the accumulated knowledge, and task-specific loading through skills, references, and ADRs. A follow-up explicitly removed the skill catalogue from the root: modern agents already discover `.agents/skills/`. This is repository bookkeeping, not an article revision, and belongs in no article prompt file or frozen research footprint.

The original file was 666 lines. It matched `AGENTS.md` at commit `ef82a4775458a23189677f25bcf2194df25095d5`, Git blob `8f7b8c880e2552fef21f6aa60e83eef84fa6ea1b`. Its SHA-256 is `25a1e33998fcf19aa6a1e048dbda95d01e345b7689d665e654aaa24f0d4d670e`.

Recover the exact source with:

```sh
git show ef82a4775458a23189677f25bcf2194df25095d5:AGENTS.md
```

The source ranges below cover every line exactly once, including grouping headings and blank lines. Most material moved intact apart from relative links and document headings. Corrections and consolidation are explicit below; a destination is a maintained owner, not a claim of byte identity for a whole rewritten document.

## Section destinations

| Original lines | Original subject | Maintained destination |
|---|---|---|
| 1–2 | AGENTS.md — Blog Project Context | [AGENTS.md](../../AGENTS.md) |
| 3–51 | Earned-Trust Writing (owner direction, 2026-09-19); Vision; Why We Write | [.agents/skills/shape-article/references/publication-context.md](../../.agents/skills/shape-article/references/publication-context.md) |
| 52–63 | Writing Process | [.agents/skills/shape-article/references/editorial-workflow.md](../../.agents/skills/shape-article/references/editorial-workflow.md) |
| 64–105 | Opening and Section Discipline (owner tenet, 2026-09-01); Open With a Result That Creates Questions (owner correction, 2026-09-22) | [.agents/skills/shape-article/references/opening-discipline.md](../../.agents/skills/shape-article/references/opening-discipline.md) |
| 106–111 | No Mannered Prose (owner rule, 2026-09-02) | [.agents/skills/polish-prose/SKILL.md](../../.agents/skills/polish-prose/SKILL.md) |
| 112–160 | Research Footprint Accounting | [.agents/skills/blog-writing/references/research-footprint.md](../../.agents/skills/blog-writing/references/research-footprint.md) |
| 161–172 | Firsthand Evidence and Credibility | [.agents/skills/blog-writing/references/firsthand-evidence-and-credibility.md](../../.agents/skills/blog-writing/references/firsthand-evidence-and-credibility.md) |
| 173–211 | Writing Skill (`.agents/skills/blog-writing/SKILL.md`); Shape Article Skill (`.agents/skills/shape-article/SKILL.md`); Personal Essays Skill (`.agents/skills/personal-essays/SKILL.md`) | [.agents/skills/shape-article/references/editorial-workflow.md](../../.agents/skills/shape-article/references/editorial-workflow.md) |
| 212–228 | Editorial Learning Loop | [.agents/skills/blog-writing/references/editorial-learning-loop.md](../../.agents/skills/blog-writing/references/editorial-learning-loop.md) |
| 229–254 | Content Strategy; Publication Roles: Reach and Identity | [.agents/skills/shape-article/references/publication-context.md](../../.agents/skills/shape-article/references/publication-context.md) |
| 255–298 | Content Format: Markdown + YAML Frontmatter + Web Components; Why I built @nisli/core; Why not MDX? | [.agents/skills/blog-maintenance/references/content-and-build.md](../../.agents/skills/blog-maintenance/references/content-and-build.md) |
| 299–300 | Best Practices (for agents working on this project) | [.agents/skills/blog-maintenance/SKILL.md](../../.agents/skills/blog-maintenance/SKILL.md) |
| 301–317 | How SSG Works | [.agents/skills/blog-maintenance/references/content-and-build.md](../../.agents/skills/blog-maintenance/references/content-and-build.md) |
| 318–329 | Rules | [.agents/skills/blog-maintenance/references/engineering-and-delivery.md](../../.agents/skills/blog-maintenance/references/engineering-and-delivery.md) |
| 330–347 | Operational evidence and session handoffs | [.agents/skills/blog-maintenance/references/operations-and-handoffs.md](../../.agents/skills/blog-maintenance/references/operations-and-handoffs.md) |
| 348–355 | Anti-Patterns | [.agents/skills/blog-maintenance/references/engineering-and-delivery.md](../../.agents/skills/blog-maintenance/references/engineering-and-delivery.md) |
| 356–383 | Discoverability Without SEO Sludge; The Core Principle; The Metadata Split | [.agents/skills/article-discovery-positioning/references/metadata-and-discovery.md](../../.agents/skills/article-discovery-positioning/references/metadata-and-discovery.md) |
| 384–393 | Quote the Owner Only Verbatim (owner tenet, 2026-09-03) | [.agents/skills/blog-writing/references/owner-quotations.md](../../.agents/skills/blog-writing/references/owner-quotations.md) |
| 394–458 | Titles Name the Subject (owner tenet, 2026-09-01); How to Apply `seoTitle`; The Orientation Sentence | [.agents/skills/article-discovery-positioning/references/metadata-and-discovery.md](../../.agents/skills/article-discovery-positioning/references/metadata-and-discovery.md) |
| 459–507 | Series Trails and Editorial Cross-References; Mechanisms; `series` metadata | [.agents/skills/article-discovery-positioning/references/series-and-cross-references.md](../../.agents/skills/article-discovery-positioning/references/series-and-cross-references.md) |
| 508–545 | Decisions Log | [docs/reference/project-decisions.md](../reference/project-decisions.md) |
| 546–591 | Design Philosophy; Layout; Typography | [.agents/skills/blog-maintenance/references/design-system.md](../../.agents/skills/blog-maintenance/references/design-system.md) |
| 592–628 | Build Pipeline; SEO & Discoverability (ADR-0006) | [.agents/skills/blog-maintenance/references/content-and-build.md](../../.agents/skills/blog-maintenance/references/content-and-build.md) |
| 629–637 | Anti-Patterns (Design) | [.agents/skills/blog-maintenance/references/design-system.md](../../.agents/skills/blog-maintenance/references/design-system.md) |
| 638–666 | Current State; Tech Stack; Newsletter State and Future Vision | [docs/handoffs/2026-09-28-instruction-state-snapshot.md](../handoffs/2026-09-28-instruction-state-snapshot.md) |

## Consolidation and corrections

- **No Mannered Prose, lines 106–111:** the complete owner paragraph already exists in `polish-prose`; retain that copy instead of creating a duplicate. Root and Best Practices grouping headings now serve a short root and a maintenance skill.
- **Earned trust and article roles:** preserve the September 19 direction, original context, and link to the complete founding prompt. The role reference explicitly marks the earlier literary-H1 permission as superseded by the September 1 subject-first rule. Practical teaching remains welcome; only interchangeable instruction detached from evidence and the author is rejected. The consolidated workflow includes the earned-trust pass after shaping so its older ordering list agrees with the September 19 direction.
- **Quotation preservation:** owner quotations in the migrated material keep their original text. Relocation does not certify that a historical excerpt is a complete original prompt. The exact-message rule has its own reference and triggers in relevant skills, including non-article maintenance.
- **License:** replace the decision register's blanket MIT claim with the existing dual-license contract in `LICENSE`. The dated state snapshot retains the old line with an explicit correction above it.
- **Current wording versus history:** the prompt label is verified in `packages/blog/src/pages/post.ts` and `pages/prompts.ts`; preserve the old slogan as history. Mark the CSS line count as early rationale, not a current measurement. Mark Browser-like as a superseded label. Preserve all analytics counts and classification history with links to their decision owners.
- **Stale state:** move the former Current State, Tech Stack, and newsletter/future sections to a clearly historical snapshot. “First post published,” the blanket MIT claim, the unresolved legacy `TASK-0477` identifier, and future series support must not be treated as current instructions. Existing newsletter and analytics receipts retain their dates and limits; no new live acceptance is claimed.
- **Search evidence:** retain the 5.9-position / 865-impression / zero-click case and query-diagnosis workflow. Remove the unsupported inference that position and clicks alone prove the cause. Treat it as a reason to investigate intent and presentation. This is a correction to the inference, not a new search measurement or external-source audit.
- **Agent navigation:** align the old “inert for AI search” shorthand with the existing `shareable-engineering` distinction: known-site use can be useful without establishing organic ranking or citation benefit.
- **Active callers:** update writing-skill references, the OSS deep-dive reference, `NORTH_STAR.md`, `README.md`, and the active publication-lane folder. Existing historical tasks, memories, handoffs, and research citations remain receipts of their time; this map resolves their former AGENTS headings without rewriting their history.

## Consistency audit requested during review

The owner also requested correction of wrong, misleading, or missing guidance. The audit checked the relocated working instructions against current source, not just whether their text survived. These repairs change documentation only; historical originals remain recoverable from the source commit above.

| Finding | Correction | Evidence checked |
|---|---|---|
| Example Markdown lacked required `section` and repeated the shell H1 | Add the enum field to both working examples; remove the repeated H1 and explain registration for illustrative custom elements | [frontmatter schema](../../packages/blog/src/lib/frontmatter.ts), [post template](../../packages/blog/src/pages/post.ts), [output validation](../../packages/blog/src/pipeline/build.ts) |
| Rich posts referred to the older `nisli-static` name | Identify `staticHtml` from `@nisli/core/static` and retain the historical relationship | [page shell import](../../packages/blog/src/templates/page.ts) |
| MDX was described as React/Preact-only and universally incompatible | Preserve the no-MDX project choice while correcting the runtime claim; mark the rejected alternatives as historical, not exhaustive | [official MDX integration guide](https://mdxjs.com/docs/getting-started/#jsx), checked 2026-09-28 |
| Markdown was said never to reach browsers, and embedded components were implied portable everywhere | Distinguish HTML rendering from Markdown representations and prose portability from registered interactivity | [negotiation](../../packages/blog/src/worker/negotiate.ts), [build](../../packages/blog/src/pipeline/build.ts) |
| Four-step build omitted style generation, policy check, and output validation; dev behavior and assets were oversimplified | Describe the actual production sequence, separate dev bundle context, copied static assets, and prompts/public watchers | [package scripts](../../packages/blog/package.json), [prod](../../packages/blog/src/pipeline/prod.ts), [dev](../../packages/blog/src/pipeline/dev.ts), [build-html](../../packages/blog/src/pipeline/build-html.ts), [paths](../../packages/blog/src/lib/paths.ts) |
| Generated SEO was described as every route from raw Markdown alone | Scope sitemap routes, include TypeScript-derived representations and site constants, correct the prompts URL | [sitemap](../../packages/blog/src/templates/sitemap.ts), [build](../../packages/blog/src/pipeline/build.ts) |
| All links were said to receive Markdown link attributes | Distinguish rendered Markdown from raw HTML and TypeScript templates | [Markdown renderer](../../packages/blog/src/lib/markdown.ts) |
| Early design details appeared current | Correct sidebar spacing, homepage cover/stream, monospace metadata, 28px buttons, theme thumb, separator placement, and shell-breakpoint scope | [layout](../../packages/blog/src/styles/layout.css), [home](../../packages/blog/src/pages/home.ts), [theme toggle](../../packages/blog/src/styles/theme-toggle.css) |
| Light was called the universal default; green theme values were reversed; section colors were omitted | Explain saved/system theme selection, correct light/dark link colors, and identify section accents separately from the brand gradient | [shell](../../packages/blog/src/templates/page.ts), [shared design tokens](../../packages/design/tokens.css), [ADR-0013.1](../adr/0013.1-publication-visual-layer.md) |
| Low contrast and no inline Shiki colors were overstated | Preserve warm text colors without asserting accessibility; distinguish inline CSS variables from a fixed default foreground | [tokens](../../packages/design/tokens.css), [Markdown renderer](../../packages/blog/src/lib/markdown.ts) |
| OG size and 404 behavior were obsolete | Correct 1200×630 to 1200×600 and replace the old redirect description with the current not-found page | [OG generator](../../packages/blog/src/lib/og.ts), [404 page](../../packages/blog/public/404.html) |
| Runtime and hosting shorthand overstated platform behavior | Distinguish TypeScript ESNext from browser es2024; describe the former deployment's missing analytics instead of making a blanket GitHub Pages claim | [TypeScript config](../../tsconfig.json), [bundler](../../packages/blog/src/pipeline/build.ts), existing hosting decision |
| Query rules could block factual corrections or dismiss useful practical guides | Scope the no-rewrite instruction to CTR-driven edits; assess actual reader intent instead of assuming docs queries are always a mismatch | Existing earned-trust direction and discovery evidence boundaries |

The immutable source is the full preservation fallback for superseded wording. The maintained instructions deliberately correct the above inaccuracies. This audit does not certify live services, every historical measurement, or every external citation in the writing canon.

## Ownership and loading

[ADR-0017](../adr/0017-on-demand-project-guidance.md) records the organization. `.agents/skills/` provides discovery; `AGENTS.md` has no skill catalogue. The maintenance skill handles code, builds, UI, operational evidence, delivery, and bookkeeping. Existing writing skills own their specific editorial references. Read only the references needed for the task.

The decision register locates established architecture choices and their existing ADRs. Dated task/worklist/handoff records own state. A new ADR was justified for this instruction architecture; no unrelated architectural decisions were reopened.

## Validation

Validation is recorded in [TASK-0148](../tasks/TASK-0148-reorganize-project-guidance-on-demand.md). The checks cover the root line limit and absence of a skill catalogue, complete source-range coverage, preserved owner quotations and accounting text, local links and anchors, skill frontmatter, representative task routes, and the scoped diff. They do not claim to revalidate every external research source or production receipt preserved here.

The existing user deletion of `CLAUDE.md` is outside this change. No post, prompt file, production configuration, private capture, or frozen footprint is edited.

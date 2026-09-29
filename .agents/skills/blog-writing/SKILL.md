---
name: blog-writing
description: Write, edit, and review gkoreli.com engineering posts. Covers evidence, structure, formatting, exact prompts, research footprint accounting, and reader feedback. Use the personal-essays or oss-radar skill when those forms govern.
license: MIT
metadata:
  author: gkoreli
  version: "2.5.0"
---

# Blog Writing

Use [shape-article](../shape-article/SKILL.md) before drafting. For substantive practical articles, apply [earned-trust-writing](../earned-trust-writing/SKILL.md): teach something useful through explanation connected to Goga's actual work and judgment.

## Task-specific references

| Work | Reference |
|---|---|
| Openings and section structure | [Opening discipline](../shape-article/references/opening-discipline.md) |
| Quotes attributed to Goga | [Owner quotations](references/owner-quotations.md) |
| Research usage measurement or release freeze | [Footprint accounting](references/research-footprint.md) |
| Reader feedback and post-publication measurement | [Editorial learning](references/editorial-learning-loop.md) |
| Titles, dates, and search presentation | [Metadata contract](../article-discovery-positioning/references/metadata-and-discovery.md) |
| Connecting articles | [Series contract](../article-discovery-positioning/references/series-and-cross-references.md) |
| File formats, custom components, rendering, validation | [Content and build](../blog-maintenance/references/content-and-build.md) |
| Firsthand evidence, credibility, or AI source use | [Evidence and credibility](references/firsthand-evidence-and-credibility.md) |
| Testing a disputed claim about the author's system | [Engineering investigations](references/evidence-led-engineering-investigations.md) |

Read the references relevant to the current task.

## Voice and substance

Write directly and conversationally for an engineering reader. Use first person for Goga's supplied work, decisions, and observations; do not invent them or use ownership as proof of accuracy.

Explain the problem, relevant mechanism, actual decisions, tradeoffs, and evidence. Include useful practices, failure modes, corrections, and lessons where the material supports them. Successful work and unresolved work are both valid subjects. A tutorial can stand alone while remaining grounded in the author's experience.

Past lessons, present uncertainty, and future intentions may coexist. Do not impose a personal confession, fixed technical/personal ratio by word count, or an unresolved ending on every article.

When presenting a repair as a lesson, explain what existed, what failed, the current implementation or decision, why that repair was chosen, its remaining tradeoff, and the bounded lesson. State what the repair is intended to make possible. When no repair has been established, present the diagnosis and open question accurately rather than promising a completed solution.

## Structure and formatting

- Use the opening and section rules for the chosen form. Put the significance before background in explanatory engineering work.
- Use prose for connected reasoning and narrative, bullets for parallel items, and numbered lists for ordered steps. Paragraph and sentence counts are not fixed limits.
- Use a table for comparisons and a diagram for relationships when they clarify the explanation. Do not add a visual merely to vary the page.
- Reserve quotation marks and attributed blockquotes for actual quotations. Strong author opinions can use ordinary prose or emphasis; styling does not authorize invented quotations.
- Keep necessary qualifications in emphatic statements. Do not strengthen a claim by removing its conditions.
- Specify code-block languages. Include enough code to explain or reproduce the behavior, with brief comments where needed. Separate before/after examples with an explanation.
- Add interactivity only when it improves understanding. Register custom elements in the loaded client bundle.
- Vary punctuation naturally. Avoid repeated em-dash constructions that obscure clause relationships.

For an explanatory article, read the title, opening, headings, main visual, and section endings together. They should convey the problem, response or question, principal evidence, and limits. Exposed essays retain their author's chosen structure.

## Post format

Files live in `packages/blog/posts/`. Use `NNN-slug-title.md` for Markdown posts; the number is removed from the URL slug. Custom-layout TypeScript posts follow the build reference.

```markdown
---
title: "Exact title naming the subject"
date: 2026-03-05
description: "A concrete statement of what this article explains"
section: engineering
tags: [nisli, web-components]
---

Start with the article's opening paragraph.
```

`section` must be `essays`, `engineering`, or `oss-radar`. Use a truthful publication date and lowercase, kebab-case tags; two to five relevant tags are usually enough. The shell renders the H1 from `title`; do not repeat it in the body. Apply the metadata contract for optional fields and modification dates.

## Prompt provenance

AI-assisted collaborative posts include the complete human prompts that materially shaped the article, research, claims, metadata, provenance, or publication decision. Exposed essays and OSS Radar omit prompt files under their governing authorship rules.

Save prompts at `packages/blog/prompts/{slug}.prompts.md`, matching the article slug. Separate complete messages with a line containing `---`; add no frontmatter and do not alter message formatting. Preserve chronological order. Exclude later repository housekeeping that changes none of the published artifacts.

`parsePrompts()` creates the `/{slug}/prompts` page and the article header/teaser links. The label is “Thoughts by human, co-written by AI.” A post without prompts has no prompt page or teaser. Use the footprint reference when publishing measured research usage; private session logs stay outside Git.

## Evidence and sources

Match the source to the claim:

| Claim | Appropriate basis |
|---|---|
| What happened in the author's system | Dated observations and reproducible artifacts, with versions, conditions, units, and exclusions |
| How a system works | Applicable standard, pinned implementation, or maintainer documentation; distinguish specified, implemented, and observed behavior |
| What someone said or originated | Original publication, message, or repository; attribution does not validate the statement itself |
| How people or models behave | Relevant primary studies with methods, tested populations/models, and material counterevidence |
| Whether a result generalizes | Independent evidence testing the same claim |

Use freely accessible primary sources. If the relevant evidence is inaccessible or insufficient, state the gap rather than substituting a weak citation. Use Wikipedia to find originals; cite it only when the original cannot be found. Avoid aggregators, content farms, and claims based on reputation alone.

Check whether a source still applies to the version and conditions discussed; age alone does not invalidate it. Use as many relevant sources as the claims require, with no arbitrary cap. The author's blog, repository, and notes share authorship and are not independent corroboration.

Place contextual links beside the claims they support. Use root-relative internal links; external Markdown links receive the renderer's new-tab attributes. Raw HTML and TypeScript templates need their own attributes.

When an article relies on external terminology or evidence, include a concise reference glossary after a horizontal rule:

```markdown
---

## Glossary

| Term / Claim | Primary source | Date |
|---|---|---|
```

Fill it with checked sources, relevant publication dates, and brief descriptions. Keep the evidence needed to understand the argument in the body as well. Do not add an empty glossary or use an appendix to conceal missing support.

## Publication checks

- Verify every consequential technical claim, number, date, attribution, quotation, and link against its source. Keep observed findings, interpretation, and proposed experiments distinct.
- Check that the title, description, opening, and body promise the same content.
- Confirm formatting and visuals help comprehension, metadata validates, and internal relationships are linked where useful.
- Match the ending to the actual experience or result. Do not add a lesson, future plan, or request for replies solely to fill a template.
- Confirm the appropriate prompt record exists and excludes unrelated private material.
- Apply [polish-prose](../polish-prose/SKILL.md) and the engineering publication review where applicable. Human draft feedback is useful when available, but not a mandatory release gate.

When distribution is requested, publish on `gkoreli.com` first. Cross-posts use its canonical URL. Choose channels and copy appropriate to the article; do not send posts or messages merely because this skill lists distribution options.

---
name: article-discovery-positioning
description: Align a gkoreli.com article's title, metadata, headings, links, and proposed distribution with its content and intended readers. Use after shaping the article, including when diagnosing search performance. Preserve its form and evidence limits.
license: MIT
metadata:
  author: gkoreli
  version: "1.3.0"
  evidence-audited: "2026-08-26"
  credibility-reviewed: "2026-09-06"
---

# Article Discovery and Positioning

Work from the article that exists. Use [shape-article](../shape-article/SKILL.md) first if its central question, claim, or experience is still unclear. Do not rewrite an article around a keyword found afterward.

## Contracts

- Read [metadata and discovery](references/metadata-and-discovery.md) for titles, dates, orientation, and search diagnosis.
- Read [series and cross-references](references/series-and-cross-references.md) when connecting articles.
- Read [editorial learning](../blog-writing/references/editorial-learning-loop.md) for performance windows and reader feedback.
- The governing form controls authorship and structure. Evidence rules still apply to personal writing, and every H1 must identify its subject.

## Establish the article's scope

Record the central subject, intended reader benefit, protected passages, evidence limits, and relevant article relationships. Separate the main reader problem or result from supporting implementation constraints.

Classify its role when that helps the decision:

- **Reader-growth:** explains a problem, method, decision, or artifact relevant beyond the existing audience.
- **Signature:** makes Goga's thinking, experience, projects, or intentions understandable.
- **Bridge:** connects a recognizable reader problem with the author's work or judgment.

These roles have no fixed quotas. A narrow audience is appropriate for some articles. Do not promise a practical method when an essay offers recognition or inquiry instead.

## Match content to reader intent

1. Inventory what the article contains: named tools, problems, mechanisms, comparisons, code, measurements, dates, diagrams, decisions, and related articles.
2. Identify plausible readers, the language they use, the task or question they bring, and the result type they expect. Locate the passage that meets each proposed need; record what the article cannot supply.
3. Use page-filtered search queries and observed reader/referral evidence when available. Use primary technical terminology and relevant community language for additional context. Treat suggestions and agent-generated query ideas as hypotheses, not measured demand or competition.
4. Choose the clearest reader need supported by both the content and evidence. Supporting phrases may name real subtopics; never repeat them to meet a density target.
5. Compare alternative titles and descriptions when a real choice remains. A small edit or a no-change decision does not require a full positioning report.

For a substantial revision, assess H1, `seoTitle`, `alternativeHeadline`, description, standfirst, slug, headings, tags, and links together. Each should describe the same article. Check each consequential verb, number, comparison, and outcome against the actual passage and evidence supporting it.

Reject a candidate that changes the article's central meaning, removes a material boundary, invents a comparison or tutorial, implies unsupported causality, or promises traffic. Prefer clarity, specificity, coherent metadata, and evidence fit over a mechanical score.

## Titles, headings, and keywords

- The H1 names the tool, project, person, problem, or result in ordinary language. A literary phrase may accompany the subject. A description or `seoTitle` cannot supply a subject missing from the H1.
- Put the main reader problem or result before secondary constraints unless a constraint defines the result.
- First person is appropriate for the author's own work. It supplies attribution, not proof of credibility or an acquisition advantage.
- Use exact API, protocol, tool, and error names where they matter. Do not insert a section or widen a claim just to place a search phrase.
- Use headings that help the reader follow the article's reasoning or experience. Preserve meaningful author phrasing when it remains understandable.
- Keep published URLs stable. Change a slug only with a reason and the repository's redirect/canonical checks.

## Relationships and reusable evidence

Internal links need a specific relationship: predecessor, continuation, correction, deeper mechanism, excluded adjacent question, project context, series, or section hub. Use one contextual link per relationship, root-relative canonical slugs, and descriptive anchor text. Inspect an older article for a forward link when publishing its continuation. Shared tags alone do not justify a link.

External links support attribution, evidence, reproduction, comparison, or further implementation. Prefer primary sources and place them beside the relevant claim.

Original measurements, reproductions, decision tables, diagrams, datasets, and checklists may be useful for others to cite. Keep their methods and limits inspectable when they already serve the article. Do not manufacture duplicate statistics pages, generic infographics, link exchanges, paid ranking links, or mass outreach to obtain citations.

## Separate outcomes

Metadata changes improve how the article is described. Distribution puts it before a chosen audience. Another publisher decides whether to link it. Reader replies and reports of use are separate outcomes. Do not equate impressions with readers, requests with use, backlinks with endorsement, or any of them with guaranteed growth.

After publication, follow the [measurement workflow](../blog-writing/references/editorial-learning-loop.md). Report the recommended change or no-change decision, its evidence, expected reader benefit, and remaining uncertainty. Scale the explanation to the change; do not produce fields and scores the decision does not need.

## Research references

Consult these when reviewing the basis for a recommendation:

- [Google title links](https://developers.google.com/search/docs/appearance/title-link), [crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [spam policies](https://developers.google.com/search/docs/essentials/spam-policies), and [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- [Catalog cases](../../../docs/tasks/TASK-0072.md), [meaningful linking](../../../docs/tasks/TASK-0073.md), [publication roles](../../../docs/tasks/TASK-0074.md), and [content-to-intent research](../../../docs/tasks/TASK-0075.md).
- [Firsthand evidence and credibility](../blog-writing/references/firsthand-evidence-and-credibility.md) for attribution, trust, and source-use distinctions.

# Headlines, metadata and discovery

Use when choosing an article’s entry point, editing publication metadata, diagnosing search fit or connecting articles. Work from the article that exists; do not reshape it around a keyword found afterward.

## Make every entry point earn attention

Choose the strongest supported what by consequence, relevance, comprehensibility and evidence quality. The largest percentage or the author’s own experiment is not automatically the best hook. Name the system, action and consequence before introducing an unfamiliar metric. Keep the denominator and essential condition with a numerical result.

Apply the first-50-words rule in the skill entry point. Read the H1, `seoTitle`, description and opening together, then check each actual entry surface separately. Use a surprising result, concrete failure or specific practical problem to create curiosity. Do not invent a result, inflate the population or hide the condition that makes the result true.

Use ordinary reader language. Preserve exact API, protocol, tool and error names where they matter, with a plain explanation. A literary phrase can accompany a clear subject; search metadata cannot rescue a cryptic H1. First person can identify who did the work, but supplies no ranking or credibility guarantee.

For a substantial title choice, record briefly:

- the reader’s actual problem or task and language;
- the passage that delivers the promised payoff;
- plausible discovery routes, with observed query/referral evidence separated from hypotheses;
- whether the title’s verbs, comparison and outcome match the evidence.

Compare alternatives when there is a real choice. A narrow metadata fix does not require a positioning report. Treat length and snippet previews as readability checks rather than fixed character limits or scores.

## Metadata contract

| Field | Contract |
|---|---|
| `title`, body H1, `og:title`, JSON-LD `headline` | Same article subject and actual title; one body H1 |
| `seoTitle` / HTML title | Complete search title, allowed to differ from H1; identify the concrete subject and payoff |
| `description` | Strongest supported result or practical promise in ordinary language; tool names when useful |
| `alternativeHeadline` | Set explicitly when used; never derive it from `seoTitle` |
| `tags` / JSON-LD keywords | Honest subject labels, not a density target |
| `date`, visible date, RSS `pubDate` | Truthful original publication date; metadata edits are not a new publication |
| `lastModified`, sitemap `lastmod`, JSON-LD `dateModified` | Material served-content change; no cosmetic bump for styling or routine refactors |

The visible publication date does not become a metadata-edit log. Show an updated date only for a substantial correction, new section or major rewrite. Use a single orientation sentence only if it clarifies the opening result or problem; do not place background ahead of the useful what. `.post-orient` and `.post-lede` are optional presentation tools, not required structures.

Keep H1, description, search title, slug, headings, tags and relationships aligned. Reject a candidate that removes an evidence boundary, invents a comparison/tutorial, changes the central meaning or promises traffic. Keep published URLs stable; a necessary slug change needs redirect and canonical checks through the repository workflow.

## Links and series

Use one contextual root-relative link per real article relationship: predecessor, continuation, correction, deeper mechanism, excluded adjacent question, project context or section hub. Inspect whether an older article needs a forward link when publishing a continuation. Shared tags alone do not justify linking.

Use both series metadata and a prose link when posts form a deliberate sequence and directly relate. `series.id` is the stable grouping key; `series.title` is its display label; `series.order` is reading order. Do not derive one from another or invent a separate title field. Duplicate order values within an ID must fail validation. The trail must work in HTML and the Markdown representation.

External links serve evidence, attribution, reproduction, comparison or further implementation. Prefer primary sources and put them beside the claim. Useful original measurements, diagrams and decision tables may earn citations when they already serve the article; do not manufacture statistics pages, generic infographics, link exchanges or mass outreach for backlinks.

## Diagnose performance before changing the claim

Use page-filtered queries with dates, filters, coverage and data state when available. Group them by reader task; inspect the passages that do or do not answer it. Position, clicks or CTR alone do not establish a cause, measured demand, difficulty or a winning title format. Agent-generated query ideas remain hypotheses.

Change presentation for a supported need or factual defect. Allow recrawling and a declared fresh observation window before judging another change. Correct factual errors immediately. Keep a justified no-change decision available.

Crawler access, eligibility, source selection, navigation, use, citation and referral are separate stages. Known-URL retrieval is not organic discovery. A citation’s presence does not establish support for its claim. Supplied-source experiments do not establish all-model preferences or organic selection. Evaluate Markdown by task quality, qualifications, navigation and total cost, not byte reduction alone.

Use `llms.txt` for demonstrated known-site navigation; invest further for a real client or measured benefit. Do not claim it guarantees ranking or citations, add special schema to an essay for unproven gains, or cosmetically refresh dates. The [research ledger](../../../../packages/blog/drafts/research/engineering-credibility/01-evidence-ledger.md) and [discovery task](../../../../docs/tasks/TASK-0070.md) retain the source studies and their limits; recheck a study before citing its result.

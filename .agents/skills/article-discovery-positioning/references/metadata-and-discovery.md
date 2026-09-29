# Metadata and Discovery

Use this contract when editing titles, descriptions, dates, orientation, or search presentation. Use [series and cross-references](series-and-cross-references.md) for article relationships.

## The Metadata Split

| Field | Audience | Rule |
|---|---|---|
| `<title>` (HTML) | Cold searcher in SERP | Carry concrete handles: tools, topic, context. Can differ from H1. |
| H1 / `og:title` | Reader who clicked, and the cold reader who sees it shared | Names the subject in plain words first (the tool, project, problem, or result); a voice-bearing phrase may follow, never replace it.  |
| `meta description` | Cold searcher scanning results | Lead with tool names and concrete promise. Not the thesis. |
| JSON-LD `headline` | Google's structured data parser | Same as H1 — the real title. |
| JSON-LD `alternativeHeadline` | Semantic labeling | Explicit field on PostMeta. Set it directly; never derive by parsing `seoTitle`. |
| JSON-LD `keywords` | Semantic labeling | From `meta.tags`. Not SEO magic — just honest labeling. |
| Sitemap `<lastmod>` | Googlebot | `lastModified ?? date`. Update when the served page meaningfully changes: main content, title/description, structured data, canonical/internal links, or substantial corrections. Do not bump for pure styling/refactors. |
| JSON-LD `dateModified` | Structured data parsers | Same as `lastModified ?? date`. |
| RSS `<pubDate>` | Feed readers / subscribers | Publish date only. Never `lastModified`. Don't surface metadata edits as new posts. |
| Visible article date | Readers | Publish date only. Show updated date only for material changes (new section, corrected argument, major rewrite). Not for metadata/orientation fixes. |
| Orientation sentence | Reader who landed from a bad-fit query | One concrete sentence before the essay voice. Not SEO bait — reader grounding. |

## Titles Name the Subject

The H1, description, and slug identify the article's subject in plain language. A title must make sense as a shared link without the article's context. A literary phrase may accompany a clear subject; `seoTitle` cannot compensate for an unintelligible H1.

Emphasize the main reader problem or supported result. Put secondary implementation constraints in the explanation unless they define the problem or an essential limit. First person is useful when it identifies work the author actually did.

## Search title and orientation

`seoTitle` supplies the complete HTML title instead of the default `title — Goga Koreli`. It does not change H1 or `og:title`. Set `alternativeHeadline` explicitly; never derive it by parsing another field.

```ts
title: "You Don't Always Need Codemap",
seoTitle: "You Don't Always Need Codemap — ghx, Repo Maps, and Code Search",
alternativeHeadline: "ghx, repo maps, repo packing, and agent code search",
```

When readers need orientation, add one concrete sentence about the tools, problem, and context before developing the argument. Do not merely restate the thesis. `.post-orient` uses a left border and `color: var(--color-text-muted)`; avoid `opacity`, which also fades descendants. `.post-lede` is available for an opening presented as article prose. Neither treatment is compulsory for every form.

## Diagnose search performance

1. Export page-filtered Search Console queries for a defined window.
2. Group them by reader intent and compare that intent with what the article delivers.
3. For relevant queries with few clicks, inspect the title, description, sample size, and competing result types. Position and click count alone do not establish the cause.
4. Change content for a demonstrated reader need or factual correction. Do not rewrite it solely to chase CTR before diagnosing intent.
5. After a search-presentation change, request indexing when appropriate, allow recrawling and fresh data, and compare a subsequent window before another revision.

Avoid keyword lists disguised as titles, duplicate comparison pages without demonstrated need, and metadata-only visible date bumps. Metadata must describe the existing article accurately; it cannot guarantee traffic.

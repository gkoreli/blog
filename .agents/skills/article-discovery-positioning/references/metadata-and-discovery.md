# Metadata and Discovery Contract

Read when changing titles, metadata, orientation, dates, or diagnosing search discovery. These owner decisions are maintained here; [series and cross-references](series-and-cross-references.md) owns continuity links. Historical search observations are case evidence, not a guarantee about another page.

## Discoverability Without SEO Sludge

The world wide web problem: an article can be gold and completely invisible. The historical example of position 5.9 with 865 impressions and 0 clicks prompted a doorway investigation; those numbers alone do not establish the cause. The essay voice stays intact; the signals that face cold searchers need to be honest and concrete.

### The Core Principle

> Keep the essay. Make the doorway less cryptic.

The fix is never "write for Google." It is: make the same article legible to someone who found it by accident. One grounding sentence, a title that carries search handles, a description that leads with names — not with the thesis.

### The Metadata Split

Different surfaces serve different audiences. Don't corrupt one to fix the other.

| Field | Audience | Rule |
|---|---|---|
| `<title>` (HTML) | Cold searcher in SERP | Carry concrete handles: tools, topic, context. Can differ from H1. |
| H1 / `og:title` | Reader who clicked, and the cold reader who sees it shared | Names the subject in plain words first (the tool, project, problem, or result); a voice-bearing phrase may follow, never replace it. See "Titles Name the Subject" below. |
| `meta description` | Cold searcher scanning results | Lead with tool names and concrete promise. Not the thesis. |
| JSON-LD `headline` | Google's structured data parser | Same as H1 — the real title. |
| JSON-LD `alternativeHeadline` | Semantic labeling | Explicit field on PostMeta. Set it directly; never derive by parsing `seoTitle`. |
| JSON-LD `keywords` | Semantic labeling | From `meta.tags`. Not SEO magic — just honest labeling. |
| Sitemap `<lastmod>` | Googlebot | `lastModified ?? date`. Update when the served page meaningfully changes: main content, title/description, structured data, canonical/internal links, or substantial corrections. Do not bump for pure styling/refactors. |
| JSON-LD `dateModified` | Structured data parsers | Same as `lastModified ?? date`. |
| RSS `<pubDate>` | Feed readers / subscribers | Publish date only. Never `lastModified`. Don't surface metadata edits as new posts. |
| Visible article date | Readers | Publish date only. Show updated date only for material changes (new section, corrected argument, major rewrite). Not for metadata/orientation fixes. |
| Orientation sentence | Reader who landed from a bad-fit query | One concrete sentence before the essay voice. Not SEO bait — reader grounding. |

### Titles Name the Subject (owner tenet, 2026-09-01)

Every title, in every section, names its subject in plain words a stranger could search for: the tool, project, person, problem, or result. `How I Built First-Party Analytics for a Personal Blog` is the model. `Same Hook Name, Different Tensor` is the failure: it names nothing a reader could look for, and it was chosen under the older "literary H1, concrete seoTitle" reading of the split above. That reading is retired. The split still exists for search snippets, but the H1 carries the handle first; a literary phrase may follow it, as the accent half of the title, never instead of it. The slug and the description name the subject too.

Why: this is not an established publication. Nobody arrives knowing the house style, and most readers meet a title on X, in a search result, or in a feed with no context. A title that needs the article to explain it costs the reader the article.

The owner's words, recorded verbatim on 2026-09-01:

> also look at the title of the /Users/goga/Documents/goga/blog/packages/blog/posts/020-first-party-analytics-for-a-personal-blog.md it is much more searchable and catchy and come-acrossable, than Same Hook Name, Different Tensor. What does this title even mean? It is very criptic, for what reason? Nobody will find this article, it doesn't even mention the interp-engine or anything like that, how will someone ever find this article at all? we are not an established publishing yet, hope you understand. Capture this as a rule somewhere, I feel like we have some kinda misleading rules or what? Why are we making this kinda mistakes over and over? We need to improve eitehr the skills, rules or tenets or something.

Checklist for any title: (1) a stranger can tell what it is about; (2) it contains the searchable name of the thing; (3) it would still make sense as a bare link on X; (4) first person is welcome when the author did the work ("How I…", "I tested…"). Exposed essays keep their voice, and their titles still pass (1) and (3).

### How to Apply `seoTitle`

Add it to `PostMeta` when the literary title does not carry enough search handles:

```ts
title: "You Don't Always Need Codemap",          // H1, og:title — voice intact
seoTitle: "You Don't Always Need Codemap — ghx, Repo Maps, and Code Search",  // <title> only
alternativeHeadline: "ghx, repo maps, repo packing, and agent code search",   // JSON-LD only
```

`seoTitle` replaces `— Goga Koreli` in `<title>` but never touches H1 or og:title. It is a supplement for search snippets, not a licence for a cryptic H1: the H1 itself must already name the subject (see "Titles Name the Subject").

### The Orientation Sentence

Before the essay voice, one concrete sentence that orients the reader who landed unexpectedly. It should describe:
- what the article covers (concrete tools/topics, not thesis)
- the framing (the moment/workflow/decision being analyzed)

Style: muted, left-border accent, `color: var(--color-text-muted)`. Reads as a field-note abstract, not a callout or disclaimer. Class: `.post-orient`.

**Good:** describes the moment and the cast of tools

**Bad:** restates the thesis as a sentence ("Code context tools are not interchangeable.")

### Diagnosing CTR Problems

High impressions, position 5–8, and near-zero clicks are a reason to investigate **SERP mismatch**, not proof of a specific cause or automatically bad content. The mismatch may be query intent, title/snippet packaging, or the type of result searchers expect.

Diagnosis sequence:
1. Export page-filtered queries from Search Console for the specific page
2. Bucket queries by intent: docs/reference intent vs essay/opinion intent
3. If docs-intent queries dominate impressions, compare their expected job with what this article actually delivers; those queries may fit a practical guide but miss an essay
4. If good-fit queries have 0 clicks at position 3–8, investigate title/description fit alongside sample size and the competing result types

**Do not rewrite content solely to chase CTR** until you understand query intent. Correct known factual errors independently of search data. Churning metadata without query data is guesswork.

### The Measurement Window

After making discoverability changes:
1. Request indexing in Search Console (URL Inspection → Test Live URL → Request Indexing)
2. Wait for recrawl — do not keep editing
3. Export page-filtered queries after fresh data arrives
4. Only act on the next round if the query data gives you a reason

A ranking around position 6 establishes visibility in that measured query/window. Diagnose query intent and presentation before deciding whether the article needs a content change; position alone does not settle that decision.

### Anti-Patterns

- **Don't make the `<title>` a comparison slug** — `Codemap vs ghx vs Aider vs Repomix vs Gitingest` is SEO-hostage phrasing. It sounds desperate and attracts the wrong intent.
- **Don't derive `alternativeHeadline` by parsing `seoTitle`** — explicit field, set it directly.
- **Don't show updated dates for metadata-only edits** — readers don't care; it makes the publication feel changelog-ish.
- **Don't create SEO companion pages without query data** — a generic comparison page might attract more bad-fit intent, not less.
- **Don't use `opacity` for `.post-orient` color** — use `color: var(--color-text-muted)` directly; opacity affects all descendants including future links.

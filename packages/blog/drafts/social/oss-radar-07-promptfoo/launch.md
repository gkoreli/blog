# OSS Radar #07: Promptfoo launch copy

Prepared September 10, 2026 (PDT). **Draft; unpublished on X and HN.** Copy only; no media, account analysis, composer preview, or live social checks.

For engineers evaluating AI answers, the useful surprise is that a readable answer can survive a test while its structured citation fields are absent from the summary. The article shows where that happened and the capture needed to preserve the evidence.

## Recommended X post

255 weighted characters, including the canonical URL and hashtag.

```text
Promptfoo kept the answer. Its built-in OpenRouter summary dropped the citation fields.

Synthetic test on 0.122.2. The cache kept them. Custom capture retained citations and failed attempts through database export.

#BuildInPublic
https://gkoreli.com/oss-radar-07-promptfoo
```

## Optional three-post thread

Use the recommended post above as post 1. Each reply adds a distinct result; the first and last posts contain the canonical link.

**Post 2 — 258 weighted characters**

```text
Ten synthetic cases, 11 HTTP attempts. With custom capture, Promptfoo 0.122.2 kept every attempt through a database restart and JSON exports.

That included the failed 429 before a successful retry. Five evals deliberately failed; their records survived too.
```

**Post 3 — 235 weighted characters**

```text
Keeping a citation doesn't prove that its source supports the answer. That review comes next.

Runnable tests and saved records are in the article. All responses were synthetic; we haven't tested newer 0.123.0.

https://gkoreli.com/oss-radar-07-promptfoo
```

## Hacker News

**Title — 56 characters**

```text
Can Promptfoo Preserve the Evidence Behind an AI Answer?
```

**URL:** https://gkoreli.com/oss-radar-07-promptfoo

This preserves the article title after removing the series label and issue number. HN asks for original titles without editorializing and prohibits generated or AI-edited comments. No HN comment is supplied. [HN guidelines, checked September 10, 2026 PDT](https://news.ycombinator.com/newsguidelines.html).

## Evidence and checks

- The [installed comparison](../../research/oss-radar-07/repro/installed/README.md) used a synthetic response with Promptfoo 0.122.2. The omission concerns the built-in OpenRouter **summary**; the transport cache retained the structured citation fields.
- The [capture continuation](../../research/oss-radar-07/repro/capture/README.md) retained all 11 attempts across 10 synthetic cases through the database and JSON exports, including failures and the failed attempt before a successful retry. Five evaluations deliberately failed. Retention is the result; this is not a claim that every evaluation passed.
- The [article](../../../posts/026-oss-radar-07-promptfoo.ts) notes the newer 0.123.0 release without claiming a rerun. These experiments establish no live model behavior, citation accuracy, or billing result.
- Counts include paragraph breaks. Every post uses ASCII text, with each ordinary character weighted 1 and the canonical URL weighted 23. [X character-count rules](https://docs.x.com/fundamentals/counting-characters); [X link-count guidance](https://help.x.com/en/using-x/how-to-post-a-link), checked September 10, 2026 PDT.
- The canonical URL matches the article slug. A HEAD request returned 404 at September 11, 2026, 03:06:15 UTC, before publication completed. The publication task owns the post-deployment link check.

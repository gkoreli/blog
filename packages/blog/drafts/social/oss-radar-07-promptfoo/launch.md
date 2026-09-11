# OSS Radar #07: Promptfoo launch copy

Prepared September 10, 2026 (PDT). **Draft; unpublished on X and HN.** Copy only; no media, account analysis, composer preview, or live social checks.

For engineers evaluating AI answers, the useful surprise is that a readable answer can survive a test while its structured citation fields are absent from the summary. The article now also includes two real subscription-backed CLI answers and a source error in one of them.

## Recommended X post

247 weighted characters, including the canonical URL.

```text
Claude cited my article and got a key number wrong.

I ran Codex and Claude through Promptfoo using existing subscriptions. Both answers survived export; source review caught the error.

Real answers, scripts, and evidence:
https://gkoreli.com/oss-radar-07-promptfoo
```

## Optional three-post thread

Use the recommended post above as post 1.

**Post 2 — 231 weighted characters**

```text
The article said 277 requests were reclassified. Claude called all 277 cloud-classified. Its earlier fetch summary had the denominator right.

Saving the intermediate tool output let us inspect what changed before the final answer.
```

**Post 3 — 242 weighted characters**

```text
Separate controlled tests checked missing citations, failures, retries, and database exports.

Promptfoo preserved the records we supplied. Checking whether the cited source supported the answer still required review.

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
- The [article](../../../posts/026-oss-radar-07-promptfoo.ts) notes the newer 0.123.0 release without claiming a rerun. The separate [real CLI experiment](../../research/oss-radar-07/20-subscription-cli-experiment.md) and [source review](../../research/oss-radar-07/21-real-answer-source-review.md) establish two directed answer observations and exact record retention, not a population citation rate or a billed charge.
- Counts include paragraph breaks. Every post uses ASCII text, with each ordinary character weighted 1 and the canonical URL weighted 23. [X character-count rules](https://docs.x.com/fundamentals/counting-characters); [X link-count guidance](https://help.x.com/en/using-x/how-to-post-a-link), checked September 10, 2026 PDT.
- The canonical URL returned HTTP 200 in the completed [publication verification](../../research/oss-radar-07/18-publication-verification.md), which checked the article, Markdown, metadata, prompts, and assets. The earlier 03:06 UTC 404 preceded deployment.
- The original OpenRouter connector experiment used a local server. The later real answers came from Codex and Claude Code; no OpenRouter service call occurred. The revised copy is still a draft and has not been posted.

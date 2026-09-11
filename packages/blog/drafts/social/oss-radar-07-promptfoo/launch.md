# OSS Radar #07: AI citations launch copy

Prepared September 11, 2026. **Draft; unpublished on X and HN.** Written for the full AI-citations cohort rewrite, using the existing canonical URL.

For engineers building research agents and publishing technical work, the useful surprise is that an answer can retain the right number and cite the right article while changing what that number means. The cohort examines how research, citation checks, and retained records address that problem.

## Recommended X post

**267 weighted characters**, including the canonical URL and paragraph breaks.

```text
Claude cited my article, kept the number, and changed what it meant.

OSS Radar #07 follows the tools trying to make AI research verifiable: STORM, OpenScholar, citation checks, and the records needed to investigate an answer.

https://gkoreli.com/oss-radar-07-promptfoo

#BuildInPublic
```

## Optional three-post thread

Use the recommended post above as post 1. Each following post adds a different point; the canonical URL remains in the first and last posts.

**Post 2 — 231 weighted characters**

```text
A claim can agree with the retrieved material while citing the wrong passage.

TruLens and DeepEval have checks for that mistake. Quote matching, context support, and checking the particular cited source answer different questions.
```

**Post 3 — 232 weighted characters**

```text
I want agents to cite my blog. I also want readers to find the claim the answer promised.

My bet is on original results with visible methods, versions, and limits, then checking what survives in the answer.

https://gkoreli.com/oss-radar-07-promptfoo
```

## Hacker News

**Title — 63 characters**, matching the reviewed manuscript:

```text
AI Citations: Do Agents Preserve the Evidence Behind an Answer?
```

**URL:** https://gkoreli.com/oss-radar-07-promptfoo

Submit as an ordinary linked article after the rewrite is live. The article contains original code inspection and a retained CLI experiment, alongside attributed research. HN asks for the original source and an ordinary faithful title. Keep the article title for the submission. [HN guidelines, checked September 11, 2026](https://news.ycombinator.com/newsguidelines.html).

**Comment suggestion:** Goga can choose to write a short comment himself explaining why a citation to his own work made this question matter, and which engineering decision he wants to discuss. This is a topic suggestion, not copy to paste. HN's comment guidelines prohibit generated and AI-edited text, so no comment draft is supplied. [HN comment guidelines](https://news.ycombinator.com/newsguidelines.html).

## Evidence and readiness

- The opening hook is one retained observation: Claude described the article's **277 reclassified requests** as **277 cloud-classified requests**. The [source review](../../research/oss-radar-07/21-real-answer-source-review.md), claim A4, compares the unchanged answer with the retained source. This is not a model ranking, a population error rate, or evidence of organic discovery; the question supplied the article URL.
- The broader promise matches the [rewritten manuscript](../../oss-radar-07-promptfoo.md): STORM/OpenScholar generation, explicit citation checks, source credibility, and record preservation. The social copy makes no numerical or general model-accuracy comparison from the two runs or from the studies.
- Every post contains ASCII text. Counts use weight 1 for those characters and 23 for the canonical URL; paragraph breaks and the hashtag are included. [X character-count rules](https://docs.x.com/fundamentals/counting-characters); [X link-count guidance](https://help.x.com/en/using-x/how-to-post-a-link), checked September 11, 2026.
- **Destination verified live at 2026-09-11 17:06 UTC.** Release `4f8e39e` serves the rewritten article and its matching social image. The [release receipt](../../research/oss-radar-07/ai-citations-rewrite-verification.json) verifies article/Markdown, nineteen prompts, catalog/citation title, and image. The HN title above matches the final H1. The earlier 16:50 check saw the preceding article and is superseded by this acceptance.
- Copy remains unpublished: no account analysis, composer preview, or social posting occurred. The final generated social image was inspected locally and verified byte-for-byte against the live image; no social-platform card-cache refresh was performed.

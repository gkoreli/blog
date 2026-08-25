---
name: shareable-engineering
description: Evidence-based mechanics for engineering articles that get read, shared, cited by AI search, and answered — titles and SEO titles, agentic-search (GEO/AEO) reality, trust mechanics, share triggers, and the editorial checklist. Use when titling, editing, or doing the pre-publish pass on an engineering post. Complements blog-writing (structure/sourcing) and personal-essays (voice/register); where they conflict on voice, personal-essays wins.
license: MIT
metadata:
  author: gkoreli
  version: "1.1.0"
  evidence-audited: 2026-08-25
---

# Shareable Engineering Articles — The Evidence-Based Mechanics

This skill exists because "catchy" is usually folklore. Everything prescriptive here traces to a verified source or a named practitioner with receipts; the epistemics section says which is which. When new evidence contradicts a rule, update the rule and bump `evidence-audited`.

Run `shape-article` first. Apply this skill to the engineering and discovery layers of a piece without forcing an exposed essay, inquiry, or field note to become a resolved argument. `personal-essays` governs every conflict involving voice, aliveness, and unresolved experience.

## Epistemics — how this skill was built

- **Verified at primary source** (fetched, not summarized secondhand): Google Search Central title-link docs (updated 2025-12); Google Search's AI-feature and `llms.txt` guidance (accessed 2026-08); Backlinko CTR study (n = 4M results, 1.3M pages, updated 2025-04); Ahrefs `llms.txt` log analysis (~38k valid files, data 2026-05); the `llms.txt` v2 proposal; pinned maintained client workflows from Google Gemini skills, Prismatic, tldraw, Streamlit, and LangChain `mcpdoc`.
- **Peer-reviewed**: "GEO: Generative Engine Optimization," Aggarwal et al., KDD 2024 (arXiv:2311.09735); FeatGEO, ACL 2026; MAGEO, ACL Findings 2026; Competitive GEO, SIGIR 2026.
- **Practitioner authority** (consistent with their published work): Dan Luu, Julia Evans, Simon Willison, Thorsten Ball, swyx, Sean Goedecke, HN moderator dang.
- **Rejected**: AEO content-farm posts with fake-precise stats (r-values, "+156%") and no methodology. If a number has no methodology, it does not enter this skill.

## Titles

The architecture is the metadata split (see `AGENTS.md`): literary H1/`og:title` for the reader who clicked, concrete `seoTitle` for the cold searcher. The evidence tunes the `seoTitle`:

- **Use 40–60 characters and 6–9 words as a starting range, not a hard rule.** Backlinko found the highest CTR inside that band, but its summary reports a 33.3% lift while its detailed section reports 8.9%. Do not cite either as settled. Google sets no limit — truncation is device-width — so longer isn't penalized, just unseen. Whatever must be *seen* lives in the first ~57 chars.
- **Front-load the handles.** Tool names, the topic noun, the artifact ("MCP server," "UI framework") come first; the hook number or verdict closes.
- **Declarative beats interrogative.** Question titles show no CTR advantage (15.5% vs 16.3%, n = 4M). Curiosity comes from specific stakes, not question marks.
- **Positive framing edges negative** (+4.1pp absolute). "What 100 PRs bought" over "Why PRs failed me" — when both are honest.
- **Semantic match with H1 is defensive.** Google rewrites titles it distrusts, drawing from H1, anchors, and on-page text. A `seoTitle` that shares the H1's substance keeps Google from writing yours for you.
- **First person signals a human.** HN data: titles like "I've …" read as a person, not a content farm. dang: "Intellectual curiosity is the currency of HN. You can't fake it."
- **Never**: keyword stuffing, boilerplate patterns, comparison-slug titles ("X vs Y vs Z") — Google flags them and readers smell them.

## Agentic search (GEO/AEO) — what is real in 2026

- **Separate eligibility, selection, navigation, use, citation, and referral.** A crawler request proves only that a resource was requested. A supplied source influencing an answer does not prove organic discovery or selection. Every GEO claim must name its stage and evidence.
- **Evidence-rich writing can change use after retrieval; it is not a universal acquisition recipe.** The KDD 2024 GEO benchmark began with Google's top five results, and its Perplexity test supplied source files. ACL/SIGIR 2026 studies likewise freeze candidates or retrieval to isolate content effects. Citations, relevant evidence, clear claims, and qualifications remain good human-facing trust mechanics, but their effects on generated answers are conditional and engine-specific. Do not promise discovery or repeat the “up to 40%” result without its supplied-source boundary.
- **Give the first 100 words a self-contained anchor.** The standfirst (`.post-lede`) names the artifact and the story in one declarative sentence a machine can lift. It may state a finding, a live question, or the current state; never supply an answer the article does not have. Weak-source but directionally consistent with GEO; cost is zero.
- **Durable URLs with visible dates are the long game.** ChatGPT-class engines cite years-old content; freshness mainly matters for Perplexity-style engines. Update posts with real changes and honest `lastModified`, never cosmetic date-bumping (see `AGENTS.md` metadata rules).
- **Give `llms.txt` the job the evidence supports.** Google Search says it neither helps nor hurts Search or AI-feature visibility, and Ahrefs found 97% of valid files received no requests in its May 2026 sample. But maintained coding-agent workflows demonstrably use a small index followed by targeted Markdown, while other bounded tasks cache and search a full dump. Treat it as optional known-site agent navigation, not an organic ranking or citation lever. Keep a generated, synchronized index when cheap; invest further only for a real client or measured task benefit.
- **Page-level Markdown is a separate product from the root index.** It may reduce representation noise or token cost after a client selects a page. Measure answer quality, qualifications, failed navigation, total resources, bytes, and tokens; a smaller response alone is not a task win.
- **Do not add FAQ schema to essays.** The citation-rate claims for it come from unverifiable sources, and question-boxes bolted onto a narrative are schema spam. BlogPosting JSON-LD (auto-generated) is enough.

## What makes an engineering article get shared

A reader shares when the post makes them **armed**, **vindicated**, or **seen** (per `personal-essays`). The evidence adds mechanism:

- **Specificity is a structural advantage of a personal blog.** Dan Luu on corporate blogs: the approval chain "removes references to specifics, makes posts vaguer and less interesting," while "there's a dearth of real, in-depth, technical writing." No approval chain here — so every abstraction that could be a name, number, date, or commit SHA is a wasted advantage.
- **One clear disagreeable opinion when the piece makes an argument.** Goedecke published 141 posts in 2025; 33 reached the front page of Hacker News or a similar aggregator. His stated recipe for a popular post is a clear opinion about working in tech that many people dispute. Balanced surveys get nods; falsifiable claims get replies. Do not manufacture a claim for an inquiry or field note whose honest center is uncertainty.
- **Write for the person who struggled.** Evans: "if I struggled with something, there's a pretty good chance other people are struggling with it too… write it down while you still remember what was hard." swyx: "Make the thing you wish you had found when you were learning."
- **The dead ends are the content, not the framing.** Trust is built almost entirely in what was tried and failed and what it cost. Anyone can publish the success path.
- **Name what the losing tool is still better at.** A verdict is only trusted from a writer who can praise the other side. (React gets its ecosystem sentence before nisli gets its reason to exist.)
- **Volume with a low bar beats perfectionism.** Willison: "Aim to hit publish while you are still actively unhappy with what you have written." Ball's original discipline was 60 minutes every Sunday, when whatever he wrote was published. Neither example proves a universal publishing rate; together they support regular practice and a willingness to ship imperfect work.
- **Success metric is contact, not pageviews.** Evans calls pageviews a blogging myth; the real signal is the reader who writes back. End with the honest invitation when the want is owned on the page (per `personal-essays`).

## Hedging — the reconciliation

Luu: "writing confident, unqualified statements works. People like confidence." Evans: "just add qualifiers like 'I think…'." These reconcile as one rule:

> **Hedge the epistemics, never the position.**

"This is unmeasured" / "I haven't tested X" = honesty; it stays. "Arguably," "perhaps," "somewhat," "to be fair" = armor; it goes. Word-level bans (Google dev style guide + Orwell rule 3): **just, simply, easily, obviously, very, actually** as filler — delete and see if meaning survives. Precise qualifiers on real uncertainty ("roughly one in thirteen" for 9/117) are measurements, not hedges.

## Pre-publish checklist (run on every engineering post)

1. **seoTitle**: ≤ ~57 visible chars, handles first, declarative, shares the H1's substance. H1 stays literary.
2. **Description**: ≤ ~155 chars, leads with names, works as a standalone sentence.
3. **Standfirst** (`.post-lede`): first 100 words contain one declarative, liftable sentence naming the artifact and the story.
4. **The disagreeable claim**: for argument and decision pieces, present, signed, and falsifiable — the post states what evidence would prove it wrong. For inquiry and field notes, preserve the live question.
5. **Reader value**: give the reader a decision rule, trap, trade-off, sharper question, or faithful account of a hard unresolved state. Match the governing form.
6. **Dead ends**: every success path shown has its failed attempts and costs beside it.
7. **Loser praised**: each comparison names what the losing option is still better at.
8. **Hedge audit**: epistemically honest qualifiers kept; armor words cut; filler words (just/simply/easily/obviously) deleted.
9. **Specificity audit**: abstractions that could be names, numbers, dates, SHAs — converted or flagged.
10. **Numbers verified**: every count, quote, date, and attribution checked at source (`gh`, the repo, the original post) — never from memory, never from a miner's summary alone.
11. **Contact**: the ending invites reply if the want is owned; never a growth-hack CTA.
12. **Voice pass last**: read aloud against the 1am arguing voice (`personal-essays` wins all conflicts).

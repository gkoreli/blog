# Drafts and article dispositions

**Owner decision — November 10, 2026, America/Los_Angeles:** CUBOT is the only
active article from the audited backlog. Goga intends to rewrite it substantially
and publish it. He retired the other article directions to close the backlog,
retain the work already done, and avoid repeatedly reconsidering the same material.

## Start here for unpublished-article questions

Use this register before searching old drafts, worktrees or conversations.
An unpublished file is not automatically unfinished work. Do not present the
closed entries below as pending publications or recommend resuming them unless
Goga explicitly reopens the topic. Historical instructions such as "next action"
or "draft after research" in their records are superseded by this decision.

Completed research and executed experiments retain their actual evidence and
limits. Withdrawn articles, unrun experiments and unsubmitted contributions are
closed by owner choice; they are not claimed as executed or published. Separate
analytics and newsletter maintenance tasks retain their own scope and status.

## Active article

| Article | Current state | Next action |
| --- | --- | --- |
| [My Bot Detector Mistook a Phone Brand for a Bot](unknown-clients-and-evidence-based-bot-detection.md) — CUBOT | Research, implementation and reviewed baseline retained; unpublished. The earlier editorial acceptance does not freeze the new version. | Goga's substantial rewrite, then publication preparation. No date assigned. |

## Closed by owner — November 10, 2026

| Topic | Final disposition | Retained record |
| --- | --- | --- |
| FFmpeg DVB subtitle optimization and verification | Completed bounded research/experiments. Article, upstream submission and proposed further verification retired. Recorded performance tradeoffs remain unresolved. | [Research and patches](research/ffmpeg-dvbsub/00-worklist-index.md); [closed TASK-0149](../../../docs/tasks/TASK-0149-verify-ffmpeg-dvb-subtitle-improvements.md) |
| Agents editing neural-network weights / weight-space programming | Initial source research and score-arithmetic audit complete. Model execution, reproduction and article plans withdrawn; those experiments never ran. | [Research brief and audit](../../../docs/worklist/weight-space-programming/README.md) |
| HackerTube: When the Dataset Becomes the Product | Exploratory conversation concluded. Proposed article retired; no manuscript or independent experiment was produced. | Chat **Explore an article perspective**, `01a198d5-49a7-7953-a513-ef5543640731`, November 1 |
| FluoTest acquisition and distribution | Completed public-source research and interactive guide. Standalone article direction and proposed visibility/reader-use experiments retired. | [Case study and inventories](../../../docs/worklist/fluotest-acquisition-case-study/README.md) |
| Subscription Bombing: How I Protect My Blog | September manuscript archived; completed engineering/research preserved. No obligation to update or publish it. The separate Turnstile post is not an unpublished companion to resume. | [Archived manuscript](research/newsletter-reliability/article.md); [closed TASK-0128](../../../docs/tasks/TASK-0128-develop-article-on-newsletter-bot-protection-and-the.md) |
| Why Edge Page Views Disagree With Cloudflare Web Analytics | Standalone manuscript/publication plan retired. September comparisons and later executed calibration work remain dated evidence; technical maintenance is separate. | [Archived manuscript](edge-page-views-versus-cloudflare-rum.md); [research](research/edge-vs-rum/00-worklist-index.md) |
| Harness Engineering | Older manuscript archived; publication plan retired. | [TypeScript manuscript](008-harness-engineering.ts) |
| The Obvious Agent Products Were Impossible Until Yesterday | Older manuscript archived; publication plan retired. | [Manuscript](016-the-obvious-agent-products-were-impossible-until-yesterday.md) |
| Matomo comparison and authorized agent subscriptions | Completed research retained. Standalone article direction and optional follow-lifecycle/comparison experiments retired; unrun extensions remain unrun. | [Comparison and protocol research](research/agent-readership/00-worklist-index.md) |
| Write what we write, how, and why | Future article cancelled; existing publication tenets remain in force. | [Closed TASK-0042](../../../docs/tasks/TASK-0042.md) |

## Historical drafts with maintained posts

These retained copies or earlier conversations do not add unpublished articles:

- [Prompt caching](../../../docs/worklist/prompt-caching-from-api-to-agent-loop/article-draft.md) → [maintained post](../posts/prompt-cache-context-edits.ts).
- [ChatGPT plugin apps](chatgpt-plugin-apps.md) → [maintained post](../posts/028-chatgpt-plugin-apps.md).
- [Nisli framework](research/nisli-framework/article.md) → [maintained post](../posts/029-openclaw-chose-solid-why-id-choose-nisli.md).
- [Bun Express/Fastify follow-up](research/bun-aot-followups/express-sqlite-2026-11-01/09-follow-up-draft.md) → [maintained post](../posts/039-bun-aot-express-fastify-serializers.md).
- [macOS worktree setup](why-worktree-setup-is-slow-on-macos.md) → [maintained post](../posts/032-why-worktree-setup-is-slow-on-macos.md).
- [AI fetcher field guide](testing-ai-search-fetch-and-crawl-against-my-analytics.md) → [maintained post](../posts/041-ai-fetcher-browser-crawler-headers.md).
- [OSS Radar #07](oss-radar-07-promptfoo.md) → [maintained post](../posts/026-oss-radar-07-promptfoo.ts).
- Turnstile's scheduled source was promoted in `3efc3435` → [maintained post](../posts/043-cloudflare-turnstile-signup-failures.md). This source-history fact is not a fresh production acceptance check.

The November 10 audit found no unique article changes in either surviving linked
worktree: both were clean and their commits were already on main. Older cleanup
and recovery evidence remains in the [November 1 worktree audit](../../../docs/handoffs/2026-11-01-blog-worktree-audit.md).

## Storage and publication

The build pipeline discovers publishable posts only from `packages/blog/posts`.
Files here can be committed without entering generated site output, RSS, sitemap,
`llms.txt` or `.md` endpoints. Archived manuscripts, research and exact prompt
records remain at their existing paths to preserve history and links.

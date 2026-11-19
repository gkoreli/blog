# November 19 — OSS Radar #16 publication

November 19, 2026, Pacific. The issue was prepared for a one-time release on November 19. The November 23 date in the [earlier preview](08-review-and-readiness.md) was the original target. The [maintained article source](../../../posts/048-oss-radar-16-saved-skills-and-inbox-replies.md) and [research copy](article.md) use the actual release date and the planned canonical slug.

## Editorial and local acceptance

The [release fieldwork](09-thursday-release-fieldwork.md) adds the GoDoxy config reload and expiration controls, the Hermes chat CLI preload comparison, and the current NemoClaw pairing. The GoDoxy result leads the article. Its conclusion now distinguishes which record a reader can verify for a skill, reply, policy write, or alert.

The source SHA-256 is `734a0ce9c89557652524a1845b23291471d558c4a36f9a7667633e737eabb3a5`. The isolated preview used site base `157875e0681a1715503a0a2ffecbb91fc03f3a5a`, Node 24.14.1, and pnpm 9.15.4. Workspace typecheck, validation of 38 Markdown posts, and the production build of 49 posts passed. The publication manifest check found zero queued articles.

The [local preview receipt](results/preview-2026-11-19.json) covers the Radar archive, catalog, RSS, sitemap, Markdown, citations, discovery files, HTML, and the 1200 × 600 social card. Chrome rendered the date, title, and revised opening at desktop and mobile widths and at 320 pixels with JavaScript disabled. The approved source, deployment, and live representations are verified separately.

## Source delivery

Main accepted [`47a7c3ea`](https://github.com/gkoreli/blog/commit/47a7c3ea5be571c90572c4593343bda0cd633070). The existing [Cloudflare Workers build](https://github.com/gkoreli/blog/runs/135690590198) started at 16:00 UTC. The hosted weekly workflow reported `disabled_manually` at source delivery.

## Served acceptance

The [public article](https://gkoreli.com/oss-radar-16-saved-skills-and-inbox-replies) served the revised opening at 16:04:48 UTC. The ordinary RSS URL briefly returned the previous feed and refreshed during verification. The [live receipt](results/publication-live-2026-11-19.json) passed at 16:06:07 UTC using the normal URLs. The article has one H1, the intended canonical and November 19 date, and the four project sections. Explicit and negotiated Markdown matched the isolated build, as did the 1200 × 600 social image. The Radar index, posts catalog, RSS, sitemap, discovery files, CSL JSON, and BibTeX list the issue. Desktop, mobile, and 320-pixel browser checks passed with JavaScript disabled.

The Workers build check was still marked in progress when read after served acceptance. GitHub confirmed the automatic publisher is disabled. The scheduler manifest has zero entries. Next preparation work is the source mix for issue #17.

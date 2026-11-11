# User-Agent article: X publication

Published November 11, 2026, from **@GogaKoreli**, as one original post. X displays **6:59 AM Pacific**; exact publication seconds were not captured.

- **Status:** https://x.com/GogaKoreli/status/2120531937656000711
- **Article:** https://gkoreli.com/please-stop-misreading-user-agent
- **Copy:** [Exact approved text](copy.md), 271/280 weighted characters. The composer independently showed nine characters remaining.
- **Presentation:** Text and native article card. The card displays the approved article title and generated image. No video, uploaded attachment, thread or additional reply was published.

## Acceptance

The signed-in X composer identifies Goga Koreli. After the authorized Post action, X reports that the post was sent and supplies the canonical status link. Opening that status verifies both paragraphs and the matching article card.

At **2026-11-11 15:00:50 UTC** (07:00 Pacific), the official unauthenticated public oEmbed endpoint returns HTTP 200, author Goga Koreli, the expected opening and this status ID. This independently confirms public embed availability rather than relying only on the owner's page. The posted `https://t.co/wCjCLGYQQf` resolves with HTTP 200 to the exact canonical article URL.

Private operational checks and the status screenshot are retained under Git-ignored `packages/blog/worklog/user-agent-publication-2026-11-11/`: `x-public-checks.json`, `x-public-oembed.json` and `x-publication-proof.jpg`. No account export or raw browser log is committed.

## Measurement scope

This accepts publication, public embed availability and the article destination. A comparable account baseline, impressions, reactions, tracked clicks, reader contact and site-traffic effect have not been measured for this launch. No monitoring job or follow-up posting was requested or scheduled.

## Decision

- Keep: The approved result-led text, the nine-site scope and the working article link.
- Change next time: No change supported by this publication check.
- Evidence: Composer limit, canonical status, displayed article card, official public embed and resolved article URL.
- Confidence and confounders: Publication is verified; reception and causal effects remain unmeasured. Owner views and this verification are controlled activity.
- Article correction needed: No new defect found by these checks.
- Shared-skill change needed: No.

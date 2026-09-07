---
id: FLDR-0010
title: Newsletter Reliability and Bot Protection Worklist
created_at: '2026-09-07T05:07:50.125Z'
updated_at: '2026-09-07T05:35:43.241Z'
type: folder
---
Investigate the September 6, 2026 PDT subscription outage reported by Goga, establish the retained historical evidence, audit first-party browser error reporting, and decide whether Turnstile is proportionate for this newsletter. Keep production repair separate from the broader architectural decision. The immediate server evidence is Siteverify HTTP 400 with invalid-input-secret; this is not evidence that Cloudflare classified the reader as a bot. Count attempts and retained reports without inventing unique people or lost subscriptions. Preserve operational evidence privately and publish only sanitized findings. Develop an evidence-led article draft from the owned failure and the unresolved question; publication is a later editorial step. Research home: packages/blog/drafts/research/newsletter-reliability/.

## September 7 UTC checkpoint

Eight tasks, TASK-0123 through TASK-0130, track evidence, production credential repair, browser logging, durable server outcomes, abuse-control design, article development, subscription lifecycle correctness, and address recovery. Initial investigation, local reproductions and an unpublished article draft are available in [the research index](../../packages/blog/drafts/research/newsletter-reliability/00-investigation.md). [Recovery findings](../../packages/blog/drafts/research/newsletter-reliability/04-recovery.md): zero current pending rows or recovered addresses; no identities can be reconstructed from the five generic client reports. Provider history and full Worker history remain partly inaccessible with current credentials/UI access. Production repair is not yet verified.

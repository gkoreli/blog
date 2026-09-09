---
id: FLDR-0010
title: Newsletter Reliability and Bot Protection Worklist
created_at: '2026-09-07T05:07:50.125Z'
updated_at: '2026-09-09T01:12:21.833Z'
type: folder
---
Investigate the September 6, 2026 PDT subscription outage reported by Goga, establish the retained historical evidence, audit first-party browser error reporting, and decide whether Turnstile is proportionate for this newsletter. Keep production repair separate from the broader architectural decision. The immediate server evidence is Siteverify HTTP 400 with invalid-input-secret; this is not evidence that Cloudflare classified the reader as a bot. Count attempts and retained reports without inventing unique people or lost subscriptions. Preserve operational evidence privately and publish only sanitized findings. Develop an evidence-led article draft from the owned failure and the unresolved question; publication is a later editorial step. Research home: packages/blog/drafts/research/newsletter-reliability/.

## September 7 UTC checkpoint

Eight tasks, TASK-0123 through TASK-0130, track evidence, production credential repair, browser logging, durable server outcomes, abuse-control design, article development, subscription lifecycle correctness, and address recovery. Initial investigation, local reproductions and an unpublished article draft are available in [the research index](../../packages/blog/drafts/research/newsletter-reliability/00-investigation.md). [Recovery findings](../../packages/blog/drafts/research/newsletter-reliability/04-recovery.md): zero current pending rows or recovered addresses; no identities can be reconstructed from the five generic client reports. Provider history and full Worker history remain partly inaccessible with current credentials/UI access. Production repair is not yet verified.

## September 7 break checkpoint

Break handoff: [September 7 reliability checkpoint](../handoffs/2026-09-07-reliability-checkpoint.md) preserves the latest log recheck, credential/provider access limits, every repair task's next action, private evidence locations, and the related analytics deployment/acceptance state. TASK-0133 reconciles documentation; it does not complete the production repair tasks.

## September 8 PDT / September 9 UTC simplicity constraint

Goga wants a simple adopted capability for this personal blog. [TASK-0127's current scope](../tasks/TASK-0127-decide-whether-turnstile-is-proportionate-for-newsletter.md) recommends Buttondown's hosted signup, with its standard protections and confirmation. The next input is the newsletter's public URL; provider choice and completion tests remain open. The [earlier adoption steps](../../packages/blog/drafts/research/newsletter-reliability/03-protection-options.md#earlier-managed-service-recommendation) supersede building multiple custom alternatives. Reassess TASK-0124, the newsletter-specific portion of TASK-0126, and TASK-0129 against the migration; keep their findings and do not mark them complete before repair or verified retirement. General client logging, diagnostic-ingestion protection, and historical address recovery remain unfinished. Six exact shaping prompts and the unpublished draft are preserved; production signup has not been repaired by this documentation update.

## Follow-up: simplicity allows owning the platform

Goga questioned why a public signup POST requires outsourcing. It does not. The agent's Buttondown recommendation above was not a selected migration. [Current scope](../../packages/blog/drafts/research/newsletter-reliability/03-protection-options.md#current-scope-simple-signup-on-our-existing-platform): keep the existing platform, reuse the parallel repair receipt recorded in TASK-0124, and fix specific remaining subscription and logging defects. Provider migration is optional, and no Buttondown URL is required. The statement that signup was still unrepaired was outdated: the owner has reported a repair in another session, whose end-to-end acceptance has not been inspected here. Seven shaping prompts are preserved; no production query, email, or runtime change was made in this clarification.

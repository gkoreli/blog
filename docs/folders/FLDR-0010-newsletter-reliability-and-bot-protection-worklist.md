---
id: FLDR-0010
title: Newsletter Reliability and Bot Protection Worklist
created_at: '2026-09-07T05:07:50.125Z'
updated_at: '2026-09-09T02:14:45.735Z'
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

## Subscription-bombing implementation — September 9 UTC

Current work is indexed in [00-worklist-index.md](../../packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md). Goga explicitly requested implementation on the existing platform and an engineering article in parallel. TASK-0137 adds shared atomic D1 confirmation admission; TASK-0126 covers durable outcomes plus still-open diagnostic-ingestion work; TASK-0129 covers token/suppression lifecycle. Keep Turnstile, D1 and Resend, with no managed-provider migration, queue or custom ORM. The numerical limits, retained data, failure policy and rollout order are in [09-design-and-implementation.md](../../packages/blog/drafts/research/newsletter-reliability/09-design-and-implementation.md).

The article and all new research Markdown remain in that directory, outside posts/. Nine complete shaping prompts include the ORM question. Local results: 37 server regressions, 25 client regressions and actual local workerd D1 concurrency/rollback checks pass; [10-verification.md](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md) owns later integration/activation/live-email receipts. Do not infer production signup acceptance or recovered addresses from these checks.

## Committed implementation and partial live acceptance — September 9 UTC

Code `86dad93` is committed and pushed; final combined checks pass (100 blog tests, all workspace typechecks, production build). Migration 0005 is applied. Version e8c69b0d-3174-4e8f-a3f9-5788f2868686 was activated at 100%, and four bounded live HTTP checks verified the changed guards/copy. This is not complete signup acceptance: a designated recipient is still needed, and the missing production webhook signing-secret connection is TASK-0142. Exact results, known access limits and next actions are in [14-handoff.md](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md). Do not repeat the migration or rotate a verifier key from old incident evidence.

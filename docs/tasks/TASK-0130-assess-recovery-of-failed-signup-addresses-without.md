---
id: TASK-0130
title: >-
  Assess recovery of failed signup addresses without reactivating unconfirmed
  readers
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:24:39.544Z'
updated_at: '2026-09-09T03:02:05.370Z'
type: task
---
P0 historical recovery. Reuse the saved D1 census, full-column client-error recheck, Resend read-access rejection and D1 bookmark result; no broad database rescan is needed to resume. Requests rejected before persistence differ from stored pending subscriptions whose confirmation failed or expired. The remaining lead is authorized access to retained provider/Worker history or an existing export. Never infer an address from IP, UA or analytics, activate an unconfirmed address, or send recovery mail without authorization. A D1 restore cannot reconstruct a request never written and would overwrite this shared production database; do not perform a speculative rollback. Keep any recovered addresses and consent/suppression evidence private. The September 9 test used an explicitly authorized existing address and recovered no historical subscriber.

## Investigation checkpoint

Current result: zero recovered addresses and zero pending rows. Inspected verification rejection precedes any subscriber write or email-provider call. Resend email/log reads returned 401 restricted_api_key; history not retrieved. D1 bookmark lookup succeeded but historical rows were not inspected; no restore performed. Existing private captures archived outside Git with owner-only permissions. No recipients inferred from UA/IP and no mail sent or address activated. Detailed evidence and next step: packages/blog/drafts/research/newsletter-reliability/04-recovery.md.

## September 7 break checkpoint

Full-column recheck completed at 06:11 UTC: all 13 client-error records, including referrer/stack columns, contain no address-like text. This rules out an address in the inspected fields, not every historical provider or Worker record. Resend read access and native dashboard access remain unavailable. No addresses recovered or activated; no mail sent. The capture is archived privately with a public aggregate and hash in recovery-log-recheck.json. Resume from docs/handoffs/2026-09-07-reliability-checkpoint.md.

## Current resume point — September 9 UTC

Historical recovery still found zero addresses in the inspected evidence. The live test's known authorized address is not a recovery. Access observations in earlier checkpoints are dated: recheck the availability of the specific retained history when resuming, not the entire database. Current operational state and private capture locations are in [14-handoff.md](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md).

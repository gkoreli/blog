---
id: TASK-0130
title: >-
  Assess recovery of failed signup addresses without reactivating unconfirmed
  readers
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:24:39.544Z'
updated_at: '2026-09-07T06:31:22.991Z'
type: task
---
P0 investigation prompted by Goga's recovery question. Distinguish requests rejected before persistence from pending subscriptions whose confirmation failed or expired. Re-check current D1 tables; inspect available Resend sent-email/API logs for actual confirmation attempts; identify existing exports and supported D1 historical recovery. Never infer an email from IP, UA or analytics, never mark an unconfirmed address active, and never send recovery mail without explicit authorization. D1 Time Travel can restore previously stored data, not a request that was never written; current provider docs describe an in-place overwrite, so no speculative production rollback. Keep any recovered addresses private and preserve status/consent evidence. Document recoverable count, provenance, limitations, and a concrete next step for the friend.

## Investigation checkpoint

Current result: zero recovered addresses and zero pending rows. Inspected verification rejection precedes any subscriber write or email-provider call. Resend email/log reads returned 401 restricted_api_key; history not retrieved. D1 bookmark lookup succeeded but historical rows were not inspected; no restore performed. Existing private captures archived outside Git with owner-only permissions. No recipients inferred from UA/IP and no mail sent or address activated. Detailed evidence and next step: packages/blog/drafts/research/newsletter-reliability/04-recovery.md.

## September 7 break checkpoint

Full-column recheck completed at 06:11 UTC: all 13 client-error records, including referrer/stack columns, contain no address-like text. This rules out an address in the inspected fields, not every historical provider or Worker record. Resend read access and native dashboard access remain unavailable. No addresses recovered or activated; no mail sent. The capture is archived privately with a public aggregate and hash in recovery-log-recheck.json. Resume from docs/handoffs/2026-09-07-reliability-checkpoint.md.

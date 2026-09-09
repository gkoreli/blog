---
id: MEMO-0104
title: Bound subscription confirmation sending with atomic D1 admission
parent_id: FLDR-0010
created_at: '2026-09-09T02:48:13.313Z'
updated_at: '2026-09-09T02:50:29.712Z'
type: memory
layer: episodic
source: codex
entity_refs:
  - TASK-0137
tags:
  - task
  - completion
---
September 9 UTC: the authorized live subscription completed after repairing the production Turnstile secret binding. One confirmation reached Gmail Spam; its POST activated the address. Implementation 86dad93 passed the combined local checks. Read [the live receipt](../../packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md) before repeating work. TASK-0145 tracks Spam placement; TASK-0142 still needs the signed provider-event connection. This is one completed test, not continuous availability or historical address recovery.

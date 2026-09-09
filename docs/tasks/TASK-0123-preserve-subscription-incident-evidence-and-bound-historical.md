---
id: TASK-0123
title: Preserve subscription incident evidence and bound historical impact
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.651Z'
updated_at: '2026-09-09T03:02:05.469Z'
type: task
---
P0 historical investigation. Reuse the saved September 7 client-error census, subscriber/delivery aggregates, April ADR/Git review and bounded recovery recheck; do not repeat a broad D1 scan on resume. The remaining lead is authorized access to any still-retained Worker history for the recorded incident windows. Inspect request outcomes and reasons only if that history is available. Correlate requests privately where possible; shared UA/network is not a person identifier. Preserve exact windows, retention/sampling/truncation, revision and sanitized counts. Five retained signup reports establish reports, not five people or the full number of attempts.

## Investigation checkpoint

September 7 UTC checkpoint: retained D1 census, daily sampled zone queries, earlier ADR/Git review, and private evidence preservation completed. Findings and coverage limits: packages/blog/drafts/research/newsletter-reliability/01-evidence.md. Full retained Worker history remains unavailable: telemetry API returned 403 and native dashboard access later failed. Five client reports do not identify five people.

## September 7 break checkpoint

Break checkpoint: the later 06:11:07 UTC read inspected every column of all 13 retained client-error rows. It returned the same 5 signup reports, no address-like text, and no request-body column, with 13 reads and 0 writes. Full retained Worker history is still inaccessible. See packages/blog/drafts/research/newsletter-reliability/recovery-log-recheck.json and docs/handoffs/2026-09-07-reliability-checkpoint.md.

## Current resume point — September 9 UTC

The reliability repair and one authorized test are complete, separately from this incomplete historical impact review. [14-handoff.md](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md) owns current state. Earlier access failures and retained counts describe their capture dates; do not count the new controlled test as another affected reader or as recovered historical evidence.

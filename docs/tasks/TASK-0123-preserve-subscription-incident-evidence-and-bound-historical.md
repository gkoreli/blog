---
id: TASK-0123
title: Preserve subscription incident evidence and bound historical impact
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.651Z'
updated_at: '2026-09-07T05:33:54.177Z'
type: task
---
P0 investigation. Query all retained client_errors plus subscriber/delivery aggregates without exporting emails or tokens publicly. Inspect the full retained Workers window for POST /api/subscribe outcomes, structured Turnstile reasons, newsletter email errors, and other Worker failures. Correlate individual requests privately where possible; shared UA/network is not a person identifier. Investigate the April 11 incident described in ADR-0011 and Git history, keeping reported history separate from raw telemetry. Save exact query windows, retention/sampling/truncation, source revision, and sanitized counts in packages/blog/drafts/research/newsletter-reliability/. Completion means the observed/reported/unknown distinction answers whether other failed attempts or other people can actually be established.

## Investigation checkpoint

September 7 UTC checkpoint: retained D1 census, daily sampled zone queries, earlier ADR/Git review, and private evidence preservation completed. Findings and coverage limits: packages/blog/drafts/research/newsletter-reliability/01-evidence.md. Full retained Worker history remains unavailable: telemetry API returned 403 and native dashboard access later failed. Five client reports do not identify five people.

---
id: TASK-0124
title: >-
  Restore subscription verification and distinguish configuration failures from
  reader failures
status: open
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.705Z'
updated_at: '2026-09-07T05:33:54.240Z'
type: task
---
P0 production repair. Current evidence: Siteverify HTTP 400 invalid-input-secret for the production widget; deployed Worker secret TURNSTILE_SECRET_KEY requires correction against the matching Turnstile widget. Do not disable verification merely to conceal this incident. Validate credential configuration without writing secret values to output; then perform an authorized end-to-end signup and confirmation, checking D1 and email delivery. Separate invalid/missing secret and verifier outages (service/configuration failures, 5xx with actionable service message) from invalid/expired user tokens, rate limiting, and email delivery problems. Add focused regression coverage and a deployment verification procedure so a homepage GET cannot be mistaken for signup health. Completion requires observed successful signup/confirmation, not only an accepted deployment.

## Investigation checkpoint

Credential checkpoint: existing ignored local secret produced invalid-input-response (HTTP 200) on a synthetic Siteverify request, suggesting a recognized credential. Widget GET returned 403, so the local secret's match to the live widget is unverified. No production secret changed and no real signup/confirmation test performed. See packages/blog/drafts/research/newsletter-reliability/04-recovery.md.

---
id: TASK-0124
title: >-
  Restore subscription verification and distinguish configuration failures from
  reader failures
status: open
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.705Z'
updated_at: '2026-09-09T01:03:18.927Z'
type: task
---
The September 7 investigation recorded Siteverify HTTP 400 invalid-input-secret for the production widget. Goga now reports repairing signup; see the dated update below. This task remains open for the repair's acceptance evidence or verified retirement through the [managed newsletter adoption](TASK-0127-decide-whether-turnstile-is-proportionate-for-newsletter.md), not an assumption that the original fault persists. Completion requires observed successful signup/confirmation, not only an accepted deployment.

If the custom flow remains in use, validate credential configuration without writing secret values to output, then perform an authorized end-to-end signup and confirmation, checking D1 and email delivery. Separate invalid/missing secret and verifier outages (service/configuration failures, 5xx with actionable service message) from invalid/expired user tokens, rate limiting, and email delivery problems. Add focused regression coverage and a deployment verification procedure so a homepage GET cannot be mistaken for signup health. Do not disable verification merely to conceal the original incident.

## Investigation checkpoint

Credential checkpoint: existing ignored local secret produced invalid-input-response (HTTP 200) on a synthetic Siteverify request, suggesting a recognized credential. Widget GET returned 403, so the local secret's match to the live widget is unverified. No production secret changed and no real signup/confirmation test performed. See packages/blog/drafts/research/newsletter-reliability/04-recovery.md.

## Owner repair update and subscriber check — September 9 UTC

Goga reports that he fixed signup in parallel and believes the fix preceded article 024's HN traffic spike. Treat the earlier invalid-secret capture as historical, not proof that another secret repair is currently needed. The exact activation and full-window availability were not independently verified in this session; reuse the repair session's receipt for that acceptance detail.

At 00:54:02 UTC, an aggregate query found one active subscriber from April 8, zero current pending rows, and zero retained creations or confirmations since the September 7 05:13:22 UTC HN submission. The check read one row and wrote zero; it selected no addresses or tokens and sent no email. Expired pending records and pre-persistence failures prevent an all-time attempt count. See [publication follow-up](../../packages/blog/drafts/research/article-024-hacker-news/04-publication-learning.md) and its measured JSON. This verifies subscriber state, not an end-to-end signup or a new production repair.

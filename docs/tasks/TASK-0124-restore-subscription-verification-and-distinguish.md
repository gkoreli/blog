---
id: TASK-0124
title: >-
  Restore subscription verification and distinguish configuration failures from
  reader failures
status: done
parent_id: FLDR-0010
evidence:
  - >-
    Implementation 86dad93, final 100-test suite/typechecks/build and actual
    local workerd D1 receipt in 10-verification.md.
  - >-
    Authorized live signup, secret-binding repair, provider acceptance, Gmail
    Spam receipt and final active state:
    packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md.
    TASK-0142 and TASK-0145 retain the separate unfinished operational work.
created_at: '2026-09-07T05:09:30.705Z'
updated_at: '2026-09-09T02:48:13.066Z'
type: task
---
The September 7 investigation recorded Siteverify HTTP 400 invalid-input-secret for the production widget. Goga subsequently reported repairing signup. The authorized September 9 live test then exposed a fresh invalid-secret failure; installing the existing recognized secret in the production Worker repaired verification and the complete subscription flow passed. The [current protection decision](TASK-0127-decide-whether-turnstile-is-proportionate-for-newsletter.md) keeps the owned platform. Acceptance below records observed confirmation and activation, not only deployment. Historical availability remains unknown; Gmail Spam placement is a separate open issue.

If the custom flow remains in use, validate credential configuration without writing secret values to output, then perform an authorized end-to-end signup and confirmation, checking D1 and email delivery. Separate invalid/missing secret and verifier outages (service/configuration failures, 5xx with actionable service message) from invalid/expired user tokens, rate limiting, and email delivery problems. Add focused regression coverage and a deployment verification procedure so a homepage GET cannot be mistaken for signup health. Do not disable verification merely to conceal the original incident.

## Investigation checkpoint

Credential checkpoint: existing ignored local secret produced invalid-input-response (HTTP 200) on a synthetic Siteverify request, suggesting a recognized credential. Widget GET returned 403, so the local secret's match to the live widget is unverified. No production secret changed and no real signup/confirmation test performed. See packages/blog/drafts/research/newsletter-reliability/04-recovery.md.

## Owner repair update and subscriber check — September 9 UTC

Goga reports that he fixed signup in parallel and believes the fix preceded article 024's HN traffic spike. Treat the earlier invalid-secret capture as historical, not proof that another secret repair is currently needed. The exact activation and full-window availability were not independently verified in this session; reuse the repair session's receipt for that acceptance detail.

At 00:54:02 UTC, an aggregate query found one active subscriber from April 8, zero current pending rows, and zero retained creations or confirmations since the September 7 05:13:22 UTC HN submission. The check read one row and wrote zero; it selected no addresses or tokens and sent no email. Expired pending records and pre-persistence failures prevent an all-time attempt count. See [publication follow-up](../../packages/blog/drafts/research/article-024-hacker-news/04-publication-learning.md) and its measured JSON. This verifies subscriber state, not an end-to-end signup or a new production repair.

## Committed implementation and partial live acceptance — September 9 UTC

Code `86dad93` is committed and pushed; final combined checks pass (100 blog tests, all workspace typechecks, production build). Migration 0005 is applied. Version e8c69b0d-3174-4e8f-a3f9-5788f2868686 was activated at 100%, and four bounded live HTTP checks verified the changed guards/copy. This is not complete signup acceptance: a designated recipient is still needed, and the missing production webhook signing-secret connection is TASK-0142. Exact results, known access limits and next actions are in [14-handoff.md](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md). Do not repeat the migration or rotate a verifier key from old incident evidence.

## Completed live acceptance — September 9, 02:38 UTC

The owner-designated address completed the real flow after a fresh production verifier-binding repair: valid browser challenge, ordinary unsubscribe/re-subscribe of the existing active row, one provider-accepted confirmation, receipt in Gmail Spam, GET preview with pending state preserved, and POST activation. Final D1 checks show active state, preserved original creation/opt-out values, and revoked confirmation hash. No direct SQL repair, extra test recipient or historical address recovery occurred. Seven direct diagnostic statements reported seven reads and zero writes, excluding Worker endpoint work. [Exact receipt and runtime versions](../../packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md).

TASK-0145 tracks Spam placement and sender authentication investigation; TASK-0142 tracks the still-unconnected signed bounce/complaint events. General diagnostic ingestion/alerts remain open. These limits do not prevent completing this task's implemented and observed acceptance criteria.

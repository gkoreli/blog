# Subscription bombing: implementation and article worklist

Started September 8 PDT / September 9 UTC, 2026. Backlog container: [FLDR-0010](../../../../../docs/folders/FLDR-0010-newsletter-reliability-and-bot-protection-worklist.md). This directory is the canonical worklist folder for all research Markdown, the evolving article, and verification evidence. Existing incident artifacts stay here with their original dates and limits.

Goga asked to build the protection on his own platform and write **Subscription Bombing: How I Protect My Blog** in parallel. The incident that prompted the work was a verifier-secret failure; it is not evidence of an observed subscription-bombing attack. A separate session records an owner-reported signup repair. Reuse that receipt rather than assuming the old failure continues.

## Active implementation

| Work | Task | Acceptance |
|---|---|---|
| Atomic confirmation admission across signup and resend | TASK-0137 | Same-address and aggregate limits survive concurrency; no mail without a reservation |
| Bounded provider calls and honest outcomes | TASK-0126 | Stable retry key/body, accepted/failed/unknown evidence, no addresses or tokens in ordinary diagnostics |
| Confirmation, resubscription, and suppression | TASK-0129 | Rejected attempts preserve links; opt-outs survive resubscription; invalid links never claim activation |
| Browser verification and request failures | TASK-0125 | Late widget, errors, timeout, expiry, unsupported browser, and network failures leave a reported, usable retry state |
| Proportionate protection decision | TASK-0127 | Keep the existing platform; document limits, remaining abuse, and operator action |
| Reconcile production signup acceptance | TASK-0124 | Separate owner report, deployed code, schema, and a designated recipient's complete flow |
| Engineering article and evidence ledger | TASK-0128 | Write alongside implementation; every material claim matches its evidence stage |
| Connect provider bounce/complaint events | TASK-0142 | Inspect existing Resend endpoints, install the missing signing-secret binding privately, verify a signed event |

The implemented starting policy is one confirmation admission per normalized address per ten minutes, at most three per address in a rolling 24 hours, and aggregate ceilings of 25 per rolling hour and 100 per rolling 24 hours. These are blog policy values, not measured safe thresholds or a statement of the current Resend account quota. Failed and ambiguous attempts stay charged. Native per-IP limiting and Turnstile remain additional controls. No attack traffic will be sent to production. [10-verification.md](10-verification.md) separates local results, migration, deployment and live-email acceptance.

## Artifact map

| File | Role |
|---|---|
| [00-investigation.md](00-investigation.md) | Original question, dated checkpoints, and evidence boundaries |
| [01-evidence.md](01-evidence.md) | Sanitized incident captures and historical limits |
| [02-client-audit.md](02-client-audit.md) | Original browser/server failure reproductions |
| [03-protection-options.md](03-protection-options.md) | Ownership and protection choices, including rejected migration assumption |
| [04-recovery.md](04-recovery.md) | Address-recovery checks and inaccessible histories |
| [05-prior-art-2026.md](05-prior-art-2026.md) | Original rationale and wider prior art |
| [06-article-passport.md](06-article-passport.md) | Article center, form, reader job, and protected material |
| [07-source-ledger.md](07-source-ledger.md) | Current primary sources and their limits |
| [08-claims-ledger.md](08-claims-ledger.md) | Proposed, inspected, reproduced, and observed claims |
| [09-design-and-implementation.md](09-design-and-implementation.md) | Current schema, mechanisms, tradeoffs, and rollout order |
| [10-verification.md](10-verification.md) | Exact checks, results, and remaining production acceptance |
| [11-adversarial-review.md](11-adversarial-review.md) | Independent failure analysis and subsequent diff review |
| [12-client-verification.md](12-client-verification.md) | Browser implementation and controlled test receipt |
| [13-data-access-decision.md](13-data-access-decision.md) | ORM benefits, prepared-SQL tradeoffs, and scoped recommendation |
| [14-handoff.md](14-handoff.md) | Committed work, applied migration, partial live acceptance and exact next steps |
| [article.md](article.md) | Evolving unpublished engineering article |
| [source.prompts.md](source.prompts.md) | Complete shaping prompts in chronological order |
| `repro/` | Saved original probes and measured results; retain historical outputs unchanged |

Implementation and article development are concurrent. Runtime edits, article prose, and review artifacts have separate owners for this session. The parent integrates and verifies the combined result. Production queries, migrations, sends, and deployments are recorded separately; the article is not published merely because the implementation is pushed.

Latest checkpoint: implementation `86dad93` is committed and deployed; migration 0005 is applied. The final combined 100-test suite, typechecks and build pass. Full live signup still needs a designated recipient, and production webhook setup is missing. [Resume here](14-handoff.md). The original `repro/audit.mjs` and `repro/lifecycle.mjs` target the September 7 source and preserve historical failures; use the current regression suite and D1 probe for the new contract.

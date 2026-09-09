# Subscription bombing: active claims ledger

Created September 8 PDT / September 9 UTC, 2026; updated after the authorized live test. Governs the [article](article.md); source IDs refer to [07-source-ledger.md](07-source-ledger.md). Shared code, controlled tests, local D1, deployment and one complete live signup have evidence. The live test required a verifier-binding repair and received its message in Gmail Spam. Inbox placement, webhook setup and general diagnostic ingestion remain unfinished.

## Separate the stages

| Stage | Event | Evidence needed | Does not establish |
|---|---|---|---|
| Submission | A client made a request | Bounded request outcome and opaque identifier | A human visited, address ownership, every failed browser attempt |
| Admission | Server permits a send attempt | Verification and atomic allowance decision | Provider receipt |
| Pending state | Unconfirmed state persisted | D1 transition and operation identity | Newsletter consent |
| Provider acceptance | Resend accepted the operation | Valid success response and message ID | Inbox delivery |
| Recipient-server delivery | Destination mail server accepted mail | Retained provider event, if configured | Inbox placement or human reading |
| Activation | Intended confirmation transition occurred | Valid token and conditional state change | A distinct person or original requester identity |

## Claims

| ID | Claim | Stage / state | Evidence | Supports | Cannot prove / counterevidence | Disposition |
|---|---|---|---|---|---|---|
| C1 | The expanded September 7 rejection reported an invalid secret | Verification / observed | F1, S2 | Configuration failure for one request | Every report's cause, bot classification, attack | Keep date and singular observation |
| C2 | Five recent signup reports survived | Reporting / observed | F1 | Five stored reports | Five people or complete attempt count | Keep unit; omit lost-reader count |
| C3 | The inspected rejected path did not save the address | Persistence / code-inspected, capture-supported | F1, F3 | No recovery from a never-written row | No older provider record or other persisted attempt | Keep bounded |
| C4 | Owner reports a parallel signup repair | Operations / reported | F6 | Original fault is historical | Full-window availability or acceptance | Obtain repair receipt |
| C5 | Confirmation mail can participate in bombing | Pre-activation / primary documented | S1 | Abuse starts before activation | An attack on this blog, efficacy measurement | Keep distinct from our incident |
| C6 | A public signup can have bounded permission to send | Architecture / inference | S1–S8, implementation inspected | Identity and admission are different decisions | Universal safety or pre-send ownership proof | Keep bounded position |
| C7 | Native IP binding cannot establish exact global budget | Admission / primary documented | S3 | Need shared accounting for exact ceiling | An actual production overrun | Keep its coarse-throttle value |
| C8 | Signup and resend need common mail admission | Admission / inspected and inference | F7, S1 | Both cause the same side effect | An attack through resend | Design requirement |
| C9 | D1 admission uses one atomic batch | Admission / code-inspected and reproduced | S4, S5, F8, F12 | Actual local D1 reservation/upsert; forced subscriber-write failure rolls back | Remote deployment or every race/failure | Keep local-runtime boundary |
| C10 | Both modes share rolling admission limits | Admission / code-inspected and reproduced | F8, F12, F13 | One of 48 store calls and one of 20 handler calls admitted per address in respective fixtures; rolling caps hold | Distributed live HTTP, deployment, historical sends, campaign limits, inbox delivery | Name harnesses and shifted timestamps; count admitted operations |
| C11 | Provider retry reuses one operation/body | Sending / inspected and reproduced; provider documented | F9, F13, S6 | Two calls maximum, eight-second configured deadline each; same serialized body/key checked | Real timeout duration, live deduplication, permanent exactly-once, crash replay | Keep local/provider-contract distinction |
| C12 | Responses/logs distinguish failed or unknown sends and provider acceptance | Outcomes / inspected and reproduced | F9, F10, F13, S7 | Failed/unknown categories; charged reservation on write failure; 503 check-inbox; generic 202 retains form | Every 202 caused mail; every outcome/report arrives | Keep anti-enumeration/persistence caveats |
| C13 | Lifecycle distinguishes valid confirmation, renewed consent, and suppression | Lifecycle / inspected and reproduced | F9, F11, F13, F2 baseline | GET preview/POST activation, old-token cycle protection, stable opt-out, renewed consent, signed suppression | Deployed correctness or indefinite retention | Keep local test and retention boundary |
| C14 | Known widget/request failures get explicit safe reports | Reporting / reproduced | F10 | 25 controlled initializer tests; static stages; usable retry; stale callback guard | Actual browser/challenge success; logger durability | Keep controlled-harness boundary |
| C15 | This prevents subscription bombing | Security / unsupported | No efficacy result | Nothing at this scope | Many sites can each send one message; a challenge can be passed | Reject; bound our contribution |
| C16 | Provider ID proves receipt or reading | Delivery / unsupported | S7 | Provider acceptance only | Inbox placement, reading, consent | Reject |
| C17 | A limits hit proves malicious intent | Classification / unsupported | No labeled population | Allowance exhausted | A legitimate burst can do the same | Reject; name outcome, not bot |
| C18 | Existing platform is the chosen scope | Architecture / owner-directed | F5 and build instruction | Work proceeds without migration | Universal case against hosted services | Keep correction plainly |
| C19 | Suppression prevents new admitted confirmations while retained | Admission / inspected and reproduced | F8, F9, F13 | Explicit block/bounce/complaint/legacy-inactive prevents admission in stored-state tests | Permanent block after 90d inactive cleanup or recall of already-admitted mail | Keep retention and in-flight boundary |
| C20 | GET-only prefetch cannot activate a pending subscriber | Confirmation / inspected and reproduced | F9, F13 | GET preserves pending state; POST executes the valid transition | A human clicked, or all scanners use only GET | Keep precise request-method claim |
| C21 | Legacy imported token hashes preserve compatibility | Migration / inspected and reproduced | F8, F13 | Imported and rollout-era old hashes remain usable through original expiry; excluded from new budget | Historical provider sends or a full previous rolling day's cap | Keep activation-era limit boundary |
| C22 | 25 admitted operations can make 47 provider requests | Unit / reproduced | F13 | One failure-heavy fixture retries 22 unknown operations once | 47 delivered messages or violation of a 25-admission budget | Use when explaining policy unit and retries |
| C23 | The September 9 live attempt hit an invalid-secret failure; installing the existing recognized secret repaired verification | Verification / observed | F14, S2, S9 | Current 503 reason, secret deployment and subsequent successful real challenge | Original secret value, who set it, continuous historical outage | Keep this fresh evidence separate from the earlier owner report |
| C24 | One authorized subscription completed after ordinary unsubscribe and re-subscription | Lifecycle / observed | F14 | Real challenge, accepted send, received email, GET remains pending, POST becomes active; original creation and opt-out token preserved | Every browser, production concurrency bounds, live signed suppression, old-address recovery | Promotes this one lifecycle path to live acceptance; other cases retain local-test scope |
| C25 | Gmail placed the test confirmation in Spam | Mailbox / observed | F14 | One matching message and Gmail's displayed folder/explanation | Spam cause, general placement rate, authentication pass from DNS alone | Retain as counterevidence; TASK-0145 follows up |

## Implementation evidence to attach

- Exact allowance units/windows, address normalization, shared counters, and fixed-window/alias limits where relevant.
- Actual schema, admission SQL, transaction results, and what happens when admission or its acknowledgement fails.
- Provider operation identity/payload, timeout/errors, retry bound, and surviving state after ambiguous sends.
- New/pending/active/unsubscribed/bounced/invalid-token/expired-token transitions, concurrent requests, preserved suppression.
- Reader messages and recovery/reporting; addresses, tokens, provider bodies and sensitive URLs excluded from ordinary diagnostics.
- Applicable-runtime local tests, code revision, separate migration/deployment/acceptance receipts. A stub is not a real-provider test.

The [parallel adversarial review](11-adversarial-review.md) also requires preserving earlier valid confirmation links when a resend fails, preventing old links from activating a later subscription cycle, distinguishing ordinary opt-out from complaint/bounce suppression, and naming any reservation-only crash-recovery limit. These are design/test requirements; do not describe a send ledger without a reconstructible payload as an outbox.

## Acceptance boundary

Local implementation is inspected. The 25 controlled client cases and source typecheck passed. The 37 server tests passed against actual handlers/migrations with Node v24.14.1 and SQLite 3.51.2; provider responses and the limiter are fixtures. Actual local workerd D1 separately passed fresh migrations, concurrency, rolling-cap, and forced-rollback checks at September 9 01:47:23.908 UTC using Miniflare 4.20260301.1. Those store calls and handler tests advance windows by shifting timestamps, not real elapsed hours. Release revision and deployment are recorded below; designated-recipient acceptance remains pending; the draft stays outside `posts/`. The captured incident and owner's earlier repair report remain separate facts.

The source policy uses literal trimmed/lowercased addresses, not mailbox identity. Failed/unknown attempts stay charged; legacy token rows are excluded. Seven-day attempt retention outlasts the rolling-day budget, while the existing 90-day inactive cleanup means suppression and old opt-out links are not permanent. No saved replay payload means no outbox recovery. Already-admitted mail can complete after opt-out. Known browser reports still depend on the shared logger transport/ingestion, which this change does not repair.

Record the cost if limits delay a reader. Preserve reports of unwanted confirmations even if local bounds held. The useful result is a small inspectable control with explicit failures; it is not elimination of abuse.

## Parent integration update

Code commit `86dad93` passed the final combined 100-test blog suite (39 server, 25 client), workspace typechecks and production build. Two final provider-rate-limit cases extend the original 37-case server receipt: wait for a short retry-after and preserve operation identity; stop inline retries for a longer wait. Migration 0005 is applied, with the import and read-work receipt in [10-verification.md](10-verification.md). Do not infer live challenge or mailbox completion from the code commit or schema change.

## Production boundary update

The code is deployed at the version recorded in [10-verification.md](10-verification.md); four bounded live HTTP checks passed without a valid proof or real recipient. C9–C14 and C19–C21 still rely on local tests for concurrency, successful sending, token transitions and suppression. In particular, deployment metadata lacks RESEND_WEBHOOK_SECRET and the provider dashboard is signed out: live bounce/complaint handling is not connected. Do not promote local signed-event tests into production acceptance.

## Authorized-recipient update

The preceding boundary describes the 02:10 UTC checkpoint. [F14](15-live-signup-acceptance.md) adds one successful real challenge, accepted confirmation, Gmail receipt and complete ordinary re-subscription cycle, including the GET/POST distinction in C20. It leaves concurrency, retry deduplication, all other browsers and signed provider-event suppression under their previous evidence limits. C23–C25 preserve the newly observed configuration failure and Spam placement instead of turning completion into an unconditional reliability claim.

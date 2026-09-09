# Subscription-bombing checkpoint — September 9, 2026 UTC

The implementation is committed as `86dad93` and pushed to main. The [authorized live signup](15-live-signup-acceptance.md) completed at 02:38 UTC after repairing a newly observed invalid-secret failure in the production Turnstile binding. One confirmation arrived in Gmail Spam; the address is active again. It keeps the existing Worker, D1, Resend and Turnstile. No provider migration, queue or ORM was added. The article is written and remains unpublished outside `posts/`.

## Completed evidence

- Final isolated integration: 100 blog tests pass, including 39 server and 25 client cases; all workspace typechecks and the 25-post production build pass.
- Actual local workerd D1 checks the fresh migrations, concurrent address/global limits and rollback. The fixture shifts timestamps and never sends email.
- Newsletter migration 0005 is **already applied** in production. Do not repeat it. Preflight used 35 reads; the seven-query import reported 44 reads and seven writes. These are read-work units, not subscribers. Exact private receipts and scope are in [10-verification.md](10-verification.md).
- Deployment `6214b171-fd5d-44a8-8abc-8d1f8e56c3fd` activated version `e8c69b0d-3174-4e8f-a3f9-5788f2868686` at 100% at 02:07:43 UTC. Metadata has no commit annotation. Four bounded live HTTP checks match the changed routes and copy; they do not establish email delivery or complete signup.
- The 02:26 browser request returned 503 / `invalid_secret`. Installing the existing local secret activated version `cb0c95ff-9409-402b-9999-1aa16d43bc89` at 02:32:24. A fresh real challenge succeeded, and the next code version `7501d89c-c3ac-4b05-9ec3-748eb4d0a800` accepted the authorized confirmation at 02:34:59. The test preserved the original subscriber creation time and unsubscribe token. Final D1 state is active; no direct SQL repair was needed.
- Gmail contained one matching message in Spam. Its link opened a preview without activating; the button POST activated. Seven targeted diagnostic statements consumed seven reads and zero writes, excluding Worker endpoint work. The exact address, tokens and full captures stay private. The live Worker tail is stopped.
- All research Markdown, the draft, source/claim ledgers, nine exact shaping prompts and test receipts are in this folder. Start at [00-worklist-index.md](00-worklist-index.md). Historical incident captures and probe results retain their original dates.

## Concrete remaining work

| Task | State and next bounded action |
|---|---|
| TASK-0124 / TASK-0137 | Acceptance completed. Read the live receipt before any repeat test or key change; no new test is needed merely to resume work |
| TASK-0145 | One Gmail confirmation landed in Spam. Inspect the retained message's authentication results and provider sender-domain settings. The local resolver returned no DMARC TXT answer; SPF/DKIM records exist, but message authentication and the Spam cause remain unverified |
| TASK-0142 | Production metadata lacks `RESEND_WEBHOOK_SECRET`. Resend's dashboard redirects the existing Chrome session to login. Sign into the existing provider account, inspect existing webhooks, configure bounce/complaint delivery and install its signing secret privately; verify a signed event. Do not claim live suppression processing from fixture tests |
| TASK-0125 / TASK-0126 | The component's reporting/retry fixes pass. General diagnostic-ingestion byte limits, server sanitization, admission limits, acknowledgement/transport behavior and configuration-failure review/alerts remain unfinished |
| TASK-0129 | Lifecycle acceptance completed with the live ordinary unsubscribe/re-subscribe, GET preview and POST activation. Signed provider-event setup remains TASK-0142. Suppression lasts only while the inactive record is retained, up to 90 days |
| TASK-0128 | Review the unpublished engineering draft. It includes actual implementation, local results, the completed live flow and Spam finding. Publication and any frozen research footprint are separate later steps |
| TASK-0130 | Historical provider and Worker history remain partly inaccessible. Reuse saved captures; do not repeat broad production scans or infer missing addresses from generic reports |

The server ledger keeps admitted addresses privately for seven days; it intentionally does not preserve addresses rejected before admission. It is not an outbox: no background crash replay or permanent exactly-once delivery is promised. The request/limit unit is an admitted confirmation operation; provider retries can create two API calls for that operation.

The owner explicitly designated the test recipient in this conversation; that authorization is preserved privately. The existing active address was used for a controlled cycle and left active. No other address was used, and no historical address was recovered. The Resend dashboard was signed out at the earlier check; no provider login or webhook creation occurred. Shared Chrome activity interrupted native UI actions, including original-message header inspection. Verify current state before interacting with a tab; do not mistake a delayed UI snapshot for a new failed request.

The isolated verification checkout is `/Users/goga/.local/share/gkoreli/worktrees/subscription-bombing-20260909`. It is disposable task state, with the existing public build site key only; runtime work is already committed. Preserve unrelated concurrent work in the main checkout. Active task statuses record work to resume, not a claim that an agent keeps running after the turn.

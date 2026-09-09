# Subscription-bombing checkpoint — September 9, 2026 UTC

The implementation is committed as `86dad93` and pushed to main. It keeps the existing Worker, D1, Resend and Turnstile, with shared confirmation admission, bounded provider retries, recoverable form states and corrected token/suppression handling. No provider migration, queue or ORM was added. The article is written and remains unpublished outside `posts/`.

## Completed evidence

- Final isolated integration: 100 blog tests pass, including 39 server and 25 client cases; all workspace typechecks and the 25-post production build pass.
- Actual local workerd D1 checks the fresh migrations, concurrent address/global limits and rollback. The fixture shifts timestamps and never sends email.
- Newsletter migration 0005 is **already applied** in production. Do not repeat it. Preflight used 35 reads; the seven-query import reported 44 reads and seven writes. These are read-work units, not subscribers. Exact private receipts and scope are in [10-verification.md](10-verification.md).
- Deployment `6214b171-fd5d-44a8-8abc-8d1f8e56c3fd` activated version `e8c69b0d-3174-4e8f-a3f9-5788f2868686` at 100% at 02:07:43 UTC. Metadata has no commit annotation. Four bounded live HTTP checks match the changed routes and copy; they do not establish email delivery or complete signup.
- All research Markdown, the draft, source/claim ledgers, nine exact shaping prompts and test receipts are in this folder. Start at [00-worklist-index.md](00-worklist-index.md). Historical incident captures and probe results retain their original dates.

## Concrete remaining work

| Task | State and next bounded action |
|---|---|
| TASK-0124 / TASK-0137 | Obtain an explicitly designated test address, then verify real challenge, provider acceptance, received email, GET preview and POST activation. No real address has been authorized or emailed in this implementation session |
| TASK-0142 | Production metadata lacks `RESEND_WEBHOOK_SECRET`. Resend's dashboard redirects the existing Chrome session to login. Sign into the existing provider account, inspect existing webhooks, configure bounce/complaint delivery and install its signing secret privately; verify a signed event. Do not claim live suppression processing from fixture tests |
| TASK-0125 / TASK-0126 | The component's reporting/retry fixes pass. General diagnostic-ingestion byte limits, server sanitization, admission limits, acknowledgement/transport behavior and configuration-failure review/alerts remain unfinished |
| TASK-0129 | Token, resubscription and suppression logic passes local tests. Reconcile live acceptance and the missing provider connection. Suppression lasts only while the inactive record is retained, up to 90 days |
| TASK-0128 | Review the unpublished engineering draft. It includes actual implementation and local results, the partial live check, and remaining setup. Publication and any frozen research footprint are separate later steps |
| TASK-0130 | Historical provider and Worker history remain partly inaccessible. Reuse saved captures; do not repeat broad production scans or infer missing addresses from generic reports |

The server ledger keeps admitted addresses privately for seven days; it intentionally does not preserve addresses rejected before admission. It is not an outbox: no background crash replay or permanent exactly-once delivery is promised. The request/limit unit is an admitted confirmation operation; provider retries can create two API calls for that operation.

The native Chrome app is accessible again. A Resend login tab was opened for the configuration check; no login, credential change or webhook creation was performed. The owner still needs to identify a test recipient. Do not use an address discovered in account metadata as authorization to send mail.

The isolated verification checkout is `/Users/goga/.local/share/gkoreli/worktrees/subscription-bombing-20260909`. It is disposable task state, with the existing public build site key only; runtime work is already committed. Preserve unrelated concurrent work in the main checkout. Active task statuses record work to resume, not a claim that an agent keeps running after the turn.

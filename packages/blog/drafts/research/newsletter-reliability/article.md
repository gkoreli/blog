# Subscription Bombing: How I Protect My Blog

Working engineering draft, updated September 8 PDT / September 9 UTC, 2026. The protection is committed and deployed. Controlled server/client tests, actual local D1 admission checks, and bounded live HTTP checks passed. Received email and completed signup remain unverified; the production webhook connection is still missing. The owner-reported earlier signup repair remains a separate checkpoint. Outside `posts/`; unpublished, with no release metadata.

A newsletter signup form lets someone ask my server to email an address they may not own. I want readers to subscribe to my personal blog, and I want to keep the platform I built. The new implementation puts shared limits before confirmation mail, preserves a usable retry after failure, and records which stage the request reached. It uses the Worker, D1 database, Resend, and Turnstile already in the blog.

- The first confirmation email needs abuse protection. Waiting for confirmation before newsletter delivery does not protect that first send.
- Signup and resend use the same database-enforced allowance. Different URLs or source IPs do not create separate mail budgets.
- Provider acceptance, mailbox delivery, and subscription activation remain different outcomes. The response and logs must not collapse them into “it worked.”

The limits are implemented and the changed routes are live. The concurrency results come from local fixtures, and a complete live signup still needs its own acceptance check. None of this establishes that subscription bombing has been eliminated.

## A friend could not subscribe

This investigation started with a failed legitimate signup. The server event I inspected reported `invalid-input-secret` from Cloudflare's verifier. My form told the reader to retry or allow bot protection in his browser. Neither could repair an invalid server credential. [Captured evidence](01-evidence.md), [Cloudflare's error definition](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

I asked whether anyone else had tried. The retained client logs contained five recent subscription error reports, but those were five reports, not five identified readers. Only one corresponding server event was expanded far enough to inspect that specific error code. The rejected path stopped before storing the submitted address or scheduling confirmation mail.

Then I asked whether we could recover the subscriptions. The inspected error records contained no addresses, and a database backup cannot reconstruct a value the request never wrote. Older attempts that reached the email provider remain a separate possibility: the credential available to the investigation could not read that history. I cannot turn that incomplete record into a count of people lost or addresses recovered. [Recovery record](04-recovery.md).

The failure that started this work was a configuration problem. It is not evidence that someone used my blog for subscription bombing.

## The first email is already a side effect

Subscription bombing exploits public forms to fill somebody else's inbox. In February 2026, the Swiss NCSC described attackers making legitimate websites send registration confirmations, sometimes to hide an important account warning among the flood. The messages can come from otherwise legitimate mail servers. [NCSC report](https://www.bacs.admin.ch/en/26w6-en).

Double opt-in requires confirmation before I activate a newsletter subscription. It still starts by sending an email to an address supplied by an unconfirmed requester. Someone who knows a victim's address can ask many websites to send that first message.

The endpoint being public is normal. Creating a blog account through email would begin with the same unconfirmed address. My server needs rules for what a request may cause before it knows whether the requester controls the mailbox.

Turnstile supplies one check before sending. The server must verify its token; a widget alone cannot enforce anything against a direct API request. Even successful verification does not establish ownership of the submitted address. [Server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

A per-address limit reduces repeated requests for the same address. Different aliases can still reach one inbox. An aggregate limit bounds this blog's contribution, but one unwanted confirmation from each of many websites can still become a flood. That is the limit of what my own form can prevent.

## Keeping my own platform is a reasonable constraint

I asked for a simple capability, and the agent recommended moving subscriptions to a hosted service. I pushed back: why couldn't I keep my own platform when the visible interaction was a button submitting an API request?

The original architecture is reasonable for this blog: a form, a Worker, D1 for subscription state, and Resend for mail. The April decision added Turnstile while shipping on the existing Cloudflare stack; invisible mode later kept the widget out of the visible design. Those records explain how it arrived. They do not establish that the entire flow was tested against the failures now in the worklist. [Recorded rationale and prior art](05-prior-art-2026.md).

A hosted service remains a valid way to delegate these responsibilities. My requirement was to keep the platform and fix what I already owned: permission to send, subscription state, and failure handling. The repair adds one confirmation-attempt table and shared request handling to the existing system. That is a scope I can reason about.

## Signup and resend use the same sending limits

Every new confirmation operation must reserve capacity in D1 before calling Resend. Both public routes call the same handler, including the same Turnstile verification. The former resend exception disappeared because it could cause the same email as signup. [Shared handler](../../../../newsletter/src/confirmation-request.ts).

This section is for someone implementing a similar flow. The existing per-IP binding remains a cheap request filter. Cloudflare documents it as location-local and eventually consistent, so it cannot establish an exact aggregate mail budget. The shared database makes that decision. [Binding semantics](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

The initial policy counts **admitted confirmation operations**, regardless of whether the provider later accepts them:

| Scope | Allowance |
|---|---|
| Same normalized address | At least 600 seconds between admissions |
| Same normalized address | At most 3 admissions in the preceding 24 hours |
| All addresses, signup and resend together | At most 25 admissions in the preceding hour |
| All addresses, signup and resend together | At most 100 admissions in the preceding 24 hours |

These are policy choices for my small blog, not measured safe thresholds or a statement of the provider's account quota. Normalization trims whitespace and lowercases the supplied address; it does not merge aliases. The aggregate limit still applies when several distinct addresses reach one mailbox.

The reservation insert, preservation of an older confirmation hash, pending-subscriber upsert, and returned decision share one D1 batch. The insert contains the limit and suppression predicates. A request that gets no reservation cannot mutate subscription tokens or call the provider. Reading a remaining count and incrementing only after sending would leave concurrent requests able to act on the same old count. [Admission implementation](../../../../newsletter/src/confirmation-store.ts).

D1 documents transactional batches with rollback on statement failure. I check the returned admission decision rather than treating a nonthrowing SQL call as permission to send. The actual statements also ran against local workerd D1 through Miniflare 4.20260301.1. [D1 contract](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch), [SQLite conflict behavior](https://www.sqlite.org/lang_conflict.html).

The recorded local fixture admitted one operation from 48 concurrent calls for the same address, alternating signup and resend modes. Four waves of 60 concurrent calls admitted 25 each, then rejected further admission at the 100-per-day ceiling. The fixture moved stored timestamps between waves; it did not wait four real hours. A trigger that deliberately failed the subscriber insert left no reservation behind. These are checks of the actual admission function and fresh migration path, with synthetic data and no email-provider calls. [Reproduction and result](repro/d1-admission-results.json), [executable fixture](repro/d1-admission.mjs).

Reserved, accepted, failed, and unknown operations all consume allowance. Refunding a timeout could allow another email even when the provider had accepted the first one. Records remain for seven days, beyond the longest accounting window. Imported old token hashes are compatibility records and do not claim a measured historical send. These limits cover operations admitted by the new code after activation; they do not retroactively count mail sent by an older deployment or cap newsletter campaigns.

## A retry reuses the same provider operation

The handler now waits for a bounded confirmation-send result. It records the admitted operation before contacting Resend, then attempts to store the outcome and provider message ID. This gives me something more useful than a successful browser response followed by an unobserved background failure.

The sender makes at most two provider requests, each with an eight-second deadline. A rate-limit response can add a wait of up to three seconds before the retry; a longer or malformed wait hint returns a retryable failure instead of retrying too early. [Provider rate-limit headers](https://resend.com/docs/api-reference/rate-limit). Both use the same serialized body and `newsletter-confirmation/<attempt-id>` idempotency key. Resend documents deduplication of that key and payload for 24 hours. The retry stays inside one admitted operation; a later fresh signup has to earn its own allowance. [Sender](../../../../newsletter/src/email.ts), [Resend contract](https://resend.com/docs/dashboard/emails/idempotency-keys).

I keep the stages separate:

| Evidence | What it establishes | What it leaves unknown |
|---|---|---|
| D1 reservation | This operation passed admission and counts against the limits | Whether the provider saw it |
| Valid Resend success and message ID | The provider accepted this operation | Inbox delivery or human reading |
| Provider delivery event, if separately retained | The recipient's mail server accepted the email | Inbox placement and consent |
| Valid confirmation POST and state transition | The pending subscription became active | Who submitted the original address |

Resend's `email.sent` and `email.delivered` events describe the provider stages in that table. The new local record captures API acceptance; it does not implement a complete delivery-event history. [Event definitions](https://resend.com/docs/webhooks/event-types).

The outcome can remain `unknown`. A timeout, malformed success response, or interrupted process cannot safely be turned into “nothing was sent.” If saving the outcome fails after provider acceptance, the reservation remains charged and that failure does not cause another send. The failed or unknown response asks the reader to check their inbox before trying again in ten minutes.

The local handler tests exercised these failure branches with synthetic provider responses. One case admitted 25 operations but made 47 provider API calls because 22 unknown operations retried once. That distinction matters: the policy counts admitted mail operations, not HTTP calls to Resend. The tests verify the same key and body on retries; Resend's actual deduplication and delivery remain separate provider behavior. [Server verification](10-verification.md).

This is deliberately a reservation ledger, without an outbox or background replay worker. The raw message payload is not saved for replay after a crash. An interrupted operation may need a fresh request after the cooldown. Requests rejected before admission still leave no saved recipient to recover. D1 and Resend do not share a transaction, and already-admitted mail can finish while an opt-out is being committed. I accept those limits to keep the implementation small, while refusing to pretend the uncertain operation never happened.

## Confirmation and suppression have different jobs

A confirmation link now opens a preview; a POST from its button activates the pending subscription. A GET-only email scanner cannot activate it just by fetching the link. This adds a button press for the reader, and it still does not authenticate a human. [Confirmation handler](../../../../newsletter/src/confirm.ts).

The attempt table retains hashes of issued confirmation tokens, each with a 24-hour lifetime. A failed resend does not invalidate an earlier unexpired link. Activation and opt-out revoke the issued set, so a link from a completed subscription cycle cannot activate a later one. The original unsubscribe token remains stable while the subscriber row exists. [State transitions](../../../../newsletter/src/db.ts).

Ordinary unsubscribe and abuse suppression are separate. A reader who previously opted out can subscribe again through fresh verification and confirmation. A bounce, complaint, or explicit request to block further confirmations prevents new admission. Confirmation emails now offer that block action. Old inactive rows whose history cannot distinguish opt-out from complaint remain suppressed during migration.

Retention is a boundary here too. The existing cleanup removes inactive rows after 90 days, so suppression and those old opt-out links are not permanent. The change does not quietly turn a rejected address into a subscriber, or claim to preserve a block after its record has been deleted. These choices let the state transitions remain explicit rather than treating every inactive address the same way.

## The form keeps a usable retry

The client now reports the widget failures that the original audit reproduced, and it restores the form after them. Missing script, missing widget configuration, empty token, unsupported browser, render and execute errors, expiry, and timeouts have explicit paths. A late script can initialize when the reader submits again. Duplicate or stale callbacks cannot start another request for the same attempt. [Client implementation and test receipt](12-client-verification.md).

The browser allows 30 seconds for verification and 35 seconds for its API request. On the server, verification has a five-second deadline and fails closed: missing or invalid configuration and verifier unavailability return a service error without admitting mail. The server checks the hostname and the new `subscribe` action, accepting a missing or empty action only for compatibility with cached older clients. These choices can temporarily stop legitimate readers; they are explicit availability tradeoffs.

HTTP 202 stays generic so the form does not reveal whether an address is active, suppressed, or inside a cooldown. Its message says to look for confirmation if needed and keeps both the form and address available for another attempt. It does not claim that every accepted request sent an email. A failed or uncertain send gives check-inbox guidance because aborting a browser request does not prove the server stopped processing it.

The client lane's 25 tests passed against the actual initializer using controlled DOM objects, timers, widget callbacks, and fetch responses; its source typecheck also passed. They exercise local behavior without a real browser, challenge, endpoint, or email. Reports carry static stage names and status codes, excluding addresses, tokens, and provider response bodies. The shared logger's transport and ingestion gaps remain separate work; these tests do not establish delivery of every error report.

The server suite also passed 39 tests against the actual handlers and migrations with an in-memory SQLite transaction adapter. It covered concurrent requests, failed and unknown sends, token cycles, suppression, and signed webhooks. The separate local workerd D1 run checked the admission SQL in Cloudflare's local runtime. Neither environment contacted a real verifier or mail provider. [Server methods and results](10-verification.md).

The code is deployed, and four bounded live checks verified the changed request guards, unknown-link error and privacy copy. Live challenge completion, email receipt, confirmation and unsubscribe still need their own evidence. The deployment inspection also found no webhook signing-secret binding: bounce and complaint suppression passes local tests but is not yet connected to live provider events. [Activation and remaining setup](10-verification.md). The limits can also delay genuine readers during a burst, and they do not cap every incoming request, verifier call, or database read. My criterion is practical: a reader can finish, a public request has bounded permission to send, and a failure leaves a usable next step. The missed contact with readers is why I want this flow to work, and why protection cannot become an unexplained dead end.

---

## Glossary

| Term / claim | Source | Date |
|---|---|---|
| Subscription bombing before activation | [Swiss NCSC](https://www.bacs.admin.ch/en/26w6-en) | Published February 10, 2026; checked September 9 UTC |
| Turnstile verification and secret errors | [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) | Checked September 9 UTC, 2026 |
| Per-location request throttling | [Workers rate-limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) | Checked September 9 UTC, 2026 |
| Transactional batch behavior | [D1 Database](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) | Checked September 9 UTC, 2026 |
| Constraint conflict handling | [SQLite](https://www.sqlite.org/lang_conflict.html) | Updated November 22, 2025; checked September 9 UTC, 2026 |
| Retrying one mail operation | [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) | Checked September 9 UTC, 2026 |
| Provider acceptance and delivery | [Resend events](https://resend.com/docs/webhooks/event-types) | Checked September 9 UTC, 2026 |

The [worklist](00-worklist-index.md), [source ledger](07-source-ledger.md), and [claims ledger](08-claims-ledger.md) distinguish captured incidents, inspected code, local tests, documented capabilities, and unfinished acceptance. Nine [raw prompts](source.prompts.md) preserve the author's direction. Research, implementation, and drafting were assisted by agents; private operational captures are not published.

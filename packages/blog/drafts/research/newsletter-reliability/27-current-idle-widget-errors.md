# Current client errors occur before subscription submission

November 5, 2026. Goga asked whether the accumulated `client_errors` show readers trying and failing to subscribe. This is a fresh production investigation, following the [October audit](18-retained-widget-errors-and-conversion-limits.md) and the worklist's later diagnostic releases.

The recent reports do not establish failed signup attempts. Every one with the new phase/provider evidence is an idle Turnstile failure, with the signup operation reported as not started. Current complete signup health remains untested.

## Fresh production findings

The fixed query window is October 6 at 00:00 through November 5 before 15:15 UTC. [Aggregate results and meters](2026-11-05-client-errors.json) preserve the actual retained scope:

| Observation | Result |
|---|---|
| All retained client errors in the window | 49 |
| Subscription widget errors | 48 |
| Older widget reports without phase/provider evidence | 27, October 6–21 |
| Newer widget reports | 21, October 30–November 5 |
| Phase and operation of all 21 newer reports | `idle` / `not-started` |
| Provider code of all 21 newer reports | `300031` |
| Stored verifying/sending/API-rejection/network-error reports since October 29 | 0 |
| Retained confirmation admissions since October 29 | 0 |
| Current subscribers | 1 active; no other retained state |
| Latest retained confirmation | September 9, 2026, 02:38:29 UTC |

The client calls `initWidget(false)` during initialization. Although challenge execution is deferred until submission, rendering can invoke the error callback while no attempt is active. `fail()` records phase `idle` and operation `not-started`. It also displays “Verification failed. Please try again.” on the form, even though the visitor has not submitted it. A later submit can initialize a fresh widget. The [existing counterexample](../../../test/subscribe.test.ts) covers this idle path with zero challenge executions and zero signup requests.

[Cloudflare's current error reference](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) documents `300*` as a generic challenge failure and says the remaining digits are internal. This is not the documented invalid-key or unauthorized-domain family. The provider documentation discusses bot detection and browser/network troubleshooting; our records cannot establish that the operators were bots, people, or our own automation. There is no specific public diagnosis for the suffix `031` in that reference.

This explains why the table looks like a list of failed subscriptions: the component records an idle widget failure under `subscribe_form`. It does not establish 21 attempts, 21 people, or 21 lost subscribers. The older 27 reports lack the evidence needed to classify their phase or cause.

## Current served form and limits

One fresh HTTP GET to the analytics-excluded `/owner` path returns 200, with the subscription form, a nonempty public-key attribute, widget slot and explicit Turnstile script. One `/main.js` GET returns 200 and the widget-error/idle/execute-mode implementation. Neither fetch executes JavaScript or contacts the challenge provider. These checks do not independently verify key validity, a real challenge, the server secret, email delivery or activation. No source/build equivalence claim is made from these substring checks.

Fresh deployment metadata lists Worker `7339fca2-3513-4fb8-a485-b3e671b0a150` at 100%, activated November 5 at 06:48:42 UTC. No deployment or configuration is changed by this investigation. The September complete signup remains historical evidence.

The confirmation ledger is retained for seven days; pending rows expire and are cleaned. Its empty current result cannot prove zero endpoint requests or reconstruct all prior sends. Diagnostic reporting is also not guaranteed complete. The fresh evidence shows no recorded submitted-attempt failure in this slice; it does not prove every visitor can subscribe.

## Method, checks and next action

Read-only metadata first confirmed the database and required tables/columns. Frozen queries use Wrangler's `--command` argument, never its remote import path: [errors](2026-11-05-errors.sql), [confirmation admissions](2026-11-05-confirmations.sql), [subscriber state](2026-11-05-subscribers.sql). The error/admission queries use 2,001-row overflow sentinels; subscriber state uses 1,001. All results are below their sentinels. The error query folds unknown messages and components, validates JSON, and returns bounded phase/code facts rather than raw diagnostic fields.

All three queries run against actual local workerd D1 with current migrations before production. Fixtures distinguish idle and verifying phases, preserve the provider code, handle invalid JSON, and fold a private-marker message without exporting it. The first local run was denied loopback access; the first authorized fixture run exposed an inline-comment parsing error in the disposable migration loader. Correcting that loader produces a passing native run. These are query-harness issues, not production service failures.

Production SQL reports 46 + 0 reads for schema preflight, then 318 + 4 + 4 for the three aggregates: **372 reads, zero writes**, with one provider attempt per returned statement. Metadata/API and two HTTP checks are separate from these SQL meters. Initial sandbox DNS/log-path denials occurred before successful authorized metadata access. No email, signup POST, diagnostic POST, schema mutation, runtime change, browser challenge or reader export occurs.

The diagnosis is complete for the retained errors. The next bounded acceptance action is one explicitly designated test recipient completing a real browser signup, confirmation receipt and activation, with the operation outcome checked separately. An idle-error UI refinement can keep pre-submit diagnostics without displaying a failed-subscription message; it is a proposed follow-up, not an implemented repair or evidence of improved conversion.

Private SQL runners, native receipts and served captures are preserved outside Git under the dated newsletter private-evidence directory. Public evidence contains only aggregates, query text and the limitations above. TASK-0125/0126 remain open for their broader requirements; this investigation does not reopen September's completed acceptance or claim a new full-flow acceptance.

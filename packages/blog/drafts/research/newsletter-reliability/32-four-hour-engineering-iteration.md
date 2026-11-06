# Turnstile and newsletter engineering iteration

Started November 5, 2026 Pacific / November 6 UTC under the owner's explicit
request to continue improving code and article for four more hours. The exact
instruction is preserved as the eighth selected article prompt. This reopens
the previously accepted editorial result; it does not rewrite its dated checks.

## Fixed window and ownership

The active goal began **2026-11-06 06:07:25 UTC**. Its fixed deadline is
**2026-11-06 10:07:25 UTC**, November 6 at 02:07:25 America/Los_Angeles.
Continuations must not reset that window. The intended article release remains
November 6 at 08:00 Pacific, six hours after this work deadline.

- Coordinator: server confirmation application/domain boundaries, request-body
  handling, webhook verification/suppression review, integration and article
  draft, prompt provenance and queued release copies.
- Original builder, existing **Investigate client_errors subscription…** thread:
  browser attempt lifecycle, provider/DOM adapters, loading and recovery, focused
  tests and the reserved `33-browser-attempt-domain.md` evidence note.
- Independent provider reviewer: Siteverify and confirmation delivery contracts,
  concrete reproducers and repairs, focused tests and the reserved
  `34-provider-contract-boundaries.md` evidence note.

Reserved paths are assigned deliverables, not existing acceptance evidence.
Agents coordinate before changing shared schemas or each other's files.

## Requirements and acceptance

1. Improve behavior and structure as well as prose. Trace each change to an
   observed/reproduced defect or a concrete domain invariant.
2. Apply DDD proportionately: name confirmation admission, provider acceptance,
   unknown delivery, activation and suppression separately; keep business
   decisions independent of HTTP, D1 and provider wire formats. Transactional
   admission remains the authority for shared send budgets.
3. Inspect authoritative docs and native implementations. Documentation, fake
   transport tests, native runtime checks and live behavior are distinct evidence.
4. Add useful bounded diagnostics with closed fields. Do not log addresses,
   tokens, secrets, raw URLs or free-form provider payloads.
5. Exercise meaningful failures, races, cancellation, retry identity and
   persistence boundaries. Preserve actual provider/DOM/SQL contracts.
6. Refactor where it strengthens those rules. Add no ceremonial abstraction or
   dependency merely to claim DDD.
7. Keep the article grounded in verified work, including mistakes and unknowns.
   Preserve complete human prompts and the disclosed private-authorization
   omission; do not invent measurements or a footprint.
8. Finish with scoped types/tests, isolated production rendering, exact queued
   body/prompt reconciliation, delivery and hosted queue checks. Record source,
   deployment and actual measured acceptance separately.

## Initial authoritative state

Working tree starts at `18606bd`, with only three unrelated untracked Ahrefs
captures. The revised draft is `7f02173`; the queued release is `d4e5544`, with
hosted queue acceptance in `e2838f6`. Its prior 43-post rehearsal and seven-prompt
checks remain historical evidence. Current code and external state are reviewed
again for this wider task.

The previous article is temporarily removed from the release manifest during
the requested engineering revision. Source files remain preserved. Re-register
the November 6 release after revised code and article pass current checks.

## First reproduced findings

The independent audit has local no-network reproductions of:

- An ambiguous first confirmation-send call followed by a definite second-call
  rejection downgrading the operation's recorded outcome from unknown to failed.
- A contradictory successful Siteverify payload containing a rejection code
  being accepted by the adapter.
- Webhook verification decoding the body before authenticating. UTF-8 BOM
  removal changes the signed bytes: an altered wire body passes a canonical
  signature, while its authentic raw-byte signature fails.

These are controlled findings, not observed production incidents or lost-reader
counts. The provider reviewer owns the first two repairs; the coordinator owns
the raw-body boundary. Next: reproduce request/body/signature conditions, then
implement bounded transport handling and explicit server confirmation decisions.

## First accepted local increments

Provider repairs are delivered in `d63ea5b6` (monotone send knowledge and verifier
protocol decoding) and `9f6346f4` (Workers-compatible endpoint confinement and
closed delivery diagnostics). Research 34 preserves their separate evidence.

[Transport repair](36-request-body-and-webhook-contracts.md) passes 51 combined
handler tests, newsletter types and ten paired local workerd/Web Crypto/D1 cases
per version. Its raw-byte authentication, nonblocking cancellation and read
deadline remain local acceptance, not an assertion about current production.

The campaign audit also reproduces duplicate provider calls before durable
admission. A separate owner is implementing a minimal campaign identity latch,
with additive migration 0006 and native controls. No campaign automation or live
campaign send is authorized by that implementation. The coordinator retains the
production migration/deployment gate.

## Integration checkpoint — 07:25 UTC

Source delivery includes browser attempt ownership (`594cfbd4`) and its cleanup/
unknown-response follow-up (local `cd1684de`, integrated `91ba4781`), provider
contracts through `a1c52478`, bounded request/wire authentication (`941cbbcb`),
and campaign admission (`a7e423ae`). Research 33–36 preserve their distinct
controlled receipts. Campaign schema 0006 has a separately recorded production
application receipt in Research 35; do not rerun it. No production campaign was
sent.

The [confirmation application extraction](37-confirmation-application-boundary.md)
is under independent review with fourteen application cases and fresh native D1
admission/body controls. Integration moved to the clean detached checkout
`/private/tmp/gkoreli-campaign-delivery-20261106` after concurrent remote-main
changes; the original shared main and its unrelated dirty work remain intact.

Remaining: finish independent source review, revise the article from these new
results, perform joined checks/build/native acceptance, push scoped source, join
actual deployment separately, reconcile eight complete prompts and release
copies, then restore and check the November 6 queue. The fixed deadline remains
10:07:25 UTC.

## Joined local acceptance — 07:28 UTC

The integrated blog suite passes **403/403**, workspace types pass, referral
policy check passes, and the isolated production build renders **43** current
posts (32 Markdown plus 11 TypeScript). A concurrently published AI Site Check
article now uses prefix 042; the queued Turnstile file will use 043 with the
same public slug. The earlier 43-post Turnstile rehearsal is historical, not
this new release's count.

Independent reviews repaired an active saved-fixture caller and an unexpected
delivery-port escape in the confirmation extraction. They also reproduced and
repaired response-reader cancellation after an elapsed read and repeated
suppression timestamps. [Research 38](38-suppression-transition-idempotence.md)
records fifteen production-SQL tests and eight actual local workerd/D1 controls,
including trigger rollback and day-91 cleanup. These are local controls; source
delivery and current Worker activation remain to be joined.

## Implementation freeze — 07:53 UTC

Final domain checks make the address value nominal and snapshot intent before
awaiting proof. Independent review passes. [Research 37](37-confirmation-application-boundary.md)
records the compiler and paired mutation controls; [Research 39](39-native-confirmation-lifecycle.md)
joins the actual final handlers/application/adapters/Web Crypto/D1 through six
selected lifecycle and receipt-failure cases with synthetic outbound responses.
The frozen integrated suite passes **405/405**, workspace types pass and an
isolated build renders the current 43 posts.

[Research 36](36-request-body-and-webhook-contracts.md) additionally preserves six
actual local HTTP-socket controls, including unknown-length chunked overflow and
unfinished JSON, with exclusive-output receipts and a reusable driver. Earlier
receipts and the one missing historical exact driver snapshot are distinguished
explicitly. No current mail, provider reliability or production latency claim
follows from those controls.

Source `0825a053` has a separately joined native build `b17d6b3f`, active Worker
`b46ac412` at 100%, and byte-equal served main.js (41,059 bytes; SHA-256
`7a0c9b3d445659e28a015ead472042979c162b9b1e7d131ffe76d2900c6a7ee8`).
The guarded active-address production check and its evidence are being recorded
by the original builder. The final private-value/intent-snapshot delta follows
that production source; it must receive its own source/activation association.

Implementation is now frozen absent a concrete defect. Remaining work: final
article flow/claim/rendering and release checks, current code delivery, exact
eight-prompt/copy reconciliation, and hosted queue acceptance. The fixed window
still ends at 10:07:25 UTC.

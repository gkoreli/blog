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

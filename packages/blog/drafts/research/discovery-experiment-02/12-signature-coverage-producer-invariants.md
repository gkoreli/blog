# Typed signature coverage can still be impossible

October 31, 2026 UTC. Continues the [public-claim audit](11-assignment-coverage-cost-and-public-claims.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). Previous turn: progress through `a908cfb`/`c3e4c0e`. Full goal remains unfinished.

## The reporting defect

The public coverage validator checked supported formats, JSON boolean types and numeric ranges. It accepted two states that our local verifier has never emitted: verified coverage with neither authority nor full-target-URI coverage, and negative recorded age. A supplied record with either contradiction could still contribute a “User-Agent covered” claim.

The repair changes the [stored-coverage predicate](../../../../analytics/src/signature-coverage-report.ts). Contradictory coverage becomes unrecognized; detailed binding, selection and dependent vendor-coverage claims are withheld. The stored verified outcome, signer history, native assessments and event remain counted. No signature, classification or retained row is rewritten. The report-cache version advances to `.31.7` because report interpretation changes.

## Check the producer before tightening history

An independent source audit examines 41 Git states touching `webbotauth.ts` or its version constants, beginning at coverage introduction `d723a88`. Sixteen have the original coverage shape; twenty-five include the selection wrapper introduced in `610841a`. All preserve:

- Verification requires authority or target-URI coverage.
- Recorded age uses `Math.max(0, nowSeconds - created)`.
- Duration is `expires - created`, after rejecting `expires < created`.

The third fact matters: **zero duration is possible**. A proposed positive-duration requirement would have invented a restriction. The final predicate retains zero and does not impose today's expiry policy on old metadata. Positive age exceeding duration remains representable. A zero recorded age can also mean a slightly future creation timestamp admitted within clock skew; it is not an exact creation-time measurement.

These are invariants of our historical producers, not universal HTTP Message Signature requirements. [RFC 9421 §3.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.2.1) leaves additional coverage requirements to applications; [§7.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) explains the limits of unsigned components. Neither turns a retained metadata check into cryptographic replay.

## Controls and actual retained coverage

Fourteen frozen supplied records reproduce five formerly accepted contradictions across both stored coverage formats. Node and local D1/workerd agree exactly on full reports before and after. Valid authority-only, target-URI-only and combined coverage survive, as do zero duration, historical age-after-duration and independent selection-detail handling. Unknown formats and missing detail retain their existing states. Owner, referral, outside-window and empty-selection checks pass.

Six independently constructed, mathematically valid signatures exercise the actual verifier in Node and workerd with local mocked directories. The no-target signature fails the existing local policy before directory access. Zero duration verifies; a creation timestamp thirty seconds ahead produces clamped age zero. All six producer results equal the frozen baseline. These are labelled synthetic protocol controls, not six newly identified bots or people.

On 384 valid synthetic rows, the complete native report remains identical and reads stay **30,513→30,513**, with zero query writes. This is one local relation, not a production-cost or CPU benchmark.

All seventy files in the original historical manifest verify before the selected 397 events are reused. The October 29 20:39:23–October 30 09:38:03 UTC selection contains 31 locally verified records with recognized coverage; all 31 remain recognized, and no coverage predicate changes. Node and native D1 agree. This does not measure present incidence or establish that no other stored record has the defect. No proof or current vendor key is replayed.

## Capability disclosure and acceptance

The signing-method note also omitted the already configured ShapBot and Shap-User declarations, then described other names as unmapped. Both are now named with their distinct Parallel origins and recorded-profile boundary. The directory note includes Parallel too. Its [first-party documentation](https://parallel.ai/parallel-web-systems-bots), inspected October 31, describes both signing origins; no fresh vendor request or directory fetch was performed. Their declared roles remain distinct from verified purpose or a known human trigger.

The [acceptance receipt](coverage-consistency-checks.json) preserves exact source hashes, controls, historical counts, source-audit anchors and private manifests. All 384 analytics tests, 169 site tests, workspace types, 27 Markdown validations and the isolated 38-post build pass. The built stats page contains the corrected disclosure. The retrospective and its 33 human prompts are unchanged.

Two failed harness checks are preserved: the package entry also exports the changed report, so expecting its bytes to stay identical was wrong; the first observation-only wrapper then used a nonexistent export name. The final check uses the actual `observePageResponse` export and confirms identical observation-only bundles. The full package entry changes as expected. Intermediate successes are not pooled into another denominator.

No production site/stats request, SQL, feed fetch, sign-in retry, raw collection, human label or model trial occurs. Local code, source activation and served behavior remain separate. The six existing input gates remain unresolved. Next: reconcile the remaining goal requirements against newly available authorized evidence; do not repeat accepted controls or expand implementation merely to avoid missing measurement inputs.

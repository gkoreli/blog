# A valid signature can still have invalid parameter types

October 27 Pacific / October 28 UTC. Continues [proof/nonce reuse diagnostics](50-proof-reuse-and-nonce-boundaries.md). That iteration added a real diagnostic capability; it did not complete human calibration or replay enforcement. Human trials remain deferred.

## The verified label was too permissive

The verifier parsed Structured Field parameters and included them in its signed base, but did not check the type of `nonce`. Independently signed Integer, Boolean, Token and Byte Sequence nonces therefore passed its crypto check. [Before-change controls](parameter-types-before.json) demonstrate **twelve verified malformed-nonce cases**: four types across dictionary, legacy quoted-string and bare-URI compatibility paths. These are synthetic controls, not twelve production requests or an estimate of affected traffic.

[RFC 9421 §2.3](https://www.rfc-editor.org/rfc/rfc9421.html#section-2.3) defines `created` and `expires` as Integers and `nonce`, `alg`, `keyid` and `tag` as Strings. Its [application requirements](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.2.1) distinguish protocol requirements from local policy. A mathematically valid proof alone cannot excuse the wrong parameter type.

The [pinned Python implementation](complete-audit-sources.json), commit `1de433d9a49fd608475c6054ab14a1652c088844`, validates known parameter types before cryptographic verification. [Reference execution](parameter-types-reference-default.json) rejects those same twelve nonce controls. We independently construct and sign canonical bases; we do not use the verifier's own base builder as the signing oracle.

## Repair the gate and retain the reason

Verifier **`2026-10-28.7`**, collection **`2026-10-28.9`**, checks present known parameters before directory discovery. It records six bounded reasons: `invalid-created-type`, `invalid-expires-type`, `invalid-alg-type`, `invalid-keyid-type`, `invalid-nonce-type` and `invalid-tag-type`, all with outcome `invalid`. The parameter name survives; its supplied value does not. Missing required parameters and validly typed but unsupported algorithms retain separate outcomes. Unknown extension parameters receive no invented type rule.

Malformed tags cannot become an apparently unrelated-protocol result when there is no eligible proof. An explicit selected-label check also preserves that failure. A malformed nonce on one eligible candidate does not prevent another valid candidate from succeeding: the default first-valid loop and exhaustive audit preserve their separate scopes. A Node regression accepts the valid candidate while the audit counts one valid and one invalid proof.

The [same signed-input matrix after repair](parameter-types-after.json) has **38 cases / 114 API paths per runtime**, in Node and actual local workerd. All default and selected-label results match the declared policy. All malformed type cases stop before directory lookup. The all-candidate API preserves invalid eligible candidates; malformed-tag-only input remains not assessed rather than a measured zero valid-proof census. The selected API, collector API and audit are not interchangeable denominators.

[Eleven native collector/D1 controls](parameter-types-storage.json) accept receipt/storage agreement under the new profiles, including valid String/absent nonce cases and each affected parameter. Invalid results have no authenticated publisher or coverage record, and optional capture remains absent. All controls are referral-excluded. The unchanged exact-reference production SQL is also executed locally with unsafe-integer neighboring IDs; it uses the primary key and one read. This is local acceptance, not deployment or production prevalence.

The existing classifier, evidence envelope, receipt shape, reviewed publishers, key policy and report schema are unchanged. Historical rows retain their original verdicts and verifier profiles. D1 does not retain nonce types for that history, so these controls cannot count or repair historical affected events.

## Freshness policy is a separate comparison

The 38-case reference matrix is executed twice, with **76 Python message-verification calls**. Each run rechecks the eighteen pinned source files. At its default five-second skew, the reference rejects cases our sixty-second allowance accepts. With [an explicit sixty-second reference allowance](parameter-types-reference-skew60.json), both accept the exact boundary and reject one second beyond it.

Both default runs accept **13 of 38 cases**, but **four acceptance decisions differ**. The equal totals hide offsetting clock and lifetime/window policies. Agreement of counts is not agreement about individual requests.

| Boundary | Local profile | Pinned generic RFC verifier |
|---|---|---|
| Creation 60 seconds ahead / 61 seconds ahead | Accept / reject | Same with explicit 60-second skew; default is 5 seconds |
| Expiry 60 seconds ago / 61 seconds ago | Accept / reject | Same with explicit 60-second skew |
| Lifetime 86,400 / 86,401 seconds | Accept / policy reject | Both accepted; its maximum age checks time since creation |
| Expiry before creation, within skew | Invalid window | Accepted in this control |
| Absent or empty String nonce | Accepted by profile | Accepted |

These are different admission policies, not a reason to force agreement by silently changing the reference configuration. We preserve both runs. Neither a type check nor nonce presence proves randomness, uniqueness or replay prevention. The sixty-second skew, one-day collector/audit lifetime cap and local window-order check are unchanged by this repair. The direct verifier API still relies on callers to supply its optional maximum-age policy; the collector supplies one day.

[The exact three-request vendor cohort](parameter-types-retained.json) still verifies offline under `.7`, at its recorded times with the previously captured publisher keys. Those rows were stored under verifier `.6` / collection `.7`; replay does not establish new `.9` signed persistence or Cloudflare agreement.

## Acceptance and remaining work

[Checks](parameter-types-checks.json) record 232 analytics tests, 106 site tests, workspace types, native/API/storage controls, reference evidence and the isolated article build. One existing literal collection-version assertion was updated to the intended `.9` contract after the first suite run exposed it. The article links the local type-gap finding while staying within its six-minute target; the thirty-one shaping prompts remain unchanged.

Source publication, activation and one planned excluded actual-Worker type-failure control/readback are separate gates. The control uses an integer nonce and dummy signature, so it cannot authenticate a vendor; it tests new failure preservation and storage only. The prepared exact-reference query has a reviewed post-execution threshold of 100 reads, not an enforced server cap. No broad scan or human trial is proposed here.

Next: close that bounded production acceptance and then reassess higher-impact remaining measurement gaps. These are not complete human/bot detection or full RFC/draft conformance results. Human/device error rates, R1 attribution, historical stage attribution, managed-native agreement and privacy/retention decisions remain open under [the goal audit](45-goal-and-method-coverage-audit.md).


[Production acceptance](parameter-types-release.json) closes source `934533b`, activation and the bounded control. The initial CI job failed while fetching the repository; one retry of that same commit deployed Worker `0cb5df7a` at 100%. Both captures remain preserved. The earlier non-fast-forward push was resolved by preserving the unrelated Bun notes and rebasing without a force push.

The [actual integer-nonce request](parameter-types-live.json) stores `invalid-nonce-type` / `invalid` under collection `.9` / verifier `.7`. All thirty known receipt scalar fields match its exact D1 row, with no authenticated signer, coverage or optional capture. The row's supplied referrer is excluded by the current assessor; this is not a new public-report population fetch. Three ASCII signing headers match the captured inputs. One direct SELECT uses one read/zero writes, below the reviewed 100-read threshold. Normal collection/provider costs are additional.

The preceding direct Markdown GET is collection-ineligible, matches the isolated article and proves readiness of the version/header-filtered tail before the eligible control is sent. Two HTTP GETs produce one eligible observation; neither is a human trial. The exact-version binding names confirm owner grant, diagnostic and calibration bindings absent. The owned tail process group has zero survivors. The strict analysis projector now admits the new `.9`/`.7` pair while preserving historical checks; its six focused regressions pass. No new accepted historical verdict or genuine vendor request follows from this control.

Next bounded action: review public verification labels and denominators against current versus historical verifier profiles, then native-test a cutoff-bound retained-history delta. The nonce gap makes version provenance consequential; stored history must not silently become current-profile re-verification. Human trials and the broader goal remain open.

[Research 52](52-stored-verifier-provenance-and-retained-delta.md) supersedes the next-action note: it implements the stored-profile reporting distinction and captures the bounded post-census interval. Historical verdicts are not silently reverified. Its code, deployment and measured report acceptance have separate receipts.

# More verified fields would not necessarily identify more readers

October 31, 2026 UTC. Continues [Research 118](118-caller-owned-directory-recovery.md). Previous turn: progress through code `605ab9c` and activation receipt `9082d4b`. This investigation resolves the next adoption decision: should the offline directory-response audit become part of collection or gate an incoming agent signature?

**Decision: keep it offline.** Response proofs remain useful protocol diagnostics, but the current aggregate output and cost do not justify promoting it into per-request identity evidence. [ADR-0016.11](../../../../../docs/adr/0016.11-signature-verification-evidence.md) records the decision and conditions for revisiting it. This is not a claim that directory proofs are unnecessary for every application or that we have implemented the entire Web Bot Auth draft.

## One request, several different questions

The [fixture](../../../../analytics/test/fixtures/directory-adoption.mjs) independently signs an incoming request, then varies its directory response. All signatures and body hashes run through actual cryptography. Inputs are frozen before changing the adapter. Fourteen deliberate conditions run unchanged in Node and local workerd, across three rounds: **42 paired conditions**. [Harness](../../../scripts/check-directory-adoption.mjs), [comparison](../../../scripts/summarize-directory-adoption.mjs), [receipt](directory-adoption-audit.json).

Thirteen incoming signatures verify; the deliberately corrupted one fails `signature-invalid`. Hypothetically requiring every admitted directory key to have an authority proof retains seven verified incoming results. Requiring every key to have a body-bound response proof retains two. Those rules answer different questions and would discard different evidence; these selected conditions do not measure a population error rate or prove which application policy is correct.

| Directory condition | Incoming request | Separate response evidence |
| --- | --- | --- |
| Authority-only response proofs | Verified | Two authority proofs; no body-bound proof |
| Response proofs absent or expired | Verified | No current response proof established |
| Body changed while preserving keys/header | Verified | Authority signatures verify; digest mismatches |
| Digest and its signature cover the supplied body | Verified | Two body-bound proofs |
| Incoming signature corrupted; response fully proved | Invalid signature | Two body-bound proofs cannot repair it |

The incoming fixture covers the publication authority and signature-agent field. It does not cover an article path, User-Agent, reading, citation or the action's purpose. The fixture clock is fixed; these are synthetic compatibility controls, not current vendor traffic.

## The same aggregate can describe different keys

Two conditions publish the same two keys. One response is signed only by the key used for the incoming request; the other is signed only by the other key. Their complete response audit results and crypto counts are **identical**: one verified authority key, two admitted keys, all-keys coverage false.

The audit deliberately omits raw key identifiers. Its aggregate is correct, but cannot establish that the incoming request's selected key has the response proof. A runtime consumer would need a private, exact key/source association before making that claim. Renaming the existing count to “verified agent” would lose this boundary. Request verification itself, reviewed vendor mapping, response-domain binding and native-provider assessment remain separate.

## Cost can rise before evidence improves

These are pass-through WebCrypto operation counters, checked for identical Node/workerd results. The unit check also compares instrumented and uninstrumented adapter results.

| Fixture | Current incoming verifier: hash/import/verify | Additional full response audit: hash/import/verify |
| --- | --- | --- |
| Two keys, authority-only proofs | 1 / 1 / 1 | 2 / 2 / 2 |
| Two keys, body-bound proofs | 1 / 1 / 1 | 3 / 2 / 2 |
| 128 distinct keys, no response proofs | 1 / 1 / 1 | 128 / 128 / 0 |

The last audit still evaluates its admitted-key denominator before reporting absent response proofs. Running it unchanged in collection would add work without a response-proof result. These are cold, separately evaluated stages, with the incoming key first in the directory: no universal multiplier or shared imported-key optimization is claimed. The counters are not CPU, latency, provider charges or traffic prevalence. Existing cache/cancellation repairs do not establish an affordable advisory cache; [Research 116](116-directory-cache-clocks-and-key-admission.md) retains the three-clock boundary.

## A real compatibility repair, and a disproved suspicion

The experiment found that a correctly signed `Content-Digest` Byte Sequence carrying an extension parameter was classified malformed. [RFC 9530 §2](https://www.rfc-editor.org/rfc/rfc9530.html#section-2) defines the digest dictionary; [RFC 8941 §§2–3.3](https://www.rfc-editor.org/rfc/rfc8941.html#section-2) provides parameterized Items and discourages rejecting unknown parameters. This is not a blanket normative requirement to ignore every extension.

Offline audit **`2026-10-31.1`** now computes from the bare digest bytes while preserving the entire header, including parameters, in its signature base. The signed parameterized case becomes body-bound. Changing the parameter without resigning still fails the signature; changing the body preserves the header signature but fails the digest. These three digest cases improve; all incoming outcomes stay identical. Unknown algorithms, malformed value types, encoding limits and key policies retain their existing boundaries.

This matrix exercises a string-valued extension parameter. Source review confirms the shared parser still rejects decimal-valued parameters, so this is not full Structured Field grammar support. That existing decimal limitation was source-inspected, not measured in the fourteen native conditions; the successful sample cannot establish universal parameter compatibility.

A suspected empty-dictionary bypass was ruled out: the current local parser rejects empty/whitespace dictionaries, and the signed-empty-field control yields no body-bound proof. We made no fix for that hypothesis and do not claim RFC 9530 prohibits generic empty Structured Field dictionaries.

The [reference wrapper](../../../scripts/check-directory-adoption-reference.py) rechecks all eighteen preserved files from Apache-2.0 [`pyauth/http-message-signatures` commit `1de433d`](https://github.com/pyauth/http-message-signatures/tree/1de433d9a49fd608475c6054ab14a1652c088844). Its digest implementation uses the bare bytes, validates algorithm/length and compares the actual supplied body. It performs **66 signature/authority/body semantic checks** over the frozen contexts. Every repaired result agrees; zero unexplained differences. Only its recorded validation clock is substituted. This is execution of the pinned source, not a named-release, managed-provider or production conformance claim. Four corrupted input/order/verdict/count controls fail comparison.

## Delivery and next decision

All **331 analytics tests** and workspace types pass. The minified analytics collector entry remains byte-identical before/after: **223,052 bytes**, SHA-256 `275bd94f3fcdfbe1406dc5f96e459e2d3180c362156cca81bf8a93633190383d`. This local entry comparison does not assert full-site or current production byte equality. No collector integration, classifier/verifier profile, report/cache, schema, dependency, raw diagnostics, article or prompt changes occur. No new site visit, vendor capture, SQL statement, native managed verdict or human label is collected.

The runtime-adoption decision is closed under current evidence. A future proposal needs a concrete operator decision, exact key association, separate compatibility/failure policy and incremental cost/lifecycle acceptance; storage/report changes need their own checks. Do not repeat this matrix or add runtime counters solely to continue work. The goal stays active and incomplete: human/device trials remain owner-deferred; authenticated search, native identity/oracle, source-purpose and privacy inputs retain their existing gates. Next: review those remaining decision requirements against current evidence, and take a new investigation only where an available input can change the answer.

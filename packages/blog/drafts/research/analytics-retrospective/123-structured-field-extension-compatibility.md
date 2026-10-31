# Legal extensions must survive signature verification

October 31, 2026 UTC. Continues [Research 119](119-directory-adoption-policy-and-cost.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). This is a separate parser-compatibility investigation; the directory-response runtime no-adoption decision stays closed. Another active task owns the discovery analyzer and its outstanding review findings.

## Frozen question and acceptance

At source baseline `5343de1`, the shared Structured Field parser rejects decimal bare values and SP after a parameter semicolon. Research 119 records the decimal limitation. Does that cause correctly signed messages with otherwise permitted extension metadata to be reported malformed? The site-owner decision is whether to recognize such proofs while retaining all existing key, freshness, component and identity/purpose boundaries.

Read [RFC 8941 decimal parsing](https://www.rfc-editor.org/rfc/rfc8941.html#section-4.2.4), [parameter parsing](https://www.rfc-editor.org/rfc/rfc8941.html#section-4.2.3.2) and [RFC 9421 signature parameters](https://www.rfc-editor.org/rfc/rfc9421.html#section-2.3). Compare selected valid/invalid values with an independently maintained Structured Field implementation, preserving its package version/source hashes. Freeze actual signed inputs before editing. Test canonicalization, numeric limits, integral decimal versus integer types, negative zero, parameter order, SP versus HTAB, registered parameter types, mutation without resigning, and parameterized Content-Digest behavior.

If the gap reproduces, add a distinct exact decimal representation and SP-only parameter whitespace handling. Keep registered metadata typing, unsupported component parameters, duplicates, time/key/network policy, exclusions and stored history unchanged. Advance implementation provenance and any affected report cache version. Run meaningful regression tests, exact Node/workerd comparisons, workspace types and isolated build/dry-run checks. Record source, activation and any measured behavior separately. No fresh vendor capture, production scan, human trial, account access, expanded diagnostics or new dependency is needed for the local investigation.

## Results

The frozen input contains 26 syntax cases, twelve independently signed request cases and three signed directory-response cases. Node and local workerd agree exactly before and after the repair. The plain request verifies before the change. Five correctly signed extension variants fail as malformed before key lookup; after the change all five verify. Altering a decimal value or parameter order without resigning fails cryptographic verification. Decimal `created` and `expires` become explicit type errors, with zero directory lookups. Tabs and excessive precision remain malformed.

The directory response already had a valid header signature, but its digest was classified malformed. After the repair the bare digest matches and the body-bound proof is recognized. Changing its signed extension still invalidates the signature; changing its body leaves the header signature valid while the digest mismatches. This preserves the distinction between header authenticity and body integrity.

The first harness attempt supplied the wrong directory media type. Its plain positive control failed and response assessment did not run, so it was not accepted as compatibility evidence. The failed inputs/results remain archived. Correcting only the fixture media type produced the frozen baseline above. The final harness now requires the positive control and actual response assessment, and checks expected repaired outcomes in addition to runtime equality.

## What changed

The parser keeps decimal values as canonical text under a distinct type. It normalizes leading/trailing zeros and negative zero without binary floating-point arithmetic on the fraction. Integral decimal `1.0` stays distinct from integer `1`. Registered metadata typing, input bounds, duplicate rejection, supported components and time/key policy remain in place. Unknown metadata has no new application meaning; its canonical value and ordering remain part of the signed base. SP is admitted after a semicolon; HTAB is still rejected there.

Verifier profile and offline directory audit advance to **`2026-10-31.2`**. The report cache advances to **`2026-10-31.3`** so changed current-profile interpretation does not reuse the old report namespace. Stored observations are not rewritten. [Research 119](119-directory-adoption-policy-and-cost.md) remains the historical result for the old parser; this study supersedes its decimal limitation for the new profile, without reopening directory-audit runtime adoption.

## Independent source comparison

We inspected and executed [`mnot/http-sf`](https://github.com/mnot/http-sf), using the exact **1.5.0** wheel and pinned typing dependency recorded by the earlier reference investigation. Artifact hashes are checked before execution; the output retains all 23 Python source hashes. The library represents decimals distinctly and serializes their canonical value. Our implementation uses the same separation of type from numeric value while keeping fractions as text and adding no dependency.

All 26 selected syntax cases are compared. Twenty-four results agree exactly. The two differences are intentional local rejection of duplicate parameters and dictionary labels; the generic library retains the last value. Both tab controls are rejected by both implementations. An initial suspicion that its whitespace helper admitted tabs was refuted by inspecting the helper body and executing those controls. Its name alone was insufficient evidence. RFC 9651 supersedes RFC 8941, but [its parameter algorithm](https://www.rfc-editor.org/rfc/rfc9651.html#section-4.2.3.2) retains the SP-only rule. No dates/display-string support or complete newer-spec coverage is claimed.

This comparison tests syntax and canonicalization, not independent end-to-end crypto, vendor identity, managed-provider agreement or full conformance. Our signed fixture bases are literal independently specified strings, not output from the parser being tested.

## Acceptance and delivery

[Fixture](../../../../analytics/test/fixtures/structured-extensions.mjs), [regression tests](../../../../analytics/test/structured-extensions.test.mjs), [Node/workerd harness](../../../scripts/check-structured-extensions.mjs), [pinned reference runner](../../../scripts/check-structured-extensions-reference.py) and [receipt](structured-extension-compatibility.json) preserve the method. A further unit control changes only semicolon spaces on the plain signed request and retains its signature, isolating whitespace compatibility from decimal compatibility.

The isolated original baseline passes 339 analytics tests and workspace types. Integration with the separately delivered discovery workbench passes **347 analytics tests**, **166 site tests**, workspace types, Markdown validation for 27 posts and the production build for 38 total posts. The final focused tests pass after adding the space-only control. Four synthetic local D1 rows preserve the new profile, historical `.1`, unrecognized-profile and contradictory-outcome states. Worker dry-run packaging passes. The first build attempt was denied a local tsx IPC socket by the sandbox; the permitted isolated rerun passed. No shared build directory or other session's source was changed.

This adds no dependency, schema, retention change, raw diagnostics, vendor capture, production query or human label. The article is unchanged. Local repair acceptance is complete; source delivery and deployment activation remain separate. Next: verify the exact source deployment, then repair the two demonstrated discovery-reporting risks from [Research 122](122-independent-agent-discovery-and-report-review.md) against the owning task's now-delivered implementation. The full goal remains active and incomplete.

# A parser can manufacture a Browser match

October 29, 2026 UTC. Continues [Research 89](89-local-browser-relays-and-fetch-metadata.md). Human trials remain deferred. This investigation changes collection/classification code; local acceptance and production activation are separate.

## What failed

Our extractor applied `trim().toLowerCase().slice(0, 32)` to Fetch Metadata tokens. With a browser UA claim, HTML acceptance, language and an unlisted synthetic ASN, **`NAVIGATE` became `navigate` and matched Browser**. Uppercase destination/site and non-ASCII surrounding whitespace had similar effects. Malformed activation became false, losing the distinction between invalid and a valid `?0`.

The opposite failure also existed: `navigate;x=1` remained a single unrecognized string. It could not match navigation even though the parameterized Item was valid. A case-preserving string comparison alone would repair only one direction.

Seventeen targeted Node/workerd controls demonstrate five former Browser promotions becoming Unresolved, three valid extended modes moving from Unresolved to Browser, and an unknown destination moving from HTTP client to Unresolved. Other controls preserve decisions or improve the recorded reason/activation fact. **These are selected fixtures, not production prevalence or human accuracy.** No truncated prefix is claimed to have manufactured a recognized mode; truncation instead discarded unknown-input detail.

## The standards distinction

The [September 21 Fetch Metadata Working Draft](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/) defines mode, destination and site as tokens and activation as Boolean. Their semantic values are specific strings. The [pinned Fetch snapshot](https://fetch.spec.whatwg.org/commit-snapshots/59afe349913d56898c947576216f1c2579308be7/#concept-request-destination) supplies the destination vocabulary, including `text`; its empty destination maps to the header token `empty`.

[RFC 9651](https://www.rfc-editor.org/rfc/rfc9651.html#name-parsing) preserves token characters, distinguishes tokens from quoted strings, validates the entire Item and permits parameters. Its extensibility rule also covers fields declared using a bare type. Duplicate parameter names use the last value; malformed earlier occurrences still fail parsing. Unknown parameters do not acquire local semantics. A valid uppercase token can therefore have unrecognized Fetch Metadata meaning; a quoted `"navigate"` has the wrong type.

We now separate **syntax, recognized meaning and classification**. Missing, valid, unrecognized, invalid and policy-limited inputs have distinct closed states. A field over our explicit 32,768-character processing limit abstains; this is an application budget, not a protocol maximum. Original Request headers remain available unchanged to signature verification.

## What we borrowed and what we checked

Two integrity-checked npm packages informed the comparison. [`structured-headers` 2.1.1](https://www.npmjs.com/package/structured-headers/v/2.1.1) rejects `navigate;x=@1;y=?0`: its date parser consumes to end-of-input instead of stopping before the next parameter. [`structured-field-values` 2.0.4](https://www.npmjs.com/package/structured-field-values/v/2.0.4) accepts surrounding non-ASCII whitespace through `trim()` and rejects the RFC 9651 display-string extension; its documentation targets RFC 8941 plus an earlier date extension. These are four-case comparisons, not general library rankings. Neither package was added to production.

The focused [parser module](../../../../analytics/src/fetch-metadata.ts) follows the Item algorithms while discarding arbitrary parameter values after complete validation. It handles the primary token/Boolean distinction and validates the other bare types in parameters. It does not expose general List/Dictionary parsing or claim complete generic Structured Fields conformance.

The independent [HTTPWG corpus](https://github.com/httpwg/structured-field-tests/tree/c1da2cafb27d125905f9b8176cc593def7a0e81d) contributes 854 Item cases. Node and workerd agree on every result: 846 mandatory outcomes pass; of eight permitted-failure cases, six accept and two reject. Checks cover acceptance, primary token/Boolean values/types and parameter presence. Discarded parameter values and general serialization are outside this check. The [harness](check-fetch-metadata-local.mjs) records the narrower scope explicitly.

## Evidence that survives collection

Collection profile `2026-10-29.6`, classifier `2026-10-29.3`, and classification/receipt format `2026-10-29.2` retain four field states and successfully parsed parameter flags in a fixed 16-bit encoding. Zero means unassessed. Unknown encodings remain unassessed; optional invalid/unrecognized fields prevent promotion at the Browser branch. Named declarations, hosting-network rules and signature evidence keep their independent precedence. A valid false or absent activation still permits the existing navigation-shape rule; neither is a human test.

Unknown field text and parameter values do not enter the closed record. An invalid activation retains `invalid`, instead of being reported as an absent/false claim. The complete declaration catalogue plus the new facts remains within the existing 2,048-byte JSON constraint. Private stored receipts project the same facts for exact reconciliation. The aggregate replay tool also reports parsing states beside semantic values, so discarded unknown values cannot masquerade as proven absence.

All **100 saved recovered contexts and fifteen saved agent-browser controls** keep their classifications in Node/workerd. Inputs are re-read from hash-verified private archives. All **52 older receipt projections** remain equal; this is projection compatibility, not fresh cryptographic verification. Five actual local workerd collector/D1 writes produce five equal receipt projections under the new profiles, including malformed and parameterized cases. No schema migration, production request, production SELECT or human label is used in these experiments.

[Results](fetch-metadata-parsing-checks.json) and [source commitments](fetch-metadata-parsing-sources.json) preserve methods and limits. Analytics tests, site tests, types and an isolated build are recorded separately. The article replaces its existing uncertainty paragraph with this lesson, retaining its concise form and 31 prompts. Source delivery/production acceptance will be linked separately; local results do not establish current production behavior.

## What this leaves open

Historical data normalized under old profiles cannot reconstruct original field values without retained inputs. The two saved cohorts establish no normalization-related population inflation. Header correctness also cannot identify an operator, device or human trigger. Native managed-verifier agreement and human/device measurements remain open; human trials stay deferred.

The next bounded check is activation and a small excluded current-collector control with exact receipt/storage linkage, after a native-tested immutable query plan. Then inspect whether public reporting should expose the new parsing-state denominators without hiding historical unassessed records. October 31 remains a private evidence review date, not automatic erasure.

Private data commitment: 209 files, manifest `7424e78af6e1f8bccf2e32c169c36a118cf22566961fce5330df8b9f8a34618f`; raw sources, requests and logs remain outside Git.

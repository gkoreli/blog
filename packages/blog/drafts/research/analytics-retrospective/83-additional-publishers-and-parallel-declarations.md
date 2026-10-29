# Additional publishers, bounded proofs and new Parallel declarations

October 29, 2026 UTC. Continues [Research 82](82-outcome-only-candidates-and-retained-contexts.md). Human trials and separate owner-browser verification remain deferred. This iteration reviews the nineteen previously unassessed retained contexts, tests a failed root-path hypothesis and repairs a newly documented naming gap. It establishes no authenticated D1 joins or human-trigger labels.

## What the additional contexts establish

Four fixed signing-origin candidates were reviewed privately. A capture procedure checked every resolved address was globally routable, pinned one address to the TLS hostname, permitted HTTPS only, rejected redirects and bounded bodies to 1 MiB. No reader headers were forwarded. Three directories returned HTTP 200 with the expected media type; one failed DNS resolution. These capture conditions do not establish safe DNS/egress behavior in the production Worker.

Opaque aliases preserve the unapproved operational origin mapping. A fetched directory and a verifying proof do not authorize a public signer name. Public display approvals remain unchanged.

| Publisher alias | Original contexts | Captured-context result | Verified coverage |
| --- | ---: | --- | --- |
| publisher-1 | 1 | Not assessed: directory capture unavailable | Unknown |
| publisher-2 | 3 | 3 verified | Authority; UA and resource unsigned |
| publisher-3 | 14 | 7 verified, 7 signature-invalid | Positive seven bind authority, method and path; UA and query unsigned |
| publisher-4 | 1 | 1 verified | Authority; UA and resource unsigned |

The [Node/local-workerd replay](additional-publishers-replay.json) agrees across **55 contexts**: nineteen originals and two controls for each of eighteen originals with captured directories. Every changed authority fails. Changing UA and path together preserves the four authority-only originals and fails for all fourteen path-covering inputs. A failed original stays failed under these changes; it does not demonstrate which changed field caused failure.

Pinned [pyauth/http-message-signatures](https://github.com/pyauth/http-message-signatures/tree/1de433d9a49fd608475c6054ab14a1652c088844) independently agrees on **54 contexts**, including the seven original failures. Its eighteen source files were rechecked. The wrapper uses recorded clocks, a one-day age bound and five-second skew; our local profile allows sixty-second skew. No observed result diverges at that boundary. This generic RFC comparison does not reproduce a managed provider verifier or its admission policy.

These are later keys applied to retained request representations at recorded times. They do not reconstruct original directory state, wire-complete requests, storage-row identity, organic provenance or actual use. **Eleven newly verifying retained contexts are not eleven newly verified D1 rows.** The [reference receipt](additional-publishers-reference.json) preserves the independent results without raw headers or request references.

## A root-path hypothesis that failed

The fourteen publisher-3 inputs declare DuckDuckBot. All are GETs with no query. Seven root-path contexts fail; seven contexts on one other path verify. Host headers agree with the captured URL host. All fourteen signature byte strings are distinct; no reused-proof pairs are established. Root-path inputs also contain nonroot same-site referrers, but that correlation does not identify a producer, redirect or transport cause.

[RFC 9421 §2.2.6](https://www.rfc-editor.org/rfc/rfc9421.html#section-2.2.6) represents an empty path as `/`. A deliberately noncompliant empty-value signature base did **not** recover any of the seven failures. The [primitive byte probe](additional-publishers-path-probe.json) runs 28 contexts in Node and local workerd: the seven nonroot RFC bases verify; the seven root RFC bases and all fourteen empty-path counterfactuals fail. This probe evaluates signature bytes only, not freshness or discovery.

No fallback or URL guessing was added. The failure cause remains unresolved. Absence of placeholder-shaped values does not establish wire fidelity, and replay failure does not prove original-request invalidity.

## A primary source changed the declaration catalogue

[Parallel's bot documentation](https://parallel.ai/parallel-web-systems-bots), effective October 24, distinguishes **ShapBot**, which builds its search index, from **Shap-User**, which retrieves content on users' behalf. Both are documented Web Bot Auth signers with distinct directories; ShapBot also has a published address feed. Those are vendor statements about the products, not proof that a particular request had a human trigger.

Neither declaration was in our catalogue. The implementation adds exact product matches and preserves their indexing/retrieval distinction as `ai-search` and `ai-assistant`. Signed, unsigned and failed-signature fixtures retain that declared role. Mixed ShapBot/Shap-User claims remain Unresolved, and an impostor substring receives no named identity. Public query/filter validation accepts the two names in their respective groups.

The catalogue now has **51 canonical names and 54 product aliases**. Eighteen names retain at least one configured per-declaration method; **33 have none**. This change does **not** register Parallel signing origins or its feed. Their methods are documented but not configured, an explicit next implementation step. No public signer approval or verifier policy changes.

The checked [DuckDuckBot page](https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot) documents its crawler and IP feed; it supplies no signing promise or link to the retained claimed signing origin. The [Meta crawler page](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers), inspected in the native browser, documents Meta-WebIndexer but supplies no signing promise on that page. A scoped search found no usable authoritative source for publisher-1. These bounded searches establish documentation gaps, not global absence, maliciousness or failed ownership. [Source captures and limits](additional-publishers-sources.json) keep these distinctions separate.

## More names exposed a storage limit

The expanded all-product fixture produced **2,066 bytes**, exceeding the existing 2,048-byte classification-evidence CHECK. Dropping names would hide ambiguity. Raising the limit would avoid addressing redundant representation.

The new evidence envelope, `2026-10-29.1`, retains all names and aliases and encodes the category set with fixed bit assignments. The maximal collector fixture now stores **1,928 bytes** in actual local D1. A closed decoder preserves old `2026-10-27.2` arrays and rejects unknown versions, invalid bits and malformed values. Decoding facts does not authenticate them or prove whole-record coherence. Existing rows are not rewritten.

Collection advances to `2026-10-29.4`, classifier to `2026-10-29.2`, report/cache to `2026-10-29.3`; verifier remains `2026-10-29.1`. Active cohort/population/receipt diagnostic readers accept both evidence envelopes and the new stamps; frozen historical artifacts remain intact.

The [native collector fixture](parallel-declarations-native.json) stores seven observations, retains complete names/aliases, verifies two locally generated signatures, preserves absent/unmapped/conflicting evidence and reconciles both two-view named filters with the seven-view report. Generated fixture keys are not Parallel authentication. [Checks](additional-publishers-checks.json): 287 analytics tests, 117 site tests, workspace types, Markdown validation and an isolated 33-post build pass. Initial suite/harness failures and a mistakenly targeted shared-output build remain recorded; no active development server was found, and a final isolated build passes.

The concise article replaces an existing paragraph with the variable-coverage lesson: **1,375 words, 31 shaping prompts**. Production activation and served acceptance are separate from these source/local checks. No production D1 statement, site visit, optional capture or human label occurs in this research slice. Private captures remain restricted outside Git; October 31 is a review date, not automatic erasure.

Next: deliver and accept the exact source, then implement Parallel's documented per-client signing methods with versioned publisher provenance and native positive/negative controls. Historical joins, failed-context causes, managed verification, R1 attribution, privacy decisions and human/device calibration remain open. Human trials stay deferred.

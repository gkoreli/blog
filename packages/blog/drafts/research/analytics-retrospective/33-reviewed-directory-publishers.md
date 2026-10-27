# Reviewed directory publishers — October 27, 2026 UTC

Ahrefs exposes a first-party signature-key directory, and four retained request signatures replay against its captured keys. Its inspected crawler documentation supplies IP/rDNS methods without a per-client signing promise. Treating both findings as the same documented method would manufacture certainty. The new `directory-publication` capability keeps them separate.

This extends [research 32](32-vendor-receipts-and-exact-storage-references.md). Human trials remain deferred; no new human/device or population accuracy claim is made.

## The distinction worth retaining

[Ahrefs' crawler page](https://ahrefs.com/robot) identifies AhrefsBot and AhrefsSiteAudit, their purposes and network-verification methods. [ExaUser's page](https://crawler.exa.ai/exauser) explicitly describes signing and live retrieval for users or applications. The [captured directory publication](vendor-directory-publication.json) records successful direct HTTPS responses from both first-party origins, independent of those different per-client statements. [Retained replays](vendor-retained-reconciliation.json) authenticate selected request components using later-captured keys; they do not prove the original key distribution, an uncovered client role or a human trigger.

The [WG protocol draft -00](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.4) distinguishes the association between a directory URL and keys from other identity claims. Its [Appendix B](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#appendix-B) treats TLS as the authority over the directory domain, permits a directly resolving verifier to use keys without response-possession proof, and describes stronger signed-response/digest requirements when using such proof. The same key can appear under several domains; a validated binding belongs to the particular pair. This is work in progress, not an additional final RFC.

The existing verifier performs bounded direct HTTPS discovery. This iteration adds neither response-possession-proof verification nor third-party key-redistribution trust. The observed response-signature headers alone do not establish either. [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2) still requires application-specific interpretation of covered components, keys and replay risk.

The [previous pinned Cloudflare reference review](18-webbotauth-verification.md#standards-vendor-claims-and-local-policy) supplies relevant prior art: keep resolution, cryptographic checks and application policy separate. Its saved [source manifest](webbotauth-reference-sources.json) pins commit `e4d3167`; this turn's fresh raw-source web retrieval failed. No claim of inspecting a newer library version or adding a dependency follows. The authoritative draft and vendor pages were read this turn; directory captures/replays remain the specifically dated evidence from research 32.

## What the implementation records

[`directory-publication.ts`](../../../../analytics/src/directory-publication.ts) compares the existing local result with a small reviewed registry. It adds no fetch, key validation, authorization or allowlist. Exa's per-client documented method remains in `vendor-signatures.ts`; Ahrefs remains unconfigured there. First-party directory publication is a separate method and can produce a different result for the same event.

| Stored state | Meaning |
|---|---|
| No declaration | No recognized named client was declared. |
| Not configured | Declared clients have no reviewed directory mapping. |
| Not verified | A reviewed publisher applies, but the local signature was not verified. |
| Matching / different publisher | A locally verified publisher origin matches / differs from the reviewed endpoint. Neither authenticates an unsigned client role. |
| Partial mapping | Some declarations lack a reviewed directory. |
| Conflicting publishers | Declarations name different reviewed publishers. This takes precedence over partial mapping; both counts remain in the record. |
| Test injected | The verdict is supplied by a fixture; no cryptographic publisher proof. |
| Not recorded / unrecognized | Earlier missing detail or an inconsistent/unknown record; no interpretation through today's registry. |

The stored assessment has a profile, method, review date and configured/unmapped counts. It emits no raw origin, request header, key, nonce or identifier. The current registry date describes our endpoint review, not a fresh endpoint fetch on every event. The verifier's own cache/discovery policy remains separate.

Signature evidence becomes `.5`, collection `.10`, private scalar receipt `.3`, report/cache `.9`. Classifier `.5`, verifier `.6`, the schema and optional diagnostic configuration stay unchanged. Existing observations are not rewritten. Native-category and signature-basis readers recognize the new enclosing evidence version without turning older missing publication detail into a new result. Shared browser display types live in a dependency-free contract module; client compilation does not pull in the Worker verifier.

Public `byDirectoryPublication` is a closed distribution over the same selected population and exclusions. Each event appears once, and strict decoding rejects unknown labels, duplicate groups, nonpositive/noninteger counts or a sum differing from the headline. The UI separates this table from documented signing methods. Unknown and historical states remain visible. Private receipts snapshot the new facts before binding and retain the separate exact-text row reference after acknowledgement. Capture-comparison/replay tools understand the new receipt while preserving earlier versions; the comparison tool also checks separate storage fields without publishing their values.

## Experiments and cost

[Unit checks and source acceptance](directory-publication-source-checks.json) cover all eight emitted states, exact origin comparisons, duplicate declarations, partial mappings, competing publishers, arbitrary-value canaries, injected verdicts and the existing 2,048-byte JSON ceiling. Report fixtures preserve null/older history and malformed/source/status/count mismatches. No synthetic valid-looking field is treated as real vendor evidence.

[Twenty-five native collector controls](directory-publication-collector.json), using actual workerd/D1/Ed25519 with intercepted fixture directories, include an Ahrefs-origin signature whose publication assessment matches while its documented method stays unconfigured. Other controls cover conflicting publishers, partial mappings, no/unconfigured declarations, coverage, acknowledgement failures, unsafe integer references, optional failure and exclusions. Fixture keys at a reviewed origin are not organic vendor authentication; supplied Cloudflare metadata is not a real native bot verdict.

[Native report acceptance](directory-publication-local.json) exercises twelve included records spanning all states, two unrecorded histories and two malformed records. Owner flags, the owner registry, referral/path/time boundaries and empty scopes are checked. A 512-row historical-null comparison preserves every common report field; reads rise **23,190 → 24,217**, an additional **1,027** for the new grouped assessment. The baseline pins stats source `c30a661` with current shared helpers; their behavior is unchanged for this null-history dataset. This is local cost, not a production forecast.

A [single prepared production report SELECT](directory-publication-production.json), native-tested before execution, returns fifteen selected `/privacy` events, all with assessment not recorded. It costs **8,048 reads, zero writes/changes, `changed_db=false`**, under the reviewed 20,000-read threshold. Wrangler uses one private SQL argv in command mode; no import/file execution or history mutation. The threshold is an operator post-execution check, not a database-enforced cap. This pre-deployment read does not prove new collection, organic matching or whole-population prevalence.

## Retained exact-reference follow-up

A scoped last-hour native search for verified receipts with returned references showed zero matches. A positive-control search for returned references showed/copied one: the earlier actual unsigned collection `.9` control. Its operation/time match, receipt and exact private storage-reference fields agree with the live tail. [Comparison receipt](storage-reference-export-followup.json). No extra D1 SELECT was needed. This validates that specific retained reference, not complete retention or prospective receipt `.3` fields. The zero signed result is not population absence, and no wait process is claimed active.

## Delivery and remaining acceptance

The concise article links this distinction without adding words: 1,250 body words, 31 genuine shaping prompts. The privacy disclosure names the separate publisher assessment and its limits. [ADR-0016.13](../../../../../docs/adr/0016.13-verification-outcomes-and-vendor-methods.md) records the decision; the [analytics capability map](../../../../analytics/README.md#web-bot-auth) locates the modules.

Source checks pass: 184 analytics/106 site tests, workspace types, frontmatter, syntax, local links and the isolated 32-post build. An agent-operated localhost browser renders all ten basis labels with a twelve-event native synthetic report; the preview is stopped. Source publication, activation, actual prospective storage and public API/cache/browser acceptance remain separate gates. Planned acceptance: one excluded unsigned Ahrefs-declaring control, receipt/readback through the existing exact reference with the native-tested 100-read query, and a narrow public report/cache/UI comparison against the prepared report. Synthetic positive/partial/conflict labels are accepted locally; actual signed collection remains dependent on organic evidence. The new assessment adds visibility without making a stronger readership or per-client signing claim. Replay/DNS/egress, retention/basis/rights, historical loss/sampling and deferred human/device accuracy remain open.

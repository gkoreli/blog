# Agent and bot detection: assumption audit

October 26, 2026 Pacific / October 27 UTC. Follow-up to the owner's observation that there is more to learn about agent and bot detection. This continues TASK-0119 and TASK-0120; it does not reopen accepted catalogue releases or claim production error rates.

## Executed counterexamples

The [maintained probe](probe-detection-boundaries.mjs) runs eight rule cases and four cryptographic variants against the actual compiled classifier, metadata extractor, reader-kind classifier and verifier. [Saved output](detection-boundaries.json) pins source/probe hashes, classifier `2026-10-26.3`, Node 24.14.1 and base source `d5b7561`. The analytics package was freshly compiled through its test command: 86 pass, zero failures. All twelve probe cases pass their assertions. No network or production request was made. Inputs, origins and ephemeral keys are synthetic; no vendor was impersonated or verified. The JSON writer refuses an existing output path.

Reproduce from the repository root:

```sh
pnpm -C packages/analytics test
node packages/blog/drafts/research/analytics-retrospective/probe-detection-boundaries.mjs /tmp/new-detection-boundaries.json
```

| Controlled input | Actual current result | What we learned |
|---|---|---|
| Navigation-shaped headers, ASN missing | Browser / navigation-shaped | Missing network evidence is collapsed with the unlisted-network case. The result cannot establish a normal or residential source. |
| Same headers, private-use fixture ASN 64512 | Same Browser result | Being outside a finite hosting list establishes a list nonmatch, not a residential network or human operator. |
| Same headers, listed ASN 16509 | Cloud browser | Network membership changes the partition without establishing who operated the browser. This fixture makes no claim about a real request from that network. |
| Navigation with no Sec-Fetch-User | Browser | The rule does not require user activation. Its absence must not be narrated as a failed human check. |
| External Referer with same-origin metadata | Browser | Inconsistency does not affect this classification. It may warrant a separate diagnostic flag, not automatic attribution or exclusion. |
| `NotChatGPT-Userish/1.0` | ChatGPT-User / AI assistant | The substring matcher accepts a non-token lookalike. This is a concrete parser boundary gap. |
| `GPTBot/1.0 ChatGPT-User/1.0` | ChatGPT-User / AI assistant | Ordered matching hides a conflicting declaration; output does not retain all matching candidates. |
| `NotExaUserish/1.0` | No named match; Browser with supplied navigation headers | The repaired Exa rule avoids the analogous substring match. The overall classifier still accepts this arbitrary UA as Browser; it does not require a recognized browser-family token. |

Implementation cross-reference: [classify.ts](../../../../analytics/src/classify.ts) uses ordered regular-expression rules and defaults unmatched clients to the coarse browser traffic class; [readerkind.ts](../../../../analytics/src/readerkind.ts) uses network-list membership and request shape; [metadata.ts](../../../../analytics/src/metadata.ts) supplies a nullable ASN and activation marker. These are local rule sensitivities, not a count of organic misclassifications. No production rule or history changed in this research iteration.

## A verified signature may leave the declared role unsigned

The probe generates an ephemeral Ed25519 key and signs only `@authority` and the selected `Signature-Agent` member. Directory responses are injected locally and the clock is fixed. It uses our real signature-base builder and verifier, rather than a stubbed verified verdict.

| Variant using the same signature bytes | Verification | Declared kind |
|---|---|---|
| Original ExaSearchBot declaration | Verified local fixture key | AI search |
| UA changed to ExaUser | Still verified | AI assistant |
| Path changed | Still verified | AI search |
| Covered authority changed | Signature invalid | AI search declaration remains |

The synthetic signer is `agent.example`, not Exa. Using the documented token names tests the difference between a name claim and key possession; it does not establish Exa identity. The invalid-signature case also shows why an unverifiable request can retain its **declared** role without being treated as verified.

This is expected selective-signature behavior. [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2) makes coverage and replay policy application-specific. The active [Web Bot Auth protocol draft -00](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00), September 1, 2026, warns that minimal authority coverage is reusable across paths/methods until expiry and recommends broader coverage/shorter validity. It also defines a user as potentially human **or another system**. It is an Internet-Draft, not a final RFC.

Our [verifier](../../../../analytics/src/webbotauth.ts) returns verification status and normalized signing origin; the main observation row does not preserve the covered-component list or whether the UA/path was signed. Therefore a report cannot upgrade a declared role into an authenticated role just because signature_status is verified. We have not measured how often organic signatures cover those fields, or accepted a broader conformance/replay/rotation matrix. Do not reject all minimal signatures as nonconforming or describe this probe as a cryptographic exploit.

## Primary documentation adds several boundaries

Sources read October 26 Pacific / October 27 UTC. Documentation establishes documented capabilities, not actual entitlement or current field population on our zone.

| Source | Implication for this system |
|---|---|
| [W3C Fetch Metadata, Working Draft September 21, 2026](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/) | These are browser request-context headers. Sec-Fetch-User represents navigation activation, and header emission depends on a trustworthy target. Neither presence nor absence is a universal human test. Audit the code comment claiming support on every request; do not generalize browser-version thresholds to all transport contexts. |
| [ExaUser documentation, updated September 30](https://crawler.exa.ai/exauser) | On-demand retrieval may be requested by a user **or an application using the API**. On-demand does not establish a human trigger, attention or answer citation. |
| [Cloudflare verified bots, updated October 8](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) | The directory distinguishes multiple behaviors and Direct versus Intermediary operation. Operator identity and the downstream initiating party differ. Those directory classifications are not all individual WAF/request fields and do not authenticate an ordinary request's trigger. |
| [Cloudflare Bot Management variables, updated September 16](https://developers.cloudflare.com/bots/reference/bot-management-variables/) | Request fields include vendor assessments such as verifiedBot, signedAgent, score, category and detection IDs. Preserve source/availability and disagreements if used; no empty field should mean not-a-bot. |
| [Cloudflare bot scores, updated August 26](https://developers.cloudflare.com/bots/concepts/bot-score/) | Scores are assessments; granular scores require Enterprise Bot Management. Our earlier Workers Paid receipt is not evidence of that entitlement. Missing/uncomputed and low scores have different meanings. |
| [Chrome User-Agent Client Hints](https://developer.chrome.com/docs/privacy-security/user-agent-client-hints) | UA-derived OS/device values can be reduced or frozen; Client Hints are browser-provided claims, with additional details subject to delivery/negotiation. Do not infer physical hardware or request more detail merely because it is available. |
| [Cloudflare JA3/JA4](https://developers.cloudflare.com/bots/additional-configurations/ja3-ja4-fingerprint/) | TLS fingerprints describe client transport characteristics; they are not a unique operator, person or purpose. Access is plan-dependent. No new fingerprint collection is implemented or justified by this review. |

## Next experiments, ordered by decision value

1. **Stop expressing unknown network evidence as a known normal source.** Design an explicit missing / listed / not-listed network outcome and public reason, preserving the historical partition and method boundary. Test missing/invalid ASN, consumer VPN/relay, hosting networks and unlisted infrastructure separately. A hosting-list nonmatch must not become a residential verdict. This is a proposed repair, not a shipped one.
2. **Tighten the whole named-UA catalogue and expose conflict.** Use documented token forms, boundary negatives and multi-token cases. Retain matched candidates or a conflict state instead of silently resolving incompatible roles by rule order. Run a complete catalogue fixture set before a prospective version change; measure organic prevalence only if retained evidence supports it. Exact token matching still proves only a declaration.
3. **Make verification evidence explainable.** Evaluate bounded closed-vocabulary coverage facts (UA covered, target covered, validity checked), key/directory provenance and exact reviewed vendor recognition separately. Test authority-only versus request-bound signatures, expiry/skew, changed components, repeated signed messages, directory/key rotation and unavailable verification. Price the lookup/cache/retention cost before adding a replay store. Keep absence, unsupported, unavailable and invalid distinct.
4. **Validate unsigned vendor claims using vendor-specific procedures.** While the address is available in memory, evaluate official published IP lists or documented forward-confirmed reverse DNS as appropriate. Record a bounded result/method/source version rather than assuming every vendor has the same verification process or retaining raw addresses indefinitely. Shared infrastructure alone is insufficient. Network failures should yield unavailable, not a spoofing verdict.
5. **Build a labelled matrix for each evidence axis.** Use known agent-operated browser visits, controlled HTTP clients, documented cooperative crawlers and explicitly human-operated trials. Cross browser engine/device, scripts on/off, VPN/relay/cloud location and declared names independently. Keep labels tied to how each trial was operated; do not use the detector's own output as its ground truth. Real phones, human baselines and production provider receipt remain unaccepted after the [18 local stage trials](../edge-vs-rum/06-controlled-stage-experiment.md).
6. **Measure error and abstention before combining signals.** For a separately defined human/automation prediction, report the confusion matrix on known controls plus unknown/unavailable coverage; do not score the descriptive Browser class as if it promised a human prediction. Compare native assessments and local facts on the same safely joined requests. Disagreement is evidence to investigate, not permission to pick the flattering answer.
7. **Separate fetching, indexing, answering and readership.** A crawler request alone establishes none of the downstream stages. Test actual agent tasks with saved answers and exact source URLs; retain attribution uncertainty for caches, intermediary fetches and ordinary traffic. An authenticated task receipt would require a cooperating client and scoped protocol; it is not a universal retrofit for anonymous requests.

The [privacy/collection review](13-eu-us-collection-boundaries.md) still governs any new linked collection. Parsed facts, private diagnostics, provider logs and public aggregates have different access/retention needs. No fingerprint, cross-session tracking, expanded capture or new reporting exclusion has been activated. R1 remains unresolved; this audit does not establish its operator or purpose.

[Source acceptance](detection-source-checks.json): 86 analytics tests pass; all twelve probe cases pass; the probe hash matches its receipt. Frontmatter and the isolated 31-post build pass, with one article H1, 28 shaping prompts and approximately 1,200 article words. All 115 relative document links checked in the changed files resolve. The article now reports the measured local signature-coverage result without claiming vendor acceptance or a cryptographic break. Code delivery and served-publication acceptance remain separate from these local checks.

[Publication acceptance](detection-publication.json) subsequently verifies source `52d883a`, a 100% Worker activation, exact served Markdown match and 28 public prompts. The article update is accepted; the detector repairs and broader experiments above remain proposed. No production accuracy, vendor verification or expanded capture follows from publishing the findings.

## Superseding prospective implementation

[Research 19](19-explicit-classification-uncertainty.md) owns the October 27 classifier repair and current reproduction. The twelve-case probe and results above remain frozen to their recorded source/classifier; reproduce those assertions from that checkout. New regression cases/native acceptance and the same-input R1 replay preserve the changed behavior without rewriting the historical capture.

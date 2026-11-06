# Detection domains: reproducible seams before extending attribution

November 5, 2026 Pacific / November 6 UTC. Source-only investigation for the renewed identity/purpose work, following [the fresh aggregate diagnosis](127-current-unidentified-and-unsigned-traffic.md). This is independent of a fresh retained-row production export. It neither identifies an operator nor changes a stored classification.

## Method and scope

Read [ADR-0016.12](../../../../../docs/adr/0016.12-explicit-classification-uncertainty.md), the current collector, declaration and reader-kind rules, optional request evidence, signature/native/network assessments, persistence and report SQL. Compile analytics into an isolated directory using `pnpm -C packages/analytics exec tsc -p tsconfig.test.json --outDir /tmp/analytics-domain-audit-20261106`. That compilation passes. The inspected checkout reports `18606bd538c3899ea8786abd71517519df5834cd`; concurrent source/delivery work remains separate.

Execute local Node calls against those compiled modules. For the report case, insert one synthetic observation into Node SQLite using the repository schema and call actual `queryStats` through a prepared-statement adapter. These are deterministic synthetic controls, not production incidences, independent clients or a measured accuracy rate. This first audit phase makes no production/network request, schema mutation, runtime edit or expanded logging. The later candidate work below is a separate local implementation phase; native D1 parity and release are not claimed here.

## Case 1: no selected name is different from no declaration

Input: `ChatGPT-User/1.0 ExaUser/1.0`, no signature headers. Actual current analysis retains two candidates, sets scalar `agentName` to null and returns `ai-assistant / multiple-declarations-same-category`. Actual public SQL on one corresponding synthetic row returns:

```json
{"total":1,"byAgent":[],"byKind":[{"kind":"ai-assistant","reason":"multiple-declarations-same-category","views":1,"dailyClients":1}],"declarations":{"status":"multiple","candidates":["ChatGPT-User","ExaUser"],"matchedProducts":["ChatGPT-User","ExaUser"],"browserFamily":"unrecognized"}}
```

The declaration model is behaving as designed: do not pick an identity from compatible claims. The named report selects `agent_name IS NOT NULL`, so subtracting its sum from the headline measures **absence of a selected scalar name**, which can include requests with several recognized declarations. It cannot universally measure zero recognized declarations. A conflicting input, `GPTBot/1.0 ChatGPT-User/1.0`, similarly retains both names and returns Unresolved rather than selecting one.

The fresh seven-day aggregate's independently reported `vendorNetwork.noDeclarationViews` happens to equal total minus `byAgent`. Preserve that specific agreement. Do not generalize the equality into a permanent reporting invariant or use it for older records without comparable declaration evidence.

Expected boundary: retain one event; distinguish no-match, single-match, compatible multiple and conflicting multiple, with unsupported/missing/inconsistent history separate. A candidate-detail view can overlap by candidate, but must disclose its non-additivity. Never split one event into two headline views or silently assign a chosen client. This is a diagnostic/reporting improvement, not a defect in the intended abstention rule.

Sources: [scalar selection and full candidates](../../../../analytics/src/classify.ts), [compatible/conflicting kind rules](../../../../analytics/src/readerkind.ts), [stored declaration evidence](../../../../analytics/src/classification-evidence.ts), [named report SQL](../../../../analytics/src/stats.ts), and existing compatible/multiple tests in [classification-evidence.test.mjs](../../../../analytics/test/classification-evidence.test.mjs).

## Case 2: independent browser parsers give different support explanations

With an unlisted synthetic ASN, HTML/language acceptance, missing Fetch Metadata and absent signatures, the initial source baseline gives:

| User-Agent input | Declared browser family | Claims Fetch Metadata support | Stored-kind calculation |
| --- | --- | --- | --- |
| `Chrome/150.0` | chromium | true | Unresolved / fetch-metadata-absent |
| `Chromium/150.0` | chromium | false | Unresolved / fetch-metadata-support-unknown |
| `chrome/150.0` | chromium | false | Unresolved / fetch-metadata-support-unknown |

`analyzeTraffic` lowercases lexical product names and recognizes Chrome, Chromium and CriOS as the same coarse family. `claimsFetchMetadataBrowser` independently scans a case-sensitive `Chrome/` expression; the documentation immediately above it describes Chromium support. Optional `extractRequestEvidence` has a third browser parser with its own family vocabulary and version extraction. These producers can disagree even before headers are missing or a relay intervenes.

Expected boundary: a shared parsed browser-claim value supplies family, version and parser provenance to separate support policy and device-form interpretations. Unsupported platform/version/context must still abstain; a family match alone cannot authenticate browser execution or establish guaranteed header emission. Chromium aliases and capitalization require an explicit policy rather than accidental differences between regexes. The observed difference changes the *reason within Unresolved*, not a human/automation outcome; its production frequency is unmeasured.

An implementation should preserve genuine iOS versus desktop-engine differences. Do not blindly turn every Chrome-family spelling or Firefox-on-iOS spelling into desktop capability. First agree on the intended lexical policy, preserve the current historical profile, and add actual metadata-extractor-to-classifier controls for each supported case.

Sources: [browser-family extraction](../../../../analytics/src/classify.ts), [support policy](../../../../analytics/src/readerkind.ts), [optional evidence parser](../../../../analytics/src/request-evidence.ts), and [existing support/unknown tests](../../../../analytics/test/classification-evidence.test.mjs). This is a reproducible normalization inconsistency; it does not establish that all three inputs represent real browsers.

## Case 3: a URL-only bot substring changes the generic role verdict

Use the same missing-context synthetic conditions as Case 2:

```text
Mozilla/5.0 AppleWebKit/537.36 Chrome/150.0 Safari/537.36
Mozilla/5.0 AppleWebKit/537.36 Chrome/150.0 Safari/537.36 (+https://example.test/robot)
```

The first input returns coarse `browser`, no named declarations, and Unresolved / fetch-metadata-absent. Appending only the URL changes the coarse result to `bot` and the reader kind to Other bot / generic-bot, while declarations remain empty and the recognized browser family remains chromium. `GENERIC_BOT` scans the whole original User-Agent, so the final `bot` in `/robot` satisfies `bot\b`. The exact named product matcher correctly avoids recognizing names from URLs, but its generic fallback does not share that boundary.

This is a rule-scope counterexample, not proof that any production Generic bot event is a browser. The generic rule may deliberately value recall and use descriptive comment text. That tradeoff needs an explicit contract: a reference URL containing bot-related text is weaker evidence than a software product claim. Existing tests verify that URLs do not select a named client; they do not assert the coarse/generic-kind boundary for those same inputs.

Expected invariant for a proposed repair: adding an unrelated reference URL alone cannot create a software automation declaration. Test actual product tokens, documented comment forms, ordinary prose, embedded URLs, malformed products and name lookalikes. Preserve real generic tools such as `curl/`, `python-requests`, monitors and headless markers according to an explicit closed matching policy. Do not convert a discarded generic match directly into Browser; insufficient navigation/network evidence must still return Unresolved.

The current retained generic result does not say *which* marker matched or whether the match occurred in a URL, product or free comment. Original source bytes cannot be reconstructed from that result. A future closed marker/evidence-location field could improve explainability, but changes to collection need a concrete decision and version; this audit does not enable it by default. First inspect existing retained optional/native evidence where actually available.

Sources: [generic regex and fallback](../../../../analytics/src/classify.ts), [generic role precedence](../../../../analytics/src/readerkind.ts), and [current URL-boundary tests](../../../../analytics/test/classification-evidence.test.mjs).

## The boundaries that should remain separate

The useful domain boundaries are already partly present:

- Request facts and declaration parsing describe received claims. A parsed name, software marker and browser support claim are not provider identity.
- Reader-kind policy interprets those facts under a version. Network membership, navigation shape and declaration compatibility are separate inputs; provider categories should not silently override the local result.
- Signature, publisher and published-IP checks concern different authenticated or compared facts. Unavailable, skipped, nonlisted and invalid must remain distinct. Compatible signing/feed evidence does not prove purpose, user initiation or a human.
- Persistence records the calculated result and its provenance. Reports preserve history and expose missingness; they do not run today's classifier over historical rows without a separately labelled replay.

The current live client catalogue, role arrays, signing maps, IP maps, historical declaration profiles and SQL profile allowlists are maintained in several files. A single mutable registry should not replace the historical snapshots: their independence is what makes stored-version checks useful. A bounded improvement is one typed **current** declaration descriptor for aliases and declared role, with explicit intentional legacy/generic exceptions, plus a test that the current registry agrees with its reviewed historical snapshot and configured-method projections. Identity methods remain a separate domain keyed by canonical declaration, not an implicit property of every product from the same vendor.

## What the fresh row investigation needs

For the generic Other-bot/provider-category cohort, existing retained fields can answer more than the aggregate report: exact ID and time, stored kind/reason and coarse class, scalar selected name, `classification_evidence` including candidate names/status/aliases/category bits/browser family, collection/classifier stamps, signature status/evidence, provider category, vendor-IP evidence and source assignments, retained Fetch Metadata and representation. Assess source assignment coherence offline with the existing [assignment analyzer](../../../../analytics/src/vendor-declaration-assessment.ts); its structural and assignment questions are separate from live network verification. Use the smallest selectors that distinguish the competing explanations.

Competing explanations include a generic token outside the catalogue, known declarations that conflict or are compatible, a deliberately broad provider category, changed producer rules across the window, unsupported/malformed evidence, or a generic substring match such as Case 3. The presence of a provider AI category is a positive retained provider fact; it does not identify which explanation produced an unnamed local row.

The existing evidence can establish declaration cardinality, local/provider disagreement, available verification and version mix without new collection. It cannot recover an original unknown product token from a zero-candidate derived record. Raw UA availability must be measured in the already authorized retained optional/native sources; absence must remain explicit. No need to collect raw IPs, reader messages, addresses, credentials or arbitrary headers to establish these specific seams.

## Bounded recommendation

First reconcile the new retained cohort into declaration-cardinality × stored-kind × native-category × verification groups, preserving unsupported profiles and source-assignment conflicts. This determines whether catalogue gaps, actual ambiguity or historical producer differences dominate the fresh signal. Then implement and native-test the lexical generic-boundary repair and shared browser-claim normalization against the counterexamples above. Treat declaration coverage as a separate diagnostic contract; preserve its denominator and avoid an expensive generalized raw-JSON report scan without a measured budget.

This audit contributes three concrete source-backed cases and a testable architecture direction. The broader identity/purpose goal is incomplete.

## Local lexical candidate and rejected recall tradeoff

The parent investigation subsequently authorizes a local implementation. A shared [lexical product value](../../../../analytics/src/user-agent-products.ts) now supplies exact product boundaries to named matching and browser support. The candidate excludes URL-only matches and malformed slash versions, preserves bare generic automation product conventions, recognizes PhantomJS rather than the Phantom wallet substring, and excludes an unversioned CUBOT phone/model token without hiding separately appended bot declarations. CUBOT/version remains an explicit generic product claim. Chromium aliases/case share support thresholds; iOS shells follow declared WebKit OS capability, and conflicting/malformed versions abstain. No new logging or evidence field is introduced by this lexical change.

The first candidate required unknown bot/spider/crawler products to have a slash version. **Reject that policy:** although it fixes six browser counterexamples, it drops too many existing lexical bot matches. Do not silently accept the recall loss or import hundreds of competitor expressions to disguise it. The retained candidate preserves bare product suffix conventions and makes only the narrow reviewed phone/wallet exceptions and lexical-scope corrections.

Pinned isbot source is `3f9c982acd95b1be033fa3c14b2a7ece565ba10a`; the separate crawler-user-agents source pin is in [the source review](129-oss-detection-source-review.md). The comparison executes our prior and candidate compiled `analyzeTraffic` functions on identical strings. YAML extraction includes only unquoted single-line list entries beginning two spaces, hyphen, space; it is not a complete YAML parser. Downloaded JSON and instance arrays are used as supplied. These are competitor-labelled syntactic controls, not authenticated operators, unique clients, representative samples or accuracy estimates. Corpus overlap is not combined into one denominator.

| Supplied corpus | Controls | Earlier coarse non-browser matches | Rejected version-only candidate | Retained lexical candidate |
| --- | ---:| ---:| ---:| ---:|
| isbot browser YAML subset | 551 | 8 | 2 | 2 |
| isbot crawler YAML subset | 614 | 194 | 141 | 168 |
| isbot downloaded Matomo JSON | 1,349 | 593 | 413 | 516 |
| crawler-user-agents instances | 2,124 | 1,207 | 770 | 1,060 |

The rejected column includes the compound-product/Chrome-Lighthouse/libcurl adjustment, rather than the even stricter first draft. The retained candidate leaves every scalar named result, canonical candidate set and matched alias unchanged in these comparisons. Its six changed browser controls are four CUBOT phone UAs and two Phantom-wallet UAs; Yahoo Slurp and the named Amzn-User declaration remain non-browser despite the upstream browser-file location. A broader suffix draft briefly misclassified `CUBOT_P20`; the source counterexample caught it and the final control preserves the prior unflagged case. Existing external labels do not override our independent declaration semantics.

Remaining losses are visible in the private full comparison: URL/contact-only matches such as 008, Aboundex and ActiveComply, embedded substring forms, and malformed product forms such as `Mail.RU_Bot/Fast/2.0` or `spider/3.0(`. They do not become authenticated browsers: missing context continues to abstain. A source-reviewed explicit alias can be added separately when appropriate. The comparator and full supplied strings stay under `/tmp/analytics-domain-candidate/` until the parent archives its evidence; these are local scratch artifacts, not durable public links.

Bounded long-input controls retain a named product appended after 8,192 harmless products, a long URL and a malformed slash sequence, without truncating to a misleading prefix. A separate local Node 24.14.1 timing check warms ten calls per size and measures fifty calls: 65,547 / 131,083 / 262,155 input bytes have median 0.359 / 0.800 / 1.663 ms and maximum 0.826 / 1.995 / 4.590 ms in that run. These host/JIT/GC-dependent observations do not prove asymptotic complexity, production latency or a Worker CPU budget. Timing thresholds are not CI acceptance criteria.

The new current [client registry](../../../../analytics/src/client-registry.ts) is a separate coordinated implementation. Its integration removes duplicated live name/role arrays while keeping historical profiles independent. New HTTP software declarations retain HTTP-client roles even with browser-shaped headers or a hosting ASN. The registry does not create verification methods or infer operators. At integration, the expanded worst-case name/alias set produced **2,378 bytes** of classification JSON against the existing **2,048-byte** storage constraint. That was a concrete blocker, not evidence to truncate candidates or accept failed persistence.

The [lossless storage decision](../../../../../docs/adr/0016.21-client-claims-and-joint-evidence.md#store-complete-evidence-inside-the-existing-budget) supersedes that blocker: candidate names remain complete while matched aliases use a separately frozen hexadecimal bitset. The conservative fixture is **1,355 bytes**, with **693 bytes** of headroom. Native insertion/readback and oversized-record rejection are recorded separately by the parent. Old array formats remain readable; unsupported schema/profile, mixed encoding and out-of-range bits stay unknown. This resolves the representation budget without expanding raw capture, rewriting history or establishing deployment acceptance.

## Later review: URI spans and optional evidence still disagreed

The original product parser rejected ordinary slash-path names but treated semicolons inside contiguous URIs as new product boundaries. [The saved article-review counterexample](2026-11-06-article-lexer-counterexample.json) preserves that failure. [A second review](2026-11-06-article-browser-evidence-counterexample.json) finds optional browser extraction still accepting URI-only names and disagreeing on lowercase Chrome. These are failures in the local candidate, not measured production incidence. Preserve them rather than describing the earlier URL control as complete coverage.

The repaired [claim-text helper](../../../../analytics/src/user-agent-products.ts) masks recognized absolute-URI spans before any product interpretation. An ASCII scheme starts a span. Semicolons, query, fragment and userinfo stay within it; whitespace or an unmatched close parenthesis terminates it. Balanced parentheses and backslash-escaped non-whitespace characters stay inside. A colon placeholder preserves length without creating a new product boundary. Real products before a URI or after a genuine separator remain available, and long input is not truncated.

This policy does not validate URIs, infer software from hostnames, fetch an endpoint or implement full UA/comment grammar. Schemeless references remain outside its recognized-URI contract. A contiguous URI followed by `;GPTBot/1.0` stays URI data until the chosen separator; a separate whitespace-delimited GPTBot remains a declaration. An unmatched close parenthesis is deliberately interpreted as a UA-comment boundary, rather than an assertion about every legal URI spelling.

| Synthetic input or mutation | Earlier candidate | Repaired claim |
| --- | --- | --- |
| `Mozilla/5.0 (+https://example.test/;GPTBot/1.0)` | Selected GPTBot | No selected name or named candidate |
| `https://example.test/path;UnknownBot/1.0` | Generic bot | No generic product from the URI |
| `Googlebot/2.1; +https://example.test/;GPTBot/1.0` | Two incompatible named candidates | Only the actual Googlebot product remains |
| URL-only `Chrome/150.0` | Optional Chromium/150/browser claim | Optional unknown family/null version/unknown software form |
| Chrome 75 plus `(+https://example.test/iPhone OS 17_0)` | Capability changes false → true | The URI cannot supply the iPhone word; capability stays false |
| Chrome 150 plus `(+https://example.test/iPhone OS 16_3)` | Capability changes true → false | The URI cannot supply the iPhone word; capability stays true |
| `https://example.test/;iPad;Mobile` | Modern tablet marker | Modern unknown/no marker; legacy tablet unchanged |

Optional browser, OS and software-form interpretation now uses the same URI-excluded claim boundary. Detailed browser selection uses exact products while retaining Edge/Opera/Firefox/Chromium/Safari vocabulary. The iOS capability regex also reads sanitized text, preventing an OS phrase from borrowing its first word from a masked URI. Raw source diagnostics retain their separate bounded/redacted extraction; no additional raw data is captured.

Modern form normalization is dated by `CLIENT_FORM_PROFILE = 2026-11-06.1`, with both old/new profiles recognized. The form envelope remains unchanged. The deprecated `classifyDevice` raw-UA heuristic deliberately retains its original counterfactual: URI-only iPad can still yield legacy tablet while the modern result is unknown. Historical markers and compatibility columns are not relabelled or promoted into hardware identity.

## Final local review: conflicting browser families

Another concrete inconsistency survived URI repair. `Firefox/89.0 Chrome/150.0` produced routine Chromium with positive support, while optional evidence selected Firefox 89 with positive support. Reversing the supported/unsupported versions could select Firefox 150 while reporting no support. These were different priority rules over the same incompatible claims, not an observation of two real engines.

One shared conflict helper now abstains when Firefox/FxiOS coexists with Chrome/Chromium/CriOS/Edg/EdgA/EdgiOS/OPR. Routine family is unrecognized, optional selected family/version is unknown/null and capability is not positively claimed. Named GPTBot and HTTP-software roles still survive as their separate declarations. The rule is order-invariant and operates on URI-excluded exact products.

Normal Chrome+Safari and Chrome+Edge/Opera combinations remain supported. Edge+Opera and iOS+desktop spellings are not independently rejected outside the explicit Firefox-family conflict; no broader engine identity or execution claim is introduced. Same-engine malformed/conflicting major/minor claims abstain. An absent positive capability claim does not prove that the requester lacked capability or was automated.

## Evidence stages and remaining acceptance

The parent's integrated **427-test** baseline predates the cross-family repair. The subsequent isolated compilation and **50 focused tests** pass across lexical parsing, registry, optional evidence, modern/legacy form reporting, classification producer compatibility and the legacy/new codec. A separate **6,048** unordered named-client-pair × injected-signature matrix preserves common-role/conflict behavior. Injected outcomes test role policy, not signature verification. The test counts describe different scopes and must not be added together or presented as final full-suite acceptance.

The URI repair compares the same 551 browser, 614 crawler, 1,349 downloaded Matomo and 2,124 crawler-instance controls before and after, with both graphs using the expanded current registry. It changes zero lexical results in those four corpora. The separate family-conflict comparison also changes zero corpus results. Current coarse non-browser counts are respectively **2 / 170 / 516 / 1,065**. These are different producer conditions from the earlier pre-registry table's **2 / 168 / 516 / 1,060**; preserve that table as the lexical-policy decision record rather than silently replacing its values.

The supplied corpus controls do not cover the newly constructed counterexamples and do not establish accuracy or representativeness. The 17-case URI/optional/form replay and 15-case browser-conflict replay are separate synthetic evidence. Earlier local timing values above precede these refinements and cannot establish the final scanner's CPU cost. Long URI and scheme-like-input controls now test termination and preservation of late genuine products, without a universal latency claim.

Private local receipts and reproducible runners are `/tmp/analytics-uri-boundary-after-20261106/{before-after.json,corpus-comparison.json,replay.mjs}` and `/tmp/analytics-browser-conflict-after-20261106/{review.json,review.mjs}`; the receipts contain source/module hashes. These scratch paths require the parent's durable archive before handoff. Source/test contracts are inspectable in [user-agent-products tests](../../../../analytics/test/user-agent-products.test.mjs), [optional request-evidence tests](../../../../analytics/test/request-evidence.test.mjs), [form/history tests](../../../../analytics/test/client-form.test.mjs), [producer compatibility](../../../../analytics/test/classification-producer-compatibility.test.mjs) and [codec tests](../../../../analytics/test/retained-client-products.test.mjs).

The remaining bounded action is final integrated/native composed-Worker acceptance, source delivery, deployment association and measured served/report/cache checks, under the active [worklist](128-detection-improvement-worklist.md). The [joined production measurement and failed read-cost gate](132-joined-client-evidence-and-retained-headers.md) remain independent historical evidence. No claim here refreshes those observations or turns unavailable provider/human identity into a blanket release condition.

## Superseding acceptance and recovery

The preceding temporary paths and pending actions describe their original checkpoints. [Local acceptance133](133-detection-release-local-acceptance.md) and [production acceptance134](134-detection-production-acceptance.md) record the completed subsequent checks and durable private archive. Their manifest/recovery receipt supersedes the temporary-only continuity limit; it does not change any earlier measurement or failed cost check.

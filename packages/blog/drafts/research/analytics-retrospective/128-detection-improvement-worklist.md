# Detection, correctness and truthful analytics — ten-hour worklist

## Current disposition — November 10, 2026

**CUBOT article remains active.** The November 6 bounded research and engineering
acceptance is retained. Goga now intends a substantial rewrite of the
[manuscript](../../../posts/044-please-stop-misreading-user-agent.md), followed
by publication. Earlier prose/render acceptance applies to that baseline; no
rewrite, new publication date or new production result is claimed here. The
[article disposition register](../../README.md) closes the other audited article
directions. This note does not reopen the completed engineering objective.

## Historical record

Started November 5, 2026 Pacific / November 6 at 06:05 UTC. The owner authorizes up to ten hours of evidence-led research, source inspection, engineering, validation, ADR work and a delegated article. This continues TASK-0119 from [the current uncertainty baseline](127-current-unidentified-and-unsigned-traffic.md). The previous turn made progress: it measured current served reports and committed their evidence. It did not complete this broader objective.

## Objective and acceptance

Improve useful detection and correctness without converting absent evidence into invented identity. The complete objective includes competing open-source implementations, an ADR with sources and rationale, domain-oriented engineering and cleanup, several implementation/validation cycles, measured production acceptance, and a high-quality article improved alongside the work. Additional logging is authorized when a demonstrated gap justifies its fields, limits and disclosure; collection is not expanded merely because unknowns exist.

| Requirement | Authoritative acceptance evidence | Current state |
|---|---|---|
| Research competing products/libraries and read their source | Pinned source ledger, executed comparisons where applicable, case-level lessons and adoption/rejection rationale | Ten pinned source repositories inspected; candidate fixtures, source-specific lessons and rejections in Research 129 |
| Diagnose current gaps with evidence | Frozen production aggregate or retained-row scope, local reproducible counterexamples, metering and limits | Research 127 accepted; Research 132 joins the exact 3,960-event population, with its failed read-cost gate retained |
| Improve detection materially | Before/after cases, explicit domain boundaries and preserved adversarial cases; production incidence separate from synthetic coverage | Lexical URL/phone/app repairs, coherent browser claims and 11 reviewed names implemented; prospective incidence remains unmeasured |
| Improve correctness and truthfulness | Coherent declaration/role/verification dimensions; malformed and missing data remain explicit; public partitions reconcile | 433 analytics, 403 site and 29 site-audit tests pass; current native API/collector/report and six production controls accepted |
| Respect DDD and clean up as needed | Focused domain modules and clear adapters, shared invariants, no speculative framework or unrelated refactor | Registry, shared lexical claims, frozen storage codec and joint-report value modules implemented; existing identity methods remain separate |
| Iterate engineering and validation several times | Dated loops with reproduced problem, change, tests and independent review; failures retained | Multiple counterexample→repair→review loops recorded below; new API integration mismatch found before release |
| Write ADR | Decision, competing options, distilled lessons, references, rationale, risks and acceptance links | ADR-0016.21 records implemented/released decisions, sources, alternatives, DDD boundaries, costs and measured acceptance |
| Improve the blog and analytics library together | API/UI semantics, useful visible evidence, accessible/JS-independent content and appropriate native/browser checks | Joint API/UI live; local keyboard/error/recovery checks plus exact served JS/CSS, current report reconciliation and cache reuse accepted |
| Production acceptance | Source commit/build/Worker association, bounded served/API/cache checks and prospective controls where needed | Source `64a953` delivered; source-linked activation, six exact production chains, cleanup and later served/cache acceptance in Research134 |
| Delegated article developed iteratively | Shape and claim ledger, exact selected prompts, source/engineering revisions, evidence audit, positioning and prose review | Delegated four-table draft and exact three prompts reviewed; opening rule, full render, exports and final script-blocked desktop/narrow reading accepted; draft remains unpublished |
| Safe integration and continuity | Scoped main commits/pushes, concurrent work preserved, private captures outside Git, remaining limits recorded | Runtime/evidence delivered; concurrent work preserved; core archive verified. Final pinned-draft delivery closes this worklist. |

## Working tracks

- Root: orchestration, frozen operational evidence, ADR, implementation integration and final acceptance.
- OSS/source track: [source review](129-oss-detection-source-review.md), pinned alternatives, coverage lessons and runtime/licence costs.
- Domain audit: [correctness review](130-detection-domain-audit.md), reproducible cases and domain boundaries.
- Article track: [editorial work](131-detection-article-editorial-work.md), a new follow-up draft and prompts; earlier articles stay separate.

The linked track files are being created by their owners. Do not mark any accepted merely because a file exists. Human/device accuracy, provider identity and AI use require evidence appropriate to those claims; they are not interchangeable with improved declaration coverage.

## Baseline and first loop (historical starting checkpoint)

Starting source at initial goal inspection: `18606bd`. Pinned Node 24.14.1 / pnpm 9.15.4. All **397 analytics tests pass**. Fresh D1 metadata succeeds and shows eleven tables and a 30,474,240-byte database. Its rolling counters are separate from any future statement meters and do not establish available quota or task attribution. At this starting checkpoint, no direct data SELECT had run in this goal.

The seven-day baseline has 620 generic-token Other bots, 836 Unresolved events, 689 hosting-list matches and 571 Browser signals. Provider categories may add role evidence without a client name. The next bounded action is a native-tested aggregate joining those existing facts, with no raw UA/IP/client-ID export. Independently inspect existing retained logs for catalogue gaps before proposing any new diagnostics.

## Continuation

This worklist preserves the full owner scope. A local test, source commit, activated deployment and observed production behavior have separate acceptance states. At each checkpoint, record completed loops, exact evidence paths, remaining work and the next bounded action here. The goal stays active until all explicit requirements have adequate current evidence, or the goal's repeated-blocker rule applies.

## Earlier local checkpoint before integration (superseded below)

Several independent reviews have changed the implementation, rather than merely confirming it:

1. Reproduced the CUBOT/Phantom/URL whole-header false matches, then moved generic matching to product claims. Rejected a version-only suffix rule after the pinned corpus comparison showed excessive losses.
2. Unified exact-name, role and alias records in a 63-name/74-alias registry. Added reviewed SEO clients, AI2Bot and HTTP tools. The resulting full evidence would exceed 2,048 bytes, so a frozen lossless alias encoding now preserves it within the existing constraint; no historical rewrite or migration.
3. Found semicolon URI leakage and disagreements in optional browser/OS evidence during editorial and independent review. Repaired the shared URI boundary, preserved the deprecated raw device counterfactual, and retained both old/new modern form profiles. A subsequent Firefox/Chromium conflict now explicitly abstains across the relevant consumers.
4. Added a same-event table joining selected-name state, provider category and local signature basis. Fixed an independently found duplicate-marginal acceptance defect. Thirteen Node/native-D1 selectors agree over 512 synthetic rows, preserving every common baseline report value. The first native report costs 36,847→38,169 reads, about 3.6% more; no savings or global bound is claimed.
5. Actual composed Worker/native D1 controls acknowledge and read back eight observations, all permanently owner-excluded, including all 74 aliases in 1,341 bytes. Synthetic edge/header adapters and zero vendor/human/production claims are explicit. Browser UI checks use a separate 20-event synthetic fixture; invalid joint facts hide the dashboard and retry recovers it.
6. Fresh remote-main inspection reveals a concurrently added request-check API. Its published nested declaration schema still requires the old array. This is a real integration blocker, being repaired and tested against actual response values before release. Concurrent newsletter and site-audit work is preserved.

The writing-guidance request is separately delivered in commit `2d72f9c1`: one canonical writing skill with ten focused references replaces eight overlapping skills. Official specification validation, migration/source coverage and a bounded independent forward test are recorded in the migration references. The first-50-word plain-language rule applies to every article entry surface; exposed-essay authorship and other consequential exceptions remain intact.

Current local results are 429 analytics tests, 362 site tests, workspace types, 31 Markdown validations and an isolated 42-post build. These occurred before merging the new remote site-audit API; they are not final integrated-release acceptance. The first build attempt failed on sandbox IPC; the approved isolated retry passes. Native schema-loader failures and the Node transport header mismatch remain in the private evidence record.

Next bounded action: merge the scoped source with current remote main in an isolated checkout, repair the API schema contract, rerun affected/full/native checks and the isolated build, then commit/push and associate the resulting build/Worker. Native-test the six-control production plan before any eligible GET. Production control activation, per-request storage evidence, current served joint report/cache and cleanup remain pending. Do not reuse historical calibration as current acceptance.

Private working evidence is currently under `/tmp/analytics-detection-improvement-20261106/` and the linked parser/source-review directories; archive and verify it outside temporary storage before final delivery. The exact six-control proposal is `production-acceptance-proposal.md` in that private working directory. No temporary production binding or prospective eligible page request has been created at this checkpoint.

## November 6 production and article checkpoint

[Local acceptance 133](133-detection-release-local-acceptance.md) and [production acceptance 134](134-detection-production-acceptance.md) supersede the earlier pending implementation/release states above. Source `64a95314967f9b79a81c4f711dc27cae95fbb9c6` merges the reviewed analytics changes, versioned request-check API contract repair and concurrent newsletter/site-audit work. The integrated checks and isolated build pass; source-linked Cloudflare build/activation are separately observed.

All six one-attempt controlled curl executions join their exact invocation, attempt/acknowledgement operation, returned decimal-text D1 row, per-trial counters and complete current receipt. Every row is permanently owner-excluded; no optional diagnostic capture occurs. The complete 63-name/74-alias record is 1,341 bytes. One exact-ID SELECT reports 54 reads, zero writes and one provider attempt. Both owned temporary bindings are removed before expiry, existing code/runtime/non-test resources remain preserved, the ready route returns 404, and the token file and owned tail are closed. The twenty HTTP requests and 57 metadata/three settings commands are recorded separately from SELECT meters.

A concurrent later deployment invalidates the served-check's original Worker expectation before any report GET. Its source `6f5a1a5c951a569da5cc1cb6f402242881e2d59b` retains identical analytics/stats/schema components. After reconciliation, the six planned asset/report requests pass; served stats JS/CSS equal the checked build byte-for-byte. One natural report miss costs 371,322 reads, zero writes and one reported attempt, below the separate 500,000-read review threshold. Its identical repeat is a cache hit with the same body/calculation time. The current mixed-method report reconciles 4,142 events, 1,200 selected catalogue names and 2,942 without a single selection. These are request/evidence counts, not identities or a before/after accuracy comparison. The earlier 85,639>50,000 cost failure remains a failed gate.

The final draft leads with the copied CUBOT-header bug and includes six live controls with their actual conditions. Four tables/two code blocks, exact prompts, metadata, Markdown/citation exports and full script-blocked reading at 1280 and 390 CSS pixels pass. No page-wide overflow occurs. Previous render paths were overwritten during iteration; all previous byte commitments have been independently regenerated to exact matching hashes, explicitly labeled reconstructions rather than original raw captures. Final pre-pinning source/output bytes remain separately preserved. The article remains an unpublished draft.

Final independent review finds no release blocker; it corrects two concrete wording boundaries: hosting/archiver lists are distinct from vendor published-IP feeds, and already-public aggregate hosting-ASN reasons are distinct from private control-request ASN values. Benchmark wins and stress regressions, the 1,479-gzip-byte bundle increase, and all scope limits remain in Research 133. Writing/maintenance skill specification validation passes again after the final active-description correction.

Remaining bounded actions: verify the durable private archive/recovery manifest, append its pointers to the dated records, finish the checked scoped evidence delivery, pin final article evidence links and validate that final copy. Do not repeat accepted production controls or manufacture an overall detector-accuracy result. The broader TASK-0119's older questions stay open independently of this renewed bounded objective.

## Durable archive accepted; delivery checkpoint

The private archive verifies 4,982 files / 88,222,417 bytes against manifest SHA-256 `7bf11ce8f580546c3c44f70cab6f96f4c65f0f00505084101e5ff1cd679de1e7`. All 55 operational artifact commitments and 28 article byte commitments match archived files. Recovery mappings, source archives, compiled graphs, replays and explicit article reconstructions are preserved outside Git with private permissions; the ephemeral grant is absent. This supersedes the temporary-only continuity limit. Research 133/134 contain the recoverable-archive receipt.

Every engineering, source-research, production, cleanup, writing-guidance and draft-reader acceptance requirement now has bounded evidence. Remaining delivery work is a checked scoped main commit/push, final article evidence-link pinning and its exact-output check. The article remains unpublished; missing general operator/human/native identity is an evidence boundary, not an uncompleted claim of this improvement.

## Final requirement audit

The renewed bounded objective is complete in scope; final Git delivery carries this audit and the evidence-pinned draft. The older TASK-0119 remains open for its separate identity/search/human questions.

| Owner requirement | Accepted result |
|---|---|
| Explore with evidence | Frozen baseline 127, exact joined production 132, counterexamples 130 and current served/control134 results with scopes and costs |
| Read competing OSS source | Ten pinned repositories, source/file commitments, supplied corpus comparisons and explicit adoption/rejection lessons 129 |
| Improve detection/correctness/truthfulness | Phone/app/URI and browser-coherence repairs; 63 reviewed names/74 aliases; complete versioned storage; reconciled joint API/UI; unknowns retained |
| Iterate engineering and validation | Successive reproduced failures, implementation changes, independent review, native gates and six exact live request/storage chains; failures preserved |
| DDD/refactor/cleanup | Shared lexical claims, current declaration registry, frozen codec, distinct role/identity methods and reporting value modules; public request-check contract version repaired |
| ADR with rationale/cross-references | ADR-0016.21 links primary sources, prior decisions, alternatives, costs and accepted tests/production scopes |
| Improve library and blog | Source `64a953` and consumer-contract repair delivered; live joint view, exact served assets and MISS→HIT cache check accepted |
| High-quality delegated article | Concrete title/result within 50 words, three exact prompts, four tables, source/claim review, full exports and script-blocked reading at 1280 and 390 CSS pixels; final URL pinning preserves exact body bytes |
| Logging/privacy judgement | Existing retained operational sources suffice; no new raw collection/settings, optional capture absent in all six controls, temporary grants removed |
| Consolidate writing guidance | One specification-validated writing skill, ten focused references, preserved exceptions/history and independent forward cases; delivered `2d72f9c1` |
| Delivery/continuity | Checked main delivery, preserved concurrent work, verified private core/archive appendix, exact evidence pins; article remains an unpublished draft |

Current report uncertainty remains material: 2,942/4,142 have no single selected catalogue name and 3,418 lack signature headers. That does not invalidate the accepted repairs or identify the remaining clients. No general human/vendor accuracy, training, indexing or citation outcome was claimed. Publication or a new measurement question is a separate next decision; accepted controls need not be repeated.

Final article-link appendix: 14 files / 93,300 bytes, manifest SHA-256 `385a625cdcad28cc91fdfe1cea4c198480c4f9be5a747b7be4eca0a78b0def67`, linked from the article QA record. Full final build/exports pass; the eight evidence links resolve within pushed commit `4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f`. Exact source/render normalization proves only those URLs changed after the accepted visual pass. All acceptance work is complete; final scoped Git delivery carries this closure.

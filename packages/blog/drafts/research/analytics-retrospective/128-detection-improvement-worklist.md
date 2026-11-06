# Detection, correctness and truthful analytics — ten-hour worklist

Started November 5, 2026 Pacific / November 6 at 06:05 UTC. The owner authorizes up to ten hours of evidence-led research, source inspection, engineering, validation, ADR work and a delegated article. This continues TASK-0119 from [the current uncertainty baseline](127-current-unidentified-and-unsigned-traffic.md). The previous turn made progress: it measured current served reports and committed their evidence. It did not complete this broader objective.

## Objective and acceptance

Improve useful detection and correctness without converting absent evidence into invented identity. The complete objective includes competing open-source implementations, an ADR with sources and rationale, domain-oriented engineering and cleanup, several implementation/validation cycles, measured production acceptance, and a high-quality article improved alongside the work. Additional logging is authorized when a demonstrated gap justifies its fields, limits and disclosure; collection is not expanded merely because unknowns exist.

| Requirement | Authoritative acceptance evidence | Current state |
|---|---|---|
| Research competing products/libraries and read their source | Pinned source ledger, executed comparisons where applicable, case-level lessons and adoption/rejection rationale | Ten pinned source repositories inspected; candidate fixtures, source-specific lessons and rejections in Research 129 |
| Diagnose current gaps with evidence | Frozen production aggregate or retained-row scope, local reproducible counterexamples, metering and limits | Research 127 accepted; Research 132 joins the exact 3,960-event population, with its failed read-cost gate retained |
| Improve detection materially | Before/after cases, explicit domain boundaries and preserved adversarial cases; production incidence separate from synthetic coverage | Lexical URL/phone/app repairs, coherent browser claims and 11 reviewed names implemented; prospective incidence remains unmeasured |
| Improve correctness and truthfulness | Coherent declaration/role/verification dimensions; malformed and missing data remain explicit; public partitions reconcile | 429 analytics tests and isolated workspace types pass after repairs; final merged-consumer acceptance pending |
| Respect DDD and clean up as needed | Focused domain modules and clear adapters, shared invariants, no speculative framework or unrelated refactor | Registry, shared lexical claims, frozen storage codec and joint-report value modules implemented; existing identity methods remain separate |
| Iterate engineering and validation several times | Dated loops with reproduced problem, change, tests and independent review; failures retained | Multiple counterexample→repair→review loops recorded below; new API integration mismatch found before release |
| Write ADR | Decision, competing options, distilled lessons, references, rationale, risks and acceptance links | ADR-0016.21 drafted with sources, alternatives, DDD boundaries, storage budget, costs and remaining gates |
| Improve the blog and analytics library together | API/UI semantics, useful visible evidence, accessible/JS-independent content and appropriate native/browser checks | Joint API/UI table implemented; desktop/narrow-screen, keyboard, invalid-report and recovery checks pass locally |
| Production acceptance | Source commit/build/Worker association, bounded served/API/cache checks and prospective controls where needed | No new release yet |
| Delegated article developed iteratively | Shape and claim ledger, exact selected prompts, source/engineering revisions, evidence audit, positioning and prose review | Delegated draft and exact selected prompts created; source, parser and title/lead revisions ongoing |
| Safe integration and continuity | Scoped main commits/pushes, concurrent work preserved, private captures outside Git, remaining limits recorded | Active |

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

## November 6 local checkpoint and next action

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

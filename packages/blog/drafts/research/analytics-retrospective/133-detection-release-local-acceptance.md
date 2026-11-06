# Detection release: local acceptance and its limits

November 6, 2026 UTC. Continues the [domain audit](130-detection-domain-audit.md), [joined evidence investigation](132-joined-client-evidence-and-retained-headers.md) and [improvement worklist](128-detection-improvement-worklist.md). The frozen release source is commit `64a95314967f9b79a81c4f711dc27cae95fbb9c6`, with source-manifest SHA-256 `2db4b4acbb73617837e51def271d68dcd431c38403c1ea989f50401d2a5ac22e`. These are local results; the separate [production controls](134-detection-production-acceptance.md) establish their own narrower acceptance.

The [machine-readable receipt](2026-11-06-detection-local-acceptance.json) records aggregates, conditions, failures and byte commitments to private artifacts. Raw operational captures remain outside Git.

## Integrated source checks

The merged release checkout passes **433 analytics tests, 403 site tests and 29 site-audit tests**, workspace typechecks, validation of **32 Markdown posts**, an isolated **43-post production build**, and Worker upload dry-run. Validation and build counts cover different content sets. The earlier 427-test baseline and 50 focused post-conflict tests belong to earlier, different scopes; they are not additional release tests to sum into this result.

The changes share one URI-excluded claim parser across named declarations, generic automation tokens, browser capability, optional evidence and modern client form. They preserve historical profiles and the deprecated raw device heuristic. The registry has 63 canonical names and 74 aliases; a separate frozen codec retains all matched aliases within the existing classification JSON budget. Report selection exposes names, provider categories and local signature basis on the same stored event. These boundaries and rejected alternatives remain in [ADR-0016.21](../../../../../docs/adr/0016.21-client-claims-and-joint-evidence.md).

## Composed Worker and native D1

The composed local Worker test makes **26 synthetic requests**, stores eight controls and reconciles all eight attempt/acknowledgement/exact-ID readback chains against the full current receipt projection. All eight rows are permanently owner-excluded; after temporary marks are removed, zero enter the public selection. No optional diagnostic rows or external requests occur.

The controls include CUBOT and URI-only negative declarations, GPTBot, SemrushBot, bare node-fetch, all 74 aliases, malformed browser claims and absent Fetch Metadata. The all-alias event retains **63 canonical candidates and 74 products in 1,341 bytes**, and remains Unresolved because multiple declarations prevent a single role selection.

These requests come from Node with synthetic edge facts and a special-range test address. A test-only Request adapter supplies canonical Fetch Metadata because Node transport rewrites `Sec-Fetch-Mode`. This test exercises the composed Worker, native D1 and crypto under supplied conditions; it does not establish wire fidelity, real browser execution, vendor identity or human readership.

Thirteen native report selectors over **512 synthetic stored rows** agree with Node results and preserve every common baseline value. Unordered tables are compared as multisets while preserving field values. The default seven-day fixture contains 455 included events, with 115 selected-name and 340 no-selected-name events across fifteen joint groups. It costs **38,169 reported reads versus 36,847** for the baseline: 1,322 more, approximately **3.6%**. Both write zero rows. The meter has partial, last-attempt metadata. This is a local cost increase, not a saving, production forecast or global bound. The independent production aggregate's **85,639-read result against a planned 50,000 threshold** remains a failed cost gate in [Research 132](132-joined-client-evidence-and-retained-headers.md#the-query-exceeded-its-planned-cost-gate).

## Interface and control-runner acceptance

The built stats interface uses a separate twenty-event synthetic fixture: eight selected-name and twelve no-single-selection events, with five joint groups. Joined facts and totals display; a balanced but inconsistent report hides the dashboard, and retry recovers it while clearing `aria-busy`. Valid fixtures produce zero console errors. Keyboard horizontal scrolling works without document overflow in observed CSS widths of 1,163 and 354 pixels. Requested viewports were 1,280×900 and 390×844; browser scale makes these different measurements. No actual phone or production report is exercised. The local endpoint supplies the same report across filter requests; native selector tests cover filtering separately. Exact per-action UTC times and raw UI pixels were not separately byte-archived.

The reusable [production-control helper](detection-live-control.mjs) and [native preflight](check-detection-live-control-native.mjs) pass six exact projection chains and 29 negative cases. The SELECT reads **54 rows**, writes zero and uses the owner/path/time index. Parameterized and literal SQL agree. Decimal IDs above JavaScript's safe-integer limit survive as text; a missing primary-key row still returns its planned row, and an extra owner-zero observation is counted and rejected. Swapped/missing/duplicate operation links, changed profiles/headers/receipts, optional captures and balanced two/zero counters fail acceptance.

The native receipt freezes every sorted compiled module filename and byte hash. The private driver verifies that graph before preparation, activation and execution. Its mock accepts cleanup after graph changes while rejecting stale graph execution, existing optional bindings, ambiguous deployment timestamps, split allocation and repeated/concurrent execution. Its twenty mocked HTTP calls cause no actual network or settings changes.

## Final local cost tradeoffs

A warmed Node 24.14.1 microbenchmark on Apple M5 compares the baseline and final release graphs over twelve fixed synthetic inputs. Five batches of 2,000 `analyzeTraffic` calls yield five batch means per input/graph; case order and before/after order alternate. The public JSON preserves those results and graph/fixture commitments. Host contention, JIT and GC remain uncontrolled. These are not individual-request percentiles, allocation measurements, Worker CPU/billing or detection accuracy.

| Input | Median of baseline batch means, µs/call | Final, µs/call |
| --- | ---:| ---:|
| Plain browser | 2.133 | 1.466 |
| CUBOT | 2.202 | 1.612 |
| GPTBot | 1.486 | 0.342 |
| 8,192-byte nonmatch | 29.492 | 36.011 |
| 700 unknown products, 10,389 bytes | 72.496 | 120.633 |
| Scheme-like runs, 8,100 bytes | 35.957 | 39.898 |
| Long URI, 8,225 bytes | 201.465 | 20.009 |

The long nonmatch, many-products and scheme-runs inputs regress by approximately 22%, 66% and 11%, respectively. Other supplied inputs improve; no aggregate speed claim follows. Five of twelve decisions intentionally differ from the baseline: CUBOT, SEO, HTTP software, URI-negative and long URI. All twelve match the intermediate candidate decisions. A separate untimed Firefox/Chrome conflict fixture changes the family from Chromium to unrecognized and is excluded from those timings. Inputs over 8,192 characters exceed the separate request-inspector API limit; the inspected observer collector has no equivalent explicit UA limit. These are synthetic stress conditions, not measured traffic.

Equivalent `observePageResponse`-only exports bundled with identical esbuild 0.27.3 settings and ipaddr.js 2.5.0 dependencies grow from **135,340 to 143,920 raw bytes** (+8,580; 6.34%) and **45,244 to 46,723 gzip bytes** (+1,479; 3.27%, gzip level nine). Input graphs, settings and output hashes are committed by the JSON receipt. This standalone tree-shaken library comparison does not measure the whole site, deployed Worker size, startup cost, allocation or billing.

## Failures retained and continuity

Two earlier native harness runs failed while naïvely splitting schema text: one submitted no statement; another split comment text into SQL near `no`. A corrected fresh-schema loader precedes the passing native comparison. An initial isolated build failed on sandbox IPC permission and passes after an approved retry. The first control preflight also rejects a stale shared compiled lexer that still calls the URI-negative control AI; the current release checkout passes without changing source to fit the stale result.

The private driver's initial first-deployment assumption encounters oldest-first ordering before eligible production requests. The repair selects a unique latest timestamp and requires one version at 100%; unordered, ambiguous and split-allocation fixtures cover it. These harness and execution-gate failures are preserved, not relabelled as runtime defects or removed from the record.

Local raw captures remain under `/tmp/analytics-detection-improvement-20261106/`, with the native helper receipt at `/tmp/detection-control-native-20261106-2.json`. Their SHA-256 commitments are in the public JSON. Temporary paths and hashes alone do not provide durable recovery. [Research 134](134-detection-production-acceptance.md) separately records the completed six-control production run and the later served report/assets/cache acceptance. At that checkpoint, durable private archival and recovery verification were pending; the durable-recovery section below closes that gate.

## Durable recovery

The private archive at `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-11-06-detection-improvement` verifies **4,982 files / 88,222,417 bytes** against manifest SHA-256 `7bf11ce8f580546c3c44f70cab6f96f4c65f0f00505084101e5ff1cd679de1e7`. Every preserved file has private permissions, and the expired local grant is absent. All 55 public operational artifact commitments and 28 recorded article byte commitments match archived files. Earlier article artifacts were regenerated to exact recorded hashes and labeled as reconstructions; the directly checked final pre-pinning artifacts remain separate. The archive contains path mappings, exact compiled graphs, three tracked source archives and recovery instructions. Dependencies/runtime binaries and raw build-screen pixels are not vendored. The source-at-archive copy precedes these final pointers; later evidence/article-link edits remain in Git history.

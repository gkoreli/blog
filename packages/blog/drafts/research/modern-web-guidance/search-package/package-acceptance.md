# Integrated package acceptance

November 14, 2026. The [controlled comparisons](report.md) selected the product direction. These are separate engineering checks on the current corpus and actual `@gkoreli/search` implementation. They are not a new untouched relevance test.

## Corpus and source links

The build contains 46 articles, 3,954 source passages and 4,835 E5 vector rows, including complete chunks of long inputs. All 63 selected-block label occurrences mapped into the new source passages by whitespace-compacted equality or containment before package ranking. The [bridge](package-labels.json) records source and index hashes. All 3,954 passage anchors occurred exactly once in their generated article HTML. Headers supply context; scripts, hidden controls, navigation and the publication's source-note omission are excluded. Markdown and TypeScript article HTML receive the actual anchors. This is published-body text search, not a draft/research crawler.

Current packing, parsing and identifier-preserving tokenization differ from the frozen 866/3,980-unit comparator recipe. Current source files also differ from snapshot `19d8f897`. No prototype quality count is assigned to the package merely because it uses the selected methods.

## Fixed-case execution

All 51 cases ran through both the typed Node API and the actual built application browser worker. Native and browser receipts are [retained](results/package-native-01.json), [separately](results/package-browser-01.json). First attempts completed without a ranking failure. The same source-aware, correlated questions and incomplete labels remain; repeated execution adds no independent relevance examples.

| Package mode | Development article / 30 | Development article + passage / 30 | Reserved article / 15 | Reserved article + passage / 15 |
| --- | ---: | ---: | ---: | ---: |
| Words | 29 | 23 | 14 | 8 |
| Related ideas | 28 | 25 | 14 | 10 |

Across 45 answerable cases, words selected 43 articles and 31 labeled passages; related selected 42 and 35. Related selection improved paragraph counts while losing one article-at-three case overall. Both returned results for all six no-known-answer cases. There is no trained answerability threshold. The current package is useful in tested flows; it is not perfectly reliable search or proof that semantic ranking is universally better.

Against the corresponding comparator, new word-mode label losses occurred on S02 recollection (PaperPilot controls/limitations instead of the selected leak description), S06 typo (other status-request/scheduler explanations) and S13 topic (the kernel condition and process/per-thread code explanation instead of the selected block). These contain relevant alternative material, but remain misses. Word-mode gains occurred on the S13 and S15 typos; Buzz's sharing mechanism was then present. Related lost S09 recollection's first-three article placement (OpenClaw remained a later candidate) and S13 topic's selected block. That S09 article regression is real. No question-specific weights or synonyms were introduced to repair these counts.

## Browser numerical boundary and cost

Three separate golden queries compared native CPU E5 vectors with the single-thread browser WASM adapter. Their dot products were approximately 0.99823, 1.00000 and 1.00000; maximum coordinate differences were 0.01039, 0.00000578 and 0.00003540. These are compatible approximate embeddings, not bitwise equality. See [the golden receipt](results/golden-browser-01.json). They must not be described as the exact MWG reproduction.

In the 51-case application-worker run, all word article/passage orders matched Node. Related article order differed in three cases and passage order in nine; selected article-at-three and joint passage outcomes were unchanged. These differences remain recorded rather than silently treating the runtimes as identical.

The index was reduced from 9,673,770 to **5,724,986 raw bytes** by reconstructing internal units and using numeric vector-row references. Local gzip/Brotli encodings were 1,248,737 / 793,460 bytes; these are local compression measurements, not observed production transfer sizes. Separate vectors are 7,426,560 bytes. The four original model files remain 34,726,727 bytes; browser model/tokenizer/runtime plus document vectors total **53,306,952 raw bytes**, beyond the lexical index and application JavaScript. The ONNX payload uses two transport files of 17,007,184 and 17,007,183 bytes to fit the hosting limit. Total model size is unchanged.

First uncached indexing computed 4,678 chunks and reused 157 duplicates, with the entire site build taking about 124 seconds. A later isolated build reused all 4,835 chunks and took about 6.4 seconds. Those totals include rendering and other build work, so they are not isolated embedding benchmarks. Document-only content caches live outside Git; no query history is persisted.

In one uncontrolled M5 desktop/loopback browser run, per-form medians were about 9 ms for warm word requests and 45–48 ms for warm related requests. They exclude the UI debounce and do not establish Internet download, low-end-device latency, mobile memory or an SLO. Local Worker GET/HEAD word-search responses were checked separately: source passages, empty quoted query, 400 oversized query and no-store caching worked. A cold GET took about 509 ms; that is a local wall-clock observation, not measured production CPU. The installed local Worker runtime warned that it fell back to an older supported compatibility date. Local analytics lacked its production secret; those analytics diagnostics do not establish production analytics behavior.

## Reader flows and limits

In the own-browser trial, `open source emojis` returned Radar #01. Word excerpts were generic open-source material; related excerpts included heroicons-animated, while other excerpts remained unrelated. This does **not** establish that the blog contains the remembered emoji project. With `Moving Icons Svelte`, the dialog showed the actual Svelte-native explanation. Arrow navigation and Enter opened its generated paragraph anchor, and the source text visibly highlighted. Source context and in-article refinement are available without pretending neighboring text was independently ranked.

Cmd+K opened the dialog, `/` stayed literal inside the input, and Escape closed it and released scroll locking. Native Tab behavior needs browser-specific reporting: the own-browser WebKit host allowed focus to leave the document under its current keyboard-navigation configuration during a Shift+Tab trial. No manual Tab loop was added or passed off as a universal accessibility result. Focus return, mobile/theme/loading/error checks and current production acceptance are tracked in the delivery record; source implementation and these local results alone do not establish activation.

Later local UI checks passed for the model's 503 failure state, recovery to Words, Words during an intentional 12-second asset delay, and suppression of the delayed related response after switching modes. A 390 × 844 CSS-viewport iframe verified the mobile icon/dialog and zero horizontal document overflow, with explicit focus return; the browser viewport override did not change the host viewport, so no device emulation is claimed. Light/dark screenshots, rapid query changes, in-article empty results, literal slash handling and native paragraph navigation were inspected. The actual local Worker/CSP path also completed related inference without a browser console error. Reflected test markup parsed as one input attribute and created no executable script node. These tests do not repair the separately recorded WebKit Tab-navigation limitation.

## Serving build and retirement recovery

Live acceptance exposed a second build boundary. Manual version `830b344a-3de9-4fd9-a7cb-59ae121a2462` activated, then the automatic build from the same pushed source replaced it. The old fingerprinted index returned 404. The new corpus's article and lexical-index fields and vector-row positions were identical; document-vector bytes differed. The minimum dot product across corresponding 4,835 rows was about 0.99529, with mean 0.99928. This is an observed build/runtime difference; no precise hardware cause was isolated. [Source/row comparison and recovery receipt](serving-build-check.json).

The unchanged labels were associated with the new fingerprint after source equality was checked. All 51 cases then ran again against the actual serving index/vectors, through both [Node](results/package-production-native-01.json) and [the application browser worker](results/package-production-browser-01.json) on loopback. Article/selected-passage outcomes remained 43/31 for Words and 42/35 for Related across the 45 positives; all six negatives still returned results. These are regression replays of known cases, not new independent relevance evidence or 51 remote production-query trials.

The client now rechecks its manifest after a minute of use and retries once with a fresh corpus when a data asset returns 404/410. An already loaded model is retained. An actual browser fixture first served the old manifest, retired its vectors, then supplied the current manifest. It recovered to related results: one old-vector request, one new-vector request and two ONNX-part requests total, with no second model download. Persistent failures remain explicit and offer reload/word-search recovery. No ranker, case label, per-query rule or relevance weight changed.

Final [production acceptance](production-check.json) observed the recovery source `3a061608` at 100% activation, with the same index/vector paths used in the serving-build replay. The live browser completed Related ideas, opened the Moving Icons source paragraph and showed its native target highlight; Cmd+K then opened word search on that article. A current production index response measured 1,216,149 Brotli bytes decoding to 5,724,986 bytes, with the expected SHA256. This differs from the smaller local maximum-compression sample. Source, activation and these point-in-time observations remain separate; these controlled requests are not audience growth.

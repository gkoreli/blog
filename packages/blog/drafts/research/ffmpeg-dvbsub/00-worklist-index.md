# FFmpeg DVB subtitle optimization: research worklist

## Current disposition — November 10, 2026

**Closed by owner.** The bounded research, implemented patches, executed
experiments and verification are retained with their measured limits. Goga
retired the article, upstream submission and proposed further proof, architecture,
benchmark and sample work. No manuscript or upstream PR was published. There is
no remaining action for this research/article track; an unrun extension is
withdrawn, not an accepted experiment. The earlier next steps below are
historical. See the [article disposition register](../../README.md).

## Historical record

Started November 3, 2026 (America/Los_Angeles). Tracking [TASK-0149](../../../../../docs/tasks/TASK-0149-verify-ffmpeg-dvb-subtitle-improvements.md). The bounded verification and native-comparison iteration are complete; article/upstream work remains in progress. This is research for a future engineering article and an upstream contribution; neither is published or submitted.

## Question and outcome

Can we improve the palette-reconstruction path beyond the merged optimization, make the code easier to read, and give each correctness and performance claim an inspectable basis? Goga requested machine-checking the C transformations first, then TLA+ for stateful behavior, fixing findings and preserving reproducible proofs and benchmarks.

The article's provisional form is an engineering investigation: follow an attractive speedup claim through reproduction, further optimization, counterexamples, and the limits of verification. The central reader lesson is how to turn a plausible optimization into bounded, reproducible evidence. No invented author experience or universal regression guarantee.

## Work and acceptance

| Work | State | Acceptance |
|---|---|---|
| Verify original claim and locate PR | Complete, historical session evidence | [Original PR](https://code.ffmpeg.org/FFmpeg/FFmpeg/pulls/25687), merged [commit](https://github.com/FFmpeg/FFmpeg/commit/a1a7737c4bcace8615f70b8f2cc7fc515ca26522) |
| Preserve earlier C patch, tests and benchmarks | Captured | [Baseline results](repro/baseline/results.txt), [manifest](repro/baseline/manifest.json), [argument](repro/baseline/proof.txt) |
| Machine-check local C transformations | Complete within explicit bounds | Source extraction, explicit bounds/assumptions, successful solver exits and unwinding checks, failing mutation controls |
| Model palette cache and error propagation in TLA+ | Complete finite models | Trace C branches to actions; check four modes; preserve counterexamples and corrected model results |
| Fix confirmed defects | Complete local patches | Separate behavior-changing fixes from output-equivalent optimization; direct regression cases |
| Recheck decoder and performance | Correctness accepted; default timing unresolved | Normal/sanitized FATE, byte comparisons, controlled repeated timings; distinguish reruns from historical measurements |
| Reproducibility and research record | Complete reproducible evidence | Pinned source/tools, public proof sources and result summaries, fresh reproduction where practical |
| Upstream PR | Preferred scope narrowed | One-function 17-line palette patch; separate robustness fixes; no submission or upstream acceptance |
| Article | Planned | Exact prompts and claim ledger; draft after research stabilizes; no publication yet |

## Evidence boundaries

The historical real-sample forced-reconstruction result is 4.318× against the author's merged version; a generated 176-packet corpus gives 6.545×. These are medians on one ARM64 host, not general FFmpeg speedups. Default decoding of the real sample has no established gain. Finite tests, bounded C checking, model checking, and a written argument support different claims; none is a whole-decoder, all-platform guarantee.

The baseline includes 59,278 palette cases, 876,432 RLE cases, normal and fully instrumented decoder checks and FATE. Those are saved earlier results, not a fresh execution in this stage. The rejected lazy-allocation prototype stays excluded because existing output callers swallow failures. The optimization retains inline scratch storage.

Raw logs, binaries, tool downloads, private session logs and large bitmap captures remain outside Git, currently under `/private/tmp/dvbsub-formal` and `/private/tmp/dvbsub-audit-v2`. Public sources, commands, hashes, compact results and benchmark samples live here. Temporary paths are conveniences, not durable evidence locations.

## Reproduction and continuity

- [Baseline reproduction](repro/baseline/results.txt) and `bootstrap.py` pin FFmpeg `aab6cec3e8415154b3f0570f8d131db07a9901de` and the public FATE sample hash. Extract/copy into a disposable directory before running; scripts write binaries and checkout files alongside themselves.
- [Formal harness generator](repro/formal/generate.py) extracts functions from the exact candidate rather than maintaining independent helper copies.
- [Shaping prompts](../../../prompts/ffmpeg-dvbsub-verification.prompts.md) preserve the supplied research/article direction. No footprint is frozen while work continues.

## Current evidence and next action

- [Source and historical baseline](01-source-and-baseline.md): claim scope, discovery method, earlier experiments and primary references.
- [Machine checks and fixes](02-formal-verification.md): seven C obligations, reachable-completion controls, three expected mutant failures, finite state models and native regressions.
- [Reproduction](repro/formal/README.md): pinned tools, exact source extraction, commands and guarantee boundaries.
- [Native comparisons and narrower scope](04-native-comparisons-and-smaller-scope.md): authoritative C/C++/FFmpeg/TLA+ reading, rejected slowdowns, selected 17-line patch and final measurements.
- [Upstream contribution preparation](03-upstream-contribution.md): preferred one-function contribution; earlier broad series and robustness fixes remain separate evidence.
- [Source/tool provenance](results/provenance.json), [formal receipt](results/formal-results.json), [decoder receipt](results/decoder-results.json), [current timings](results/benchmarks.json), and [longer default control](results/benchmarks-default-long.json).

Seven C obligations and their reachability controls pass; all three mutants are rejected. Four cache modes and three fixed failure-route models pass; expected legacy and naive-invariant counterexamples remain public. The fixed decoder passes 27 fault/retry/header checks, normal/sanitized FATE and real/generated byte comparisons in every palette mode. This does not prove the full 256-color collector/ranker or a C-to-TLA+ refinement relation.

Separate fixes return discarded output errors, clear the output flag after allocation failure, preserve page-version retryability, and reject undersized page/CLUT headers. The optimization helpers are unchanged by those fixes. The lazy-allocation prototype remains excluded.

The final matched-flags run measures 4.410× on the real forced path and 6.621× on the generated forced path. Its real default median is 1.7% slower, with no accepted neutrality claim. The longer default-path control has a hardened median 1.8% above upstream with much larger run-to-run variation. A small default-path cost remains unresolved. Forced-reconstruction ratios cannot establish default-path performance neutrality.

The paragraph above records the earlier broad candidate. The newer native-comparison iteration below supersedes its proposed performance-PR scope.

Next bounded action: review the preferred one-function patch and get an independent architecture/quiet-host default benchmark before claiming broad performance safety. A general 256-color proof, more broadcast samples and checked C-to-model refinement are separate proposed extensions. Then draft the article around what each verification method established and what remained uncertain. No upstream submission or article publication yet.

## Delivery checks

The final source and all proof C/header/model/configuration files match the release proof run's hashes in [provenance](results/provenance.json). Fresh tool downloads reproduce the checked binaries byte-for-byte. All five patches apply sequentially and reproduce the final source exactly. Relative links/anchors, closed Markdown fences, Python syntax and JSON records are checked. No site runtime, post, package dependency, production build or service probe is part of this research delivery.

The outer Git whitespace check excludes stored `.patch` fixtures because unified-diff context lines intentionally contain a space. `check-series.py` checks the applied C diff separately. Public counterexamples are compact model-state excerpts; raw logs, generated bytecode, executables and captures remain outside the committed evidence. The commit containing this record identifies the delivered research set.

## November 3: native comparisons and tighter PR scope

[Research 04](04-native-comparisons-and-smaller-scope.md) supersedes the broad performance proposal with a patch adding **17 lines and removing one**, in `compute_default_clut` only. The matrix layout, original ordinary-path clearing, score/ordering suffix and all other decoder functions remain byte-identical. A uniform-bitmap return and batched interior comparison express the gain through C11 `memcmp`, without C++ conversion, ISA-specific code, helper functions, allocations or new state.

A 33-line row-layout candidate was rejected after large random images slowed by up to about 29% in the function screen. The fix was to gate batched checks behind the existing scalar interior test and retain the original storage/scoring design. Whole-row scans, bounded failed-probe fallbacks, larger blocks and the division guard were also rejected or omitted. Screens, exact variant sources/hashes, microbenchmarks and negative results remain linked from Research 04.

The selected candidate passes 96,758 normal and sanitized differential cases, normal/sanitized full-decoder FATE and all-mode output comparisons on the public sample plus 176 generated packets. Its integration with the independent robustness patches passes the prior 27 fault/retry/header checks. Forty-nine accepted proof/control/model results include eighteen positive C obligations, eighteen reachable-completion controls, two deliberately broken C variants, ten passing finite coverage models and one expected off-by-one counterexample. [Provenance](results/scoped-provenance.json), [checks](results/scoped-checks.json), [decoder](results/scoped-decoder.json), [reproduction](repro/scoped/README.md).

Nine balanced rotating whole-decoder rounds measure **4.989×** against merged upstream on the real forced-reconstruction sample, **6.024×** on the generated forced corpus and **5.078×** on generated default mode. The real forced path has 1.173× the larger candidate's throughput, while the generated forced/default cases are 7.8%/6.6% slower than that larger candidate. Scope is much smaller; performance does not dominate every workload. [Raw timings](results/scoped-benchmarks.json).

The default real-sample median is 2.65% above upstream, with no established mechanism or neutrality claim. Checkerboards are about 2–5% slower in the function screen. Runtime evidence remains ARM64-only; x86 is compile inspection. Formal domains are explicit and do not prove the complete 256-color decoder or a C-to-TLA+ refinement relation. No timeout, rejected adapter, or platform-tool failure is counted as a successful check.

The current submission recommendation is the 17-line palette patch, with its arguments, fixtures, raw measurements and limits. Keep RLE cleanup and robustness fixes out of that performance PR. Before submission, review the default-path/pattern tradeoffs on an independent quieter host or architecture and recheck upstream head. The article should teach the selection process, including the rejected attractive design and proof-adapter mistakes. No PR is submitted and no article is published.

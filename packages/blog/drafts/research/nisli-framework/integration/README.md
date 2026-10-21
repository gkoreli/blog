# Queue-only throughput check: rejected fast path

Checked October 21, 2026 Pacific. This is follow-up evidence for the
[Nisli preservation backlog](https://github.com/gkoreli/nisli/blob/main/docs/worklists/core-rendering-performance/README.md).
It is separate from the article's published-package comparison and historical
full optimization branch. No samples are pooled across those experiments.

## Identity and method

Baseline: `4fa636031a3dc0796fb2172e1bada15391299d1d`. Queue-only candidate:
`9e9d5467dfdd8465a00e9f317bdf4ec06a9d0c11`. The source change adds empty/single
pending-effect handling, retains queueMicrotask, and leaves multiple-effect
sorting unchanged. Both bundles use actual source and standard production
NODE_ENV through esbuild. The results record the candidate signal source SHA-256.

Node 22.23.2 on macOS arm64; Playwright Chromium 149, Firefox 151, and WebKit
26.5, headless, viewport 1280 × 720 at DPR 1. All measured documents report
visible. No throttling or forced GC. This is one sequential run on one host.

Each case owns one signal and either one or eight effects. Each effect writes
its own output's text. Setup and disposal are outside the timer. The timed loop
makes 10,000 distinct writes, awaits six shared microtask turns per write, and
checks the first and last cell every time. Every effect must run exactly 10,001
times including its initial run; output-host identity must stay stable.

Three warmups per variant, followed by seven measured samples per variant and
case. Baseline/candidate order alternates each round. All samples, including the
highly variable Firefox eight-effect case, remain in
[queue-only-throughput-results.json](queue-only-throughput-results.json).
Timing includes microtask overhead and DOM verification, not only queue work.
It measures no template mount, input, layout, paint, FPS, or whole application.

## Results and decision

| Engine | Pending effects | Baseline median ms | Queue-only median ms |
|---|---:|---:|---:|
| Chromium 149 | 1 | 6.2 | 6.1 |
| Chromium 149 | 8 | 21.7 | 23.0 |
| Firefox 151 | 1 | 86.0 | 108.0 |
| Firefox 151 | 8 | 1235.0 | 1250.0 |
| WebKit 26.5 | 1 | 5.0 | 5.0 |
| WebKit 26.5 | 8 | 22.0 | 23.0 |

Firefox's single-effect baseline samples range 68–96 ms; candidate samples range
103–154 ms. The Firefox eight-effect samples vary widely; their medians do not
establish a stable magnitude. Chromium and WebKit show no convincing overall win.
No claim of statistical significance, a universal regression, or an explanation
of engine internals follows from this one run.

The queue-only source passed behavioral cross-checks and was briefly integrated
into main before this fresh throughput measurement. That integration was
premature. The runtime change was reverted before any npm release. Its four new
scheduling regression tests, source history, and recovery evidence remain.
The result rejects shipping this implementation on the current evidence.
Iterator/JIT/GC costs are hypotheses to profile, not measured explanations.

## Reproduce

Use a separate Nisli worktree at candidate `9e9d546` with its frozen dependencies
and Playwright engines installed. Current reverted main would compare the
baseline with itself, so do not substitute it for the pinned candidate.

```sh
NISLI_CORE_WORKTREE=/absolute/path/to/nisli-at-9e9d546 \
  node queue-only-throughput.mjs
```

Run with Node 22. The [runner](queue-only-throughput.mjs) archives the pinned
baseline, bundles both sources, runs all cases, and writes the result beside
itself. Research dependencies remain outside the blog's package graph.

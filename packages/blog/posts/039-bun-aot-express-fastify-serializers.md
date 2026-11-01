---
title: "Bun AOT in Express and Fastify: memory, CPU and serializers"
seoTitle: "Bun AOT in Express and Fastify: memory, CPU and serializers"
alternativeHeadline: "Measured memory, CPU, startup and serializer behavior in Express and Fastify SQLite API fixtures compiled with Bun AOT"
date: "2026-11-01"
description: "Bun AOT cut app memory by about half in Express and Fastify SQLite tests. I measured CPU, startup and a serializer built before compilation."
section: engineering
tags: [bun, performance, express, fastify, sqlite]
series:
  id: bun-aot-field-notes
  title: Bun AOT field notes
  order: 2
---

# Bun AOT in Express and Fastify: memory, CPU and serializers

Bun AOT cut app memory by **58%** in my Express/SQLite fixture and **54%** in Fastify. CPU per completed request fell in Express and rose slightly in Fastify.

Generating Fastify's serializer before Bun compiled the app preserved the four output cases I checked. The prebuilt native version used less CPU per request in every one of six matched blocks: a median **3.3% reduction** against runtime generation.

The tests led to three checks for another app:

- Compare memory, CPU per response and warmed request speed.
- Check filtering and coercion before changing serializers.
- Include bytecode when measuring startup.

My [earlier Bun AOT article](/oss-radar-08-bun-aot) recommended trying compilation before a rewrite. [Jarred Sumner's Express/SQLite report](https://x.com/jarredsumner/status/2116679973448945762) supplied another useful test: roughly 40% less memory and 14% less CPU, with similar warmed throughput. His exact app and measurement setup were not identified in my bounded source check. I built new fixtures; his precise percentages remain unverified here.

## Half the RAM did not guarantee less CPU

Both fixtures make four prepared SQLite reads and return 2,215 JSON bytes. Each cell has six fresh processes, eight persistent connections, three seconds warmup and eight measured seconds. Express ran separately; Fastify's three serializer policies and two runtimes were interleaved in one balanced batch.

| Metric, JIT → AOT | Express | Fastify, default |
| --- | ---: | ---: |
| App memory, MB | 39.9 → 16.9 | 44.0 → 20.0 |
| CPU µs per request | 26.15 → 25.15 | 26.32 → 26.66 |
| Requests/s | 38,922 → 39,708 | 38,273 → 37,310 |

Memory is macOS physical footprint in decimal MB, including in-process SQLite. It is separate from JavaScript heap, executable size and uniquely occupied machine RAM.

Express used about **4% less CPU per request** and served **2% more requests**. Fastify needed **1.3% more CPU per request** and served **2.5% fewer requests**. These are ratios of cell medians on these fixtures. [Complete runs, spread and conditions](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01).

CPU utilization was around one core in both Fastify modes. Dividing app CPU seconds by completed requests exposed the work per response. The memory saving is useful; it does not establish an electricity saving or a hosting bill.

## Generate the serializer before compiling

Fastify's response serializer comes from `fast-json-stringify`. [The tested version constructs a function from generated source](https://github.com/fastify/fast-json-stringify/blob/v7.2.0/index.js#L585). Bun's native executable has no JIT; [functions created from strings run in the interpreter](https://github.com/oven-sh/bun/blob/3f3a9ff87cdccf3d32d7ec6b648c664eddaae840/docs/compiler/compatibility.mdx#code-from-strings).

Bun suggests replacing Fastify's serializer with `JSON.stringify`. That matched my normal payload. Add an unlisted root or nested field, and plain JSON emits it while the original serializer omits it. Give the handler an ID of `"42"`, and plain JSON preserves the string while the original emits a number. A successful normal request missed both differences.

I used the package's supported [standalone mode](https://github.com/fastify/fast-json-stringify/blob/v7.2.0/README.md#standalone) to write its generated serializer to a source module. Here is the generator used for this fixture:

```js
import build from 'fast-json-stringify';
import { writeFileSync } from 'node:fs';
import { responseSchema } from './database.mjs';

writeFileSync('serializer.cjs', build(responseSchema, { mode: 'standalone' }));
```

The server imports that source before Bun's native build:

```js
import Fastify from 'fastify';
import standalone from './serializer.cjs';

const app = Fastify({ logger: false });
app.setSerializerCompiler(() => standalone);
```

Then, using the selected Bun preview:

```sh
bun run generate.mjs
bun build fastify-static.mjs --compile --format=esm --aot --outfile api
```

The response schema and handler stay in place. This fixture has one schema-bearing route. An app with several schemas, statuses or content types needs the matching prebuilt serializer for each; returning one dashboard serializer globally would be incorrect.

The standalone function matched runtime generation for the normal payload, extra fields, numeric-string coercion and a missing required field, under both source execution and native AOT. [Generator, contract tests and emitted source](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01/standalone). Conditional validation, custom formats and wider schemas need their own cases.

## Compare serializer policies in the same batch

My initial policy comparisons ran separately. Before publication, I interleaved all six policy/runtime cells across six blocks, with every cell occupying each run position once. The executables, data and expected responses were unchanged.

| Serializer | JIT requests/s | AOT requests/s |
| --- | ---: | ---: |
| Generated at runtime | 38,273 | 37,310 |
| Source generated before build | 38,575 | 38,400 |
| Plain JSON | 39,506 | 40,320 |

The prebuilt native build finished within **0.5%** of JIT's median request rate; default native was **2.5% behind**. More consistently, prebuilding used less native CPU per request in all six matched blocks: **0.7–4.6% less**, median **3.3% less**. JIT's median paired CPU change was only 0.1% lower, with changes in both directions.

The native request-rate change varied from **1.2% slower to 4.8% faster** across blocks. This is a small improvement with variation, not a promise that every run speeds up. It is consistent with making this serializer's source visible to the compiler; it does not isolate every other generated Fastify path. [Balanced comparison and block pairs](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01/11-policy-matrix-results.md).

Plain JSON also has a favorable AOT result on the fixed payload. Its changed filtering and coercion remain part of that result. The standalone path kept the four behaviors I tested.

## Startup and the first request need separate clocks

Across thirty fresh starts per mode, health-readiness medians were:

| Build | Express | Fastify |
| --- | ---: | ---: |
| JIT | 27.1 ms | 37.8 ms |
| Bytecode with JIT | 17.2 ms | 18.0 ms |
| Native AOT | 13.8 ms | 13.6 ms |

Bytecode recovered much of the readiness improvement while retaining JIT-like warmed request rates in the earlier fixture batches. It belongs in the comparison when startup and peak request speed both matter.

Readiness was less stable in the later serializer batch: cell medians ranged from 41 to 77 ms, without a consistent native advantage. Those starts remain in the data. The table describes the dedicated thirty-start control, rather than every process launch.

In another six-process-per-mode batch, my Python checker's first Fastify business call after health readiness took a median **0.72 ms under AOT versus 0.89 ms under JIT**. That includes a new loopback connection and complete JSON validation. Yet its first one-second load window still served **38,179 versus 39,324 requests**. Faster checked first work can coexist with a lower sustained rate.

These are fresh processes with warm file caches. Health already exercises common HTTP paths, and each one-second window starts a new client. [The cold traces retain all five windows and dispatch gaps](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01/08-cold-startup-results.md). They do not establish uncached deployment latency or serverless cost.

## What I kept in the evidence

The first passes overlapped another Bun experiment on the same Mac. I retained them and excluded their timing. A guard then waited for a quiet window and interrupted only my test when known competing activity returned. Every accepted run remains in the published data.

The full record contains **282 timed windows and 39,177,468 fully checked responses**, plus a separate 180-process readiness control. The replicates are the six fresh processes per cell; the response count records completed output checks. It uses Bun `1.4.4-canary.1+3f3a9ff87`, Express 5.3.0, Fastify 5.12.7 and fast-json-stringify 7.2.0 on one macOS arm64 host. Reads repeatedly select the same cached user. The guard samples two known study paths once per second; ordinary host activity and thermal variation remain possible. No CPU or RAM quota was enforced.

For these fixtures, AOT supplied a large memory saving. Fastify's generated serializer needed both a CPU comparison and tests of returned data. On another app, include bytecode, inspect hot generated functions, and test extra fields, coercion and error behavior alongside the normal payload. The [comparison tool](https://github.com/gkoreli/blog/tree/main/packages/blog/tools/bun-aot-check) checks responses before and during load; application-specific contracts still need their own cases.

---

## Glossary

Sources checked November 1, 2026.

| Term / claim | Primary source |
| --- | --- |
| Native AOT and JIT | [Pinned Bun compiler guide](https://github.com/oven-sh/bun/blob/3f3a9ff87cdccf3d32d7ec6b648c664eddaae840/docs/compiler/aot.mdx): native output has no JIT; untyped paths can lose speed. |
| Code generated at runtime | [Pinned Bun compatibility guide](https://github.com/oven-sh/bun/blob/3f3a9ff87cdccf3d32d7ec6b648c664eddaae840/docs/compiler/compatibility.mdx#code-from-strings): string-generated functions use the interpreter. |
| Standalone serializer | [fast-json-stringify 7.2.0](https://github.com/fastify/fast-json-stringify/blob/v7.2.0/README.md#standalone): emit source ahead of deployment; conditional validators can need additional generation options. |
| Measurements and contracts | [Sources, observations and manifests](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01): methods, sample spread, exclusions and exact versions. |

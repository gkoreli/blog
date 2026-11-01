# Bun AOT in Express and Fastify: memory, CPU and serializers

Ahead-of-time compilation cut app memory by about half in my Express and Fastify SQLite fixtures. CPU per request improved in Express and rose in Fastify. Generating Fastify's serializer before Bun's build preserved the four response cases I checked and left AOT about 1% behind JIT on request rate in that separate control.

Three things changed the decision:

- Measure memory, CPU per request and request speed separately.
- Give the native compiler the source of hot generated functions.
- Check what a serializer returns before accepting its speed improvement.

My [earlier Bun AOT article](/oss-radar-08-bun-aot) recommended trying compilation before a rewrite. [Jarred Sumner's Express/SQLite report](https://x.com/jarredsumner/status/2116679973448945762) gave that recommendation another useful test: roughly 40% less memory and 14% less CPU, with similar warmed throughput. His [Fastify follow-up](https://x.com/jarredsumner/status/2116679986266660883) also reported a small slowdown.

I built new fixtures with four prepared SQLite reads, bearer authentication and a 2,215-byte JSON response. The exact source and measurement setup behind his chart were not identified in my bounded source check. These results describe my fixtures and preview build; his precise percentages remain unverified.

## Saving RAM can leave CPU cost higher

Six runs per mode, eight persistent connections, three seconds warmup and eight measured seconds. These are app physical-footprint measurements on macOS, including in-process SQLite, with the database and filesystem caches warm.

| App | JIT / AOT app MB | JIT / AOT CPU µs per request | JIT / AOT requests/s |
| --- | ---: | ---: | ---: |
| Express | 39.9 / 16.9 | 26.15 / 25.15 | 38,922 / 39,708 |
| Fastify, default serializer | 43.1 / 20.5 | 25.41 / 26.13 | 39,972 / 38,217 |

Express used **58% less app memory** and **4% less CPU per request**, with about **2% more requests**. Fastify used **53% less memory**, served **4.4% fewer requests** and needed **2.8% more CPU per request**. [Complete runs and conditions](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01).

CPU utilization was around one core in both Fastify modes. Dividing app CPU seconds by completed requests exposed the extra work per response. A smaller process gives an operator a useful option, but these tests establish neither an electricity saving nor a hosting bill.

## Move serializer generation before the native build

Fastify's response serializer comes from `fast-json-stringify`. [The tested version constructs a function from generated source](https://github.com/fastify/fast-json-stringify/blob/v7.2.0/index.js#L585). Bun's native executable has no JIT; [functions created from strings run in the interpreter](https://github.com/oven-sh/bun/blob/3f3a9ff87cdccf3d32d7ec6b648c664eddaae840/docs/compiler/compatibility.mdx#code-from-strings).

Bun suggests replacing Fastify's serializer with `JSON.stringify`. That matched my normal payload. It also emitted extra root and nested fields that the original serializer omitted, and preserved a numeric string where the original emitted a number. A successful normal request missed both differences.

I used the package's supported [standalone mode](https://github.com/fastify/fast-json-stringify/blob/v7.2.0/README.md#standalone) to write its generated serializer to a module before compiling. The server imports that source:

```js
import standalone from './serializer.cjs';

const app = Fastify({ logger: false });
app.setSerializerCompiler(() => standalone);
```

Then, using the selected Bun preview:

```sh
bun run generate.mjs
bun build fastify-static.mjs --compile --format=esm --aot --outfile api
```

The original response schema and handler stay in place. In this fixture, one route has a response schema. An app with several schemas, statuses or content types needs the matching prebuilt serializer for each. Returning one dashboard serializer for every route would be incorrect.

The standalone serializer matched runtime generation for the normal payload, extra fields, numeric-string coercion and a missing required field, under both source execution and native AOT. [Generator, contract tests and emitted source](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01/standalone).

| Serializer policy | JIT / AOT requests/s | AOT rate vs JIT | JIT / AOT CPU µs per request |
| --- | ---: | ---: | ---: |
| Runtime generation | 39,972 / 38,217 | −4.4% | 25.41 / 26.13 |
| Source generated before build | 39,825 / 39,409 | −1.0% | 25.49 / 25.30 |
| Plain JSON | 40,629 / 41,418 | +1.9% | 24.90 / 24.12 |

Each policy ran in a separate guarded batch, with JIT and AOT interleaved inside it. The smaller gap is consistent with making the serializer source visible to the compiler; these batches do not isolate every framework path or ordinary host variation. The plain JSON result also changes tested response behavior. Four matching standalone cases establish a useful bounded alternative, not compatibility with every schema feature.

## Startup and the first request need separate clocks

Across thirty fresh starts per mode, health-readiness medians were:

| App | JIT | Bytecode with JIT | Native AOT |
| --- | ---: | ---: | ---: |
| Express | 27.1 ms | 17.2 ms | 13.8 ms |
| Fastify | 37.8 ms | 18.0 ms | 13.6 ms |

Bytecode recovered much of the readiness improvement while retaining JIT-like warmed request rates in these fixtures. It belongs in the comparison when startup and peak request speed both matter.

In another six-process-per-mode batch, my Python checker's first Fastify business call after health readiness took a median **0.72 ms under AOT versus 0.89 ms under JIT**. That includes a new loopback connection and complete JSON validation. Yet its first one-second load window still served **38,179 versus 39,324 requests**. Faster checked first work can coexist with a lower sustained rate.

These are fresh processes with warm file caches. Health already exercises common HTTP paths, and each one-second window starts a new client. [The cold traces retain all five windows and dispatch gaps](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01/08-cold-startup-results.md). They do not establish uncached deployment latency or serverless cost.

## What I kept in the evidence

The first passes overlapped another Bun experiment on the same Mac. I retained them and excluded their timing. A guard then waited for a quiet window and interrupted only my test when known competing activity returned. One complete Express phase preceded that interruption; Fastify and the controls ran in separate guarded windows. Every accepted run remains in the published data.

The accepted study contains **246 timed windows and 27,977,442 fully checked responses**, plus the separate 180-process readiness control. It uses Bun `1.4.4-canary.1+3f3a9ff87`, Express 5.3.0, Fastify 5.12.7 and fast-json-stringify 7.2.0 on one macOS arm64 host. Reads repeatedly select the same cached user. The guard samples two known study paths once per second; it cannot establish a perfectly idle or unthrottled machine. No CPU or RAM quota was enforced.

For my fixtures, AOT supplied a large memory saving. Fastify needed a closer look at generated code and returned data before its smaller CPU/throughput differences became useful advice. On another app, include bytecode, inspect hot generated functions, and test extra fields, coercion and error behavior alongside the normal payload. The supplied [comparison tool](https://github.com/gkoreli/blog/tree/main/packages/blog/tools/bun-aot-check) checks responses before and during load; application-specific contracts still need their own cases.

---

## Glossary

| Term / claim | Primary source | Checked |
| --- | --- | --- |
| Native AOT and JIT | [Pinned Bun compiler guide](https://github.com/oven-sh/bun/blob/3f3a9ff87cdccf3d32d7ec6b648c664eddaae840/docs/compiler/aot.mdx): native output has no JIT; untyped paths can lose speed. | 2026-11-01 |
| Code generated at runtime | [Pinned Bun compatibility guide](https://github.com/oven-sh/bun/blob/3f3a9ff87cdccf3d32d7ec6b648c664eddaae840/docs/compiler/compatibility.mdx#code-from-strings): string-generated functions use the interpreter. | 2026-11-01 |
| Standalone serializer | [fast-json-stringify 7.2.0](https://github.com/fastify/fast-json-stringify/blob/v7.2.0/README.md#standalone): emit source ahead of deployment; conditional validators can need additional generation options. | 2026-11-01 |
| Measured app memory and CPU/request | [Sources, checked contracts, observations and manifests](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/express-sqlite-2026-11-01): physical footprint and CPU seconds per completed response under the stated conditions. | 2026-11-01 |

# Nisli production diagnostics reproduction

Verified October 20, 2026. This standalone counter imports only published Nisli core. The blog, its build pipeline, and `@nisli/ssg` are absent.

Filed upstream as [Nisli #3](https://github.com/gkoreli/nisli/issues/3), with the reproduction pinned to blog commit `4e7bc14`.

## Run

Use Node 24 and pnpm 9.15.4. This directory has its own workspace boundary and lockfile.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm serve
```

Open `http://127.0.0.1:3002/`. The server serves only the generated `output/` directory. If that port is occupied, use `PORT=3003 pnpm serve`.

`counter.js` deliberately has an unknown `@clik` event to trigger the development-only N102 audit. A separate valid `@click` increments the counter. Each bundle runs in its own iframe; the harness clicks once and reports the diagnostic codes and final text. The typo is a diagnostic probe, not the reported defect.

`pnpm test` builds browser ESM bundles with minification and tree shaking, then executes those exact bundles in isolated VM contexts backed by happy-dom. Those contexts have no Node `process` global. Assertions check N102 behavior, audit-module retention, and a working `Count: 0` → `Count: 1` interaction. Node's experimental VM-module warning is expected.

## Verified results

Node 24.14.1 on macOS arm64; esbuild 0.27.3; happy-dom 20.14.6. Gzip uses Node zlib, level 9. All five cases also passed in the in-app browser reporting Chrome 155. Its `process` global was absent, as in the VM fixture.

| Variant | Core | N102 observed | Bundle bytes | Gzip bytes | Audit module bytes |
| --- | --- | --- | ---: | ---: | ---: |
| `old-core` | 0.47.4 | No | 12,552 | 4,366 | 0 |
| `default-minify` | 0.56.0 | Yes | 23,654 | 8,379 | 2,806 |
| `node-env-production` | 0.56.0 | Yes | 23,654 | 8,379 | 2,806 |
| `import-meta-production` | 0.56.0 | No | 23,667 | 8,384 | 2,810 |
| `runtime-off` | 0.56.0 | No | 23,683 | 8,389 | 2,810 |

Every counter reached `Count: 1`. The old core predates N102, so its silent result is a baseline, not proof of production detection.

`node-env-production` defines `'process.env.NODE_ENV': '"production"'`. `import-meta-production` defines `'import.meta.env': '{"DEV":false,"PROD":true}'`. `runtime-off` calls `setDevMode(false)` before invoking the function that creates the component and template. Import hoisting therefore cannot explain the opt-out result.

Repeated the automated matrix with esbuild 0.28.2, verified as the current registry release. All five emitted bundles have identical SHA-256 hashes and identical behavior to the 0.27.3 run. To repeat that supplementary check in a disposable copy:

```sh
pnpm add -D -E esbuild@0.28.2
pnpm test
```

[Derived results](verified-results.json) record both bundlers, compression runtime, hashes, browser observations, and limits. Raw terminal and browser captures remain outside Git.

## Cause and expected behavior

The published [0.56.0 README](https://github.com/gkoreli/nisli/blob/18e5b87cf50166d8551c02da5d5d056c588edc02/packages/core/README.md#diagnostics) says development diagnostics honor Vite flags or NODE_ENV and production builds are silent. [esbuild documents](https://esbuild.github.io/api/#platform) automatic `process.env.NODE_ENV` replacement for minified browser builds.

The tagged [diagnostics implementation](https://github.com/gkoreli/nisli/blob/18e5b87cf50166d8551c02da5d5d056c588edc02/packages/core/src/diagnostics.ts) reads `globalThis.process?.env?.NODE_ENV`, which is a different expression. Neither esbuild's automatic replacement nor an explicit ordinary `process.env.NODE_ENV` definition matches it. Without a Vite env object or browser process polyfill, the probe falls back to development mode. Its own source comment mentions bundlers defining `process.env.NODE_ENV`, so this is a concrete compatibility defect.

The [audit implementation](https://github.com/gkoreli/nisli/blob/18e5b87cf50166d8551c02da5d5d056c588edc02/packages/core/src/template-audit.ts) uses mutable runtime overrides and calls `isDev()`. Giving the probe the correct production value stops N102, but it does not make the audit path statically removable. Both silent variants retain the audit implementation and N102 string. The 2,810-byte module attribution is uncompressed; it does not imply 2,810 recoverable gzip bytes.

Silence under ordinary esbuild production configuration is the verified behavioral issue. Statically removable development audits are a related performance/design request. The README does not promise zero diagnostic bytes; [ADR-0030](https://github.com/gkoreli/nisli/blob/18e5b87cf50166d8551c02da5d5d056c588edc02/docs/adr/0030-agent-native-authoring.md) and [ADR-0030.2](https://github.com/gkoreli/nisli/blob/18e5b87cf50166d8551c02da5d5d056c588edc02/docs/adr/0030.2-agent-native-core-ergonomics.md) describe removal as design intent but are marked Proposed.

Production safety checks and thrown errors must remain. This reproduction concerns development-only audit work and messages; it does not justify dropping all `console.error` calls or coded errors.

## Why the blog's gzip grew

The [earlier blog measurements](../compiler-and-bundle-check.json) compared 0.47.4 → 0.56.0. Main-bundle gzip grew 7,328 → 11,252 bytes, then 11,261 after explicitly configuring production mode. These are local historical builds, separate from the counter above.

| Shared module | Before | After | Difference |
| --- | ---: | ---: | ---: |
| Component | 2,216 | 6,038 | +3,822 |
| Template | 6,723 | 8,868 | +2,145 |
| Signal | 2,864 | 4,697 | +1,833 |
| Template audit | 0 | 2,810 | +2,810 |
| Diagnostics leaf | 0 | 374 | +374 |

These are minified, uncompressed module bytes. They cannot be added to allocate gzip growth, because compression shares a dictionary across the complete bundle.

Inspection of the published old/new modules shows substantial additions to their shared paths: attribute parsing/defaults/pinning and lifecycle error containment in components; signal scheduling/error recovery and disposal support; template binding/disposal and branded HTML checks; and development auditing. Generic `component()`, `html()`, and signal implementations retain supporting branches even when this counter does not use every option. Export-level tree shaking does not specialize them for each call. The audit payload explains part of the growth; the evidence does not classify all of it as a defect or establish how much a future fix would recover.

No upstream code is changed by this fixture. No deployed-site behavior or browser speed improvement is claimed.

## Verify the 0.57.0 release

The original fixture and 0.56.0 results above remain unchanged. [The replay patch](verify-0.57.0.patch) selects the published 0.57.0 package and checks the new production contract. Apply it in a disposable copy, not over this historical fixture:

```sh
mkdir /tmp/nisli-057-repro
git archive HEAD:docs/worklist/blog-design-and-nisli-ssg/nisli-production-diagnostics-repro | tar -x -C /tmp/nisli-057-repro
cd /tmp/nisli-057-repro
git apply verify-0.57.0.patch
pnpm install --frozen-lockfile
pnpm test
pnpm serve
```

The six cases cover explicit development, the old development env definition, default minification, ordinary NODE_ENV production, the old production env definition, and runtime suppression. The ordinary entry attempts `setDevMode(true)` before creating the counter; removed production diagnostics stay unavailable. The runtime-suppression entry separately calls `setDevMode(false)`. Explicit NODE_ENV development reports N102. The old `import.meta.env` definition no longer selects the mode; esbuild's automatic production definition determines those minified cases.

Both esbuild 0.27.3 and 0.28.2 passed with byte-identical corresponding bundles; all six cases independently passed in Chrome 155. Default/explicit production counter gzip is 6,297 bytes and contains no N102, while explicit development is 8,242 bytes and reports N102. Per-module audit attribution is unavailable for the new prebundled root, so the replay records it as null. [Release evidence](../core-0.57.0-check.json) contains hashes, marker checks, browser observations, the actual blog before/after comparison, and limits. The blog uses the standard NODE_ENV definition after this migration.

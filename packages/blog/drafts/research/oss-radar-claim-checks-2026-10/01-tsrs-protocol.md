# tsrs: first independent comparison

Frozen before the first compiler run, October 30, 2026 Pacific.

## Question and audience

[Rapzid's October 20 question](https://news.ycombinator.com/item?id=50167878) asks what the advertised eightfold speedup measures. Teams considering a compiler replacement need the answer for actual checks, not just language implementation folklore. The original [Cloudflare announcement](https://blog.cloudflare.com/typescript-rust-port/) already matched checker counts and reported TS 7.1 improvements. Do not recast it as a deliberately unfair comparison.

## Inputs

- tsrs `0.20.1-ts7.1.0-beta`, installed from npm; documentation/source baseline `e18fb617ee516917342dcda27063ab67acc79e49`.
- Reference: TypeScript `7.1.0-beta`, which tsrs's compatibility docs pin to Microsoft commit `3e9236361fa97a9e6c685f4833ac457ae2d8c50a`.
- Older stable comparator: TypeScript `7.0.2`.
- Application: this public blog at `0eb9e2f81b837a971a67351171a14e857b857e4d`, archived into a separate temporary directory. Same frozen pnpm lockfile and dependencies for every compiler. No article/build output is written into the shared checkout.
- Projects: the actual site pipeline/client `packages/blog/tsconfig.json` and Worker `packages/blog/src/worker/tsconfig.json`. These are two projects from one application, not two independent repositories or a reconstruction of Cloudflare's corpus.
- Node `24.14.1`. Compiler package installation used pnpm `10.33.0` in a temporary directory; application dependency installation follows its pinned pnpm `9.15.4`. The offline install first failed on an unavailable cached tarball; the locked online install then passed. Installation is outside measurement.

## Procedure

Resolve each package's native executable through its shipped resolver and record SHA-256 and version. Run native binaries directly. Preserve source and configuration. Unset inherited compiler performance overrides. Use `--noEmit --pretty false --checkers 4` on every command; tsrs default also uses `--fast false`, and the fast variant uses `--fast` while retaining four checkers. No type-check weakening or flags added to the application's tsconfig.

The first untimed attempt used `--incremental false` everywhere. The site's inherited `composite: true` rejects that with TS6379, so the deliberate-error control failed before any timing sample was taken. Preserve that composite configuration: site runs instead use `--incremental true --tsBuildInfoFile <temporary-output>/cold-site.tsbuildinfo`, deleting that file before every invocation. This is a cold check including build-info creation, not a warm incremental measurement. The Worker is not composite and retains `--incremental false`. Apply each project's exact command to all four variants. Failed attempt logs remain in `run-01`; accepted measurements, if any, start in `run-02`.

First compare preflight diagnostics and exit codes. Record both ordered output and normalized diagnostic sets. Inject a deliberate string-to-number assignment into a new file included by each project, verify TS2322 appears in all variants, then remove the files and recheck the original diagnostics. A matching negative control does not establish universal compiler conformance.

Only then time one warm-up plus five measured runs per project/variant. Rotate variant order each round. Record each sample, wall time, native peak resident memory from macOS `/usr/bin/time -l`, exit status and diagnostic hash. Report medians and ranges; do not mix `--extendedDiagnostics`'s Go heap figure with Rust's resident-memory figure. Run any compiler statistics separately from timing.

This is a shared author workstation, not a dedicated benchmark host. Capture total competing CPU load before each round; do not terminate other sessions. A noisy series may be useful for diagnostic findings but cannot substantiate a small speed difference. A repeat is justified only if measured noise affects the conclusion.

## Decision

Publish the observed speed/memory ratios on this application only if the measured runs retain their preflight diagnostics and exit codes. If fast mode differs, give the exact counterexample its own explanation rather than timing fewer checks as equivalent work. Keep vendor corpus results attributed. Inspect the known history/depth-limit example even if this application matches, because a two-project success does not prove a drop-in replacement for every project.

No benchmark measurements have been accepted in this protocol document yet.

## Larger-project extension, after the blog run

The blog run completed 40 measured samples and eight deliberate-error checks, with matching diagnostics in all variants. Its sub-125-ms checks do not answer whether the headline matters on a large application. Add exactly the public VS Code revision used by the pinned tsrs catalog: `microsoft/vscode@9cf0128b9822dcd8a533f08ef7312956a4390301`, project `src/tsconfig.json`, dependencies from its unchanged `package-lock.json` with `npm ci --ignore-scripts --no-audit --no-fund`. The same native compiler builds, four checkers, preflight, injected error, warm-up, rotating five-run timing and RSS method apply. This is a type-check-only benchmark; third-party TypeScript compiler plugins are not executed by the native compilers. Do not call it a VS Code build or test-suite pass.

The profile file is [vscode-profile.json](repro/vscode-profile.json). Diagnostic-set and exit-code parity against 7.1 beta is a gate for both Rust variants before timing. Preserve baseline project errors if the catalog revision reports any; do not repair or filter them to obtain clean output. If the compiler outputs change across identical timed runs, stop the series and investigate rather than accept a changing workload.

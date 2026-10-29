# Reproduce the Polkadot CLI experiment

This is a macOS arm64 experiment on a pinned Bun canary, not a stable-release compatibility claim. The CLI source and dependency lock are unchanged. See [results and limits](../01-results.md) and the [maintainer draft](../02-maintainer-draft.md).

## Inputs

| Input | Pin |
| --- | --- |
| Polkadot CLI | v1.25.1, `8e85fdac1fb81c5996a4ecc4c93178a54f37f2d5` |
| Bun | `1.4.4-canary.1+73b53109f`, commit `73b53109f704b85ca889ef4e76285eb083c8d5f6` |
| Bun macOS arm64 ZIP | SHA-256 `72a0f84c6a632790592ad363cb231d8e090cbaf1356d0b1cd9785698646b77d8` |
| Unzipped Bun executable | SHA-256 `2480b715f5c61e9d0a0a0062c2435614ffadea9795d7fd24e47f0a48ee0ede15` |
| `bun.lock` | SHA-256 `fa2162fa9c5a2f08b7519112c3510ca122e26d998ddf78f11cb7289706e7663f` |
| Node | 24.14.1 |
| Runner | Python 3, standard library only; Apple's `/usr/bin/time` and `/usr/bin/sandbox-exec` |

The [official canary ZIP](https://github.com/oven-sh/bun/releases/download/canary/bun-darwin-aarch64.zip) matched GitHub release asset **686547070**, uploaded October 28, 2026 at 22:29 UTC. That URL is mutable. Verify the ZIP hash before executing it. If it changes, do not silently substitute a new compiler and call it a reproduction. The runner also rejects different compiler bytes, revision, CLI commit or lock. The exact revision's successful upstream [CI build](https://buildkite.com/bun/bun/builds/134661) is a reference; an immutable artifact download was not established here. Exact future retrieval of this canary is a remaining limit.

## Set up outside the blog checkout

Use a fresh scratch directory. The output directory must sit outside the Polkadot checkout for the standalone test. Install Node 24.14.1 through your existing runtime manager. Download, hash-check and unzip the official Bun artifact above; set `polkadot_bun` to its absolute executable path.

```sh
polkadot_checkout=/tmp/polkadot-aot-reproduction
polkadot_out=/tmp/polkadot-aot-reproduction-results
polkadot_bun=/absolute/path/to/verified/bun
polkadot_node=/absolute/path/to/node-24.14.1/bin/node

git clone https://github.com/paritytech/polkadot-cli.git "$polkadot_checkout"
git -C "$polkadot_checkout" checkout 8e85fdac1fb81c5996a4ecc4c93178a54f37f2d5
cd "$polkadot_checkout"
"$polkadot_bun" install --frozen-lockfile --ignore-scripts
```

From the blog checkout, run these commands sequentially. The paths above must remain set in that shell:

```sh
python3 packages/blog/drafts/research/polkadot-bun-aot/repro/run.py build \
  --checkout "$polkadot_checkout" --out "$polkadot_out" \
  --bun "$polkadot_bun" --node "$polkadot_node"

python3 packages/blog/drafts/research/polkadot-bun-aot/repro/run.py check \
  --checkout "$polkadot_checkout" --out "$polkadot_out" \
  --bun "$polkadot_bun" --node "$polkadot_node"

python3 packages/blog/drafts/research/polkadot-bun-aot/repro/run.py standalone \
  --checkout "$polkadot_checkout" --out "$polkadot_out" \
  --bun "$polkadot_bun" --node "$polkadot_node"

python3 packages/blog/drafts/research/polkadot-bun-aot/repro/run.py measure \
  --checkout "$polkadot_checkout" --out "$polkadot_out" \
  --bun "$polkadot_bun" --node "$polkadot_node" --blocks 20
```

The last two stages need normal macOS process/filesystem access. A restricted execution environment may prevent nested sandboxing or deny `time` access to system counters. That is a harness failure, not a CLI benchmark result; do not accept partial metrics.

## What runs

`build` creates normal JIT, JIT+asset, AOT, AOT+trim, AOT+asset and AOT+trim+asset executables from `src/cli.ts`. It also mirrors the upstream Node-package build (`--target node --packages external` and its shebang adjustment). Compilation captures remain in scratch storage. Build times are single observations, not a build-speed benchmark.

The practical AOT commands, from the CLI checkout, are:

```sh
"$polkadot_bun" build src/cli.ts --compile --aot \
  --asset node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm \
  --outfile /tmp/dot-aot

"$polkadot_bun" build src/cli.ts --compile --aot --trim \
  --asset node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm \
  --outfile /tmp/dot-aot-trim
```

`check` runs 14 cases in five modes: Node package build, Bun source, normal Bun executable, AOT+asset, and AOT+trim+asset. It checks exit status, exact stdout/stderr equality against the Node build (except the intended runtime identification in `--version`), independent SHA-256 expectations and the upstream pinned Bandersnatch member keys. Cases cover help/version, three hash algorithms, a 16 MiB file, cached metadata detail/listing, constants listing, invalid input, completion, lite/full member keys and the bundled skill text. Two additional checks retain the AOT missing-WASM failures. These 72 checks are a bounded command matrix, not the upstream full suite or a transaction-parity audit.

The fixture uses the upstream 470,278-byte metadata file and a deterministic 16 MiB payload. `DOT_HOME` points into scratch storage; the only configured RPC address is loopback port 9. A fresh update-check cache avoids the otherwise automatic npm fetch. No live-chain command, real account or transaction submission runs. Constant **value lookup** is excluded because this revision connects even with cached metadata; constant **listing** is offline. An initial value-lookup probe waited on loopback and was terminated; it supplied no accepted measurement.

`standalone` denies reads from the entire original checkout with a macOS filesystem sandbox. Both AOT+asset executables must still pass all 14 cases and match their unrestricted outputs. Three negative controls retain the blocked Node entry and the regular/JIT+asset executables' attempts to read the original WASM path. Thus the JIT timing baseline works with its checkout present; it is **not a verified standalone package**. `--asset` alone did not correct that JIT path in this compiler. The AOT executables do not depend on the checkout for the selected commands; system libraries and ordinary user input files remain available.

`measure` covers five commands, with two untimed warm-ups per mode and 20 measured fresh processes per mode/command: **500 observations**. The rotating order reverses every five blocks; every mode occupies every order position equally. Filesystem caches are warm; no caches are flushed. Wall time includes Python's process launch, `/usr/bin/time`, CLI initialization, command work and exit. There is no shell per measured launch. Peak RSS and peak physical footprint come from each process's `time -l` metrics, in bytes. They are distinct quantities. This is a shared developer laptop without CPU pinning; ranges and individual observations remain available. Do not interpret short-command peaks as sustained server memory or the hash case as isolated hashing throughput.

The accepted [structured observations](results/measurements.json), [summary](results/summary.json), [build inventory](results/build-results.json), [correctness matrix](results/correctness-results.json), [standalone checks](results/standalone-results.json) and [input metadata](results/measure-metadata.json) are selected public evidence. Raw command captures, executable files and private operational logs stay outside Git. The [manifest](results/manifest.json) commits to the public evidence and runner bytes.

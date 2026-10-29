# Prepared comment for paritytech/polkadot-cli#218

Status: **draft, not posted**. Destination: [the existing rewrite feasibility issue](https://github.com/paritytech/polkadot-cli/issues/218). The approved task is to run the experiment and prepare results; no maintainer message has been sent.

---

I tested whether Bun AOT could address the startup and memory reasons listed here, using current `polkadot-cli` v1.25.1 (`8e85fda`) without changing its source or dependency lock.

On an M5 Mac, with the same Bun canary (`73b53109f`) for both builds:

| Offline command | Normal Bun executable | AOT executable |
| --- | --- | --- |
| Help | 32.1 ms / 17.6 MB | 11.7 ms / 9.8 MB |
| Cached `inspect System.Account` | 42.1 ms / 39.6 MB | 18.5 ms / 19.4 MB |
| Full Bandersnatch member key | 41.5 ms / 61.6 MB | 25.2 ms / 48.8 MB |

Those are median fresh-process wall times and peak **physical footprint**, not RSS: 20 runs per cell, warm filesystem caches, balanced order, shared laptop. I also measured the current Node package build and Bun source; their results are in the report.

The AOT executable is **70.7 MB**, or **59.7 MB with `--trim`**. The important packaging step was:

```sh
bun build src/cli.ts --compile --aot --trim \
  --asset node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm \
  --outfile dot-aot
```

Without the asset, help works but member-key derivation fails. Both AOT+asset variants passed 14 selected command checks with the entire original checkout unreadable, including the two pinned member keys. The normal Bun executable still needed the WASM file at its original dependency path, even with `--asset`; its baseline above runs with the checkout present.

This doesn't settle live-query performance, transaction parity or the native-library reasons for Rust. It does look worth testing AOT before committing to a rewrite for startup or memory alone. This is a preview, not a stable-release claim.

[Full results, observations and exact reproduction steps](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/polkadot-bun-aot). I started this follow-up while testing the broader tradeoffs for [this Bun AOT article](https://gkoreli.com/oss-radar-08-bun-aot).

# Prepared comment for paritytech/polkadot-cli#218

Status: **draft, not posted**. For [issue #218](https://github.com/paritytech/polkadot-cli/issues/218).

---

I've been testing Bun AOT for [this article](https://gkoreli.com/oss-radar-08-bun-aot). Since startup and memory came up here, I tried it on `polkadot-cli` v1.25.1 too. No source changes.

Compared with a regular Bun executable:

- Help: **32.1 → 11.7 ms**.
- Cached `inspect System.Account`: **42.1 → 18.5 ms**, with peak physical memory **39.6 → 19.4 MB**.
- Member-key derivation improved less: **41.5 → 25.2 ms**.

These are medians of 20 runs per command on an M5 Mac, using the same Bun canary (`73b53109f`). Each run started a new process with files already cached.

The AOT executable is **70.7 MB**, or **59.7 MB with `--trim`**. You also need this build flag:

```text
--asset node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm
```

Without it, help works but member-key derivation fails. The regular Bun executable still read that file from the checkout, even with the flag.

Both AOT builds passed 14 selected commands with access to the original checkout blocked. I haven't tested live queries or transactions, so this only addresses part of the Rust discussion.

[Results and commands to reproduce](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/polkadot-bun-aot).

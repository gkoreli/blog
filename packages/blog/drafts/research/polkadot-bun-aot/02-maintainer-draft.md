# Prepared comment for paritytech/polkadot-cli#218

Status: **draft, not posted**. For [issue #218](https://github.com/paritytech/polkadot-cli/issues/218).

---

I've been testing Bun AOT for [this article](https://gkoreli.com/oss-radar-08-bun-aot). Since startup and memory came up here, I tried it on `polkadot-cli` v1.25.1 too, without changing the CLI itself.

Compared with a regular Bun executable:

- Help: **32.1 → 11.7 ms**.
- Cached `inspect System.Account`: **42.1 → 18.5 ms**, with peak physical memory **39.6 → 19.4 MB**.

These are medians of 20 fresh runs per command on an M5 Mac, using the same Bun canary (`73b53109f`), with files already cached.

The catch was crypto. Ring-proof verification took **73 ms with regular Bun but 609 ms with AOT**. Adding a static import of the WASM file cut AOT to **67 ms**, but grew the trimmed executable from **59.7 to 68.5 MB**. That fix uses a small build wrapper.

You also need `--asset node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm`. Without it, help works but member-key derivation fails. The regular Bun executable still read that file from the checkout, even with the flag.

The static-import build passed 14 selected offline commands and valid/tampered proof checks with checkout access blocked. I haven't tested live queries or transactions.

[Results, wrapper and commands to reproduce](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/polkadot-bun-aot/03-optimization-experiments.md).

# Bun AOT follow-ups

- **[Try one small example](quickstart/README.md):** two files, three commands, no npm dependencies. Checks a real checksum and records the result on your machine. This toy does not reproduce the article's compiler-memory percentage.
- **[Real CLI optimization](../polkadot-bun-aot/03-optimization-experiments.md):** a static WASM import cut one proof-verification command from 609 to 67 ms, with a larger executable and higher peak memory on that command.
- **[Current Zod counterexample](zod-repro/README.md):** still slower under the current AOT preview on this fixture, including the newer Zod release. Already documented upstream; no duplicate bug filed.
- **[Thirty-second demo](../../social/oss-radar-08-bun-aot/demo-30s.mp4):** separate labels for the original server's file size and the compiler's memory result.
- **[Prepared adoption actions](../../social/oss-radar-08-bun-aot/adoption-next.md):** named readers, exact messages and what a useful response would establish. Nothing newly posted or sent.

[Worklist and acceptance](00-worklist-index.md). All experiments use previews and bounded local workloads; sources, failures and limits are linked beside the results.

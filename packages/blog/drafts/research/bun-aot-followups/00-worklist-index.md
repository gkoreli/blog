# Bun AOT: optimization, easier trials and adoption follow-up

Owner request: explore further optimization through first-party documentation and measured experiments; produce a 30-second shareable demo; make one test easy to run; rerun the Zod counterexample on the current build and prepare a small example if useful; research established and new adoption ideas with evidence.

This is new work after the original article and Polkadot CLI experiment. Preserve their accepted results and frozen accounting. No additional post, email or maintainer comment is authorized by preparation alone.

## Work and acceptance

- [x] Read pinned native Bun compiler documentation and inspect the relevant source paths.
- [x] Test practical optimization options on the real CLI, preserving correctness and recording failed or incompatible options.
- [x] Produce a 30-second MP4 separating the original tiny-server disk-size test (121.5 / 51.8 / 30.3 MB) from the compiler peak-physical-memory test (64% less). Inspect encoded frames at full and phone size; record historical preview conditions and the counterexamples.
- [x] Provide a small dependency-free test with exact commands; run its fresh setup and correctness checks and retain measured observations.
- [x] Check the current Bun artifact, rerun the pinned Zod workload with default/jitless controls, search existing maintainer evidence, and prepare a minimal example/report if the slowdown persists. No duplicate report or unrequested posting.
- [x] Research a few further adoption approaches from first-hand evidence, distinguish established practice from an untested experiment, and prepare concrete next actions beyond the newsletters/posts already done.
- [x] Validate, deliver scoped changes to main, verify public evidence and leave a concise handoff.

## Existing evidence

- [Original article acceptance](../bun-aot/04-review-and-acceptance.md), frozen.
- [Polkadot CLI result](../polkadot-bun-aot/01-results.md) and [worklist](../polkadot-bun-aot/00-worklist-index.md), complete before this new request.
- [Executed promotion](../../social/oss-radar-08-bun-aot/execution-2026-10-28.md) and [prior distribution research](../../social/oss-radar-08-bun-aot/battle-tested-2026-10-28.md).

## Current state

Pinned compiler docs retrieved from Bun commit `73b53109f704b85ca889ef4e76285eb083c8d5f6`: AOT, size/trimming, explain, types, internals, libraries and compatibility. Candidate experiments include removing function source, explicit locale limits, disabling runtime code generation, WebAssembly import-time compilation, and JIT bytecode as an alternative startup baseline. Flags that change supported behavior require explicit correctness checks; smaller output alone is not acceptance. The compiler's explain report can identify a source-level optimization; a higher typed percentage alone is not a measured speed improvement.

The original and October 28 compiler binaries, fixtures and private results still exist in scratch storage. The fresh unauthenticated release API request returned 403; a connected GitHub read then confirmed the same current asset ID, digest and upload time. Zod used that exact compiler, not a guessed stable replacement.

## Results and delivery checks

- [Real CLI optimization](../polkadot-bun-aot/03-optimization-experiments.md): seven build candidates, full selected output checks, four commands in a 400-observation flag batch, a separate 160-observation dependency-source comparison, and 80 proof-verification observations. Static WASM import changed proof verification from 608.9 to 66.9 ms, but increased the executable by 8.78 MB and increased peak physical memory on that command. Member-key startup got slower. Removing function source only saved 0.86 MB, with no clear runtime/memory improvement.
- [Quickstart](quickstart/README.md): two files, three commands, no npm dependencies. Fresh macOS arm64 execution matched an independent checksum in all runs. Final ten-run medians were about 39.0 ms JIT and 50.7 ms AOT; smaller disk size and lower memory did not imply faster execution. The [trial JSON](quickstart/trial-macos-arm64.json) records exact values. Linux/Windows paths are not locally certified.
- [Zod](zod-repro/README.md): the same three-field/two-valid-input/two-million-validation workload on 4.3.6 and 4.6.7, with default/jitless controls and current Bun. Both showed a default AOT slowdown. Bun already documents it, so no duplicate issue was prepared for filing. The small current-version repro, six positive/negative cases across five configurations, observations and a fresh frozen-install/run smoke check are included.
- [Demo](../../social/oss-radar-08-bun-aot/shot-list.md): silent H.264, 30 seconds, 1200×1200, 30 fps, about 1.12 MB. Decoded frames checked at full and 390 px; first/last frame difference under 0.84/255 per channel. Historical October 27 data only; includes warmed-server and Zod counterexamples.
- [Adoption](../../social/oss-radar-08-bun-aot/adoption-next.md): helper-first practice and a first-party publishing workflow, then five specific next actions with exact drafts and outcome limits. The fixed-input benchmark adapter matches `RESULT 562757611` under Node, Bun source and Bun AOT; the external suite and Linux CI have not run it.
- Goga's requested article context was restored in the maintainer draft and delivered in `7630785` before the broader experiment. The draft now also includes the newly found slow crypto path and its fix; it remains unposted.

The original article, original accepted measurements and frozen research accounting remain unchanged. No new public post, email, comment, PR, paid placement or monitoring automation has been created. The scoped changes are delivered; see the receipt below.


## Delivery and completion

Delivered in [`5e6355a`](https://github.com/gkoreli/blog/commit/5e6355a), pushed directly to main. The 48-file commit contains only these requested follow-ups and links/status in their existing worklists. Unrelated macOS-worktree drafts remained unstaged and untouched.

Acceptance: all new medians, observation counts, balanced run positions, proof/output checks, source hashes and old/new manifests verified. Local links, code fences, Python syntax, TypeScript runtime outputs, the fixed adapter's AOT build and scoped diff passed. Public GETs for the optimization report, maintainer draft, quickstart guide/source/runner, Zod guide and adoption plan matched the committed bytes. The video URL returned successfully to a public HEAD request. [Selected public verification receipt](delivery-receipt.json). The local encoded video was already decoded and visually checked; a public URL is not proof of social playback or readership.

All requested preparation and experiments are complete. No site post or production behavior changed, so there is no new deployment acceptance claim. No new post, email, upstream issue/comment/PR or monitor was created. The next optional action is to use the exact prepared maintainer/peer messages or choose a social draft; publication and any future two-CLI commitment remain separate decisions. Compatibility beyond the bounded tested cases and adoption outcomes are unmeasured, not promised.

## Separately authorized distribution — October 29

Goga subsequently authorized the Polkadot comment, Assaf pitch and X demo publication. All three were performed and checked; [execution receipt](../../social/oss-radar-08-bun-aot/execution-2026-10-29.md). Earlier unposted/unsent statements describe preparation-time state. The [maintainer comment](https://github.com/paritytech/polkadot-cli/issues/218#issuecomment-6500261059) and [video post](https://x.com/GogaKoreli/status/2115822454497309070) are live. No maintainer response, independent rerun or adoption result is established.

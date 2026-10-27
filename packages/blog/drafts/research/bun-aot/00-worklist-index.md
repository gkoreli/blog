# Bun AOT — OSS Radar #08

Check date: 2026-10-27. Root thread: `01a17dd6-0c77-71f2-b43b-397d4c581c75`.

## Outcome

A finished, checked article in `packages/blog/posts/`, at most five minutes, answering reader questions about avoiding a TypeScript-to-Rust rewrite, persistent memory savings, cold versus warmed speed, compatibility and availability. Publish no prompt file or prompt transcript. Publish inspectable research and reproduction code, without private session logs or unrelated operational captures.

Use a project deep dive. The central question is whether AOT makes an existing TypeScript program efficient enough to avoid a rewrite. A title may be provocative only to the scope the evidence earns. The author's supplied priorities are the persistent memory result and understandable answers to concrete reader questions.

## Baselines

| Repository | Branch/tag | Baseline |
| --- | --- | --- |
| oven-sh/bun | `claude/compile-aot-on-check` | `06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea` |
| oven-sh/WebKit | Bun's pinned `autobuild-preview-pr-914-3c80db26` | `3c80db265b51f90243aba1fa141e03d551a6e80b` |
| microsoft/TypeScript | `v6.0.3` | `050880ce59e30b356b686bd3144efe24f875ebc8` |
| Effect-TS/effect | published benchmark input | `8b0eac6ac46a689a7208500e2ccf9e3b80fc3898` |
| colinhacks/zod | npm 4.3.6 gitHead | `ca3c8629c0c2715571f70b44c2433cad3db7fe4e` |

Official artifact: [Buildkite 133741, macOS arm64](https://buildkite.com/bun/bun/builds/133741/list?sid=01a17da4-c46c-4e5b-9720-4f1b87de2c1d&tab=artifacts). ZIP SHA-256 `b7ef38afea38fc313296629cae1a01c880782c4350f125b796c98c1ab79d4194`, matching the public artifact listing. Binary identifies itself as `1.4.4-canary.1+06888611e`. This is the AOT proposal's CI build, not the stable release. Some CI tests failed and the overall build was subsequently canceled; a successful artifact build does not certify the entire suite.

## Work and acceptance

- [x] Read the supplied posts and testing video; inspect video counts and test runner.
- [x] Read bounded samples of Peter's performance thread, its memory follow-up, Jarred's trimming thread, runtime-code-generation thread and real-use thread through the signed-in browser.
- [x] Locate and hash an official pinned AOT executable.
- [x] Reproduce TypeScript 6 checking the pinned Effect source with the same Bun revision, source entry point and application options in JIT and AOT executables.
- [x] Check false annotations, generated code, prototype mutation, computed imports and opt-in disk loading.
- [x] Measure a small retained-object server; retain counterevidence to a universal halving claim.
- [x] Measure Zod 4.3.6 default and jitless validation on JIT and AOT.
- [x] Run a 64-bit-reference control for the TypeScript compiler.
- [x] Finish the longer warmed-server comparison and audit its memory timeline.
- [x] Finish source traces, claim/theory tables and reader-question answers.
- [x] Write and iterate the full article, including title/metadata and checked sources.
- [x] Verify the rendered article on desktop/mobile, five-minute length, one H1, readable evidence, and absence of a prompt page.
- [x] Run repository checks in the isolated checkout; audit links, numbers and scoped diff.
- [ ] Freeze the research footprint without prompts if used; commit and push scoped work to main.
- [ ] Verify actual deployment and the live article separately from code delivery.

Raw media, extraction captures and command logs remain in `/tmp/bun-aot-experiments` and the earlier video directories outside Git. Public results must retain measurement conditions and code hashes. The test sources and accepted result tables belong in this research folder.

## Current evidence and next action

The compiler comparison has five measured alternating pairs after warm-up: JIT median 5.02 s / 2,624,866,896-byte peak physical footprint; AOT 1.54 s / 934,413,800 bytes. Both complete successfully with the same 688 files and 371,335 TypeScript lines. These are local macOS arm64 observations, not a Rust comparison.

The small server does not halve memory: its result depends on retained data and phase. Zod default validation is slower under AOT in the controlled microbenchmark. Both findings must survive article editing.

Accepted longer server result: five alternating pairs, 20,000 warm-up requests plus two million measured requests per process, all response hashes matching. Median throughput is 185,967 JIT versus 196,744 AOT requests/second; peak RSS is 51.6 versus 46.9 MB. This covers about 11–12 seconds per process, not a long production soak.

The finished article is roughly 850 rendered words, under five minutes at 200 words/minute. Desktop and mobile review and repository checks pass. See [final review](04-review-and-acceptance.md). Next bounded action: freeze provenance, deliver scoped commits, and verify the actual live article; keep code delivery and deployment acceptance distinct.

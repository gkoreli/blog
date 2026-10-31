# tsrs findings and publication decision

October 30, 2026 Pacific. Previous goal turn was **progress**: five questions, original sources and source baselines were recorded. This turn adds actual reproductions and the first article; the five-topic goal remains active until the other four decisions and publication outcomes are established.

## Source boundary

Initial reconnaissance inspected main `e18fb617ee516917342dcda27063ab67acc79e49`. The installed npm release is `0.20.1-ts7.1.0-beta`, following TypeScript `3e9236361fa97a9e6c685f4833ac457ae2d8c50a`. The registry's release provenance identifies tsrs source **`77d3cddb44540734abc33a42ccca4d3f33bee527`**. That is the article's code/document baseline. Reading the registry statement is not an independent signature audit or a claim to have rebuilt the native binaries. All measured native executable hashes are retained.

The release and initial inspection have identical defaults, usage and two-file-control documents. The compatibility document and watch-specific program-region implementation differ. The article therefore cites release code, and does not attribute batch memory savings to the watch-only `ProgramRegions` mechanism. Release `execute.rs` was inspected from argument parsing through `configure_performance`; release `arena.rs` was inspected for allocation/recycling/checkpoint behavior. No allocator-level attribution of the measured percentages is claimed.

## Accepted experiments

[Protocol](01-tsrs-protocol.md), [driver](repro/compiler-check.py), [depth control](repro/depth-control.py).

- [Blog results](results/tsrs-blog.json): 40 measured runs across two projects and four variants; eight injected-assignment checks. Both projects clean under all variants. Site cold checks preserve composite/incremental settings and recreate build info; Worker checks disable incremental. Initial `run-01` produced TS6379 and failed its negative control before timing; kept outside Git, no accepted timing from that attempt.
- [VS Code results](results/tsrs-vscode.json): 20 measured runs, four injected-assignment checks. TypeScript 7.1 beta and both tsrs variants print the same complete 371-diagnostic output, SHA-256 `dcc260fad8ad07cadc63a726be2a136e529d675b2ffc095567113a99fc499bb3`, with exit 2. All timed outputs retain that hash. TypeScript 7.0.2 prints 359 diagnostics with a different hash and exit 1, so its row is version context, not an identical-work baseline. Third-party TypeScript compiler plugins are not run; no VS Code build/test pass claimed.
- [Two-file results](results/tsrs-depth-control.json): 32 checks: two file orders × four checker counts × four compiler variants. Default tsrs matches the pinned 7.1 beta output in all eight combinations. Fast mode differs from that reference in five of eight. This is an existing maintainer example independently rerun on the published current packages, not a new bug discovery. The property exists in the generic constraint, so dropping this false diagnostic is not proof of skipped valid errors.

M5 Mac, 10 logical cores, 24GiB physical memory, macOS 27.0.1. Five rotating measured runs after warm-up, released native binaries, four checkers, shared workstation. VS Code default tsrs: 1.716827s / 2,522,693,632B peak RSS, versus reference 4.669323s / 5,713,920,000B; 2.7197× and 55.85% less memory. Fast: 1.447577s / 1,837,940,736B; 3.2256× and 67.83% less. Reported article units are decimal GB/MB. Competing CPU snapshots were below one core before each VS Code round; these snapshots do not continuously measure load. Ranges are retained. No small-difference causal claim or universal Rust multiplier.

Curated public JSON retains every numeric sample, commands with temporary-root placeholder, diagnostic counts/hashes, executable/version/config/lock hashes, controls and source artifact commitments. Repeated raw stdout/stderr stay outside Git in `/tmp/oss-radar-five-claims-2026-10-30/tsrs/`. Removing repeated diagnostics does not remove the comparison hashes; source-byte hashes commit to the complete private result files.

## Claim table

| Claim | Product says | Code or test | Evidence state | Inference | Reader consequence |
| --- | --- | --- | --- | --- | --- |
| Up to 8× faster, about 70% less memory | Cloudflare's October 20 announcement, equal check workers against TS 7.0 | Current packages on VS Code: 2.7×/56% in default, 3.2×/68% in fast, against 7.1 beta | Reported original; reproduced narrower comparison | Project and upstream version change the ratio | Benchmark the actual checker/version before replacing it |
| Default mode can save materially without fast preset | Current default preserves reference settings | Identical full VS Code diagnostic output and exit; 12 error controls across actual projects | Reproduced | Useful savings do not require opting into changed checker scheduling | Start with the default |
| Fast mode may change diagnostics | Usage/defaults explicitly document it | Two-file current-release matrix differs in 5/8 comparisons | Reproduced | A large-project pass is insufficient compatibility proof | Compare known failure cases as well as timing |
| Rust port has distinct memory management | Defaults describe arenas/mimalloc | Release arena implementation includes chunk allocation, free lists and speculative rewind | Code-inspected | Cannot isolate this contribution from other compiler differences in these benchmarks | Avoid language-only performance conclusions |
| Complete drop-in replacement everywhere | README describes the goal; compatibility docs list limits | This study covers CLI `--noEmit` only | Reported goal; reproduction incomplete for broader workflows | Emit, LSP and warm incremental work need independent testing | Keep the official compiler during evaluation |

## Product theory and rival test

| Theory | Whose view | Evidence for | Evidence against / boundary | Direction state | Disproof |
| --- | --- | --- | --- | --- | --- |
| A faithful, lower-memory TypeScript implementation enables development tools in constrained runtimes | Maintainers | Existing port, default CLI results, announced Wasm/Workers motivation | Compatibility work remains; no constrained-runtime test in this article | Stated direction, shipped CLI | Repeated diagnostic mismatches under reference defaults or no relevant resource saving |
| The striking speedup is just extra worker threads or an outdated upstream comparator | Plausible skeptical reading | Fast preset adapts worker count; old 7.0 is slower | This comparison fixes four checkers and uses the pinned 7.1 beta; savings persist | Tested rival | Equal-current-version/equal-setting results remove the saving |

Replaces: the CLI type-check step tested here. Extends: compiler implementation/possible constrained deployment. Relies on: Microsoft's TypeScript semantics, libraries and source direction. Stated next direction: preserve compatibility and broaden deployment; no language fork or replacement ecosystem inferred. Compiler API/editor work lies outside this reproduction.

## Editorial review

Article: [OSS Radar #09](../../../posts/033-oss-radar-09-tsrs-typescript-memory.md). Rendered Markdown contains 954 words, about 4.77 minutes at 200 words/minute. Title, opening, table and recommendation lead with default-mode time/RAM savings and include the fast-mode difference immediately. Source links use the release baseline. The actual HN question predates experimentation and identifies a useful answer; no traffic, contact or adoption is claimed. The article omits a research token badge rather than presenting this shared five-topic conversation's totals as one article's exclusive writing cost. OSS Radar has no prompt file.

Local Markdown validation passes all 23 Markdown posts. An isolated current-main archive plus the candidate article builds all 34 posts and passes workspace type checks. The shared checkout's existing dependency tree lacks `ipaddr.js` from concurrent work; its type check failed, while the isolated frozen dependency installation passed without a source change. Source, H1, canonical, social metadata, HTML/Markdown findings and existing public subscription key pass [publication checks](results/tsrs-publication-checks.json). Push and served acceptance are pending at this checkpoint.

Other four topics have source inventories and selected code downloaded, but no independent reproduction yet. PaperPilot's redaction documentation and the inspected MCP implementation appear to disagree about content removal; trace and run a synthetic-PDF test before making any public claim. Do not substitute that lead for a verified result.

## Handoff

No benchmark process remains running. Temporary compiler packages, the pinned VS Code fixture, blog fixture, exact-source captures and isolated build remain under `/tmp/oss-radar-five-claims-2026-10-30/`. No shared server, compiler configuration, global Rust setting or primary dependency tree was modified. Finish publication of this checked article; next run the PaperPilot synthetic-document control, then continue the other three distinct questions. No outreach or reader response is implied by a source push.

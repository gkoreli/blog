# Five question-led claim checks — delivery record

October 30, 2026 Pacific. This goal selected five current claims from observed public questions before substantial research, pinned their implementations, tested the consequential behavior and strongest feasible objections, and wrote a separate short OSS Radar issue for each. It is publication work with independent technical evidence, not a measured growth result.

| Issue | Missing answer delivered | Independent evidence | Material limit |
| --- | --- | --- | --- |
| [#09 tsrs](https://gkoreli.com/oss-radar-09-tsrs-typescript-memory) | Speed and memory with matching diagnostics and worker count | 60 measured samples, 12 error controls, 32 file-order/count controls | Two blog configs and one VS Code snapshot; fast-mode compatibility differs in the small control |
| [#10 PaperPilot](https://gkoreli.com/oss-radar-10-paperpilot-redaction) | “Successful” redaction leaves covered text recoverable | Actual CLI, MCP transport, own extractor, independent removal and invalid-page controls | Pinned source builds, one synthetic PDF; not a whole-product or desktop-binary audit |
| [#11 Qwenputer](https://gkoreli.com/oss-radar-11-qwenputer-compiled-cpu) | Compiled weights execute; no training in the CPU build | Stock Qwen modules, changed-operand programs, blocked reference execution, fault and residual controls | Standalone CPU only; full merged chat model/benchmarks remain reported |
| [#12 Claude Code](https://gkoreli.com/oss-radar-12-claude-code-status-summary) | Real status request path; loading a workaround doesn't prove saving | Integrity-checked official binary, actual scheduler in VM, off/pass/foreign/unrelated/bound controls, real --version activation | No live agent/API or billing study;16.4% is the source author's estimate |
| [#13 Hob](https://gkoreli.com/oss-radar-13-hob-offline-file-tasks) | Useful offline file work succeeds with setup/waiting costs | Actual engine/agent/store/file tools, recommended model hash, OS outbound denial, two exact saved artifacts | Source/headless transport adapter; two single-attempt tasks on M5, no M1 runtime or desktop usability test |

## Publication checks

Final local validation:27 Markdown posts valid. Isolated production build:38 posts. All five canonical articles appear in the built feed. New scripts pass Python AST or Node syntax checks; curated results parse as JSON; local research links resolve; scoped diffs pass whitespace checks. Rendered Markdown for the last three retains the main results and limits, with hashes in their receipts. These are content/research changes; no new application behavior is claimed. The first issue also passed an isolated typecheck; the shared checkout's unrelated stale dependency state was recorded separately rather than patched.

Publication receipts: [tsrs](results/tsrs-publication-checks.json), [PaperPilot](results/paperpilot-publication-checks.json), [Qwenputer](results/qwenputer-publication-checks.json), [Claude Code](results/status-summary-publication-checks.json), [Hob](results/hob-publication-checks.json). Each records source delivery separately from deployment activation and native-browser acceptance. All five are published and served-verified. Fifth source commit `b61bc7e` activated through successful Cloudflare build `9faea733-86e2-4ca7-a168-1ee2678ce016`; the native browser verified its canonical, H1, task results, timing and scope. Its dated receipt contains the DOM hash. The five-investigation publication objective is complete.

## Reader evidence and next decision

The question/source map is in the [original intake](00-worklist-index.md), with exact HN question links. PaperPilot's integration interest is observed; the chosen redaction hypothesis is explicitly ours, not a fabricated quoted reader request. Public discussion points/comments describe the sampled pool, never a readership estimate.

Retain the five articles with their reproducible methods and limits. Controlled own-browser access establishes delivered content. No organic discovery, independent reader application, subscriptions, measured cost saving or increased adoption is established by these checks. No additional social messages, pitches or generated HN comments were sent for this five-topic goal. The earlier Theo follow-up is a separate completed authorization.

Proposed follow-up, not accepted work or an automation: after seven complete Pacific days following the fifth served verification, inspect actual article access, source attribution and substantive reader questions/corrections under the existing analytics procedures. Keep controlled access separate; compare only equivalent windows/cohorts. A supported correction or specific new reproduction request should determine the next bounded check. Do not write another article merely because five were delivered.

Raw inputs/logs, installed dependencies, source fixtures and large model files remain outside Git in `/tmp/oss-radar-five-claims-2026-10-30/`. Curated public methods, synthetic outputs and hashes are committed. No owned model, worker or benchmark process remains running; no global agent hook or client setting was installed. Temporary source/model files are retained for reproduction, not silently deleted.

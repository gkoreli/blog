---
title: "OSS Radar #14: November’s Show HN Open-Source Launches"
seoTitle: "November 2026 Show HN: 12 Open-Source Launches"
alternativeHeadline: "How twelve November Show HN projects work and where they could be useful"
date: "2026-11-13"
description: "Twelve November Show HN launches: what they solve, how their code works, and which ideas matter, from structural diffs to decision models and agent recovery."
section: oss-radar
tags: [oss-radar, open-source, agents, developer-tools, self-hosting]
---

# OSS Radar #14: November’s Show HN Open-Source Launches

OmniDiff shows which file changed inside a ZIP. Flide shares computation across questions about the same document. HolyArrs combines several media-management jobs in one application. These are three of twelve open-source projects from November’s Show HN launches, with different ways to reduce repetitive work.

Some specialize in a particular task; others take over a larger workflow. That difference affects what they can simplify, how much they need to understand and what you take on by adopting them.

## The source

The source is **November 1–10, 2026 Show HN submissions**. The indexed inventory contained 1,455 submissions. Thirty-seven had at least 50 points when retrieved on November 11; the twelve whose outbound links went directly to GitHub are covered here. The [first OSS Radar](/oss-radar-01-vercel-winter-2026-cohort) looked at projects from Vercel’s OSS cohort.

This selection favors developer tools and projects that already attracted attention. It excludes launches linking to their own websites and those below the points threshold. The dates describe HN appearances, not the beginning of development.

Code links point to the revisions discussed. The [research records](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-14-november-show-hn) contain the inventory, discussion sources and local experiments, completed with AI assistance on November 11–13.

## The projects

### Modern Web Guidance: current browser guidance for coding agents

[Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/README.md) addresses a familiar web-development problem: an agent generates an elaborate solution that resembles old training examples when a browser feature now handles much of the work. The user still has to know enough to ask for the better implementation.

It gives the agent maintained guidance about browser features. A query such as dismissing a modal leads to relevant guides, with implementation patterns and compatibility advice. Developers can supply their project’s browser support policy.

[Search combines keyword and vector ranking](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/search.ts), using bundled data for local lookup. The system can return a short selection of guides instead of filling the context with the entire corpus. [Retrieval applies compatibility settings and opt-in gates](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/retrieve.ts) for annotated experimental features. This separates three responsibilities: maintaining the knowledge, finding the relevant part and deciding whether the project can use it.

The [evaluation harness](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/harness/README.md) defines guided and unguided agent runs against applications, with browser assertions and grader calibration. It provides a way to check whether the guidance improves the resulting implementation. The local experiments below did not rerun those comparative evaluations.

In local tests, the 1.0.0 CLI flagged a manual dialog-dismissal handler and spared the same code inside an intentional feature-detection fallback. A volatile guide was refused without opt-in. The scanner also explicitly reported limited catalog coverage. It is a way to find selected patterns, not an acceptance test for an entire site.

Its lasting value depends on keeping that guidance current and showing that agents build better pages with it. Before using it with private work, review the [default telemetry](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/cli/telemetry/clearcut-logger.ts), which includes search queries; `DISABLE_TELEMETRY=1` opts out.

### OmniDiff: structural code and archive diffs

[OmniDiff](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/README.md) is a structural code diff and a content-aware diff for compound and binary artifacts. Its audience includes anyone reviewing a change where line additions and removals obscure the useful information.

Moving a function and changing one value should not force the reader to mentally reconstruct the function from two blocks of colored lines. Updating one member of an archive should not hide the member behind a binary warning.

The [code pipeline](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/src/diff.rs) matches syntax trees in stages. It starts with exact subtrees, aligns remaining structure, recovers moves and turns the resulting correspondence into text ranges. This is more specific than adding syntax colors to a line diff. The [content dispatcher](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/src/diff/content.rs) recognizes file types from bytes, then selects the appropriate comparison, including nested content. A shared expansion budget constrains recursive decoding.

In a synthetic check with v0.4.0, a Python function moved and its return value changed from 10 to 11. The output localized the changed digit. With two ZIPs, it identified `policy.txt` as changed and counted the other member unchanged, where ordinary Git reported only a binary difference. That JSON summary identified the file to review; it did not reveal the new policy value by itself.

Changing ZIP timestamps, member order and compression left both members unchanged in the content report. Yet `--exit-code` still returned 1, as it did for the edited archive: its binary path tests raw bytes. The content view can suppress packaging noise; that exit code alone cannot serve as a semantic-equality gate.

The [launch discussion](https://news.ycombinator.com/item?id=50325253) contains both appreciation of smaller diffs and a preference for familiar displays. Three-way merge is listed as future work. The code license is AGPL-3.0-only.

OmniDiff is easy to evaluate on an existing review: use a real refactor or archive and see whether it makes the consequential change easier to find. The small examples establish specific behavior; they do not reproduce the project’s broader accuracy claims. Maintaining format decoders and matching rules will be continuing work.

### Stroq: tracing commands back to their source

[Stroq](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/README.md) looks at the relationship between what a coding agent reads and what it later tries to do. A command can be dangerous on its own; it can also be suspicious because it repeats instructions from a tool result, issue or file that should have remained untrusted input.

There are two products here that reinforce each other: retrospective session inspection and installed hooks for future actions. The first helps explain an incident. The second needs the agent host to call the hook at the right time and honor the answer.

The [engine](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/packages/core/src/engine.ts) records actionable pieces of tool output and checks later proposed actions against that session’s evidence. The [lookup logic](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/packages/core/src/provenance/action-lookup.ts) retains a suspicious origin even if a later clean source repeats the same value. It also distinguishes missing evidence from evidence that something was never read, so an incomplete record does not automatically become a clean history.

In a local source-attribution experiment, the same synthetic `npx` command was allowed without prior source material, asked about after a clean tool result introduced its package name, and denied after suspicious material introduced it. The denial survived an engine reload and a later clean repetition; a different session and unrelated package were allowed.

A command that only printed that quoted package instruction was also attributed and denied. An independent literal-print control with an empty executable search path simply printed the text. This narrow false positive matters because source correspondence does not establish that a command executes the copied instruction. A hook also has no coverage over events the host never sends.

The [launch discussion](https://news.ycombinator.com/item?id=50380704) raised script indirection: `npm test` can hide work that the command line does not reveal. Current [folder inspection](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/packages/cli/src/folder-check.ts) addresses part of that problem. In the released 0.32.0 engine and Claude adapter, a benign package script was allowed, while a fixture that fetched and evaluated code prompted folder review. Direct fetched-script execution was denied. The judged commands were never executed.

Stroq could be useful across several agent hosts, but each integration needs to handle its host’s payloads, failures and permission rules. The practical test is whether it catches enough harmful actions to justify the interruptions. Its [documented coverage limits](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/SECURITY.md) and the literal-print false positive both matter when judging that tradeoff. These engine checks do not establish protection against every bypass.

### tmux-restore: reopen agent conversations in their panes

[tmux-restore](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/README.md) reopens agent conversations in their tmux panes after a restart.

It builds on tmux-resurrect and tmux-continuum. Those tools already preserve panes, working directories and scrollback; tmux-restore supplies the command that reopens the correct conversation.

A [save hook rewrites the recorded pane command](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/scripts/save-hook.sh) using an agent adapter. The [Codex adapter](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/agents/codex.sh) follows the native process to its open rollout file, extracts the conversation identity, preserves relevant flags and supplies the original working directory. It filters out sub-agent and non-interactive sessions.

[One HN user](https://news.ycombinator.com/item?id=50403358) reports restoring long conversations into their correct panes. The local upstream adapter suite passed 51 synthetic checks. A separate tmux experiment confirmed that the status callback used for periodic saving depends on an attached client; shutdown saving is a separate path. Neither experiment establishes real reboot recovery for a live agent.

A resumed conversation can restore the developer’s context, although an interrupted tool call is not checkpointed. The utility depends on keeping its adapters compatible with agent session formats. If you already use tmux-resurrect, that is a small addition with a specific job.

### Waymark: durable Python workflows on Postgres

[Waymark](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/README.md) is for Python applications whose background work has become more involved than one job in a queue: an import branches, an API call needs a retry, several actions run in parallel, or an agent waits before continuing.

Its central architectural choice is compilation. The [motivation document](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/docs/guides/motivation/page.mdx) describes parsing the workflow’s control flow into a program that the Rust runtime executes. Actions perform the outside work. Postgres stores the program and progress.

The [compiler checks supported Python constructs](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/python/src/waymark/compiler/validation.py), and the VM’s [snapshot representation](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/crates/lib/vm-runtime/src/snapshot.rs) makes runtime state serializable. This offers a different trade from [Temporal’s event-history replay](https://docs.temporal.io/workflow-execution#replay). Instead of rerunning authored workflow code against recorded results, Waymark executes its compiled representation. The cost is a restricted language subset, including documented cases where supported-looking Python can behave differently.

Teams can keep Python and Postgres, but must work within the compiler’s supported behavior. The project is early alpha, and the [published package’s status](https://pypi.org/project/waymark/) advises against production use.

The released runtime and later source have different node-failure contracts. In a local **0.30.1** trial, killing and restarting the executor during a durable sleep preserved completed progress: the first journal effect happened once and the workflow finished. Killing it during an in-flight action produced a second journal append after restart, even without an explicit retry policy. The database confirmed a single workflow instance for that case.

That behavior matches the release’s redelivery contract. [PR 886](https://github.com/piercefreeman/waymark/pull/886), merged after the release, changes lapsed node-owned calls into `ActionExecutionLost`, leaving repetition to the workflow’s policy. The [later retry documentation](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/docs/python/retries/page.mdx) describes that change. Only the released 0.30.1 runtime was executed in the local trials.

Timeouts also do not cancel the original attempt, and version upgrades [require downtime](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/docs/guides/production/page.mdx) at the inspected source revision. Durable control state and a guarantee about outside effects remain separate responsibilities.

Waymark may make durable jobs easier to add to a Python/Postgres application. Before adopting it, test the failure behavior of the version you install and make outside operations safe to repeat. A workflow can finish successfully after sending the same request twice.

### HolyArrs: media-library management in one application

[HolyArrs](https://github.com/HolyArrs/HolyArrs/blob/649795593b6f13ea26cdea326a7113b15c2c9371/README.md) combines media discovery, acquisition and library management for self-hosters. It reduces the number of applications to configure, update and investigate when a download fails.

The maintainer [makes the scope explicit](https://news.ycombinator.com/item?id=50439032): Plex or Jellyfin still handles playback. Download clients remain separate too. The consolidation is in managing the path from finding a title to getting it into the library.

The [grab path](https://github.com/HolyArrs/HolyArrs/blob/649795593b6f13ea26cdea326a7113b15c2c9371/app/backend/internal/downloads/grab.go) records acquisition state. A chosen release belongs to a wanted slot; the manager selects a compatible downloader, records the download and handles uncertain sends. If an external client may already have accepted the request, blindly adding it again is the wrong recovery. Keeping those states together gives the manager a record to consult during recovery. Four upstream synthetic acquisition tests passed, including reconciliation after a lost response and reuse of durable state after a database restart. Some crash states were constructed by the tests; they were not trials against a real library or installed downloader.

[Version 1.1.0 added hosted, own-keys and off metadata modes](https://github.com/HolyArrs/HolyArrs/issues/222). Previously, supplying a TMDB key still left other lookups dependent on the project’s metadata server. The [transport gate](https://github.com/HolyArrs/HolyArrs/blob/649795593b6f13ea26cdea326a7113b15c2c9371/app/backend/internal/metadata/gate.go) refuses hosted-service requests outside hosted mode; the [provider map](https://github.com/HolyArrs/HolyArrs/blob/649795593b6f13ea26cdea326a7113b15c2c9371/docs/run/outside-hosts.md) explains which services own-keys mode contacts directly.

Three upstream tests with loopback stand-ins passed: own/off modes prevented hosted requests, and an own-key lookup reached the simulated TMDB service without registration. This checks selected transport paths, rather than every possible connection from a running installation.

Independence has a feature cost: hosted-only charts and some enrichment are unavailable in own-keys mode. Operators can choose which of those features they need.

The main reason to adopt HolyArrs is less integration work. Migration and compatibility with existing sources, download clients and library conventions still need testing. Try it against a representative library before replacing a working stack; a fresh empty installation will reveal much less.

### Flide: shared computation for decision requests

[Flide](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/README.md) serves decision requests: several questions about the same document, image or state, with structured choices or scores. Think of an email that needs several classifications, rather than a chatbot writing an unrestricted answer.

Asking eight questions independently repeats a common prefix. Putting all eight into one ordinary prompt changes what each question can see. Flide shares the prefix computation while preserving independent question branches.

[Packing produces a flat token stream](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/flide/runtime/pack.py) with request, branch and position metadata. The [attention kernel](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/flide/kernels/attention.py) lets each question see its shared input and its own tokens, while isolating sibling questions. The API then [assembles typed answers and probabilities](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/flide/api/answers.py). Optional cross-request session caching adds another reuse path; it is not the main explanation for the product.

The [authors’ paper](https://arxiv.org/html/2610.42148v1) separates the mathematical claim in exact arithmetic from an optional mode for bitwise determinism. That distinction matters when a small probability difference can move a decision across a threshold. Independent computation, reproducible floating-point results and accurate classification are three different properties.

Its answer API rescales the peak above a uniform distribution to produce the `confidence` field. Running the assembly function on supplied two-choice probabilities of 0.9 and 0.1 returned confidence 0.8. That measures the distribution’s concentration, rather than an empirically measured probability that the selected answer is correct. This check used supplied probabilities without running an inference model.

The maintainer [bounds the headline 9.5× result](https://news.ycombinator.com/item?id=50423700) to a specific model and workload with many questions sharing a long input. It is not a universal gain over general inference servers. A [user’s kernel/startup follow-up](https://github.com/OmniJev/Flide/issues/2) adds evidence about one laptop-GPU configuration; no GPU benchmark was run here.

Flide is most relevant when many questions share an input. If most requests have one question, much of the opportunity to reuse computation disappears. Compare decision accuracy as well as speed on your workload, especially where small probability changes cross a decision threshold.

### Kairos: agent-managed fraud policies and experiments

[Kairos](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/README.md) brings event history, model questions, policies, review cases and experiments into a fraud/risk platform that a coding agent can operate over MCP.

Natural-language questions can supply signals before a team has enough labels to train a useful traditional model. As outcomes arrive, those answers can become features alongside ordinary numerical data, and experiments can compare the combinations.

The [decision path](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/apps/server/src/modules/decisions/service.ts) reads subject history and related entities, constructs model context, applies policy and retains the decision with its evidence. The [workflow path](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/apps/server/src/modules/workflows/libs/steps.ts) uses a stable step identity to find an already saved decision after a retry. The [experiment service](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/apps/server/src/modules/experiments/service.ts) separates chronological training, validation and test data, selecting candidates using validation results while reporting test results separately.

The experiment service gives a team a way to evaluate an agent’s proposed changes. The code also exposes how features are resolved during training and scoring, so those paths can be checked for consistency.

The [default model client calls Finic’s service](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/packages/core/src/grayson.ts), so self-hosting the application still leaves inference with an external provider. The evidence here is implementation reading; no customer-data or model-API trial established fraud-detection performance.

Agents could reduce the effort of maintaining these policies. Whether that helps a business depends on observed fraud losses, review costs, calibration and false positives. A higher AUC or a plausible generated explanation is insufficient on its own. Kairos needs evaluation against those operating costs before a team relies on its decisions.

### STE80 Humanizer: rules for editing generated prose

[STE80 Humanizer](https://github.com/Dodaios/ste80-humanizer/blob/99bc468482599f5d75f595e2c1adf893ebff4d8f/README.md) packages a method for removing habitual model phrasing and making sentences easier to read. The name can suggest a detector game, but the maintainer [explicitly describes clarity as the purpose](https://news.ycombinator.com/item?id=50429144).

The main product is the [editing procedure](https://github.com/Dodaios/ste80-humanizer/blob/99bc468482599f5d75f595e2c1adf893ebff4d8f/SKILL.md). It starts with an inventory of facts and qualifications, removes staging and stock phrases, then applies a softened version of Simplified Technical English sentence structure. It finishes by comparing the rewrite with the facts. Light and strict modes differ, and an author’s writing sample can override style defaults.

A Python checker catches selected phrases and structural patterns, while [rewrite graders separately assess fidelity](https://github.com/Dodaios/ste80-humanizer/blob/99bc468482599f5d75f595e2c1adf893ebff4d8f/evals/rewrite-readme-paragraph/graders/01-keeps-all-facts.md). The local checker accepted both a qualified statement with a limit of 40 requests and a fluent but fact-changed version with a limit of 400. It also flagged a deliberately formulaic control. A checker that receives only the edited text cannot compare it with the source facts.

The useful part is the procedure for preserving facts while editing. Its success depends on whether it also preserves the writer’s voice; consistently producing a different stock style would be a poor result. The checker experiment did not evaluate model-backed rewrites.

### HyperFlow H3 Flash: compressed video and audio generation

[HyperFlow H3 Flash](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/README.md) reduces the compute and memory needed for MiniMax-H3 video and synchronized-audio generation. It is aimed at people running those workflows on their own accelerators.

The [transformer implementation](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/src/hyperflow_h3_flash/transformer.py) makes several coordinated changes: removed blocks, low-rank replacements for selected large matrix operations, conditioning on both ends of a sampling step and reduced-precision computation. The [INT8 path rotates inputs before quantization](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/src/hyperflow_h3_flash/int8.py) to distribute outlier channels. The [scheduler](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/src/hyperflow_h3_flash/schedule.py) supplies explicit four-, six- and eight-step trajectories.

Compression, numerical approximation and sampling each affect the quality and cost of the result. The [full pipeline](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/src/hyperflow_h3_flash/pipeline.py) still needs companion text-encoding and VAE components. The transformer’s file size therefore does not describe the complete first-run download or working memory.

The [notices](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/THIRD_PARTY_NOTICES.md) distinguish core code, runtime integrations and weights. The [weight publisher](https://huggingface.co/VideoRebirthAI/hyperflow-h3-flash) still states that use in the EU, UK, South Korea or US requires prior MiniMax authorization under the separate model agreement. Apache-licensed code does not remove that constraint.

Evaluate the complete workflow on matched prompts: audio/video quality, startup, memory and execution time all matter. The speed and quality results discussed by the project remain the developers’ measurements; the local research did not download weights or generate clips.

### Spindle: shared validation and client schemas

[Spindle](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/README.md) is an OCaml web framework with its own HTTP engine, Eio-based handlers and generated API artifacts. It derives request validation, API documentation and client schemas from the same route descriptions.

[Input descriptions carry both parsing behavior and schema information](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/core/input.ml). Routes retain their dependencies and return descriptions. The [OpenAPI generator](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/core/openapi.ml) and [Zod generator](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/core/zod.ml) read that representation, rather than requiring separate hand-maintained declarations.

A local contract change tested the relationship directly. One synthetic route accepted an integer from 1 to 10. Changing only the upper bound to 2 changed the server response for 3 from HTTP 200 to 400, changed OpenAPI’s maximum and changed the generated Zod parser’s acceptance. The strict CLI check rejected the stale pre-change artifacts and passed after regeneration.

The [client-schema workflow](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/docs/src/content/docs/tutorial/client-schemas.mdx) carries that bound in the runtime validator. TypeScript still sees a number, so the client must invoke the generated validator to enforce the constraint.

The framework also handles HTTP, WebSockets, forms and streaming. The one-route trial did not test conformance across those protocols. The [launch discussion](https://news.ycombinator.com/item?id=50377613) raises capability security; the [static-file implementation](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/core/files.ml) uses Eio directory capabilities to constrain file access.

The bound experiment supports Spindle’s approach for one route through the real server, generators and client validator. For a larger service, test whether error responses and streaming preserve the same agreement between declared and actual behavior.

### Coldframe: a refrigeration-controller honeypot

[Coldframe](https://github.com/hedgerow-dev/coldframe/blob/e6b126af0ab08c24b48de77abfe063e98ff1b12f/README.md) is a honeypot for supermarket refrigeration controllers. Researchers can use its simulated device interactions to observe what a visitor tries after logging in.

The [single-file Python implementation](https://github.com/hedgerow-dev/coldframe/blob/e6b126af0ab08c24b48de77abfe063e98ff1b12f/honeypot.py) gives its controller personas different paths, headers and authentication behavior. Weak fake credentials can succeed, producing a session and a dashboard of fake refrigerated cases. Subsequent control requests change fake state and produce structured events. The optional Modbus listener is disabled by default because the protocols a device exposes are part of its credibility.

The local loopback trial followed that path: wrong login rejected, fake login accepted, node 2 put into fake defrost mode and the event independently read back. This is a working simulation of an interaction, without real equipment or public deployment.

The [maintainer’s launch account](https://news.ycombinator.com/item?id=50406292) reported generic scanners and Shodan across two instances online for one day. Those instances had not captured targeted sabotage. Where the honeypot is placed and how easily it can be identified will affect what it observes.

Coldframe’s value depends on whether visitors continue interacting with its simulated controllers. The local trial establishes that the fake state and event recording work; the reported deployment establishes only the traffic seen so far. Neither result shows protection of real equipment.

## What these projects have in common

### Specialization helps when the workload fits

Flide shares a prefix across independent questions. OmniDiff matches structure and decodes artifact contents. Spindle derives validation and schemas from one representation. Coldframe models interactions with a particular kind of equipment.

Each uses knowledge about its task to do something a general tool handles poorly. The benefit depends on the workload: Flide needs several questions sharing an input, and Coldframe needs visitors interested in the device it simulates. A narrower tool also has less room to spread its maintenance costs. Parsers, protocols and models keep changing; adoption has to justify following those changes. If general tools absorb the same capabilities, these projects will need another reason for users to keep them.

### Coding agents need more than generation

Modern Web Guidance supplies implementation knowledge. Stroq tracks an action’s origin. tmux-restore preserves the conversation’s place in a workspace. Waymark retains execution progress. STE80 supplies editing rules, while Kairos connects agent changes to evaluation.

Those are six of twelve selected projects. Show HN and the direct-GitHub selection rule favor developer tooling, so this is not an estimate of the whole market. Within this sample, though, much of the work is about making generated output usable: keeping context, reviewing actions, evaluating changes and recovering after failure. Improvements to the model may take over some of those jobs. Others depend on application state and operating rules outside the model.

### Fewer applications can mean more responsibility in one project

HolyArrs reduces the connections between media-management applications. Waymark puts durable workflow state in Postgres. Both have to account for work that happened outside their own database. HolyArrs records a downloader-send intent so an uncertain result can be reconciled. Waymark’s released node-recovery path can repeat an action. A completed workflow does not establish that the outside effect happened once.

The same operating question applies to dependencies. HolyArrs now exposes a choice of metadata modes. Kairos leaves model inference with an external provider by default. HyperFlow’s code and weights have different terms. Before replacing an existing stack, check which dependencies you can operate or replace and which responsibilities remain elsewhere.

OmniDiff and tmux-restore can be tried within an existing workflow. Modern Web Guidance can be compared on a specific page change. Spindle’s shared contract can be tested with an API change. Waymark, HolyArrs and Kairos ask for more: representative failures, migrations or operating outcomes. The amount of testing should follow how much of the application the project will take over.

---

## Sources

| Source or term | What it establishes |
| --- | --- |
| [Complete inventory, sample and pinned revisions](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-14-november-show-hn) | November 1–10 indexed submissions and the repeatable twelve-project selection. Sample captured November 11; follow-up reading November 13. |
| [Product mechanisms and positioning](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-14-november-show-hn/05-product-mechanisms-and-positioning.md) | Implementation paths, product interpretations, neighboring designs and the separate HolyArrs update. |
| [Local trials](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-14-november-show-hn/04-local-trials.md) | Versions, synthetic inputs, outcomes and limits of the local checks. |
| [Mechanism experiments](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-14-november-show-hn/06-mechanism-experiments.md) | Source-attribution controls, archive repacking, answer-API semantics, acquisition reconciliation, real Waymark recovery and a Spindle contract change. |
| [HN API](https://github.com/HackerNews/API) / [Algolia HN search API](https://hn.algolia.com/api) | Public discussions and indexed discovery used for the scan. Index availability limits completeness. |
| Durable execution | Preserving progress beyond a process lifetime. An external action’s uncertain completion still requires an explicit policy. |
| Decision inference | Evaluating structured questions or choices about an input. Sharing that input can change the efficient execution strategy. |

---
title: "OSS Radar #15: November Launches and Takumi Revisited"
seoTitle: "OSS Radar #15: Local AI, Embroidery, RISC-V, and Agents"
alternativeHeadline: "Eight November open-source launches and a return to Takumi, examined through code and focused trials"
date: "2026-11-16"
description: "Eight November Show HN projects plus Takumi: local meeting notes, embroidery, RISC-V and agent recovery, explained through source code and focused trials."
section: oss-radar
series:
  id: oss-radar
  title: OSS Radar
  order: 15
tags: [oss-radar, open-source, developer-tools, agents, local-ai, risc-v]
---

# OSS Radar #15: November Launches and Takumi Revisited

ZigZag turns drawings into embroidery files. AssemblyForNeovim brings compiler output into the editor. AgentRun records which work an agent can repeat after an interruption. These are three of eight November open-source launches in this issue, alongside a return to Takumi eight months after the first Radar.

The selection also includes a local meeting-notes application, a translated game and a RISC-V processor. Code and focused trials reveal the choices behind their promises: which source file gets compiled, when model work yields to recording, how a retry affects an outside action, and what a processor's verification actually covers.

## Sources and selection

The launch pool is **November 11–14, 2026 UTC Show HN submissions**, following [#14's November 1–10 selection](/oss-radar-14-november-show-hn). The closed-window retrieval on November 15 contained **603 indexed submissions**. Sixteen had at least 50 points at retrieval; nine linked directly to GitHub. The eight open-source projects among those nine are covered here. Klad's main application explicitly identifies itself as source-available and has a [restricted main license](https://github.com/klad-app/klad/blob/4a2496a34f4947a6890adec078203c43c951b0d8/LICENSE), so it is excluded.

The separate return visit is Takumi, from [#1's Vercel cohort](/oss-radar-01-vercel-winter-2026-cohort). Its recent releases make it worth revisiting: the image renderer now describes a shared layout engine with several output formats, and the recent font work gives us a specific change to check.

This is an attention-filtered launch sample plus an editorial follow-up. It favors developer tooling, omits projects whose launches link to their own sites, and does not measure adoption. HN appearances are not project creation dates. Code links point to the revisions discussed; trials retain their actual versions where newer releases are mentioned. The [research records](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-15-november-show-hn) contain the closed inventory, participant dossiers, fixtures, results and limits, prepared with AI assistance on November 14–16.

## The projects

### Yogurt: meeting notes on the user's machine

[Yogurt](https://github.com/FrigadeHQ/yogurt/tree/ada44ea930d34b11742e2febc5b4f129261124cb) brings recording, transcription and enhanced notes into a local desktop application. It is designed to keep the meeting material on the user's machine and run local speech and notes models. That also makes model downloads, memory and scheduling part of the product.

The [application wiring](https://github.com/FrigadeHQ/yogurt/blob/ada44ea930d34b11742e2febc5b4f129261124cb/app/src/main/index.ts) waits for saved stop state and recording/transcript finalization before writing the enhanced note. The person's notes and the generated version are saved separately. At the inspected revision, [Whisper supplies the saved transcript](https://github.com/FrigadeHQ/yogurt/blob/ada44ea930d34b11742e2febc5b4f129261124cb/app/src/main/asr/index.ts), while Apple's on-device speech can supply the live view.

The [model queue](https://github.com/FrigadeHQ/yogurt/blob/ada44ea930d34b11742e2febc5b4f129261124cb/app/src/main/notes/queue.ts) gives recording priority. On its lower-memory Mac path, starting a recording interrupts notes work, requeues it and requests model unloading. A synthetic job through that unchanged queue waited during recording, began after stop, was interrupted by the next recording and ran again afterward. This checks the scheduling decision; real RAM use and note quality remain unmeasured here.

There is also optional assistant access. The [MCP server](https://github.com/FrigadeHQ/yogurt/blob/ada44ea930d34b11742e2febc5b4f129261124cb/app/src/main/mcp/server.ts) exposes read-only meeting data behind a global toggle, off by default. Two same-user clients in a synthetic socket trial were blocked with access off, could both read with it on, and were blocked again when it was disabled. The socket used mode 0600. Enabling it authorizes same-user software, rather than one individually approved assistant; a connected assistant's model provider remains a separate data decision.

[A user's first-meeting failure](https://github.com/FrigadeHQ/yogurt/issues/30) exposes another part of that responsibility. Yogurt recorded while its speech model was downloading, but the transcript never arrived afterward. [0.3.24](https://github.com/FrigadeHQ/yogurt/releases/tag/v0.3.24) adds recovery from saved audio. Its [backfill path](https://github.com/FrigadeHQ/yogurt/blob/0f2e5bc5d9452e956dfc82b26b96ec1fd14f3a60/app/src/main/asr/backfill.ts) feeds decoded recordings through the normal transcription pipeline, pacing them so the queue does not discard audio.

On 0.3.24, that path worked with an authored English recording: the released Mac decoder and Whisper server, using the catalog's small model, produced five saved transcript segments and cleared the waiting state. But the original reporter's older meeting still did not recover. Two further fixes were needed: recognizing meetings made before transcript tracking existed, and including meetings already marked done after their empty notes were written. On November 16, the [reporter confirmed transcription and summarization](https://github.com/FrigadeHQ/yogurt/issues/30#issuecomment-6917599061).

The [0.3.34 store](https://github.com/FrigadeHQ/yogurt/blob/2004c7fc3d77538a648bf28632e49d484349a057/app/src/main/store.ts) made that distinction visible in a persisted-data comparison. An old stopped meeting and an old done meeting, both without transcript lines or a waiting flag, were missed by 0.3.24 and selected for recovery by 0.3.34. Handled empty meetings were not selected again on the next reopen. Partial recovery remains different: a deterministic 0.3.24 pause after the first saved line left the meeting pending but ineligible for automatic backfill, and 0.3.34 still excludes that partially transcribed state. The acknowledged request for a manual transcribe-again action remains a useful next step.

[A Linux report](https://news.ycombinator.com/item?id=50474482) and the [microphone sample-rate fix](https://github.com/FrigadeHQ/yogurt/pull/39) show useful work on actual capture friction too. Yogurt deserves a representative meeting trial on the intended machine. The synthetic recording establishes a functioning local recognition path; microphone capture, overlapping speakers and summary quality still need their own evaluation.

### AssemblyForNeovim: assembly beside the code

[AssemblyForNeovim](https://github.com/0xdeadf1sh/AssemblyForNeovim/tree/58a471ec97fb5987eca2b955fd2cba8693a414f6) makes compiler output easier to reach while editing. Its small Lua implementation finds build arguments, asks the compiler for optimized assembly and uses debug line mappings to select the relevant output.

The important dependency is the project's compilation context. In [`cc_base` and `build`](https://github.com/0xdeadf1sh/AssemblyForNeovim/blob/58a471ec97fb5987eca2b955fd2cba8693a414f6/lua/asm/init.lua), compilation-database argument arrays survive as individual arguments, while a `command` string is split on whitespace.

That difference showed up in a clean Neovim 0.12.6 trial. A tiny C function included a header from a directory containing a space. The `arguments` form compiled and displayed an addition of 7. An equivalent quoted `command` form broke the include path and failed. With an unsaved edit changing the addition to 99, the plugin warned that it was reading disk, then showed the new source comment beside assembly still adding 7.

Selection needs context too. In a fresh C buffer, the normal shortcut selected only the cursor's line. Explicitly parsing the syntax tree changed it to the whole function. [Open PR 4](https://github.com/0xdeadf1sh/AssemblyForNeovim/pull/4) addresses that initialization and adds missing-parser warnings; it is still a proposal, rather than behavior supplied by the inspected revision.

The Rust path compiled an authored standalone function and a Cargo library. It also showed why a compiler preview needs the project's target and features: the plugin's default Cargo invocation emitted an addition of 7, while an explicit feature-enabled build emitted 99. A package containing both a library and a binary failed until a target could be selected. These controls compiled assembly without executing the fixture programs. The useful first trial is an existing project with its real flags and normal editing setup.

The [launch discussion](https://news.ycombinator.com/item?id=50454067) points to debugger-based disassembly as an adjacent workflow. This plugin recompiles source for inspection; a debugger can show the executable actually being run. The right choice follows the question: what does this compiler make of the function, or what code did this binary execute?

### ZigZag: owning the artwork-to-stitch workflow

[ZigZag](https://github.com/simpsoka/zigzag/tree/429a028054145fc3e541525bb05b57596fa49d22) combines an embroidery editor, stitch planning and machine-file export, with a separate Bluetooth path for the Brother Skitch. It gives people an alternative route through work otherwise tied to vendor software.

The interesting code starts after importing the drawing. A line between two shapes can become visible thread, an unnecessary cut, or travel hidden beneath stitches that will be sewn later. The [planner](https://github.com/simpsoka/zigzag/blob/ad19cb09dcf5649fac55b43a083714bcd2b761d4/src/design.rs) considers those choices, including travel inside a fill and around its outline, while accounting for rows already sewn. [0.1.2](https://github.com/simpsoka/zigzag/releases/tag/v0.1.2) focused on reducing cuts; the reported reductions belong to the maintainer's examples. Newer [0.1.4](https://github.com/simpsoka/zigzag/releases/tag/v0.1.4) and [0.1.5](https://github.com/simpsoka/zigzag/releases/tag/v0.1.5) work adds live corners, shape editing and fill rows that follow moved artwork. The editor is taking on more of the design work before export.

A [Melco Summit user identifying as a small embroidery shop](https://github.com/simpsoka/zigzag/issues/15) describes the difference between a plausible preview and a file their machine can use. Their first supplied-column design contained 103 stitches below 0.4 mm, mostly locks. After updating to 0.1.5 and selecting machine/minimum-stitch settings, they report passing their own pre-flight checker. They explicitly had not sewn it yet. They also supplied the satin geometry themselves; automatic lettering still needed work.

The current 0.1.5 CLI made those settings consequential in a separate authored design: a curved ring with a hole and two leaves. An independent reader checked the exported PES and EXP files, counting nonzero sewing moves:

| Settings | Moves below 0.4 mm | Shortest move |
| --- | ---: | ---: |
| Generic defaults | 157 | 0.1 mm |
| Melco Summit profile | 0 | 0.4 mm |
| Melco profile, 0.6 mm minimum | 0 | 0.6 mm |

The [exporter](https://github.com/simpsoka/zigzag/blob/429a028054145fc3e541525bb05b57596fa49d22/src/formats/mod.rs) checks movement length after rounding onto the machine's coordinate grid and adjusts lock stitches too. This is useful machinery beyond drawing a path. It still needs an operator's constraints: a second conversion printed that the design exceeded its deliberately tiny hoop, wrote the file and exited successfully. The [CLI](https://github.com/simpsoka/zigzag/blob/429a028054145fc3e541525bb05b57596fa49d22/src/main.rs) writes before printing checks.

ZigZag now has both source and user evidence for moving more digitizing work into an open tool. Machine profiles improve actual output; fabric, stitch geometry and sew-out remain the adoption test. The [Bluetooth-only Skitch workflow](https://news.ycombinator.com/item?id=50472523) adds a separate device-control problem beyond file export.

### AgentRun: recovery with an explicit replay policy

[AgentRun](https://github.com/Parcha-ai/agentrun/tree/b98a6c025b9795ec452431114a18a66c6160ef7d) adds durable execution, control and learned artifacts around existing agent harnesses. The model and harness remain dependencies. The useful question is what the added state lets an operator recover or inspect.

The [kernel](https://github.com/Parcha-ai/agentrun/blob/b98a6c025b9795ec452431114a18a66c6160ef7d/packages/run-adapters/src/kernel/drive.ts) records an effect's intent and outcome under a stable key. After an interruption, an unfinished call marked `safe` can run again. A call marked `never` becomes an interrupted failure: it may already have taken effect. The [recovery message](https://github.com/Parcha-ai/agentrun/blob/b98a6c025b9795ec452431114a18a66c6160ef7d/packages/run-adapters/src/process/recovery.ts) preserves that uncertainty instead of telling the model the action simply failed.

A provider-free control exercised that kernel and tool bridge. A synthetic tool appended to an owned file, then was interrupted before recording its result. Reopening the retained in-memory store did not repeat the `never` call. The same deliberately non-deduplicated append marked `safe` ran twice. A completed call returned its recorded result with one append total.

The released beta.38 also passed its [disk-backed workflow crash sweep](https://github.com/Parcha-ai/agentrun/blob/d10f0053e09cd7ac0186006b13f7a6a52aa8bc22/packages/serve/test/durable-crash-sweep.test.mjs): nine admission, dispatch, settlement and commit crossings, each cut with `SIGKILL`, then resumed and reopened. Its second mode copies the stopped directory before resuming on the same host. Uncertain effects stopped the workflow instead of being dispatched again; the deliberate journal-bypass control caught repeated effects. Separate [production-journal controls](https://github.com/Parcha-ai/agentrun/blob/d10f0053e09cd7ac0186006b13f7a6a52aa8bc22/packages/serve/test/store-journal-fence.test.mjs) rejected writes under a stale runner claim without partial journal or run-row changes. These tests used SQLite and a local counting service, with no real model or outside account.

The policy label therefore carries responsibility: AgentRun can honor it, but cannot make an outside action safe to repeat merely by naming it so.

[Beta.38](https://github.com/Parcha-ai/agentrun/releases/tag/v0.1.0-beta.38) also supplies a learning path. A [compile turn](https://github.com/Parcha-ai/agentrun/blob/d10f0053e09cd7ac0186006b13f7a6a52aa8bc22/packages/serve/src/learn/compile.ts) turns accumulated work into a workflow. The [promotion path in current beta.40](https://github.com/Parcha-ai/agentrun/blob/bb7fb3eab9ad592fe81a57c1389744856889da7b/packages/serve/src/runner/promotion.ts) still compares a new revision on recent suitable graded inputs, with an important exception: fewer than five suitable inputs permits promotion on a passing dry run. A replay that actually runs must have at least five scored inputs before it can promote.

How that comparison is scored matters. Controls through the actual [beta.38 module](https://github.com/Parcha-ai/agentrun/blob/d10f0053e09cd7ac0186006b13f7a6a52aa8bc22/packages/serve/src/learn/promote.ts) and [beta.40 scorer](https://github.com/Parcha-ai/agentrun/blob/bb7fb3eab9ad592fe81a57c1389744856889da7b/packages/serve/src/learn/refit.ts) gave one correct autonomous answer plus nineteen hand-backs 100% and a passing scoring result. Hand-backs take the original agent's answer and grade. Handing back all twenty was rejected. Failed replay rows are excluded from accuracy and reported separately by the runner. Read the score alongside how often the workflow answers on its own and which inputs could be evaluated.

The current replay also includes runs answered by learned workflows themselves. Repeating five workflow answers already graded wrong failed beta.40's scoring control. Its [answer comparison](https://github.com/Parcha-ai/agentrun/blob/bb7fb3eab9ad592fe81a57c1389744856889da7b/packages/serve/src/learn/promote.ts) has a limit worth knowing: without expected fields, a different reply to a previously wrong workflow answer counts as right. Supplying an expected answer made a different, nonmatching reply fail the control. A changed answer alone does not establish correctness.

These controls exercised scoring with synthetic rows, not model learning. The [workflow-first implementation](https://github.com/Parcha-ai/agentrun/blob/bb7fb3eab9ad592fe81a57c1389744856889da7b/packages/serve/src/runner/workflow-first.ts) can run a promoted workflow before asking the agent, hand work back, and stop an uneconomic workflow once enough cost history exists. Beta.40's [cost summary](https://github.com/Parcha-ai/agentrun/blob/bb7fb3eab9ad592fe81a57c1389744856889da7b/packages/serve/src/learning-cost.ts) now excludes replay and manual-agent runs from its serving-cost average; adding such rows changed beta.38's average but left beta.40's unchanged. That makes the figure more useful, while the cost rule still cannot detect a confidently wrong answer. Fresh graded tasks remain necessary.

Upgrade compatibility needs the version and backend too. [Beta.39's release contract](https://github.com/Parcha-ai/agentrun/releases/tag/v0.1.0-beta.39) adds SQLite columns while keeping schema version 11, and migrates Postgres from 11 to 14. It requires a backup to roll Postgres back to beta.38. Beta.40 documents no further store migration from beta.39. No database upgrade was exercised here; these are the documented operating requirements of a fast-moving beta.

AgentRun merits a closer look when durable orchestration is becoming a real operating need. Its recovery policy and learning decisions are inspectable. Evaluate learning with matched fresh tasks, autonomous coverage and total cost, and test the installed version's failure and upgrade behavior before relying on it.

### bo2-mac: the environment around translated code

[bo2-mac](https://github.com/adrbn/bo2-mac/tree/ea6f78e0a41a374e5748635da99bafcc2d062d0b) translates Call of Duty: Black Ops II for Apple Silicon using the owner's game copy. Its scope includes CPU translation, Windows runtime behavior and a graphics bridge. No game assets were acquired for this review.

The [build pipeline](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/scripts/build_steam.sh) lifts code through Remill/LLVM, applies project passes and compiles ARM64 output. Its [D3D shim calls the shader translator](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/runtime/win32/remaining_dlls_impl.cpp#L3146-L3150), then registers the translated source and resource maps with the graphics backend. The [translator](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/runtime/gfx/dxbc_to_msl.cpp) uses HLSLcc and accounts for constant-buffer layout differences between D3D and Metal. Translation of CPU instructions supplies only part of the environment the game expects.

One small example makes that adaptation concrete. D3D can place a `float2` immediately after a scalar; Metal's natural alignment can move it. The bridge changed an authored misaligned declaration to `packed_float2`, left an aligned control alone and preserved a deliberate padding gap. Separately, an authored DXBC vertex shader passed through the unchanged translator and became a Metal library with a vertex function. These checks used public source and synthetic inputs, without game files or a rendered game frame.

The [runtime dispatch](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/runtime/win32/win32_runtime.cpp#L20563-L20570) can enter an interpreter for an untranslated code target. That fallback is [enabled by default](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/runtime/win32/interp.cpp#L129-L134), so the launch's absolute no-emulation wording needs qualification. The [prerelease record](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/docs/PRERELEASE.md) also limits tested machines and sessions. Gameplay and frame rates remain the project's reports; this research did not build or run the game.

The [user reports](https://github.com/adrbn/bo2-mac/issues/6) are more informative than a frame-rate headline: one player reached the game after a Steam interface-version fix, then reported settings-menu navigation trouble. An [open DLC fix](https://github.com/adrbn/bo2-mac/pull/7) tackles another platform mismatch—Steam ownership versus whether Windows depots are installed on the Mac—and still awaits an actual Steam run. The work extends into distribution, account APIs and ordinary menus. It is a substantial porting project to study; recommending it for play still needs a declared machine, version and session.

### Fursoy: a processor with an inspectable verification path

[Fursoy Slice-1](https://github.com/FURSOY/fursoy-cpu/tree/377ae9563ab1b88ee0a037f2223ab49822968396) is an out-of-order RISC-V processor written in SystemVerilog. It is a project for studying and extending processor architecture: two-wide fetch, decode and retirement, separate execution queues, caches, virtual memory and a small system around the core. The repository includes RTL, firmware and verification harnesses under its [Apache-based license](https://github.com/FURSOY/fursoy-cpu/blob/377ae9563ab1b88ee0a037f2223ab49822968396/LICENSE), which customizes the trademark paragraph.

One consequential choice concerns page-table updates. Linux can write a new translation into a cache line that has not reached main memory yet. The [core's integration](https://github.com/FURSOY/fursoy-cpu/blob/377ae9563ab1b88ee0a037f2223ab49822968396/rtl/core/fursoy_s1_core.sv#L710-L742) waits for the store queue to empty, then supplies a page-table read from a dirty L1D cache hit when available. That connects the virtual-memory mechanism to the actual state of recent stores.

The [launch discussion](https://news.ycombinator.com/item?id=50497137) contains useful questions about architecture balance, verification and physical implementation. The repository does have a [Sail reference-model comparison](https://github.com/FURSOY/fursoy-cpu/blob/377ae9563ab1b88ee0a037f2223ab49822968396/tools/run_s1_sail_cosim.py), contrary to an early assumption in the thread. Its saved results cover four fixed workloads, totalling 627 reference-model steps. The maintainer also reports Linux 6.6.50 and BusyBox booting in simulation. Those results describe particular verification work.

Locally, the unchanged interrupt/trap suite built with Verilator 5.054 and passed seven properties plus 25,500 randomized stress operations across three seeds. The stress segment injects operations; the suite also contains fetched trap probes. A separate authored program ran through the [S1 frontend harness](https://github.com/FURSOY/fursoy-cpu/blob/377ae9563ab1b88ee0a037f2223ab49822968396/verification/s1_sail_cosim_tb.cpp), multiplied 7 by 9, summed 1 through 10, stored and reloaded both results, and matched an independent register check. Changing multiply to add made that check reject 16 in place of 63. This adds fetched execution evidence while leaving the much larger Linux and Sail results attributed to the maintainer.

The interrupt-suite build reported two latch warnings for local temporaries in the load/store queue module. Passing these bounded programs leaves broader lint and processor verification work open.

A smaller directed check distinguished one reported fix. Reading the pending-interrupt register combines a hardware interrupt pin with stored software bits. A read-modify-write must preserve that distinction or it can keep an interrupt pending after the pin falls. The actual CSR module cleared the condition correctly. Replacing its write operand with the combined read value in a temporary control left the interrupt stuck; no-pin, software-set and pin-only controls behaved as expected. This checks the operand's effect, without claiming to reproduce the complete earlier Linux livelock.

The [500 MHz synthesis work](https://github.com/FURSOY/fursoy-cpu/blob/377ae9563ab1b88ee0a037f2223ab49822968396/tools/run_s1_synth.py) covers eight standalone blocks before place and route. Full-system physical implementation and fabricated-hardware performance remain open. Fursoy's value now is an architecture that can be read, simulated and challenged. It offers a substantial learning and experimentation base; a deployable processor needs a broader body of verification and physical evidence.

### DeepSeek V3 in JAX: readable architecture mechanisms

[DeepSeek V3 in JAX](https://github.com/Vaibhaav-Tiwari/deepseek-v3-jax/tree/6901be60941b98dc654ed542465290db9e8bafa6) makes several model mechanisms small enough to inspect in one implementation. Its audience is someone learning the architecture. The miniature training run reported by the author is separate from the full model's quality and efficiency.

The [router](https://github.com/Vaibhaav-Tiwari/deepseek-v3-jax/blob/6901be60941b98dc654ed542465290db9e8bafa6/deepseek_v3.py) uses a balancing bias to select experts, then derives their output weights from the original affinities. Its latent-attention cache stores compressed content and a shared rotary key. Both distinctions appear in the [original technical report](https://arxiv.org/html/2412.19437v2#S2.SS1).

Tiny CPU controls changed which experts were selected while preserving the raw-affinity weighting. A full six-token attention pass matched prefill plus incremental decoding within the declared tolerance. The inspected mixture-of-experts code computes all experts and gates their results; it does not gain sparse computation merely by selecting sparse output weights.

All 39 [upstream CPU tests](https://github.com/Vaibhaav-Tiwari/deepseek-v3-jax/blob/6901be60941b98dc654ed542465290db9e8bafa6/tests.py) passed, including tiny-batch overfitting, cached generation, checkpoint writing and controls that preserve a good checkpoint after non-finite weights. That supports a working educational implementation. Efficient expert dispatch and distributed execution remain outside its scope.

A [merged ROCm contribution](https://github.com/Vaibhaav-Tiwari/deepseek-v3-jax/pull/1) reports a full run on an AMD card and exposes a useful reproduction detail: the integer seed does not fix initialization when the PRNG configuration changes. In a separate tiny CPU control, seed 0 and an identical input batch produced different initial weights and losses when `jax_threefry_partitionable` changed. The contributor's newer JAX setup records that setting explicitly. The [published data, checkpoint and logs](https://github.com/Vaibhaav-Tiwari/deepseek-v3-jax/releases/tag/v1.0) make the larger training result inspectable; neither that full run nor a hardware-throughput comparison was reproduced here.

### Agweb: separate workspaces with a choice about shared state

[Agweb](https://github.com/paul-nameless/agweb/tree/a52c8b66e16499ec2781c7fea3c4a37983a7002c) is a WebKit-based macOS browser for visible concurrent agent work. Its workspace model aims to reduce interference with the user's active browsing.

Workspace separation and website identity are separate choices in the [implementation](https://github.com/paul-nameless/agweb/blob/a52c8b66e16499ec2781c7fea3c4a37983a7002c/Sources/AgwebApp/Model.swift). An unnamed profile receives a fresh nonpersistent data store. A named profile can be reused across workspaces, sharing website data by design. That suits agents working with the same login; different accounts require the corresponding isolation choice.

[0.2.0](https://github.com/paul-nameless/agweb/releases/tag/v0.2.0) adds default ad/tracker blocking with global and per-workspace controls. The setting matters when testing an application too: blocked requests change what the page does. Current [0.3.0](https://github.com/paul-nameless/agweb/releases/tag/v0.3.0) exposes profile selection in New Workspace and checks whether a click target is covered. A [user's strict-YAML installation failure](https://github.com/paul-nameless/agweb/pull/1) also led to a bundled-skill fix. Agent integration includes these small packaging and interaction contracts.

The browser requires macOS 26 and uses its own command interface, without CDP compatibility. The [launch discussion](https://news.ycombinator.com/item?id=50497924) identifies that as an integration constraint.

The released 0.2.0 app confirmed that distinction on a synthetic local page. A second unnamed workspace could not read the first one's cookie or localStorage marker. Two workspaces on one named fixture profile shared both; a different named profile stayed empty.

A further trial on official 0.3.0 filled and submitted an authored form through the CLI. It refused a covered button and identified the covering element. After quitting and restarting, the named profile retained its persistent cookie and localStorage marker; the unnamed profile lost both. These are useful differences for concurrent work: a workspace can be temporary, or reuse an identity across sessions.

[An agent user's feedback](https://github.com/paul-nameless/agweb/issues/3) asks for page revisions and better extraction after actual CLI use. That is another coordination problem in a browser shared with a person: the page can change between commands. The local trials used no real accounts and do not measure memory, token or focus savings. Evaluate Agweb's command contract and profile behavior in the workflow it would actually share.

### Takumi revisited: a renderer taking on more layout work

In March, [#1](/oss-radar-01-vercel-winter-2026-cohort) discussed Takumi as an alternative image-rendering pipeline. The [November release](https://github.com/kane50613/takumi/tree/ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d) describes a broader shared layout engine for image, SVG, PDF and paint-tree outputs. That is expanded scope; it does not by itself establish a strategic pivot or equal maturity across outputs.

Recent work makes resource handling more central. The [preparation path](https://github.com/kane50613/takumi/blob/ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d/takumi-bindings-js/src/prepared.ts) asks the styled document which images and fonts it needs, then loads them. In a local HTTP control, it fetched the image drawn as a CSS background, skipped a CSS-hidden image, and reused the loaded bytes for PNG, SVG and measurement. Supplied image bytes avoided the fetch. The native caller must choose preparation or supply resources: raw native rendering fetched nothing and produced a different image. The higher-level `takumi-js` wrapper already prepares its scene.

One small fix was reproducible through the published native packages. Registering the exact same font-data object first as Alpha and then as Beta returned Alpha for the second request in 2.19.0. In 2.20.0 it returned Beta. The [JavaScript registry change](https://github.com/kane50613/takumi/commit/4fd9276e43b0130abab25da788625a2b3bd19aa2) explains it: generated cache keys now include face descriptors alongside the buffer's identity.

Copied arrays and two different objects sharing the same underlying bytes already worked in both versions. The generated PNGs matched even in the old wrong-registration case, so image equality alone would have missed the absent requested family.

Font matching has another condition. A [current user report](https://github.com/kane50613/takumi/issues/2558) says a supplied font named `Geist` can be shadowed by the built-in Geist. On native 2.20.0, the reported Cyrillic subset returned a successful registration but rendered five boxes for `Файли` at weight 400. The same file under a different family name drew the word. Removing the built-in family also restored Cyrillic, but then the ASCII control lost its Latin fallback. These are separate responsibilities: registering a face, selecting it and retaining useful fallback.

On Node, the published `takumi-js` wrapper rendered the same local image scene through explicitly supplied native and ESM WebAssembly renderers, fetching only the drawn resource and producing identical PNGs in this case. Its CommonJS `init` export was an object and failed when called; [PR 2569](https://github.com/kane50613/takumi/pull/2569) proposes a binding fix. The successful ESM paths and the failing initializer are distinct deployment conditions, even at the same 2.20.0 version.

Takumi's [v3 tracker](https://github.com/kane50613/takumi/issues/2372) proposes further consolidation of backends, packages and resource handling. The current release already supplies useful preparation work, with narrower font-matching and package-entry limits. Evaluate the scripts, faces, output formats and module entry point a real application will use.

## What this selection shows

### Small tools still depend on context

AssemblyForNeovim needs the right compiler arguments, target and source revision. ZigZag's machine profile changes the exported stitches. Takumi's font cache needs the face descriptors as well as the bytes. Agweb's visible workspace needs a deliberate website-state choice. These controls are part of the result a convenient interface presents.

That does not make smaller tools a bad trade. It identifies the useful adoption test: start with a representative case where the context matters, instead of an empty project or a default screenshot.

### Taking control includes taking responsibility for the next step

Yogurt moves model scheduling onto the user's computer. ZigZag exposes the path from artwork to stitches, while the machine and fabric still determine the physical result. AgentRun makes replay policy explicit, while the tool author must correctly identify which actions tolerate repetition.

The common benefit is more control over a workflow. The remaining work differs by project. A local notes application, a stitch planner and an agent runtime should not be judged by the same benchmark.

These patterns describe this selected set. A developer-heavy launch source makes tooling patterns easier to find; it cannot establish an ecosystem-wide direction. Fursoy and the educational JAX implementation also serve a different purpose from a ready-made application: making architecture inspectable and executable can be their main contribution. Their value includes what someone can learn or extend, with verification and performance claims kept at their demonstrated scope.

## The distillation

ZigZag and Yogurt take on substantial workflows, with machine and resource choices that deserve a representative trial. AssemblyForNeovim is a smaller experiment to try in an existing project, provided its output is tied to the build and source revision intended.

AgentRun's explicit uncertain-effect handling is worth studying. Its new compile/replay path makes the learning proposition more concrete, while the scoring control shows why an accuracy headline needs its autonomous coverage and evidence count. The beta upgrade contract matters alongside both.

Takumi earns its return visit through the shared engine's expanded responsibility and a demonstrated release improvement. Fursoy and the JAX implementation merit attention as learning environments, with very different distances between a small passing control and their larger performance claims. Following the implementation helps locate that distance.

For an adoption trial, choose an input that can change the decision: a realistic synthetic meeting, an embroidery design with meaningful travel, an interrupted action whose outside result is uncertain, or a render with several font faces. Check the resulting notes, files, side effects or selected font. That is where the practical difference between a useful interface and a dependable workflow becomes visible.

---

## Sources

| Source | What it establishes |
| --- | --- |
| [Inventory and participant dossiers](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-15-november-show-hn) | Selection boundaries, source pins, implementation paths, attributed reports and unresolved checks |
| [Fixtures and reproduction](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-15-november-show-hn/repro) | Synthetic inputs, versioned environments and the scope of local results |
| [Additional participant trials](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-15-november-show-hn/09-evening-due-diligence.md), [Monday release checks](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-15-november-show-hn/10-monday-release-follow-up.md) | Saved-recording recognition and migration, compiler selection, current exports, disk crashes, shader adaptation, fetched execution, training controls, browser restart, package entry points and changed learning scores |
| [Show HN](https://news.ycombinator.com/show) | Launch discussions; attention and reports rather than measured adoption |
| [Takumi 2.19.0](https://github.com/kane50613/takumi/releases/tag/takumi%402.19.0), [2.20.0](https://github.com/kane50613/takumi/releases/tag/takumi%402.20.0) | Recent released scope and changes, distinct from later master work |
| [DeepSeek-V3 technical report](https://arxiv.org/html/2412.19437v2) | The primary architecture reference for the educational JAX comparison |
| [AgentRun beta.38](https://github.com/Parcha-ai/agentrun/releases/tag/v0.1.0-beta.38), [beta.40](https://github.com/Parcha-ai/agentrun/releases/tag/v0.1.0-beta.40) | Versioned learning and upgrade contracts; distinct from the earlier kernel-control pin |
| [Fursoy verification and synthesis](https://github.com/FURSOY/fursoy-cpu/tree/377ae9563ab1b88ee0a037f2223ab49822968396/tools) | Actual runners behind the simulated boot, finite reference comparison and standalone-block timing claims |

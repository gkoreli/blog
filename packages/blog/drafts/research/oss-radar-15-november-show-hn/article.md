# OSS Radar #15: November Launches and Takumi Revisited

ZigZag turns drawings into embroidery files. AssemblyForNeovim brings compiler output into the editor. AgentRun records which work an agent can repeat after an interruption. Alongside seven November launches, this issue returns to Takumi, eight months after it appeared in the first Radar.

The projects range from a small Lua plugin to a translated game and a local meeting-notes application. Their usefulness depends on details that a feature list leaves out: which source file gets compiled, when model work yields to recording, how a retry affects an outside action, and whether an exported design fits its machine.

## Sources and selection

The launch pool is **November 11–14, 2026 UTC Show HN submissions**, following [#14's November 1–10 selection](/oss-radar-14-november-show-hn). The November 14 retrieval contained 584 indexed submissions, with that UTC day still open. Fifteen had at least 50 points; eight linked directly to GitHub. Seven are reviewed here. Klad's main application explicitly identifies itself as source-available and has a [restricted main license](https://github.com/klad-app/klad/blob/4a2496a34f4947a6890adec078203c43c951b0d8/LICENSE), so it is excluded from the open-source selection.

The separate return visit is Takumi, from [#1's Vercel cohort](/oss-radar-01-vercel-winter-2026-cohort). Its recent releases make it worth revisiting: the image renderer now describes a shared layout engine with several output formats, and the recent font work gives us a specific change to check.

This is an attention-filtered launch sample plus an editorial follow-up. It favors developer tooling, omits projects whose launches link to their own sites, and does not measure adoption. HN appearances are not project creation dates. Code links point to the revisions discussed. The [research records](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-15-november-show-hn) contain the provisional inventory, participant dossiers, fixtures, results and limits, prepared with AI assistance.

## The projects

### Yogurt: meeting notes on the user's machine

[Yogurt](https://github.com/FrigadeHQ/yogurt/tree/ada44ea930d34b11742e2febc5b4f129261124cb) brings recording, transcription and enhanced notes into a local desktop application. It is designed to keep the meeting material on the user's machine and run local speech and notes models. That also makes model downloads, memory and scheduling part of the product.

The [application wiring](https://github.com/FrigadeHQ/yogurt/blob/ada44ea930d34b11742e2febc5b4f129261124cb/app/src/main/index.ts) waits for saved stop state and recording/transcript finalization before writing the enhanced note. The person's notes and the generated version are saved separately. At the inspected revision, [Whisper supplies saved transcript lines](https://github.com/FrigadeHQ/yogurt/blob/ada44ea930d34b11742e2febc5b4f129261124cb/app/src/main/asr/index.ts); Apple's on-device speech can supply the live view, while its saved-final-language set remains empty.

The [model queue](https://github.com/FrigadeHQ/yogurt/blob/ada44ea930d34b11742e2febc5b4f129261124cb/app/src/main/notes/queue.ts) gives recording priority. In its small-Mac branch, starting a recording interrupts notes work, requeues it and requests model unloading. A synthetic job through that unchanged queue waited during recording, began after stop, was interrupted by the next recording and ran again afterward. This checks the scheduling decision; it does not measure real RAM use or note quality.

There is also optional assistant access. The [MCP server](https://github.com/FrigadeHQ/yogurt/blob/ada44ea930d34b11742e2febc5b4f129261124cb/app/src/main/mcp/server.ts) exposes read-only meeting data behind a global toggle, off by default. Two same-user clients in a synthetic socket trial were blocked with access off, could both read with it on, and were blocked again when it was disabled. The socket used mode 0600. Enabling it authorizes same-user software, rather than one individually approved assistant; a connected assistant's model provider remains a separate data decision.

[One Linux user](https://news.ycombinator.com/item?id=50474482) reports that an initial problem was fixed and the application worked after updating. That is useful firsthand testimony. The local controls here exercised components, without recording audio or judging recognition and summaries. Yogurt is worth evaluating with a representative synthetic meeting, especially on the machine that will run it: local ownership includes managing the compute that a hosted service normally absorbs.

### AssemblyForNeovim: assembly beside the code

[AssemblyForNeovim](https://github.com/0xdeadf1sh/AssemblyForNeovim/tree/58a471ec97fb5987eca2b955fd2cba8693a414f6) makes compiler output easier to reach while editing. Its small Lua implementation finds build arguments, asks the compiler for optimized assembly and uses debug line mappings to select the relevant output.

The important dependency is the project's compilation context. In [`cc_base` and `build`](https://github.com/0xdeadf1sh/AssemblyForNeovim/blob/58a471ec97fb5987eca2b955fd2cba8693a414f6/lua/asm/init.lua), compilation-database argument arrays survive as individual arguments, while a `command` string is split on whitespace.

That difference showed up in a clean Neovim 0.12.6 trial. A tiny C function included a header from a directory containing a space. The `arguments` form compiled and displayed an addition of 7. An equivalent quoted `command` form broke the include path and failed. With an unsaved edit changing the addition to 99, the plugin warned that it was reading disk, then showed the new source comment beside assembly still adding 7.

Those are specific cases to check before trusting the preview in a real project. No fixture executable was run, and the trial says nothing about runtime speed. A recent [C23/C2x fallback](https://github.com/0xdeadf1sh/AssemblyForNeovim/commit/820949a80763e82378dceaa4da640944380e9412) is another example of the compiler compatibility this convenience needs to preserve.

The [launch discussion](https://news.ycombinator.com/item?id=50454067) points to debugger-based disassembly as an adjacent workflow. This plugin recompiles source for inspection; a debugger can show the executable actually being run. The right choice follows the question: what does this compiler make of the function, or what code did this binary execute?

### ZigZag: owning the artwork-to-stitch workflow

[ZigZag](https://github.com/simpsoka/zigzag/tree/ad19cb09dcf5649fac55b43a083714bcd2b761d4) combines an embroidery editor, stitch planning and machine-file export, with a separate Bluetooth path for the Brother Skitch. It gives people an alternative route through work otherwise tied to vendor software.

The interesting code starts after importing the drawing. A line between two shapes can become visible thread, an unnecessary cut, or travel hidden beneath stitches that will be sewn later. The [planner](https://github.com/simpsoka/zigzag/blob/ad19cb09dcf5649fac55b43a083714bcd2b761d4/src/design.rs) considers those choices, including travel inside a fill and around its outline, while accounting for rows already sewn. Recent [0.1.2 work](https://github.com/simpsoka/zigzag/releases/tag/v0.1.2) focuses on reducing cuts; [0.1.3](https://github.com/simpsoka/zigzag/releases/tag/v0.1.3) adds machine and stitch controls. The reported cut reductions belong to the maintainer's examples.

The core CLI built and exported an authored rectangle to PES and DST. Reopening PES reported 225 stitches, one color and no trims. A deliberate over-hoop control also exported: it printed an error that the 150 mm design exceeded a 100 mm hoop, wrote both files and exited successfully. The [convert path](https://github.com/simpsoka/zigzag/blob/ad19cb09dcf5649fac55b43a083714bcd2b761d4/src/main.rs) writes before printing checks, and a printed error does not change the exit status.

That matters for unattended conversion. A successful command does not establish machine suitability. The trials checked file output and constraint reporting; no machine, thread or fabric was involved.

The [maintainer's explanation](https://news.ycombinator.com/item?id=50472523) also distinguishes file export from a Bluetooth-only machine workflow. ZigZag's value lies in controlling the whole path from editable artwork to a usable design. The decisive adoption test is a representative design on the intended machine, including its physical result.

### AgentRun: recovery with an explicit replay policy

[AgentRun](https://github.com/Parcha-ai/agentrun/tree/b98a6c025b9795ec452431114a18a66c6160ef7d) adds durable execution, control and learned artifacts around existing agent harnesses. The model and harness remain dependencies. The useful question is what the added state lets an operator recover or inspect.

The [kernel](https://github.com/Parcha-ai/agentrun/blob/b98a6c025b9795ec452431114a18a66c6160ef7d/packages/run-adapters/src/kernel/drive.ts) records an effect's intent and outcome under a stable key. After an interruption, an unfinished call marked `safe` can run again. A call marked `never` becomes an interrupted failure: it may already have taken effect. The [recovery message](https://github.com/Parcha-ai/agentrun/blob/b98a6c025b9795ec452431114a18a66c6160ef7d/packages/run-adapters/src/process/recovery.ts) preserves that uncertainty instead of telling the model the action simply failed.

A provider-free control exercised the real kernel and tool bridge. A synthetic tool appended to an owned file, then was interrupted before recording its result. Reopening the retained in-memory store did not repeat the `never` call. The same deliberately non-deduplicated append marked `safe` ran twice. A completed call returned its recorded result with one append total. This was a drive interruption/reopen, not a process-kill or disk-store trial.

The policy label therefore carries responsibility: AgentRun can honor it, but cannot make an outside action safe to repeat merely by naming it so.

Its learning mechanism manages versioned notes, skills and workflows, with grading and admission logic. That does not establish that later tasks improve. The [beta.37 release](https://github.com/Parcha-ai/agentrun/releases/tag/v0.1.0-beta.37) explicitly calls the learning loop unfinished and says the compile/guard/promote stack is absent. It also requires a fresh SQLite store when upgrading from beta.36; Postgres has a separate migration path.

AgentRun merits a closer look when durable orchestration is becoming a real operating need. Test the installed version's failure and upgrade behavior, then evaluate learning with matched tasks and costs. A recovery component passing its controls does not settle either of those broader questions.

### bo2-mac: the environment around translated code

[bo2-mac](https://github.com/adrbn/bo2-mac/tree/ea6f78e0a41a374e5748635da99bafcc2d062d0b) translates Call of Duty: Black Ops II for Apple Silicon using the owner's game copy. Its scope includes CPU translation, Windows runtime behavior and a graphics bridge. No game assets were acquired for this review.

The [build pipeline](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/scripts/build_steam.sh) lifts code through Remill/LLVM, applies project passes and compiles ARM64 output. The [shader bridge](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/runtime/gfx/dxbc_to_msl.cpp) translates D3D shader bytecode through HLSLcc and remaps resource bindings. It must also account for constant-buffer layout differences between D3D and Metal. Translation of CPU instructions supplies only part of the environment the game expects.

The inspected implementation includes interpreter fallbacks for missed or protected code, so the launch's absolute no-emulation wording needs qualification. The [prerelease record](https://github.com/adrbn/bo2-mac/blob/ea6f78e0a41a374e5748635da99bafcc2d062d0b/docs/PRERELEASE.md) also limits tested machines and sessions. Gameplay and frame rates remain the project's reports; this research did not build or run the game.

Recent [test builds](https://github.com/adrbn/bo2-mac/releases/tag/v0.2.0-test.4) work on a no-Terminal application, updates and selective reconversion. That is a useful direction: getting translated code running and making the process manageable for an owned-copy player are different pieces of work. A playability recommendation still needs a declared machine, version and substantial session.

### DeepSeek V3 in JAX: readable architecture mechanisms

[DeepSeek V3 in JAX](https://github.com/Vaibhaav-Tiwari/deepseek-v3-jax/tree/6901be60941b98dc654ed542465290db9e8bafa6) makes several model mechanisms small enough to inspect in one implementation. Its audience is someone learning the architecture. The miniature training run reported by the author is separate from the full model's quality and efficiency.

Two details repay reading. The [router](https://github.com/Vaibhaav-Tiwari/deepseek-v3-jax/blob/6901be60941b98dc654ed542465290db9e8bafa6/deepseek_v3.py) uses a balancing bias to select experts, then derives their output weights from the original affinities. Its latent-attention cache stores compressed content and a shared rotary key. Both distinctions appear in the [original technical report](https://arxiv.org/html/2412.19437v2#S2.SS1).

Tiny CPU controls changed which experts were selected while preserving the raw-affinity weighting. A full six-token attention pass matched prefill plus incremental decoding within the declared tolerance. The inspected mixture-of-experts code computes all experts and gates their results; it does not gain sparse computation merely by selecting sparse output weights.

That simplification is useful to understand before interpreting performance. The code can teach the routing mechanism while leaving efficient dispatch and distributed execution to a different implementation. No training or throughput comparison was run here. The [published checkpoint, data and logs](https://github.com/Vaibhaav-Tiwari/deepseek-v3-jax/releases/tag/v1.0) give a later reproduction a defined starting point.

### Agweb: separate workspaces with a choice about shared state

[Agweb](https://github.com/paul-nameless/agweb/tree/a52c8b66e16499ec2781c7fea3c4a37983a7002c) is a WebKit-based macOS browser for visible concurrent agent work. Its workspace model aims to reduce interference with the user's active browsing.

Workspace separation and website identity are separate choices in the [implementation](https://github.com/paul-nameless/agweb/blob/a52c8b66e16499ec2781c7fea3c4a37983a7002c/Sources/AgwebApp/Model.swift). An unnamed profile receives a fresh nonpersistent data store. A named profile can be reused across workspaces, sharing website data by design. That suits agents working with the same login; different accounts require the corresponding isolation choice.

[0.2.0](https://github.com/paul-nameless/agweb/releases/tag/v0.2.0) adds default ad/tracker blocking with global and per-workspace controls. The setting matters when testing an application too: blocked requests change what the page does. The browser requires macOS 26 and uses its own command interface, without CDP compatibility. The [launch discussion](https://news.ycombinator.com/item?id=50497924) identifies that as an integration constraint.

The released 0.2.0 app confirmed that distinction on a synthetic local page. A second unnamed workspace could not read the first one's cookie or localStorage marker. Two workspaces on one named fixture profile shared both; a different named profile stayed empty. The test used an isolated data root and no real accounts.

The claimed memory, token and focus benefits were not measured. The next useful evaluation is a representative multi-agent workflow with explicit profile choices; counting windows alone would miss the state that the work shares.

### Takumi revisited: a renderer taking on more layout work

In March, [#1](/oss-radar-01-vercel-winter-2026-cohort) discussed Takumi as an alternative image-rendering pipeline. The [November release](https://github.com/kane50613/takumi/tree/ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d) describes a broader shared layout engine for image, SVG, PDF and paint-tree outputs. That is expanded scope; it does not by itself establish a strategic pivot or equal maturity across outputs.

Recent work makes resource handling more central. The [shared rendering path](https://github.com/kane50613/takumi/blob/ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d/takumi-js/src/render.ts) prepares a scene before rendering, and the recent releases address HTML input, font subsets, `@font-face` resources and fallback. A layout engine used for several outputs has to get those decisions right across callers.

One small fix was reproducible through the published native packages. Registering the exact same font-data object first as Alpha and then as Beta returned Alpha for the second request in 2.19.0. In 2.20.0 it returned Beta. The [JavaScript registry change](https://github.com/kane50613/takumi/commit/4fd9276e43b0130abab25da788625a2b3bd19aa2) explains it: generated cache keys now include face descriptors alongside the buffer's identity.

Copied arrays and two different objects sharing the same underlying bytes already worked in both versions. Those controls helped locate the actual boundary. The generated PNGs also matched in every case, including the old wrong-registration result. Comparing the output images alone would have missed the missing requested family.

The return visit changes the question from whether Takumi can render an image to how reliably the shared engine manages layout and resources for its growing set of outputs. The native registration improvement is demonstrated here. Broader format quality, deployment compatibility and maintenance remain work to evaluate on the intended use case.

## What this selection shows

### Small tools still depend on context

AssemblyForNeovim needs the right compiler arguments and source revision. Takumi's font cache needs the face descriptors as well as the bytes. Agweb's visible workspace needs a deliberate website-state choice. In each, a convenient interface succeeds only if it carries the context the underlying operation requires.

That does not make smaller tools a bad trade. It identifies the useful adoption test: start with a representative case where the context matters, instead of an empty project or a default screenshot.

### Taking control includes taking responsibility for the next step

Yogurt moves model scheduling onto the user's computer. ZigZag exposes the path from artwork to stitches, while the machine and fabric still determine the physical result. AgentRun makes replay policy explicit, while the tool author must correctly identify which actions tolerate repetition.

The common benefit is more control over a workflow. The remaining work differs by project. A local notes application, a stitch planner and an agent runtime should not be judged by the same benchmark.

These patterns describe this selected set. A developer-heavy launch source makes tooling patterns easier to find; it cannot establish that the whole open-source ecosystem is moving in one direction. The educational JAX implementation is also a useful counterexample to an adoption-only view: making a mechanism understandable can be its main contribution.

## The distillation

ZigZag and Yogurt take on substantial workflows, with machine and resource choices that deserve a representative trial. AssemblyForNeovim is a smaller experiment to try in an existing project, provided its output is tied to the build and source revision intended.

AgentRun's explicit uncertain-effect handling is worth studying. Its beta upgrade contract and unfinished learning loop are equally relevant to a deployment decision. Keep measured recovery behavior separate from promises about future task quality or token savings.

Takumi earns its return visit through the shared engine's expanded responsibility and a specific demonstrated release improvement. Following that work across releases tells us more than treating the March feature list as its permanent identity.

For the next evaluation, use an input that can change the decision: a realistic synthetic meeting, an embroidery design with meaningful travel, an interrupted action whose outside result is uncertain, or a render with several font faces. The useful result is knowing which part of the workflow the project now handles and which part the adopter still owns.

---

## Sources

| Source | What it establishes |
| --- | --- |
| [Inventory and participant dossiers](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-15-november-show-hn) | Selection boundaries, source pins, implementation paths, attributed reports and unresolved checks |
| [Fixtures and reproduction](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-15-november-show-hn/repro) | Synthetic inputs, versioned environments and the scope of local results |
| [Show HN](https://news.ycombinator.com/show) | Launch discussions; attention and reports rather than measured adoption |
| [Takumi 2.19.0](https://github.com/kane50613/takumi/releases/tag/takumi%402.19.0), [2.20.0](https://github.com/kane50613/takumi/releases/tag/takumi%402.20.0) | Recent released scope and changes, distinct from later master work |
| [DeepSeek-V3 technical report](https://arxiv.org/html/2412.19437v2) | The primary architecture reference for the educational JAX comparison |

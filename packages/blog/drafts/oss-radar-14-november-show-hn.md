---
title: "OSS Radar #14: Agent Recovery, Better Diffs and Partial Self-Hosting"
seoTitle: "November 2026 Show HN: 12 Projects Beyond the README"
alternativeHeadline: "Twelve November Show HN projects, with local checks of six and a closer look at recovery, review and outside dependencies"
date: "2026-11-11"
description: "Twelve November Show HN projects: six local trials, source and discussion checks, and the dependencies behind agent tools and self-hosted apps."
section: oss-radar
tags: [oss-radar, open-source, agents, developer-tools, self-hosting]
---

# OSS Radar #14: Agent Recovery, Better Diffs and Partial Self-Hosting

A diff tool found the changed file inside a ZIP. An agent hook asked for review of a suspicious `npm test`. A self-hosted media manager still needed its maintainer’s metadata service. November’s Show HN projects become more interesting when you follow the responsibility each one takes on.

This issue covers **twelve projects from November 1–10, 2026**. The review combines code and discussion reading with small local checks of six, performed with an AI research agent. These checks establish specific behavior, rather than comparative speed, security or production reliability. The results and reproduction fixtures are in the [research record](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-14-november-show-hn).

## The source

The [first OSS Radar](/oss-radar-01-vercel-winter-2026-cohort) compared a funding cohort. This time the common source is a ten-day Show HN window: **1,455 indexed submissions**, of which 37 had at least 50 points when retrieved on November 11. All twelve above that threshold whose outbound link went directly to GitHub form this sample.

That rule favors attention and developer tooling. Website-first launches, lower-scoring submissions and missing index entries can contain equally useful work. Newer posts had less time to collect votes. These dates describe Show HN appearances, not when development began. The repositories have open-source code licenses; HyperFlow is an important example of why that says little about accompanying model weights.

Source links pin November 11 revisions. Executed packages have their own recorded versions, and public comments remain reports by their authors. A launch-day objection can be useful without describing the current code.

## Tools around a coding agent

### Modern Web Guidance: useful retrieval, limited scanning

[Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/README.md) gives coding agents searchable web-platform guidance. The practical use is replacing a pile of JavaScript with a browser capability while retaining the compatibility details that make the replacement safe to ship.

The implementation is more deliberate than loading a large prompt. Its [search code](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/search.ts) combines local vector retrieval and keyword ranking. The agent retrieves selected guides, then checks the implementation against them. Project settings describe the supported browser baseline; annotated volatile features require explicit opt-in.

The released 1.0.0 CLI made those distinctions visible. A synthetic file with a manual dialog-backdrop click handler produced a modernization finding. The same handler inside a `closedBy` feature-detection fallback did not. Searching for dialog dismissal returned relevant guidance, while requesting the volatile `language-model` guide without opt-in was refused.

A scan of this blog’s tracked source snapshot found two candidates: a border used as a text underline and a theme-toggle suggestion about synchronizing color-scheme metadata. Neither is an applied fix or a measured improvement. More significantly, the scanner announced its own limits: **35 deterministic rules across 33 guides**, roughly one fifth of the catalog. Passing that scan cannot establish that a project follows the rest of the guidance. [An issue about agents overreading scanner coverage](https://github.com/GoogleChrome/modern-web-guidance-src/issues/3268) makes the distinction especially relevant.

There is also a deployment detail to know before using it on private work. Search is computed locally, but the [default telemetry path](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/cli/telemetry/clearcut-logger.ts) includes search queries and command metadata. `DISABLE_TELEMETRY=1` opts out. The initial checks used synthetic queries and public source with the default setting; network delivery was not measured. The saved reproduction explicitly opts out.

This is a promising way to maintain implementation knowledge where an agent makes a decision. Its value still depends on the generated page: the right guide must become working behavior in the browsers the project supports.

### Stroq: follow the command into the folder

[Stroq](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/README.md) combines inspection of coding-agent sessions with hooks that judge future actions. The distinction matters: an audit explains what happened; prevention depends on the host invoking and honoring the integration.

The [launch discussion](https://news.ycombinator.com/item?id=50380704) raised a good objection to command filters: an ordinary-looking `npm test` can hide dangerous work in a script. The submitter acknowledged the limitation at launch. Current [folder inspection](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/packages/cli/src/folder-check.ts) goes further, so that admission should not become a permanent verdict on the product.

In released 0.32.0, the actual engine and Claude Code adapter produced distinct results in a synthetic environment:

| Judged command | Result |
| --- | --- |
| `printf hello` | Allowed |
| `npm test`, with a benign fixture script | Allowed |
| Fetch a script and pipe it into `sh` | Denied |
| `npm test`, with a fixture script that fetches text and calls `eval` | Asked for folder review |

The commands were judged, not executed. A separate real CLI invocation of the Codex hook received malformed JSON and exited **2**, with empty stdout and a fail-closed explanation on stderr. These checks used temporary stores and a synthetic user home, without reading personal agent histories.

That is useful behavior, but it leaves another layer to test: what the installed host does with those answers. The [security documentation](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/SECURITY.md) records integration and coverage limits. No live agent integration or bypass campaign was run here. The adoption test is the complete path from host event to observed interception, including errors.

### tmux-restore: recover the conversation and its place

[tmux-restore](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/README.md) extends tmux-resurrect and tmux-continuum to reopen agent conversations in their terminal panes. Its [Codex adapter](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/agents/codex.sh) finds an open rollout file, extracts the conversation ID and constructs a resume command.

[One HN commenter](https://news.ycombinator.com/item?id=50403358) reports using it to restore long agent conversations into the right panes. That is a relevant firsthand report, although it is not an independently verified recovery. Comments praising years of tmux-resurrect use describe the foundation, rather than proving adoption of this new layer.

The pinned upstream adapter suite passed **51 synthetic checks** locally. A separate dedicated tmux server confirmed a consequential caveat: its status callback ran zero times during five seconds detached, then once during five seconds with a client attached. Periodic status-driven saving depends on an attached client; the shutdown-save path is separate. This small experiment says nothing about the reliability of a particular save interval.

The [caveats](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/docs/caveats.md) define the promise well. Processes restart and conversations resume; an interrupted tool call is not checkpointed. Agent file formats remain a dependency, and saved scrollback retains what the pane displayed. No real conversation or reboot recovery was tested here. Reopening the right context is still a valuable, bounded job.

### Waymark: recovery must account for uncertain outside effects

[Waymark](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/README.md) moves recovery into the application: Python workflows compile into a representation executed by a Rust runtime, with progress retained in Postgres. Its [compiler](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/python/src/waymark/compiler/validation.py) checks supported language constructs; the VM [snapshot code](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/crates/lib/vm-runtime/src/snapshot.rs) serializes runtime state.

The most useful detail is how the design treats an action whose worker disappears. Did an external request never start, or did it complete before its result could be recorded? Those conditions cannot safely share a retry policy.

The [retry documentation](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/docs/python/retries/page.mdx) distinguishes `ActionExecutionNotStarted` from `ActionExecutionLost`. The latter represents uncertainty and requires explicit retry opt-in, even when a policy retries ordinary exceptions. A timeout also does not cancel the original attempt: opting into retries can create overlapping work. An action that charges, sends or appends needs a way to tolerate repetition.

Operations deserve equal attention. The [production guide](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/docs/guides/production/page.mdx) requires downtime for version upgrades, with applications, bridges and nodes stopped in order. A rolling upgrade is not supported at this revision.

The attempted crash/restart trial did not reach workflow execution. Waymark 0.30.1 installed, but the temporary PostgreSQL bundle lacked `pgcrypto` and migrations stopped. That is a setup limit, not a reproduced recovery defect. The semantics above are documented and code-inspected. They are also the right questions to settle before committing application logic to a durable runtime.

## Review what the tools produce

### OmniDiff: a changed archive member becomes visible

[OmniDiff](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/README.md) compares source structurally and understands several binary formats. It addresses a gap that grows when generated changes include archives, images, fonts or PDFs: a review needs to say more than “binary files differ.”

The [dispatcher](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/src/diff/content.rs) recognizes content from its bytes, useful when Git’s temporary filenames lack extensions. Nested decoding shares an expansion budget rather than giving every worker a fresh allowance.

The checksum-verified v0.4.0 executable passed a small, concrete trial. Two ZIPs contained an unchanged member and a changed `policy.txt`. Ordinary `git diff --no-index` reported a binary difference. OmniDiff’s JSON named the changed member and counted the other unchanged. Its summary counted the removed and added line; that summary did not reveal the new policy value.

In Python code, a function moved below another and its return value changed from 10 to 11. OmniDiff located the changed digit at its before/after positions without marking the unchanged function body as a replacement. An identical-file control returned no changes; invalid archive bytes fell back to a generic binary difference without crashing. These are useful functional results, not an accuracy score over a representative corpus.

The discussions add two adoption details. Three-way merge remains [future work](https://news.ycombinator.com/item?id=50329292). An [idle-CPU report](https://github.com/ivankovic/omnidiff/issues/72) under Kubuntu/Wayland led to a documented redraw fix in 0.4.0, but the original reporter had not confirmed it in the checked thread. Neither “still broken” nor “user-confirmed fixed” follows from closure alone. The code license is **AGPL-3.0-only**.

### STE80 Humanizer: style checks cannot preserve facts

[STE80 Humanizer](https://github.com/Dodaios/ste80-humanizer/blob/99bc468482599f5d75f595e2c1adf893ebff4d8f/README.md) supplies a writing skill and a heuristic checker. Its maintainer [describes the goal](https://news.ycombinator.com/item?id=50429144) as clearer language, without claiming to manufacture an authorial voice or evade AI detectors.

The [checker](https://github.com/Dodaios/ste80-humanizer/blob/99bc468482599f5d75f595e2c1adf893ebff4d8f/scripts/ste_check.py) accepts one text. In a synthetic check, “The service may need two retries. The limit is 40 requests.” passed. So did “The service needs no retries. The limit is 400 requests.” A control full of stock chatbot phrasing produced seven findings.

This demonstrates the interface’s boundary, rather than a broken fidelity feature: a style linter cannot compare a rewrite with a source it never receives. The project has separate rewrite evaluations; those model-backed evaluations were not run here. Use a checker to find habitual phrasing, then compare qualifications, numbers and meaning separately. A clean style report is a poor acceptance criterion for edited prose.

## Draw the hosting and model boundaries

### HolyArrs: fewer local applications, a shared metadata dependency

[HolyArrs](https://github.com/HolyArrs/HolyArrs/blob/ddb423156fcb2e0829f1ab7ea647e81908197b83/README.md) combines discovery, acquisition and library management. The maintainer [explicitly says](https://news.ycombinator.com/item?id=50439032) it does not play media: Plex or Jellyfin still handles playback. That distinction makes its consolidation claim easier to evaluate.

A [Docker user running default-deny egress](https://github.com/HolyArrs/HolyArrs/issues/222) asked what outside connections were needed. The resulting [outside-address documentation](https://github.com/HolyArrs/HolyArrs/blob/ddb423156fcb2e0829f1ab7ea647e81908197b83/docs/run/outside-hosts.md) is unusually useful. The default metadata service supplies searches and new details. The docs say existing library and downloads continue without it; this was not outage-tested here.

Supplying your own TMDB key moves movie/show details, search, people and Explore lists directly to TMDB. Music, TVmaze details, trailer lists, ratings and other data still pass through the configured metadata service, and the installation still registers there. The [constructor](https://github.com/HolyArrs/HolyArrs/blob/ddb423156fcb2e0829f1ab7ea647e81908197b83/app/backend/internal/metadata/hosted_service.go) reflects that split. Overriding the service URL requires a compatible server, not merely a different hostname.

There is a coherent trade here: consolidate local operations while sharing metadata infrastructure. An operator deciding whether to migrate should evaluate the maintenance and availability of both. “Bring a TMDB key” does not make the entire installation independent.

### Kairos: inspectable experiments, externally served inference

[Kairos](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/README.md) lets agents configure and evaluate fraud/risk workflows. The interesting source goes beyond an MCP interface. Its [experiment service](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/apps/server/src/modules/experiments/service.ts) splits rows chronologically into training, validation and test sets, selects candidates using validation metrics, and reports test metrics separately.

That makes the evaluation machinery inspectable; it does not establish fraud-detection effectiveness. The reviewed launch discussion supplied no independently verified outcome on representative customer data.

The [model client](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/packages/core/src/grayson.ts) sends its context and questions to Finic’s `/v1/decide` endpoint by default. Self-hosting application state therefore leaves model inference with another operator. Review the actual request data and evaluation split before treating either local deployment or a reported score as sufficient assurance. No customer data or model API was used in this review.

### HyperFlow H3 Flash: read the weight terms before the speed chart

[HyperFlow H3 Flash](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/README.md) compresses MiniMax-H3 for few-step video and synchronized audio generation. Its [scheduler](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/src/hyperflow_h3_flash/schedule.py) provides four-, six- and eight-step schedules; six is the default. The [pipeline](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/src/hyperflow_h3_flash/pipeline.py) still loads upstream text-encoding and VAE components, so a transformer-file size is not the complete system footprint.

The immediate adoption constraint is licensing. The [repository notices](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/THIRD_PARTY_NOTICES.md) distinguish Apache-licensed core code, separately licensed integrations and model weights. The [weights page](https://huggingface.co/VideoRebirthAI/hyperflow-h3-flash) says use in the EU, UK, South Korea or US requires prior MiniMax authorization under the [MiniMax H3 agreement](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/5d9b308a59ab12e67147f191e184baf704185bd1/LICENSE).

That is consequential enough to resolve before downloading weights or estimating a deployment. No generation, quality comparison or accelerator benchmark was run here; the speed results remain the publisher’s measurements.

## Specialized tools

### Flide: its speed claim has a workload

[Flide](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/README.md) serves decision workloads where several questions share an input. The [packing code](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/flide/runtime/pack.py) represents shared prefixes and separate question branches; an additional session cache can reuse matching prefixes across calls. That cache is [disabled by default](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/flide/runtime/engine.py), so describing the product as just a session cache misses the main mechanism.

The maintainer [bounds the reported 9.5× result](https://news.ycombinator.com/item?id=50423700) to Qwen3.5-0.8B on QuALITY: roughly 5.8k input tokens and 18 questions per state. One-question workloads can approach a tie under other model/input conditions. The number describes an opportunity to share computation, rather than a general replacement speed for language-model serving.

[A laptop-GPU user](https://github.com/OmniJev/Flide/issues/2) followed up after 0.1.12, reporting that supplied kernels reduced their multi-minute cold-start problem to a responding health check after 43 seconds. That specific hardware report is useful without becoming a general startup benchmark. No GPU comparison was run here. Match model, hardware, question count and decision margins in an adoption trial.

### Spindle: one route definition, several outputs

[Spindle](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/README.md) is an OCaml web framework whose typed route/schema representation feeds request validation, OpenAPI and client schemas. The [OpenAPI generator](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/core/openapi.ml) is worth reading because it shows how those outputs stay related instead of being maintained independently.

The [launch discussion](https://news.ycombinator.com/item?id=50377613) also illustrates why reading current code matters. A reviewer suggested constraining static-file access through Eio directory capabilities. The pinned [file implementation](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/core/files.ml) uses `Eio.Path.with_subtree` across its lookup and serving paths. The historical suggestion is not evidence that the current version omits that protection.

No OCaml conformance suite or deployed application was tested here. For an OCaml service, the useful evaluation is whether the shared representation covers the required request shapes and generated clients, followed by actual protocol and deployment checks.

### Coldframe: a convincing interaction is not yet a convincing field result

[Coldframe](https://github.com/hedgerow-dev/coldframe/blob/e6b126af0ab08c24b48de77abfe063e98ff1b12f/README.md) simulates supermarket refrigeration controllers. Its [Python server](https://github.com/hedgerow-dev/coldframe/blob/e6b126af0ab08c24b48de77abfe063e98ff1b12f/honeypot.py) offers vendor personas, fake login/control paths and structured events. The optional Modbus service is separate.

On loopback, the real handler rejected a wrong login, accepted the default fake login, changed fake node 2 into defrost mode and recorded the control event. This establishes more than a listening port: an interaction changes a coherent fake state. No real controller or internet-facing decoy was involved.

The [launch account](https://news.ycombinator.com/item?id=50406292) was more limited than the premise might suggest: the maintainer reported two instances online for one day, seeing generic scanners and Shodan. It did not report targeted sabotage captured by this tool. Commenters raised reasonable questions about fingerprints and whether a cloud-hosted decoy attracts the relevant operators.

The project has a precise observation target. Its next meaningful evidence is what continues past discovery and login in the field. Local simulation correctness and field attraction answer different questions.

## What this sample suggests

Six of the twelve explicitly address coding-agent behavior or agent workflows. They add maintained knowledge, permission decisions, conversation recovery, durable execution, writing constraints and operational decisions. That establishes a group of products in this sample, rather than a market-wide shift or demonstrated demand.

The stronger distinction is how far each tool carries its responsibility. Modern Web Guidance retrieves a relevant guide and refuses a volatile one without opt-in; the resulting page still needs browser checks. Stroq judges the package-script case; the installed host still needs to honor the hook. OmniDiff reveals a changed archive member; a reviewer still needs to inspect its meaning. Waymark preserves workflow state while explicitly exposing uncertainty around outside effects.

Self-hosting has the same need for precision. HolyArrs can reduce local operational work while retaining shared metadata. Kairos can keep application state local while sending inference elsewhere. HyperFlow’s public code cannot grant rights its weight agreement withholds.

For a first experiment, OmniDiff’s artifact review and Modern Web Guidance’s task-specific retrieval offer small, inspectable trials. Recovery and prevention deserve trials that include the failure path: a detached client, an unrecorded outside effect, a malformed hook input. Those conditions are where a useful tool’s actual promise becomes clear.

---

## Sources and terms

| Source or term | What it establishes |
| --- | --- |
| [Inventory, pinned source and discussion ledger](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-14-november-show-hn) | All 1,455 indexed submissions, the twelve-project selection, revisions, reports and claim boundaries. Checked November 11, 2026. |
| [Local trials and reproduction fixtures](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-14-november-show-hn/04-local-trials.md) | Six small product checks, exact versions, synthetic inputs and results; the Waymark setup attempt did not establish recovery behavior. |
| [HN API](https://github.com/HackerNews/API) and [Algolia HN search API](https://hn.algolia.com/api) | The discussion service and indexed search interface used for this scan. Index availability limits the inventory. |
| Durable execution | Retaining workflow progress beyond a process failure; external effects still need explicit repetition and uncertainty policies. |
| Agent hook | A host invokes an integration around an event. Its payload, timing and response handling determine what the integration can observe or stop. |

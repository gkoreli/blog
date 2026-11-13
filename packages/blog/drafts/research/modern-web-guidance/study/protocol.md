# Modern Web Guidance: 54-run owned-interface study

Preregistered November 13, 2026, America/Los_Angeles, before any measured worker starts. This is an implementation experiment. It does not authorize an article or production changes.

## Question and design

Does Modern Web Guidance improve the checked behavior delivered for six small interfaces drawn from this publication's work? Separate ordinary skill availability from directly supplied advice.

Six tasks × three conditions × three fresh sessions = **54 attempts**. Each condition receives 18 attempts. The tasks are purposefully selected owned examples, not a random sample of web development. Repetitions are fresh sessions without a controllable sampling seed; they are not different human users or model training seeds.

| Task | Owned stake | Deliberate boundary |
| --- | --- | --- |
| T01 | Confirmation before removing a saved report view | Cancellation, focus, background interaction and a light-dismiss fallback |
| T02 | Expandable report evidence and request-inspector details | Already-correct native behavior; unnecessary animation/exclusivity is unwanted |
| T03 | Publication burger/navigation control | Ordinary navigation semantics, mobile/desktop behavior and no-JS access |
| T04 | Newsletter/checker form feedback | Inline invalid state, correction and the native submit path |
| T05 | Browser-queued versus acknowledged event transport | Lifecycle deduplication, failed transport retention, keepalive fallback |
| T06 | Article scroll reveals and media preference signals | No-JS visibility, missing API, live reduced-motion preference and cleanup |

[Task definitions](tasks.json) identify production source lineage. The fixtures adapt these responsibilities to dependency-free HTML/CSS/JS; they are not unmodified production components or a full Nisli application. T01 is a new owned report-management task. T05's lifecycle queue is new; its transport distinction comes from the existing observability package. No real report is deleted, subscription sent, or reader event transmitted.

## Conditions

1. **baseline:** common project agreements and task, without MWG installed or a supplied guide.
2. **skill:** the same project and task, with MWG 1.0.0's unmodified skill advertised through normal project-local discovery. The task never tells this agent to invoke it or names a guide. Search/retrieve remain agent choices under the upstream skill's instructions.
3. **supplied:** the same task with the predetermined relevant guide text appended as an implementation reference, without the installed skill. It bypasses skill activation and guide discovery. This arm adds context and is not token-budget-matched to baseline.

All project policies are Baseline 2024 with detected fallbacks for newer features. Supplied guides are the complete output from the pinned CLI under that policy, including output recovered from its documented temporary-file response for large guides. They are selected before generation; selection was not tuned against any measured output.

An offline npx/pnpx shim resolves the upstream skill's `@latest` commands to the exact same 1.0.0 package for every skill trial and records actual invocations. This deliberately fixes package freshness and installation/network overhead. It preserves the skill file's bytes but is an adaptation from a live installation. Direct supplied text has no search latency. `DISABLE_TELEMETRY=1` is set in all conditions. No packet-level egress audit is claimed.

Upstream guide text and notices in `supplied-guides/` retain the package's Apache-2.0 license and third-party notices; they are experimental stimuli, not Goga's raw writing prompts.

## Frozen execution

- Agent: installed **codex-cli 0.169.0**; model **gpt-6.1-sol**, reasoning **medium**, with the same CLI options in all conditions. This uses the configured model at a deliberately fixed effort, not the user's usual xhigh effort. No model or effort escalation is allowed within this study.
- Runtime: **Node 24.14.1**, macOS arm64 on Apple M5. Resolve the real Node executable before leaving the blog directory so temporary workspaces do not fall back to the machine's older default Node.
- Each worker gets its own Git worktree from a frozen task base, fresh ephemeral session and isolated Codex home reusing the existing login. Global user config, MCP integrations and web search are not loaded. Built-in/global skills still advertised by the CLI are shared across conditions; the discovery preflight observed imagegen, openai-docs, skill-creator, skill-installer and rex alongside the local MWG skill.
- Same command/file tools and generic smoke-check file in all arms. The command sandbox can block browser startup; workers are told to report that and use available checks. The independent behavior grader runs outside that sandbox. This does not compare guidance under a full browser-enabled agent workflow.
- Cap: **300 seconds per attempt**, at most **three workers at once**, no external model or research tools, no packages or source outside the fixture. No hidden test source or other trial's code is supplied to a worker. The grader's location and condition mapping are not supplied.
- A seeded shuffle (`20261113`) fixes the scheduled order. Actual start/end timestamps are recorded; concurrency and machine load can affect timing. These runs cannot reproduce identical model outputs from a seed.
- No retries or continuation turns for a measured attempt. Completion failures, cap hits and partial outputs remain in the denominator. An incomplete earlier attempt must be inspected before supervisor recovery; it cannot silently be regenerated.

Two infrastructure preflights—one tiny file-write task and one read-only project-skill discovery request—are outside the 54. They establish CLI execution and discovery, not interface performance. Reference, broken and starter calibration runs contain no tested agent generation and are also outside the 54.

## Grading and outcomes

Freeze [grade.mjs](grade.mjs) and calibrate it before generation. It opens opaque artifact directories without receiving condition labels. The grader uses **Playwright 1.64.0**, headless **Chromium 156.0.8078.4** and **WebKit 27.2**. These are current test engines, not historical Baseline 2024 browsers. Firefox and manual assistive-technology tests are outside this study.

Checks assert requested DOM/runtime behavior, not a preferred API, line count, particular class names or conformity to a guide's example. Stable integration IDs are part of each task's interface. Generic smoke checks visible to the worker contain no hidden assertions. Each behavior check has a fresh browser context. A runtime page error fails that scenario.

Compatibility controls remove IntersectionObserver or sendBeacon, and emulate lack of dialog light-dismiss by removing its IDL property and preventing/removing the `closedby` attribute. These are controlled API-absence simulations, not proof of behavior in an actual older browser. Synthetic visibility/page-transition events test queue handling; they do not establish real unload delivery or real back/forward-cache eligibility. Playwright's default browser launch settings are retained. Automated field/focus checks cover selected mechanics, not full accessibility compliance.

Primary outcome: **fraction of the 18 scheduled attempts per condition that complete within the cap and pass every frozen behavior check in both engines**. Call this checked-task success. A failed or timed-out attempt counts as unsuccessful even if its partial artifact passes some checks. A grading infrastructure failure stays visible and cannot count as success; diagnose/regrade the same preserved artifact without regenerating it if necessary.

Secondary outcomes: per-task success out of three; mean per-run check fraction; failed-check categories; actual skill-file reads/search/retrieve calls; completion/cap failures; worker wall time; newly processed input tokens (`input − cached input`) and output tokens as exposed by the CLI; patch size and changes outside the requested runtime files. Token counts are not dollar charges. Retrieval observations come from calls and event commands, not self-reported claims of skill use.

Report raw counts and paired condition differences. A 10,000-resample bootstrap over the **six task clusters** provides a descriptive interval, keeping each task's repeated outcomes together. No population-significance claim, representative industry uplift, ranking of models or causal effect of a single guide rule follows from six selected tasks. Do not treat hundreds of checks as hundreds of independent tasks. Examine ceiling effects, especially the preservation control.

The parent performs final artifact inspection. Deterministic browser grading is condition-blind in its inputs; no independent human-blinded or assistive-technology audit is claimed. Extra context, instruction strength, task selection and limited tool access are alternative explanations to retain beside the measured comparison.

## Calibration, freeze and amendments

[Initial calibration](calibration-initial.json) preserved two pre-study problems: the dialog focus assertion rejected valid native focus movement toward browser controls, and the hand-written reveal reference put its no-JS visibility override only in JavaScript. Before any measured worker, the assertion was narrowed to background page controls, the reference CSS was corrected, and reveal readability was made to check actual visibility as well as computed style. A targeted legacy-light-dismiss simulation was then added and calibrated. T02's working starter is required to pass all its checks.

[Final calibration](calibration.json) must accept every positive reference, reject every broken implementation at task level, and preserve T02's starter. Broken controls need not fail every check: some independent structural checks can still pass. Calibration changes are engineering work before the input freeze, not model-result-driven grader changes.

`frozen-inputs.json` hashes the task texts, starter files, supplied guides, grading code, controls, protocol, plan and runner. Record and commit these inputs before the first measured session. Any post-start change affecting an outcome requires a dated amendment, the reason and its effect; preserve original results and regrade all affected artifacts under both versions. Do not silently change the task, a model option or an assertion after seeing condition results.

Raw event streams, CLI reports, prompts assembled from the synthetic tasks, authentication links, worker homes, PIDs and operational state stay outside the public Git repository. Public artifacts contain only generated runtime code, diffs, normalized per-run measurements, calibration and interpretation. Goga's complete source messages remain only in the approved private writing archive.

## Completion gate

Require exactly 54 unique scheduled attempts, three per task and condition, accepted calibration, matching frozen hashes, all preserved code hashes, measured failure accounting and the condition comparison before considering an article. A null or negative result is a valid study result. Do not implement trial patches into the production blog automatically.

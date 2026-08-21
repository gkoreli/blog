# Herdr source audit — research foundation

> Working research, not article prose. Checked 2026-08-20 (America/Los_Angeles). This lane was cut short when the canonical repository clone could not complete: sandbox DNS failed, then the approval request was interrupted. No local checkout was available. Claims below therefore use **Reported** or **Proposed** unless the evidence itself is code. Nothing in this artifact should be promoted to **Code-inspected** until the baseline audit checklist is completed.

> **Acceptance-pass correction:** the parent audit later resolved the canonical repository as `herdrdev/herdr`, default branch `master`, and froze baseline `624dfd4796559042ec13ccf4d4b54374902ab81d` through the GitHub connector. It also verified `v0.8.2` at release commit `9eb521456ac0d19d3ab3d9d7cea3cca10baa8a4c` and inspected selected protocol, pane, persistence, native-resume, manifest, and license files. [`00-editorial-synthesis.md`](./00-editorial-synthesis.md) supersedes the unresolved identity, release, and code-state rows below; they remain here to preserve the fanout lane's original evidence boundary.

## Audit ledger

| Field | State on 2026-08-20 | Confidence / next check |
|---|---|---|
| Project | Herdr, a terminal-native multiplexer for coding agents | High; first-party site and repository README agree |
| Canonical upstream | The first-party README exposed by GitHub search says `git clone https://github.com/ogulcancelik/herdr` and the public docs/FAQ point there. Search also surfaced apparent mirrors or stale/fork identities at `motionharvest/herdr`, `thatbeautifuldream/herdrm`, and `dontreadthisline/herdr`. | **Unresolved redirect/history.** Resolve with GitHub `GET /repos/ogulcancelik/herdr`, inspect `html_url`, owner, `parent`, `source`, transfers, and default branch. Do not cite a mirror as canonical. |
| Default branch | Not verified | Must query canonical upstream before drafting |
| Baseline commit SHA | **Not obtained** | Blocking requirement for publication. Freeze one canonical default-branch SHA and pin every code/doc URL to it. |
| Release in scope | User lead: `v0.8.2`, allegedly released 2026-08-19 | **Unverified.** The indexed README material included an older `v0.4.0` demo reference, which is not proof of latest release. Check Releases, tag, `CHANGELOG.md`, and package registries. |
| License | Apache License 2.0 | Reported by first-party GitHub README; verify `LICENSE` at baseline before publication |
| Open issues / PRs | Not inspected | Must record live state for every cited ticket immediately before publication |
| Reproduction | None | No binary behavior was run in this lane |

### Evidence vocabulary

- **Code-inspected:** implementation or configuration read at the frozen baseline and traced to a call site.
- **Reproduced:** behavior run and result recorded.
- **Reported:** first-party docs, README, release copy, or a named field report says it works; this audit did not rerun it.
- **Proposed:** open PR, design note, roadmap, or release lead that has not been shown as shipped.

At this cutoff, there are no Code-inspected or Reproduced claims.

## Provisional verdict to test

Herdr appears to take the durable server/client core of a terminal multiplexer and make coding-agent state and automation first-class. Its strongest differentiator is not tiling panes; it is the combination of real PTYs, detach/reattach, agent-state classification, native session references, and a local socket API that agents can drive. The claim is falsifiable: if source inspection shows the sidebar state is mostly fragile screen scraping, restore only relaunches commands rather than recovering native agent sessions, or socket automation bypasses the same validation used by the UI, the product is closer to a themed terminal multiplexer than an agent runtime.

## Product map

| Role | Product or layer | Evidence | Current state |
|---|---|---|---|
| Replaces | The operator habit of keeping many terminal windows/tabs open and polling each agent manually | First-party README and Agents docs describe workspaces, tabs, panes, rolled-up `blocked` / `working` / `done` / `idle` status | Reported |
| Replaces | Part of tmux's interactive session-management surface for agent-heavy work | README describes a tmux-style prefix, splitting, copy mode, detach/reattach, named sessions, and remote attach | Reported; it does not prove general tmux parity |
| Wraps | Coding-agent CLIs and arbitrary terminal programs | Docs say panes are real terminal processes; unsupported agents still run without rich state | Reported |
| Extends | Terminal multiplexing with agent detection, direct integrations, automation, notifications, and native session identity | README, Agents, Integrations, Agent automation, and CLI docs | Reported |
| Relies on | OS PTYs/processes, a terminal emulator, Unix socket/local IPC, SSH for remote use, and each agent CLI's own session/resume contract | First-party concepts and integration copy | Reported; exact crates and system calls need code inspection |
| May enter | A terminal-native agent runtime controlled by humans and agents through the same session model | Maintainer copy says “path to a real agent runtime”; socket API already lets agents create/read/wait/send | Stated direction plus enabled path; product boundary still unproved |
| Does not yet replace, based on available evidence | Agent harness policy, model/provider execution, code review, merge coordination, or repository isolation | No inspected evidence for these layers; Herdr runs terminal processes and exposes their state | Author inference |

## End-to-end system trace to verify in code

The trace below separates first-party claims from the missing implementation proof.

### 1. Client → server → PTY → renderer

1. A user runs `herdr`; first-party concepts say the client starts or attaches to one background server in a session namespace. **Reported.**
2. The client sends input and layout/session actions to that server. The server owns workspace → tab → pane state. **Reported.**
3. Each pane hosts a real terminal process, implying a PTY pair with server-side process ownership. Detaching closes only the client, so the server and child processes remain alive. **Reported; implementation uninspected.**
4. The server streams terminal output/state back to the client, which renders panes, sidebar rollups, tabs, copy mode, and mouse interactions in the user's existing terminal. **Reported; renderer/data-flow uninspected.**
5. Direct attach (`herdr terminal attach <terminal_id>` or `herdr agent attach <target>`) connects the current terminal to one server-owned terminal; `--takeover` exists for agent attach. **Reported.**

Code questions:

- Which crate/library implements PTYs and terminal emulation? Are processes placed in process groups and how do resize, signals, exit, and orphan cleanup work?
- Does one event loop own all clients and panes? Where are backpressure and slow-client limits?
- What is authoritative: the terminal emulator grid, raw byte stream, or persisted screen history?
- How does copy text differ from raw/recent/detection output? CLI docs say `agent read` can select `visible`, `recent`, `recent-unwrapped`, or `detection`; trace each source.
- How does multi-client input ownership work, especially `--takeover` and concurrent attaches?

### 2. Persistence, restart restore, and live handoff

First-party docs distinguish three paths:

- **Client detach:** server and live pane processes remain; reattach reconnects. **Reported.**
- **Full server restart:** session state recreates panes; official integrations can resume supported agents from their native agent sessions. Recent screen history is opt-in. **Reported.**
- **`herdr update --handoff`:** experimental path that tries to move live panes, including foreground processes such as dev servers, to the new server. **Reported as experimental.**

This distinction matters. Pane layout restoration, command relaunch, native agent resume, and live PTY/process transfer are four different guarantees. The article must not collapse them into “sessions survive restarts.”

Code questions:

- Find the persisted schema, default storage path, versioning/migrations, write cadence, atomic-write strategy, permissions, and corruption recovery.
- Trace server startup from state read → workspace/tab/pane reconstruction → integration session lookup → agent-specific resume command.
- Confirm the default for recent screen history and `resume_agents_on_restore`; docs explicitly say `[session] resume_agents_on_restore = false` disables native agent restore, implying enabled by default, but configuration must prove it.
- For handoff, trace old-server coordination, descriptor/PTY transfer mechanism, process ownership, authentication, timeout, rollback, and Windows behavior. Record what “tries” means and every failure fallback.
- Verify the update boundary: docs warn a running server stays on the old binary until stop or handoff; stopping kills panes.

### 3. Agent detection and native integrations

The Agents docs describe two authority paths:

1. **Screen manifests:** process-name matching identifies an agent; terminal-output rules classify state. This is the fallback for many agents. **Reported.**
2. **Lifecycle hooks/plugins:** supported integrations report semantic state and/or native session identity. **Reported.**

The indexed first-party support table currently says that Pi, OMP, Kimi Code CLI, OpenCode, Kilo Code CLI, and MastraCode can use lifecycle hooks/plugins as state authority. Several others—including Claude Code and Codex in the indexed table—use screen manifests for state while integrations supply session identity. This is easy to misstate: an “official integration” does not always author state.

Native restore reportedly uses versioned integration contracts: Pi `2`, OMP `3`, Claude `6`, Codex `5`, Copilot `2`, Devin `2`, Droid `2`, Kimi `3`, Qoder `2`, Cursor `1`, Grok `1`, OpenCode `5`, Kilo `1`, Hermes `2`, MastraCode `1`, Antigravity `1`. These numbers came from first-party Integrations docs and are time-sensitive. Pin and recheck.

Code questions:

- Locate manifest schemas, bundled manifests, local overrides, version checks, reload path, integration installers, and agent-specific hook payloads.
- Trace process discovery and ancestry; prevent a helper process or stale screen text from being treated as a live agent.
- Trace status precedence when hook state conflicts with screen detection. Confirm debouncing/timeouts and transitions among `working`, `blocked`, `done`, `idle`, and `unknown`.
- Inspect false-positive/false-negative tests for prompts, approvals, spinners, alternate screen buffers, ANSI control sequences, wrapped text, localization, and agent version changes.
- Trace session-reference capture, storage, validation, and resume command construction. Check quoting and untrusted repository/path data.
- Confirm whether semantic reports are authenticated to the pane/session that claims them.

### 4. CLI and local socket automation

The CLI reference and Agent automation docs report that agents/scripts can create workspaces, split panes, start helpers, read output, send keys/prompts, focus panes, and wait for state. `agent prompt --wait --until STATUS --timeout MS` and `agent wait` expose state as a synchronization primitive. A process retains its launch-time environment; the old `HERDR_PANE_ID` remains an alias after changes so `--current` stays safe. **Reported.**

The most important implementation question is whether UI, CLI, and socket clients converge on one validated command path. The CLI docs say Herdr validates every key before writing bytes. Source must show where target resolution, permissions, input validation, state waits, and cancellation live.

Code questions:

- Freeze and document socket path, framing/serialization, request IDs, errors, protocol versioning, subscription/event model, size limits, and compatibility policy.
- Inspect filesystem permissions and peer identity checks. A local socket that can type into agent shells is an execution boundary.
- Trace `agent prompt`: target resolution → key/text encoding → PTY write → state subscription → terminal condition/timeout. Verify wait avoids race conditions between send and subscribe.
- Trace output reads and limits. Confirm ANSI stripping/unwrapping cannot cause unbounded memory or misleading detector input.
- Verify `HERDR_PANE_ID` alias lifecycle and collisions across restore/handoff.
- Check whether plugins use the same socket surface and what trust/install boundary exists.

### 5. Remote and thin-client use

First-party docs report two remote shapes:

- Run Herdr on a remote host through normal SSH, detach, then reattach there.
- `herdr --remote workbox` / `ssh://user@host:port` attaches without first opening a shell; Herdr adds fallback SSH keepalives unless `[remote].manage_ssh_config = false`.

This supports a **thin-client-like workflow** in the ordinary sense that local terminal clients can attach to server-owned sessions on another machine. It does **not yet prove** one Herdr server federates sessions across many machines, discovers a fleet, or gives one unified multi-host control plane. Phrase the lead narrowly until code/docs prove more.

## Claim table

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| Herdr is a client/server terminal multiplexer whose panes survive client detach. | README/concepts say detach closes only the client while server and pane processes remain. | Not inspected | Reported | No | Baseline durability claim |
| Panes are real terminal processes rather than translated agent views. | README says “real terminal views” and “real terminal processes.” | Not inspected | Reported | No | Keeps arbitrary CLIs usable and sets Herdr apart from agent dashboards |
| Agent state rolls up through panes, tabs, and workspaces. | Agents docs say Herdr tracks panes and rolls status up. | Not inspected | Reported | No | Core attention-management value |
| Detection combines process identity and output heuristics. | README/Agents docs describe process-name matching and screen manifests. | Not inspected | Reported | No | Likely source of both broad compatibility and false-state risk |
| Native integrations do not all have the same authority. | Agents docs distinguish state authority from integration role. | Not inspected | Reported | No | Prevents overstating integration depth |
| Supported integrations can restore native agent sessions after server restart. | Integrations docs list agent contracts and a disable flag. | Not inspected | Reported | No | Stronger than simply reopening a shell command |
| Live handoff can preserve foreground processes across binary update. | README/session docs call `update --handoff` experimental and say it tries to move live panes. | Not inspected | Reported, experimental | No | Potentially unusual capability; needs strong failure-path proof |
| Agents can orchestrate Herdr through local socket/CLI commands. | README, Agent automation, CLI docs list create/split/read/send/wait actions. | Not inspected | Reported | No | Turns the multiplexer into agent-addressable infrastructure |
| Key input is validated before PTY writes. | CLI docs say every key is validated. | Not inspected | Reported | No | Basic safety boundary for automation |
| Reading an agent does not mark it seen; focus does. | CLI docs state focus/targeting marks seen while read does not. | Not inspected | Reported | No | Allows monitoring without corrupting human attention state |
| Remote attach works through SSH with optional managed fallback keepalives. | Remote docs/README describe flags and config. | Not inspected | Reported | No | Enables phone/remote terminal access without claiming federation |
| One binary, no Electron, no account, no telemetry. | First-party landing/release page says this. | Build/dependency/network paths not inspected | Reported | No | Deployment and privacy positioning; must verify telemetry and update checks in code |
| Herdr is becoming an “agent runtime.” | Sponsor/README copy names that direction. | Shipped socket + state + restore would support it if verified | Reported direction | Yes: runtime is a product-boundary interpretation | Candidate article thesis |

## Product theory map

| Theory | Whose view | Evidence for | Evidence against / missing proof | Direction state | What would disprove it |
|---|---|---|---|---|---|
| Herdr is an agent runtime built by extending the terminal multiplexer, not a terminal UI with badges. | Maintainer | Durable server, PTYs, agent state, session identity/restore, socket actions and waits all share one model in first-party docs. Maintainer explicitly describes a path to a real agent runtime. | No baseline code trace; screen classification may remain heuristic; no inspected policy, task graph, repository isolation, or result model. | **Stated** direction; parts are reportedly shipped | Source shows integrations are superficial wrappers, socket commands are separate/unreliable, or restore lacks stable native session semantics |
| Herdr's real product is an operator console; “runtime” is positioning ahead of the code. | Skeptic/operator | Core value is seeing and jumping to terminal panes; arbitrary processes and unsupported agents still work; terminal/SSH/tmux patterns dominate. | Agent-addressable socket, semantic lifecycle hooks, and native resume go beyond a visual console if implemented robustly. | **Enabled** rival reading | Reproduced workflows show agents reliably spawn, coordinate, wait, recover, and hand off without human pane management |
| The terminal is a useful compatibility layer but creates a fragile semantic ceiling. | Ecosystem | Real PTYs preserve every CLI; screen manifests broaden support quickly. | Native hooks can supply state and session identity, and the design can favor structured signals when present. | Author inference | Tests and field data show structured integrations cover dominant agents and screen fallback remains accurate across releases |

### Future paths worth retaining

1. **Near path — shared control plane for human and agent operators.** Reported socket commands + status events → agents can create/read/wait while humans use the same live panes → missing proof is stable protocol/versioning, authorization, race-free waits, and reliable state authority → possible product is a terminal-native coordination runtime. **Direction: stated by maintainer in broad form; exact product is author inference.**
2. **Far path — multi-machine agent operations.** Reported server ownership + SSH remote attach + named sessions → an operator can reconnect to durable remote work → missing component is host discovery, federated identity/routing, security policy, and a cross-host state model → possible product is a fleet console. **Direction: speculative.** Current thin-client docs do not establish federation.

## User/Grok leads: verify or reject

These are leads only. None should appear as fact without the listed primary proof.

| Lead | Status at cutoff | Primary-source test | Editorial handling |
|---|---|---|---|
| “YC F26, announced Aug 6” | **Unverified** | YC company page/batch directory plus Herdr founder/company announcement with dates | Do not publish. Also clarify whether F26 means a future/fall batch and whether Aug 6 is announcement, launch, or admission date. |
| “~25k GitHub stars” | **Unverified, time-sensitive** | Canonical GitHub repository star count captured on check date | Use exact count and date only after canonical transfer/redirect is resolved. |
| “Hundreds of thousands of downloads” | **Unverified and definition unclear** | First-party analytics methodology or registry/release download APIs; deduplicate upgrades, install-script hits, package managers, mirrors, and assets | Omit unless measurement can be explained. Download counts across channels cannot be added blindly. |
| “v0.8.2 released Aug 19” | **Unverified** | Canonical GitHub release/tag, changelog, signed asset metadata and package-manager versions | Likely release in scope if confirmed; freeze tag SHA separately from baseline if needed. |
| “v0.8.2 added Windows GA, tab bars, window-title improvements, and Qwen support” | **Unverified** | `CHANGELOG.md` + release notes + code/tests for each item | Split into four claims. “Windows GA” needs platform support statement and installer/test matrix, not just binaries. Qwen needs exact product/integration/state/restore scope. |
| “Hundreds of plugins” | **Unverified; likely category/count ambiguity** | First-party marketplace API/index and discovery rules, with date and count of compatible, unique, installable plugins | Do not equate GitHub topic search results with reviewed plugins. First-party copy reportedly says marketplace listings may be auto-discovered; audit trust model. |
| “Omarchy integration” | **Unverified** | Canonical Herdr docs/release/code and canonical Omarchy config/package source | Say whether it is installer packaging, default keybinding/theme, desktop launch integration, or agent integration. |
| “Thin-client multi-machine use” | **Partly supported only as SSH remote attach** | Remote docs and code for `--remote`; look for federation/host registry before broader claim | Safe claim: attach a local terminal to Herdr on a remote host through SSH. Unsafe claim: one server or UI manages a multi-host fleet. |

The indexed first-party pages and repository snippets changed materially across crawler snapshots: agent lists and integration roles differ, and an older README snapshot references `v0.4.0`. Treat all counts and support matrices as stale until pinned to the release/tag used in the article.

## Audit limits and evidence gaps

### Publication blockers

- Resolve canonical repository identity, transfer/fork history, default branch, baseline SHA, and release tag SHA.
- Inspect and pin source for client/server IPC, PTY ownership, terminal rendering, persistence, agent detection, integrations, socket API, remote attach, and handoff.
- Inspect tests for status transitions, restore, handoff failure, protocol compatibility, socket permissions, concurrent clients, terminal parsing, and Windows.
- Read config defaults rather than infer them from docs.
- Run a clean reproduction: create pane, launch at least Codex and Claude, detect every state, detach/reattach, restart restore, socket prompt/wait, remote attach, and experimental handoff with a foreground process.
- Record latest release, license file, dependency lock, build features, issue/PR state, and security/privacy paths.

### High-risk negative claims to avoid until tested

- “No telemetry”: inspect all HTTP clients, update checks, crash reporting, website stats, environment flags, and dependencies.
- “No dependencies”: likely means one distributed binary/no runtime dependency, not a source tree without crates.
- “Sessions survive restarts”: qualify which layer—layout, process, screen, command, or agent conversation—survives.
- “Native agent state”: some integrations reportedly supply session only; state may still come from screen manifests.
- “Cross-platform”: separate Linux, macOS, Windows preview/GA, remote client, and server support.
- “Plugin ecosystem”: count and security review are separate claims.
- “Multi-machine”: remote SSH attach is not federation.

### Suggested source-code traversal once checkout exists

1. `AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `CHANGELOG.md`, `LICENSE`, `Cargo.toml`, `Cargo.lock`, build/release workflows.
2. CLI entry and command dispatch; locate client/server/session namespaces.
3. IPC/socket schema and handlers; map every CLI action to a server call.
4. PTY/process ownership and terminal parser/render model.
5. persistence schema, defaults, write/read/restore, migrations.
6. agent manifest detector, semantic reports, precedence, rollups.
7. integration installers/assets and native session capture/resume.
8. update and handoff, including process/descriptor transfer and rollback.
9. SSH/remote and Windows-specific modules/feature gates.
10. tests alongside each path, then issues/PRs that expose failures or direction.

## Primary source list

These URLs are intentionally **not yet accepted as publication citations** because code/doc links are not pinned to a verified baseline. Each entry states the narrow result it can support after identity and version checks.

1. [Canonical repository candidate: `ogulcancelik/herdr`](https://github.com/ogulcancelik/herdr) — expected source of repository identity, default branch, commit, tags, license, issues, and PRs. Verify redirects/transfer first.
2. [Herdr README at canonical candidate](https://github.com/ogulcancelik/herdr/blob/main/README.md) — reports the product surface: client/server sessions, real panes, detach, agent status, integrations, socket automation, remote attach, and handoff. Replace `main` with baseline SHA.
3. [Herdr changelog at canonical candidate](https://github.com/ogulcancelik/herdr/blob/main/CHANGELOG.md) — expected primary history for release contents. Replace `main` with release or baseline SHA.
4. [Herdr license at canonical candidate](https://github.com/ogulcancelik/herdr/blob/main/LICENSE) — expected Apache-2.0 text. Replace `main` with baseline SHA.
5. [Agents](https://herdr.dev/docs/agents/) — distinguishes screen-manifest state authority from lifecycle hooks and session-only integration roles; time-sensitive support table.
6. [Integrations](https://herdr.dev/docs/integrations/) — reports native session restore and minimum integration contract versions.
7. [Agent automation](https://herdr.dev/docs/agent-automation/) — reports pane/agent action semantics and `HERDR_PANE_ID` alias behavior.
8. [CLI reference](https://herdr.dev/docs/cli-reference/) — reports exact commands, targets, read sources, wait behavior, seen-state behavior, and key validation.
9. [First-party release/landing page](https://herdr.dev/releases/) — supports launch positioning such as terminal-native, binary/no Electron, account, telemetry, and remote use only as first-party product claims.
10. [Repository releases candidate](https://github.com/ogulcancelik/herdr/releases) — required proof for latest version/date/assets. Capture the exact release URL and tag SHA.
11. [Repository issues candidate](https://github.com/ogulcancelik/herdr/issues) and [pull requests](https://github.com/ogulcancelik/herdr/pulls) — use only for attributed live reports/proposals, with state and check date.

## Recommended article spine after the source audit

- Verdict: Herdr's differentiator is the shared terminal/session model used by people and agents; reliability of state and recovery is the limit to test.
- Shipped system: one end-to-end trace from `agent prompt --wait` through socket validation, pane PTY, screen/hook state, and returned terminal state.
- Product theory: runtime thesis versus operator-console rival.
- Competition: compare only the owned job. tmux tests durable multiplexing; Ghostty's founder's new multiplexer tests terminal-native interaction/architecture; agent dashboards test structured coordination. A separate lane should supply pinned competitor code facts.
- Decision test: run the same two-agent repository task before and after detach/server restart; pass only if panes, native conversations, state labels, socket waits, and foreground process outcomes recover as documented.

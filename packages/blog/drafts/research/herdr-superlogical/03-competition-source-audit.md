# Herdr / Superlogical competition source audit

> **Acceptance-pass correction:** [`00-editorial-synthesis.md`](./00-editorial-synthesis.md) later resolved Herdr's canonical repository as `herdrdev/herdr`, branch `master`, baseline `624dfd4796559042ec13ccf4d4b54374902ab81d`, and release `v0.8.2` at `9eb521456ac0d19d3ab3d9d7cea3cca10baa8a4c`. That synthesis supersedes the stale Herdr row in this lane's baseline ledger. The tmux, Zellij, cmux, and Boo publication gates remain open.

**Research lane:** terminal and agent multiplexers
**Checked:** 2026-08-20
**Article mode:** project deep dive, with a compact market map
**Purpose:** foundation notes, not publish-ready copy

## Working verdict

Herdr's closest shipped rival is not one product. `tmux` and Zellij own durable terminal sessions; cmux owns the native macOS workspace around coding agents; Boo owns a small, scriptable persistent terminal. Herdr tries to join all three jobs in a terminal-native server: real PTYs, workspace/pane layout, agent state, and a socket API that agents can drive.

Superlogical is not yet auditable as a product. Mitchell Hashimoto announced that the company will begin with a terminal multiplexer and cited lessons from building Ghostty, but there is no public multiplexer repository, beta, protocol, release, or license to inspect. Treat it as a funded product thesis, not a shipped Herdr competitor.

## Baseline ledger

One immutable baseline must be resolved for each repo before publication. Network access was interrupted before the repository clones completed, so this artifact does not invent SHAs. The one release commit exposed by a primary GitHub release page is recorded below; all other rows are explicit publication gates.

| Product | Canonical repo / branch | Baseline | Release and license at check | Live issue / PR state used |
|---|---|---|---|---|
| Herdr | [`ogulcancelik/herdr`, `main`](https://github.com/ogulcancelik/herdr) | **TODO: resolve HEAD SHA** | README advertises `v0.4.0`; Apache-2.0. Verify against Releases and `LICENSE`. | None used |
| tmux | [`tmux/tmux`, `master`](https://github.com/tmux/tmux) | **TODO: resolve HEAD SHA** | **TODO:** record current release; ISC-style license. | None used |
| Zellij | [`zellij-org/zellij`, `main`](https://github.com/zellij-org/zellij) | **TODO: resolve HEAD SHA** | **TODO:** record current release; MIT. | None used |
| cmux | [`manaflow-ai/cmux`, `main`](https://github.com/manaflow-ai/cmux) | **TODO: resolve HEAD SHA** | **TODO:** record current release and license from repo. | [#8737](https://github.com/manaflow-ai/cmux/issues/8737), open on 2026-08-20; proposes native display of a Herdr topology nested inside cmux |
| Boo | [`coder/boo`, `main`](https://github.com/coder/boo) | release `v0.6.4`, commit shown by GitHub as `39245a7` (**expand to 40 chars before pinning**) | `v0.6.4`, released 2026-07-05; MIT. | Release notes say #98 shipped in #99; recheck both before use |
| Superlogical | no public product repo | n/a | announced, unreleased; license unknown | n/a |

## Tight comparison matrix

| Product | Unit it owns | VT ownership | Persistence / reattach | Agent state and automation | Platform boundary | Replaces / wraps / relies on | Competitive status |
|---|---|---|---|---|---|---|---|
| **Herdr** | named session → workspace → tab → pane; agent identity decorates a pane | Herdr server owns pane PTYs and interprets terminal output; an outer terminal still renders Herdr's TUI | Client detach leaves server and pane processes alive; local and SSH reattach; docs claim restart restore, with native agent resume for supported integrations; live process handoff is experimental | Process/output detection by default; some integrations report semantic state and/or native session identity; local socket/CLI can create, split, spawn, read, and wait | One Rust binary in an existing terminal; local Unix socket; remote path uses SSH; macOS/Linux plus Windows beta in README | Replaces the inner tmux/Zellij layer; wraps agent CLIs and shells; relies on host terminal, PTYs, OS process model, and SSH | **Direct** for users choosing an inner terminal multiplexer; also attacks agent dashboards/orchestrators |
| **tmux** | server → session → window → pane; clients attach to sessions | tmux owns each pane PTY, parses application output into screen grids, then draws an outer terminal stream | Mature detach/reattach; more than one client can attach to a session; server loss ends the live session unless outside tooling restores commands/layout | Rich command language, formats, hooks, control mode, and pane capture; no built-in coding-agent state model. Agent awareness can be added with hooks/plugins/scripts | Unix-like hosts and any terminal/SSH client | Replaces direct one-shell terminal use; wraps arbitrary programs; relies on outer terminal and host PTYs | **Direct baseline**, not obsolete. It already covers multi-client and remote/mobile-through-SSH; Herdr competes on built-in agent semantics and productized API |
| **Zellij** | session → tab → pane; layouts define workspace shape | Zellij server owns pane PTYs and terminal state; client renders the session | Detach/attach is core; session resurrection can restore declared layout/commands, which is not the same proof as preserving every live process across server death | CLI actions and a WASM plugin system; no built-in coding-agent state model in the sampled core docs. Plugins can add UI and behavior, so say “not built in,” not “impossible” | Cross-platform terminal application, commonly local or over SSH | Replaces tmux/screen for terminal layout; wraps arbitrary programs; relies on outer terminal, PTYs, and optional plugins | **Direct baseline** for workspace UX; agent semantics remain an extension rather than its core ownership unit |
| **cmux** | native window → workspace/tab/split terminal surface; agent attention decorates surfaces | Embeds Ghostty/libghostty as the terminal emulator, so it owns the final terminal surface instead of drawing a multiplexer TUI through another emulator | Native app workspace behavior; do not claim tmux-style server persistence or cross-host reattach until code/tests prove it | Notifications, agent-aware status, and a scriptable CLI/socket surface; bundled browser expands the workspace beyond terminals | Native macOS app | Replaces the terminal emulator and some browser/window switching; wraps agent CLIs; relies on libghostty and macOS UI frameworks | **Direct for macOS attention/workspace**, adjacent for SSH-first persistence. It and Herdr can nest; open issue #8737 is evidence that users want both layers |
| **Boo** | one named session = one PTY/window/task | Boo uses `libghostty-vt` to keep rendered terminal screen state even while detached | Session process survives detach; one client at a time and attaching steals it; sampled docs say no tabs/splits; do not equate detach survival with daemon-restart restoration | `send`, `peek`, `wait`, and JSON make terminal state scriptable without an attached TTY; no coding-agent-specific status model required | Zig CLI/server on supported Unix-like hosts; existing terminal for attach | Replaces a small GNU screen/dtach-style job; wraps any interactive program; relies on libghostty-vt, PTYs, and the outer terminal | **Adjacent but material**: direct on durable task sessions and agent inspection, not on multi-pane workspace UI |
| **Superlogical** | unknown | likely informed by Ghostty experience; implementation unknown | unknown | unknown | unknown | announced product scope only | **Future direct competitor**, evidence state: stated |

## Claim table

| Claim | Product says | Code, test, or primary artifact | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| Herdr makes the pane, not the agent, the durable execution unit | “real terminal views,” background server, workspace/tab/pane concepts | Canonical README and repository docs enumerate server/client, named sessions, PTYs, panes, direct attach, and socket commands. Pin exact files after SHA resolution. | **Reported from primary docs; code inspection pending** | Agent identity augments a terminal process instead of replacing it with a closed agent runtime | Herdr remains agent-agnostic enough to host shells and unsupported agents |
| Herdr's “agent-aware” layer has two paths | Default detection uses process names/output; integrations can report identity or semantic state | README's integrations table separates native session restore from semantic state and says several agents still use screen detection for state | **Reported from primary docs** | The product can add new agents cheaply, but heuristic state can lag or misclassify without a native hook | This is the core gain over tmux and a core reliability risk |
| tmux lacks a built-in coding-agent state model, but not automation or multi-client access | tmux documents sessions, clients, commands, hooks, formats, capture, and control mode | Inspect and pin `tmux.h`, `server-client.c`, `cmd-*`, `control.c`, and format/hook tests at baseline before publication | **Architecture known; code pin pending** | Herdr packages a domain model that tmux users can reproduce only by composing conventions and plugins | “tmux cannot do it” would be false; the defensible claim concerns defaults and product ownership |
| Server-side multiplexers add a second VT boundary | tmux/Zellij/Herdr run inside an outer terminal while owning inner PTYs | Their server/client designs require parsing app output and then emitting a display stream for the host terminal to parse | **Code-inspection gate pending; architectural inference** | Nested parsing can expose capability translation, key, image, mouse, and rendering gaps, but this audit did not reproduce a defect | Test the Grok/Twitter “double parsing” theory as a compatibility cost, not as a universal failure |
| cmux avoids that boundary for its own terminal surfaces | cmux describes itself as Ghostty-based and native macOS | Canonical README; pin the libghostty integration and surface model after baseline resolution | **Reported from primary docs; code inspection pending** | Owning the final emulator lets cmux use native UI and terminal capabilities directly, at the cost of binding the product to an app/platform | This is a rival architecture, not just a feature difference |
| Boo treats rendered terminal state as an automation API | Boo promises commands that work detached: `send`, `wait`, `peek`, JSON | `v0.6.4` release plus README/man-page command contract; inspect server/session and libghostty-vt call sites at full SHA | **Reported from primary artifacts; release pinned, code trace pending** | A narrow one-session model may be easier to make deterministic for agents than a full workspace TUI | Boo competes on truthful inspection and synchronization, not visual fleet management |
| cmux users are asking to display Herdr's nested topology | n/a | cmux issue #8737 is open and proposes native discovery of Herdr workspace/tab/pane/agent structure | **Proposed** | Some users treat cmux as the outer native workspace and Herdr as the inner remote/runtime layer | The products can complement each other even while competing for the terminal surface |
| Superlogical will start with a terminal multiplexer | Hashimoto says the company “will begin by shipping a terminal multiplexer” | [Founder announcement](https://mitchellh.com/writing/superlogical) and [company site](https://www.superlogical.com/) | **Stated** | Ghostty experience suggests a focus on VT correctness and terminal UX, but any claim beyond that is speculative | The announcement validates interest in the layer; it does not validate Herdr's agent thesis |

## The Grok/Twitter hypothesis, narrowed

The source/docs support only half of the broad claim that agent sprawl created a new multiplexer market.

- **Supported:** Herdr, cmux, and Boo all turn detached or parallel terminal state into a first-class product surface for scripts or coding agents. Their READMEs lead with agent attention, inspection, or automation rather than generic shell tiling.
- **Rejected as stated:** tmux does support multiple clients, durable detach/reattach, automation, and remote/mobile use through normal SSH clients. Zellij also supports detachable sessions and extension through plugins. The gap is built-in agent identity/state and a ready-made orchestration contract, not raw capability.
- **Plausible, unproven:** an inner multiplexer plus an outer emulator creates two VT interpretation/rendering boundaries. This could cause nested capability and redraw problems. The audit did not run a compatibility corpus, so do not claim “double parsing issues” without a reproducible case.
- **Platform split:** cmux owns a native macOS terminal workspace. Herdr, tmux, Zellij, and Boo run on the remote or local host inside an existing terminal. That makes cmux stronger at native attention UI and weaker as evidence for cross-host persistence unless its source proves a daemon/reattach path.

## Rival product theories

| Theory | Whose view | Evidence for | Evidence against | Direction state | What would disprove it |
|---|---|---|---|---|---|
| Agent-heavy terminal use needs a new runtime, not a tmux theme | Herdr's maintainer thesis | Built-in state detection, integration identity, notifications, restore paths, socket operations, and agent-readable output all share the workspace model | tmux control mode/hooks/plugins and Zellij plugins can supply parts; agent CLIs may add their own team dashboards | **Shipped in part**; stronger semantic integrations are **in progress/enabled** depending on agent | A tmux/Zellij plugin stack matches Herdr's setup time, state accuracy, restore, and agent API across three major agents |
| The durable rendered screen is the useful primitive; orchestration should stay outside | Boo / Unix-tool rival | One session, libghostty-vt state, and small `send`/`wait`/`peek` contract reduce policy and work with any TUI | Users running many agents still need layout, status aggregation, identity, notifications, and cross-session control | **Shipped** | A full Herdr workflow proves no more brittle than Boo under detach, SSH loss, alternate screen, resize, and concurrent automation |
| The multiplexer should own the final native app surface | cmux and likely market pressure behind Superlogical | Embedded Ghostty surface, native notifications/tabs, browser splits, and agent-facing app commands avoid treating all work as text-only panes | macOS boundary; remote persistence and terminal portability belong naturally on the host-side server | cmux: **shipped**; Superlogical: **stated**, details **speculative** | A terminal-native Herdr client supplies equal attention/navigation UX across macOS, Linux, SSH, and mobile without a native shell |
| Mature general multiplexers remain the right substrate | tmux/Zellij rival | Long-lived session model, remote use, multi-client support (tmux), broad program compatibility, stable command/plugin surfaces | Domain behavior lives in user scripts/plugins; semantic agent identity and restore require per-agent cooperation | **Shipped** | Built-in agent state and orchestration show a durable accuracy or setup advantage that plugins cannot match |

## Adoption conditions for the article verdict

Try Herdr now when the work happens in several visible CLI-agent sessions, the host may be remote, and a human or parent agent needs one API for pane creation, output, state, and waiting. Keep tmux or Zellij when general terminal persistence, existing configuration, and multi-client access matter more than built-in agent semantics. Choose cmux when the unit of work is a native macOS workspace with notifications and browser surfaces. Choose Boo when one durable interactive job plus deterministic `wait`/`peek` is enough.

Two tests should decide whether Herdr's broader ownership is worth it:

1. **State accuracy:** run the same Codex, Claude Code, and Pi tasks in Herdr and in a tmux/Zellij plugin baseline. Record false blocked/working/done transitions and time-to-attention, with native integrations reported separately from heuristics.
2. **VT and recovery:** use the same TUI corpus across detach, resize, SSH loss, alternate-screen switches, image/keyboard protocols, and server restart. Compare Herdr, tmux, Zellij, and Boo; compare cmux only for tests that fit its native-app model. Define exact visual/state pass criteria first.

## Sampling limits and exclusions

This is a tight architectural sample, not a market census. It excludes GNU screen, WezTerm domains, shpool/dtach, macterm, Séance, kobe, DPlex, `mekarpeles/cmux`, `primogen/cmux`, ccmux, tmux agent plugins, Claude Squad, and Muxel. They may matter in a later cohort scan, but adding them here would blur four theories: general server multiplexer, agent runtime, native agent workspace, and scriptable durable task.

“cmux” is ambiguous; this audit means `manaflow-ai/cmux`. Muxel was named in the research prompt but was excluded because no canonical primary repository and product boundary were verified before cutoff. Superlogical has no source sample. No behavior was reproduced in this lane. Negative claims are limited to “not built into the sampled product/docs”; scripts, plugins, and outside orchestration may add the behavior.

## Pinned-source plan and source rationale

Resolve the baseline ledger, then replace every branch URL below with `/blob/<40-char-sha>/...` links. Do not publish until that pass is complete.

- [Herdr repository and docs](https://github.com/ogulcancelik/herdr) — proves the server/client hierarchy, persistence claims, agent integration split, platform claim, and socket surface once code/doc files are pinned.
- [tmux repository](https://github.com/tmux/tmux) — must prove session/client/pane ownership, screen parsing, control mode, capture, hooks, and multi-client behavior from code/man page/tests.
- [Zellij repository](https://github.com/zellij-org/zellij) — must prove server/session/tab/pane ownership, attach/resurrection semantics, and the WASM plugin boundary from code/docs/tests.
- [cmux repository](https://github.com/manaflow-ai/cmux) — must prove libghostty embedding, native surface hierarchy, notification/state path, CLI/socket calls, and platform build targets.
- [cmux issue #8737](https://github.com/manaflow-ai/cmux/issues/8737) — proves only that a contributor proposed native nested Herdr topology; it does not prove shipped support.
- [Boo `v0.6.4` release](https://github.com/coder/boo/releases/tag/v0.6.4) and [repository](https://github.com/coder/boo) — prove the shipped release and, after full-SHA pinning, the one-session/libghostty-vt/automation design.
- [Mitchell Hashimoto's Superlogical announcement](https://mitchellh.com/writing/superlogical) — proves the company and first-product statement, not implementation.
- [Superlogical site](https://www.superlogical.com/) — proves the beta wait-list and that OSS releases may arrive; it is marketing evidence, not a roadmap or code artifact.

## Publication gate

- Resolve and record a 40-character baseline SHA, current release, and license for all five public repos.
- Pin each material code/doc URL to that SHA and trace one call path per featured product.
- Recheck cmux #8737 and Boo #98/#99 live state.
- Run or remove the VT/detach claims; no reproduced evidence exists yet.
- Search tmux hooks/control mode and Zellij plugins before any categorical negative.
- Keep Superlogical future claims at **stated** or **speculative** until source or a beta ships.

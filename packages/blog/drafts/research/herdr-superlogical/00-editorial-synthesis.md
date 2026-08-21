# OSS Radar #04 — Herdr, Superlogical, and the new multiplexer layer

Research synthesis, not article prose.

- **Checked:** 2026-08-20 (America/Los_Angeles)
- **Mode:** project deep dive
- **Anchor project:** Herdr
- **Launch that tests the thesis:** Superlogical, announced 2026-07-29
- **Primary repository baseline:** `herdrdev/herdr` `master` at `624dfd4796559042ec13ccf4d4b54374902ab81d`
- **Herdr release in scope:** `v0.8.2`, commit `9eb521456ac0d19d3ab3d9d7cea3cca10baa8a4c`, released 2026-08-19
- **Ghostty audit baseline:** `ghostty-org/ghostty` at `48ccec182a932c2ec04c344d45a5fc553861cb13`
- **Superlogical product baseline:** none; no public product repository or beta was linked by first-party sources at the cutoff

## Research package

1. [`01-herdr-source-audit.md`](./01-herdr-source-audit.md) — Herdr product map, provisional system trace, agent-state and persistence questions, user-lead audit.
2. [`02-superlogical-ghostty-audit.md`](./02-superlogical-ghostty-audit.md) — announcement-versus-release boundary, pinned libghostty code, PTY boundary, theory map, and beta tests.
3. [`03-competition-source-audit.md`](./03-competition-source-audit.md) — tmux, Zellij, cmux, and Boo product boundaries, rival theories, sampling limits, and adoption tests.

The fanout clone attempts were blocked by sandbox/network approval. The Herdr baseline and release facts below were resolved afterward through the GitHub connector, and selected Herdr files were inspected at the frozen SHA. Where the lane artifacts still say “unverified,” this synthesis is the acceptance-pass correction.

## Recommended verdict

**Herdr already ships one answer to the problem Superlogical just named: a durable terminal session that both people and coding agents can operate. But Herdr's product boundary is the agent runtime, while Superlogical is promising a broader shared session layer for human, automatic, and production work. They share libghostty; they do not yet share a proven product.**

Falsifiable form for the first 100 words:

> Herdr turns a terminal multiplexer into an agent runtime by making pane state, agent lifecycle, native session identity, and automation part of one server protocol. If its state detection and recovery fail under real agent work, it is a polished tmux replacement rather than a runtime.

This keeps the issue a Herdr deep dive. Superlogical acts as the market event and rival theory, not as a second project review.

## The code-backed center

### Herdr owns more than pane layout

At baseline `624dfd4796559042ec13ccf4d4b54374902ab81d`:

- [`src/protocol/wire.rs`](https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/protocol/wire.rs) defines protocol version `20`, length-prefixed binary framing, a 2 MB normal frame cap, larger explicit graphics/clipboard caps, client launch modes, and two render encodings: semantic frames and terminal ANSI. This is a product protocol, not only a tmux-style key map.
- [`src/pane.rs`](https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/pane.rs) couples `portable-pty`, a PTY actor, a `GhosttyPaneTerminal`, agent detection, and render signals. It forces pane children to `TERM=xterm-256color` and `COLORTERM=truecolor` because Herdr, rather than the outer terminal, renders the inner pane.
- [`src/persist.rs`](https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/persist.rs) separates session snapshots, optional screen history, plugin state, ordinary restore, and Unix handoff restore. The article must still distinguish layout restore, screen reconstruction, native agent resume, and live process transfer.
- [`src/agent_resume.rs`](https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/agent_resume.rs) accepts native session references only from recognized official source/agent pairs, limits ID/path lengths, persists typed references, and builds resume plans. That is stronger evidence for an agent runtime than a sidebar badge.
- [`Cargo.toml`](https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/Cargo.toml) identifies the canonical repository as `herdrdev/herdr`, version `0.8.2`, Apache-2.0, and dependencies including `portable-pty`, `bincode`, `interprocess`, Tokio, Ratatui, and a vendored `portable-pty` patch.

### Version 0.8.2 is part of the story, not the thesis

The immutable [`v0.8.2` release](https://github.com/herdrdev/herdr/releases/tag/v0.8.2) verifies the user's dated lead. It shipped Qwen Code detection and optional native resume, outer-window title sync, richer desktop tab-bar status, Windows stable-channel general availability, and many correctness fixes.

The fixes are more useful than the feature list. They show the cost of treating terminal pixels as agent state: the release corrects false idle/blocked states, startup races, background prompt focus, alternate-screen read latency, oversized render frames, stale process snapshots, keyboard protocols, mouse reports, and remote-client disconnects. That evidence supports both theories at once:

- Herdr is building a real runtime because these failure modes converge in one server.
- Terminal-derived semantics remain brittle because agent releases and terminal modes keep changing.

### libghostty lowers one cost; it does not ship the product

The Ghostty audit pins public VT state, grid/style inspection, render state, formatter, and input-encoding APIs. Mitchell's own boundary is decisive: `libghostty-vt` does not create or manage the PTY. A multiplexer still needs process supervision, session identity, persistence, transport, auth, sharing rules, backpressure, and client policy.

Herdr has public implementations for many of those surrounding pieces. Superlogical has announced outcomes for them but has not published its implementation. The fair comparison is therefore shipped Herdr architecture versus stated Superlogical direction, never code versus imagined code.

## Product topology

| Layer | Herdr | Superlogical | Nearby baseline |
|---|---|---|---|
| Terminal semantics | Ghostty-backed pane terminal | States it will use public libghostty | Boo also uses `libghostty-vt`; tmux/Zellij own their terminal state |
| Durable unit | Session → workspace → tab → pane; agent identity augments a pane | Long-lived session containing terminal blocks; wider durable-work model stated | tmux session/window/pane; Zellij session/tab/pane |
| Human clients | Terminal TUI, direct attach, SSH remote client | Web plus native macOS/iOS promised | cmux owns the native macOS surface |
| Machine control | Socket/CLI actions, reads, waits, semantic reports, native session references | Structured data/actions and composability promised | tmux control mode/hooks; Zellij CLI/plugins; Boo `send`/`peek`/`wait` |
| Agent opinion | First-class detection, state, resume, and agent commands | Agents are one kind of work in a larger system | cmux tracks attention; general multiplexers leave it to extensions |
| Collaboration / production | Not established as Herdr's current core | Live sharing promised; production operability is step three | No sampled product proves Superlogical's full claim |

## User/Grok lead disposition

| Lead | Acceptance result | Use in article |
|---|---|---|
| Herdr joined YC F26 on Aug 6 | **First-party reported.** The founder's Aug 6 post says Herdr is joining YC's F26 batch. | Attribute to the founder; a YC directory check is still preferable before publication. |
| About 25k stars and hundreds of thousands of downloads | **First-party reported, time-sensitive.** The same Aug 6 post says 25k stars and 340k downloads. | Optional context only; explain these are founder-reported snapshots, not adoption quality. |
| Herdr 0.8.2 on Aug 19 | **Verified.** Release commit `9eb521456ac0d19d3ab3d9d7cea3cca10baa8a4c`. | Use selectively; the bug fixes matter more than the launch list. |
| Windows GA, Qwen, tab-bar and title changes | **Verified in release notes/code history.** | Evidence of platform and integration velocity, not proof of runtime reliability. |
| Hundreds of plugins | **First-party reported; counting/trust model unresolved.** Founder post says more than 500 one month after marketplace launch; v0.8.2 changes discovery. | Omit unless marketplace records and review rules are audited. |
| Omarchy integration | **Not verified as an integration.** DHH is credited on several v0.8.2 UI changes, which is not the same claim. | Omit until canonical Omarchy/Herdr code proves the boundary. |
| Superlogical server-authoritative raw-PTY design | **Unverified.** The public site states outcomes, not this topology. Similar ideas appear in third-party Ghostty discussions. | Do not attribute or use as premise. |
| Superlogical tab peek/themes previews | **Unverified without exact first-party social URLs.** | Keep as a later visual/UI lead. |
| Mitchell called Herdr a partner / less AI-opinionated | **Unverified attribution.** | Present complementarity only as the article's tested theory. |

## The article argument

### 1. The market event

Superlogical's announcement validates the durable-session layer as a company-sized bet. Keep this short: exact date, stated clients, sharing promise, “all work” direction, and no public implementation.

### 2. Herdr already ships a narrower version

Trace one action end to end:

```text
agent prompt / socket request
  → protocol validation and target resolution
  → server-owned pane and PTY
  → Ghostty-backed terminal state
  → hook or screen-derived agent transition
  → wait result and human-visible rollup
```

The final draft must pin the actual request handler and state-transition call sites. The current package pins the framing, pane, persistence, and native-resume layers but does not yet complete that handler-to-result trace.

### 3. The same architecture contains the limit

The v0.8.2 fixes make the skeptical case without a straw man. Herdr supports many agents because terminals are a shared interface; that same shared interface forces it to infer semantics from process trees, titles, prompts, spinners, alternate screens, and agent-specific hooks. Native reports are stronger, but integrations do not all own state.

### 4. Superlogical is a rival theory, not yet a benchmark

Superlogical aims to make the session less agent-specific and more client-, collaboration-, and production-oriented. That may complement Herdr, compete with it, or absorb the same layer. There is no product evidence yet to decide. The article can judge the ambition and its missing components, not its performance.

### 5. Decision

Try Herdr now when several CLI agents run on local or remote machines and both a human and another agent need to inspect and control those sessions. Keep tmux/Zellij when mature general multiplexing and existing automation matter more than built-in agent semantics. Watch Superlogical when cross-device native clients, live sharing, and production controls are the job; wait for a beta before treating it as an alternative.

## Reproduction gate before drafting prose

Run one controlled two-agent task against Herdr `v0.8.2` and record exact commands and results:

1. Start Codex and Claude Code in separate panes through the public agent surface.
2. Observe `working`, `blocked`, `idle`, and `done` transitions; separate hook-sourced state from screen detection.
3. Send a prompt with `--wait`; test a prompt while the agent is already blocked.
4. Detach and reattach from a second terminal; verify process identity, screen state, scrollback, and wait subscriptions.
5. Restart normally and with experimental handoff as separate tests; record which of process, terminal screen, native agent conversation, and layout survives.
6. Repeat one alternate-screen and one high-output case that maps to v0.8.2 fixes.

Predeclare pass marks. Do not turn an anecdotal successful session into a general reliability claim.

## Publication gates

- Pin the end-to-end Herdr request handler, state authority, and wait completion call sites at the frozen SHA.
- Recheck whether `624dfd4796559042ec13ccf4d4b54374902ab81d` remains the intended research baseline if drafting begins on another day; explain any later SHA.
- Recheck all cited Herdr issues/PRs and Ghostty discussions immediately before publication.
- Resolve current tmux, Zellij, cmux, and Boo SHAs only for the products that survive the final compact comparison.
- Keep Superlogical statements at **Stated** until a beta, repository, or protocol ships.
- Remove star, download, plugin, investor, and trend counts unless each changes the verdict.

## Working title directions

- **Herdr Is Already Shipping One Version of Superlogical's Bet**
- **The Agent Multiplexer Is Becoming a Runtime**
- **Herdr, Superlogical, and Who Owns the Durable Session**

The first title has the sharpest market hook, but the second best matches the code-backed thesis. Choose only after the reproduction pass shows whether “runtime” survives contact with Herdr's state and recovery behavior.

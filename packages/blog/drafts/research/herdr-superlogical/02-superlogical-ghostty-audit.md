# Superlogical / Ghostty source audit

Research artifact for the next OSS Radar issue. This is an evidence ledger, not article prose.

## Scope and cutoff

- **Checked:** 2026-08-20 (America/Los_Angeles)
- **Launch in scope:** Mitchell Hashimoto's **2026-07-29** Superlogical announcement and the public Superlogical landing page available at the cutoff.
- **Source-code scope:** `ghostty-org/ghostty`, canonical branch `main`.
- **Ghostty baseline:** `48ccec182a932c2ec04c344d45a5fc553861cb13`. This is the full upstream Ghostty SHA independently recorded by a public libghostty binding and is the baseline used for the pinned, pre-announcement code links below. Current `main` had moved past it by the cutoff and exposed more C headers, including snapshot and byte-stream I/O. Those later surfaces are recorded as direction evidence only; they do not prove Superlogical's private design.
- **Superlogical repository baseline:** none. Neither the official announcement nor the official site linked a public Superlogical multiplexer repository. The site asks readers to join a list for its first release and says it will announce any OSS releases along the way. Do not invent a branch or SHA for unreleased code.
- **Reproduction:** none. No Superlogical beta or public implementation was available to run in the inspected first-party sources.

Baseline caveat: before publication, refresh the Ghostty `main` SHA and repin the code links. The conclusions below do not depend on treating later `main` work as shipped Superlogical code.

## Bottom line

Superlogical has announced a terminal multiplexer, not released one. Its first-party copy promises long-lived terminal blocks, reconnect from another device, web and native Apple clients, built-in live sharing, and native scrollback, selection, and scrolling. It also states a larger goal: a durable, composable session layer for interactive, automatic, and production work.

Public Ghostty code supplies credible terminal-emulation parts for such a product: parse a VT byte stream, hold screen and scrollback state, resize with reflow, encode input, inspect cells and styles, expose incremental render state, and format a terminal back into plain text, HTML, or VT. It does **not** supply the full multiplexer described by Superlogical. Mitchell has said `libghostty-vt` does not create or manage a PTY. Public code does not establish Superlogical's process supervisor, session daemon, network protocol, storage, authentication, sharing rules, conflict model, web/native renderer, or production control plane.

The safe article thesis is therefore: **libghostty lowers the terminal-correctness cost of a new multiplexer, while Superlogical still has to build and reveal the parts that make it a multiplexer and a product.**

## What Superlogical stated, shipped, and withheld

### Stated on 2026-07-29

Mitchell's announcement says:

- Superlogical will **begin** by shipping a terminal multiplexer.
- It will build on public, MIT-licensed libghostty components available to everyone.
- The team will upstream shared terminal work so other libghostty users benefit.
- Ghostty remains a nonprofit and its governance, license, technical goals, and roadmap do not change.
- The terminal multiplexer is not the whole vision, but Mitchell was not ready to share more.

The verb tense matters. The post announces intent; it does not claim the multiplexer was available that day.

### Stated on the official site by the cutoff

The landing page expands the intended product:

- A durable session around work should span apps and environments, carry context, expose structured data and actions, preserve history, accept software control, and remain visible and controllable to people.
- The plan is: build a multiplexer, make its parts composable, then make it safe and operable in production.
- The first terminal product will organize independent terminal blocks in long-lived sessions.
- A user should be able to close the app, reconnect from another device, and resume.
- Planned clients include the web and native macOS/iOS apps.
- Live sharing is planned from the start.
- Scrollback, selection, and scrolling should work natively.

These are first-party product commitments, but the page still says to join the list for the first release and beta. Treat them as **Stated**, not Code-inspected or Reproduced.

### Not published in the inspected first-party material

- No public multiplexer source repository, release artifact, beta build, protocol specification, or API reference.
- No disclosed daemon/process topology.
- No disclosed PTY ownership or lifecycle design.
- No disclosed server/client state authority model.
- No disclosed raw-PTY-streaming design.
- No disclosed snapshot/delta wire format.
- No disclosed session persistence store or restart guarantees.
- No disclosed authentication, encryption, authorization, sharing, or input-conflict rules.
- No disclosed compatibility matrix for shells, TUIs, terminals, OSes, or remote hosts.
- No disclosed price, hosted/self-hosted boundary, or license for Superlogical's own product code.
- No first-party description of UI tab previews, “peek,” or theme behavior found in the inspected announcement/site.
- No first-party statement found that Superlogical is “less AI-opinionated” than Herdr or that Herdr is a partner rather than a competitor.

Absence from these sources does not show that the team has not built these things privately. It shows that an article cannot claim them yet.

## Claim table

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| Superlogical announced a terminal multiplexer on 2026-07-29. | “will begin by shipping” one | No public Superlogical code inspected | **Stated / Reported by first party** | None | Sets the launch scope without turning an announcement into a release. |
| The first product targets long-lived sessions and cross-device reconnect. | Official site says close the app, reconnect elsewhere, and continue | No product test available | **Stated** | None | Session lifetime and client mobility are core product claims. |
| Web, macOS, and iOS access plus built-in live sharing are planned. | Official site names these clients and sharing | No clients or sharing code published | **Stated** | None | This moves the target beyond a local tmux clone, but remains unshipped. |
| Native scrollback, selection, and scrolling are planned. | Official site names all three as existing-mux pain points | Ghostty terminal/grid/render/selection primitives exist; no Superlogical UI inspected | **Stated** for product; **Code-inspected** for reusable primitives | **Author inference:** libghostty reduces the emulator work, not the UX work | These details are a concrete adoption test for the beta. |
| Superlogical will consume the same MIT libghostty parts as other users and upstream shared terminal work. | Announcement says so | Ghostty repo is public and MIT-licensed | **Stated** plus **Code-inspected** foundation | None about future upstream volume | Defines the promised open/closed boundary only at the dependency layer. |
| `libghostty-vt` can parse output and maintain terminal state. | Ghostty docs say so | Terminal write, resize, screen/grid, scrollback, modes, cursor, and input-encoding APIs are public | **Code-inspected** | None | This is the sound technical link between Ghostty and a future mux. |
| `libghostty-vt` can expose render changes and serialize a view as plain text, HTML, or VT. | Ghostty API docs describe render and formatter groups | Public render/grid/formatter code and C APIs exist | **Code-inspected** | **Author inference:** these can support multiple front ends | “Can support” is not proof of Superlogical's client architecture. |
| `libghostty-vt` owns the PTY/session process. | Superlogical does not say this | Mitchell said libghostty-vt does not create/manage a PTY and suggested a future separate PTY library | **Code-inspected negative boundary / maintainer statement** | None | Superlogical must supply process and session lifetime outside this library. |
| Superlogical uses server-authoritative state and streams raw PTY bytes to smart libghostty clients. | No exact first-party source found | A third-party Ghostty discussion proposed related raw-stream/snapshot modes; it is not Superlogical code | **Unverified** for Superlogical; **Proposed** in third-party discussion | The lead may be conflating an ecosystem prototype with Superlogical | Do not publish this architecture as fact. |
| Superlogical has UI tab previews/peek and themes. | No support found in announcement/site | No public UI code or beta inspected | **Unverified** | None | Social screenshots or copy need exact post links and dates before use. |
| Superlogical is less AI-opinionated and Herdr may be a partner, not a direct competitor. | No support found in inspected first-party sources | No product integration or partnership artifact | **Unverified** | **Possible market reading only:** their stated scopes overlap in terminal sessions but differ in emphasis | Do not attribute this view to Mitchell without the exact post. |
| Current Ghostty work on terminal snapshots proves Superlogical's protocol. | Superlogical has not said this | Current public headers show a snapshot group; ecosystem discussions explored snapshots and reconnect | **Enabled** in libghostty; **unverified** for Superlogical | **Author inference only:** snapshots are a plausible primitive | An extension point is not a private roadmap or network design. |

## Public Ghostty paths that genuinely matter

All pinned paths in this section use baseline `48ccec182a932c2ec04c344d45a5fc553861cb13`.

### 1. Terminal state engine

The C terminal surface lets an embedder create/free a terminal, feed VT output, resize it, read terminal properties, and obtain screen/grid references. The Zig `Terminal` behind it owns parsed terminal state: screens, cursor, modes, colors, scrollback, hyperlinks, and related metadata.

For a multiplexer, this can replace the need to write another partial VT emulator. It does not start the child program or keep it alive after a client exits.

- Pinned C API: `include/ghostty/vt/terminal.h`
- Pinned implementation area: `src/terminal/c/terminal.zig`
- Pinned state model: `src/terminal/Terminal.zig`

### 2. VT parser and stream handling

The terminal accepts the byte stream produced by a child process and applies escape sequences to the terminal state. Ghostty's public framing says `libghostty-vt` covers escape parsing and terminal state, and has no renderer/windowing layer.

This enables a headless terminal instance per terminal block. It does not decide whether the raw stream, a state delta, pixels, or another format crosses the network.

### 3. Grid and style inspection

Public grid-reference, cell, grapheme, and style APIs let an embedder traverse terminal content without scraping rendered pixels. A client or exporter can read semantic cells and styles.

This supports inspection and custom renderers. It does not establish a stable network schema; the public C API is explicitly marked incomplete and subject to breaking changes.

- Pinned grid API: `include/ghostty/vt/grid_ref.h`
- Pinned styles: `include/ghostty/vt/style.h`

### 4. Incremental render state

The render API exposes changes for a custom renderer rather than forcing a full screen redraw. That is useful for native or web clients that maintain their own drawing layer.

It still leaves font shaping, GPU/browser rendering, bandwidth control, ordering, reconnect, backpressure, and version skew to the product around the library.

- Pinned render API: `include/ghostty/vt/render.h`
- Pinned render implementation area: `src/terminal/render.zig`

### 5. Formatter

Ghostty's formatter can emit terminal content as plain text, HTML, or VT. Its VT mode can emit palettes, modes, scrolling region, tab stops, current working directory, keyboard state, screen styles/content, and cursor-related state based on the selected extras.

This provides export, copy, debug, or replay building blocks. Formatter output is not a session database and does not transfer the shell/PTY process. A VT reconstruction path may also have fidelity/version concerns that a product must test.

- Pinned formatter C API: `include/ghostty/vt/formatter.h`
- Pinned formatter implementation: `src/terminal/formatter.zig`

### 6. Input encoding

Key, mouse, focus, and paste helpers encode client actions according to active terminal modes. This matters when a native or browser client sends input to a remote child.

It does not choose who may type in a shared session, arbitrate simultaneous writers, or authorize a dangerous action.

- Pinned key API: `include/ghostty/vt/key.h`
- Pinned mouse API: `include/ghostty/vt/mouse.h`

### 7. Snapshot work after the baseline

At the cutoff, current `main`'s umbrella header listed a **Terminal Snapshot** group that can encode and incrementally restore terminal state, plus reusable byte-stream I/O callbacks. A tip changelog records snapshot framing work under short commit `fdf8dfd`. This is relevant direction evidence, but it postdates the pinned baseline used here and must be repinned to a full current SHA before the article relies on its exact API.

Even a lossless terminal-state snapshot would not migrate the running shell or PTY. It also would not by itself supply a transport, client negotiation, access control, or durable process supervisor.

## The boundary Mitchell has stated for libghostty

The clearest public constraint comes from Ghostty discussion #11348. When asked about host raw-mode and terminal-size functions, Mitchell said libghostty-vt was unlikely to add them because it does not create/manage a PTY. Asked whether that belonged in another library such as `libghostty-pty`, he answered yes.

That gives the article a firm product boundary:

```text
child process + PTY + lifetime      Superlogical or another library
              ↓ bytes
VT parse + terminal state           libghostty-vt
              ↓ cells/render state
native/web renderer + interaction   Superlogical clients or other consumers
```

The arrows show a possible assembly based on public interfaces, not Superlogical's disclosed topology.

## Product map

| Role | Product or layer | Evidence |
|---|---|---|
| Replaces | The user-facing workflow of a classic terminal multiplexer: organize terminal blocks, keep a session alive, detach/reconnect | Superlogical official site; implementation unpublished |
| Wraps | Shells, TUIs, agents, background jobs, and other terminal applications | Official site names interactive/automatic work and terminal blocks; exact process contract unpublished |
| Extends | `libghostty` from a terminal-emulation building block into a networked, shared product | Announcement commits to libghostty; Ghostty C/Zig APIs expose terminal state |
| Relies on | PTYs/process supervision, OS integration, networking, auth, storage, rendering, and client distribution outside `libghostty-vt` | Ghostty PTY boundary plus missing public Superlogical implementation |
| May enter | Structured work history/actions and production operation | Official site states this larger plan; no code or detailed design published |

## Theory map

| Theory | Whose view | Evidence for | Evidence against / missing | Direction state | What would disprove it |
|---|---|---|---|---|---|
| A terminal multiplexer is the first client of a durable session layer that later spans automatic and production work. | Superlogical maintainers | Official site explicitly lays out multiplexer → composability → production and calls the session the missing layer | No public data model, action protocol, production safety model, or code | **Stated** | A release whose core model cannot represent non-terminal work without a second unrelated system |
| The near product is a polished, cross-device, multiplayer tmux alternative; the wider “all work” layer remains a later bet. | Skeptical/user reading | Concrete promises cluster around reconnect, Apple/web clients, sharing, and native terminal UX | The team states a larger system from day one, and libghostty exposes structured terminal state | **Enabled / author inference** | A beta that ships composable structured actions/history across terminal and non-terminal work, not just panes and clients |
| Superlogical's moat comes from a secret libghostty-based server-state protocol. | Social/architecture lead | Ghostty has state, render, formatter, and emerging snapshot primitives; ecosystem prototypes explored remote state sync | No first-party protocol statement or Superlogical source; a third-party proposal is not company evidence | **Speculative / currently unverified** | Publication of a different topology, or a beta that uses classic stream replay/tmux control rather than structured state sync |
| Herdr and Superlogical are partners more than competitors. | Social/market lead | Their public emphases could be complementary: Herdr coordinates coding agents; Superlogical describes a broad session substrate | No partnership, integration, quote, or joint artifact found; both can own persistent multi-session terminal workflows | **Speculative** | Either product positions the other as replaceable, or both compete for the same session/control-plane job with no integration |

## Shipped part → possible product chains

These chains separate public Ghostty work from Superlogical commitments.

### Chain A: reconnectable terminal blocks

`libghostty-vt` terminal state + resize/reflow + grid/formatter/snapshot primitives (**Code-inspected / Enabled**)
→ keep a semantic terminal view independent of one GUI process
→ **missing:** PTY/process supervisor, session identity, durable lifecycle, transport, snapshot/version protocol, reconnect rules
→ cross-device, long-lived terminal multiplexer (**Stated by Superlogical; not shipped publicly**)

This is the nearer path. Ghostty supplies the hard terminal semantics, while the missing pieces remain a large product surface.

### Chain B: shared, software-driven work sessions

structured cells/render state + input encoders (**Code-inspected / Enabled**)
→ let several clients observe a terminal and let software inspect or drive it
→ **missing:** authentication, permissions, writer arbitration, audit log, structured action schema, production isolation and policy
→ multiplayer sessions and, later, a safe production work layer (**Stated at the product level; implementation speculative**)

This path needs rules that terminal emulation cannot provide. It is where Superlogical's broader claim will either become a distinct system or stay landing-page scope.

## Live issue and discussion ledger

Checked 2026-08-20. Recheck immediately before publication because GitHub discussion states can change.

| Item | State at check | What it can prove |
|---|---|---|
| `ghostty-org/ghostty` discussion **#11348**, “Add Parser and Terminal C API to libghostty-vt” | **Closed, unanswered** in GitHub's discussion status; the thread records follow-on work landing through PR #11814 and Mitchell's PTY boundary comments | The C API expansion and the fact that libghostty-vt does not manage PTYs |
| PR **#11814** referenced from #11348 | **Merged/landed before 2026-03-29** according to the first-hand discussion | Row/grid/formatter pieces discussed there reached main; repin PR state before citing exact code |
| discussion **#11998**, “Binary terminal snapshots for lossless state transfer” | **Open/unanswered** at check | A third party proposed state snapshotting; Mitchell called it interesting and asked about approach. It does not prove Superlogical design |
| discussion **#12176**, “Exploration: Reconnectable Terminal using libghostty” | **Open/unanswered** at check | A third-party prototype proposed raw streaming plus snapshot catch-up and multi-client futures. It is a lead, not first-party Superlogical architecture |
| discussion **#13474**, “Expose terminal default modes through the libghostty-vt C API” | **Closed/answered** on 2026-08-06; answer points to #13661 | Embedders hit reset/default-mode gaps; current API work addressed it differently. This is evidence that an unstable embedder API still needs integration care |
| issue/PR **#13661** referenced from #13474 | **Done/closed** by the answer date | Default-mode handling changed after the report; inspect and pin before using implementation detail |

## Social leads: verification result

The user supplied several Twitter/Grok leads. No exact first-party post URL/date was available in the inspected evidence, so retain them as leads only:

1. **“Server-authoritative state plus raw PTY streaming to smart clients built on libghostty.” — Unverified for Superlogical.** The nearest public technical match is third-party Ghostty discussion #12176. Do not transfer that design to Mitchell or Superlogical.
2. **“UI previews/tab peek/themes.” — Unverified.** The official page supports native clients and terminal UX work, but not these named features.
3. **“Mitchell says Superlogical is less AI-opinionated.” — Unverified.** The official page says the work spans humans, agents, automatic jobs, and production; that supports broad scope, not this comparison.
4. **“Herdr may be a partner rather than a direct competitor.” — Unverified as attribution.** It can appear only as the article author's tested market theory unless an exact first-party post surfaces.

Publication rule: if a primary social post surfaces, record the exact URL, author, date, and wording. Label it **Stated**. It still cannot prove code or a shipped feature.

## Gaps that should drive the article and beta test

### Gap 1: session truth and recovery

The product promises close/reconnect and exact continuation. Test whether the server keeps the child process and authoritative terminal state through client loss, machine sleep, network change, client version mismatch, and large output while detached. Record scrollback, alternate-screen TUIs, cursor/modes, Unicode graphemes, hyperlinks, and graphics before and after reconnect.

Pass mark: the same process remains alive and the reattached client matches a control capture without lost input, broken scrollback, or visible state drift.

### Gap 2: sharing control, not just sharing pixels

The product promises live sharing. Test two clients with different sizes and latency, simultaneous input, selection/scrollback independence, permission changes, reconnect, and revocation.

Pass mark: viewers cannot write unless granted, writer conflicts follow a visible rule, revocation takes effect promptly, and one client's viewport actions do not damage another's terminal state.

These two tests are enough. They probe the claims that libghostty alone cannot settle.

## Pinned and primary source list

1. **Mitchell Hashimoto, “Superlogical,” 2026-07-29**
   https://mitchellh.com/writing/superlogical
   Why: canonical launch statement; proves intended first product, libghostty relationship, upstream promise, and Ghostty governance boundary.

2. **Superlogical official site, checked 2026-08-20**
   https://www.superlogical.com/
   Why: canonical product scope for long-lived sessions, cross-device clients, sharing, native terminal UX, composability, and production direction; also shows beta/first release had not been publicly offered there.

3. **Mitchell Hashimoto, “libghostty is Coming,” 2025-09-22**
   https://mitchellh.com/writing/libghostty-is-coming
   Why: first-party account of why multiplexers need terminal emulation and how classic multiplexers own child PTYs, parse child escape sequences, manage screen state, and emit sequences toward the parent terminal.

4. **Ghostty repository README, pinned baseline**
   https://github.com/ghostty-org/ghostty/blob/48ccec182a932c2ec04c344d45a5fc553861cb13/README.md
   Why: canonical project description, libghostty scope, language/platform claims, and API-stability warning at the research baseline.

5. **Ghostty libghostty-vt umbrella header, pinned baseline**
   https://github.com/ghostty-org/ghostty/blob/48ccec182a932c2ec04c344d45a5fc553861cb13/include/ghostty/vt.h
   Why: canonical inventory of public C API groups and explicit warning that the API is incomplete and unstable.

6. **Ghostty terminal C API, pinned baseline**
   https://github.com/ghostty-org/ghostty/blob/48ccec182a932c2ec04c344d45a5fc553861cb13/include/ghostty/vt/terminal.h
   Why: proves the public terminal lifecycle, VT write, resize, property, and state access surfaces used by embedders.

7. **Ghostty render C API, pinned baseline**
   https://github.com/ghostty-org/ghostty/blob/48ccec182a932c2ec04c344d45a5fc553861cb13/include/ghostty/vt/render.h
   Why: proves incremental render-state access for custom renderers.

8. **Ghostty formatter implementation, pinned baseline**
   https://github.com/ghostty-org/ghostty/blob/48ccec182a932c2ec04c344d45a5fc553861cb13/src/terminal/formatter.zig
   Why: proves plain/HTML/VT output options and which terminal extras VT reconstruction can emit.

9. **Ghostty discussion #11348, checked 2026-08-20**
   https://github.com/ghostty-org/ghostty/discussions/11348
   Why: records C API work reaching main and Mitchell's explicit boundary that libghostty-vt does not create/manage a PTY.

10. **Ghostty discussion #11998, checked 2026-08-20**
    https://github.com/ghostty-org/ghostty/discussions/11998
    Why: primary third-party proposal for lossless terminal snapshots; useful as ecosystem direction, not Superlogical evidence.

11. **Ghostty discussion #12176, checked 2026-08-20**
    https://github.com/ghostty-org/ghostty/discussions/12176
    Why: primary third-party reconnectable-terminal prototype and the closest public match to the unverified raw-stream/snapshot architecture lead.

12. **Ghostty discussion #13474, checked 2026-08-20**
    https://github.com/ghostty-org/ghostty/discussions/13474
    Why: shows a real embedder default-mode gap and its closed/answered state, which tests claims that libghostty makes product integration automatic.

13. **Current Ghostty `vt.h`, unpinned supplemental check**
    https://github.com/ghostty-org/ghostty/blob/main/include/ghostty/vt.h
    Why: confirms that snapshot and byte-stream I/O groups existed on current `main` at the cutoff. Repin to a full SHA before article publication.

## Hand-off notes for the OSS Radar draft

- Lead with announcement-versus-release precision.
- Keep the technical center on the PTY boundary: libghostty handles terminal semantics; the product must own durable process/session and client policy.
- Use Superlogical's explicit user promises as the adoption test: reconnect, native scrollback/selection/scrolling, and sharing.
- Do not state the server-authoritative/raw-stream architecture, previews/peek/themes, AI positioning, or Herdr partnership theory as fact.
- Compare Herdr at the job level only after the Herdr lane pins what Herdr actually ships. “Both show terminals” is not enough; test who owns agent orchestration, session lifetime, human control, remote access, and production operation.
- Refresh one full Ghostty `main` SHA, issue/discussion states, and the Superlogical site immediately before publication.

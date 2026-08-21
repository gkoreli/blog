import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import {
  OssRadarHero,
  PullQuote,
  Callout,
  FlowDiagram,
  SectionBreak,
  StatRow,
  Prognosis,
  CompareTable,
  Sources,
} from '../src/templates/components.js';

export const meta: PostMeta = {
  title: 'OSS Radar #04: The Agent Multiplexer Is Becoming a Runtime',
  seoTitle: 'Herdr Review: The Agent Multiplexer Becomes a Runtime',
  alternativeHeadline: 'Herdr turns persistent terminal panes into an agent runtime with state, control, and agent resume',
  date: '2026-08-21',
  description: 'Herdr gives coding agents durable terminal sessions, agent state, and a control API. Screen-derived semantics remain its limit.',
  section: 'oss-radar',
  tags: ['oss-radar', 'agents', 'terminal', 'herdr', 'multiplexer'],
  layout: 'immersive',
  featured: false,
  images: [],
  slug: 'oss-radar-04-the-agent-multiplexer-is-becoming-a-runtime',
};

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #04',
    date: 'August 2026',
    tags: 'open-source · agents · terminals · runtimes',
    title: html`<h1>The Agent Multiplexer Is Becoming a <em>Runtime</em></h1>`,
    subtitle: 'Herdr gives terminal panes identity, lifecycle state, control, and agent resume.',
    author: 'Goga Koreli',
    readTime: '7 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
  <p class="post-lede">
    <a href="https://github.com/herdrdev/herdr/releases/tag/v0.8.2" target="_blank" rel="noopener">Herdr 0.8.2</a>
    is an open-source terminal multiplexer built around coding agents. It owns real PTYs, keeps sessions alive,
    tracks agent state, and lets people and agents act on the same server-owned panes through client and automation
    protocols. That shared session is enough to call Herdr an early agent runtime. Its current limit is also in
    that path: much of the
    lifecycle still comes from interpreting a terminal screen, and its waits track state rather than one turn.
  </p>

  <p>
    Mitchell Hashimoto announced <a href="https://mitchellh.com/writing/superlogical" target="_blank" rel="noopener">Superlogical</a>
    on July 29. The company will start with a terminal multiplexer, then make its parts composable and safe for
    production. Herdr already ships a narrower version of that bet. Herdr uses <code>libghostty</code>; Superlogical
    says it will build on the same public components. Superlogical is a rival theory, not yet a code-level competitor.
  </p>

  ${StatRow({
    items: [
      { value: 'v20', label: html`Herdr client/server wire protocol` },
      { value: '300 ms', label: html`Delay between prompt text and Enter` },
      { value: '5 sec', label: html`Activity-gate ceiling from a non-working start` },
    ],
  })}

  <h2>The pane became an addressable agent</h2>

  <p>
    Mature multiplexers already keep sessions alive and expose automation surfaces. Herdr packages a more specific
    contract: every agent gets a stable name, state, terminal identity, and command surface. A person can watch the
    TUI while another agent runs <code>herdr agent prompt reviewer "Check the diff" --wait</code>. Both use the same
    server-owned session.
  </p>

  <p>
    The server protocol is not a thin wrapper over keystrokes.
    <a href="https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/protocol/wire.rs#L15-L44" target="_blank" rel="noopener">Protocol version 20</a>
    frames requests over local sockets, caps normal payloads at 2 MB, and negotiates either semantic frames or
    terminal ANSI for rendering. The server owns the workspaces, tabs, panes, and PTYs. Clients come and go.
  </p>

  ${PullQuote({
    content: html`<p>An agent multiplexer becomes a runtime when control and lifecycle share the same durable session.</p>`,
  })}

  <p>
    That claim can be proven wrong. If state is too weak for automation, or recovery restores a layout without
    restoring the work, Herdr remains a good multiplexer with agent labels.
  </p>

  <h2>A prompt is one server operation</h2>

  ${FlowDiagram({
    label: 'Herdr agent prompt and wait path',
    steps: [
      {
        eyebrow: 'Resolve',
        title: 'Agent target',
        detail: html`Pin pane and terminal identity`,
        connector: 'validate',
        tone: 'blue',
      },
      {
        eyebrow: 'Submit',
        title: 'PTY input',
        detail: html`Write text, then encoded Enter`,
        connector: 'observe',
        tone: 'warm',
      },
      {
        eyebrow: 'Track',
        title: 'Lifecycle event',
        detail: html`Gate activity from a non-working start`,
        connector: 'settle',
        tone: 'rust',
      },
      {
        eyebrow: 'Return',
        title: 'Agent state',
        detail: html`Idle, done, or blocked`,
        tone: 'blue',
      },
    ],
  })}

  <p>
    The request handler first rejects an empty prompt. It resolves the named agent to a pane and checks that the
    pane still contains the expected foreground process. If the agent is already blocked, Herdr returns
    <code>agent_blocked</code> before it writes anything. Otherwise it encodes the prompt for the pane's live
    terminal mode, sends the text, waits 300 milliseconds, then sends Enter.
  </p>

  <p>
    The wait path records the event sequence and terminal identity before submission, so a replacement process cannot
    satisfy the old wait. From a non-working start, Herdr caps its activity gate at five seconds or the caller's
    shorter timeout. Only a longer caller timeout can produce <code>agent_prompt_stalled</code>. It then waits for
    <code>idle</code>, <code>done</code>, or <code>blocked</code> by default.
  </p>

  ${Callout({
    label: 'A lifecycle wait is not a turn receipt',
    body: html`<p>
      <a href="https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/api/wait.rs#L20-L305" target="_blank" rel="noopener">The wait code</a>
      tracks the pane occupant and state sequence, not a unique prompt or agent turn. If the agent is already
      working, completion of that earlier turn may satisfy the new wait. Callers still need output checks or an
      agent-native result ID when the distinction matters.
    </p>`,
  })}

  <h2>State has two authorities</h2>

  <p>
    Herdr can learn agent state from a native integration or from the terminal itself. Integrations call
    <a href="https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/app/api/panes.rs#L1231-L1288" target="_blank" rel="noopener"><code>pane.report_agent</code></a>
    with a source, sequence, state, and optional native session reference. Session-only integrations report an ID
    without changing waits or status. When no hook owns the state, Herdr inspects the foreground process and visible
    terminal shape.
  </p>

  ${CompareTable({
    headers: ['Authority', 'What Herdr gets', 'Limit'],
    rows: [
      ['Native report', 'Semantic state and optional session identity', 'Every agent exposes a different lifecycle'],
      ['Screen detection', 'Broad support from process and terminal output', 'Prompts, titles, and spinners change'],
    ],
    highlightRows: [0],
  })}

  <p>
    Version 0.8.2 shows the cost. Its fixes teach Qwen Code's localized confirmation states and strip new Claude Code
    title-spinner frames. Herdr can support a terminal agent without owning its API, but it must follow that agent's
    UI changes.
  </p>

  <p>
    The detector damps that noise. A transition from working to plain idle waits for repeated confirmation,
    and stable blocked signals refresh on a timer. The project docs still say an unfamiliar prompt can appear idle
    instead of blocked until Herdr learns its screen shape. That mistake changes the sidebar and waits. It does not
    make Herdr answer the prompt by itself.
  </p>

  ${SectionBreak()}

  <h2>Persistence has four meanings</h2>

  <p>
    “The session survives” is too vague for an agent runtime. A client can detach while the server and PTY keep
    running. A restarted server can restore workspace and pane state. Supported integrations can resume native
    agent conversations from stored IDs. Experimental handoff tries to transfer live panes to a new server during
    an update. Those are separate guarantees.
  </p>

  <p>
    Herdr keeps the separation in code.
    <a href="https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/persist.rs#L1-L19" target="_blank" rel="noopener"><code>persist.rs</code></a>
    stores session state, optional screen history, and plugins in different files. The native-resume layer accepts
    session references only from recognized Herdr integration sources, limits their size, and builds an agent-specific
    resume command. A saved screen and a resumed Codex conversation are not the same artifact.
  </p>

  ${CompareTable({
    headers: ['Recovery path', 'What can survive', 'What still needs proof'],
    rows: [
      ['Detach / reattach', 'Live server, PTY, process, terminal state', 'Multi-client behavior under long output'],
      ['Server restart', 'Layout, optional history, supported agent session ID', 'Conversation and child-process outcome'],
      ['Experimental handoff', 'Live pane process on supported Unix paths', 'Failure rollback and cross-platform behavior'],
    ],
    highlightRows: [0],
  })}

  <p>
    I inspected these paths but did not run the recovery test for this issue. The adoption verdict stays inside that
    evidence boundary: detach is a core product path, while restart and handoff need a controlled trial before any
    of them carry unattended work that matters.
  </p>

  <h2>Superlogical is the rival theory</h2>

  <p>
    Superlogical calls the missing layer a durable session around the work itself. Its
    <a href="https://www.superlogical.com/" target="_blank" rel="noopener">three-step plan</a> starts with a terminal
    multiplexer, makes its parts composable, then makes the system safe for production. The first product promises
    web, macOS, and iOS clients, live sharing, and native scrollback and selection.
  </p>

  <p>
    As of August 20, no public Superlogical multiplexer repository or beta was linked from its announcement or site. Its architecture is
    not available for a code comparison. The public claim I can test is narrower: it will use the same MIT-licensed
    <code>libghostty</code> components that
    <a href="https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/vendor/libghostty-vt.vendor.json#L1-L5" target="_blank" rel="noopener">Herdr already vendors</a>.
  </p>

  <p>
    <a href="https://github.com/ghostty-org/ghostty/blob/48ccec182a932c2ec04c344d45a5fc553861cb13/include/ghostty/vt/terminal.h" target="_blank" rel="noopener"><code>libghostty-vt</code>'s public terminal API</a>
    accepts terminal output, maintains screen state, and exposes it to an embedder. It does not create or manage the
    PTY. The public C API is also marked incomplete and subject to breaking changes, which explains why Herdr pins a
    source commit. Superlogical must still build process supervision, durable sessions, transport, auth, sharing,
    storage, and client policy.
  </p>

  ${PullQuote({
    content: html`<p>libghostty lowers the cost of terminal correctness. It does not ship the multiplexer.</p>`,
  })}

  <p>
    Herdr and Superlogical may fit together. Herdr is opinionated about coding agents and works inside an existing
    terminal over SSH. Superlogical says agents are one kind of work inside a wider session, with native and web
    clients from the start. They still compete for the durable terminal session. Partnership remains a theory until
    either project publishes an integration.
  </p>

  <h2>Use the narrowest owner that solves the job</h2>

  ${Prognosis({
    tag: 'signal',
    title: 'State must identify the work that finished',
    body: html`<p>
      Start two overlapping turns in one agent pane. Submit the second through <code>agent prompt --wait</code> while
      the first is working. The wait passes only if the caller can bind the returned state and output to the second
      request. Herdr does not provide that turn identity today; an agent-native receipt or output assertion must close it.
    </p>`,
  })}

  ${Prognosis({
    tag: 'signal',
    title: 'Recovery must preserve four different things',
    body: html`<p>
      Run the same Codex and Claude tasks through detach, server restart, and experimental handoff. Record the child
      process, terminal screen, native conversation, and accepted task result separately. A green layout alone does
      not pass.
    </p>`,
  })}

  <p>
    Try Herdr now when several CLI agents run on a local or remote machine and both a person and another agent need
    to inspect them. Keep the multiplexer you already trust when general terminal persistence matters more than native
    agent state. Watch Superlogical when live sharing, native clients, or production policy is the job, but wait for a
    beta before treating it as an alternative. Herdr has crossed the line from multiplexer to early runtime, but
    reliable turn identity and recovery will decide whether it stays there.
  </p>

  ${Sources({
    items: [
      {
        claim: 'Herdr v0.8.2 shipped on August 19 with Qwen support, Windows stable releases, and agent-state fixes',
        why: 'The fixes expose both the product velocity and the cost of terminal-derived state.',
        ref: 'Herdr v0.8.2 release',
        url: 'https://github.com/herdrdev/herdr/releases/tag/v0.8.2',
      },
      {
        claim: 'Herdr protocol v20 supports semantic frames and terminal ANSI with bounded frame sizes',
        why: 'The server/client boundary carries structured session state, not only keystrokes.',
        ref: 'Herdr wire protocol',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/protocol/wire.rs#L15-L44',
      },
      {
        claim: 'agent.prompt validates the target, rejects blocked agents, and writes text plus delayed Enter to the pane runtime',
        why: 'Prompt submission shares the same server-owned pane and PTY as the human client.',
        ref: 'Agent prompt handler',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/app/api/agents.rs#L13-L130',
      },
      {
        claim: 'Prompt waits bind terminal identity, require a state change, then wait for a settled lifecycle state',
        why: 'A replacement process cannot satisfy the old wait, but the wait still does not identify one turn.',
        ref: 'Agent wait path',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/api/wait.rs#L20-L305',
      },
      {
        claim: 'Herdr accepts semantic agent reports and separate native-session reports',
        why: 'State authority and resume identity are related but distinct.',
        ref: 'Agent report handlers',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/app/api/panes.rs#L1231-L1288',
      },
      {
        claim: 'Herdr pane constructors thread commands, launch environment, agent detection, and render signals into the runtime',
        why: 'The pane is a server-owned runtime object, not only a visual region in the client.',
        ref: 'Pane runtime construction',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/pane.rs#L1696-L1855',
      },
      {
        claim: 'Herdr pins a specific libghostty-vt source commit in its vendor manifest',
        why: 'The shared terminal engine is a code-level fact, not an inferred similarity between products.',
        ref: 'Herdr libghostty-vt manifest',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/vendor/libghostty-vt.vendor.json#L1-L5',
      },
      {
        claim: 'Session state, optional screen history, and plugin state use separate persistence paths',
        why: 'A restored layout, screen, process, and agent conversation are different guarantees.',
        ref: 'Session persistence',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/persist.rs#L1-L19',
      },
      {
        claim: 'Normal restore starts fresh shells in saved directories, while Unix handoff imports live pane runtimes through a separate path',
        why: 'Restart restoration and live-process handoff are different mechanisms with different guarantees.',
        ref: 'Restore and handoff entry points',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/persist/restore.rs#L64-L118',
      },
      {
        claim: 'Native resume accepts bounded references from recognized official source and agent pairs',
        why: 'Herdr stores agent identity as a typed recovery input instead of replaying screen text.',
        ref: 'Native agent resume',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/agent_resume.rs#L5-L120',
      },
      {
        claim: 'Herdr documents that unfamiliar terminal prompts can be misclassified until a screen rule is added',
        why: 'Broad agent support comes with a state-accuracy limit that affects waits.',
        ref: 'Herdr agent-state docs',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/docs/next/website/src/content/docs/agents.mdx#L49-L63',
      },
      {
        claim: 'The screen detector confirms working-to-idle transitions and periodically refreshes stable blocker signals',
        why: 'Herdr adds temporal damping around screen-derived state instead of publishing every observation.',
        ref: 'Agent detection transitions',
        url: 'https://github.com/herdrdev/herdr/blob/624dfd4796559042ec13ccf4d4b54374902ab81d/src/pane/agent_detection.rs#L5-L210',
      },
      {
        claim: 'Superlogical announced a terminal multiplexer built on public libghostty components',
        why: 'The launch validates the session layer as a product bet but does not prove an implementation.',
        ref: 'Mitchell Hashimoto announcement',
        url: 'https://mitchellh.com/writing/superlogical',
      },
      {
        claim: 'Superlogical plans durable terminal blocks, web and Apple clients, sharing, composability, and production operation',
        why: 'Its stated product boundary is wider than Herdr\'s current agent-runtime focus.',
        ref: 'Superlogical product plan',
        url: 'https://www.superlogical.com/',
      },
      {
        claim: 'libghostty-vt parses terminal streams and maintains state while PTY ownership remains outside it',
        why: 'A reusable terminal engine removes one hard part but leaves the session product to its consumer.',
        ref: 'libghostty direction',
        url: 'https://mitchellh.com/writing/libghostty-is-coming',
      },
      {
        claim: 'The pinned libghostty-vt C API exposes terminal lifecycle, byte input, resize, properties, and state references',
        why: 'This is the inspectable terminal-engine surface available to multiplexer builders.',
        ref: 'Ghostty terminal C API',
        url: 'https://github.com/ghostty-org/ghostty/blob/48ccec182a932c2ec04c344d45a5fc553861cb13/include/ghostty/vt/terminal.h',
      },
      {
        claim: 'Ghostty marks the libghostty-vt C API incomplete and unstable',
        why: 'A shared engine can reduce terminal work while still imposing version and integration risk.',
        ref: 'Ghostty libghostty-vt header',
        url: 'https://github.com/ghostty-org/ghostty/blob/48ccec182a932c2ec04c344d45a5fc553861cb13/include/ghostty/vt.h',
      },
      {
        claim: 'Mitchell Hashimoto states that libghostty-vt does not create or manage a PTY',
        why: 'The product around the library must still own child-process lifetime and session semantics.',
        ref: 'Ghostty discussion #11348',
        url: 'https://github.com/ghostty-org/ghostty/discussions/11348',
      },
    ],
  })}
</article>`;
}

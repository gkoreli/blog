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
  title: 'OSS Radar #03: Buzz Is Slack on AIroids',
  seoTitle: 'Buzz Review: Open-Source Slack for AI Agents',
  alternativeHeadline: 'Block gave AI agents signed accounts and shared compute in team chat',
  date: '2026-07-24',
  description: 'Buzz gives agents signed accounts and shared local compute. Delegation reliability and private code access remain unfinished.',
  section: 'oss-radar',
  tags: ['oss-radar', 'open-source', 'agents', 'collaboration', 'buzz', 'nostr'],
  layout: 'immersive',
  featured: false,
  images: [],
  slug: 'oss-radar-03-buzz-is-slack-on-airoids',
};

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #03',
    date: 'July 2026',
    tags: 'open-source · agents · collaboration · coordination',
    title: html`<h1>Buzz Is Slack on <em>AIroids</em></h1>`,
    subtitle: 'Agents get signed accounts; members on Apple Silicon can lend a local model.',
    author: 'Goga Koreli',
    readTime: '9 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
  <p>
    Block launched <a href="https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together" target="_blank" rel="noopener">Buzz</a>
    on July 21 as an open-source workspace with team chat and signed work records for people and agents. Buzz
    can run Codex and Claude Code, and its Apple Silicon build lets members lend local model compute. A team
    assigns work and sees who acted. Restart-safe delegation and private repository reads remain unfinished.
    <strong>Buzz is Slack on AIroids.</strong>
  </p>

  ${StatRow({
    items: [
      { value: '1 key', label: html`Each human or agent signs its events` },
      { value: '12 msgs', label: html`Threads and DMs load this history by default` },
    ],
  })}

  <h2>Agents join the same rooms</h2>

  ${CompareTable({
    headers: ['Surface', 'Buzz feature', 'Result'],
    rows: [
      ['Workspace', 'Channels and DMs', 'People and agents share one room'],
      ['Agents', 'Signed accounts and work history', 'Each signed event has an author'],
    ],
    highlightRows: [1],
  })}

  <p>
    Buzz connects runtimes through the Agent Client Protocol (ACP) over stdio. Codex and Claude Code need ACP
    adapters. If either runtime creates a Git worktree or delegates to another agent, that runtime supplies the
    tool. Buzz queues the room message and records the reply. Its pool can process separate channels at once,
    but every process in one pool uses the same Buzz identity.
  </p>

  <h2>Each agent gets a key</h2>

  <p>
    Buzz gives each person and agent a Nostr key. In its draft owner-agent scheme, an owner signs an attestation
    for an agent key, and the agent signs its own events. The attestation records provenance; relay membership
    still controls access. Block states the rule: <em>“authorization does not erase authorship.”</em>
  </p>

  ${FlowDiagram({
    label: 'From owner attestation to signed work',
    steps: [
      {
        eyebrow: 'Human identity',
        title: 'Human key',
        detail: html`Signs the attestation`,
        connector: 'attests to',
        tone: 'blue',
      },
      {
        eyebrow: 'Agent identity',
        title: 'Agent key',
        detail: html`Signs its own work`,
        connector: 'produces',
        tone: 'warm',
      },
      {
        eyebrow: 'Signed activity',
        title: 'Work events',
        detail: html`Chat and code activity`,
        connector: 'records',
      },
      {
        eyebrow: 'Audit trail',
        title: 'Work record',
        detail: html`Signed event history`,
        tone: 'rust',
      },
    ],
  })}

  ${CompareTable({
    headers: ['Relay check', 'Shipped behavior', 'Result'],
    rows: [
      ['Identity', 'Verifies event signature and signed-in key', 'Binds a signed event to one account'],
      ['Member-only access', 'Closed workspaces and non-open channels check membership', 'Ordinary writes honor those rules'],
    ],
    highlightRows: [0, 1],
  })}

  <p>
    Buzz binds each accepted event to the authenticated key and verifies its channel access.
  </p>

  <p>
    A shared bot account can hide which agent announced or approved a change. Buzz keeps each agent's events
    separate across chat and Git. If someone steals a key, an admin can remove its relay access without
    changing the owner's account.
  </p>

  <p>
    The agent key does not change when its model or harness changes. Buzz should show those changes, or readers
    may assume the same software still runs it.
  </p>

  <h3>The controls are unfinished</h3>

  ${CompareTable({
    headers: ['Control', 'Current state', 'Gap'],
    rows: [
      ['Action rights', 'Channel membership controls access', 'No per-action approval'],
      ['Human approval', 'Workflow creates an approval token', 'Cannot resume after approval'],
    ],
    highlightRows: [0, 1],
  })}

  <p>
    Buzz's workflow schema accepts schedule and HTTP webhook triggers. Owner attestation remains a draft Nostr
    extension that records provenance, while relay membership controls access. Human approval uses a separate
    workflow step that cannot yet resume a run;
    <a href="https://github.com/block/buzz/issues/2376" target="_blank" rel="noopener">Issue #2376</a>
    remains open and tracks the missing support.
  </p>

  ${Callout({
    label: 'The audit fix leaves old rows behind',
    body: html`<p>
      <a href="https://github.com/block/buzz/issues/2637" target="_blank" rel="noopener">Issue #2637</a>
      reported that Postgres cut timestamp precision after Buzz hashed each audit entry. Buzz closed it on
      July 24 after
      <a href="https://github.com/block/buzz/commit/264a56a2260ac87350bfe1f5d3ec3d89615eb47c" target="_blank" rel="noopener">the fix</a>
      began hashing new entries at the precision Postgres stores. The change does not repair old rows, so
      operators must re-anchor chains they need.
    </p>`,
  })}

  <h3>Some work stays outside the event log</h3>

  <p>
    Buzz signs chat and Git events. Git objects live in another store, and voice frames never enter the event
    log. A reviewer can see which key announced a push or approved a change. Teams must check linked objects
    and later jobs elsewhere.
  </p>

  <h2>Models still lose context</h2>

  <p>
    Buzz keeps chat and agent work in one record. After a restart, an agent can search it, but only selected
    room history and memory enter the prompt. The relay may hold six months of chat while the model sees a
    small part of it.
  </p>

  ${CompareTable({
    headers: ['Control', 'What the code does', 'Limit'],
    rows: [
      ['Prompt input', 'Channel mentions omit history; threads and DMs load 12 messages', 'Large messages can still fill the prompt'],
      ['Recall', 'Loads core memory and offers full-text search', 'The agent must fetch notes or choose useful search words'],
    ],
    highlightRows: [0, 1],
  })}

  <p>
    Buzz searches stored events with Postgres full-text search, which matches exact terms and may miss
    paraphrases. The agent must choose a query and inspect the results.
  </p>

  <p>
    Buzz loads core memory only when a new ACP session starts. Named memories require a lookup, and a long
    session may keep an old core record. Named memories stay out of the prompt until the agent fetches them.
  </p>

  <p>
    Room history is shared. Buzz keeps each memory note with one agent-owner pair. A team can pass facts through
    chat; Buzz has no common team memory store.
  </p>

  <p>
    ACP prompts carry full event IDs and tags. During a long native session, a handoff replaces old history
    with a model-written summary. After ten handoffs, Buzz drops older turns.
  </p>

  ${PullQuote({
    content: html`<p>Stored history helps only when an agent loads it.</p>`,
  })}

  <p>
    When Buzz runs Codex or Claude Code through ACP, each runtime controls its own context and compaction.
    Buzz can track reported token use and add room history. The repository has no benchmark that compares
    token use with and without Buzz.
  </p>

  ${Callout({
    label: 'One cost report',
    body: html`<p>
      <a href="https://github.com/block/buzz/issues/2631" target="_blank" rel="noopener">Issue #2631</a>
      reports one snapshot with four agents and about 220 Codex descendants. The same local history held
      17.7 million cumulative tokens across 40 Buzz-created threads over three days. The reporter traced the
      process spike to eager 24-worker pools and notes that billed use may differ.
    </p>`,
  })}

  <h3>Activity is not a terminal</h3>

  <p>
    Buzz can show a parsed activity feed or raw ACP JSON-RPC frames. A local owner can stop the current turn.
    The view cannot attach to the agent's terminal or accept terminal input. Buzz can open a separate shell at
    the project checkout, but that shell does not join the running agent process.
  </p>

  <p>
    Buzz's native agent keeps sessions in memory and advertises <code>loadSession: false</code>. A restarted
    process starts a new ACP session and rebuilds context from the room and memory tools. It also waits for one
    non-streaming model response per round. Codex and Claude Code keep their own session rules behind their ACP
    adapters.
  </p>

  ${Callout({
    label: 'A latency report, not a benchmark',
    body: html`<p>
      <a href="https://github.com/block/buzz/issues/2386" target="_blank" rel="noopener">Issue #2386</a>
      timed four short replies at 13 to 31 seconds. The sample has no matched run in a direct agent terminal.
      It cannot show whether the relay, queue, ACP session, model call, or reply publish caused the delay.
    </p>`,
  })}

  <h3>Buzz restarts crashed agent processes</h3>

  <p>
    The ACP layer sends one prompt at a time per channel and batches later events. If an agent process crashes,
    Buzz starts a new one. These controls do not replay work missed while the agent was offline.
  </p>

  ${Callout({
    label: 'Agents can miss stored messages',
    body: html`<p>
      ACP subscribes to events from about five seconds before startup, and its default <code>mentions</code> mode
      accepts only tagged events.
      Open <a href="https://github.com/block/buzz/issues/1743" target="_blank" rel="noopener">issue #1743</a>
      reports missed offline mentions; open <a href="https://github.com/block/buzz/issues/2270" target="_blank" rel="noopener">issue #2270</a>
      reports missed untagged thread replies.
    </p>`,
  })}

  <h2>Members can lend a local model</h2>

  <p>
    Buzz's Apple Silicon release build includes shared compute through MeshLLM. A member picks a local model
    and turns on <em>Share this machine</em>. Buzz then offers that model to other members through a local
    OpenAI-compatible endpoint. Signed discovery data binds the member key to the serving node, and current
    community membership controls which nodes may serve.
  </p>

  ${CompareTable({
    headers: ['Part', 'Shipped path', 'Boundary'],
    rows: [
      ['Agent runtime', 'Fizz runs through buzz-acp and buzz-agent', 'Codex and Claude Code keep their own provider setup'],
      ['Model compute', 'MeshLLM sends inference to a member node', 'No price, payment, or per-member quota'],
    ],
    highlightRows: [0, 1],
  })}

  <p>
    The runbook traces the built-in Fizz path from desktop to <code>buzz-acp</code>, <code>buzz-agent</code>,
    MeshLLM, and a member model. Shared compute acts as an LLM provider. It does not move a Codex or Claude
    Code harness to another member's machine.
  </p>

  <p>
    MeshLLM carries inference over direct QUIC or encrypted Iroh relays; the Buzz relay handles membership and
    discovery. The local provider caps an answer at 4,096 tokens and turns off model thinking. Buzz's code says
    this keeps output inside smaller local-model context windows. That choice favors short work. Buzz has no
    result that compares it with the same model outside Buzz.
  </p>

  <p>
    <a href="https://nips.nostr.com/57" target="_blank" rel="noopener">NIP-57</a> defines Lightning zaps for
    Nostr, which gives Buzz a possible payment path. Buzz has no price, wallet, usage ledger, or member quota
    in shared compute.
  </p>

  <h2>Git review stays in Buzz</h2>

  <p>
    Buzz runs a Git server. Its Projects preview shows pull requests and review decisions. Teams can host Git
    without GitHub, while runners and security tools remain outside Buzz.
  </p>

  ${Callout({
    label: 'Private channels leave repositories readable',
    body: html`<p>
      Open <a href="https://github.com/block/buzz/issues/2469" target="_blank" rel="noopener">issue #2469</a>
      says every signed-in member of a Buzz community can read each hosted repository, including projects tied
      to private channels. Channel roles limit pushes while reads remain open.
      <a href="https://github.com/block/buzz/pull/2539" target="_blank" rel="noopener">PR #2539</a>
      adds private repository reads and remains open and unmerged.
    </p>`,
  })}

  ${SectionBreak()}

  <h2>One relay runs each community</h2>

  <p>
    Block calls Buzz decentralized because it uses Nostr keys and signed events. One relay holds each
    community's record, and Buzz has no peer or relay replication. A team can run its own relay and reuse its
    keys on another server. Each community still depends on one operator for service and access.
  </p>

  ${Callout({
    label: 'Who can read hosted Buzz',
    body: html`<p>
      Hosted messages and DMs lack end-to-end encryption. Block may read them or send them to outside model
      providers; by default, it keeps messages and media for up to 180 days.
    </p>`,
  })}

  <p>
    A self-hosted team controls its relay. Remote model providers may still receive prompts. The team must
    also run four persistent data volumes and own upgrades and recovery.
  </p>

  <h2>Try one project room</h2>

  ${CompareTable({
    headers: ['Trial', 'Use it when', 'Risk'],
    rows: [
      ['Hosted', 'Two agents handle non-sensitive work', 'Block and model providers may read the work'],
      ['Self-hosted', 'The team can run the relay and data stores', 'Model providers may still see prompts'],
    ],
    highlightRows: [0],
  })}

  <p>
    Wait when work needs reliable approval or offline delivery, or when code must stay private.
  </p>

  <p>
    Run the same tasks in Buzz and one direct agent runtime. Hold the inputs, model, token limit, and pass
    condition fixed. For shared compute, use the same local model on both paths. Measure time to the first
    visible step, completion time, tokens, extra messages, and task result. Stop if Buzz adds cost without
    cutting coordination work.
  </p>

  <h2>Low-risk work is the current limit</h2>

  ${Prognosis({
    tag: 'signal',
    title: 'Delegation survives a restart',
    body: html`<p>
      Pause a code-writing run for human approval, restart the relay service, then approve it. The run should
      resume once. Next, mention an offline agent and restart it; the saved work should arrive once. Both tests
      must pass before teams trust work that waits for approval.
    </p>`,
  })}

  ${Prognosis({
    tag: 'signal',
    title: 'Private project code follows room access',
    body: html`<p>
      A private-channel member should clone its repository. A signed-in non-member should get the same response
      as a missing repository.
    </p>`,
  })}

  <p>
    The agent account gives each agent durable authorship; shared compute lets members lend a local model. Keep
    merge rights and secrets outside Buzz until the restart and private-read tests pass.
  </p>

  ${Sources({
    items: [
      {
        claim: 'Block launched Buzz on July 21 with an Apache-2.0 license and self-hosting support',
        why: 'Teams can inspect the code and run their own server.',
        ref: 'Block launch',
        url: 'https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together',
      },
      {
        claim: 'Buzz provides Slack-like workspace tools and connects to separate agent runtimes',
        why: 'Teams can change the runtime without replacing the workspace.',
        ref: 'Buzz vision',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/VISION.md',
      },
      {
        claim: 'buzz-acp accepts any stdio ACP agent and can process separate channels in parallel',
        why: 'The runtime supplies worktrees and delegation; Buzz supplies the queue and shared identity.',
        ref: 'ACP bridge',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-acp/README.md',
      },
      {
        claim: 'Agents have their own keys and revocable relay access',
        why: 'An agent keeps its authorship when an owner attests to its key.',
        ref: 'Block Engineering',
        url: 'https://engineering.block.xyz/blog/buzz',
      },
      {
        claim: 'Owner attestation remains an optional draft Nostr extension',
        why: 'Relay access and action approval remain separate.',
        ref: 'NIP-OA draft',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/docs/nips/NIP-OA.md',
      },
      {
        claim: 'The relay verifies each signed event and matches its key to the signed-in key',
        why: 'An accepted event belongs to one authenticated account.',
        ref: 'Relay ingest',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-relay/src/handlers/ingest.rs#L1459-L1503',
      },
      {
        claim: 'Closed Buzz workspaces check membership during NIP-42 authentication',
        why: 'Workspace membership remains a separate access check.',
        ref: 'Relay authentication',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-relay/src/handlers/auth.rs#L216-L238',
      },
      {
        claim: 'Ordinary writes to non-open channels pass a membership check',
        why: 'Private channel writes require membership.',
        ref: 'Relay access checks',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-relay/src/handlers/ingest.rs#L1762-L1802',
      },
      {
        claim: 'The workflow engine fails runs that reach request_approval',
        why: 'Buzz cannot yet resume work after a person approves it.',
        ref: 'Workflow engine',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-workflow/src/lib.rs#L191-L208',
      },
      {
        claim: 'The Buzz workflow schema accepts schedules and HTTP webhooks',
        why: 'The workflow format covers recurring work and outside triggers.',
        ref: 'Workflow triggers',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-workflow/src/schema.rs#L33-L68',
      },
      {
        claim: 'Open issue #2376 tracks work to pause and resume runs for approval',
        why: 'The missing approval path remained open on July 25.',
        ref: 'Buzz issue #2376',
        url: 'https://github.com/block/buzz/issues/2376',
      },
      {
        claim: 'Closed issue #2637 reported audit failures after timestamps lost precision',
        why: 'The report found why old audit chains failed verification.',
        ref: 'Buzz issue #2637',
        url: 'https://github.com/block/buzz/issues/2637',
      },
      {
        claim: 'Commit 264a56a hashes new audit entries at Postgres timestamp precision',
        why: 'New rows can verify, but the change does not repair old rows.',
        ref: 'Audit precision fix',
        url: 'https://github.com/block/buzz/commit/264a56a2260ac87350bfe1f5d3ec3d89615eb47c',
      },
      {
        claim: 'Large objects stay outside the event log, one relay holds each community, and ACP restarts crashed agents',
        why: 'Event signatures cover only part of the system; one relay and other stores remain required.',
        ref: 'Buzz architecture',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/ARCHITECTURE.md',
      },
      {
        claim: 'Buzz loads 12 messages for threads and DMs; agents must request ordinary channel history',
        why: 'The fixed limit uses fewer prompt tokens but leaves recall to the agent.',
        ref: 'ACP context configuration',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-acp/src/config.rs#L364-L368',
      },
      {
        claim: 'ACP prompt blocks retain full event metadata and tags',
        why: 'Those fields add tokens to each prompt.',
        ref: 'ACP prompt formatting',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-acp/src/queue.rs#L1067-L1142',
      },
      {
        claim: 'The native agent summarizes near its context limit, then drops old turns after repeated handoffs',
        why: 'The agent can lose facts during long tasks even when the room keeps them.',
        ref: 'Native context handoff',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-agent/src/handoff.rs#L30-L107',
      },
      {
        claim: 'Buzz loads core memory at session start; agents must fetch named memories',
        why: 'Long sessions can use old core memory, while named notes need a lookup.',
        ref: 'Agent memory specification',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-acp/src/engram_fetch.rs',
      },
      {
        claim: 'Each Buzz memory note belongs to one agent-owner pair',
        why: 'Shared room history does not create one common team memory store.',
        ref: 'Agent memory records',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/docs/nips/NIP-AE.md',
      },
      {
        claim: 'History retrieval uses filtered Postgres full-text search',
        why: 'Recall depends on useful search words.',
        ref: 'Search query implementation',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-search/src/query.rs#L198-L323',
      },
      {
        claim: 'Git clone, fetch, and push ship through standard Smart HTTP',
        why: 'Teams can host code on Buzz itself.',
        ref: 'Git transport',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-relay/src/api/git/transport.rs#L1-L9',
      },
      {
        claim: 'The Projects preview builds pull-request views and review decisions from signed events',
        why: 'Review work can happen inside Buzz.',
        ref: 'Projects pull-request code',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/desktop/src/features/projects/projectPullRequests.mjs#L1-L114',
      },
      {
        claim: 'Issue #2631 reports about 220 Codex descendants and 17.7 million cumulative tokens',
        why: 'Eager 24-worker pools can raise local cost; the report does not measure normal or billed use.',
        ref: 'Buzz issue #2631',
        url: 'https://github.com/block/buzz/issues/2631',
      },
      {
        claim: 'The activity panel can show raw ACP JSON-RPC frames and stop a local turn',
        why: 'People can inspect protocol activity, but they cannot attach to the live agent terminal.',
        ref: 'Agent activity panel',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/desktop/src/features/channels/ui/AgentSessionThreadPanel.tsx#L276-L363',
      },
      {
        claim: 'The native Buzz agent uses non-streaming model calls and cannot load a saved session',
        why: 'A process restart loses its in-memory session, and each model round arrives as one response.',
        ref: 'Native agent',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-agent/README.md',
      },
      {
        claim: 'The project terminal command opens a separate shell at the project checkout',
        why: 'It does not attach the user to the agent’s live process.',
        ref: 'Project terminal',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/desktop/src-tauri/src/commands/project_terminal.rs',
      },
      {
        claim: 'Issue #2386 timed four short replies at 13 to 31 seconds',
        why: 'The small sample flags latency but does not isolate its cause.',
        ref: 'Buzz issue #2386',
        url: 'https://github.com/block/buzz/issues/2386',
      },
      {
        claim: 'Open issue #1743 reports that an offline agent can miss a stored mention',
        why: 'The agent cannot act on a message it never receives.',
        ref: 'Buzz issue #1743',
        url: 'https://github.com/block/buzz/issues/1743',
      },
      {
        claim: 'Open issue #2270 reports ignored thread replies unless the agent gets a fresh tag',
        why: 'A person may need to tag the same agent on every turn.',
        ref: 'Buzz issue #2270',
        url: 'https://github.com/block/buzz/issues/2270',
      },
      {
        claim: 'ACP first subscribes from about five seconds before process startup',
        why: 'Older offline mentions may remain unprocessed.',
        ref: 'ACP startup watermark',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-acp/src/lib.rs#L1325-L1353',
      },
      {
        claim: 'Default ACP mention mode adds a tag filter to the relay subscription',
        why: 'An untagged thread reply does not reach the agent.',
        ref: 'ACP relay filter',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-acp/src/relay.rs#L3171-L3194',
      },
      {
        claim: 'Buzz enables MeshLLM shared compute in its Apple Silicon release build',
        why: 'The feature ships on one supported build rather than across every desktop release.',
        ref: 'Release workflow',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/.github/workflows/release.yml',
      },
      {
        claim: 'Buzz documents the Fizz path to a member model over direct QUIC or encrypted Iroh relays',
        why: 'The runbook traces one shared-compute path and keeps model traffic off the Buzz relay.',
        ref: 'Shared compute runbook',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/docs/buzz-shared-compute-dev.md',
      },
      {
        claim: 'The shared provider caps output at 4,096 tokens and disables model thinking',
        why: 'The settings bound what a shared local model can return in one round.',
        ref: 'Shared provider settings',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/desktop/src-tauri/src/managed_agents/relay_mesh.rs#L11-L48',
      },
      {
        claim: 'NIP-57 defines Lightning zaps for Nostr',
        why: 'Nostr offers a payment path, but Buzz shared compute does not ship one.',
        ref: 'NIP-57',
        url: 'https://nips.nostr.com/57',
      },
      {
        claim: 'Open issue #2469 says every authenticated community member can read each hosted repository',
        why: 'A private project channel can expose its code to the whole community.',
        ref: 'Buzz issue #2469',
        url: 'https://github.com/block/buzz/issues/2469',
      },
      {
        claim: 'Open PR #2539 adds channel-scoped private repository reads but remains unmerged',
        why: 'Private channel code still lacks shipped read controls.',
        ref: 'Buzz PR #2539',
        url: 'https://github.com/block/buzz/pull/2539',
      },
      {
        claim: 'Hosted messages and DMs lack end-to-end encryption, and Block may access them',
        why: 'The relay operator may read sensitive work.',
        ref: 'Buzz support',
        url: 'https://block.github.io/buzz/support.html',
      },
      {
        claim: 'Block may send channel content to model providers and keep messages or media for up to 180 days',
        why: 'Outside model providers may receive workspace content.',
        ref: 'Buzz privacy notice',
        url: 'https://block.github.io/buzz/privacy.html',
      },
      {
        claim: 'The production stack requires four persistent data volumes',
        why: 'The team owns every backup and restore.',
        ref: 'Deployment guide',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/deploy/compose/README.md#L26-L42',
      },
    ],
  })}
</article>
  `;
}

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
  alternativeHeadline: 'Block gave AI agents signed identities in team chat',
  date: '2026-07-24',
  description: 'Buzz gives AI agents signed workspace accounts. Event signatures work, but approval and offline delivery remain unfinished.',
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
    title: html`<h1>Buzz Is Slack<br>on <em>AIroids</em></h1>`,
    subtitle: 'Buzz keeps signed agent records across restarts. Approval and offline delivery remain unfinished.',
    author: 'Goga Koreli',
    readTime: '7 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
  <p>
    Block launched <a href="https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together" target="_blank" rel="noopener">Buzz</a>
    on July 21 as an open-source workspace with team chat and signed work records for people and agents. Buzz
    can run Codex and Claude Code; a team assigns work and sees who acted. Buzz signs each agent's events, but
    approval and offline delivery remain unfinished. <strong>Buzz is Slack on AIroids.</strong>
  </p>

  ${StatRow({
    items: [
      { value: '1 key', label: html`Each human or agent<br>signs its events` },
      { value: '12 msgs', label: html`Threads and DMs load<br>this history by default` },
    ],
  })}

  <h2>Slack where agents are members</h2>

  <p>
    Buzz has Slack's channels and DMs, where agents join as members. People can assign work and trace signed
    events in the same workspace.
  </p>

  ${CompareTable({
    headers: ['Surface', 'Buzz feature', 'Result'],
    rows: [
      ['Workspace', 'Channels and DMs', 'Competes with Slack'],
      ['Agents', 'Signed accounts and work history', 'Each action has an author'],
    ],
    highlightRows: [1],
  })}

  <p>
    Buzz can run Codex and Claude Code as agents while it controls membership and work history.
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
        detail: html`One searchable history`,
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
    A shared bot account can hide which agent changed a file. Buzz keeps each agent's events separate across
    chat and Git. If someone steals a key, an admin can remove its relay access without changing the owner's
    account.
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
    Owner attestation remains a draft Nostr extension that records provenance. Relay membership controls
    access. Human approval uses a separate workflow step that cannot yet resume a run;
    <a href="https://github.com/block/buzz/issues/2376" target="_blank" rel="noopener">Issue #2376</a>
    tracks the missing support.
  </p>

  ${Callout({
    label: 'A reported audit failure',
    body: html`<p>
      <a href="https://github.com/block/buzz/issues/2637" target="_blank" rel="noopener">Issue #2637</a>
      reports that the verifier rejects every audit chain stored in Postgres because Buzz hashes nanosecond
      timestamps while Postgres stores microseconds. Event signatures show authorship; the audit service cannot
      yet tell whether stored history changed.
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
    Buzz keeps chat and agent work in one record. After a restart, an agent can search it, but the model still
    gets a limited prompt and a model-written summary. The relay may hold six months of chat; only selected
    messages enter the prompt.
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
    session may keep an old core record. This lowers prompt use but can leave the agent with stale facts.
  </p>

  <p>
    ACP prompts carry full event IDs and tags. The native agent resends saved history and tool schemas
    during tool calls. Its handoff replaces old history with a model-written summary; after ten handoffs,
    Buzz drops older turns.
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
      says four configured agents spawned about 220 Codex processes and used 17.7 million tracked tokens.
      The reporter says Buzz pre-started too many agent processes. A bad pool setup can raise both process
      count and token use.
    </p>`,
  })}

  <h3>Live ACP sessions restart crashed agents</h3>

  <p>
    The ACP layer sends one prompt at a time per channel and batches later events. If an agent process crashes,
    Buzz starts a new one. These controls do not replay work missed while the agent was offline.
  </p>

  ${Callout({
    label: 'Agents can miss stored messages',
    body: html`<p>
      ACP replays events from about five seconds before startup, and its default <code>mentions</code> mode
      accepts only tagged events.
      <a href="https://github.com/block/buzz/issues/1743" target="_blank" rel="noopener">Issue #1743</a>
      reports missed offline mentions; <a href="https://github.com/block/buzz/issues/2270" target="_blank" rel="noopener">issue #2270</a>
      reports missed untagged thread replies.
    </p>`,
  })}

  <h2>Git review happens in chat</h2>

  <p>
    Buzz runs a Git server. Its Projects preview shows pull requests and review decisions. Teams can host Git
    without GitHub, while runners and security tools remain outside Buzz.
  </p>

  ${Callout({
    label: 'Private channels leave repositories readable',
    body: html`<p>
      <a href="https://github.com/block/buzz/issues/2469" target="_blank" rel="noopener">Issue #2469</a>
      says every signed-in member of a Buzz community can read each hosted repository, including projects tied
      to private channels. Channel roles limit pushes while reads remain open.
      <a href="https://github.com/block/buzz/pull/2539" target="_blank" rel="noopener">PR #2539</a>
      adds private repository reads and remains unmerged.
    </p>`,
  })}

  ${SectionBreak()}

  <h2>One relay runs each community</h2>

  <p>
    Block calls Buzz decentralized because it uses Nostr keys and signed events. One relay holds each
    community's record; clients and relays do not copy events elsewhere. A team can run its own relay and reuse
    its keys on another server. Each community still depends on one operator for service and access.
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
    also run four data stores and own upgrades and recovery.
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
    Wait when work needs working approval and offline delivery, or when code must stay private.
  </p>

  <p>
    Run the same tasks in Buzz and one direct agent runtime. Hold the inputs and pass condition fixed, including
    the model and token limit. Count extra messages and rework. Stop if Buzz adds cost without cutting
    coordination work.
  </p>

  <h2>Low-risk work is the current limit</h2>

  ${Prognosis({
    tag: 'signal',
    title: 'Approval and delivery pass restart tests',
    body: html`<p>
      Pause a code-writing run for human approval, restart the relay service, then approve it. The run should
      resume once. Next, mention an offline agent and restart it; the saved work should arrive once. Both tests
      must pass before teams trust approval-gated delegation.
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
    Buzz's strongest idea is the agent account: a key and work record that survive the model session. Keep
    merge rights and secrets outside Buzz until the approval restart, offline delivery, and private-repository
    tests pass.
  </p>

  <div class="radar-research-note">
    <strong>Research state</strong>
    I audited <code>block/buzz</code> <code>main</code> at <code>cfdea818</code> on July 24, 2026, after the
    July 21 launch. Issues #1743, #2270, #2376, #2469, #2631, and #2637 were open; PR #2539 was open and
    unmerged. Issue #2631 covers Desktop v0.4.23. I treat issue behavior as reported unless cited code confirms it.
  </div>

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
        claim: 'Open issue #2376 tracks work to pause and resume runs for approval',
        why: 'The missing approval path remains open at the research cutoff.',
        ref: 'Buzz issue #2376',
        url: 'https://github.com/block/buzz/issues/2376',
      },
      {
        claim: 'Open issue #2637 reports audit verification failures after timestamps lose precision',
        why: 'The audit service cannot yet distinguish clean history from changed history.',
        ref: 'Buzz issue #2637',
        url: 'https://github.com/block/buzz/issues/2637',
      },
      {
        claim: 'Large objects live outside the event log, and voice frames are ephemeral',
        why: 'Signed events identify the work; other stores hold its contents.',
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
        claim: 'One relay holds each community record; Buzz has no peer or relay replication',
        why: 'One operator controls service and access for each community.',
        ref: 'Buzz architecture',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/ARCHITECTURE.md',
      },
      {
        claim: 'Open issue #2631 links about 220 Codex processes and 17.7 million tracked tokens to pre-started agents',
        why: 'Bad pool settings can raise token use; the issue does not measure normal use.',
        ref: 'Buzz issue #2631',
        url: 'https://github.com/block/buzz/issues/2631',
      },
      {
        claim: 'ACP sends one prompt per channel and restarts crashed agent processes',
        why: 'Crash recovery can still miss older work.',
        ref: 'ACP architecture',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/ARCHITECTURE.md',
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

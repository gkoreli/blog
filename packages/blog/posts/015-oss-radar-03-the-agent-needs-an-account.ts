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
  description: 'Buzz gives AI agents signed workspace accounts. Its context controls limit prompt size, but model-written summaries can lose facts.',
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
    subtitle: 'Block built team chat for AI agents. Signed records survive restarts, while model context stays limited.',
    author: 'Goga Koreli',
    readTime: '8 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
  <p>
    Block launched <a href="https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together" target="_blank" rel="noopener">Buzz</a>
    on July 21 as an open-source workspace with team chat and signed work records for people and agents. Buzz
    can run Codex and Claude Code; a team assigns work and sees who acted. <strong>Buzz is Slack on AIroids.</strong>
  </p>

  ${StatRow({
    items: [
      { value: '1 key', label: html`Each human or agent<br>signs its events` },
      { value: '12 msgs', label: html`Default history loaded<br>for threads and DMs` },
    ],
  })}

  <h2>Slack for software coworkers</h2>

  <p>
    Buzz has Slack's channels and DMs, where agents join as members. People can assign work and trace signed
    events in the same workspace.
  </p>

  ${CompareTable({
    headers: ['Surface', 'Buzz feature', 'Result'],
    rows: [
      ['Workspace', 'Channels and DMs', 'Direct Slack rival'],
      ['Agents', 'Signed accounts and work history', 'Each action has an author'],
    ],
    highlightRows: [1],
  })}

  <p>
    Codex and Claude Code run as workers inside Buzz. Buzz controls who joins and what work the team can inspect.
  </p>

  <h2>Each agent gets a key</h2>

  <p>
    Buzz gives each person and agent a Nostr key. In its draft owner-agent scheme, the owner grants access and
    the agent signs its own work. The signatures record who approved the work and who did it. Block states the
    rule: <em>“authorization does not erase authorship.”</em>
  </p>

  ${FlowDiagram({
    label: 'From approval to signed work',
    steps: [
      {
        eyebrow: 'Human identity',
        title: 'Human key',
        detail: html`Grants access`,
        connector: 'authorizes',
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

  <p>
    A shared bot account hides which agent changed a file. A separate key records which agent made the change
    in chat and Git. If someone steals that key, an admin can remove its relay access without changing the
    owner's account.
  </p>

  <p>
    The agent key does not change when its model or harness changes. Buzz should show those changes, or readers
    may assume the same software still runs it.
  </p>

  <h3>The controls are unfinished</h3>

  ${CompareTable({
    headers: ['Control', 'Current state', 'Gap'],
    rows: [
      ['Action rights', 'Channel membership controls access', 'No per-action limits'],
      ['Human approval', 'Workflow creates an approval token', 'Cannot resume after approval'],
    ],
    highlightRows: [0, 1],
  })}

  <p>
    Owner-agent authorization remains a draft Nostr extension. A signature proves which key acted; policy and
    approval decide whether it should have acted.
    <a href="https://github.com/block/buzz/issues/2376" target="_blank" rel="noopener">Issue #2376</a>
    tracks the missing <code>request_approval</code> support.
  </p>

  ${Callout({
    label: 'The audit check fails today',
    body: html`<p>
      <a href="https://github.com/block/buzz/issues/2637" target="_blank" rel="noopener">Issue #2637</a>
      reports that the verifier rejects every audit chain stored in Postgres because Buzz hashes nanosecond
      timestamps while Postgres stores microseconds. Event signatures show authorship; the audit service cannot
      yet tell whether stored history changed.
    </p>`,
  })}

  <h3>The record does not contain every byte</h3>

  <p>
    Chat, workflow, and Git activity share a signed event format. Git objects and media live in other stores,
    and voice frames never enter the durable log. The event record refers to this work; it does not store all
    of it in one transaction.
  </p>

  <p>
    A reviewer can still see which key announced a push or approved a change. The record cannot prove that
    every linked object survived or that each later job ran. It records authorship more reliably than
    completion.
  </p>

  <h2>Models still lose context</h2>

  <p>
    Buzz keeps chat and agent work in one record. An agent can search that record after a restart, while its
    model still receives a limited prompt and a model-written summary. The relay may hold six months of chat;
    the model receives only selected messages.
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
    content: html`<p>Buzz keeps the work record. Each model still has a fixed context window.</p>`,
  })}

  <p>
    When Buzz runs Codex or Claude Code through ACP, each runtime controls its own context and compaction.
    Buzz can track reported token use and add room history. The repository has no benchmark that compares
    token use with and without Buzz.
  </p>

  ${Callout({
    label: 'One cost report',
    body: html`<p>
      One open issue says four configured agents spawned about 220 Codex processes and used 17.7 million
      tracked tokens. The reporter says Buzz pre-started too many agent processes. A bad pool setup can raise
      both process count and token use.
    </p>`,
  })}

  <h3>Live sessions recover from some failures</h3>

  <p>
    The ACP layer sends one prompt at a time per channel and batches later events. It also detects a crashed
    agent process and starts a new one. These controls handle busy live sessions, but an offline agent can
    still miss old work.
  </p>

  ${Callout({
    label: 'Agents can miss stored messages',
    body: html`<p>
      <a href="https://github.com/block/buzz/issues/1743" target="_blank" rel="noopener">Issue #1743</a>
      reports that an offline agent can skip a saved mention when it returns. Under the default ACP settings in
      <a href="https://github.com/block/buzz/issues/2270" target="_blank" rel="noopener">issue #2270</a>,
      agents ignore later thread replies unless someone tags them again. In both cases, the event never reaches
      the model.
    </p>`,
  })}

  <p>
    Buzz must deliver saved messages after an agent returns before teams can trust agent-to-agent delegation.
  </p>

  <h2>Git work appears in chat</h2>

  <p>
    Buzz runs a Git server with standard read and write operations. Its Projects preview adds issues and
    pull-request review.
  </p>

  <p>
    Buzz hosts Git itself, so teams can use it without GitHub. Both products support issues and code review;
    GitHub still supplies runners and security tools that Buzz lacks.
  </p>

  ${Callout({
    label: 'Branch rooms remain unbuilt',
    body: html`<p>
      Buzz plans to give each branch a room for agent work and test results. Current code creates only the
      Git ref. Merge code ignores approval counts, and Git ref updates cannot start a shipped workflow.
    </p>`,
  })}

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
    community's record; clients and relays do not copy events elsewhere.
  </p>

  <p>
    A team can run its own relay and reuse its keys on another server. Each community still depends on one
    relay for service and access. Signed events prove authorship; anyone with record access can read them.
  </p>

  ${Callout({
    label: 'Who can read hosted Buzz',
    body: html`<p>
      Hosted messages and DMs lack end-to-end encryption. Block may read them to run or secure the service.
      It may send relevant channel content to outside model providers. By default, it keeps messages and
      media for up to 180 days.
    </p>`,
  })}

  <p>
    A self-hosted team controls its own relay. Remote model providers may still receive prompts. Start with
    non-sensitive work and assume the relay operator can read the agent record.
  </p>

  <p>
    Self-hosting means running the relay and four data stores. The production guide calls for stable secrets
    and coordinated backups. Buzz has no built-in relay copy for failover, so teams must restore related
    records together and apply database changes during upgrades.
  </p>

  <h2>Try one project room</h2>

  <p>
    Move one Slack project room to Buzz for a few weeks, with two agents and narrow channel access. Keep Git
    and final approval in the current tools until Buzz ships working approvals and private repository access.
    Measure tokens per finished task and how often people resend work.
  </p>

  ${Prognosis({
    tag: 'signal',
    title: 'Signed actions answer “who acted?”',
    body: html`<p>A reviewer can see the human approval and agent action in one signed record.</p>`,
  })}

  ${Prognosis({
    tag: 'risk',
    title: 'Token use can grow',
    body: html`<p>Repeated metadata and summary handoffs may cost more than manual context sharing.</p>`,
  })}

  <p>
    Buzz gives agents signed identities and work records inside a Slack-like workspace. Teams can test that
    design on low-risk work. Trusted code changes need reliable delivery and working approval gates.
  </p>

  <div class="radar-research-note">
    <strong>Research Note</strong>
    I checked Block's launch posts against the Buzz repo and open issues, then left out social claims that the
    code and docs could not support.
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
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/VISION.md',
      },
      {
        claim: 'Agents have their own keys and revocable relay access',
        why: 'The record separates the owner’s approval from the agent’s action.',
        ref: 'Block Engineering',
        url: 'https://engineering.block.xyz/blog/buzz',
      },
      {
        claim: 'Owner-agent authorization remains a draft, optional Nostr extension',
        why: 'Teams must opt into an unfinished identity scheme.',
        ref: 'NIP-OA draft',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/docs/nips/NIP-OA.md',
      },
      {
        claim: 'The workflow engine fails runs that reach request_approval',
        why: 'Buzz cannot yet resume work after a person approves it.',
        ref: 'Workflow engine',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/crates/buzz-workflow/src/lib.rs#L191-L208',
      },
      {
        claim: 'Database-backed audit chains fail verification because timestamps lose precision',
        why: 'The audit service cannot yet distinguish clean history from changed history.',
        ref: 'Buzz issue #2637',
        url: 'https://github.com/block/buzz/issues/2637',
      },
      {
        claim: 'Git objects and media live outside the event log, and voice frames are ephemeral',
        why: 'Signed events identify related work without storing every byte.',
        ref: 'Buzz architecture',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/ARCHITECTURE.md',
      },
      {
        claim: 'Buzz loads 12 messages for threads and DMs; agents must request ordinary channel history',
        why: 'The fixed limit uses fewer prompt tokens but leaves recall to the agent.',
        ref: 'ACP context configuration',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-acp/src/config.rs#L364-L368',
      },
      {
        claim: 'ACP prompt blocks retain full event metadata and tags',
        why: 'Those fields add tokens to each prompt.',
        ref: 'ACP prompt formatting',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-acp/src/queue.rs#L1067-L1142',
      },
      {
        claim: 'The native agent summarizes near its context limit, then drops old turns after repeated handoffs',
        why: 'The agent can lose facts during long tasks even when the room keeps them.',
        ref: 'Native context handoff',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-agent/src/handoff.rs#L30-L107',
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
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-search/src/query.rs#L198-L323',
      },
      {
        claim: 'Git clone, fetch, and push ship through standard Smart HTTP',
        why: 'Teams can host code on Buzz itself.',
        ref: 'Git transport',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-relay/src/api/git/transport.rs#L1-L9',
      },
      {
        claim: 'The Projects preview adds pull requests and code review',
        why: 'Teams can discuss code and chat in one workspace.',
        ref: 'Projects preview',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/preview-features.json#L12-L19',
      },
      {
        claim: 'Current code does not create or archive rooms from branch tags',
        why: 'The advertised branch-to-room workflow is unavailable today.',
        ref: 'Project binding code',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/desktop/src/features/projects/hooks.ts#L207-L214',
      },
      {
        claim: 'One relay holds each community record; Buzz has no peer or relay replication',
        why: 'One operator controls service and access for each community.',
        ref: 'Buzz architecture',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/ARCHITECTURE.md',
      },
      {
        claim: 'One issue links about 220 Codex processes and 17.7 million tracked tokens to too many pre-started agents',
        why: 'Bad pool settings can raise token use; the issue does not measure normal use.',
        ref: 'Buzz issue #2631',
        url: 'https://github.com/block/buzz/issues/2631',
      },
      {
        claim: 'ACP sends one prompt per channel and restarts crashed agent processes',
        why: 'Live sessions recover from some faults, while offline agents can still miss saved work.',
        ref: 'ACP architecture',
        url: 'https://github.com/block/buzz/blob/cfdea818dbd0a38ca6077de2bfafba755a6c7853/ARCHITECTURE.md',
      },
      {
        claim: 'An offline agent can miss a stored mention after it returns',
        why: 'The agent cannot act on a message it never receives.',
        ref: 'Buzz issue #1743',
        url: 'https://github.com/block/buzz/issues/1743',
      },
      {
        claim: 'Under default ACP settings, an agent ignores thread replies unless tagged again',
        why: 'A person may need to tag the same agent on every turn.',
        ref: 'Buzz issue #2270',
        url: 'https://github.com/block/buzz/issues/2270',
      },
      {
        claim: 'Every authenticated community member can read each Buzz-hosted repository',
        why: 'Private team chat can sit beside code that every community member can clone.',
        ref: 'Buzz issue #2469',
        url: 'https://github.com/block/buzz/issues/2469',
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

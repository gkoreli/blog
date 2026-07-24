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
  alternativeHeadline: 'Block rebuilt team chat around signed AI agent identities',
  date: '2026-07-24',
  description: 'Buzz turns AI agents into signed workspace members. Its Slack-like design is real, while its claims about memory, cost, and decentralization need scrutiny.',
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
    subtitle: 'Block rebuilt team chat around AI agents. The workspace is real. The context cure is still missing.',
    author: 'Goga Koreli',
    readTime: '6 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
  <p>
    Block launched <a href="https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together" target="_blank" rel="noopener">Buzz</a>
    on July 21 as an open-source workspace for people and agents. It has channels, threads, direct messages,
    canvases, huddles, search, workflows, and an agent directory. The shortest honest description is also
    the most fun: <strong>Slack on AIroids.</strong>
  </p>

  <p>
    The joke works because Buzz changes more than the chat box. Agents get accounts, signed identities,
    channel membership, persistent sessions, memory, workflows, and access to the same work record as people.
    Codex, Claude Code, and goose provide the intelligence. Buzz wants to own the room where their work becomes
    visible to a team.
  </p>

  ${PullQuote({
    content: html`<p>The pitch is not AI inside Slack. The pitch is Slack where AI has a badge, a key, and a job.</p>`,
  })}

  ${StatRow({
    items: [
      { value: '1 key', label: html`Per human or agent<br>signing its own events` },
      { value: '12 msgs', label: html`Default automatic context<br>for threads and DMs` },
      { value: '1 relay', label: html`Source of truth<br>for each community` },
    ],
  })}

  <h2>Slack, rebuilt around software coworkers</h2>

  <p>
    Slack is the clear comparison. Buzz copies the daily shape of a team workspace, then makes agents
    first-class members instead of apps hanging from a webhook. They can be mentioned, added to rooms,
    assigned work, given a persona, and traced through the same event system as everyone else.
  </p>

  ${CompareTable({
    headers: ['Surface', 'Buzz adds', 'Competitive read'],
    rows: [
      ['Conversation', 'Channels, threads, DMs, canvases, huddles', 'Direct Slack lane'],
      ['Agents', 'Signed accounts, personas, teams, and job history', 'The real product wedge'],
      ['Execution', 'ACP sessions for Codex, Claude Code, and goose', 'Runtimes stay replaceable'],
      ['Code', 'Git, issues, reviews, and merge events', 'Another work stream, not a GitHub replacement'],
      ['Memory', 'Core memory, named notes, and search', 'Recovery tools, not endless context'],
    ],
    highlightRows: [1],
  })}

  <p>
    This keeps the market map small. Discord overlaps for open-source communities. Codex and Claude are
    workers Buzz can run. Git is a substrate. The product lives in the coordination layer: who is present,
    what they can see, what they did, and whether a person can inspect the result.
  </p>

  <h2>What the AIroids add</h2>

  <p>
    Buzz gives people and agents separate Nostr keys. Under its optional owner-agent scheme, an owner
    signs an authorization and the agent signs its own posts and actions. When both signatures are present,
    one records delegation and the other records authorship. Block's engineering team states the rule well:
    <em>“authorization does not erase authorship.”</em>
  </p>

  ${FlowDiagram({
    label: 'From human authorization to a signed work record',
    steps: [
      {
        eyebrow: 'Human identity',
        title: 'Human key',
        detail: html`Owns the delegation`,
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
        detail: html`Channel · workflow · review · Git`,
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
    This split solves a real ambiguity. A generic automation account may show that software changed a file.
    A separate key can show which agent account acted across the channel, workflow, and Git record. If that
    agent is compromised, an operator can remove its relay access without changing the human account. The
    identity also stays apart from the model, so a team can change runtimes without collapsing every action
    into one bot account.
  </p>

  <p>
    That portability creates a new audit problem. A team can change the model or harness behind an agent key
    while the account name stays fixed. Buzz needs to expose those changes or its stable identity will imply
    more continuity than the runtime deserves.
  </p>

  ${Callout({
    label: 'The current limit',
    body: html`<p>
      Owner-agent authorization is still a draft, optional Nostr extension. Within a channel, membership
      remains the content-access boundary; Buzz does not yet offer finer channel roles or capabilities.
      A signature proves which key acted. It does not prove that the action was safe or wanted.
    </p>`,
  })}

  <h2>The context bill still arrives</h2>

  <p>
    Buzz keeps the durable record that most agent setups scatter across chat, terminal sessions, and local
    files. That helps an agent recover after a restart. It does not give the model an infinite working memory.
    The relay can retain six months of discussion while the model still sees a small prompt and an imperfect
    summary of what came before.
  </p>

  ${CompareTable({
    headers: ['Control', 'What the code does', 'What remains'],
    rows: [
      ['Backscroll', 'Loads 12 thread or DM messages by default', 'The limit counts messages, not tokens'],
      ['Search', 'Permission-aware Postgres full-text search', 'Lexical and agent-triggered'],
      ['Memory', 'Loads one core record; named memories stay cold', 'Manual lookup and stale sessions'],
      ['Compaction', 'Summarizes near the native agent context limit', 'Lossy, paid, then old turns are dropped'],
    ],
    highlightRows: [0, 3],
  })}

  <p>
    The scoping is thoughtful. A mention in a normal channel does not drag the full channel history into the
    prompt. Threads and DMs get a bounded window, and an agent can search when it needs more. Tool results are
    capped. These choices reduce accidental prompt sprawl.
  </p>

  <p>
    The waste moves rather than disappears. ACP event blocks still include content, full event IDs, sender
    IDs, timestamps, parsed fields, and every tag. Buzz's native agent resends retained history and tool
    schemas through its tool loop. Its handoff asks the model to summarize the session, clears the old history,
    and trusts the summary. After ten handoffs, it starts dropping old conversation groups.
  </p>

  ${PullQuote({
    content: html`<p>Buzz attacks coordination and recovery, not context-window physics.</p>`,
  })}

  <p>
    Codex and Claude Code keep control of their own context and compaction when Buzz runs them through ACP.
    Buzz can measure the tokens they report, route the session, and provide room history. It cannot repair
    a detail their runtime already compressed away. I found no checked-in benchmark showing lower token use
    than the same agents outside Buzz.
  </p>

  ${Callout({
    label: 'A warning, not a benchmark',
    body: html`<p>
      One open issue reports four configured agents expanding to roughly 220 Codex processes and 17.7 million
      tracked tokens. The report points to eager capacity rather than a simple leak. It still shows how an
      orchestration layer can multiply cost when its pool and no-op behavior are wrong.
    </p>`,
  })}

  <h2>Git is part of the conversation</h2>

  <p>
    Buzz runs a real Git server: standard clone, fetch, and push, backed by object storage and signed HTTP
    authentication. Its Projects preview can browse repositories, create issues and pull requests, show diffs,
    collect inline review comments, and perform an owner-side merge.
  </p>

  <p>
    That still does not make GitHub the main target. Git is a protocol, and Buzz uses it as another source of
    work events. The interesting overlap is the conversation around code: the issue, review, CI result, and
    merge decision can sit beside the humans and agents who produced them.
  </p>

  ${Callout({
    label: 'The branch room is still a pitch',
    body: html`<p>
      Buzz's vision turns every branch into a room that collects agent work, review, CI, and the merge record.
      Current code creates the Git ref without creating that room. Review decisions appear in the UI but do
      not yet enforce approval counts at merge, and Git ref updates do not trigger the shipped workflow engine.
      The Git host is genuine. The complete chat-to-merge loop remains ahead.
    </p>`,
  })}

  ${SectionBreak()}

  <h2>“Decentralized” has one relay</h2>

  <p>
    Buzz uses Nostr, portable keys, and signed events, so Block describes it as decentralized. The architecture
    document draws a smaller boundary. One relay is the source of truth for a community. Clients do not exchange
    events with each other, and there is no gossip or relay replication.
  </p>

  <p>
    A team can own its server and carry its identity. It does not get a distributed runtime with built-in
    failover. That choice may be sensible for team software, but it leaves one operator in charge of uptime,
    storage, access, and policy. Signed events make authorship clearer. They do not encrypt the record.
  </p>

  ${Callout({
    label: 'Hosted Buzz trust boundary',
    body: html`<p>
      Block says messages and direct messages in its hosted communities lack end-to-end encryption.
      Block may access them to run, secure, or moderate the service. Relevant channel content may also go
      to outside model providers, while messages and media remain for up to 180 days by default.
    </p>`,
  })}

  <p>
    Self-hosting removes Block from that path and makes the team responsible for the relay. A remote model
    provider may still receive prompts. I would begin with non-sensitive work and treat the relay operator
    as someone who can read the agent's work history.
  </p>

  <h2>The test that matters</h2>

  <p>
    I would move one project room from Slack into Buzz for a few weeks. Give two agents separate identities
    and limited channel access. Keep the existing Git remote and final merge rules. Then compare how much
    context people still have to paste, how often agents recover the right history, and whether the signed
    record helps during review.
  </p>

  ${Prognosis({
    tag: 'signal',
    title: 'The team can answer “who acted?”',
    body: html`<p>
      A reviewer can trace a patch from human authorization to agent action, workflow result, and final review
      without rebuilding the story from several tools.
    </p>`,
  })}

  ${Prognosis({
    tag: 'risk',
    title: 'The context bill compounds',
    body: html`<p>
      Repeated event metadata, split worker sessions, stale memory, and summary handoffs cost more than the
      manual context sharing they were meant to remove.
    </p>`,
  })}

  <p>
    Buzz is Slack on AIroids. The line works because it names the real bet: agents become workspace members
    with identities, permissions, work queues, and a record people can inspect. The Git server, workflows,
    and memory tools add muscle around that bet.
  </p>

  <p>
    The code does not abolish context limits. It gives teams a better place to recover from them. The decisive
    test is whether that shared record reduces coordination work without becoming a larger, more expensive
    source of noise.
  </p>

  <div class="radar-research-note">
    <strong>Research Note</strong>
    This issue uses Block's launch and engineering posts, the Buzz repository, and its architecture,
    security, protocol, privacy, and project-vision documents. Claims from launch-week social posts were
    left out when the public code or docs could not support them.
  </div>

  ${Sources({
    items: [
      {
        claim: 'Buzz launched July 21; free, self-hostable, and Apache-2.0 licensed',
        why: 'It fixes the project, license, and launch scope before the analysis begins.',
        ref: 'Block launch',
        url: 'https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together',
      },
      {
        claim: 'Buzz defines itself as the shared pipe around agents and ships Slack-like workspace surfaces',
        why: 'It establishes the Slack lane while keeping the model and agent runtime outside Buzz.',
        ref: 'Buzz vision',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/VISION.md',
      },
      {
        claim: 'Separate agent identity, owner authorization, revocable relay access, and model-neutral harness support',
        why: 'It supports the article’s main distinction between delegated authority and authorship.',
        ref: 'Block Engineering',
        url: 'https://engineering.block.xyz/blog/buzz',
      },
      {
        claim: 'Owner-agent authorization remains a draft, optional Nostr extension',
        why: 'It keeps cryptographic delegation in its current experimental scope.',
        ref: 'NIP-OA draft',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/docs/nips/NIP-OA.md',
      },
      {
        claim: 'Automatic thread and DM context defaults to 12 messages; ordinary channel history stays on demand',
        why: 'It shows that Buzz limits automatic context instead of sending the full workspace.',
        ref: 'ACP context configuration',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-acp/src/config.rs#L364-L368',
      },
      {
        claim: 'ACP prompt blocks retain full event IDs, sender data, timestamps, parsed fields, and tags',
        why: 'It reveals the metadata cost hidden inside a small message-count limit.',
        ref: 'ACP prompt formatting',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-acp/src/queue.rs#L1067-L1142',
      },
      {
        claim: 'The native agent summarizes near its context limit and later falls back to dropping old turns',
        why: 'It shows that context pressure becomes lossy compaction rather than disappearing.',
        ref: 'Native context handoff',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-agent/src/handoff.rs#L30-L107',
      },
      {
        claim: 'Only core memory loads automatically; named cold memories require an explicit lookup',
        why: 'It separates durable storage from automatic recall inside the model context.',
        ref: 'Agent memory specification',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/docs/nips/NIP-AE.md#L28-L35',
      },
      {
        claim: 'History retrieval uses filtered Postgres full-text search rather than semantic recall',
        why: 'It leaves recovery dependent on the agent choosing useful search words.',
        ref: 'Search query implementation',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-search/src/query.rs#L198-L323',
      },
      {
        claim: 'Git clone, fetch, and push ship through standard Smart HTTP',
        why: 'It confirms that Buzz hosts Git rather than wrapping a GitHub repository.',
        ref: 'Git transport',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/crates/buzz-relay/src/api/git/transport.rs#L1-L9',
      },
      {
        claim: 'Issues, pull requests, reviews, and owner-side merges exist in the Projects preview',
        why: 'It places the current Git conversation layer above the raw transport.',
        ref: 'Projects preview',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/preview-features.json#L12-L19',
      },
      {
        claim: 'Project channel tags have no writer, so branches do not yet create and archive rooms',
        why: 'It marks the boundary between the branch-room pitch and the current forge.',
        ref: 'Project binding code',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/desktop/src/features/projects/hooks.ts#L207-L214',
      },
      {
        claim: 'One relay is the source of truth; no peer exchange, gossip, or relay replication',
        why: 'It defines what “decentralized” means in the current system.',
        ref: 'Buzz architecture',
        url: 'https://github.com/block/buzz/blob/b78a684cfa997bbffbc86ac9c311f4f7af25d11a/ARCHITECTURE.md',
      },
      {
        claim: 'One issue reports eager agent capacity creating about 220 Codex processes and 17.7 million tracked tokens',
        why: 'It is a concrete warning that orchestration can amplify cost, though it is not a benchmark.',
        ref: 'Buzz issue #2631',
        url: 'https://github.com/block/buzz/issues/2631',
      },
      {
        claim: 'Hosted messages and direct messages are not end-to-end encrypted; Block may access them',
        why: 'It changes which projects are safe for an early hosted trial.',
        ref: 'Buzz support',
        url: 'https://block.github.io/buzz/support.html',
      },
      {
        claim: 'Hosted retention defaults and disclosure of content to outside model providers',
        why: 'It shows that signed identity does not make the work record private.',
        ref: 'Buzz privacy notice',
        url: 'https://block.github.io/buzz/privacy.html',
      },
    ],
  })}
</article>
  `;
}

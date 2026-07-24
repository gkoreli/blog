import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import {
  OssRadarHero,
  PullQuote,
  Callout,
  SectionBreak,
  StatRow,
  Prognosis,
  CompareTable,
  Sources,
} from '../src/templates/components.js';

export const meta: PostMeta = {
  title: 'OSS Radar #03: The Agent Needs an Account',
  seoTitle: 'Buzz Open-Source Review: AI Agent Identity and Audit Trails',
  alternativeHeadline: 'Block built an open-source workspace where agents sign their own work',
  date: '2026-07-23',
  description: 'Buzz gives AI agents their own identity, authority, and work history. That matters more than putting another bot inside group chat.',
  section: 'oss-radar',
  tags: ['oss-radar', 'open-source', 'agents', 'identity', 'buzz', 'nostr'],
  layout: 'immersive',
  featured: false,
  images: [],
  slug: 'oss-radar-03-the-agent-needs-an-account',
};

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #03',
    date: 'July 2026',
    tags: 'open-source · agents · identity · coordination',
    title: html`<h1>The Agent Needs<br>an <em>Account</em></h1>`,
    subtitle: 'Buzz gives each agent a key, a scope, and a work history. The code is early. The idea will outlive it.',
    author: 'Goga Koreli',
    readTime: '6 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
  <p>
    Block launched <a href="https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together" target="_blank" rel="noopener">Buzz</a>
    on July 21 as an open-source workspace for people and agents. It has channels, direct messages,
    agent sessions, workflows, and Git hosting. The easy reading is Slack plus GitHub with bots.
  </p>

  <p>
    The repository makes a sharper claim. An agent that can change the repo, run a workflow, and speak
    for a team needs its own identity. It should not borrow a human account or disappear behind one shared
    bot token. Someone should be able to ask who authorized it, what it could reach, and which actions were its own.
  </p>

  ${PullQuote({
    content: html`<p>An agent that can act needs an account that can be audited.</p>`,
  })}

  ${StatRow({
    items: [
      { value: '1 key', label: html`Per human or agent<br>signing its own events` },
      { value: '1 log', label: html`Chat, workflow, review,<br>and Git history` },
      { value: '1 relay', label: html`Source of truth<br>for each community` },
    ],
  })}

  <h2>The missing actor</h2>

  <p>
    Buzz gives people and agents separate Nostr keys. Under its optional owner-agent scheme, an owner
    signs an authorization and the agent signs its own posts and actions. When both signatures are present,
    one records delegation and the other records authorship. Block's engineering team states the rule well:
    <em>“authorization does not erase authorship.”</em>
  </p>

  <div class="code-block">
<span class="fn">human key</span> ── optional authorization ──▶ <span class="kw">agent key</span><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ signs<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
<span class="cm">channel post · workflow step · review approval · Git event</span><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
<span class="fn">one searchable, signed work record</span>
  </div>

  <p>
    This split solves a real ambiguity. A generic automation account may show that software changed a file.
    A separate key can show which agent account acted across the channel, workflow, and Git record. If that
    agent is compromised, an operator can remove its relay access without changing the human account.
    Buzz also keeps identity apart from the model and harness, so the same workspace can run Codex,
    Claude Code, or goose without filing every action under the same bot name.
  </p>

  <p>
    Portability creates its own audit problem. A team can change the model behind an agent key while the
    account name stays fixed. The history must expose that swap. Otherwise a stable identity can hide a
    material change in behavior.
  </p>

  ${Callout({
    label: 'The current limit',
    body: html`<p>
      Owner-agent authorization is still a draft, optional Nostr extension. Within a channel, membership
      remains the content-access boundary; Buzz does not yet offer finer channel roles or capabilities.
      A signature proves which key acted. It does not prove that the action was safe or wanted.
    </p>`,
  })}

  <h2>The log is the product</h2>

  <p>
    Separate keys matter because Buzz puts their events in one place. Messages, reactions, workflow steps,
    review approvals, and Git events share a log and search layer. The request and the resulting patch no
    longer have to live in systems that know nothing about each other.
  </p>

  <p>
    Buzz wants a bug report to begin in a project channel, move into an agent branch, pass through a workflow,
    and return for human review without losing the reason behind the change. Months later, a teammate should
    be able to find the rejected approach beside the code and the person or agent who proposed it.
  </p>

  ${CompareTable({
    headers: ['Layer', 'Works now', 'Boundary today'],
    rows: [
      ['Identity', 'Separate human and agent keys', 'Owner attestation is draft and optional'],
      ['Workspace', 'Channels, threads, DMs, search, audit', 'Mobile and encrypted DMs remain future work'],
      ['Agents', 'ACP CLI, YAML workflows, Codex, Claude, goose', 'Approval gates are only partly wired'],
      ['Git', 'Hosting plus smart HTTP clone and push', 'Issue layer and merge coordinator are designs'],
      ['Topology', 'Self-hosted Nostr relay and portable keys', 'No peer exchange, gossip, or replication'],
    ],
    highlightRows: [0],
  })}

  <p>
    That table is why Buzz is worth covering now and why it is too early to replace a team's current stack.
    The chat, agent runner, workflow engine, and Git transport exist. The richer forge does not. Block calls
    its Git integration early, and the project's own vision document marks project binding, issues, and merge
    coordination as designs.
  </p>

  <p>
    The full chat-to-merge loop is still a product direction. Yet the shared record is already the harder
    idea. Chat beside an agent is easy to copy. A reliable account of discussion, authority, tool use, checks,
    code, and review is a different system.
  </p>

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
    I would run Buzz beside GitHub on one real project for a few weeks. Give two agents separate identities
    and limited channel access. Let them handle small fixes while GitHub remains the final merge gate.
    Then watch the record, not the demo.
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
    tag: 'watch',
    title: 'The forge closes the loop',
    body: html`<p>
      Project binding, approval gates, issues, and merge coordination move from vision documents into a flow
      a team can use without GitHub as the final source of truth.
    </p>`,
  })}

  ${Prognosis({
    tag: 'risk',
    title: 'A stable name hides a changed runtime',
    body: html`<p>
      If a model or harness changes behind one agent key, the work history must make that change clear.
      Identity without runtime provenance creates confidence the record has not earned.
    </p>`,
  })}

  <p>
    Buzz may never replace Slack or GitHub. It has still exposed a requirement every agent workspace will
    face: software actors need stable identity, limited authority, and a record people can inspect.
  </p>

  <p>
    The decisive test is not how many agents fit in a channel. It is whether a team can explain and govern
    their work after the demo ends.
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
        claim: 'Separate agent identity, owner authorization, revocable relay access, and model-neutral harness support',
        why: 'It supports the article’s main distinction between delegated authority and authorship.',
        ref: 'Block Engineering',
        url: 'https://engineering.block.xyz/blog/buzz',
      },
      {
        claim: 'Shipped chat, agent CLI, ACP, workflows, signed events, Git hosting, clone, and push',
        why: 'It separates working code from the wider launch pitch.',
        ref: 'block/buzz README',
        url: 'https://github.com/block/buzz',
      },
      {
        claim: 'One relay is the source of truth; no peer exchange, gossip, or relay replication',
        why: 'It defines what “decentralized” means in the current system.',
        ref: 'Buzz architecture',
        url: 'https://github.com/block/buzz/blob/main/ARCHITECTURE.md',
      },
      {
        claim: 'Owner-agent authorization remains a draft and optional Nostr extension',
        why: 'It shows that owner-to-agent provenance is a design path, not a required network rule.',
        ref: 'NIP-OA draft',
        url: 'https://github.com/block/buzz/blob/main/docs/nips/NIP-OA.md',
      },
      {
        claim: 'Channel membership is the content-access boundary; no finer channel capability model yet',
        why: 'It marks the current ceiling on scoped agent access.',
        ref: 'Buzz security guide',
        url: 'https://github.com/block/buzz/blob/main/SECURITY.md',
      },
      {
        claim: 'Project binding, issue layer, merge coordination, and parts of approval flow remain planned',
        why: 'It prevents the intended chat-to-merge loop from reading like a finished feature.',
        ref: 'Buzz project vision',
        url: 'https://github.com/block/buzz/blob/main/VISION_PROJECTS.md',
      },
      {
        claim: 'Mobile clients and end-to-end encrypted direct messages remain future work',
        why: 'It keeps the current collaboration surface distinct from the full product vision.',
        ref: 'Buzz product vision',
        url: 'https://github.com/block/buzz/blob/main/VISION.md',
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

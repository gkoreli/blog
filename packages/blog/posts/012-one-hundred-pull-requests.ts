import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import { PrStreamHero, SectionNum, Insight, ScrollReveal, PullQuote, SectionBreak, StatRow, Footnotes } from '../src/templates/components.js';

export const meta: PostMeta = {
  title: 'One Hundred Pull Requests',
  seoTitle: 'Building an MCP Server with AI Agents: 100 Pull Requests',
  alternativeHeadline: 'backlog-mcp, context engineering for AI agents, MCP server architecture, and the weekend birth of the nisli UI framework',
  date: '2026-07-05',
  description: 'backlog-mcp part 1: a context-engineering backlog for AI agents, built in the open — the pain that started it, the weekend nisli was born, why the PRs stopped.',
  section: 'engineering' as const,
  tags: ['backlog-mcp', 'mcp', 'agentic-engineering', 'nisli', 'build-in-public'],
  layout: 'immersive',
  slug: 'one-hundred-pull-requests',
  series: {
    id: 'backlog-mcp-saga',
    title: 'The backlog-mcp saga',
    order: 1,
  },
};

export function preamble() {
  return PrStreamHero({
    kicker: 'Engineering · The backlog-mcp Saga · Part 1',
    title: html`<h1>One Hundred<br><em>Pull Requests</em></h1>`,
    byline: html`<p class="prs-byline">The first 78 days of backlog-mcp, an MCP server built with AI agents —<br>and why the pull requests stopped.</p>`,
  });
}

export function article() {
  return html`
<article class="post-content">
  <p class="post-lede">
    <a href="https://github.com/gkoreli/backlog-mcp" target="_blank">backlog-mcp</a> is an open-source context-engineering backlog for AI agents — tasks, memory, and search, served over MCP; <a href="https://github.com/gkoreli/nisli" target="_blank">nisli</a> is the zero-dependency UI framework born inside it. This is the story of their first 117 pull requests.
  </p>

  <!-- § 1 — DECEMBER: THE PAIN -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 1 — December: The Pain' })}
    <h2>Building the tool I <em>couldn't buy</em></h2>
    <p>
      backlog-mcp exists because of a personal pain. I work with AI agents every day, and every task manager I could reach was built for teams of humans coordinating with humans. The agent — the thing doing half my engineering — was nobody's user. Plans lived in chat transcripts that would never be read again. Every session started from zero. On the evening of December 19, 2025, I started building the tool I couldn't buy: the first ten commits — schema, storage, a working <a href="https://modelcontextprotocol.io" target="_blank">MCP</a> server — span eighteen minutes in the git log.
    </p>
    <p>
      This is part 1 of the backlog-mcp saga — the product story. The hundred pull requests are the signal, not the story: the animation above renders every merged PR by the day it landed, and what those ticks record is a tool and its builder figuring out, in public, what they were actually making. The PRs were the unit of the method — one delegation, one review boundary, one merge — and they were instrumental, until I outgrew them. Or until I quit on rigor and dressed it up as process. This post argues it was the first one. You get to decide.
    </p>
    <p>
      Three claims in this post are still live. nisli, the framework, has one serious user: me. The memory system's north star — an agent measurably smarter in week 10 than in week 1 — is unmeasured. And the claim that pull requests are scaffolding for agentic work can be wrong in a way I would have to publicly walk back. I have argued before that the engineer's role is expanding into an <a href="/the-agentic-product-engineer">agentic product engineer</a>. This project is where I test that with my own time.
    </p>
    <p>
      Here is what the run contains. A storage bet — markdown as truth — that everything still stands on. A transport saga that took seven numbered ADRs to end. One weekend where a rejected React spike became a UI framework of my own. Search and context systems that quietly turned a task tracker into a storage engine for agentic context. And nine PRs that died in review, which turn out to matter as much as the ones that merged.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 2 — JANUARY: THE BET AND THE USER -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 2 — January: The Bet, and Meeting the User' })}
    <h2>Markdown as truth, and the agent as a user <em>with psychology</em></h2>
    <p>
      The launch burst — ten PRs on January 16 — wired CI, npm publishing, and a web viewer around the prototype. But the decision that shaped everything came in PR #3: storage moved from JSON to individual markdown files with YAML frontmatter. Tasks became human-readable, git-diffable, agent-editable. Nobody has reversed that decision. Everything now stands on it.
    </p>
    <p>
      A week later came the decision I would defend in front of a protocol committee. An agent editing a task through MCP had to read the whole object and write the whole object back. The first ADR in the repo counts the cost: 10,000+ tokens for a one-line edit, a hundred times what the same agent pays to edit a local file. PR #23 shipped <code>write_resource</code> — surgical operations (<code>str_replace</code>, <code>insert</code>, <code>append</code>) over <code>mcp://</code> URIs — deliberately mirroring the edit contract Claude is trained on: unique match or loud failure. Six months later, an ADR proposing a CRDT storage backend kept that tool surface untouched, "so the model stays in its trained edit distribution."
    </p>

    ${PullQuote({ content: html`"This isn't just about backlog-mcp — it's about establishing a universal pattern for the entire MCP ecosystem."`, cite: '— ADR 0001, "Writable Resources Design", January 2026' })}

    <p>
      Then the tool started teaching me. Late January, a triage agent kept producing malformed reference arrays because it skipped the read-before-write step — LLMs optimize for minimal tool calls, and re-fetching feels redundant to them. The conventional diagnosis: the agent misbehaved. The diagnosis I wrote down instead became the mental model the whole product is built on:
    </p>

    ${PullQuote({ content: html`"This is not a bug in agent behavior — it's a UX problem with the API design."`, cite: '— ADR 0037, "Partial Array Updates", January 2026' })}

    <p>
      So the API grew <code>add_references</code> / <code>remove_references</code> — operations matching the agent's mental model of "add to," not "replace all." Its sibling ADR attacked my failure mode rather than the agent's: commitment hoarding. Fifteen open epics, 69 open tasks, 6.7% attention per epic — so the system got decay warnings and grooming pressure, on the theory that "the skill needed isn't better productivity — it's killing good ideas so great ideas can live." The agent is a user with predictable psychology. So am I. Designing for both is what this product turned out to be about — though I didn't know that yet. First, the tool had to survive two walls.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 3 — THE FIRST WALL: TRANSPORT -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 3 — The First Wall: Transport' })}
    <h2>Seven ADRs to move one <em>protocol</em></h2>
    <p>
      The first wall looks mundane: turn a stdio MCP server into an HTTP server without breaking anyone's config. It ate the last weekend of January — nine PRs in two days — and left a numbered trail of failure, ADR 0013.1 through 0013.7.
    </p>
    <p>The dead ends, in order:</p>
    <ul>
      <li><strong>A custom stdio-to-HTTP bridge</strong> built on the MCP Client SDK. It "added a protocol layer instead of being a transparent proxy" and blocked during initialization. Abandoned.</li>
      <li><strong>Migrating to StreamableHTTP</strong>, the SDK's successor transport. Blocked: <code>mcp-remote</code>, the bridge every MCP client actually uses, didn't support it. Rejected.</li>
      <li><strong>A dual-mode server</strong> serving both transports. Complexity without benefit. Rejected.</li>
    </ul>
    <p>
      The fix that held is a single flag: <code>--transport http-only</code> on mcp-remote. Weeks of architecture, resolved by reading a bridge's options more carefully. I was annoyed. The annoyance was not the waste — dead ends are tuition — it was that months later the question "do I still need mcp-remote?" kept coming back, and every time it felt new. ADR 0013.7 exists for exactly that reason, and its stated purpose is the most honest sentence in the decision log:
    </p>

    ${PullQuote({ content: html`"Each time it feels novel because the reasoning lived only in conversation, never on disk. This ADR captures the framework so the loop stops reopening."`, cite: '— ADR 0013.7, June 2026' })}

    ${Insight({ label: 'The agentic lesson', content: html`<p>Agents lose context between sessions. So do humans between months. The ADR trail is not documentation — it is <em>memory infrastructure</em> shared by every future session, human or agent. A decision that lives in a chat transcript gets re-litigated. A decision on disk, with its dead ends recorded, stays decided.</p>` })}

    <p>
      The transport wall cost a weekend and taught a process. The second wall cost more, and it is the reason this saga has a framework in it.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 4 — THE SECOND WALL: THE FRAMEWORK WEEKEND -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 4 — The Second Wall: The Framework Weekend' })}
    <h2>Four days from React spike to <em>nisli</em></h2>
    <p>
      You do not write your own UI framework. It is the one piece of advice the entire industry agrees on, and for good reason: the graveyard is full, and React is right there.
    </p>
    <p>
      By early February the viewer is fifteen-plus raw <code>HTMLElement</code> classes, each one nuking its DOM subtree with <code>innerHTML</code> on every state change. Scroll position lost. Focus lost. Listeners leaking on disconnect. I was facing challenges in the UI daily, and the honest version of what happened next is the one I typed into the prompt that produced this post: I had no other choice. I ran a spike with React and didn't like it. No other framework aligned with my vision.
    </p>
    <p>
      The git log records the four days with timestamps:
    </p>
    <ul>
      <li><strong>Thursday, Feb 5</strong> — commit <code>05aca37</code> adds a React/Vercel best-practices skill to the agent configuration. Thousands of lines of React guidance. The spike is on.</li>
      <li><strong>Saturday, Feb 7, 21:19 UTC</strong> — instead of React code, the first framework ADR appears: signals, targeted DOM patching, three architectures scored against each other.</li>
      <li><strong>Sunday, Feb 8</strong> — seven ADR revisions. Signal ergonomics settle (<code>.value</code>, not calls). Factory composition. A "Why Not Lit?" section.</li>
      <li><strong>Monday, Feb 9, 05:32 UTC</strong> — PR #71: the framework, implemented. Seven modules, 124 tests passing. By end of day, ten PRs merged and the first components migrated.</li>
      <li><strong>Same day, 13:18 UTC</strong> — commit <code>0b4415d</code>: <em>remove react skill</em>. PR #76's body reads: "deleted unused vercel-react-best-practices skill (~6100 lines)."</li>
    </ul>
    <p>
      This is the gold cluster in the animation at the top of the page.
    </p>
    <p>
      The React spike died without shipping a single React line. Let me be fair to the loser, because React would have worked. It is better at almost everything — ecosystem, tooling, hiring, an answer on StackOverflow for every error you will ever see. None of that was what I needed. I needed a UI layer that agents write correctly on the first pass, that I can hold in my head whole, and that adds zero dependencies to a tool people run with <code>npx</code>. Lit came closest, and the ADR records why it lost: "Lit's template engine is battle-tested across millions of users, but our scope (16 components, known use cases) doesn't justify that complexity."
    </p>
    <p>
      The framework becomes <a href="https://www.npmjs.com/package/@nisli/core" target="_blank">@nisli/core</a> — <em>nisli</em>, ნისლი, Georgian for "fog": light, present, barely there. Its design principles read like nothing else in the framework space because the audience is different. This is a framework designed for human–AI coherence:
    </p>
    <ul>
      <li><strong>No invented syntax.</strong> Standard TypeScript and HTML. No DSL, no compiler. An LLM produces a complete, correct component in one function.</li>
      <li><strong>Hard to write wrong.</strong> Factory props require <code>Signal&lt;T&gt;</code> — lost reactivity is a compile error, not a stale-data bug you find in production.</li>
      <li><strong>Internals maintainable by AI.</strong> "Framework code should read like a tutorial, not code golf." Named functions. Aggressive why-comments in the binding engine.</li>
    </ul>
    <p>
      Under the hood: 2,564 lines of implementation, zero dependencies. A push-pull signal graph that uses a global epoch counter instead of timestamps. A <code>Proxy</code> that materializes prop signals lazily, bridging TypeScript's erased types to runtime reactivity with no schema boilerplate. An effect guard that catches infinite loops — 100 re-runs inside a 2-second window — and disposes the offender with a readable error instead of freezing the tab. And my favorite, from ADR 0069: a character-level state machine in the template parser that tracks <em>am I inside a tag? inside a quote?</em> so expression markers in unquoted attribute positions get auto-quoted —
    </p>

    <div class="code-block">
<span class="cm">// template.ts — the auto-quoting state machine (abridged)</span><br>
<span class="cm">// Slots become &lt;!--bk-N--&gt; comment markers; the '&gt;' in '--&gt;' would</span><br>
<span class="cm">// close the tag if the expression sits in an unquoted attribute.</span><br><br>
<span class="kw">const</span> needsQuotes = inTag &amp;&amp; !quoteChar &amp;&amp; <span class="fn">/=\\s*$/</span>.test(s);<br>
htmlStr += needsQuotes ? <span class="fn">\`"\${createMarker(i)}"\`</span> : <span class="fn">createMarker(i)</span>;
    </div>

    <p>
      Nineteen call sites were already silently broken before that fix. A framework you own is a framework whose bugs you can reach.
    </p>
    <p>
      The costs are real and written down in nisli's own ADRs rather than discovered by angry users. The template cache is declared and never populated — every mount re-parses. There is no structural diffing of slots; a changed template tears down and rebuilds. <code>when()</code> evaluates its condition once, a documented gotcha. This is what a weekend framework honestly costs.
    </p>

    ${Insight({ label: 'The loop', content: html`<p>Two weeks later, PR #102 extracts nisli as a public npm package. The blog you are reading is built with it. The animated preamble at the top of this post — 108 real merge ticks — is rendered by the framework whose birth those ticks record. The tool became the medium for its own story.</p>` })}

    <p>
      The framework weekend closes at 26 PRs merged in one week — +33,975 lines, −11,807 — with 14 of 14 components migrated and 508 tests passing. If that sounds impossible for one person, that is the point. I didn't type most of it. I made every decision in it. What that division of labor costs is a story I've told before, in <a href="/how-ghx-was-born">how ghx was born</a> — where a "simple" CLI took 23 agent sessions and three rewrites. With both walls down, the tool could finally start becoming what it was going to be.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 5 — FEBRUARY: THE BECOMING -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 5 — February: The Becoming' })}
    <h2>The tool discovers <em>what it is</em></h2>
    <p>
      Mid-February the project turns from plumbing to intelligence, and this is where it stops being a task tracker — not by plan, but by following the agent's actual needs one PR at a time.
    </p>
    <p>
      Search first. It goes from string matching to <a href="https://github.com/oramasearch/orama" target="_blank">Orama</a> BM25, to hybrid retrieval with local embeddings — transformers.js and its 23MB model won over TensorFlow.js and its 150MB of native-compilation misery — to rank fusion. Then it collapses under its own layers: three scoring systems fighting each other, and a query for "feature store" ranking the task literally about <code>FeatureStore</code> at position 18. The diagnostic ADR finds the smoking gun in the normalization: "MinMax normalization annihilates low-BM25 documents: when a relevant document has the lowest BM25 score, it maps to exactly 0.0, making it invisible despite being relevant." The redesign — independent BM25 and vector retrievers, fused linearly, the same place Elasticsearch landed on its own journey — replaces an 852-line service that had accreted ten responsibilities.
    </p>
    <p>
      Then context. An agent starting work on a task needed 5–10 sequential MCP calls to assemble its picture — parent epic, siblings, resources, recent operations. Call it 4,000 tokens of plumbing before any real work. PR #90 ships <code>backlog_context</code>: one call, one structured bundle, semantic search folded in so the agent discovers related work it didn't know to ask about. And in the ADR behind that tool, the product says out loud, for the first time, what it is becoming: "backlog-mcp is evolving from a task tracker into a context engineering platform — a second brain for humans and AI agents working together."
    </p>
    <p>
      I did not set out to build that sentence. I set out to stop losing plans in chat transcripts. But every fix for the agent's real needs — surgical edits, partial updates, one-call context — pointed the same direction, and by late February the direction had a name. These are efficiency claims, and efficiency claims about agent tooling deserve measurement, not vibes; I turned that exact suspicion on my own tools in <a href="/what-if-the-agent-was-better-before-we-helped">a later post about evals</a>, and backlog-mcp's context pipeline is on that docket too. Frustration is not proof, and neither is a demo.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 6 — APRIL: THE GRADUATION -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 6 — April: The Graduation' })}
    <h2>The review moves <em>upstream</em></h2>
    <p>
      Pull requests are how serious software gets built. I ran 117 of them believing that, and the belief was correct — the project's entire shape was negotiated inside those PRs. In the early months the PR was the delegation boundary: I brief agents, they produce a branch, and the diff is where I audit work I did not type.
    </p>
    <p>
      The nine missing numbers prove the boundary had teeth. 117 PRs opened, 108 merged — and the other nine read like echoes of their neighbors. #38, "Complete Fastify migration," closed; #37, the same migration, merged. #53 and #54 are both the copy-button system; #55 merged it. #45, #46, and #47 are three runs at the same resource refactor. Those are agent branches I rejected and had redone — sometimes twice — before anything reached main. A review boundary that never kills anything is a ritual. This one killed roughly one attempt in thirteen.
    </p>
    <p>
      April 3 is the last PR day — eight merges wiring GitHub OAuth and ChatGPT compliance — and then the stream goes quiet. Not the project. The commits continue to this day, straight to main. What ended was the pull request as my unit of work, and it ended because three things matured at once:
    </p>
    <ul>
      <li><strong>Observability arrived.</strong> The activity panel and operation log — built inside these very PRs — attribute, diff, and expose every agent write after the fact. A later ADR names the op-log "the canonical write journal: the single record of how state arrived at its current shape."</li>
      <li><strong>Review moved to the decision.</strong> The process hardened into ADR-first work: delegation briefs with exact scope, step-0 audits before edits — one rename classified ~262 references as change-or-leave before touching a file — engineering records after. By the time code exists, the risky thinking has already been reviewed.</li>
      <li><strong>The overhead inverted.</strong> For a solo maintainer whose collaborators are agents, branch–PR–merge ceremony added latency without adding safety the ADR trail and op-log weren't already providing.</li>
    </ul>

    ${PullQuote({ content: html`The pull request didn't fail. It graduated — from the place where work gets reviewed to the scaffolding that taught the process to review itself.`, cite: '— the claim this post exists to make' })}

    <p>
      This does not generalize to teams, and I would re-adopt PRs the day a second human joins. But for agentic solo work I now believe the natural review boundary is the decision, not the diff. The diff is an implementation detail of a decision that should already be on disk. That is a falsifiable position — if the direct-commit era produces a regression an old-style PR review would have caught, I am wrong, and the op-log will show it.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 7 — THE HORIZON -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 7 — The Horizon' })}
    <h2>From task tracker to <em>storage engine for agentic context</em></h2>
    <p>
      The positioning ADR preserves its own three-stage evolution on purpose, so a newcomer sees all of it at once: the product is "a task tracker today, an agentic storage engine by architecture, and a data bank for the full agentic toolchain in its trajectory." The architecture was type-agnostic from the start — storage iterates any markdown entity, the viewer renders any frontmatter. The framing took months to catch up. When it did, it produced the boldest sentence in the repo:
    </p>

    ${PullQuote({ content: html`"backlog-mcp is to agentic content what git is to source code and what Postgres is to relational data — the smallest, most reusable primitive that the domain-specific tooling sits on top of."`, cite: '— ADR 0097, "Agentic Storage Engine Positioning", April 2026' })}

    <p>
      The post-PR era is being spent cashing that claim. Three moves define it.
    </p>
    <p>
      <strong>Memory.</strong> The largest arc since the PRs stopped — fifteen sub-ADRs — begins with a survey of 40+ agentic memory systems and one sharp observation about the incumbents: Mem0 sends an LLM's structured output to another LLM to "extract memories." But the agent <em>is</em> an LLM. A second LLM re-extracting what the first one wrote is redundant. The breakthrough is noticing there is nothing to build: "the backlog IS the memory." Tasks, evidence, ADRs, operations — that is episodic memory already. The problem is surfacing, not storage. So memory becomes four verbs — <code>wakeup</code>, <code>recall</code>, <code>remember</code>, <code>forget</code> — over the existing substrate, no LLM in the write path. A year later the field converges on the same append-leaning, deterministic design. The north star is the most testable sentence in the decision log: an agent using backlog-mcp should be <em>measurably smarter in week 10 than in week 1, on the same project, because of memory</em>. It is unmeasured. It stays in this post anyway, because declared targets you can miss are the only ones worth declaring.
    </p>
    <p>
      <strong>Semantic intent at the boundary.</strong> The unified entity model that keeps the backend sane leaked into the tool surface — <code>backlog_create(type=memory)</code> forces the agent to think like the persistence layer. The current direction inverts it: the MCP surface speaks the agent's intent language (<code>remember</code>, <code>recall</code>, <code>schedule</code>), and the substrate abstraction stays internal. Hexagonal architecture, applied to a port whose consumer is a language model — made affordable by deferred tool loading, which turned "another tool" from a context tax into a one-line name.
    </p>
    <p>
      <strong>Local-first, deliberately.</strong> The Cloudflare Workers + D1 cloud mode — those final OAuth PRs — got demoted in June to a "constrained satellite." Feature parity with the weakest environment was dragging every design toward the lowest common denominator, and the capabilities that matter — local embeddings, hybrid search, memory — live on the local side. The next act is already written as a proposal: <a href="https://github.com/loro-dev/loro" target="_blank">Loro</a>, a CRDT, as the history substrate. The op-log plus a manual git habit is "two half-built history systems." Agents as CRDT peers is how single-writer today becomes multi-agent tomorrow without conflict copies.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 8 — THE TALLY -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 8 — The Tally' })}
    <h2>What one hundred pull requests <em>buy</em></h2>
    <p>
      Not the software — the practice. Decisions on disk. Dead ends numbered instead of deleted. APIs written for the psychology of the model on the other side. Scaffolding held exactly as long as it earns its overhead, and dropped the day it doesn't.
    </p>
    <p>
      And a texture no changelog records. The framework ADR lands at 21:19 UTC on a Saturday. The implementation lands at 05:32 UTC on a Monday, and ten merges follow before that day ends. Nobody assigned any of this. No sprint, no standup, no team. Building in the open, alone with agents, looks exactly like the chart at the top of this page — bursts where the determination spiked, silence where the thinking got long, and not one tick placed by anyone but me.
    </p>

    ${StatRow({ items: [
      { value: '108', label: html`merged PRs, numbered 1–117` },
      { value: '+97,602', label: html`lines added, −25,639 deleted` },
      { value: '137', label: html`architecture decision records` },
      { value: '78', label: html`days, Jan 16 → Apr 3, 2026` },
    ] })}

    <p>
      The numbers are the consequence. The saga is the point, and it is not over. Part 2 of this series is nisli's internals — benchmarks and the unflattering parts included. Part 3 is the memory eval: whether week 10 actually beats week 1. I want people to find this project, and I want them to find me — that want is typed verbatim into the raw prompt behind this post, on the <a href="/one-hundred-pull-requests/prompts">prompts page</a>.
    </p>
    <p>
      108 merges. 137 recorded decisions. One framework. The claims are live and at least one of them can come back wrong.
    </p>
    <p>
      Tell me which one — I'm <a href="https://x.com/GogaKoreli" target="_blank">@GogaKoreli</a>.
    </p>
  ` })}

  ${Footnotes({ items: [
    html`① backlog-mcp — <a href="https://github.com/gkoreli/backlog-mcp" target="_blank">github.com/gkoreli/backlog-mcp</a> — the repo, including all 137 ADRs under <code>docs/adr/</code> (Jan–Jun 2026)`,
    html`② nisli (@nisli/core) — <a href="https://github.com/gkoreli/nisli" target="_blank">github.com/gkoreli/nisli</a> · <a href="https://www.npmjs.com/package/@nisli/core" target="_blank">npm</a> — zero-dependency reactive web component framework (Feb 2026)`,
    html`③ Model Context Protocol — <a href="https://modelcontextprotocol.io" target="_blank">modelcontextprotocol.io</a> — Anthropic's open protocol for agent–tool integration (2024)`,
    html`④ Orama — <a href="https://github.com/oramasearch/orama" target="_blank">github.com/oramasearch/orama</a> — TypeScript-native BM25 + vector search (evaluated Jan 2026, ADR 0038/0049)`,
    html`⑤ transformers.js — <a href="https://github.com/huggingface/transformers.js" target="_blank">github.com/huggingface/transformers.js</a> — local embeddings in the hybrid search stack (ADR 0042, Feb 2026)`,
    html`⑥ mcp-remote — <a href="https://github.com/geelen/mcp-remote" target="_blank">github.com/geelen/mcp-remote</a> — the stdio↔HTTP bridge at the center of the transport saga (ADR 0013.x)`,
    html`⑦ Loro — <a href="https://github.com/loro-dev/loro" target="_blank">github.com/loro-dev/loro</a> — CRDT library proposed as backlog-mcp's history substrate (ADR 0107, Jun 2026)`,
    html`⑧ PR merge data — GitHub API, <code>gh pr list --state merged</code> on gkoreli/backlog-mcp; 117 PRs opened, 108 merged. The other nine (#30, #31, #35, #38, #45–47, #53, #54) were closed unmerged — rejected attempts superseded by a redo. The preamble renders the merged set verbatim.`,
  ] })}
</article>
`;
}

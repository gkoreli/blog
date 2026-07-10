import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import { PrStreamHero, SectionNum, Insight, ScrollReveal, PullQuote, SectionBreak, StatRow, Timeline, CompareTable, Footnotes } from '../src/templates/components.js';

export const meta: PostMeta = {
  title: '117 Pull Requests Later, It Wasn’t a Task Manager Anymore',
  seoTitle: 'How backlog-mcp Became Context and Memory Infrastructure for AI Agents',
  alternativeHeadline: 'How a simple task backlog became a local-first context engine, memory layer, search system, and the birthplace of the nisli UI framework',
  date: '2026-07-09',
  description: 'The story of how backlog-mcp grew from a task manager into local-first context and memory infrastructure for AI agents — and produced the UI framework powering this blog.',
  section: 'engineering' as const,
  tags: ['backlog-mcp', 'agentic-engineering', 'agentic-product-engineering', 'context-engineering', 'memory-engineering', 'nisli', 'architecture'],
  layout: 'immersive',
  featured: true,
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
    title: html`<h1>117 Pull Requests Later,<br><em>It Wasn’t a Task Manager Anymore</em></h1>`,
    byline: html`<p class="prs-byline">How a simple backlog became local-first context and memory infrastructure for AI agents —<br>and why I am now using it less.</p>`,
  });
}

export function article() {
  return html`
<article class="post-content">
  <p class="post-lede">
    Over 78 days, I opened 117 pull requests and merged 108 of them. Somewhere during that run, the task manager disappeared. Now the system contains almost 1,000 tasks and artifacts, and I am using it less than I did when it was small. I do not know how to fix that yet.
  </p>

  <!-- § 1 — WHAT EXISTS NOW -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 1 — What Exists Now' })}
    <h2>backlog-mcp is <em>badly named</em> now</h2>
    <p>
      <a href="https://github.com/gkoreli/backlog-mcp" target="_blank">backlog-mcp</a> began as a place where AI agents could create tasks and mark them done. Today the name describes its origin, not its architecture.
    </p>
    <ul>
      <li><strong>Durable context.</strong> Tasks, decisions, artifacts, evidence, operations, and memory live as markdown entities with structured frontmatter.</li>
      <li><strong>Local retrieval.</strong> <a href="https://github.com/oramasearch/orama" target="_blank">Orama</a> provides lexical search; local embeddings add semantic retrieval.</li>
      <li><strong>Context assembly.</strong> One request can hydrate relationships, recent activity, references, and semantically related work.</li>
      <li><strong>One core, many consumers.</strong> MCP, CLI, HTTP, and future ports call the same transport-independent operations.</li>
      <li><strong>Observation without CRUD.</strong> The live viewer is deliberately read-only. Agents mutate; humans observe and steer.</li>
    </ul>
    <p>
      That is the clean architectural description. The less flattering truth is that the product is reaching a scale where its own ergonomics are breaking down. Context engineering has not become as useful as I expected. Memory is accumulating faster than I can make it trustworthy. Organization that felt natural with one hundred entities feels punishing near one thousand. The system has outgrown the name, but I have not fully nailed what it should become instead.
    </p>
    ${PullQuote({ content: html`backlog-mcp started as software for tracking what an agent should do next. It became infrastructure for preserving what the agent — and the project — should never have to learn twice.`, cite: '— the transformation this article is about' })}

    <p>
      Building it produced an unexpected second product. I built a zero-dependency reactive Web Component framework called <a href="https://github.com/gkoreli/nisli" target="_blank">nisli</a>, then added DOM-free static rendering and a static-site generator. The backlog produced the framework. The framework produced the blog you are reading. And this article is the framework rendering the story of its own birth.
    </p>
    <p>
      The 117 pull requests are not the achievement. They are the fossil record: 117 visible attempts at following the actual needs of agents until a small task manager escaped its original category.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 2 — PRESSURE-DRIVEN PRODUCT ENGINEERING -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 2 — Pressure-Driven Product Engineering' })}
    <h2>Building is cheap now. Knowing <em>what deserves to exist</em> is not.</h2>
    <p>
      Agentic engineering changed the scarce resource. I can produce working software faster than I can form justified beliefs about which software should be produced. Implementation is no longer the main bottleneck. Judgment is. The dangerous failure mode is not being unable to build an idea; it is building ten plausible ideas before discovering that none of them came from a real need.
    </p>
    <p>
      The mental discipline I have arrived at is simple: I try to build only from pressure I am personally feeling. Not a market category. Not a theoretical platform requirement. Not a feature that might become useful when imaginary users arrive. A burning problem interrupts real work; I build the smallest answer; I use that answer until the next problem becomes undeniable. I call this <strong>pressure-driven product engineering</strong>.
    </p>

    ${Insight({ label: 'The pressure loop', content: html`<p><strong>Feel the problem → build the smallest answer → use it for real → hit the next constraint → extend the core at that pressure point → keep using it.</strong> The roadmap is not predicted in advance. It is uncovered through contact with the product.</p>` })}

    <p><strong>backlog-mcp is almost a controlled record of that loop:</strong></p>
    <ol>
      <li><strong>Lost agent work → tasks.</strong> Plans and research were dying inside completed chat sessions.</li>
      <li><strong>Too many tasks → search.</strong> Preservation without retrieval created a larger graveyard.</li>
      <li><strong>No situational awareness → viewer.</strong> Search could find an item but could not show the state of the system.</li>
      <li><strong>No desire to click through CRUD → read-only UI.</strong> Every useful action had to exist in the core and reach the agent first.</li>
      <li><strong>More than tasks → substrates.</strong> Artifacts, epics, folders, milestones, and memory needed one extensible model.</li>
      <li><strong>UI state kept disappearing → nisli.</strong> Native Web Components were rebuilding subtrees and destroying focus, scroll position, and investigation state.</li>
      <li><strong>Too many retrieval calls → context.</strong> The agent needed relationships and related work in one request.</li>
      <li><strong>Context died between sessions → memory.</strong> The system needed to compound instead of merely store.</li>
    </ol>
    <p>
      None of that sequence was a platform roadmap. I did not anticipate a context engine, a memory layer, a UI framework, or a static-site generator and then spend months filling boxes on a diagram. Each abstraction had to earn its existence by removing a problem in a system I was already using. This is my model of agentic product engineering: agents make construction abundant, so the engineer's leverage moves toward taste, problem selection, architecture, and the refusal to build capabilities that have not yet justified themselves.
    </p>
    <p>
      The original pressure was ordinary. Every task manager I could reach was designed for humans coordinating with humans. The agent — the thing doing a large share of my engineering — was nobody's user. Plans lived inside transcripts that would never be opened again. Research disappeared with the session that produced it. On December 19, 2025, I built the first small answer: schema, local storage, task operations, MCP.
    </p>
    <p>
      The foundational bet arrived in PR #3: replace a JSON blob with individual markdown files and YAML frontmatter. Each entity became readable by a person, editable by an agent, diffable by git, indexable by search, and portable without an export feature. Then an agent skipped an expensive read-before-write step and malformed an array update. Instead of adding another instruction telling the model to behave, I changed the API so "add one reference" no longer required replacing the entire collection.
    </p>

    ${PullQuote({ content: html`"This is not a bug in agent behavior — it's a UX problem with the API design."`, cite: '— ADR 0037, “Partial Array Updates,” January 2026' })}

    <p>
      That is the loop at API scale. Watch where real use creates waste, confusion, lost context, or dangerous shortcuts. Fix that pressure. Then return to using the product instead of inventing the next ten problems for it.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 3 — TIMELINE -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 3 — The Transformation' })}
    <h2>How the task manager <em>disappeared</em></h2>
    <p>
      There was no meeting where I decided to build an agentic context engine. The category changed one concrete problem at a time. Each line below is the same pattern: use created pressure; pressure justified a capability; the new capability exposed the next constraint. The merge stream above shows the intensity. This is what the bursts actually produced.
    </p>

    ${Timeline({ items: [
      { date: 'DEC 19, 2025', event: html`<strong>The first prototype.</strong> Schema, local storage, and a working MCP server land in the opening commits.`, note: 'The goal is still only “stop losing agent tasks.”' },
      { date: 'JAN 16, 2026 · PRs 1–10', event: html`<strong>The public foundation.</strong> CI, npm publishing, viewer work, and markdown-per-entity storage replace the original JSON model.`, note: 'Markdown becomes durable truth.' },
      { date: 'JAN 21 · PR 23', event: html`<strong>Surgical writes.</strong> <code>write_resource</code> gives agents unique-match-or-fail edits over MCP instead of paying to rewrite entire documents.`, note: 'The API begins adapting to model behavior.' },
      { date: 'JAN 24–26 · PRs 34–55', event: html`<strong>The transport wall.</strong> HTTP, stdio bridging, persistent server management, and several rejected architectures turn a small MCP server into a resilient local service.`, note: 'Seven threaded ADRs preserve the dead ends.' },
      { date: 'JAN 31–FEB 2 · PRs 39–61', event: html`<strong>Search and observability.</strong> Orama, local embeddings, hybrid retrieval, Spotlight search, operation logging, diffs, and the activity viewer arrive.`, note: 'The backlog can now retrieve and explain its own history.' },
      { date: 'FEB 8–12 · PRs 67–87', event: html`<strong>nisli is born.</strong> A rejected React spike becomes a reactive, zero-dependency Web Component framework; the entire viewer migrates to it.`, note: 'The gold cluster in the hero is the framework weekend.' },
      { date: 'FEB 14 · PR 90', event: html`<strong>Context becomes a product primitive.</strong> <code>backlog_context</code> collapses 5–10 sequential calls into one graph, activity, and semantic context bundle.`, note: 'The task tracker starts calling itself a context-engineering platform.' },
      { date: 'FEB 24 · PR 102', event: html`<strong>The framework leaves home.</strong> nisli is extracted into a public package; static rendering and SSG later make this blog possible.`, note: 'The internal solution becomes independent infrastructure.' },
      { date: 'MAR 10–APR 3 · PRs 106–117', event: html`<strong>One core, local and remote.</strong> Core functions gain CLI parity; Cloudflare Workers, D1, GitHub OAuth, and remote MCP prove the architecture can travel.`, note: 'April 3 is the final pull-request day, not the final development day.' },
      { date: 'APR 28–JUN 17', event: html`<strong>The architecture admits what it became.</strong> Storage-engine positioning, unified substrates, agentic memory, semantic intent tools, and a local-first history substrate become the north star.`, note: 'The README still says task tracker. The architecture no longer does.' },
    ] })}

    <p>
      Read chronologically, this looks like feature growth. Read architecturally, it is category discovery. Storage made context durable. Search made it retrievable. The operation log made it observable. The core extraction made MCP optional. Memory made previous work reusable. Substrates made the system open-ended. The local-first turn made the accumulated knowledge belong to the user.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 4 — ADR-DRIVEN ENGINEERING -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 4 — ADR-Driven Engineering' })}
    <h2>The specification kept changing. The decisions <em>kept compounding.</em></h2>
    <p>
      Somewhere inside this run I stopped treating Architecture Decision Records as documentation written after the engineering. They became the way I did the engineering. I call the method <strong>ADR-driven engineering</strong>.
    </p>
    <ul>
      <li><strong>A spec describes the intended result.</strong> It is valuable while implementation and intent still match.</li>
      <li><strong>An ADR preserves the decision.</strong> Pressure, evidence, alternatives, trade-offs, and reversal conditions survive even when code changes.</li>
      <li><strong>A thread preserves discovery.</strong> ADR 0013.1–0013.7 records the transport dead ends; ADR 0092 grows with memory; ADR 0106 carries semantic intent and vocabulary.</li>
    </ul>

    ${PullQuote({ content: html`Review moves upstream from “is this diff correct?” to “are we making the correct decision?”`, cite: '— the practical effect of ADR-driven engineering' })}

    <p><strong>The working sequence is explicit:</strong></p>
    <ol>
      <li><strong>Audit.</strong> The agent reads the current code and classifies the real constraints before touching anything.</li>
      <li><strong>Decide.</strong> Alternatives, consequences, open tensions, and reversal conditions go on disk.</li>
      <li><strong>Implement.</strong> Code executes the decision instead of discovering the architecture accidentally.</li>
      <li><strong>Thread.</strong> Later evidence extends or supersedes the record without erasing why the previous answer existed.</li>
    </ol>

    ${Insight({ label: 'ADR-driven engineering', content: html`<p>Start consequential work by making the decision legible: current evidence, alternatives, chosen direction, consequences, and reversal conditions. Thread later discoveries onto that record. Let the code implement the decision and let the ADR preserve why the code has its shape.</p>` })}

    <p>
      The transport saga is the cleanest example. I tried a custom stdio-to-HTTP bridge. It added a protocol layer and blocked during initialization. I investigated Streamable HTTP, but the client bridge did not support the necessary path. I considered dual transport and rejected the complexity. The answer was eventually a single <code>--transport http-only</code> flag. Without the ADR thread, that weekend looks wasteful. With it, the dead ends become infrastructure: the same question can never convincingly pretend to be new again.
    </p>

    ${PullQuote({ content: html`"Each time it feels novel because the reasoning lived only in conversation, never on disk. This ADR captures the framework so the loop stops reopening."`, cite: '— ADR 0013.7, “Transport, Bridge & Hosting,” June 2026' })}

    <p>
      This also explains why the pull requests eventually stopped. Early on, a PR was the delegation and review boundary: one agent branch, one diff, one decision to merge or reject. Later, the ADR, step-zero audit, typed core, tests, and operation journal carried more of that safety before and after the diff. The process did not become less rigorous. Its center of gravity moved from reviewing generated code to reviewing the reasoning that caused the code.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 5 — AGENTS MUTATE -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 5 — Agents Mutate, Humans Observe' })}
    <h2>A task manager with <em>no edit button</em></h2>
    <p>
      Most software assumes the human and the interface are the product boundary. backlog-mcp assumes the agent and the core are the boundary. That inversion produces an interface that looks familiar but behaves differently.
    </p>

    <div class="code-block">
<span class="cm">// every mutation follows the same accountable path</span><br><br>
<span class="fn">human intent</span> → agent → MCP / CLI → <span class="kw">core</span> → storage<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↘ operation journal<br>
viewer ← SSE ← event bus ← validated mutation
    </div>

    <ul>
      <li><strong>The core owns behavior.</strong> MCP, CLI, HTTP, and future consumers are ports around the same operations.</li>
      <li><strong>The journal owns attribution.</strong> Writes are recorded inside the core, so changing transport cannot bypass history.</li>
      <li><strong>The viewer owns observation.</strong> Entities, markdown, references, activity, and diffs update in real time without becoming a second mutation surface.</li>
    </ul>
    <p>
      If I want to change a task, capture a decision, attach evidence, or reorganize work, I tell an agent. The human stays in the control loop without becoming the data-entry layer. Resilient storage means more than markdown surviving a crash: every mutation follows one validated, attributable path.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 6 — CONTEXT, MEMORY, SUBSTRATES -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 6 — Context, Memory, and Substrates' })}
    <h2>Give the agent what it needs, <em>when it needs it</em></h2>
    <p>
      Agents are unusually sensitive to information architecture. Hide a capability and they cannot use it. Expose everything at once and the context window fills with definitions irrelevant to the current task. Good agent tooling is not maximal exposure. It is progressive disclosure for a model.
    </p>
    <p><strong>Three rules shape the context layer:</strong></p>
    <ul>
      <li><strong>Retrieve independently.</strong> BM25 and local vector search remain separate retrievers, then fuse results without allowing one normalization step to erase relevance.</li>
      <li><strong>Assemble on demand.</strong> <code>backlog_context</code> returns ancestors, children, siblings, references, recent operations, and related work in one call instead of ten.</li>
      <li><strong>Expose intent, hide substrate.</strong> <code>remember</code> is agent language; <code>create(type=memory)</code> is storage language. The model should speak the first while the core owns the second.</li>
    </ul>
    <p>
      Substrates make the entity model open-ended without blasting every type definition into the prompt. Deferred tool loading does the same for capabilities: another tool becomes a discoverable name, not a permanent context tax.
    </p>

    <h3>Decision 1: make search inspectable</h3>
    ${CompareTable({
      headers: ['Option', 'Architecture', 'Verdict'],
      rows: [
        ['A · Trust Orama hybrid', 'One black-box text + vector query', 'Rejected — wrong rankings were impossible to explain or tune'],
        ['B · Pluggable retrievers', 'Interfaces and classes for every retrieval strategy', 'Rejected for now — too much abstraction for two retrievers'],
        ['C · Independent + linear fusion', 'Separate BM25 and vector queries, normalized and fused', 'Chosen — scores stay debuggable, testable, and tunable'],
      ],
      highlightRows: [2],
    })}
    <p>
      The concrete failure was a query for <code>feature store</code> ranking the task literally about <code>FeatureStore</code> eighteenth. The pipeline had Orama hybrid scoring, another normalization layer, and a shadow re-ranker all fighting each other. Independent retrieval costs two queries instead of one, but at this scale the overhead is under 10ms. I accepted the latency to regain the ability to explain a result.
    </p>

    <h3>Decision 2: reveal types lazily</h3>
    ${CompareTable({
      headers: ['Option', 'What the agent sees', 'Verdict'],
      rows: [
        ['A · Tool per type', '15+ full schemas loaded into every session', 'Clear semantics, unacceptable eager context cost'],
        ['B · One fat CRUD tool', 'One schema containing every type-specific field', 'Smaller manifest, but storage leaked into the API and schemas drifted'],
        ['C · Substrates + lazy intent', 'Names first; exact shape only when the intent is selected', 'Chosen direction — generic core, semantic port, on-demand context'],
      ],
      highlightRows: [2],
    })}

    <div class="code-block">
<span class="kw">SUBSTRATES</span><br>
├── derives → EntitySchema <span class="cm">// discriminated Zod union</span><br>
├── drives&nbsp; → create / update validation<br>
├── drives&nbsp; → viewer type registry<br>
└── drives&nbsp; → agent hints
    </div>

    <p>
      The first answer was one generic <code>create</code>/<code>update</code> surface because clients eagerly loaded every tool definition. That avoided fifteen tools, but it created a flat schema containing fields such as <code>schedule</code>, <code>due_date</code>, and <code>content_type</code> whether the agent needed them or not. Worse, the MCP schema, core types, validation, and viewer registry began drifting apart.
    </p>
    <p>
      ADR 0098 moved type knowledge into one substrate declaration per entity: exact Zod schema, prefix, structural rules, UI metadata, and agent hint. The core now validates the discriminated shape at write boundaries. ADR 0106 takes the next step: the port should speak intent with verbs such as <code>remember</code> and <code>schedule</code>, while deferred tool loading reveals the full schema only when selected.
    </p>

    ${PullQuote({ content: html`Agent context should expand like a filesystem: names first, shape on demand, full content only when opened.`, cite: '— the reusable agentic-product rule' })}

    <p>
      The important nuance is chronological. “Fewer tools” was correct when every schema loaded eagerly. It became less correct when harnesses learned deferred loading. The durable principle was never a fixed tool count. It was minimizing irrelevant context while preserving semantic clarity.
    </p>
    <p>
      Memory was the logical next step, but the important discovery was that most of the memory already existed. Completed tasks are episodic traces. ADRs preserve semantic decisions. Artifacts preserve research and outputs. Evidence connects claims to results. The operation log preserves how state arrived. The backlog is already memory; the engineering problem is deciding what to surface, when to surface it, how much it should cost, and whether the agent can trust it.
    </p>

    ${PullQuote({ content: html`The backlog is not where memory gets stored after the work. The backlog is the memory produced by doing the work.`, cite: '— the current memory thesis' })}

    <p>
      I am now accumulating more than 200 memory artifacts, and the pressure is no longer "can the system remember?" It is "can memory stay useful as it grows?" A stale artifact can be worse than no memory because it arrives with undeserved authority. A misleading or incorrect memory can quietly bend an entire session. Retrieving too much wastes tokens and attention. Retrieving too little recreates the original amnesia.
    </p>
    <p>
      I already tried one answer and rejected it: inject memory on every agent turn. It sounded comprehensive. In use, it was bad. The agent repeatedly paid for context whether the turn needed it or not; irrelevant memories competed with the current task; and constant injection made provenance, staleness, and token cost harder to reason about. More memory did not mean better memory.
    </p>
    <ul>
      <li><strong>Token failure.</strong> Every turn paid for memory whether it needed it or not.</li>
      <li><strong>Attention failure.</strong> Irrelevant artifacts competed with the actual task.</li>
      <li><strong>Trust failure.</strong> Constant injection obscured provenance, freshness, and why a memory had been selected.</li>
    </ul>
    <p>
      I still feel the obvious FOMO. Mem0, MemPalace, Letta, Hindsight, and other established systems contain serious ideas. It is tempting to assume that adopting one of them would skip the hard part. But their abstractions were shaped by their pressures, not mine. I want to study their mechanisms — staged retrieval, decay, consolidation, provenance, temporal reasoning — without inheriting a system optimized around problems I do not yet have.
    </p>

    ${PullQuote({ content: html`Build from your own problems. Borrow from other people's solutions, not their problem statements.`, cite: '— the rule governing the memory work now' })}

    <p>
      So the current work is intentionally unresolved: better memory ergonomics, organization for hundreds of artifacts, on-demand recall, visible provenance, freshness, token budgets, and safe forgetting. The north-star test is deliberately unforgiving: an agent using backlog-mcp should be measurably better on the same project in week ten than it was in week one because of memory. That result is not proven yet. I know the pressure. I do not know the final architecture — which is exactly when this project has historically done its best work.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 7 — NISLI -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 7 — The Framework Inside the Backlog' })}
    <h2>The tool needed a UI framework that agents could <em>hold in their heads</em></h2>
    <p>
      I did not build nisli because I had never used a real framework. I have been working with UI frameworks for most of my career. I adopted Angular 2 while it was still in beta and we ran that beta in production. Since joining AWS, I have worked heavily in React. I have built with and studied the wider landscape — Angular, React, Lit, Solid, Vue, and the smaller signal-based systems around them.
    </p>
    <p>
      That experience is why I knew exactly which trade I was making. By February, backlog-mcp's viewer had more than fifteen raw <code>HTMLElement</code> classes rebuilding subtrees with <code>innerHTML</code>. Focus disappeared, listeners leaked, and agents had to reproduce lifecycle discipline manually. I ran a React spike. React would have solved the application problem, but it did not fit the system I was trying to build: zero runtime dependencies, close to the web platform, no compiler or invented syntax, and small enough that an agent could understand the whole mechanism instead of imitating framework-shaped code from training data.
    </p>
    <p><strong>The response was <a href="https://www.npmjs.com/package/@nisli/core" target="_blank">@nisli/core</a>:</strong></p>
    <ul>
      <li><strong>Web-native runtime.</strong> Web Components, tagged HTML templates, no virtual DOM, and no required build step.</li>
      <li><strong>Fine-grained state.</strong> Signals, computed values, effects, queries, lifecycle cleanup, and keyed rendering.</li>
      <li><strong>Agent-friendly contracts.</strong> Ordinary TypeScript and HTML, typed factories, lost reactivity caught at compile time, and no invented DSL.</li>
      <li><strong>Reachable internals.</strong> Roughly 2,600 lines of TypeScript, zero dependencies, named functions, and explanatory code instead of framework code golf.</li>
    </ul>

    ${PullQuote({ content: html`A framework written by agents is not enough. The framework must make correct code easier for agents to produce.`, cite: '— nisli’s design constraint' })}
    <p>
      Then the framework needed to render this site. I built a DOM-free static renderer and a static-site generation layer that turns the same component model into build-time HTML. This is SSG, not a server pretending to be a browser on every request. The output is static, cacheable, crawlable, and SEO-friendly. The blog now proves both halves of the architecture: nisli can power a live reactive application such as the backlog viewer and a content-heavy static site such as this one.
    </p>

    ${Insight({ label: 'The recursive proof', content: html`<p>backlog-mcp created the pressure for nisli. nisli created the machinery for this blog. The animated chart above renders every real merge using the framework whose creation appears as the gold cluster inside that chart.</p>` })}
  ` })}

  ${SectionBreak()}

  <!-- § 8 — LOCAL FIRST -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 8 — Local First Is the North Star' })}
    <h2>I proved it could live remotely, then chose <em>local</em></h2>
    <p>
      Remote access was not an afterthought. I moved the server to an HTTP-first architecture, built a persistent stdio bridge, added Cloudflare Workers and D1, implemented GitHub OAuth with rotating refresh tokens, and made the viewer deployable as an always-on surface. ChatGPT, Claude, a CLI, or another MCP client could reach the same backlog from anywhere.
    </p>

    ${PullQuote({ content: html`Remote proved that the architecture could travel. It did not earn the right to define the source of truth.`, cite: '— the local-first pivot' })}

    <ul>
      <li><strong>Local owns capability.</strong> Embeddings, filesystem access, hybrid search, private project data, and durable history belong beside the code.</li>
      <li><strong>Remote owns access.</strong> A hosted surface should make the local system reachable, not reduce it to the cloud's lowest common denominator.</li>
      <li><strong>Synchronization owns distance.</strong> The proposed Loro substrate records semantic operations as local-first CRDT history so agents can become peers without conflict copies.</li>
    </ul>
    <p>
      This is another case where an apparently reversed decision was actually useful engineering. Cloud deployment was not a detour. It exposed which capabilities were essential and which environment should be allowed to define them.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 9 — WHAT THE NUMBER MEANS -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 9 — What 117 Pull Requests Mean' })}
    <h2>The number is the consequence, <em>not the concept</em></h2>
    <p>
      The nine unmerged pull requests matter. #38 was superseded by the migration that worked. #45, #46, and #47 were three attempts at the same resource refactor. #53 and #54 preceded the copy-button system that finally merged in #55. The branches were not ceremonial; roughly one attempt in thirteen died at the review boundary.
    </p>
    <p>
      April 3 was the final pull-request day. Development continued directly on main because the useful review boundary had moved. ADR-first delegation, step-zero classification audits, typed core functions, tests, and the canonical operation journal were catching risk closer to the decision and closer to the mutation. For a solo maintainer working with agents, branch–PR–merge ceremony stopped paying for itself.
    </p>
    <p>
      That claim does not generalize cleanly to teams. I would bring pull requests back the moment another human shared ownership. It is also falsifiable: if the direct-commit era produces regressions that the earlier diff review would predictably have caught, the scaffolding came down too early. The journal should make that visible.
    </p>

    ${StatRow({ items: [
      { value: '117', label: html`pull requests opened` },
      { value: '108', label: html`merged across 78 days` },
      { value: '90+', label: html`indexed ADRs and decision threads` },
      { value: '1', label: html`UI framework born inside the product` },
    ] })}

    <p>
      What began as a task manager now has a clearer identity: a local-first storage engine for agentic context, with memory as its most important emerging capability. Agents write to it. Humans observe it. Search and context make its contents useful now; memory should make the agent using it better over time.
    </p>
    <p>
      More importantly, the product now has a method. Do not build what agents make possible merely because they make it possible. Build from the pressure of real use, make the decision legible in an ADR, and return to the product until it tells you what hurts next.
    </p>
    <p>
      The name still says backlog-mcp because names preserve history too. The backlog was the entry point. MCP was the first port. Neither is the boundary anymore.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 10 — THE OPEN PROBLEM -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 10 — The Part I Don’t Know How to Solve' })}
    <h2>The product I built is becoming the product <em>I avoid</em></h2>
    <p>
      Here is the part that costs me more to publish: backlog-mcp is more capable than it has ever been, and I am not using it as much as I used to.
    </p>
    <h3>What is breaking</h3>
    <ul>
      <li><strong>Organization near 1,000 entities.</strong> Finding the right epic and deciding where old work belongs have become work of their own.</li>
      <li><strong>Context that under-delivers.</strong> Retrieval has not become as useful in daily work as I expected.</li>
      <li><strong>More than 200 memory artifacts.</strong> Freshness, correctness, relevance, and token cost are no longer details I can casually trust.</li>
      <li><strong>My own adoption.</strong> The clearest product metric is also the most painful one: I reach for backlog-mcp less than I used to.</li>
    </ul>
    <p>
      Without better organization, the tool loses value with every item it successfully preserves. I may eventually ditch the tool I built because I could not find another one. I do not want that to happen. Wanting is not enough to prevent it.
    </p>
    <p>
      Every time I look at <a href="https://obsidian.md" target="_blank">Obsidian</a>, I feel this pressure from another direction. It is similar enough to make me wonder whether I spent months building a smaller version of something that already won. Sometimes that makes me want to give up entirely. I will not give up, but the feeling is real.
    </p>
    <p>
      I still believe the distinction matters. Obsidian is opinionated around a different center. backlog-mcp is agentic first: substrates declare open-ended kinds of context; agents are the mutation surface; the viewer only observes; the core exposes semantic operations to any transport. I do not think Obsidian can simply become that without fighting the vision that made it Obsidian. backlog-mcp can still pivot around the problems agentic engineering creates because its vision is not finished. That freedom is valuable. It is also another way of saying I still do not know exactly what the product is.
    </p>
    <h3>Ideas, not answers</h3>
    <ul>
      <li><strong>Routing strategies.</strong> Folders and epics could declare where certain tasks, evidence, or project context should arrive before the backlog becomes disorganized.</li>
      <li><strong>An agent substrate.</strong> Agent, session, task, and artifact correlation could persist deterministically without turning backlog-mcp into the executor.</li>
      <li><strong>Agnostic observation.</strong> I want to watch agents work through the viewer without coupling the store to whichever runtime is fashionable this month.</li>
      <li><strong>A new name.</strong> “backlog-mcp” is now underselling the product and possibly constraining how I imagine it.</li>
    </ul>
    <p>
      The routing idea arrived while writing this article. I do not know whether it is the answer. It is simply the pressure speaking clearly enough for a possible feature to appear. The agent-correlation problem is harder. I want deterministic history, but I still do not know how to model it without becoming another orchestrator.
    </p>
    <p>
      This uncertainty is probably one reason my own adoption is slowing down. When I get stuck, I do what I always do: I move to something easier. I tell myself I am clearing my mind. Sometimes I am. Sometimes I am neglecting the projects I love because returning to them means facing the part I cannot solve.
    </p>

    ${PullQuote({ content: html`I am writing an article about how far backlog-mcp has come while quietly avoiding the version of it that exists today.`, cite: '— the contradiction I cannot resolve in this post' })}

    <p>
      Maybe routing strategies are next. Maybe agent substrates. Maybe memory needs aggressive forgetting. Maybe the product needs a new name before it can find a clearer identity. Or maybe I built something that worked beautifully at one hundred artifacts and breaks at one thousand.
    </p>
    <p>
      I am not giving up. But I am not going to pretend that refusing to quit is the same thing as knowing what to build next.
    </p>
  ` })}

  ${Footnotes({ items: [
    html`① backlog-mcp — <a href="https://github.com/gkoreli/backlog-mcp" target="_blank">github.com/gkoreli/backlog-mcp</a> — local-first agentic context storage, memory, search, CLI, MCP server, and viewer`,
    html`② ADR 0097 — <a href="https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0097-agentic-storage-engine-positioning.md" target="_blank">Agentic Context Storage Engine Positioning</a> — the point where the architecture explicitly outgrew “task tracker”`,
    html`③ ADR 0090 — <a href="https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0090-cli-tool-and-core-extraction.md" target="_blank">CLI Tool and Core Function Extraction</a> — one core with MCP and CLI consumers`,
    html`④ ADR 0092 — <a href="https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0092-plugin-based-agentic-memory-architecture.md" target="_blank">Plugin-Based Agentic Memory Architecture</a> — the memory system and its research threads`,
    html`⑤ ADR 0098 — <a href="https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0098-unified-substrate-architecture.md" target="_blank">Unified Substrate Architecture</a> — declaration-driven entity types`,
    html`⑥ ADR 0106 — <a href="https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0106-semantic-intent-tools-at-mcp-boundary.md" target="_blank">Semantic Intent Tools at the MCP Boundary</a> — intent outside, substrate inside`,
    html`⑦ ADR 0107 — <a href="https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0107-loro-as-truth-local-first-history-substrate.md" target="_blank">Loro as Local-First History Substrate</a> — the proposed synchronization and multi-agent direction`,
    html`⑧ nisli — <a href="https://github.com/gkoreli/nisli" target="_blank">github.com/gkoreli/nisli</a> · <a href="https://www.npmjs.com/package/@nisli/core" target="_blank">npm</a> — the zero-dependency reactive Web Component framework born in PRs 67–87`,
    html`⑨ Pull-request data — GitHub API for <a href="https://github.com/gkoreli/backlog-mcp/pulls?q=is%3Apr" target="_blank">gkoreli/backlog-mcp</a>; 117 opened, 108 merged, nine closed without merge. Every tick in the preamble uses its real merge date.`,
  ] })}
</article>
`;
}

import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import {
  OssRadarHero, PullQuote, Callout, SectionBreak, StatRow,
  Timeline, Prognosis, Scoreboard, CompareTable, Sources,
} from '../src/templates/components.js';

export const meta: PostMeta = {
  title: 'OSS Radar #02: The Toolchain Is the Moat',
  date: '2026-04-12',
  description: 'How the Astral acquisition reveals the real war being fought in AI coding — and why everyone is talking about the wrong thing.',
  tags: ['oss-radar', 'open-source', 'python', 'ai-tooling', 'rust', 'astral', 'uv'],
  layout: 'immersive',
  slug: 'oss-radar-02-the-toolchain-is-the-moat',
};

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #02',
    date: 'April 2026',
    tags: 'open-source · python · ai-tooling · strategy',
    title: html`<h1>The Toolchain<br>Is the <em>Moat</em></h1>`,
    subtitle: 'How the Astral acquisition reveals the real war being fought in AI coding — and why everyone is talking about the wrong thing.',
    author: 'Goga Koreli',
    readTime: '12 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
<p>
  The news was treated as a developer tools story. <em>OpenAI acquires Astral, maker of Python tools uv and ruff.</em>
  Filed under: acquisitions. Discussed for a day. Moved on.
  That framing is wrong, and understanding why it's wrong puts you ahead of most of the people building software right now.
</p>

<p>
  This isn't a developer tools story. It's a territorial claim — and the territory being claimed is the layer of software
  that sits between every AI coding agent and every Python codebase on earth. To understand what OpenAI actually bought,
  you need to understand what Astral actually built, why it mattered before any AI company touched it, and what it means
  now that one of them owns it.
</p>

<h2>First: what was Astral?</h2>

<p>
  Charlie Marsh didn't set out to build infrastructure. He set out to <strong>learn Rust</strong>.
</p>

<p>
  In late 2022, he was a staff engineer at Spring Discovery — a longevity biotech — with a side itch:
  Python tooling was embarrassingly slow, and Rust seemed like the right language to fix it.
  Not a startup thesis. A hunch and a weekend. He built a linter and called it <code>ruff</code>.
</p>

${PullQuote({ content: html`<p>What if the tool was just written in the right language?</p>`, cite: 'The entire premise of Ruff — and why it worked' })}

<p>
  The premise was almost insultingly simple. Every Python linter before Ruff — Flake8, Pylint, isort, Black —
  was written in Python. A Python linter, running in Python, on Python code. The overhead is structural.
  Rust doesn't have that problem. Ruff ran <strong>10–100x faster</strong> than anything it was replacing,
  not because of a clever algorithm but because of a language choice.
</p>

<p>
  Within months of open-sourcing it, ruff was adopted by <strong>pandas, FastAPI, Apache Airflow, SciPy,
  Hugging Face, and Mozilla</strong>. Not hobbyist projects — the backbone of modern Python.
  Pylint, one of the tools ruff was replacing, <a href="https://github.com/PyCQA/pylint/blob/main/.pre-commit-config.yaml" target="_blank" rel="noopener">started using ruff as a pre-commit hook</a>.
  That's the equivalent of your competitor recommending your product.
</p>

${Callout({ label: 'Team Signal', body: html`<p>
    The Astral team includes the authors of <strong>ripgrep, bat, hyperfine, and maturin</strong> —
    among the most respected Rust-based developer tools ever written — alongside multiple CPython core developers.
    This is not a startup team. This is the best tooling team in the Python world, and probably the best
    Rust tooling team for developer infrastructure anywhere.
  </p>` })}

<p>
  Accel's partner flew to New York to meet Marsh after finding ruff on GitHub.
  They had dinner in November 2022 and agreed to work together. The $4M seed round was announced in April 2023,
  led by Accel, with angels including <strong>Guillermo Rauch</strong> (Vercel),
  <strong>Solomon Hykes</strong> (Docker), and <strong>David Cramer</strong> (Sentry) — every one of them
  has built developer infrastructure before and knows exactly what it looks like when something is becoming load-bearing.
  Then in February 2024, Astral shipped <code>uv</code>.
</p>

<h2>uv is the thing everyone should be talking about</h2>

<p>
  Ruff was impressive. uv is structurally different.
</p>

<p>
  Python has had a packaging problem for thirty years. Not a bug — a structural dysfunction. pip is slow.
  virtualenv needs to be installed separately. pyenv manages Python versions in yet another separate mental model.
  poetry tried to unify some of this and added its own complexity. pipx is for tools.
  The result: a new Python developer in 2025 needed to understand <strong>five different tools with five different mental models</strong>,
  all written in Python, all fighting each other, all slow.
</p>

<p>
  uv replaces all of them. One binary, written in Rust, with no Python dependency to install it.
</p>

${StatRow({ items: [
      { value: '0.5s', label: html`Virtual env creation<br>(vs 20–40s with pip)` },
      { value: '100×', label: html`Max speed improvement<br>over pip installs` },
      { value: '12→3min', label: html`CI/CD build time<br>after migration (real team)` },
    ] })}

<p>
  That's not incremental improvement. That's a category collapse. By 2025, uv had
  <strong>tens of millions of downloads per month</strong>. Jane Street hosted Charlie for a tech talk.
  Teams in regulated industries migrated. The Series B came from a16z. Someone on a developer forum put it plainly:
  <em>"It's pretty much a standard now in Python industry it seems."</em>
</p>

<p>
  OpenAI bought all of that on March 19, 2026, for an undisclosed sum. And the press covered it like a footnote.
</p>

${Timeline({ items: [
      { date: 'Mid-2022', event: html`<strong>Ruff open-sourced.</strong> Blows past 1M monthly downloads within months.`, note: 'Adopted by pandas, FastAPI, Airflow, HuggingFace, Mozilla, SciPy.' },
      { date: 'Apr 2023', event: html`<strong>Astral announced.</strong> $4M seed led by Accel. Angels: Rauch, Hykes, Cramer.`, note: 'Team includes authors of ripgrep, bat, hyperfine, maturin.' },
      { date: 'Feb 2024', event: html`<strong>uv ships.</strong> Replaces pip, virtualenv, pyenv, poetry, pipx in one binary.`, note: '10–100× faster. No Python required to install it.' },
      { date: '2025', event: html`<strong>Tens of millions of monthly downloads.</strong> Series B from a16z.`, note: 'ty (type checker) begins development. The third piece of the stack.' },
      { date: 'Mar 19, 2026', event: html`<strong>OpenAI acquires Astral.</strong> Entire team joins Codex. Pending regulatory approval.`, note: 'Hundreds of millions of monthly downloads across ruff + uv at time of acquisition.' },
    ] })}

<h2>The real reason this matters: AI agents need toolchains too</h2>

<p>
  Here's the reframe that changes everything.
</p>

<p>
  An AI coding agent — Codex, Claude Code, Cursor, whatever you're using — doesn't just <em>write</em> code.
  It needs to <em>run</em> code. That means installing dependencies, creating virtual environments, resolving version
  conflicts, running linters, executing type checks, managing the full project lifecycle.
  <strong>Every time Codex spins up a Python project, something has to manage that environment.</strong>
  For a significant portion of Python developers right now, that something is uv.
</p>

<p>
  Speed that's a convenience for a human is a structural bottleneck for an agent running thousands of tasks.
  Peter Steinberger — creator of OpenClaw, now at OpenAI — reported making 600 commits in a single day
  while orchestrating multiple AI agents in parallel. At that cadence,
  a 40-second virtual environment creation becomes a structural wall. uv at 0.5 seconds is not just faster.
  It's <strong>qualitatively different</strong> for agent workflows.
</p>

${PullQuote({ content: html`<p>The model layer is converging. The differentiator is increasingly the tooling layer — how well the agent sets up environments, resolves dependencies, formats code, catches errors.</p>` })}

<p>
  The AI coding agent market is projected to grow from $10 billion in 2026 to over $70 billion by 2034,
  at roughly 28% annually. Claude Code holds an 80.8% SWE-bench Verified score — the highest in the industry.
  But capability gaps close as models converge; OpenAI itself has argued that SWE-bench Verified
  no longer measures frontier coding capabilities. Toolchain position doesn't close as easily.
  If your agent runs natively on the fastest, most-adopted package manager,
  and your competitor's agent has to work around it, that's a durable structural advantage.
</p>

<p>
  This is infrastructure acquisition. The same logic as buying the roads before the cars exist.
</p>

${Scoreboard({ title: 'The Consolidation Scoreboard — AI Coding Infrastructure, 2026', rows: [
      { company: 'OpenAI', items: [
        { label: 'Codex (agent)' },
        { label: 'Astral — uv, ruff, ty (toolchain) ✦ new', isNew: true },
        { label: 'Promptfoo (testing) ✦ new', isNew: true },
        { label: 'Steinberger / OpenClaw (agents) ✦ new', isNew: true },
      ] },
      { company: 'Anthropic', items: [
        { label: 'Claude Code (agent)' }, { label: '\$2.5B ARR · 135k commits/day' },
      ] },
      { company: 'Google', items: [
        { label: 'Gemini Code Assist' },
        { label: 'Windsurf leadership + tech license (\$2.4B) ✦ new', isNew: true },
        { label: 'IDX' },
      ] },
      { company: 'Cognition', items: [
        { label: 'Devin (autonomous agent)' },
        { label: 'Windsurf (IDE) — acquired ✦ new', isNew: true },
      ] },
      { company: 'Microsoft', items: [
        { label: 'GitHub Copilot' }, { label: 'GitHub (npm, Actions)' }, { label: 'VS Code' },
      ] },
    ] })}

<h2>The broader pattern: Rust is eating every toolchain</h2>

<p>
  Astral didn't emerge in a vacuum. It's one expression of a movement that has been quietly reshaping
  developer infrastructure for five years. The pattern is consistent enough to be a thesis:
</p>

${Callout({ label: 'The Pattern', body: html`<p>
    Take a category of developer tooling that everyone uses but nobody loves. Identify that it's slow because
    it's written in a language optimized for something else. Rewrite it in Rust. Be dramatically faster. Adopt rapidly.
    Become load-bearing before anyone notices.
  </p>` })}

<p>
  In JavaScript: <strong>Evan You</strong>, creator of Vue and Vite, founded VoidZero in late 2024 specifically
  to build a unified Rust-based JavaScript toolchain. Rolldown — a Rust bundler replacing both Rollup and esbuild —
  shipped its 1.0 RC in January 2026. Oxc, the compiler infrastructure underneath it, has a linter running
  50–100x faster than ESLint and a formatter 30x faster than Prettier.
</p>

<p>
  The numbers from production teams are striking: <strong>Linear's build time dropped from 46 seconds to 6 seconds</strong>
  on Rolldown. Ramp saw a 57% reduction, Beehiiv 64%. VoidZero raised a $12.5M Series A — Accel again, the same firm
  that backed Astral. The insight isn't "we made a faster bundler."
  It's deeper: <em>parse once, do everything.</em> One shared AST across the entire toolchain.
  No redundant work, no seams between tools. A vertical integration that wasn't possible when each tool was
  a separate JavaScript project maintained by a different team.
</p>

${CompareTable({
      headers: ['Tool', 'Replaces', 'Speed gain', 'Language'],
      rows: [
        ['ruff', 'Flake8, isort, Black, Pylint + 50 plugins', '10–100×', 'Rust → Python'],
        ['uv', 'pip, virtualenv, pyenv, poetry, pipx', '10–100× install', 'Rust → Python'],
        ['Rolldown', 'Rollup + esbuild', '10–30× build', 'Rust → JS'],
        ['Oxlint', 'ESLint', '50–100×', 'Rust → JS'],
        ['Oxfmt', 'Prettier', '30×', 'Rust → JS'],
        ['Biome', 'ESLint + Prettier', '~35×', 'Rust → JS'],
      ],
      highlightRows: [0, 1],
    })}

<p>
  This is not coincidence. It's a generational shift in where developer tooling sits in the stack.
  Go proved the playbook in 2020 with esbuild. Rust expanded it. The question nobody is asking yet:
  <strong>which language ecosystem gets the Rust rewrite next, and who will own it when an AI lab decides it's strategically valuable?</strong>
</p>

${SectionBreak()}

<h2>The edges that connect</h2>

<p>
  These three threads — Astral's acquisition, the AI coding agent race, and the Rust toolchain movement —
  converge at a single point that nobody has clearly named yet:
</p>

${PullQuote({ content: html`<p>The toolchain is becoming the interface between human developers and AI agents. And it's being quietly acquired.</p>` })}

<p>
  When a human developer uses an AI coding agent, the agent's quality shows up in what it produces.
  But when an AI agent <em>uses</em> a toolchain — to install packages, run linters, check types —
  the toolchain's quality shows up in how fast and reliably the agent can operate.
</p>

<p>
  Consider what Astral's three tools actually cover:
  <code>uv</code> manages the Python environment and dependencies — what the agent builds on.
  <code>ruff</code> lints and formats the code the agent writes — how the agent validates its output.
  <code>ty</code> checks types — how the agent catches errors before running code.
</p>

<p>
  That's the entire quality-assurance pipeline of an AI coding agent, wrapped in three tools,
  now owned by one company. OpenAI didn't acquire a convenience. They acquired a chokepoint.
</p>

${Prognosis({ tag: 'watch', title: 'ty acceleration', body: html`<p>
      ty is the newest and least mature of Astral's three tools — a type checker competing with mypy and pyright.
      Watch its release cadence post-acquisition. A fast, accurate type checker is extremely valuable for an AI coding
      agent that needs to validate code it generates. If ty's roadmap suddenly accelerates, the internal customer pressure is showing.
    </p>` })}

${Prognosis({ tag: 'watch', title: 'Agent-first uv features', body: html`<p>
      Does uv get "Codex-first" features — faster cold-start environment resolution, tighter integration with OpenAI's
      sandbox runtime, optimized CI patterns for Codex workflows — before it gets features the broader community
      has been requesting? If yes, that's the roadmap being shaped by internal customer pressure, not community need.
    </p>` })}

${Prognosis({ tag: 'signal', title: 'Community PR velocity', body: html`<p>
      The quietest and most important tell. Open source health is measured not just in feature releases but in how
      quickly maintainers engage with outside contributions. If the team's priorities shift inward,
      community contributors will notice before anyone else. Watch GitHub issue response times, not changelog entries.
    </p>` })}

${Prognosis({ tag: 'risk', title: 'The license protection ceiling', body: html`<p>
      The MIT and Apache 2.0 licenses mean anyone can fork the day something goes wrong —
      Armin Ronacher (Flask's creator) called uv "a very forkable and maintainable thing." But network effects
      don't care about licenses. Once uv is in your CI pipeline, your Dockerfile, and your pre-commit hooks,
      switching has real cost. OpenAI bought that switching cost at scale. The fork option exists.
      The friction is real.
    </p>` })}

<h2>What the community missed</h2>

<p>
  Most reaction to the acquisition split predictably: <em>"they promised to keep it open source, it's fine"</em>
  versus <em>"corporate ownership corrupts everything."</em> Both miss the structural point.
</p>

<p>
  The uncomfortable question isn't about this acquisition. It's about the next one.
  <strong>Every independently-built tooling project that becomes load-bearing infrastructure is now a
  potential acquisition target.</strong> Not because AI labs want the software. Because they want the position.
</p>

<p>
  Biome, Oxc, Rolldown — if any of these become as foundational to JavaScript as uv is becoming to Python,
  they will face exactly the same pressure. Build something good enough that the ecosystem depends on it,
  and someone with strategic interests will want to own the dependency. Biome is particularly interesting here:
  it's the successor to Rome, and Astral's early team included core Rome contributors. The lineage is direct.
  VoidZero is independent today, backed by a $12.5M Series A from Accel — the same firm that seeded Astral.
  The question is how long that lasts if Rolldown becomes as ubiquitous as uv.
</p>

<p>
  The Windsurf saga is instructive. OpenAI tried to acquire the AI IDE for $3 billion — the deal collapsed.
  Google <a href="https://techcrunch.com/2025/07/11/windsurfs-ceo-goes-to-google-openais-acquisition-falls-apart/" target="_blank" rel="noopener">hired the CEO and co-founder</a> in a $2.4 billion licensing deal. Cognition (the team behind Devin)
  bought what remained for ~$250 million. One company, split three ways across three AI labs in a matter of weeks.
  That's the velocity of consolidation in this space. Developer tools that become strategically valuable
  don't stay independent for long — and the bidding war can be brutal.
</p>

${Callout({ label: 'The Question Nobody Is Asking', body: html`<p>
    What happens to the next Astral? The consolidation scoreboard isn't filling in randomly.
    AI labs are systematically acquiring the infrastructure that their agents run on.
    The "independent developer tools" category is shrinking. If you're building something in this space,
    understanding which tools belong to which AI company is becoming a strategic consideration
    — not just for users, but for builders.
  </p>` })}

${SectionBreak()}

<h2>The vision nobody is building yet</h2>

<p>
  One thing worth naming, because it sits just past the edge of what's currently visible.
</p>

<p>
  The Rust rewrite movement and the AI agent toolchain race are converging toward a world where
  <strong>the developer toolchain is designed from the ground up for agents, not humans.</strong>
  Not adapted for agents — native to them.
</p>

<p>
  VoidZero's insight — <em>parse once, do everything</em> — is a human optimization.
  It saves time for humans waiting on builds. For agents, the more interesting version of this insight is:
  <em>share context once, act everywhere.</em> An agent that understands your codebase's structure,
  dependencies, types, and lint state as a <strong>unified model</strong> — not by running five separate tools
  sequentially — could operate at a qualitatively different level than anything currently shipping.
</p>

<p>
  Nobody has built this yet — except VoidZero is getting close. Their <a href="https://voidzero.dev/posts/announcing-vite-plus-alpha" target="_blank" rel="noopener">Vite+</a>, which shipped in March 2026,
  combines bundler, test runner, linter, formatter, and type-checker into a single <code>vp</code> binary.
  Vitest 4.1 shipped an <a href="https://voidzero.dev/posts/whats-new-march-launch-week-2026" target="_blank" rel="noopener"><code>agent</code> reporter</a> that auto-detects when an AI coding agent is running tests
  and optimizes its output accordingly. That's not an afterthought — that's a team explicitly designing
  for a world where agents are first-class users of the toolchain. Astral's three-tool stack (uv + ruff + ty)
  covers the Python side but is still three separate binaries. Vite+ is the first attempt at a genuinely
  unified runtime — and it's backed by the same firm that seeded Astral.
</p>

${PullQuote({ content: html`<p>The company that builds the first genuinely agent-native toolchain will be acquired too. The question is whether it will be open source first.</p>` })}

<p>
  There's a lesson in Astral's trajectory: Charlie Marsh didn't set out to build something strategically
  valuable to AI labs. He set out to make Python tooling faster. The strategic value emerged from the
  quality of the work, not from the intent behind it. That's the pattern.
  The people building the next generation of tooling probably aren't thinking about AI agents.
  They're thinking about what's slow, what's fragmented, and what Rust could fix.
</p>

<p>
  That's the right instinct. The wrong assumption is that the thing they build will stay independent.
</p>

<div class="radar-research-note">
  <strong>Research Note</strong>
  Primary sources: official announcements from
  <a href="https://openai.com/index/openai-to-acquire-astral/" target="_blank" rel="noopener">OpenAI</a>,
  <a href="https://astral.sh/blog/openai" target="_blank" rel="noopener">Astral</a>, and
  <a href="https://www.accel.com/noteworthies/astral-how-a-side-project-changed-python-tooling" target="_blank" rel="noopener">Accel</a>.
  Benchmark data from <a href="https://voidzero.dev/posts/whats-new-march-launch-week-2026" target="_blank" rel="noopener">VoidZero recaps</a>
  and the Jane Street tech talk transcript (Charlie Marsh).
  Windsurf reporting from TechCrunch, Bloomberg, and Business Insider (Jul 2025).
  Download stats via PyPI and npm-stat.
  GitHub exploration and dependency mapping done with <a href="https://github.com/gkoreli/ghx" target="_blank" rel="noopener">ghx</a>.
</div>

${Sources({ items: [
      { claim: 'Ruff open-sourced mid-2022; 1M+ downloads within months; adopted by pandas, FastAPI, Airflow, SciPy, HuggingFace, Mozilla', ref: 'astral.sh announcement, Apr 2023', url: 'https://astral.sh/blog/announcing-astral-the-company-behind-ruff' },
      { claim: 'Accel dinner Nov 2022; $4M seed announced Apr 2023; angels Rauch, Hykes, Cramer', ref: 'Accel investor note, Mar 2026', url: 'https://www.accel.com/noteworthies/astral-how-a-side-project-changed-python-tooling' },
      { claim: 'Team: authors of ripgrep, bat, hyperfine, maturin; core contributors to Rome/Biome; CPython core devs', ref: 'astral.sh/about', url: 'https://astral.sh/about' },
      { claim: 'uv ships Feb 2024; virtual env 0.5s vs 20–40s; 10–100× faster installs', ref: 'Astral blog, Feb 2024', url: 'https://astral.sh/blog/uv' },
      { claim: 'CI pipeline 12 min → 3 min after uv migration (50-microservice architecture)', ref: 'ELEKS engineering blog', url: 'https://eleks.com/expert-opinion/next-gen-python-packaging-uv/' },
      { claim: 'Tens of millions of downloads/month by 2025; Series B from a16z', ref: 'Jane Street tech talk (Charlie Marsh)', url: 'https://www.janestreet.com/tech-talks/uv-an-extremely-fast-python-package-manager/' },
      { claim: 'OpenAI acquires Astral March 19 2026; Codex 2M WAU, 3× user growth, 5× usage increase', ref: 'OpenAI announcement', url: 'https://openai.com/index/openai-to-acquire-astral/' },
      { claim: 'Astral to join OpenAI; tools remain open source', ref: 'Astral blog (Charlie Marsh)', url: 'https://astral.sh/blog/openai' },
      { claim: 'Claude Code: $2.5B ARR, 135k GitHub commits/day, 80.8% SWE-bench Verified', ref: 'Pragmatic Engineer, Feb 2026', url: 'https://newsletter.pragmaticengineer.com/p/the-creator-of-clawd-i-ship-code' },
      { claim: 'AI code tools market ~$10B (2026) → ~$70B by 2034, ~28% CAGR', ref: 'Fortune Business Insights', url: 'https://www.fortunebusinessinsights.com/ai-code-tools-market-111725' },
      { claim: 'OpenAI: SWE-bench Verified no longer measures frontier coding capabilities', ref: 'OpenAI blog, Apr 2026', url: 'https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/' },
      { claim: 'Linear 46s→6s, Ramp 57%, Beehiiv 64% build improvement on Rolldown', ref: 'VoidZero Launch Week recap', url: 'https://voidzero.dev/posts/whats-new-march-launch-week-2026' },
      { claim: 'Rolldown 1.0 RC Jan 2026; 10–30× faster than Rollup', ref: 'VoidZero announcement', url: 'https://voidzero.dev/posts/announcing-rolldown-rc' },
      { claim: 'Oxlint JS Plugins: near-100% ESLint compat, up to 100× faster', ref: 'VoidZero Launch Week recap', url: 'https://voidzero.dev/posts/whats-new-march-launch-week-2026' },
      { claim: 'MIT/Apache 2.0 licenses; Ronacher: "a very forkable and maintainable thing"', ref: 'Simon Willison blog, Aug 2024', url: 'https://blog.simonwillison.net/2024/Aug/21/armin-ronacher/' },
      { claim: 'Windsurf: OpenAI $3B deal collapsed; Google hired CEO ($2.4B license); Cognition acquired remainder', ref: 'TechCrunch, Jul 2025', url: 'https://techcrunch.com/2025/07/11/windsurfs-ceo-goes-to-google-openais-acquisition-falls-apart/' },
      { claim: 'Steinberger: 600 commits/day orchestrating AI agents; joined OpenAI Feb 2026', ref: 'Pragmatic Engineer', url: 'https://newsletter.pragmaticengineer.com/p/the-creator-of-clawd-i-ship-code' },
      { claim: 'OpenAI acquires Promptfoo Mar 9 2026; used by 25%+ Fortune 500', ref: 'OpenAI announcement', url: 'https://openai.com/index/openai-to-acquire-promptfoo/' },
      { claim: 'Vite+ alpha: single binary combining Vite, Vitest, Oxlint, Oxfmt, Rolldown, tsdown', ref: 'VoidZero announcement, Mar 2026', url: 'https://voidzero.dev/posts/announcing-vite-plus-alpha' },
      { claim: 'Vitest 4.1 agent reporter: auto-detects AI coding agents, optimizes output', ref: 'VoidZero Launch Week recap', url: 'https://voidzero.dev/posts/whats-new-march-launch-week-2026' },
    ] })}</article>
  `;
}

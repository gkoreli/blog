import { html } from 'nisli-static';
import type { StaticResult } from 'nisli-static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import {
  Callout,
  CompareTable,
  OssRadarHero,
  PullQuote,
  ScrollReveal,
  SectionBreak,
  SectionNum,
  Sources,
} from '../src/templates/components.js';

export const meta: PostMeta = {
  title: "You Don't Always Need Codemap",
  date: '2026-04-17',
  description: "Code context tools are not interchangeable. Codemap, Aider, Gitingest, Repomix, and ghx optimize for different moments in an agent's workflow.",
  tags: ['ghx', 'code-mapping', 'context-engineering', 'open-source', 'agentic-engineering'],
  layout: 'immersive',
  slug: 'you-dont-need-codemap',
};

function Section({ label, children, final = false }: { label: string; children: StaticResult; final?: boolean }) {
  return html`
    ${ScrollReveal({
      content: html`
        ${SectionNum({ label })}
        ${children}
      `,
    })}
    ${final ? '' : SectionBreak()}
  `;
}

function CodeBlock({ code }: { code: string }) {
  return html`<pre class="code-block"><code>${code}</code></pre>`;
}

export function preamble() {
  return OssRadarHero({
    issueNum: 'Field Note',
    date: 'April 17, 2026',
    tags: 'ghx · code mapping · context engineering · agents',
    title: html`<h1>You Don't Always<br>Need <em>Codemap</em></h1>`,
    subtitle: 'The first decision is not which tool should read the repo. The first decision is whether the repo deserves to be read at all.',
    author: 'Goga Koreli',
    readTime: '8 min read',
    canvasMode: 'caustic',
  });
}

export function article() {
  return html`
    <article class="post-content">
      ${Section({
        label: '§ 0 — The Wrong First Move',
        children: html`
          <p>
            Most advice about AI code context starts too late. It assumes the
            repo has already been chosen, cloned, and promoted into the coding
            session. From there, the only remaining question seems to be how
            much of it to compress and hand to the model.
          </p>

          <p>
            That is often useful. It is also often the wrong first move. Agents
            spend a lot of time in a messier state: comparing libraries,
            auditing dependencies, checking whether a pattern exists, or trying
            to find the one file that matters in a repository they may never
            clone.
          </p>

          <p>
            In that state, "clone the repo and build a complete map" is not
            neutral. It is a commitment. A lot of workflows make that
            commitment early, then call the resulting pile of context agentic
            engineering.
          </p>

          <p>It is not.</p>

          <p>
            Agentic engineering is not "give the model more stuff." It is
            making the next action cheaper, narrower, and easier to verify.
          </p>

          ${PullQuote({
            content: html`"The question is not which context tool is best. The
            question is what decision the agent is trying to make right now."`,
          })}

          <p>
            <a href="https://github.com/kcosr/codemap" target="_blank" rel="noopener">Codemap</a>,
            <a href="https://github.com/Aider-AI/aider" target="_blank" rel="noopener">Aider</a>,
            <a href="https://github.com/coderamp-labs/gitingest" target="_blank" rel="noopener">Gitingest</a>,
            <a href="https://github.com/yamadashy/repomix" target="_blank" rel="noopener">Repomix</a>,
            and <a href="https://github.com/gkoreli/ghx" target="_blank" rel="noopener">ghx</a>
            all live near the same problem. They help agents see code without
            drowning in it. But they do not do the same job.
          </p>

          <ul>
            <li>If the decision is <strong>what should I send to the model?</strong>, use a packer.</li>
            <li>If the decision is <strong>how is this local codebase structured?</strong>, use a mapper.</li>
            <li>If the decision is <strong>is this remote repo even worth reading?</strong>, use ghx.</li>
          </ul>

          <p>
            ghx is built around a deliberately narrow belief: the best context
            is often the context you do not load.
          </p>
        `,
      })}

      ${Section({
        label: '§ 1 — Mapping Is Not Packing',
        children: html`
          <h2>Code mapping is not repo packing</h2>

          <p>
            Two workflows get blurred together because both produce
            model-shaped context.
          </p>

          <p>
            <strong>Repo packing</strong> prepares a large artifact for a model
            to consume: XML, Markdown, JSON, plain text, or some digest format.
            It answers: <em>what should I send to the model?</em>
          </p>

          <p>
            <strong>Code mapping</strong> extracts structure before the agent
            reads implementation: imports, types, functions, classes, methods,
            line ranges, references, and sometimes comments. It answers:
            <em>what should I read next?</em>
          </p>

          ${Callout({
            label: 'The operating difference',
            body: html`<p>A packed repo is a commitment to context. A map is a refusal to commit too early.</p>`,
          })}

          <p>
            That refusal matters. The first full-file read is often where an
            agent goes wrong. It reads implementation before relevance is
            established, then the next prompt inherits helper functions,
            generated code, compatibility branches, comments, tests, and
            whatever else happened to be nearby.
          </p>

          <p>The disciplined path asks structural questions first:</p>

          <ul>
            <li>What files exist?</li>
            <li>Which files define the public surface?</li>
            <li>Which files contain the functions, types, or imports I care about?</li>
            <li>Which file deserves a full read?</li>
          </ul>

          <p>
            An agent trying to understand an unfamiliar package does not always
            need every source file. Often it only needs the skeleton.
          </p>

          ${CodeBlock({ code: 'ghx read gkoreli/ghx --map v2/pkg/ghx/explore.go' })}

          ${CodeBlock({
            code: `=== v2/pkg/ghx/explore.go (3111 bytes) ===
package ghx
import (
type FileEntry struct {
type ExploreResult struct {
func Explore(repo string, path string) (*ExploreResult, error) {`,
          })}

          <p>
            That map is not a replacement for reading the file. It is the step
            before reading the file.
          </p>

          <p>Without that step, the agent usually does this:</p>

          ${CodeBlock({
            code: `list directory
read likely file
read another likely file
read third likely file
realize the useful thing was in a fourth file`,
          })}

          <p>With ghx, the first pass can stay structural:</p>

          ${CodeBlock({
            code: `ghx read shadcn-ui/ui packages/shadcn/src/utils
ghx read shadcn-ui/ui "packages/shadcn/src/utils/*.ts" --map`,
          })}

          <p>
            The point is not the exact token count in a README example. The
            point is that the agent sees the neighborhood before choosing a
            house to enter.
          </p>
        `,
      })}

      ${Section({
        label: '§ 2 — The Search Trap',
        children: html`
          <h2>The GitHub code search correction</h2>

          <p>
            There is an attractive shortcut that does not work: "just use
            GitHub's <code>symbol:</code> search through the API."
          </p>

          <p>
            <a href="https://docs.github.com/en/search-github/github-code-search/about-github-code-search" target="_blank" rel="noopener">GitHub.com has modern code search</a>.
            The web UI understands queries like <code>symbol:useState</code>.
            That product is backed by richer infrastructure than the public
            code-search APIs expose.
          </p>

          <ul>
            <li>REST <code>/search/code</code> still exists, but it uses the legacy code search engine.</li>
            <li><a href="https://cli.github.com/manual/gh_search_code" target="_blank" rel="noopener"><code>gh search code</code></a> says results may not match GitHub.com, and newer features like regex search are unavailable through the API.</li>
            <li>GraphQL v4 has a <code>search</code> field, but <a href="https://docs.github.com/en/graphql/reference/enums#searchtype" target="_blank" rel="noopener"><code>SearchType</code></a> does not include <code>CODE</code>.</li>
          </ul>

          <p>
            So <code>ghx search --symbol</code> is not a cheap feature waiting
            to be wired up. Pretending otherwise would produce plausible
            garbage, which is worse than an error. It teaches the agent
            confidence at the exact moment it should be skeptical.
          </p>

          <p>The honest design is smaller:</p>

          <ol>
            <li>Fetch files through documented GitHub APIs.</li>
            <li>Parse the content locally.</li>
            <li>Return compact structural maps.</li>
            <li>Fall back when a parser is unavailable.</li>
          </ol>

          <p>
            That is why <code>--kind</code> is the right interface. It filters
            structural categories inside fetched files instead of pretending to
            be GitHub-wide symbol search.
          </p>

          ${CodeBlock({
            code: `ghx read owner/repo --map --kind func path/to/file.ts
ghx read owner/repo --map --kind type path/to/file.ts`,
          })}

          <p>
            The API cannot reliably answer "where is symbol X defined across
            GitHub?" ghx can answer "what functions, types, and imports does
            this fetched file contain?" That second question is smaller, but it
            is real.
          </p>

          ${PullQuote({ content: html`"Real beats pretend. Every time."` })}
        `,
      })}

      ${Section({
        label: '§ 3 — Tool Boundaries',
        children: html`
          <h2>The mature tools have different cost models</h2>

          <p>
            The weak tools in this category all fail the same way. They say
            "AI-friendly" and then hand the model a wall of text. The strong
            tools have a cost model. They know what they are making cheap.
          </p>

          ${CompareTable({
            headers: ['Tool', 'Optimizes for', 'Cost paid up front', 'Best output'],
            rows: [
              ['Codemap', 'Deep local understanding', 'Local repo plus indexing', 'Structural index, references, maps'],
              ['Aider repomap', 'Coding-session relevance', 'Local repo plus active chat state', 'Ranked context for Aider'],
              ['Gitingest', 'Fast digest generation', 'Clone/fetch plus full digest pass', 'Prompt-friendly repo extract'],
              ['Repomix', 'Complete AI-ready packaging', 'File collection plus packing/compression', 'XML, Markdown, JSON, or plain text artifact'],
              ['ghx', 'Remote first-pass exploration', 'GitHub API calls only for requested paths', 'Tree, map, grep, selective reads'],
            ],
            highlightRows: [4],
          })}

          <h3>Codemap: local structural indexing</h3>
          <p>
            Codemap is the strongest local code-mapping tool I found. Its
            README has the right vocabulary: <code>full</code>,
            <code>standard</code>, <code>compact</code>, <code>minimal</code>,
            and <code>outline</code>. The implementation backs it up with
            token-budget reduction, cache refresh, reference updates, nested
            symbol rendering, call graphs, type hierarchy, and dedicated
            extraction across several language families.
          </p>

          <p>
            That is not a toy. Codemap is a local structural database with a
            CLI on top. It is deeper than ghx. ghx is earlier in the workflow.
            That difference is not a weakness to apologize for. It is the
            product boundary.
          </p>

          <p>
            The point is not only that Codemap extracts symbols. It does the
            hard boring work around them: <code>DETAIL_LEVELS</code>,
            <code>reduceDetailLevel</code>, <code>fitToBudget</code>, cache
            refresh, reference updates, source-map generation, comments at the
            right detail levels, and reference summaries. Those details matter
            because repeated local analysis gets worse fast when the cache,
            budget, and renderer are naive.
          </p>

          <h3>Aider repomap: context selection inside a coding agent</h3>
          <p>
            Aider's repo map is not a neutral "map my repo" product. It is part
            of Aider's coding loop. It extracts tags, caches them, tracks
            definitions and references, uses graph ranking, and fits the result
            to the active token budget. The map is intentionally biased by the
            current chat files, mentioned identifiers, and model context.
          </p>

          <p>
            That makes sense. Aider already knows the conversation. ghx is for
            the earlier moment when an agent is still scouting.
          </p>

          <p>
            The ranking is the important part. Aider is not just listing
            symbols. It uses Tree-sitter tags, cached definitions and
            references, mentioned files, mentioned identifiers, PageRank-style
            graph scoring, and token-budget fitting. A neutral map would be
            less useful inside an already-running coding session.
          </p>

          <h3>Gitingest: prompt-friendly repo digests</h3>
          <p>
            Gitingest lowers friction from GitHub URL to LLM-readable digest.
            Clone handling, ignore patterns, tree walking, token estimates, and
            output formatting all serve that job. It is useful. It is also not
            exploration. Digesting a repo before you know what you need is just
            a polite way to overfeed the model.
          </p>

          <p>
            The product idea is memorable because the interface is memorable:
            replace <code>hub</code> with <code>ingest</code> in a GitHub URL
            and get a prompt-shaped view of the repository. That is a good
            workflow. It is just a different workflow from scouting.
          </p>

          <h3>Repomix: full-repo packing with smart compression</h3>
          <p>
            Repomix is the most polished repo-packing tool in this set. It
            supports local and remote repositories, several output formats,
            config files, ignore handling, token counts, secret scanning, git
            logs, diffs, output splitting, GitHub Actions, Docker, and
            Tree-sitter compression through WASM.
          </p>

          <p>
            When the job is "prepare this codebase for an LLM," use it. The
            mistake is reaching for a packer when the agent has not established
            which files matter.
          </p>

          <p>
            Its Tree-sitter compression path is also a good example of
            practical engineering. Repomix uses WASM Tree-sitter so compression
            can stay cross-platform, avoid native compilation, bundle parsers,
            and accept the overhead where the distribution trade-off is worth
            it.
          </p>

          <p>
            Tools reveal their philosophy through what they make cheap. Codemap
            makes repeated local structural queries cheap. Aider makes
            coding-session context cheap. Gitingest and Repomix make "send the
            repo to a model" cheap. ghx makes not cloning cheap.
          </p>

          <p>
            Not cloning is not laziness. It is a different default. "Just clone
            it" is not engineering guidance. It is a local optimum disguised as
            wisdom. Sometimes you should clone it. Sometimes cloning is the
            wrong first IO operation.
          </p>

          <p>The agent does not need a copy of the repo to ask what is in the repo.</p>
        `,
      })}

      ${Section({
        label: '§ 4 — The Cost Model',
        children: html`
          <h2>Agentic engineering is a cost model</h2>

          <p>
            The phrase "agentic engineering" gets abused because people want it
            to mean architecture plus vibes. It is simpler than that. In
            practice, agentic engineering is the discipline of shaping the
            environment so the agent can make the next correct move with less
            context, less guessing, and fewer irreversible actions.
          </p>

          <p>That means the tool should care about:</p>

          <ul>
            <li>what the agent knows right now</li>
            <li>what the agent needs to decide next</li>
            <li>what evidence would change that decision</li>
            <li>how much irrelevant context the tool is about to inject</li>
            <li>whether the output can be checked by the next command</li>
          </ul>

          ${Callout({
            label: 'The line',
            body: html`<p>If a tool cannot answer those questions, it is not an agent tool yet. It is a content hose.</p>`,
          })}

          <p>
            ghx is built from the opposite direction. It assumes the agent is
            not ready for the whole repo. It assumes the first answer should be
            small. It assumes the agent should be able to escalate: repo
            overview, tree, map, filtered map, grep, file read.
          </p>

          <p>
            That is why this little binary has taken so much work. The hard
            part is not printing files from GitHub. Anyone can do that. The
            hard part is designing the sequence so agents stop doing the dumb
            expensive thing by default.
          </p>
        `,
      })}

      ${Section({
        label: '§ 5 — ghx Territory',
        children: html`
          <h2>Where ghx fits</h2>

          <p>
            ghx is not trying to become a local static-analysis database, a
            full coding agent, or a repo packer. Good. It should not.
          </p>

          <p>
            Its bet is narrower: agents often need to inspect GitHub repos they
            have not cloned and may never clone. They compare libraries, audit
            dependencies, inspect examples, and check whether a pattern exists
            before reading implementation.
          </p>

          <p>Clone-first tools add friction in that workflow:</p>

          <ul>
            <li>A clone costs time.</li>
            <li>A clone costs disk.</li>
            <li>A clone may be unavailable in locked-down environments.</li>
            <li>A clone is wasteful if the repo is only being sampled.</li>
            <li>A local index is overkill if the agent only needs three files.</li>
          </ul>

          <p>
            The deeper cost is posture. Once the repo is local, the temptation
            is to search broadly, read broadly, and stuff context broadly. That
            can be correct for implementation work. It is wasteful for
            reconnaissance.
          </p>

          ${CodeBlock({
            code: `Do not read the file yet.
First ask what files exist.
Then ask what those files contain.
Then read the smallest thing that can answer the question.`,
          })}

          <p>ghx keeps that first pass API-native:</p>

          ${CodeBlock({
            code: `ghx explore owner/repo
ghx tree owner/repo src
ghx read owner/repo --map "src/**/*.ts"
ghx read owner/repo --map --kind func path/to/file.ts
ghx read owner/repo --grep "pattern" path/to/file.ts
ghx read owner/repo path/to/file.ts`,
          })}

          <p>The model is progressive disclosure:</p>

          <ol>
            <li>Look at repo metadata and top-level files.</li>
            <li>List the tree.</li>
            <li>Map candidate files.</li>
            <li>Filter by symbol kind.</li>
            <li>Read only the files that matter.</li>
          </ol>

          <p>
            The old <code>--map</code> implementation was regex-based. Useful,
            but limited. The current engine is parser-backed for common cases:
            Go uses <code>go/ast</code>; TypeScript, TSX, JavaScript, JSX,
            Python, and Rust use Tree-sitter through a CGo-free Go runtime.
            Unsupported languages fall back to regex.
          </p>

          <p>
            That keeps the promise intact: remote code orientation without
            cloning. The small interface hides real engineering choices:
            GraphQL batching, directory handling, glob expansion, parser
            routing, Go AST where it wins, Tree-sitter where it wins, regex
            fallback where it is honest, and output designed for agents instead
            of humans scrolling a terminal.
          </p>

          <p>
            It also keeps ghx honest. If a parser is not available, ghx falls
            back. If GitHub's public API does not expose modern code search,
            ghx does not pretend that it does.
          </p>

          ${PullQuote({
            content: html`"Bad agent tools fail by looking successful."`,
            cite: 'A query returns results, a context blob looks comprehensive, and the model reasons from the wrong slice.',
          })}

          <p>
            If the tool cannot be honest about uncertainty, the model will be
            dishonest with confidence.
          </p>

          ${Callout({
            label: 'The product rule',
            body: html`<p>ghx should give the agent enough structure to choose the next read. It should not pretend every GitHub investigation needs a local database, a giant prompt artifact, or a full call graph.</p>`,
          })}
        `,
      })}

      ${Section({
        label: '§ 6 — Try It',
        children: html`
          <h2>The smallest useful version</h2>

          <p>
            If you want the practical setup, the
            <a href="https://github.com/gkoreli/ghx#install" target="_blank" rel="noopener">ghx README</a>
            has the install commands, MCP config, and <code>ghx skill</code>
            output for teaching an agent how to use it. The whole idea fits in
            one instruction:
          </p>

          ${Callout({
            label: 'Agent rule',
            body: html`<p>When inspecting a GitHub repo, use <code>ghx explore</code>, <code>ghx tree</code>, <code>ghx read --map</code>, or <code>ghx read --grep</code> before cloning, packing, or reading whole files.</p>`,
          })}

          <p>A good first pass is intentionally boring:</p>

          ${CodeBlock({
            code: `npx @gkoreli/ghx explore owner/repo
npx @gkoreli/ghx read owner/repo --map "src/**/*.ts"
npx @gkoreli/ghx read owner/repo path/to/file.ts`,
          })}
        `,
      })}

      ${Section({
        label: '§ 7 — The Decision Framework',
        final: true,
        children: html`
          <h2>Use the tool that matches the decision</h2>

          ${CodeBlock({
            code: `Where is the code?
├── Local filesystem
│   ├── Need deep structural/indexed analysis? -> Codemap
│   ├── Coding inside Aider? -> Aider repo map
│   └── Need one packed prompt artifact? -> Repomix or Gitingest
└── Remote GitHub repo
    ├── Need a complete packed artifact? -> Repomix remote or Gitingest
    └── Need to inspect before reading/cloning? -> ghx
        ├── Start with repo shape -> ghx explore / ghx tree
        ├── Need structure -> ghx read --map
        ├── Need only functions/types/imports -> ghx read --map --kind
        └── Need implementation -> ghx read`,
          })}

          <p>
            The next ghx surface should follow the same rule. A top-level
            <code>ghx map</code> command would be useful for humans, but it
            should be a wrapper over <code>read --map</code>, not a second
            implementation. Repo-wide mapping should be capped and filtered by
            default. If a user wants the whole repo packed, Repomix and
            Gitingest already exist.
          </p>

          ${PullQuote({
            content: html`"Before you clone, map."`,
            cite: 'Not always. Not forever. Just first.',
          })}

          <p>
            That sentence is useful because it changes behavior. It tells the
            agent to delay the irreversible move from "I am investigating" to
            "I am loading context."
          </p>

          <ul>
            <li>Do not clone before you know the repo matters.</li>
            <li>Do not pack before you know the files matter.</li>
            <li>Do not read implementation before structure.</li>
            <li>Do not call legacy search modern.</li>
            <li>Do not mistake more context for better engineering.</li>
          </ul>

          <p>
            Codemap is the local structural index. Aider's repo map is context
            selection inside a coding agent. Gitingest is the quick repo digest.
            Repomix is the full-featured repo packer. ghx is the remote GitHub
            exploration layer.
          </p>

          <p>
            The point is not to make ghx win every row of a comparison table.
            The point is to stop using the wrong row. Universal claims age
            badly. Narrow tools with clear cost models survive contact with
            real workflows.
          </p>

          <p>
            That is why you do not always need Codemap. Sometimes you
            absolutely do. But sometimes the agent is standing outside the repo,
            hand on the doorknob, not yet sure it should go in.
          </p>

          <p>That is ghx territory.</p>

          <p>I trust a tool more when it can tell me what not to use it for.</p>
        `,
      })}

      ${Sources({
        items: [
          {
            claim: 'GitHub.com code search supports regex, boolean operators, specialized qualifiers, and symbol search in the web product.',
            ref: 'GitHub Code Search',
            url: 'https://docs.github.com/en/search-github/github-code-search/about-github-code-search',
          },
          {
            claim: 'GitHub documents the syntax for modern code search, including the symbol qualifier.',
            ref: 'Code Search Syntax',
            url: 'https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax',
          },
          {
            claim: 'GraphQL has a search field, but its public SearchType enum does not include CODE.',
            ref: 'GraphQL Search',
            url: 'https://docs.github.com/en/graphql/reference/queries#search',
          },
          {
            claim: 'The live GraphQL schema checked on 2026-04-15 returned ISSUE, ISSUE_ADVANCED, ISSUE_SEMANTIC, ISSUE_HYBRID, REPOSITORY, USER, and DISCUSSION.',
            ref: 'SearchType Enum',
            url: 'https://docs.github.com/en/graphql/reference/enums#searchtype',
          },
          {
            claim: 'GitHub CLI warns that code search results may not match GitHub.com and newer features such as regex are unavailable through the API.',
            ref: 'gh search code',
            url: 'https://cli.github.com/manual/gh_search_code',
          },
          {
            claim: 'GitHub keeps separate legacy code-search documentation for public API-era search behavior.',
            ref: 'Legacy Code Search',
            url: 'https://docs.github.com/en/search-github/searching-on-github/searching-code',
          },
          {
            claim: 'ghx search currently uses REST code search with text matches.',
            ref: 'ghx search.go',
            url: 'https://github.com/gkoreli/ghx/blob/main/v2/pkg/ghx/search.go',
          },
          {
            claim: 'ghx read batches GitHub file and directory fetches, then maps fetched content locally.',
            ref: 'ghx read.go',
            url: 'https://github.com/gkoreli/ghx/blob/main/v2/pkg/ghx/read.go',
          },
          {
            claim: 'ghx glob handling is part of the selective remote-read path.',
            ref: 'ghx glob.go',
            url: 'https://github.com/gkoreli/ghx/blob/main/v2/pkg/ghx/glob.go',
          },
          {
            claim: 'The map command design is captured in the ghx ADR for parser-backed mapping.',
            ref: 'ADR-0013',
            url: 'https://github.com/gkoreli/ghx/blob/main/docs/adr/0013-ghx-map-command.md',
          },
          {
            claim: 'ghx parser routing is explicit: Go uses go/ast; TypeScript, TSX, JavaScript, JSX, Python, and Rust use gotreesitter; unsupported languages fall back to regex.',
            ref: 'mapengine types',
            url: 'https://github.com/gkoreli/ghx/blob/main/v2/internal/mapengine/types.go',
          },
          {
            claim: 'The Go map engine uses go/ast instead of Tree-sitter for top-level declaration extraction.',
            ref: 'goast.go',
            url: 'https://github.com/gkoreli/ghx/blob/main/v2/internal/mapengine/goast.go',
          },
          {
            claim: 'The Tree-sitter-backed path handles the non-Go language map engine.',
            ref: 'treesitter.go',
            url: 'https://github.com/gkoreli/ghx/blob/main/v2/internal/mapengine/treesitter.go',
          },
          {
            claim: 'Codemap documents named detail levels, local code mapping, references, and call graph features.',
            ref: 'kcosr/codemap',
            url: 'https://github.com/kcosr/codemap',
          },
          {
            claim: 'Codemap implements token-budget reduction and source-map machinery in its core source map module.',
            ref: 'sourceMap.ts',
            url: 'https://github.com/kcosr/codemap/blob/main/src/sourceMap.ts',
          },
          {
            claim: 'Codemap rendering groups and formats symbols for mapped output.',
            ref: 'render.ts',
            url: 'https://github.com/kcosr/codemap/blob/main/src/render.ts',
          },
          {
            claim: 'Aider describes repo maps as context selected for the active coding conversation.',
            ref: 'Aider Repo Map',
            url: 'https://aider.chat/docs/repomap.html',
          },
          {
            claim: 'Aider repomap implementation uses tags, references, ranking, and token-budget fitting.',
            ref: 'repomap.py',
            url: 'https://github.com/Aider-AI/aider/blob/main/aider/repomap.py',
          },
          {
            claim: 'Gitingest is a prompt-friendly repository digest tool with CLI and Python entry points.',
            ref: 'Gitingest',
            url: 'https://github.com/coderamp-labs/gitingest',
          },
          {
            claim: 'Gitingest clone handling, ingestion, and output formatting back the digest workflow.',
            ref: 'output_formatter.py',
            url: 'https://github.com/coderamp-labs/gitingest/blob/main/src/gitingest/output_formatter.py',
          },
          {
            claim: 'Repomix packs repositories into AI-friendly artifacts across local, remote, CI, Docker, and website workflows.',
            ref: 'Repomix',
            url: 'https://github.com/yamadashy/repomix',
          },
          {
            claim: 'Repomix compression uses web-tree-sitter WASM in its Tree-sitter parsing path.',
            ref: 'parseFile.ts',
            url: 'https://github.com/yamadashy/repomix/blob/main/src/core/treeSitter/parseFile.ts',
          },
        ],
      })}
    </article>
  `;
}

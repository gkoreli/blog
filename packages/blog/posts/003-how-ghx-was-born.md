---
title: "Build the GitHub Exploration Tool, No Mistakes"
date: "2026-03-29"
description: "A CLI tool that looks simple took 23 agent sessions, 2,500+ turns, and three rewrites. This is what building with AI actually looks like."
section: engineering
tags: [ghx, agentic-engineering, open-source, build-in-public, context-engineering]
series:
  name: ghx field notes
  order: 1
relatedPosts: [/you-dont-need-codemap]
---

# Build the GitHub Exploration Tool, No Mistakes

**Never write prompts like this.** Save yourself the money and the rest of us the computing capacity. Here's what's actually wrong with this mindset:

1. **"No mistakes" at the end of your prompt won't save you.** Spoiler: the agent doesn't care. It was going to hallucinate that API endpoint either way.
2. **A tool built in 10 minutes is a demo, not a product.** Anyone can rebuild it with their $20 subscription in a week. Why would anyone use yours?
3. **The agent is not the builder. You are.** The agent does the typing. You do the thinking — the architectural decisions, the pushback when it takes shortcuts, the depth to know when "good enough" isn't.

This is the story of building [ghx](https://github.com/gkoreli/ghx) — a simple CLI tool that took 23 agent sessions and 2,500+ conversation turns to get right. The full lifecycle, unfiltered.

## The frustration that started everything

March 6, 2026. I was building [this blog](https://gkoreli.com). I needed SVG icons from [Lucide](https://lucide.dev/) on GitHub. My agent did what agents do — it called `web_fetch` on the GitHub URL.

What came back was a wall of HTML noise. Navigation bars, footer links, JavaScript bundles, cookie banners. Somewhere in that mess was the SVG I needed. The agent burned through context trying to parse it, failed, tried again, burned more context. A task that should have taken one tool call consumed thousands of tokens and produced nothing useful.

This wasn't a one-time thing. Every time an agent needed something from GitHub — a file, a README, a search result — it would `web_fetch` the URL and drown in HTML. I'd watched this pattern repeat dozens of times across different sessions. The agent wasn't broken. The tooling was.

I wasn't thinking about building a CLI tool. I was annoyed. I just wanted my icons.

## What came out the other end

That annoyance became [ghx](https://github.com/gkoreli/ghx) — a GitHub code exploration CLI for AI agents. It's the kind of tool that looks simple from the outside. Six commands. A README. An npm package. The kind of thing someone might look at and think: *yeah, I could build that in an afternoon with Claude.*

Here's what it actually took:

- **23 agent sessions** spanning two weeks of evenings
- **2,500+ conversation turns** across those sessions
- **10 architecture decision records** — real research, not template-filling
- **3 complete rewrites** — skill file → bash script → Go binary with an embedded JavaScript sandbox
- And I'm still not done

This is not a tutorial on how to build a CLI tool. This is the story of what building with AI actually looks like — the full lifecycle, the mental model, the thought process, the conflicts, the dead ends, and the moments where I had to stop the agent from taking the easy way out.

## First attempt: teach the agent, not build a tool

My first instinct was to write a skill file — a markdown document that teaches agents how to use the existing `gh` CLI instead of `web_fetch`. Instructions, examples, gotchas, anti-patterns. The kind of context engineering that makes agents dramatically better at specific tasks.

It helped. Agents stopped `web_fetch`-ing GitHub. But new problems surfaced immediately:

- `gh search code "foo bar"` silently wraps the query in quotes, turning an AND search into an exact phrase match — the agent gets zero results and doesn't know why
- Reading a file requires `gh api repos/o/r/contents/path` with a specific Accept header for raw content — miss the header and you get base64
- Getting a repo overview requires three separate calls — one for the tree, one for the README, one for the default branch
- Every `gh` call is a separate tool invocation — an agent exploring a repo makes 5-10 calls where one would suffice

And the agent kept making mistakes with `gh` itself — guessing wrong JSON field names, hitting rate limits, getting empty results without knowing why. When I called it out, it overcorrected with defensive "NEVER" rules that made the tool useless. I was stuck in a loop: teach the agent, watch it fail, fix the instructions, watch it fail differently.

The skill file was a band-aid. I was teaching agents to work around a tool that wasn't designed for them. That's when the frustration boiled over:

> "How come gh cli is not better than that? That's beyond my understanding. I want to enable agents to be much much better in research and exploration — how can we achieve that?"

And then the thought that changed everything:

> "I know that GitHub has an MCP, but I don't wanna install the entire MCP — it will bloat every agent's context memory. Maybe we can build a quick CLI script."

That "quick CLI script" thought was the beginning of everything.
## "Why not just use GitHub's MCP?"

GitHub has an [MCP server](https://github.com/github/github-mcp-server). It's the official way to give AI agents GitHub access. I considered it for about ten minutes.

The problem: MCP servers inject their tool definitions into every agent's context window. GitHub's MCP exposes dozens of tools — repository management, issue tracking, pull requests, discussions, notifications. An agent that just needs to read a file gets a context window bloated with tools for managing GitHub Actions workflows.

Context is finite. Every token spent on irrelevant tool definitions is a token not spent on the actual task. I needed something surgical — a tool that does one thing and does it with minimal context overhead.

## "How come nobody built this already?"

Before writing a single line of code, I spent two full sessions exploring what existed. I was genuinely confused — this seemed like such an obvious need. Surely someone had built it.

I explored [Gitingest](https://github.com/cyclotruc/gitingest), [Repomix](https://github.com/yamadashy/repomix), [codemap](https://github.com/kcosr/codemap), [Octocode](https://github.com/OctoCodeAI/octocode), `gh-scout`, `gh-xplr`, `gh-repo-explore`. Each solved a piece of the puzzle, but none solved the actual problem.

Gitingest packs entire repos into a single file for LLM consumption. Clever, but it clones the repo first — I measured 3.6 seconds for clone+process vs what would become 0.9 seconds with a GraphQL call. And it gives you everything, not what you need. Repomix is similar — full repo dump. codemap has the most sophisticated code mapping I've seen — five levels of progressive detail reduction, brilliant architecture — but it's a local tool. You clone first, then analyze.

None of them answered the question an agent actually asks: *what's in this repo, and which files should I read?* — answered in one API call, with minimal tokens.

That's when I wrote in my notes:

> "This ghx already transcended from a fun little quick script to be something majestic. How come this doesn't exist already? That's beyond my understanding."

I wasn't being dramatic. I was genuinely surprised. The gap was real.

## The build: a bash script that worked

Session 6. I stopped researching and started building.

The first version was 135 lines of bash wrapping `gh`. Three commands: `explore`, `read`, `search`. The philosophy was simple — the script IS the source of truth. Every distribution channel (npm, brew, curl) would wrap the same code.

`explore` was the first command that felt right:

```bash
ghx explore vercel/next.js
# Returns: branch, file tree, README — one API call
```

What takes an agent three `gh` calls takes ghx one. The agent gets enough context in a single tool invocation to decide what to do next.

Then came GraphQL batching for `read`. The `gh` CLI reads one file per API call. If an agent needs five files, that's five round-trips. ghx batches them into a single GraphQL query with aliases:

```bash
ghx read vercel/next.js package.json tsconfig.json README.md
# One API call for all three files
```

And `--map` — the feature that might matter more than everything else combined. Instead of reading a full file, `--map` returns just the structural skeleton: package declaration, imports, type definitions, function signatures. No implementation. The agent sees the shape of the code without the weight.

```bash
ghx read gkoreli/ghx --map v2/pkg/ghx/explore.go
```

```
=== v2/pkg/ghx/explore.go (3111 bytes) ===
package ghx
import (
type FileEntry struct {
type ExploreResult struct {
func Explore(repo string, path string) (*ExploreResult, error) {
```

That's 202 characters instead of 3,111. The agent now knows this file defines `FileEntry`, `ExploreResult`, and an `Explore` function — enough to decide whether to read the full file or move on. Multiply that across seven files and you've scanned an entire package in the token budget of reading one file.

### Bloated context makes agents dumb. Progressive disclosure makes them think.

When you dump an entire repo into context, the agent drowns — it can't distinguish what matters from what doesn't. Give it just the structure first, then signatures, then the specific file it needs, and suddenly it's reasoning about what to read next instead of skimming everything. The tool doesn't make the agent smarter. It gives the agent room to use the intelligence it already has.

135 lines of bash. It worked. But the real iteration was just beginning.

## The naming saga

I wanted to open source it. Pick a name, create a repo, publish to npm. This consumed an embarrassing amount of time. Zero lines of code written.

First name: `ggcode`. Created the repo, wrote the README, ran `npm publish`:

```
npm error 403 Forbidden - Package name too similar to existing package gg-code
```

Fine. Try `ggsc`:

```
npm error 403 Forbidden - Package name too similar to existing packages gts, tsc, grpc
```

The npm registry's similarity checker is aggressive — three-letter names are basically impossible.

> "Overall lets just find a name I'm tired, I don't wanna worry about the name at all, you have full freedom."

The solution: scoped packages. `@gkoreli/ghx`. And then I discovered [someone else had a `ghx` repo](https://github.com/johnlindquist/ghx) on GitHub. Different tool, same name. Parallel evolution — the name was just obvious for "GitHub + X."

No agent can navigate npm naming conflicts, trademark concerns, and identity consistency across GitHub, npm, and Homebrew. This is human work — the unglamorous kind that never makes it into "I built X with AI" posts.

## The search API rabbit hole

GitHub's code search has two completely different systems, and the documentation doesn't make this clear. I spent 128 turns — an entire session — reverse-engineering the behavior through experimentation.

The findings were wild:

| Finding | How discovered | Impact |
|---|---|---|
| Dots are word separators | `console.log` → 21 results, `consolelog` → 0 | Agents need to know `.` splits terms |
| `gh search code` wraps in quotes | `GH_DEBUG=api` trace | ghx's AND matching is strictly better |
| Web-only qualifiers silently degrade | Tested `symbol:` via API | No error, just wrong results |
| Rate limit: 10 req/min (code search only) | Hit it during testing | Stricter than other endpoints |

That last one — silent degradation — is the worst kind of bug. An agent searching for `symbol:useState language:typescript` through the API is actually searching for files containing the literal text "symbol:useState." No error. Just garbage results. The agent has no way to know it's being misled.

I tried the search myself on the GitHub website — it found our repo perfectly. Then I tried `gh search code "ghx gkoreli"` — empty results. Same query, different systems, completely different behavior.

> "Why is their search still better than us? Are you sure about these claims? Go explore and find evidences."

I made the agent double down. Don't just tell me it's different — prove it. Show me the API traces. Show me the documentation. Show me where GitHub says this. That's the kind of steering that matters — when the agent wants to move on and you say *no, we're not done here.*

The result was [ADR-0003](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0003-search-api-deep-dive.md) — a 200+ line document that became the definitive reference for GitHub's search API behavior from an agent's perspective. None of this was documented anywhere else.

## Codemode: the idea that changed everything

Session 11. The biggest architectural leap — and it came from a simple observation.

An agent exploring a repo follows a predictable pattern: explore the structure, filter for interesting files, read a few, search for specific patterns. With individual tool calls, that's 3-5 round-trips through the LLM loop. Each round-trip costs tokens and latency.

What if the agent could write a small program that does all of it in one shot?

```bash
ghx code "
  var repo = codemode.explore({ repo: 'vercel/next.js' });
  var goFiles = repo.files.filter(f => f.name.endsWith('.go'));
  var contents = codemode.read({
    repo: 'vercel/next.js',
    files: goFiles.map(f => f.name)
  });
  return contents;
"
```

One tool call. One round-trip. The agent writes a JavaScript program, ghx executes it in a sandboxed environment with access to all ghx operations. What took 3-5 LLM loop iterations now takes one.

This was inspired by Cloudflare's [Code Mode](https://blog.cloudflare.com/code-mode-mcp/) — instead of describing every operation as a separate tool, let the model write code against a typed SDK and execute it safely. Two tools instead of thousands. The same pattern applies here: instead of the LLM orchestrating N tool calls sequentially, it writes a program that orchestrates them locally.

But codemode meant I needed a JavaScript runtime inside a CLI tool. Bash couldn't do that. The 135-line script had hit its ceiling.

## The Go rewrite

I tried something experimental — spawned a swarm of cheap agents (MiniMax M2.5, 0.25x credits) to implement the rewrite. Five on Go, five on TypeScript, running simultaneously. The Go implementation came back as a monolithic function. The TypeScript one was cleaner but incomplete. One agent got stuck in an infinite loop. Another couldn't find the Go binary because `proxy.golang.org` is blocked on corporate networks. I had to kill zombie processes and unstick frozen agents.

> "Do you realize that this swarm is really cheap and we can iterate really quickly?"

Cheap, yes. Easy, no. But the swarm produced enough raw material that a focused session could synthesize it into something real.

Go won. Single binary, zero runtime dependencies, native `gh` auth integration via [go-gh](https://github.com/cli/go-gh), cross-platform builds via GoReleaser. The codemode sandbox uses [goja](https://github.com/dop251/goja) — a JavaScript runtime written in pure Go.

## The npm publishing saga (yes, there's more pain)

You'd think publishing a Go binary to npm would be straightforward. It was not.

The industry standard (used by esbuild, biome, turbo) is platform-specific optional dependencies — six separate npm packages, one per OS/architecture, each containing just the binary. npm only downloads the one matching your platform. No postinstall scripts, no network calls, works offline.

Setting this up meant:
- Creating 6 platform packages (`@gkoreli/ghx-darwin-arm64`, `@gkoreli/ghx-linux-x64`, etc.)
- Configuring trusted publishers on npm for each one — individually, by hand
- Discovering that npm's 2FA requirement applies per-package, not per-scope
- Hitting `ENEEDAUTH` in CI because the OIDC token wasn't propagating correctly
- Manually publishing from my terminal when CI failed, authenticating in the browser for each package

> "Finished lmao, such a pain in the ass."

The GoReleaser config, the GitHub Actions workflow, the npm trusted publisher setup, the Homebrew tap — all of this is infrastructure work that has nothing to do with the tool itself. It's the kind of work that makes "I built X in 10 minutes" posts dishonest by omission.

## What I'd tell you

**Stop optimizing your prompts. Start optimizing your context.** The prompt is 1% of the work. The other 99% is what you feed the agent before the prompt: architecture decisions, competitive research, constraints, evidence. That's context engineering.

**When the agent wants to move on, push harder.** When it suggests "this works well enough," that's the moment that separates a demo from a product.

**Don't invent a product because your agent hit a pain point.** Start with instructions. If that's not enough, write a script. If the script hits its ceiling, build a tool. Each step only happens because the previous one failed. If the skill file had been enough, there would be no ghx.

## What ghx is today

```bash
npx @gkoreli/ghx explore vercel/next.js     # Structure + README, one call
npx @gkoreli/ghx read repo --map file.ts    # Signatures only, 92% fewer tokens
npx @gkoreli/ghx search "query repo:o/r"    # AND matching, context included
npx @gkoreli/ghx code "..."                 # Multi-step in one round-trip
```

[ghx](https://github.com/gkoreli/ghx) — v2.1.6, 1,000+ npm downloads per month.

And one more thing: `ghx skill`. Run it and it prints a complete agent skill file — best practices, anti-patterns, gotchas, the progressive disclosure pattern. I inject it via agent hooks so every agent I spawn knows how to use ghx properly from the first turn. No teaching, no mistakes, no wasted context on wrong `gh` flags. The tool that was born from a skill file now generates its own.

23 sessions. 2,500+ turns. 10 ADRs. Three rewrites. The tool is just what came out the other end. The lifecycle is the story.

And the CLI isn't the final destination. During exploration, agents repeat very similar multi-step patterns that could be encoded into code-based skills. Some capabilities are simply impossible via CLI — strongly typed code is much better for agents to reason with. That's what codemode is becoming. But most of the time right now, codemode is overkill. So I'm waiting for the pain to tell me when it's time. Same lifecycle. Same lesson.

Next up: the codemode story — and why it might become its own library.

---

## Glossary

| Term / Claim | Source | Date |
|---|---|---|
| goja JavaScript runtime | [dop251/goja on GitHub](https://github.com/dop251/goja) — ECMAScript 5.1+ in pure Go | Active |
| go-gh library | [cli/go-gh on GitHub](https://github.com/cli/go-gh) — Go module for GitHub CLI extensions | Active |
| GitHub MCP server | [github/github-mcp-server](https://github.com/github/github-mcp-server) — official GitHub MCP | 2025 |
| Gitingest | [cyclotruc/gitingest on GitHub](https://github.com/cyclotruc/gitingest) — pack repos for LLM consumption | Active |
| Repomix | [yamadashy/repomix on GitHub](https://github.com/yamadashy/repomix) — full repo dump for AI | Active |
| codemap | [kcosr/codemap on GitHub](https://github.com/kcosr/codemap) — 5-level progressive code mapping | Active |
| esbuild platform packages | [esbuild on npm](https://www.npmjs.com/package/esbuild) — optionalDependencies with os/cpu fields | Active |

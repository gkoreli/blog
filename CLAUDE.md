# CLAUDE.md

This file is the project brain for Claude Code working on the blog.

Treat Claude/Fable as the orchestrator: hold the goal, make decisions, keep context compact, and delegate implementation-heavy or token-heavy work to cheaper specialists when that preserves quality.

Canonical project rules live in `AGENTS.md` — vision, writing process, content strategy, build pipeline, design philosophy, SEO/discoverability, series trails, and the decisions log. The publication direction lives in `NORTH_STAR.md` (personal publication: Essays + Engineering as the core, Frames removed, OSS Radar under reflection; stable shell, expressive interior, each post a crafted artifact) — Fable holds that north star and steers every change against it. ADR-0013 and `pivoting-to-publication.md` are the historical foundation. Do not duplicate those rules here. Use this file only for Fable-specific orchestration, delegation, and model-routing behavior.

## Operating Posture

Use Fable on `high` effort by default. Prefer raising precision through better decomposition, targeted evidence, and delegation before raising effort. Avoid `xhigh`, `max`, or `extra` unless the task is unusually ambiguous, cross-cutting, or architectural and cannot be decomposed cleanly.

Fable should not spend premium context on work that another model or tool can do accurately:

- broad codebase reconnaissance
- repetitive implementation edits
- mechanical typecheck/test fixes
- computer/browser use
- log collection and deploy/CI triage
- large-file reading or summarization
- grep/map/search loops
- package metadata inspection

Fable's job is to decide what matters, verify the result, and keep the work moving. Do not turn delegation into abdication: every delegated result must come back with enough evidence to audit.

Exception for visual taste judgment: critiquing a reader-facing surface requires the pixels in Fable's context — a worker's prose description of a page is not a substitute. Fable takes one deliberate screenshot of a final state when judging design. But iteration loops (implement → screenshot → tweak → recapture) are delegated to workers, and batched browser actions must not return redundant captures (scroll actions already return screenshots — do not request separate ones in the same batch).

Cost is a tie-breaker, not a quality rule. If a cheaper model's output does not meet the bar, rerun or redo the work with a stronger model without asking. Escalating costs less than shipping mediocre work.

## The Taste Constraint

This repo is a publication. Unlike a CLI tool, most of what ships here is judged on taste: prose, typography, layout, color, copy, information design. That shifts the delegation boundary hard toward Fable:

- **Never delegate** published prose, post structure, visual/design decisions, homepage or article-surface changes, or anything a reader sees. These need taste `>= 8` and Goga's editorial feedback loop.
- **Freely delegate** build-pipeline mechanics with a clear spec, analytics/newsletter package plumbing, typecheck fixes, SEO file generation, validation logic, and reconnaissance.
- Editorial and visual proposals go to Goga one surface at a time, with restraint — one section signature, not three stacked decorations. Do not batch a redesign.

## Delegation Model

Use Codex/GPT implementation workers for scoped coding tasks where the desired behavior is clear. GPT-5.5-class workers are highly steerable; give them crisp boundaries, exact files or modules when known, expected verification, and explicit non-goals.

Good Codex delegation prompts include:

```text
Repo: blog (pnpm monorepo, packages/blog is the site)
Goal: <one concrete outcome>
Relevant files: <paths or discovery instructions>
Constraints:
- follow AGENTS.md (no type assertions, zero-dep bias, markdown-first)
- do not touch published post prose or visual design
- do not add dependencies unless explicitly asked
- commit at meaningful checkpoints; never push (push to main deploys the live site)
Verification:
- pnpm typecheck
- pnpm -C packages/blog validate
- pnpm -C packages/blog build
Return:
- files changed
- commits made (shas + messages)
- behavioral summary
- verification run and results
- unresolved risks
```

Delegate to specialist agents for:

- implementation after Fable has chosen the approach
- codebase search or map-based reconnaissance
- reproducing a build/pipeline bug with shell commands
- writing focused tests around an understood behavior
- collecting deploy logs and identifying the failing command
- browser/computer tasks whose output can be summarized with screenshots or exact observations

Keep in Fable:

- editorial direction and post structure
- design and typography decisions
- architecture tradeoffs and ADR direction
- anything that changes what readers see at gkoreli.com
- final review of delegated patches
- conflict resolution between agents
- security-sensitive or credential-sensitive choices

## Picking Models for Workflows and Subagents

These rankings are workflow defaults, not hard limits. Cost means effective cost in this working setup, including available limits and friction, not vendor list price. Intelligence is how hard a problem can be handled unsupervised. Taste covers UI/UX judgment, code quality, prose, and copy.

| Model | Cost | Intelligence | Taste |
| --- | ---: | ---: | ---: |
| `gpt-5.5` | 9 | 8 | 5 |
| `sonnet-5` | 5 | 5 | 7 |
| `opus-4.8` | 4 | 7 | 8 |
| `fable-5` | 2 | 9 | 9 |

How to apply:

- These are defaults, not limits. If a cheaper model's output does not meet the bar, rerun or redo with a smarter model.
- For anything that ships, use `intelligence > taste > cost` when the axes conflict.
- Bulk or mechanical work with a clear spec goes to `gpt-5.5`; in this setup it is effectively free and very steerable.
- Reader-facing work — prose, design, layout, copy, post templates — needs taste `>= 8`: `fable-5` or `opus-4.8` only.
- Reviews of plans and implementations should use `fable-5` or `opus-4.8`; optionally ask `gpt-5.5` for an extra independent perspective.
- Do not use Haiku for this repo.

Mechanics:

- `gpt-5.5` is reached through the Codex CLI with `codex exec` or `codex review` when available.
- Prefer dedicated Codex skills or wrappers for `codex-implementation`, `codex-review`, and `codex-computer-use` style work.
- For work those wrappers do not cover, such as investigation or data analysis, run `codex exec -s read-only` with a self-contained prompt.
- Claude models such as `sonnet-5`, `opus-4.8`, and `fable-5` run through the Agent/Workflow model parameter when the workflow supports it.
- If a workflow or subagent slot only accepts Claude models but the desired worker is Codex, spawn a thin Claude wrapper with a low-effort `sonnet`-class model. Its only job is to write a self-contained Codex prompt, run `codex exec` through Bash, and return Codex's report.
- When Codex/GPT session tokens are exhausted, fall back to Claude background agents: `sonnet-5` for mechanical/clear-spec work, `opus-4.8` when the work needs more judgment. Same delegation prompts, same evidence contract.

Use capability roles when model names change:

| Work | Preferred worker | Effort |
| --- | --- | --- |
| Editorial direction, design decisions, ambiguous product behavior | Fable | high |
| Post prose, copy, reader-facing templates | Fable (with Goga's feedback loop) | high |
| Scoped TS implementation, pipeline work, refactors with clear boundaries | Codex/GPT worker | medium/high |
| Repo reconnaissance, symbol maps, grep loops, dependency tracing | Cheap search/recon worker using `ghx`/shell | low/medium |
| Deploy log reading, package metadata, command output summarization | Cheap implementation worker | low/medium |
| Browser/computer use and UI verification | Codex/computer-use worker | low/medium |
| Final synthesis, acceptance decision, user-facing explanation | Fable | high |

Escalate effort only when the previous step produced concrete uncertainty that cannot be resolved with more evidence or a narrower task.

## Delegation CLI Mechanics

Do not rely on Fable remembering CLI flags. When delegating to Codex CLI or Claude Code workers, use the project-local `fable-delegation` skill in `.claude/skills/fable-delegation/SKILL.md`.

That skill is the canonical home for command syntax, bypass flags, wrapper prompts, and evidence report shape. Keep this file focused on routing judgment, not command tables.

## Evidence Contract

Every delegated result must cite files, commands, or outputs. Reject or rerun any delegated result that cannot, and audit reports against `AGENTS.md` and the actual code rather than trusting the worker's summary. The full report shape lives in the `fable-delegation` skill.

## Fable Working Style

Fable should read `AGENTS.md` before making repository changes and should treat it as authoritative for build, content, design, SEO, and series-trail rules.

Before delegating, Fable should reduce the task to a crisp objective and identify which facts must be verified. After delegation, Fable should review the result against the canonical repo rules rather than trusting the worker's summary.

When context grows:

- summarize decisions, not every observation
- keep unresolved questions visible
- delegate fresh reconnaissance instead of rereading large context
- keep final synthesis in Fable, especially for editorial, design, ADR, and architecture decisions

## Final Review Checklist

Before handing work back:

- `git status --short` reviewed
- changed files are intentional
- `pnpm typecheck` and `pnpm -C packages/blog build` pass, or the reason for not running them is stated
- `AGENTS.md` updated when a durable decision or rule changed
- series-trail checklist run when a post was added or edited (see `AGENTS.md`)
- nothing pushed to `main` without Goga's explicit ask — push is publish
- delegated outputs were verified, not blindly trusted

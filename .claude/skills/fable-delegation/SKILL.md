---
name: fable-delegation
description: Use when Claude/Fable should delegate implementation, review, investigation, UI verification, or mechanical coding work to Codex CLI or another Claude Code worker from this project.
---

# Fable Delegation

Use this skill when Fable is orchestrating work and should offload execution to Codex CLI or a Claude Code worker.

Fable owns judgment: editorial direction, design, architecture, ADR direction, and final acceptance. Workers own bounded execution and must return evidence. Reader-facing prose, copy, and visual design are never delegated — see `CLAUDE.md` "The Taste Constraint".

Project-local Claude skills live in `.claude/skills/<skill>/SKILL.md`. Global Claude skills live in `~/.claude/skills/<skill>/SKILL.md`. Claude Code checks both. This project uses the project-local path.

## Command Map

| Metric / feature | Claude Code | Codex CLI |
| --- | --- | --- |
| Non-interactive run | `claude -p` | `codex exec` |
| Model | `--model <model>` | `--model <model>` |
| Effort | `--effort <low|medium|high|xhigh|max>` | configure model reasoning through prompt/config when needed |
| Working directory | run from repo root or use shell `cd` | `-C /Users/goga/Documents/goga/blog` |
| Read-only sandbox | prefer permission mode/default tools | `-s read-only` |
| Write code bypass flag | `--dangerously-skip-permissions` | `--dangerously-bypass-approvals-and-sandbox` |
| Review command | `claude -p "<review prompt>"` | `codex exec review` |
| Structured output | `--output-format json` or `--json-schema` | `--json`, `--output-schema`, `-o` |
| Session resume | `--resume` / `--continue` | `codex exec resume` |
| Native project guidance | `.claude/skills/` + `CLAUDE.md` | `AGENTS.md` |

For writing code through delegated CLI workers, use the bypass flags explicitly:

```bash
claude -p --model sonnet --effort low --dangerously-skip-permissions "<prompt>"
codex exec -C /Users/goga/Documents/goga/blog --dangerously-bypass-approvals-and-sandbox "<prompt>" </dev/null
```

**Always append `</dev/null` when running `codex exec` from a background or
non-interactive shell.** With stdin open, codex exec prints "Reading
additional input from stdin..." and blocks forever before doing any work
(observed 2026-07-05: a delegation sat 40+ minutes at 0% CPU with no session
rollout file — diagnose via `ls ~/.codex/sessions/<today>` and process CPU).
Do not pipe codex stdout through `tail`/`head` in background tasks either —
it buffers until exit, hiding all progress; let stdout stream to the task
output file.

Use `codex exec -s read-only` for investigation, review, summarization, or planning when the worker must not edit files:

```bash
codex exec -C /Users/goga/Documents/goga/blog -s read-only "<prompt>"
```

Use JSON output when another tool or wrapper needs to parse Codex events:

```bash
codex exec -C /Users/goga/Documents/goga/blog --json --dangerously-bypass-approvals-and-sandbox "<prompt>"
codex exec resume --json --dangerously-bypass-approvals-and-sandbox <thread_id> "<prompt>"
```

If a command form is rejected, verify current local syntax:

```bash
claude --help
claude agents --help
codex exec --help
codex exec review --help
```

## When to Use Which Worker

Use Codex CLI for:

- clear-spec implementation (pipeline, analytics, newsletter, SEO plumbing)
- mechanical edits
- typecheck/test fixes
- repo search and codebase reconnaissance
- deploy/log analysis
- independent code review

Use Claude Code workers for:

- Claude-only workflow slots
- thin wrappers around Codex when a workflow only accepts Claude models
- taste-sensitive review when Fable does not need to spend its own context
- background agents managed through Claude Code

Keep in Fable:

- editorial and design judgment
- ADR decisions and updates
- anything readers see at gkoreli.com
- final review and acceptance
- deciding whether delegated output is good enough

## Codex Implementation Prompt

Use this shape for code-writing delegation:

```text
Repo: blog (pnpm monorepo; packages/blog is the site)
Working directory: /Users/goga/Documents/goga/blog
Goal: <one concrete outcome>

Relevant files or discovery:
- <paths, commands, or search instructions>

Constraints:
- Follow AGENTS.md. No type assertions (as string/any/unknown banned; as const ok).
- Do not touch published post prose or visual design unless explicitly asked.
- Do not add dependencies unless explicitly asked.
- Keep edits scoped.
- Never push — push to main deploys the live site.
- Never run pnpm build while a dev server is running.

Verification:
- pnpm typecheck
- pnpm -C packages/blog validate
- pnpm -C packages/blog build

Return:
- files changed
- behavior changed
- verification run and results
- evidence: file references, command output summary
- unresolved risks
```

Run it with:

```bash
codex exec -C /Users/goga/Documents/goga/blog --dangerously-bypass-approvals-and-sandbox "<prompt>" </dev/null
```

If the implementation needs parseable progress or a resumable thread id, add `--json`.

## Codex Review Prompt

Use this for independent review:

```bash
codex exec review --uncommitted "<review instructions>"
codex exec review --base main "<review instructions>"
codex exec review --commit <sha> "<review instructions>"
```

Review instructions should ask for findings first, ordered by severity, with file and line references. Ask the reviewer to focus on bugs, regressions, type-assertion violations, missing validation, and docs drift against `AGENTS.md`.

## Claude Wrapper Prompt

Use this when a workflow only accepts Claude models but the desired worker is Codex:

```text
You are a thin Claude wrapper. Do not solve the task yourself.

Write a self-contained Codex prompt for the task below, run it with:
codex exec -C /Users/goga/Documents/goga/blog --dangerously-bypass-approvals-and-sandbox "<prompt>" </dev/null

Return only Codex's final evidence report plus any command failure.

Task:
<task>
```

Run with:

```bash
claude -p --model sonnet --effort low --dangerously-skip-permissions "<wrapper prompt>"
```

## Evidence Contract

Every delegated worker must return:

```text
answer
files changed or inspected
commands run
test results
evidence snippets or file references
uncertainty
suggested next step
```

If a worker cannot cite files, commands, or outputs, treat its answer as a hypothesis and verify before acting.

## Operating Rules

- Start Codex delegation early when it can run independently, then continue Fable-side analysis.
- Give Codex concrete repository evidence in the prompt: paths, lines, `rg` hits, failing commands, or ADR references.
- Prefer file references and command summaries over pasted large snippets.
- Do not send secrets or environment values into worker prompts.
- Every research/investigation delegation prompt must pin the tool economy explicitly: "use text-only tools (WebSearch/WebFetch/curl/gh); do NOT use browser automation, Chrome tools, or screenshots — this is a text research task." Workers left unpinned have burned tokens screenshotting documentation pages (incident 2026-07-05 in ghx).
- After Codex returns, Fable must verify compatibility with `AGENTS.md`, current code, and the actual verification results.

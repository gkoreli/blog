# AGENTS.md — gkoreli.com

Personal engineering publication by Goga Koreli, built with `@nisli/core` and deployed to Cloudflare Workers.
Skills are discovered from `.agents/skills/`; this file contains only shared repository constraints.

## Repository essentials

- `packages/blog/` owns the site; `posts/` and `prompts/` live inside that package.
- Use pnpm and the runtime pinned by `.mise.toml` / `package.json`.
- Content is Markdown with YAML frontmatter, or TypeScript for custom layouts; interactive elements are native web components.
- Keep content readable without JavaScript. Use progressive enhancement; no JSX/MDX or unnecessary dependencies.
- No type assertions except `as const`; fix schemas, narrowing, or upstream types. No `any`.
- Preserve concurrent uncommitted work and other sessions' servers. Isolate builds when output directories would conflict.
- Code is MIT; content is CC BY-NC-ND 4.0. [LICENSE](LICENSE) defines the scope.

## Publication integrity

- Teach something useful, show the evidence, and let the reader encounter the author through his actual work.
- Do not invent experiences, feelings, measurements, quotations, or a completed outcome.
- Preserve exact shaping prompts; article prompt files exclude unrelated later repository housekeeping.

## Evidence and continuity

- Never treat a historical capture, accepted deployment, or local test as proof of current production behavior.
- Before resuming an investigation, read its task/worklist, latest dated handoff, and saved evidence.
- Keep credentials, private reader messages, raw operational captures, and session logs outside Git.
- Public evidence records methods, conditions, results, limits, and links to the relevant artifacts.

## Checks

- Check changed instructions against their previous version; preserve owner direction and consequential exceptions.
- Run checks appropriate to the change. Documentation-only reorganization needs link, structure, and coverage checks.
- Common checks: `pnpm typecheck`; `pnpm -C packages/blog validate`; relevant package tests.
- Never run a production build into a development server's active `dist/`; use an isolated checkout.

## Delivery

- After relevant checks pass, commit and push the scoped changes directly to `main`. Do not create a PR unless Goga requests one.
- Use the repository's personal Git identity; preserve unrelated changes when staging and integrating.
- Record code, deployment activation, and measured acceptance separately. Report remaining limits honestly.

## Keep knowledge discoverable

- Keep this file at **50–100 lines**. Add details to the relevant skill/reference, not to this entry point.
- Procedures belong in skills; decisions and rationale in ADRs; dated evidence and status in tasks, research, or handoffs.
- Reuse existing worklists and tasks. Preserve history and link superseding evidence explicitly.
- Record completed work, remaining checks, concrete blockers, and the next bounded action before a handoff.
- Keep proposed experiments separate from accepted work; do not silently reopen completed tasks.
- Every moved reference needs a working link from its owning skill or document.
- Update active callers when paths move; keep historical records intact and provide a migration map.
- [ADR-0017](docs/adr/0017-on-demand-project-guidance.md) defines this structure; the [migration record](docs/editorial/2026-09-28-instruction-migration.md) maps the former 666-line instructions.

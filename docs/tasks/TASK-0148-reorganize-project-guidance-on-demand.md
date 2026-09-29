---
id: TASK-0148
title: Reorganize project guidance for on-demand loading
status: done
parent_id: FLDR-0003
created_at: '2026-09-29T05:15:46Z'
updated_at: '2026-09-29T05:22:46Z'
type: task
---

## Requested outcome

Reduce `AGENTS.md` to 50–100 lines without losing accumulated owner direction, operational constraints, reasoning, or historical evidence. Organize detailed knowledge into skills, references, and relevant decision records. The owner's follow-up removes a skill catalogue from the root because agents already discover `.agents/skills/`.

## Acceptance

- The root is within the requested line limit and contains no duplicated skill catalogue.
- Every original section has an explicit maintained destination or documented consolidation.
- Task-specific references are discoverable from the appropriate skills; active callers no longer require removed AGENTS headings.
- Dated observations remain historical; stale claims are corrected with their original wording recoverable.
- Exact owner quotations, raw prompts, provenance accounting, author-written essay boundaries, and delivery constraints survive.
- Local links, relevant anchors, skill metadata, content coverage, and the scoped diff pass review.
- Commit and push only this documentation work under the existing delivery preference; preserve the pre-existing `CLAUDE.md` deletion.

## Records

- [ADR-0017](../adr/0017-on-demand-project-guidance.md): organization and maintenance rules.
- [Migration map](../editorial/2026-09-28-instruction-migration.md): exact source identity, complete line-range destinations, corrections, and historical scope.
- [Maintenance skill](../../.agents/skills/blog-maintenance/SKILL.md): repository workflow and conditional references.

## Verification

Completed local verification:

- `AGENTS.md`: 51 lines; no skill catalogue or skill-entrypoint links.
- All 666 original lines mapped exactly once; baseline bytes match the recorded Git blob and SHA-256.
- Preserved all five source blockquotes and the entire footprint-accounting contract. Reviewed nonmechanical edits against the corrections and source-backed consistency audit in the migration record.
- All 32 changed/new Markdown files checked: 224 relative links and 10 anchors resolve, code fences close, and every moved reference is discoverable from an owning skill.
- The skill-creator validator passed for all eight changed/new skills. It ran with temporary `uv`-provided PyYAML; no project dependency changed.
- Reviewed task routes for article openings, exact owner quotations, research footprint freezing, metadata/series edits, ordinary code changes, and production investigation. References are conditional; no route instructs every session to read the full corpus.
- Both documented Markdown examples pass the actual `parsePost()` schema and contain no duplicate body H1. The temporary ESM check writes only disposable files outside the repository.
- Checked current build stages, theme/layout details, post schema, metadata generation, OG size, and 404 behavior against source. Corrected the MDX runtime claim against its official guide; did not re-audit unrelated external citations.
- `git diff --cached --check` passed. Only repository instructions and bookkeeping are in scope; the existing `CLAUDE.md` deletion remains unstaged.

Delivery follows the existing checked commit-and-push preference. The commit containing this record identifies the delivered documentation set. No production build, service probe, broad external-source re-audit, or article release was needed or claimed.

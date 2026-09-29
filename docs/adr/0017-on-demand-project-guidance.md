# ADR-0017: On-Demand Project Guidance

## Status

Accepted — 2026-09-28, at the owner's request to reorganize the root instructions without losing accumulated knowledge.

## Context

`AGENTS.md` had grown to 666 lines, combining publication philosophy, writing procedures, metadata contracts, design choices, production investigation rules, and dated status. Every task received this material whether or not it applied. Several active skills also relied on headings in that file, while older status and superseded decisions could look current.

## Decision

Keep the root `AGENTS.md` between 50 and 100 lines. It holds repository identity, broadly applicable constraints, the delivery and bookkeeping essentials, and no skill catalogue. It must not require reading a complete instruction tree at session start.

Maintain detailed knowledge at its task-specific owner:

| Knowledge | Owner |
|---|---|
| Article form, purpose, skill order, openings | `shape-article` and its references |
| Substantive reader value and the author in the work | `earned-trust-writing` |
| Evidence, exact prompts, quotations, footprint accounting, feedback | `blog-writing` and its references |
| Metadata, search diagnosis, series and article relationships | `article-discovery-positioning` and its references |
| Voice and exposed authorship; sentence-level prose rules | `personal-essays`; `polish-prose` |
| Repository implementation, build, design, operations, delivery | `blog-maintenance` and its references |
| Technology decisions and rationale | Relevant existing ADRs, reached through the [decision register](../reference/project-decisions.md) |
| Measured results, status, next actions, recovery receipts | Relevant task, worklist, research artifact, or dated handoff |

Agents discover skills through `.agents/skills/`; the root does not repeat the catalogue. Skills name the conditions for reading their references. Follow only the route needed for the current task. Automatic discovery may select a relevant skill; “on demand” does not require users to type a skill name. Do not add an eager `read everything` rule or a second monolithic instruction file.

Active guidance has one maintained home. Existing records of what happened remain historical; they are not silently rewritten to pretend they always referenced the new structure. Migration records connect old headings to new owners. Repeated rules are consolidated only when their substance is retained. Preserve complete owner prompts and previously recorded quotations without editorial cleanup; historical quotation provenance is not re-certified by relocation.

## Consequences

Ordinary coding tasks no longer load the editorial canon, and article tasks no longer load production incident history. This makes routing part of correctness: a reference with no task trigger is effectively lost. Check active links and representative routes whenever moving guidance.

Historical decisions can contain obsolete implementation details. Mark their scope and successors explicitly, verify current behavior against code and the relevant receipt, and do not treat a dated snapshot as a live status dashboard.

The root should grow only for a broadly applicable constraint. Add new detailed guidance to an existing owner where possible. A distinct skill is warranted when a reusable workflow needs its own discovery trigger.

## Migration and acceptance

The [migration record](../editorial/2026-09-28-instruction-migration.md) identifies the exact original Git source, maps every source range, lists corrections, and records validation. [TASK-0148](../tasks/TASK-0148-reorganize-project-guidance-on-demand.md) tracks this work. This change does not publish or revise an article and adds no material to a released article's prompt file or research footprint.

---
name: blog-maintenance
description: Maintain the gkoreli.com repository, build pipeline, interface, operational evidence, and project bookkeeping. Use for implementation, debugging, delivery, incident investigation, handoffs, or reorganizing repository guidance; article prose is governed by the writing skills.
---

# Blog Maintenance

Work from the relevant implementation, accepted decision, and latest task evidence. Read only the references needed for the requested change.

## Choose the relevant guidance

| Work | Read |
|---|---|
| Code changes, checks, Git delivery | [Engineering and delivery](references/engineering-and-delivery.md) |
| Markdown or TypeScript post formats, SSG, validation, generated metadata, dev/build output | [Content and build](references/content-and-build.md) |
| Layout, typography, colors, icons, interactive UI | [Design system](references/design-system.md) |
| Production queries, incidents, acceptance, checkpoints, worktree recovery | [Operations and handoffs](references/operations-and-handoffs.md) |
| Existing technology choices or architecture rationale | [Project decision register](../../../docs/reference/project-decisions.md), then the relevant ADR |
| Documentation organization or instruction changes | [ADR-0017](../../../docs/adr/0017-on-demand-project-guidance.md) |

For article work, start with [shape-article](../shape-article/SKILL.md). Read the [metadata contract](../article-discovery-positioning/references/metadata-and-discovery.md) when implementation changes metadata behavior, and the [research-footprint contract](../blog-writing/references/research-footprint.md) when changing provenance extraction. Before quoting Goga, read [owner quotations](../blog-writing/references/owner-quotations.md).

## Keep the records useful

- Find the existing task/worklist and latest handoff before creating another record. Update the requested outcome, acceptance evidence, remaining work, and next bounded action there.
- Keep implementation, deployment, and measured acceptance distinct. A saved historical result does not prove present service health.
- Keep reusable procedures in skills or focused references; decisions and their rationale in ADRs; dated results in research artifacts, tasks, or handoffs. Private captures and logs stay outside Git.
- Amend a decision deliberately when it changes. Keep the current rule in active guidance and the dated rationale in the ADR; do not require readers to reconcile old and new rules.
- Keep `AGENTS.md` at 50–100 lines. Rely on `.agents/skills/` for skill discovery; do not add a skill catalogue or copy detailed procedures back into the root.
- Repair active callers when guidance moves. Keep historical receipts intact. Remove migration commentary, repeated skill summaries, and superseded alternatives from working instructions.

## Validate the actual change

For documentation-only work, check links, anchors, code fences, instruction coverage, skill frontmatter, and the scoped diff. No production build or probe is needed merely to move instructions. For code or content changes, run the relevant repository checks; consult the build reference before touching a shared `dist/` directory. Finish with the owner's checked, scoped commit-and-push workflow.

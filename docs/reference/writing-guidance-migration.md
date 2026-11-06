# Writing guidance consolidation — November 6, 2026 UTC

## Decision and scope

The owner requested one proper Agent Skills writing skill instead of overlapping writing triggers. The active entry point is now [writing](../../.agents/skills/writing/SKILL.md). Its focused references cover article design, evidence, personal authorship, OSS research, headlines, prose/messages, provenance, usage accounting, publication/learning and custom TypeScript articles. Ordinary prose work loads only the entry point and prose guidance; it does not inherit a full research or publication workflow.

This reorganization follows [ADR-0017](../adr/0017-on-demand-project-guidance.md). The [Agent Skills specification](https://agentskills.io/specification), checked November 6, requires matching lowercase skill/folder names, valid YAML frontmatter and a concise description; its progressive-disclosure guidance recommends a short entry point and directly discoverable references. The new folder has one `SKILL.md`, string-valued metadata and one-level reference files. Optional UI metadata consolidates the previous shaping and polishing entries. No eight-skill wrappers remain.

The before-state is committed source `d63ea5b62cbd86ab427348f8df67cdd1c0227651` plus the owner’s already-applied first-50-words edits in three files. [Source commitments](writing-guidance-migration-sources.json) record every original file’s SHA-256, bytes, lines, baseline link and whether its working bytes differed from that commit. The [base64-encoded preconsolidation patch](writing-guidance-preconsolidation.patch.b64) preserves those three working edits exactly, including native patch context whitespace. The recorded baseline plus its decoded bytes reconstructs the full before-state. The original 23 files total 1,436 lines. A temporary byte copy supports this edit’s comparison; the committed source, encoded patch and hashes are the durable historical reference. The old root skill names are removed from discovery, not retained as competing aliases.

To reconstruct, decode the patch to a private temporary file, populate a disposable directory with the recorded baseline sources, then apply it there:

```bash
python3 -c 'import base64,pathlib; pathlib.Path("/tmp/writing-guidance-preconsolidation.patch").write_bytes(base64.b64decode(pathlib.Path("docs/reference/writing-guidance-preconsolidation.patch.b64").read_bytes()))'
patch -p1 -d /tmp/writing-baseline -i /tmp/writing-guidance-preconsolidation.patch
```

The source receipt retains the decoded length and SHA-256: **5,651 bytes**, `2c8357e07a648aaf36b45496b2e65f0a9d7a8b45b0a92110186b917e494f27b0`. Verify them before applying; `/tmp/writing-baseline` must be the disposable populated baseline, never the live checkout.

## Path migration map

All old paths below are relative to `.agents/skills/`. Historical research receipts retain their original text and captures; use their recorded baseline or this map to find the current procedure. Active skill callers now point directly to `writing` and the applicable reference.

| Previous path | Current owner |
|---|---|
| `shape-article/SKILL.md` | [Entry point](../../.agents/skills/writing/SKILL.md), [article design](../../.agents/skills/writing/references/article-design.md) |
| `shape-article/agents/openai.yaml` | `writing/agents/openai.yaml` |
| `shape-article/references/editorial-workflow.md` | [Article design](../../.agents/skills/writing/references/article-design.md), [publication](../../.agents/skills/writing/references/publication-and-learning.md), [provenance](../../.agents/skills/writing/references/provenance.md) |
| `shape-article/references/opening-discipline.md` | [Immediate useful what](../../.agents/skills/writing/SKILL.md#make-the-useful-what-immediate), [headlines](../../.agents/skills/writing/references/headlines-and-discovery.md) |
| `shape-article/references/publication-context.md` | [Article design](../../.agents/skills/writing/references/article-design.md), [audience contract](../../.agents/skills/writing/references/publication-and-learning.md#people-and-agents-are-both-audience) |
| `blog-writing/SKILL.md` | [Entry point](../../.agents/skills/writing/SKILL.md), [evidence](../../.agents/skills/writing/references/evidence-and-investigations.md), [provenance](../../.agents/skills/writing/references/provenance.md), [publication](../../.agents/skills/writing/references/publication-and-learning.md) |
| `blog-writing/references/editorial-learning-loop.md` | [Publication and learning](../../.agents/skills/writing/references/publication-and-learning.md) |
| `blog-writing/references/evidence-led-engineering-investigations.md` | [Evidence and investigations](../../.agents/skills/writing/references/evidence-and-investigations.md) |
| `blog-writing/references/firsthand-evidence-and-credibility.md` | [Evidence](../../.agents/skills/writing/references/evidence-and-investigations.md), [headlines/discovery](../../.agents/skills/writing/references/headlines-and-discovery.md); dated studies remain in the engineering-credibility research ledger |
| `blog-writing/references/owner-quotations.md` | [Provenance — owner quotations](../../.agents/skills/writing/references/provenance.md#owner-quotations) |
| `blog-writing/references/research-footprint.md` | [Research footprint](../../.agents/skills/writing/references/research-footprint.md) |
| `earned-trust-writing/SKILL.md` | [Article design](../../.agents/skills/writing/references/article-design.md#connect-reader-value-and-the-authors-work), [entry-point authorship constraints](../../.agents/skills/writing/SKILL.md#preserve-authorship-and-scope) |
| `personal-essays/SKILL.md` | [Personal authorship](../../.agents/skills/writing/references/personal-authorship.md) |
| `oss-radar/SKILL.md` | [OSS research](../../.agents/skills/writing/references/oss-research.md) |
| `oss-radar/references/project-deep-dive.md` | [Single-project mode](../../.agents/skills/writing/references/oss-research.md#single-project-deep-dive) |
| `oss-radar/references/cohort-scan.md` | [Cohort mode](../../.agents/skills/writing/references/oss-research.md#cohort-scan) |
| `oss-radar/references/typescript-posts.md` | [TypeScript articles](../../.agents/skills/writing/references/typescript-articles.md) |
| `polish-prose/SKILL.md` | [Prose and messages](../../.agents/skills/writing/references/prose-and-messages.md) |
| `polish-prose/agents/openai.yaml` | `writing/agents/openai.yaml` |
| `article-discovery-positioning/SKILL.md` | [Headlines and discovery](../../.agents/skills/writing/references/headlines-and-discovery.md), [publication/learning](../../.agents/skills/writing/references/publication-and-learning.md) |
| `article-discovery-positioning/references/metadata-and-discovery.md` | [Metadata contract](../../.agents/skills/writing/references/headlines-and-discovery.md#metadata-contract) |
| `article-discovery-positioning/references/series-and-cross-references.md` | [Links and series](../../.agents/skills/writing/references/headlines-and-discovery.md#links-and-series) |
| `shareable-engineering/SKILL.md` | [Evidence](../../.agents/skills/writing/references/evidence-and-investigations.md), [headlines](../../.agents/skills/writing/references/headlines-and-discovery.md), [publication](../../.agents/skills/writing/references/publication-and-learning.md) |

## Consequential coverage audit

| Previous direction / exception | Preserved current behavior |
|---|---|
| Author’s supplied voice, experience, uncertainty and important passages survive editing | Entry-point authorship rules; article-design and personal-authorship references |
| Exposed essays are entirely Goga-written; no agent replacement sentences/opening, no custom animation/layout or prompt file | Personal-authorship reference and entry point; concrete scene/conflict is compatible with the latest immediate-opening instruction |
| OSS Radar omits prompts; collaborative engineering retains complete material human messages | Entry point and provenance, with chronological exact messages and honest omissions |
| Quotations attributed to Goga reproduce a complete verified message, without trimming or splicing | Provenance; applies across articles, prompts, ADRs, tasks and comments |
| Practical teaching and author-present work carry roughly equal substance | Article design and entry point; judgment, not word-count quota or forced personal disclosure |
| Strongest supported what and practical payoff within first 50 words across title/SEO/description/opening, ordinary language, attention-grabbing hook | Canonical entry-point rule plus entry-surface checks in headlines; all three already-modified source files’ owner direction retained |
| Evidence states, denominators, conflicting evidence, negative-claim search space, stages, local/deployed/current separation | Evidence reference; observed/reproduced/inspected/documented/reported/inferred/proposed remain distinct |
| People and agents both audience; missing human identity does not erase supported agent access/use | Entry point and publication/learning, linked to ADR-0016.19 |
| Source-pinned OSS claims, end-to-end trace, product map, competing theories, future states, deep-dive/cohort differences | OSS research; no catalogue/readme-only claim is promoted to reproduced behavior |
| Casual Goga voice, useful point first, no automatic greeting/process preamble or question/pitch | Prose/messages; fragments and lowercase preserved when natural, never manufactured |
| Metadata dates, stable URLs, explicit alternativeHeadline, deliberate series IDs/orders, HTML/Markdown parity | Headlines and TypeScript references; source/build mechanics stay in blog-maintenance |
| Optional footprint is provenance, deterministic recursive/epoch accounting, exact artifact set and private-prefix hashes | Footprint procedure preserved in full apart from one duplicated heading; no hand estimates or new extractor |
| Distribution needs instruction; author writes HN comments; GitHub promotion/recruitment needs RFC/explicit invitation | Publication/learning; launch and experiment skills link to the canonical owner rule |
| Human feedback useful but not release gate; private feedback outside Git; complete work may remain unresolved | Publication/learning, evidence and personal references |

## Removed duplication and superseded prescriptions

- Eight automatic triggers and their circular “use the other writing skill next” chains became one mode-aware entry point. The new skill loads only details needed for the actual request.
- Repeated evidence, quotation, authorship, opening, voice, positioning and release checklists have one owner each. High-consequence constraints remain briefly visible in the entry point so choosing a mode cannot bypass them.
- The deep-dive’s fixed five-part layout, fixed nearby-product count and universal “final section makes one decision” wording became a research/decision obligation appropriate to its form. A project verdict should be supported; an inquiry is allowed to remain a question. These mechanics were never evidence of writing quality and conflicted with the form-first exceptions.
- Old TypeScript-only 40–60-character search-title and roughly 155-character description targets were removed in favour of the shared readability/evidence contract and current entry-surface review. They conflicted with the existing publication guidance against fixed title limits and could hide a material qualification.
- The duplicate Orwell-style rule list became one practical prose reference. It preserves literal language, precision and exceptions without mechanically rewriting every sentence or imposing article form on casual copy.
- Dated research summaries about trust, pronouns and model source preferences no longer masquerade as active timeless advice. Their research ledger remains linked; a new empirical claim requires checking its actual study and conditions.
- The generic launch description’s “without clickbait” phrase was removed because the latest owner asks for attention-grabbing/clickbait-style hooks. The canonical rule preserves truthful surprise and rejects invented results, inflated populations and hidden conditions.
- A blanket production-build command was removed from the TypeScript writing reference. Rendering still needs appropriate validation, but the owning maintenance workflow requires isolation from concurrent servers and selects checks for the actual change.

## Validation and bounded acceptance

Local structural and source checks pass: all 180 checked active Markdown links and anchors resolve; all ten references are linked directly from the entry point; all eight previous triggers are absent; all 23 original source commitments match the captured before-state; and the usage-accounting procedure is preserved apart from its duplicated heading and one terminal blank line. The new skill is 52 entry-point lines / 622 words, with 479 lines across its complete folder versus the previous 1,436.

The bundled `quick_validate.py` passes for `writing`, `blog-maintenance`, `launch-article-on-x`, `run-discovery-experiment` and `ai-bot-analytics-grilling`. Additional checks verify the matching lowercase folder/name, 259-character description, string-only metadata and valid `$writing` UI invocation. The host Python initially lacked PyYAML; a temporary `/tmp` validation environment with PyYAML 6.0.3 resolves that dependency without changing repository packages. `git diff --check` passes.

An independent agent completed four actual requests before assessing them: technical article copy, exposed-essay feedback, a routine PR description and a bounded two-project OSS comparison. [The public assessment summary and seven output hashes](writing-guidance-forward-test.json) preserve the result and limits. Routing stayed task-specific: the PR used only the entry point/prose reference, the essay received feedback without replacement prose, and the source comparison remained offline and conditional. The article output kept local repair distinct from production acceptance.

The original PR output introduced an unsupported implementation-stage phrase, “when recording page observations.” It remains preserved as a failed artifact; a separate corrected output uses “for page observations.” Existing instructions already require preserving technical meaning, so that single failure justifies correcting the copy rather than adding a new universal rule. The personal-feedback output also contains a possible over-tightening suggestion about uncertainty; the assessment records that editorial limitation instead of declaring all outputs perfect.

These were four sequential tasks in one independent context, not four isolated sessions. The comparison relied on supplied archive-to-SHA associations without independently verifying them; no detector was executed. The seven-file archive contains outputs and assessment, not a complete frozen dispatch/input transcript. No network, production or Git mutation occurred. Skill-file hashes are captured at acceptance rather than separately for each case. The behavioral sample does not establish exhaustive coverage, human reception or universal reliability.

The requested bounded skill-consolidation acceptance is complete with those limits and the original failure retained. A later commit-gate whitespace check found one extra terminal blank line in the footprint reference and native context whitespace in the raw patch. The reference receives only a terminal-format correction; patch packaging changes to base64 without changing decoded bytes. The acceptance receipt preserves both the original tested skill hashes and the post-format hashes. These packaging corrections do not change policy or justify a behavioral rerun.

Exact generated outputs and the assessment remain private under `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-11-06-writing-forward-test/`; public source and synthetic-input facts are summarized in the receipt. Repository delivery is parent-owned and separate from these checks. This document is migration history, not another active writing workflow.

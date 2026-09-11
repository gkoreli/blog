# AI citations: OSS Radar #07 rewrite brief

Started September 11, 2026, on `main`. The author's full request is preserved in [prompt 19](../../../prompts/oss-radar-07-promptfoo.prompts.md). This changes the article's governing subject from Promptfoo to the open-source work on AI citations, analytics, attribution, and source credibility.

## Living center and form

The publication wants people and their agents to use its engineering evidence. A visible citation can spread a source while misrepresenting it. The article asks what open-source systems do to retrieve, preserve, and check that evidence, and what makes an engineering source useful enough to deserve the citation.

Governing form: **OSS Radar cohort synthesis**, following the curiosity, unequal project depth, code inspection, hard questions, and judgments of issue 01. Its older prose and unverified numbers are not reusable evidence. The new issue starts with its strongest supported results and then explains the projects and the author's bets. It is neither a Promptfoo adoption report nor a generic publishing checklist.

Initial research sample: ALCE, Self-RAG, STORM/Co-STORM (one repository), OpenScholar, Ragas, DeepEval, TruLens, Phoenix, and the already-tested Promptfoo. These nine candidates cover generation, evaluation, and capture. [DeepTRACE](28-deeptrace-comparison-audit.md) was added as a tenth candidate because it directly compares search and deep-research configurations; its headline metrics were declined after the audit. ScholarQABench is an inspected evaluation dependency, not another candidate. Phoenix is retained as a source-available comparator, with its ELv2 boundary disclosed. This is a purposive sample, not a census or a ranking of the whole field. Any addition or exclusion requires a reason in the final inventory. Feature fewer projects than we inspect.

## Delegated work and integration

| Work | Owner | Artifact | Status |
|---|---|---|---|
| Cited-answer generation: ALCE, Self-RAG, STORM, OpenScholar | `radar07_source_refresh` | [Generation audit](24-citation-generation-oss.md) | Complete; source and metric audit saved |
| Evaluation and observability: Ragas, DeepEval, TruLens, Phoenix | `footprint_guardian_support` | [Evaluation audit](25-citation-evaluation-oss.md) | Complete; source and metric audit saved |
| Citation faithfulness, human/model source credibility, publisher implications | `radar07_share_copy` | [Credibility audit](26-source-credibility-and-citation-evidence.md) | Complete; source and metric audit saved |
| Article 01 analysis, synthesis, claim acceptance, manuscript, release | Parent | This brief, manuscript, publication module, [acceptance](32-ai-citations-rewrite-acceptance.md) | Manuscript and reviews complete; final release checks in progress |

Each research artifact must include primary links, check dates, repository SHAs, at least one code fact per inspected project, numbers with task and denominator, a claim/evidence table, competing explanations, and useful adoption judgments. Literature findings remain attributed to their authors. Code inspection is not a reproduced result. The local OpenRouter test is not live inference.

## Reader promise and editorial decisions

- Lead with the highest-value verified findings. No requested percentage becomes a claim until its original data and denominator are checked. Compare agentic and fixed retrieval only within a valid shared experiment; do not manufacture a trend from incompatible studies.
- Explain which projects generate citations, which test claim support, which retain execution records, and what none of those steps proves by itself.
- Keep Promptfoo to a bounded section reporting the two real subscription-backed answers and the observed source-review error. Preserve the detailed local/mock and capture evidence in research, without making it the article's center.
- Give engineering publishers concrete implications supported by evidence: original results, accessible source material, claim-level links, qualifications, and correction records. Separate justified credibility from being selected or cited by a model.
- State calculated bets as judgments with reasons and disconfirming evidence. Strong opinion is welcome; invented facts, personal experience, percentages, or quotations are not.
- Preserve one glossary/reference table with dates and source rationales. Keep research administration and future execution plans out of the article body.

Final title: **AI Citations: Do Agents Preserve the Evidence Behind an Answer?** Preserve the existing published URL; this rewrite changes the title, description, and body without breaking existing links. The [acceptance](32-ai-citations-rewrite-acceptance.md) records final discovery choices and review resolutions.

## Completion

Save the research, audit the strongest opening claims against originals, rewrite the whole article, synchronize served and Markdown versions, update metadata and draft sharing copy, and verify the production build and live release. Commit on main as work reaches reviewable checkpoints. Keep the original footprint explicitly partial and frozen; do not label the new research as included in it. The separate larger citation-frequency study and operating analytics work remain separate.


## Synthesis after research

Lead with STORM’s observed organization-rating gain and unchanged verifiability-rating share, retaining the small paired sample and no-detected-gain interpretation. OpenScholar supplies a same-base-model pipeline comparison with a reported citation F1 increase; do not call it a percent-correct citation rate or an isolated effect of agentic planning. Feature TruLens/DeepEval for cited-passage checks, Ragas for the narrower quote-matching boundary, and the real Codex/Claude capture as Promptfoo’s limited contribution. Keep synthetic unit checks and earlier mock responses in research, outside the article’s operating findings.

The main thesis is a judgment: engineering publishers and agent builders need claims that can be checked against particular sources, not citation counts presented as accuracy. The source-selection evidence supports a separate warning about learned identity cues; it does not establish a recipe for organic discovery. Preserve the published URL for existing readers and citations while changing the title, description, and body to the new subject.

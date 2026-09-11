# Evaluation-section manuscript review — September 11, 2026

**Result: Pass within the assigned scope. All four source-link repairs were incorporated before this snapshot.** No contradicted implementation claim, invented live experiment, or misleading footprint total was found in the evaluator, Promptfoo, or Phoenix sections.

Reviewed `packages/blog/drafts/oss-radar-07-promptfoo.md`, SHA-256 `955fe9b1128c6f25841e73eabe0b6ed38fc35755106076a2f80ee8b6091133d2`, at 2026-09-11T16:54:09.196258+00:00. Scope: evaluator policies, wrong-source versus pooled support, Promptfoo capture evidence, Phoenix annotation/license claims, and the research-footprint disclosure. This is an independent agent review, not human reception or an evaluator-accuracy benchmark. No model calls, reruns, production queries, manuscript edits, or TypeScript edits were performed in this review.

## Findings

| Passage | Judgment and evidence |
|---|---|
| TruLens / DeepEval / Ragas section, lines 63–77 | Pass. TruLens attribution judges each numbered citation against its corresponding source and exempts uncited claims. Its accuracy policy also penalizes missing citations; the normalized judge score is not an observed fraction of correct citations. DeepEval's community prompt explicitly rejects the wrong passage even when another supports the answer, but returns one overall verdict. Ragas's quoted-span utility searches concatenated source text without resolving markers; its faithfulness check separately judges statement support against collected context. The manuscript limits these to code findings and makes no live judge-accuracy claim. Exact pins, source units, and rival explanations are in [artifact 25](25-citation-evaluation-oss.md). |
| Promptfoo capture, lines 81–89 | Pass on behavior. Independently compared the retained Codex and Claude responses: each summary response equals its library export and separately started CLI export; `output` equals the saved answer and `raw` equals saved stdout. Both export evaluation IDs match. The [runner](repro/cli/run.ts) implements these checks, and the [recorded result](repro/cli/recorded/result.json) explicitly says source support was not scored there. This establishes preservation for the two recorded cases, not correctness or all export modes. |
| Claude example, line 85 | Pass. The answer's 277 cloud-classified requests misstates the source's total reclassified population. The classifier and lower-bound qualifications are supported by the retained [claim/source review](21-real-answer-source-review.md). The manuscript does not turn the two directed answers into a ranking, discovery result, or population estimate. |
| Phoenix, line 91 | Pass. The pinned span-annotation model stores a span relationship, label, score, explanation, metadata, and annotator kind. The platform license is Elastic License 2.0; the source-available label is necessary and correct. The separately Apache-licensed client/OTel packages do not change that platform classification. No Phoenix execution or source-preservation experiment is claimed. |
| Research record and footprint, final two paragraphs | Pass. Historical local mock responses are explicitly separated from OpenRouter/model calls; unrun evaluator judges remain code findings. The frozen JSON has eight unique sessions and 43,272,331 total tokens, with source sums and input/output arithmetic matching. Its last usage is `2026-09-11T03:26:22.382Z`, before the real CLI runs. The manuscript explicitly excludes those runs and this rewrite and accurately explains private-log commitments. This review checked the saved manifest, not a fresh recount of private session prefixes. |

## Source-link repairs found during review

The initial manuscript ranges stopped before the very code supporting three claims. The authoring agent widened them during review:

- TruLens `rag.py#L299-L445` omitted `CitationAttribution`, which starts at line 448; the revised range reaches line 502.
- DeepEval `template.py#L13-L29` omitted the explicit wrong-source rule at lines 30–32; the revised range reaches line 34.
- Ragas `util.py#L35-L62` omitted the substring comparison at lines 63–66; the revised range reaches line 66.

Repaired before the reviewed snapshot: the Promptfoo interface sentence now links the exact contract below. The documentation example shows `metadata` and `output`, but not response `raw`. The claim is supported by [Promptfoo's pinned `ProviderResponse` contract, lines 62–83](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts#L62-L83), which declares all three fields, and by the retained real responses.

Artifact 25 already uses complete source ranges (TruLens 326–477, DeepEval 15–50, Ragas 38–66), so it required no edit. Its [inspection receipt](repro/citation-evaluation-oss-20260911/source-inspection.json) contains whole-file hashes, not line anchors. This review rechecked all four repository HEADs and all 30 recorded source/license hashes against that receipt; all matched. The frozen footprint SHA-256 remains `36d3e870bd4d6efae26e45af1035065f7b071934f21f907c5aa75f048657dbd0`.

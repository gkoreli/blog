# DeepTRACE: useful audit design, unsuitable headline comparison

Checked September 11, 2026. No model calls or benchmark execution. This screening adds one candidate to the rewrite's initial nine-project sample because it directly compares search and deep-research configurations.

## Primary sources

- [ICLR 2026 version of record](https://proceedings.iclr.cc/paper_files/paper/2026/file/ad08767706825033b99122332293033d-Paper-Conference.pdf): methodology, formulas, Table 1, and explicit limitations. Results are dated August 27, 2025 in section 4, not September 2026.
- [Research repository](https://github.com/SalesforceAIResearch/answer-engine-eval/tree/c73639edfa1ca81b3da96a2dd4e4f33d1a64d651): inspected baseline, last commit June 2, 2026. The root [license](https://github.com/SalesforceAIResearch/answer-engine-eval/blob/c73639edfa1ca81b3da96a2dd4e4f33d1a64d651/LICENSE) is Apache-2.0.
- [Population script](https://github.com/SalesforceAIResearch/answer-engine-eval/blob/c73639edfa1ca81b3da96a2dd4e4f33d1a64d651/Venkit.et.al.2024/populate_scores.py): builds separate source-support labels and citation references, with model judgments saved per statement/source pair.
- [Evaluation notebook](https://github.com/SalesforceAIResearch/answer-engine-eval/blob/c73639edfa1ca81b3da96a2dd4e4f33d1a64d651/Venkit.et.al.2024/Answer_Engine_Eval.ipynb): computes distinct citation and factual-support matrices rather than treating every returned URL as supporting evidence.

## Evidence and limits

| Claim | Evidence state | Acceptance |
|---|---|---|
| Citation presence and source support can be represented separately for each statement/source pair | Code-inspected; paper-defined | Useful design. A citation can select a source that fails the support test. |
| The paper reports 303 queries: 168 debate and 135 expertise | Reported, section 3.2 | Preserve the task mix; not a sample of engineering-blog readership. |
| GPT-5 search and deep-research rows have different reported citation scores | Reported, Table 1 | Do not interpret as a controlled change of agentic planning alone. Public product configurations change more than one variable. |
| The released files reproduce every score in the current proceedings table | Unestablished | Inspected population code uses `gpt-4o` and iterates source slots 1–10; the paper describes GPT-5 judging and table entries with far more sources. Do not silently treat these as matching implementations. |

The paper itself needs care. Section 3.2 states nine configurations and 2,727 answers, while Figure 2 lists four search configurations and Table 1 lists seven configurations. Table 1 gives Gemini citation accuracy as 50.3, while the following prose says 40.3. The text also gives two conflicting definitions for the uncited-source numerator. These are reasons to avoid an article-opening percentage from this paper without a reconciled data release; they do not invalidate every result or the audit design.

The authors report excluding roughly 15% of URLs from checks requiring full source text when extraction fails. Their support judge has a reported Pearson correlation of 0.62 with manual labels on 100 checks. That is a limitation of the observed labeling process, not a measured accuracy of 62%.

## Editorial judgment

DeepTRACE's useful contribution here is the separation of a citation relationship from a support judgment. Its public code exposes that distinction. The code and proceedings are insufficiently aligned for this rewrite to make its search-versus-agent percentages a headline. Prefer the better-scoped STORM and OpenScholar comparisons, with their own limitations.

A competing reading is that the numerical inconsistencies are editorial updates around a still-useful dataset. A versioned dataset and evaluator that reconcile the configuration count, source coverage, model versions, and table values would change the acceptance decision. No maintainer was contacted.

## Inspection receipt

Public source files were downloaded to the local evidence archive under `oss-radar-07-rewrite-20260911/deeptrace`; no private conversations were involved. SHA-256: `populate_scores.py` = `0ef0fc87d74dda7b46fcfb7506f89f1188fcc317337f1017dd6820a943ff6ff4`; `Answer_Engine_Eval.ipynb` = `07eaf4f109ec83d9c71a8caf00d97c19e34b714db6db5f719a87df09e72b9e77`. The downloaded notebook was parsed as JSON to inspect code cells; no notebook cells were executed.

# Citation evaluation across Ragas, DeepEval, TruLens, and Phoenix

Checked September 11, 2026 UTC. This is a Codex source inspection of four assigned projects, with five deterministic Ragas quote-matching cases. No evaluator model, hosted evaluation, production query, or full RAG application was run.

**The useful distinction is already implemented in open-source code: an answer can agree with the collected evidence and still cite the wrong passage.** DeepEval and TruLens have explicit checks for that error. TruLens also distinguishes checking existing citations from penalizing missing ones. Ragas supplies a useful contrast: its quote matcher searches all supplied passages together, and our local check gave an incorrectly numbered citation the same match as the correct citation. Phoenix adds a place to retain traces and judgments, under a different license boundary.

- **Citation correctness needs the claim and the particular cited source.** A context-wide faithfulness score can lose that relationship.
- **Citation coverage is a separate policy.** TruLens's two citation functions deliberately treat missing citations differently.
- **A trace can retain the input to an evaluation.** Neither a trace nor agreement with supplied text establishes that a source caused the answer or that the source is credible.

The first two findings follow from the pinned implementations below; the third is the scope of the inspected inputs and stores, not a claim about every feature these projects could support. The [existing CLI experiment](20-subscription-cli-experiment.md) and [human-readable source review](21-real-answer-source-review.md) remain separate evidence. These library inspections are not new live-answer results, and the earlier local OpenRouter mock is not live service evidence.

## Inclusion rule and full inventory

The source cohort is the four named repositories assigned to this research track: Ragas, DeepEval, TruLens, and Arize Phoenix. Include each project's current default-branch implementation of answer/context evaluation, citation evaluation, or trace/evaluation retention. Inspect all four before selecting article entries. This is a diagnostic sample chosen for the article's question, not a market census, adoption ranking, or independently curated external program.

Repository code, tests, and documents are maintainer-authored primary sources. Branches were captured between 16:25:23 and 16:25:30 UTC; the [source receipt](repro/citation-evaluation-oss-20260911/source-inspection.json) records the exact per-repository time, commit date, inspected files, and hashes. The scope is the pinned `main` revisions, not a claim that every path was exercised or verified in an installed package release.

| Project and repository | Branch and baseline SHA | Actual license at this baseline | Exact job in this comparison |
|---|---|---|---|
| [Ragas](https://github.com/vibrantlabsai/ragas) | `main`, `298b68274234c060deacab3cf5fb52aa3a20e885` | [Apache-2.0][ragas-license] | Evaluate response support and retrieval quality; optionally match quoted text against supplied passages. The requested `explodinggradients/ragas` URL redirects to `vibrantlabsai/ragas`. |
| [DeepEval](https://github.com/confident-ai/deepeval) | `main`, `f94d940c1e5afc4b280420fe73fe17d146274018` | [Apache-2.0][deepeval-license] | Test supplied application outputs; its community citation metric asks whether each numbered citation supports its attached claim. |
| [TruLens](https://github.com/truera/trulens) | `main`, `72d60ce6c1af6f9a479bdc8f99d69796340d459a` | [MIT][trulens-license] | Evaluate application records and retrieved context, with separate policies for numbered citation attribution and broader citation accuracy. |
| [Arize Phoenix](https://github.com/Arize-ai/phoenix) | `main`, `d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70` | [Root ELv2][phoenix-license]; [Python evals ELv2][phoenix-evals-license]; [Python client][phoenix-client-license] and [OTel package][phoenix-otel-license] Apache-2.0 | Retain instrumented traces, attach evaluations to spans, and evaluate responses against context or a conversation record. |

**License consequence:** three projects have permissive root licenses; Phoenix is a source-available comparator. Its ELv2 files restrict offering substantial functionality to third parties as a hosted or managed service. Do not silently count the entire Phoenix platform as permissively licensed OSS because its client and OTel packages use Apache-2.0. The [Open Source Definition's field-of-endeavor rule](https://opensource.org/osd) explains why this distinction matters to an OSS inventory. This is a reading of the named license files, not a review of a particular deployment's legal compliance.

## Keep the measurement jobs separate

| Job | Evidence it needs | What the inspected implementations can establish |
|---|---|---|
| Answer/context faithfulness | Answer claims plus supplied context | Whether the judge considers the answer supported by that context. Ragas joins its contexts before NLI judgments; DeepEval's ordinary faithfulness path joins extracted truths. Neither operation preserves an explicit claim-to-citation mapping by itself. [Ragas][ragas-faithfulness], [DeepEval][deepeval-faithfulness]. |
| Citation correctness | A claim, its citation marker or attribution, and the corresponding passage | DeepEval's community metric and TruLens's attribution metric explicitly ask about the named passage, including a citation to the wrong passage when another passage supports the claim. [DeepEval prompt][deepeval-template], [TruLens criteria][trulens-rag]. |
| Citation coverage | The claims that require citations and which have them | TruLens citation accuracy penalizes missing citations; citation attribution explicitly does not. The accuracy output is a graded judge score, not a measured percentage of claims with supporting citations. [Criteria and policies][trulens-rag]. |
| Retrieval recall | A reference answer and the retrieved passages | Ragas context recall asks which reference-answer claims the retrieved context supports. That denominator is not the claims carrying citations in the generated answer. [Implementation][ragas-recall]. |
| Quote matching | Extracted quoted spans and source text | Ragas performs normalized substring matching. This is literal-text overlap, not semantic entailment or verification of the cited passage. [Matching function][ragas-quote-util]. |
| Trace capture | Instrumented events, IDs, parent relationships, inputs and outputs | Phoenix can store spans and attach labels, scores, explanations, metadata, and `LLM`/`CODE`/`HUMAN` annotator kinds. The schema retains a judgment's association with a recorded operation. [Models][phoenix-models]. |
| Causal source contribution | A design that identifies what changes when a source changes, is withheld, or is introduced | None of the inspected citation/faithfulness functions estimates this from an observed answer alone. This is an inference from their scoring inputs, not a project-wide impossibility claim. |
| Source credibility | Evidence about the source's method, provenance, accuracy, and relevant expertise | The inspected context-relative checks do not independently authenticate source claims. An answer can faithfully repeat a false source. That limitation follows from judging against the provided passages rather than an independent truth standard. |

Do not describe all four tools as similarity scorers. The inspected faithfulness functions use language-model judgments about support; Ragas's quote utility uses string matching. Those are different mechanisms, and neither should be renamed citation correctness unless it checks the actual cited source.

## TruLens: choose what an uncited claim should do

**Solves / for:** a RAG developer needs to distinguish wrong-source citations from incomplete citation coverage. TruLens makes that choice explicit. `citation_attribution` numbers a list of sources and asks a judge to check each `[N]` against passage N. Its default output is binary. `citation_accuracy` accepts broader attribution formats, uses a default 0–3 grading rubric, and penalizes missing citations. [Source numbering and delegation][trulens-provider]; [criteria][trulens-rag].

**From the code:** citation attribution's criteria explicitly exempt claims without a citation marker. Citation accuracy joins context passages without adding numbers, so callers using URLs or prose attributions need to preserve enough source identity inside the supplied context. The broader metric gives a normalized score through `generate_score`; a value such as 0.67 is not a count of two supported citations out of three. [Provider implementation][trulens-provider].

**Why care / our take:** use this as the strongest article entry. Two functions in one project show why the evaluation policy matters before selecting a dashboard or comparing scores. The shipped prompts address the article's wrong-source problem directly; their reliability on this blog's claims remains unmeasured.

**Hard question:** can a chosen judge reliably distinguish a wrong denominator or missing qualification from harmless paraphrase, and can it preserve claim-level evidence when returning an answer-level score? The cited attribution tests mock `generate_score`; they verify source numbering, prompt construction, and delegation, not a real judge's accuracy. [Test boundary][trulens-tests].

A first-hand historical report supplies a useful caution, not a current defect claim. In [issue #861](https://github.com/truera/trulens/issues/861), opened February 6, 2024 and closed February 8, a user reported groundedness scoring a supported learning-rate answer and an abstention at zero. The visible statement was truncated in the first example. This demonstrates why a score should remain inspectable; it does not identify the cause or establish the same behavior at our baseline. Status was checked through GitHub's API on September 11, 2026 and retained in the source receipt. **Evidence state: reported; not rerun.**

## DeepEval: a small, explicit wrong-source check

**Solves / for:** developers already using DeepEval can add its community `CitationFaithfulnessMetric` to numbered RAG answers. The implementation requires `input`, `actual_output`, and `retrieval_context`, numbers passages from one, and sends the question, passages, and answer to one judge. A faithful verdict maps to 1.0; an unfaithful verdict maps to 0.0. [Implementation][deepeval-citation].

**From the code:** the prompt requires both support for factual claims and support from the particular cited passage. Thus this is broader than TruLens's attribution-only policy, but it does not separately count how many claims lack citations. Its verdict schema returns an overall decision and reasoning rather than a structured record for every claim–source pair. [Prompt][deepeval-template], [schema][deepeval-schema].

**Why care / our take:** a credible alternative when the application already has numbered passages and DeepEval test cases. Give it a short comparison beside TruLens; a second full entry would largely repeat the same wrong-source distinction. Import it from `deepeval.metrics.community`, not the main metrics namespace. [Community status and usage][deepeval-doc].

**Hard question:** does the selected judge follow the wrong-source rule on actual failures? Its test fixture supplies a `FakeJudge` with a preset faithful or unfaithful verdict. That confirms metric wiring and scoring, not empirical detection of misattribution. [Tests][deepeval-tests]. Also, the inspected documentation's `strict_mode` bullet reverses the verbal score direction; the actual `_calculate_score()` and surrounding documentation make faithful = 1.0. Use the code for that claim.

## Ragas: quote overlap is useful within its boundary

**Solves / for:** a RAG team can ask whether an answer is supported by retrieved context, whether retrieval covers a reference answer, and whether quoted spans occur in the supplied text. Its faithfulness path decomposes an answer into statements, joins retrieved contexts, asks for NLI verdicts, and computes supported statements divided by generated statements. This is context-level support, not just embedding similarity. [Implementation][ragas-faithfulness].

**From the code:** `count_matched_spans` concatenates all source passages with spaces before substring matching. The quote itself can match even if the adjacent citation points elsewhere. [Utility][ragas-quote-util]. We loaded this inspected standard-library utility and the standalone quote function directly, without importing Ragas's package initializer, installing its dependencies, or calling a model.

| Deterministic case | Modern utility's matched / total | Standalone quote score |
|---|---:|---:|
| Exact quotation with the correct `[1]` marker | 1 / 1 | 1.0 |
| Same quotation with incorrect `[2]` marker | 1 / 1 | 1.0 |
| Quotation assembled across two separate source passages | 1 / 1 | 1.0 |
| Quotation changes 95 to 96 | 0 / 1 | 0.0 |
| Unquoted, unsupported assertion | 0 / 0 | 0.0 |

The [runner](repro/citation-evaluation-oss-20260911/ragas-quote-check.py) and [receipt](repro/citation-evaluation-oss-20260911/ragas-quote-check.json) retain exact synthetic inputs, Python version, baseline, and results. These five selected cases establish the matching behavior, not an error rate. Correct and incorrect markers deliberately produce the same match because the function does not resolve markers. The cross-passage case shows a further boundary: a match in the concatenation need not exist in any individual source passage.

The two public interfaces also differ when there are no quotations: the standalone function returns 0.0; the modern `QuotedSpansAlignment.ascore()` returns 1.0 with a no-spans reason. The former was executed; the latter was code-inspected only. Keep zero-span counts and the interface name beside the score. [Standalone function][ragas-quote], [modern class][ragas-quote-class].

**Why care / our take:** keep Ragas as the compact second article example using the pinned matching code to explain the measurement boundary. The synthetic function cases remain research receipts; they are not live model answers or operating evidence and should not become new evaluation counts in the article. Use quote matching to detect changed quoted text, and use another check for source attribution and semantic support.

**Hard question:** does a caller expect source-specific quotation verification from a context-wide string match? If so, preserve source identity and check each quotation against the source it actually cites before using this score.

## Phoenix: connect the judgment to the recorded operation

**Solves / for:** an application operator needs the input, retrieval/tool step, answer, and later judgment in one inspectable record. Phoenix's span model stores a trace association, span and parent IDs, attributes, events, and status. Its annotation model records the judgment and annotator kind. [Models][phoenix-models].

**From the code:** annotations are associated with a span by ID and are unique by name, span row, and identifier. The insertion path can postpone an annotation until the corresponding span arrives. This is a concrete evidence-retention mechanism beyond simply drawing a trace. It was inspected, not exercised against a running Phoenix server. [Insertion path][phoenix-insertion].

Its `FaithfulnessEvaluator` takes query, output, and context. Its `HallucinationEvaluator` instead checks the latest output against a supplied conversation record that can include tool calls and results. `RetrievalRelevanceEvaluator` judges whether a retrieval step helps with the request; `CompletenessEvaluator` concerns completing user requests, not the percentage of claims with citations. [Faithfulness][phoenix-faithfulness], [hallucination][phoenix-hallucination], [retrieval][phoenix-retrieval], [completeness][phoenix-completeness].

**Why care / our take:** include Phoenix as a short observability comparison with its license disclosed. A stored annotation can retain a custom citation judgment, but the inspected built-in metrics do not produce an explicit claim-to-citation evidence ledger. Supplying one remains integration work. A recorded retrieval event establishes what the instrumentation recorded, not that a source caused particular answer text or that a third-party assistant fetched the publisher's origin.

**Hard question:** did the application retain the actual passages and source identities needed to reproduce the evaluation, or only a score? That question applies regardless of the backend. ELv2 also changes the adoption decision for someone intending to offer a hosted product built from the platform.

## Claim and competing-theory audit

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| Explicit citation checks exist | DeepEval and TruLens describe wrong-source evaluation | Passage numbering, citation-specific prompts, and scorer delegation are present | Code-inspected | They are relevant candidates; judge reliability is still open | Avoid claiming all RAG metrics ignore attribution |
| Citation coverage must be specified | TruLens documents two different missing-citation policies | Attribution exempts uncited claims; accuracy penalizes them | Code-inspected | The policy can change a verdict on the same answer | Prevent incomparable scores |
| Quote alignment can miss a wrong citation | Ragas describes matching quoted spans in sources | Wrong marker retained a 1 / 1 match and standalone score 1.0 | Reproduced | Text matching cannot replace marker-specific support review | Gives the reader an inspectable counterexample |
| Trace-linked evaluation is implemented | Phoenix presents tracing and evaluation together | Annotation schema and insertion associate judgments with spans | Code-inspected | This can support an audit if inputs and source identities are retained | Separates evidence capture from score quality |
| Existing tests prove judge accuracy | Some DeepEval test commentary describes passing/failing semantic cases | Its fake judge returns prescribed verdicts; TruLens also mocks scoring | Code-inspected | These fixtures establish integration behavior only | A test name is not a model benchmark |

| Theory | Whose view / direction | Evidence for | Evidence against or missing | What would change the judgment |
|---|---|---|---|---|
| General RAG evaluation already solves the citation problem | Plausible operator shortcut; not a maintainer promise attributed here | All four expose useful context or answer evaluations | Context concatenation and the wrong-marker reproduction lose source-specific relationships | A demonstrated default path that preserves every claim's actual cited-source identity |
| Evaluation is becoming more explicit about citation obligations | Maintainers' implemented direction in DeepEval and TruLens | Numbered-passage checks and distinct missing-citation policies | Answer-level judge outputs and mocked fixtures do not establish claim-level accuracy | A held-out human-reviewed claim/citation set with retained judge inputs, outputs, and errors |
| The remaining integration problem is retaining the right evidence | Editorial inference, enabled by the inspected stores and APIs | Phoenix span annotations; all citation functions require supplied source material | A store cannot recover material the collector never captured | A real import that retains source units, mappings, access failures, and reproducible judgments |

For the article, feature **TruLens's explicit policy choice** and **Ragas's code-inspected quote-matching boundary**. DeepEval is a nearby alternative worth naming; Phoenix belongs with trace retention and its license qualification. Keep the synthetic function checks in research. Across this four-repository sample, two implement explicit cited-passage judgment, but none of the inspected checks turns an external assistant's citation into a measured human reader, causal source influence, or independently credible source.

## Reproduce and inspect

Run the saved check against a clean Ragas checkout at the inventory SHA:

```bash
python3 packages/blog/drafts/research/oss-radar-07/repro/citation-evaluation-oss-20260911/ragas-quote-check.py \
  --checkout /path/to/ragas
```

The [source inspection receipt](repro/citation-evaluation-oss-20260911/source-inspection.json) records the public paths and file hashes. Full upstream repositories remain outside this repository. No service credentials, model responses, or private production observations were introduced by this track.

[ragas-license]: https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/LICENSE
[ragas-faithfulness]: https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/faithfulness/metric.py#L116-L159
[ragas-recall]: https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/context_recall/metric.py#L109-L127
[ragas-quote-util]: https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/quoted_spans/util.py#L38-L66
[ragas-quote]: https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/quoted_spans.py#L96-L124
[ragas-quote-class]: https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/quoted_spans/metric.py#L96-L111
[deepeval-license]: https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/LICENSE.md
[deepeval-faithfulness]: https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/faithfulness/faithfulness.py#L281-L295
[deepeval-citation]: https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/citation_faithfulness.py
[deepeval-template]: https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/template.py#L15-L50
[deepeval-schema]: https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/schema.py
[deepeval-tests]: https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/tests/test_metrics/test_citation_faithfulness_metric.py#L17-L72
[deepeval-doc]: https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/docs/content/docs/%28community%29/metrics-citation-faithfulness.mdx
[trulens-license]: https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/LICENSE
[trulens-rag]: https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/src/feedback/trulens/feedback/templates/rag.py#L326-L477
[trulens-provider]: https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/src/feedback/trulens/feedback/llm_provider.py
[trulens-tests]: https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/tests/unit/test_citation_attribution.py#L1-L64
[phoenix-license]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/LICENSE
[phoenix-evals-license]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/packages/phoenix-evals/LICENSE
[phoenix-client-license]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/packages/phoenix-client/LICENSE
[phoenix-otel-license]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/packages/phoenix-otel/LICENSE
[phoenix-models]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/src/phoenix/db/models.py#L1284-L1326
[phoenix-insertion]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/src/phoenix/db/insertion/span_annotation.py#L45-L127
[phoenix-faithfulness]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/packages/phoenix-evals/src/phoenix/evals/metrics/faithfulness.py#L13-L78
[phoenix-hallucination]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/packages/phoenix-evals/src/phoenix/evals/metrics/hallucination.py#L13-L98
[phoenix-retrieval]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/packages/phoenix-evals/src/phoenix/evals/metrics/retrieval_relevance.py#L14-L43
[phoenix-completeness]: https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/packages/phoenix-evals/src/phoenix/evals/metrics/completeness.py#L14-L31

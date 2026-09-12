# OSS Radar #07: AI Citations — Do Agents Preserve the Evidence Behind an Answer?

A better-organized AI research report is not necessarily easier to verify. In STORM's 2024 study, good organization ratings rose from **45% to 70%** compared with an outline-driven retrieval baseline. Good verifiability ratings were **67.5% for both**. The open-source work worth watching tackles that gap: finding better evidence, keeping the connection between a claim and its source, and checking what the answer actually says. [STORM study, Table 6](https://aclanthology.org/2024.naacl-long.347.pdf).

- **A research workflow can improve citation scores.** OpenScholar raised reported citation F1 from **31.1 to 39.5** against a standard retrieval baseline using the same GPT-4o model. The full pipeline changed, including how evidence was selected and revised. [OpenScholar, Table 1](https://www.nature.com/articles/s41586-025-10072-4).
- **A citation needs its own check.** TruLens and DeepEval explicitly ask whether the particular cited passage supports the claim. Agreement with the collected material is a different test. [TruLens criteria](https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/src/feedback/trulens/feedback/templates/rag.py#L299-L502); [DeepEval citation prompt](https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/template.py#L15-L34).
- **Preserving an answer lets us inspect its mistakes.** We ran Codex and Claude Code on a question about this blog. Both answers survived our capture pipeline. Claude cited the article while changing what one of its numbers meant. [Saved experiment](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md); [source review](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md).

I want this blog to be useful to people and to the agents reading on their behalf. A citation matters because it carries the work into another answer. It can also carry a mistake under my URL. Counting mentions would miss the difference.

This issue follows the open-source projects working on that problem. Some generate research, some judge answers, and some retain the records. Their code and their published results deserve different kinds of attention. The studies below are dated comparisons, not a ranking of today's assistants; the [research inventory](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md) records the selected projects and inspected versions.

## OpenScholar: improve the research process around the model

OpenScholar is the most convincing project here for someone building scientific research tools. It makes the evidence collection and revision process part of the system you can inspect. Its February 2026 Nature paper reports a useful comparison: the same GPT-4o base model, first with standard retrieval from the OpenScholar datastore, then inside the fuller OpenScholar pipeline. [Paper](https://www.nature.com/articles/s41586-025-10072-4).

| On 100 Scholar-CS questions | GPT-4o + standard retrieval | OpenScholar-GPT-4o |
|---|---:|---:|
| Answer rubric score | 52.4 | 57.7 |
| Reported citation F1 | 31.1 | 39.5 |

Citation F1 combines precision and recall; **39.5 does not mean 39.5% of citations were correct**. The rubric measures answer requirements. These are model-assisted assessments of scientific synthesis, not measurements of blog discovery. The comparison changes several components and can introduce additional retrieved evidence. It does not isolate an effect of adding an agent. The paper's PaperQA2 baseline using the OpenScholar datastore scores 48.0 on this citation measure, so OpenScholar is not the winner of every comparison. [Table 1](https://www.nature.com/articles/s41586-025-10072-4); [evaluation methods](https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-025-10072-4/MediaObjects/41586_2025_10072_MOESM1_ESM.pdf).

For builders, the implementation is more useful than a claim that the model thinks harder. The [OpenScholar runner](https://github.com/AkariAsai/OpenScholar/blob/0e9b8fb912273d3dae39e593da86e4f6d3bf8de1/src/open_scholar.py#L527-L708) saves an initial answer, processes up to three feedback items, can retrieve additional Semantic Scholar material, and can run a final attribution pass. That pass asks a model to revise the citation-bearing text. It is a check with its own possible failures.

There is a revealing detail in the same code: an optional ranking adjustment adds normalized paper citation counts. A paper can rank higher partly because other papers cite it. That is an explicit source-selection preference, separate from whether it supports the sentence being written. [Ranking implementation](https://github.com/AkariAsai/OpenScholar/blob/0e9b8fb912273d3dae39e593da86e4f6d3bf8de1/src/open_scholar.py#L40-L60).

I would study this pipeline before treating a larger general-purpose model as the whole solution to literature research. It offers specific parts to examine and change: retrieval, ranking, feedback, and attribution. The hard question is whether the evidence and evaluator in your deployment match the conditions behind the result. OpenScholar gives a builder specific components to improve when a research answer fails.

## STORM and Co-STORM: better questions change what gets found

STORM's useful idea is to research an outline before writing the article. It generates different perspectives on a topic, has them ask questions, and gathers material through those conversations. That gives a research tool another job besides answering the first question: uncover questions the user had not thought to ask. [STORM research](https://aclanthology.org/2024.naacl-long.347.pdf).

The editor study behind the opening compared **20 pairs of articles**, with two editor ratings per pair and ten editors overall. A good rating meant at least four on a seven-point scale.

| Share of good ratings | Outline-driven retrieval | STORM |
|---|---:|---:|
| Organization | 45% | 70% |
| Verifiability | 67.5% | 67.5% |

The study detected an organization gain, not a verifiability gain. The small paired sample does not prove the systems equivalent. Its human verifiability criterion also includes Wikipedia's restriction against unsupported original synthesis; it is broader than checking whether a link exists. [Table 6 and methods](https://aclanthology.org/2024.naacl-long.347.pdf).

The next details are for engineers building this kind of workflow. STORM's [curation code](https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/knowledge_curation.py#L204-L243) retains search queries, retrieved material, and the answer formed from it. Its [section writer](https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/article_generation.py#L144-L174) receives numbered snippets under a 1,500-word information limit. A page collected during research is therefore not necessarily a page included in a section's writing context.

It also [merges references by URL](https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/storm_dataclass.py#L188-L207) and translates section-local citation numbers into one reference list. That solves a real bookkeeping problem in a report assembled from multiple sections. It does not check the truth of the attached claim.

Co-STORM adds a useful variation. Its [moderator's question generator](https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/collaborative_storm/modules/grounded_question_generation.py#L81-L115) receives retrieved snippets that have not been used, alongside the knowledge summary and recent discussion. That gives the moderator a concrete way to redirect the research. The role matters because of the information it receives and the decision it makes.

This is research assistance I would want to inspect and steer. The unresolved problem is whether the questions expose an omission or elaborate the same incomplete framing. For a research product, better organization and better source support deserve separate tests.

## ALCE and Self-RAG: citations can be attached, tested, or used during generation

ALCE makes a distinction that every citation product should preserve. Its [post-hoc citation script](https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/post_hoc_cite.py#L38-L70) can find a matching document for an uncited sentence and insert a reference. Its separate [evaluator](https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/eval.py#L340-L429) asks whether the cited passages support that sentence. Creating the citation and assessing it are different operations in the same repository.

The evaluator also handles a subtle case: several citations can support a claim together. Checking each document in isolation can miss a valid combined explanation; accepting every attached document can reward irrelevant references. ALCE tests joint support and each reference's contribution. That is a better starting point than counting square brackets.

Self-RAG moves evidence assessment into generation. Its [long-form decoder](https://github.com/AkariAsai/self-rag/blob/1fcdc420e48f50a7d7ab1ece5494221b93252e99/retrieval_lm/run_long_form_static.py#L72-L238) combines relevance, support, and utility scores from the model's reflection tokens. Operators can change their weights. But the inspected static path uses supplied passages; its existence does not establish that a model independently searches the web after each sentence.

When choosing a citation library, I would first ask where evidence affects the answer and how that decision can be checked. Attaching a source afterward may help verification. It does not establish that the source produced the claim in the first place.

## TruLens, DeepEval, and Ragas: choose the citation check you mean

A claim can agree with the retrieved material and still point to the wrong source. TruLens and DeepEval have explicit checks for that mistake. This is where the ecosystem gets more useful than a generic faithfulness score.

TruLens exposes two policies. Its [citation attribution check](https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/src/feedback/trulens/feedback/templates/rag.py#L299-L502) judges each numbered reference against the corresponding passage and deliberately ignores claims without citation markers. Its citation accuracy check also penalizes missing citations and returns a graded judgment. Those policies answer different questions.

| Check | What its instructions ask | What a result leaves open |
|---|---|---|
| TruLens `citation_attribution` | Does each numbered citation point to a supporting passage? | Claims without citation markers are exempt |
| TruLens `citation_accuracy` | Are citations supported, correctly attributed, and present where required? | The normalized judgment is not a measured fraction of correct citations |
| DeepEval community `CitationFaithfulnessMetric` | Are factual claims supported, and does each marker point to the right passage? | One overall verdict does not provide a reviewed record for every claim |

DeepEval's [implementation](https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/citation_faithfulness.py) numbers the supplied passages before calling the judge. Its [prompt](https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/template.py#L15-L34) explicitly rejects a citation to the wrong passage even if another passage contains the answer. That is the relevant behavior to investigate when an answer cites the right website but the wrong evidence.

Ragas illustrates a narrower, useful operation. Its [quote-matching function](https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/quoted_spans/util.py#L35-L66) joins source passages and checks whether quoted text occurs in the combined string. It does not resolve citation markers. Its separate [faithfulness metric](https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/faithfulness/metric.py#L116-L159) uses model judgments of statement support against collected context. Neither operation, by itself, checks the identity of the particular source cited beside a claim.

These are code findings. We did not run these judges against our blog and establish their accuracy. For a question about attribution, I would choose an explicit citation policy such as TruLens or DeepEval's, and retain the judged passages and reasons. Use quote matching for quote matching. A score is useful when you can explain what would make it fail.

## Promptfoo: our real answer survived, including its mistake

Promptfoo earned a narrower role in this investigation: running a test and retaining its records. On September 10, we used it with a custom provider to call the official Codex and Claude Code clients through our existing subscriptions. Each received the same question once, with the URL of my [browser-and-bot classification article](/how-i-separate-readers-from-bots-without-javascript). [Exact question, client versions, answers, and capture checks](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md).

Both final answers and their emitted CLI records survived Promptfoo 0.122.2's summary and JSON exports, including an export from a new process reopening the database. No answer was regenerated to obtain a better result.

Claude's answer referred to **277 cloud-classified requests**. The article's 277 was the total reclassified population, comprising more than that one category. The URL was relevant and the headline number recognizable, but the sentence changed its meaning. Our source review also found an incorrect account of the classifier and an overbroad lower-bound claim. [Unchanged answers and review](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md).

Preservation let us inspect those errors. It did not prevent them. These two directed answers are not a model ranking, a citation-frequency estimate, or evidence that an agent found the blog organically: we supplied the URL.

The relevant [Promptfoo interface](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts#L62-L83) accepts a raw response and metadata alongside the answer being scored. That makes it useful for an evidence-retaining test harness. It leaves us responsible for what we capture and how we assess it. For one answer we only want to archive, the CLI alone needs fewer parts.

Phoenix addresses the related problem of keeping execution and judgment connected. Its [span-annotation model](https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/src/phoenix/db/models.py#L1284-L1326) associates scores, labels, and explanations with a recorded operation. It belongs in the comparison as a **source-available platform under Elastic License 2.0**, not silently in a permissive-OSS category. [License](https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/LICENSE).

I would keep this capture path for repeated tests, alongside source review. The useful record includes the answer, the relevant passages, and the source identities, so a future failure can be investigated without asking the model to recreate it.

## Citation analytics: visibility, source support, and origin

Citation support and causal attribution are different research problems. Wallat and colleagues tested this by modifying retrieved documents, then checking whether a model attached new citations to statements it continued to make. In one adversarial Command-R+ condition, **273 of 476 cases retaining the original statement** newly cited an altered, previously uncited document; there had been **702 attempted cases**. [Final ICTIR 2025 paper, Figure 6](https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf).

That conditional result is not a claim that 57% of today's AI citations are fake. It shows why a displayed citation alone cannot establish the origin of a statement. A source can help a reader verify an answer even when the model's causal reliance on it remains unknown.

For a publisher, that distinction changes the analytics. A server request, a citation in a captured answer, a supported claim, and a human reading the article are separate observations. The [measurement contract](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md) we developed keeps those units separate. An agent's identity also does not tell the receiving site whether a person requested that particular task.

Microsoft already offers publisher-facing citation analytics. Its [AI Performance preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview), announced in February 2026, reports cited URLs and citation activity across Microsoft Copilot, Bing AI summaries, and selected partners. Those counts show appearances within the product's coverage. They do not say whether the claim beside a citation is supported. The open-source evaluators above address that additional question when we have the answer and its sources.

I want to measure whether our writing is being represented correctly as well as whether it appears. Those are useful questions even when we cannot reconstruct everything that caused an answer.

## What makes an engineering source worth trusting?

A credible engineering source gives a reader a way to evaluate its consequential claims. The author can show what ran, under which version and conditions, what happened, and where the interpretation stops. That applies to a personal blog and to a research paper. A recognizable name supplies context; it does not perform the check.

Models can react to that name. Khan and colleagues tested **twelve models** on choices involving news outlets, research venues, and sellers. Their controlled comparisons presented equivalent information under different source labels and found source preferences. This is evidence about selection among available candidates, not a demonstrated method for getting an unknown engineering blog discovered. [ICLR 2026 paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf).

Google's [guidance for AI Overviews and AI Mode](https://developers.google.com/search/docs/appearance/ai-features) is more practical for the access problem: supporting pages must be indexed and eligible for a search snippet. It requires no special AI file or schema. Its [helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) also asks about original work, authorship, sourcing, and how content was produced. Those are documented recommendations, not a promise that a byline or a pronoun will increase citations.

For this publication, I would put the effort into four things:

- **Original results with an inspectable method.** Give a reader something they could not obtain by rephrasing another article. Keep the command, configuration, output, or source comparison available when it carries the argument.
- **Numbers with their conditions attached.** Put the population, version, time window, and important qualification beside the result. Our 277-request example shows what changes when the population is lost.
- **Links to the evidence for the particular claim.** A release announcement establishes an announcement. A pinned implementation establishes what that code does. A benchmark needs its task and scoring method.
- **Readable access and a visible correction history.** Publish text that people and tools can retrieve, use stable addresses, and correct material mistakes. Let the source remain useful after the first visit.

This is my publishing judgment, informed by the evidence above. It makes our work easier to inspect and reuse. Whether a particular engine rewards it with more organic citations is a separate outcome to measure.

## My bet: the useful unit of citation analytics is the claim

I would not choose an agent-research stack on citation count or an overall faithfulness score alone. OpenScholar and STORM expose how evidence enters a report. ALCE, TruLens, and DeepEval expose questions we can ask about the resulting citations. Capture tools let us retain what those checks need. The useful combination preserves a claim, its particular source, and enough context to check the relationship.

**My first bet is that separate citation checks will catch important errors that overall answer scores miss.** The implementation pieces already exist. Their place in a research agent's test suite depends on catching those errors in real, reviewed cases, at a cost the operator will keep paying.

**My second bet is that precise, current evidence can beat source familiarity on engineering questions tied to a particular version.** That is why I want to publish original measurements, small reproductions, and visible corrections. If agents and readers repeatedly choose a familiar but outdated account over the relevant evidence, that would weaken the bet. More mentions alone would not confirm it.

I want agents to cite this blog. I also want the person following that citation to find the claim the answer promised, with enough evidence to decide whether to trust it.

---

## Glossary & sources

Definitions and references share one table. Study findings belong to their named authors and dated conditions; repository links identify the inspected code. The research notes retain the complete inventory, comparison limits, and checks we declined to treat as headline evidence.

| Term or finding | Source and why it matters | Date |
|---|---|---|
| STORM: organization and verifiability are separate outcomes | [STORM, Shao et al.](https://aclanthology.org/2024.naacl-long.347.pdf) — Table 6 supplies the paired editor study, rating scale, and observed shares. | Jun 2024 |
| OpenScholar: reported scores for scientific synthesis | [OpenScholar, Asai et al.](https://www.nature.com/articles/s41586-025-10072-4) — Table 1 compares retrieval pipelines; its scores are not measurements of current blog discovery. | Feb 4, 2026 |
| Citation F1 combines citation precision and recall; it is not the fraction of citations that are correct | [OpenScholar supplementary methods](https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-025-10072-4/MediaObjects/41586_2025_10072_MOESM1_ESM.pdf) — Defines the citation evaluator and sentence exclusions; the research audit records the unconfirmed final F1 aggregation. | Feb 2026 |
| OpenScholar retains an initial answer and runs bounded feedback and attribution steps | [OpenScholar implementation](https://github.com/AkariAsai/OpenScholar/blob/0e9b8fb912273d3dae39e593da86e4f6d3bf8de1/src/open_scholar.py#L527-L708) — Shows which revision and additional-retrieval paths are enabled by configuration. | Sep 11, 2026 (checked) |
| Source ranking may include paper citation counts | [OpenScholar ranking adjustment](https://github.com/AkariAsai/OpenScholar/blob/0e9b8fb912273d3dae39e593da86e4f6d3bf8de1/src/open_scholar.py#L40-L60) — Makes one source-popularity preference explicit in code. | Sep 11, 2026 (checked) |
| Agentic research can change its questions and retrieve evidence during the task | [STORM knowledge curation](https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/knowledge_curation.py#L204-L243) — Retains the queries, retrieved information, and generated research answer. | Sep 11, 2026 (checked) |
| Retrieved context: the material actually supplied to a generation step | [STORM section writing](https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/article_generation.py#L144-L174) — Shows numbered snippets and the 1,500-word information limit. | Sep 11, 2026 (checked) |
| STORM reconciles citation numbers by source URL | [STORM reference merging](https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/storm_dataclass.py#L188-L207) — Preserves a consistent source identity across separately written sections. | Sep 11, 2026 (checked) |
| Co-STORM can use previously unused material to ask its next question | [Co-STORM grounded-question generator](https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/collaborative_storm/modules/grounded_question_generation.py#L81-L115) — Explains the moderator through its inputs and action rather than its role name. | Sep 11, 2026 (checked) |
| Post-hoc citation: a reference attached after the answer text exists | [ALCE citation insertion](https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/post_hoc_cite.py#L38-L70) — Shows citation insertion without an entailment acceptance test in that path. | Sep 11, 2026 (checked) |
| Citation precision and recall assess references and support coverage under a stated policy | [ALCE evaluator](https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/eval.py#L340-L429) — Checks cited passages jointly and examines each reference’s contribution. | Sep 11, 2026 (checked) |
| Reflection tokens let a generator score relevance, support, and utility | [Self-RAG long-form decoder](https://github.com/AkariAsai/self-rag/blob/1fcdc420e48f50a7d7ab1ece5494221b93252e99/retrieval_lm/run_long_form_static.py#L72-L238) — Exposes weighted scores and retrieval modes while retaining the supplied-context boundary. | Sep 11, 2026 (checked) |
| Citation correctness: whether the particular cited source supports its attached claim | [TruLens citation criteria](https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/src/feedback/trulens/feedback/templates/rag.py#L299-L502) — Separates wrong-source attribution from policies that also penalize missing citations. | Sep 11, 2026 (checked) |
| DeepEval supplies a community citation metric with an overall verdict | [DeepEval citation metric](https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/citation_faithfulness.py) — Shows the numbered-input path and faithful/unfaithful score mapping. | Sep 11, 2026 (checked) |
| A supported claim can still cite the wrong passage | [DeepEval citation prompt](https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/template.py#L15-L34) — Explicitly checks each marker against its named passage. | Sep 11, 2026 (checked) |
| Quote matching checks whether quoted text occurs in supplied material | [Ragas quoted-span utility](https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/quoted_spans/util.py#L35-L66) — Shows concatenation and substring matching without citation-marker resolution. | Sep 11, 2026 (checked) |
| Context faithfulness: judged support for answer statements within supplied context | [Ragas faithfulness implementation](https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/faithfulness/metric.py#L116-L159) — Separates model-based statement support from string matching and cited-source identity. | Sep 11, 2026 (checked) |
| Two real subscription-backed answers and their emitted records survived capture | [Codex and Claude Code experiment](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md) — Retains the exact question, execution method, unchanged answers, and database/export checks. | Sep 10, 2026 (PDT) |
| Claude cited the article while misdescribing the 277-request population | [Review against retained sources](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md) — Makes the source-support judgments and their limits inspectable. | Sep 10, 2026 (PDT) |
| Capture metadata can retain evidence alongside the answer being evaluated | [Promptfoo custom-provider interface](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts#L62-L83) — Defines the extension path used by the real CLI experiment. | Sep 11, 2026 (checked) |
| Trace: a record of instrumented operations and their relationships | [Phoenix span annotations](https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/src/phoenix/db/models.py#L1284-L1326) — Associates an evaluation and its annotator kind with a recorded span. | Sep 11, 2026 (checked) |
| Phoenix’s platform uses Elastic License 2.0 | [Phoenix license](https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/LICENSE) — Keeps the source-available comparator distinct from the permissively licensed projects. | Sep 11, 2026 (checked) |
| Causal citation faithfulness asks whether the cited source influenced the claim | [Wallat et al., Correctness Is Not Faithfulness](https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf) — Defines the distinction and reports the conditional adversarial experiment, including excluded changed-answer cases. | Jul 2025 |
| Source identity can affect choices among supplied candidates | [Khan et al., ICLR source-preference study](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf) — Controls source labels and content; does not measure organic engineering-blog discovery. | 2026 |
| Google AI-search eligibility uses ordinary search requirements | [Google AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) — States index/snippet eligibility and that no special AI file or schema is required. | Sep 11, 2026 (checked) |
| Original work, methods, and authorship are documented publisher recommendations | [Google helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) — Supports inspectable publishing practices without promising a ranking formula. | Sep 11, 2026 (checked) |
| Requests, citations, source support, and readership are different units | [Proposed citation measurement contract](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md) — Separates observations and denominators; this is a design, not deployed citation analytics. | Sep 8, 2026 |
| Publisher citation analytics measures appearances within defined product coverage | [Bing AI Performance announcement](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) — Defines citation counts and cited-page metrics without claiming a source-support audit. | Feb 10, 2026 |
| Selected-project inventory and full research record | [OSS Radar #07 worklist](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md) — Links the primary-source audits, pinned repositories, actual runs, and rejected headline comparisons. | Sep 11, 2026 |

### Research record

This issue combines primary-paper review, pinned code inspection, and the two real CLI runs linked above. Codex performed the research and experiments; Goga supplied the question, publication direction, and editorial judgment. The [complete shaping prompts](/oss-radar-07-promptfoo/prompts) are public at his request. The [worklist](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md) preserves the narrower earlier Promptfoo investigation and the full rewrite. Historical local mock-response tests remain labeled in that record; they were not OpenRouter service or model calls.

The [partial research footprint](/oss-radar-07-promptfoo/prompts#research-footprint) measures **43,272,331 tokens across eight recovered sessions from the earlier investigation**. It excludes this rewrite, the later real CLI experiment, and other disclosed work. Its frozen manifest records integrity commitments to private logs; it is auditable by the author, not independently reconstructible by readers. Token volume is not evidence that the claims are correct.

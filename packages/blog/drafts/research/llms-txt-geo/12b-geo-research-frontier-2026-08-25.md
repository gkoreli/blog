# GEO Research Frontier — Primary Evidence Map

**Cutoff:** 2026-08-25  
**Question:** What does the 2023–2026 academic evidence actually establish about discovery, source selection, citation, answer absorption, referrals, and outcomes in generative search?  
**Scope rule:** Primary papers and official proceedings only. Provider guidance, vendor studies, surveys, and secondary summaries are excluded from the evidentiary map below. Preprints are included only when they add a field setting or a measurement construct absent from the peer-reviewed record, and are labeled as such.  
**Article action:** Research artifact only. The article was not edited.

## Executive conclusion

The research frontier does not support one portable “GEO checklist.” It supports a pipeline with different causal questions:

1. **Search activation / query expansion:** does the system search, and which subquestions does it pursue?
2. **Retrieval / source selection:** which pages enter the candidate set?
3. **Context allocation / order:** which candidates receive attention and where are they placed?
4. **Citation selection:** which candidate is named or linked?
5. **Answer absorption / fidelity:** which candidate actually contributes facts, wording, structure, or support?
6. **Referral / user behavior:** does a user visit the publisher?
7. **Outcome:** does the visit produce durable audience or business value?

Peer-reviewed work is strongest at stages 2–5 in controlled or frozen candidate sets. Live-system audits establish that sourcing, answer polarity, and citation correctness vary substantially across engines and runs. Early 2026 field evidence says generative answer surfaces can reduce publisher referrals, but it does **not** show that rewriting a page, adding a special file, or adopting a content format causes organic selection.

The durable operating position is therefore:

> Make the page eligible, relevant, independently useful, and easy to verify. Measure retrieval, citation, absorption, and referral separately. Treat engine-specific rewrites as experiments inside a changing competitive system, not as a new writing religion.

No reviewed paper in this map tests `llms.txt`, Markdown endpoints, FAQ blocks, JSON-LD, or any other machine-facing artifact as an independent cause of organic retrieval or citation.

## Five findings that should materially change the article

These alter the article's argument rather than merely adding references:

1. **Add absorption between citation and traffic.** Peer-reviewed RAG work now shows a large retrieved-but-unused gap. The article should not treat a citation as proof that the source shaped the answer.
2. **Describe content tactics as post-retrieval and competitively saturable.** The strongest causal rewrite studies supply or freeze the candidates. AutoGEO further shows that when every candidate adopts the same successful rules, the relative advantage largely disappears even as answer quality improves.
3. **Make query fan-out a bounded coverage problem.** Decomposition can improve retrieval, but over-searching and noisy evidence can worsen answers. This supports covering a real question family, not manufacturing a page for every imagined hidden query.
4. **Require repeated measurement.** Live systems change source pools over weeks and can flip answers within minutes. A single screenshot or one-provider check should be framed as an anecdote, not a ranking result.
5. **Separate publisher usefulness from publisher payoff.** The first causal and quasi-causal field evidence points toward fewer outbound clicks from answer surfaces. The most promising positive production case is architectural—better intent models, indexable collections, and link graphs—not a prose template, and it remains a first-party preprint.

## Evidence status at a glance

| Evidence family | Strongest status by cutoff | What it can establish | What it cannot establish |
|---|---|---|---|
| Controlled GEO rewriting | KDD, ICLR, ACL, Findings ACL, SIGIR peer-reviewed | Post-retrieval content and candidate-order effects under supplied/fixed candidates | Organic discovery, live provider ranking, referral traffic |
| Retrieval and query decomposition | NAACL, EACL peer-reviewed | Coverage/noise tradeoffs and retrieval-to-generation gaps in RAG | Proprietary query fan-out internals or publisher-side ranking lift |
| Citation correctness and evaluation | EMNLP, ACL, ICLR, FAccT peer-reviewed | Citations, support, necessity, and perceived trust are distinct | A stable universal citation-quality number across engines and time |
| Live multi-engine measurement | Findings ACL and ICLR peer-reviewed | Cross-engine differences, temporal drift, run-to-run instability | A causal page-edit recipe |
| Brand/source and position bias | EMNLP/ACL peer-reviewed | Source labels, repetition, and order can change use inside controlled contexts | A general open-web “brand ranking factor” or universal first-position rule |
| Publisher traffic and field outcomes | 2026 preprints; one official conference extended abstract with unclear review status | Early causal/observational evidence of referral substitution | Which publisher-side GEO tactic causes traffic |
| Citation absorption as a named metric | 2026 preprints | A useful descriptive distinction between citation breadth and answer influence | Validated causal absorption optimization |

## The paper ledger: what each study freezes

### 2023: citation quality becomes a separate object of study

#### ALCE — generating text with citations

**Paper/status:** [Enabling Large Language Models to Generate Text with Citations](https://aclanthology.org/2023.emnlp-main.398/) — EMNLP 2023, peer-reviewed.

**Stage:** generation and attribution after retrieval.

**What is frozen:** benchmark questions, retrieved/supplied source contexts, task prompts, and evaluation protocol. It does not expose live commercial retrieval.

**Finding:** ALCE made fluency, correctness, citation recall, and citation precision separately measurable. This is foundational because a response can read well while its citations are incomplete or wrong.

**Article rationale:** use it to explain why “the page was cited” is not a sufficient quality claim. Do not use it as page-optimization evidence.

#### Verifiability audit of commercial generative search

**Paper/status:** [Evaluating Verifiability in Generative Search Engines](https://aclanthology.org/2023.findings-emnlp.467/) — Findings of EMNLP 2023, peer-reviewed.

**Stage:** live answer, citation, and support quality.

**What is frozen:** a diverse query set and human evaluation rubric. Bing Chat, NeevaAI, Perplexity, and YouChat remain black boxes; their candidate pools and model versions are not controlled.

**Finding:** on average, 51.5% of generated sentences were fully supported by citations and 74.5% of citations supported their associated sentence. Citation precision was inversely correlated with perceived utility (`r = -0.96`).

**Article rationale:** the trust signal can outrun the evidence. A citation count is not a correctness score, and a persuasive answer is not necessarily a well-grounded one.

### 2024: GEO demonstrates post-retrieval malleability; evaluation remains hard

#### GEO

**Paper/status:** [GEO: Generative Engine Optimization](https://doi.org/10.1145/3637528.3671900) — KDD 2024, peer-reviewed.

**Stage:** use and citation after a source has already been selected.

**What is frozen:** in the main benchmark, Google supplies the top five pages and GPT-3.5 generates from them. In the Perplexity subset, source files are uploaded and the engine is instructed to answer from those supplied files.

**Finding:** quotations, statistics, citations, authoritative phrasing, and fluency can change position-adjusted word share and subjective impression within the supplied context. Effects vary by domain and strategy.

**Boundary:** the paper does not test whether a rewrite enters organic retrieval, whether `llms.txt` is read, or whether a user clicks.

**Article rationale:** retain as the origin of the optimization literature, but always attach the frozen-retrieval boundary to its headline result.

#### AttributionBench

**Paper/status:** [AttributionBench: How Hard is Automatic Attribution Evaluation?](https://aclanthology.org/2024.findings-acl.886/) — Findings of ACL 2024, peer-reviewed.

**Stage:** measurement of statement-to-source support.

**What is frozen:** compiled attribution datasets and human labels; the experiment varies automatic evaluators rather than search engines.

**Finding:** even a fine-tuned GPT-3.5 reached only about 80% macro-F1 on binary attribution evaluation. Analysis of more than 300 failures found nuanced information and different model/human information access were major causes.

**Article rationale:** an LLM-judged visibility or support score is an estimate with evaluator error, not ground truth.

### 2025: the field separates retrieval from use, and source identity from content

#### Sub-question coverage in RAG

**Paper/status:** [Do RAG Systems Cover What Matters? Evaluating and Optimizing Responses with Sub-Question Coverage](https://aclanthology.org/2025.naacl-long.301/) — NAACL 2025, peer-reviewed.

**Stage:** query decomposition, retrieval coverage, and answer use.

**What is frozen:** 200 open-ended non-factoid questions, generated/classified subquestions, requested answer length, and a reproducible evaluation protocol. The commercial answer engines remain black boxes; cited pages are scraped after the answer.

**Finding:** You.com, Perplexity, and Bing Chat retrieved knowledge for 65%, 63%, and 67% of core subquestions, but answered only 42%, 54%, and 49%. When core information had been retrieved, the share that appeared in the answer was 51%, 71%, and 63%. A separate controlled RAG experiment found retrieval guided by core subquestions beat the baseline in 73.25% of pairwise judgments.

**Why this matters:** this is peer-reviewed evidence for the phenomenon later called **citation absorption**: evidence can be retrieved and still fail to enter the answer.

**Boundary:** it does not observe hidden commercial fan-out queries, and it does not test page rewrites.

#### CiteEval

**Paper/status:** [CiteEval: Principle-Driven Citation Evaluation for Source Attribution](https://aclanthology.org/2025.acl-long.1574/) — ACL 2025, peer-reviewed.

**Stage:** citation-quality measurement.

**What is frozen:** CiteBench's multi-domain source contexts and high-quality human annotations. The experiment compares citation evaluators.

**Finding:** binary NLI support from the cited passage is an incomplete citation-quality proxy. The query, full retrieval context, preceding response, and possible parametric knowledge all affect whether a citation is appropriate.

**Article rationale:** “Does this cited page entail the sentence?” is necessary but not the entire attribution question.

#### Human interaction with answer-engine sources

**Paper/status:** [Search Engines in the AI Era](https://facctconference.org/static/docs/facct2025-206archivalpdfs/facct2025-final493-acmpaginated.pdf) — FAccT 2025, peer-reviewed archival paper.

**Stage:** user verification, source choice, and citation experience.

**What is frozen:** a 90-minute study protocol, a pilot with 3 people, and a final expert-oriented study with 21 participants. Seven participants used each of YouChat, Bing Copilot, or Perplexity; Google served as traditional-search comparison. Live systems and returned sources were not controlled.

**Finding:** answer-engine users hovered about 2 sources and clicked about 1, versus about 12 hovered and 4 clicked in traditional search. All 21 participants encountered or identified source misattribution; 13/21 noticed more sources listed than actually used. Participants verified less when results aligned with their prior view.

**Boundary:** small, expert-oriented sample; useful for mechanisms and failure modes, not population prevalence.

**Article rationale:** citation UI can reduce exploration even when it appears to increase transparency.

#### Source identity versus article content

**Paper/status:** [Media Source Matters More Than Content: Unveiling Political Bias in LLM-Generated Citations](https://aclanthology.org/2025.emnlp-main.872/) — EMNLP 2025, peer-reviewed.

**Stage:** citation choice between supplied candidates.

**What is frozen:** 1,340 queries, 2,680 paired 2024 news passages covering the same event, two supplied candidates, balanced relevance/length, alternating candidate order, and five independent runs. The authors remove or swap outlet names while holding article text fixed.

**Finding:** every evaluated LLM showed a statistically significant left-source citation preference in this U.S. political-news setting. Removing outlet names sharply reduced it; swapping names nearly reversed it. GPT-4o classified political leaning from article content at 63.63% but from outlet name alone at 99.84%.

**Boundary:** this demonstrates **source-label influence after retrieval** in a binary U.S. news setting. It does not establish an open-web brand authority factor or generalize beyond the tested political domain.

#### Within-passage retrieval position

**Paper/status:** [An Empirical Study of Position Bias in Modern Information Retrieval](https://aclanthology.org/2025.findings-emnlp.271/) — Findings of EMNLP 2025, peer-reviewed.

**Stage:** retrieval, before answer generation.

**What is frozen:** position-aware synthetic/controlled benchmarks and the relevant information's location within a passage.

**Finding:** dense and ColBERT-style retrieval degraded by an average 15.6% when relevant information appeared later in a passage; BM25 and full-interaction rerankers were more robust.

**Article rationale:** “position matters” can refer to at least three different things: location inside a page, candidate order in model context, or citation order in the answer. They must not be collapsed.

#### Position effects in realistic noisy RAG

**Paper/status:** [Do RAG Systems Really Suffer From Positional Bias?](https://aclanthology.org/2025.emnlp-main.1422/) — EMNLP 2025, peer-reviewed.

**Stage:** answer generation from a realistic retrieved top-k list.

**What is frozen:** three QA benchmarks, a 2019 Wikipedia corpus, controlled retrievers/rerankers, top-5/top-10 contexts, and tested passage-reordering strategies.

**Finding:** more than 60% of top-10 query contexts contained at least one highly distracting passage. In clean contexts, moving relevant or distracting passages changes accuracy. In realistic retrieved contexts, however, positional effects were marginal because preferred positions can amplify both relevant evidence and hard distractors; sophisticated ordering did not significantly beat random shuffling.

**Conflict resolved:** this does not refute controlled position bias. It shows that its net effect can vanish when realistic retrieval noise is admitted.

### 2026: competition, engine transfer, query breadth, instability, and field outcomes

#### FeatGEO

**Paper/status:** [FeatGEO](https://aclanthology.org/2026.acl-long.929/) — ACL 2026, peer-reviewed.

**Stage:** document use/citation after retrieval.

**What is frozen:** five retrieved pages plus the target page are supplied to each tested engine; upstream retrieval/ranking is explicitly excluded.

**Finding:** document-level, query-aware feature optimization produced large visibility gains across GPT-4o-mini, Gemini 2.5 Flash, and Qwen-plus, while isolated heuristics often had weak, inconsistent, or negative effects.

**Article rationale:** supports holistic, conditional editing over “add one quote” folklore, but only post-retrieval.

#### MAGEO

**Paper/status:** [From Experience to Skill: Multi-Agent Generative Engine Optimization](https://aclanthology.org/2026.findings-acl.2149/) — Findings of ACL 2026, peer-reviewed.

**Stage:** citation/use after retrieval.

**What is frozen:** twin evaluation branches share the same retrieved list; one branch substitutes the optimized target document. This is intentionally a causal post-retrieval design.

**Finding:** learned, engine-aware editing can improve citation presence and role inside fixed retrieval contexts.

**Boundary:** no organic entry effect. The engine-specific learning premise also argues against one universal recipe.

#### Competitive GEO

**Paper/status:** [What Gets Cited: Competitive GEO in AI Answer Engines](https://doi.org/10.1145/3805712.3808445) — SIGIR 2026, peer-reviewed.

**Stage:** first-citation selection between two supplied candidates.

**What is frozen:** exactly two injected candidates, brand anonymization, length matching, a single changed factor per pair, counterbalanced order, 18 factors, six LLMs, and 252,000 repeated trials.

**Finding:** topical relevance and list position were the strongest drivers of being cited first. Explicit price and a recent timestamp also helped consistently; completeness and trust cues were smaller; formatting-only edits had little impact.

**Boundary:** production RAG normally has more candidates and an upstream retriever. Its internal Sprinklr pilot was qualitative workflow feedback, not a traffic experiment.

**Article rationale:** strongest factor-isolation evidence; also the clearest warning that a supplied-candidate win is not discovery.

#### AutoGEO and competitive saturation

**Paper/status:** [What Generative Search Engines Like and How to Optimize Web Content Cooperatively](https://proceedings.iclr.cc/paper_files/paper/2026/hash/dd5dfba659a7ec010414de1c1debdeb4-Abstract-Conference.html) — ICLR 2026, peer-reviewed.

**Stage:** generated-answer visibility under fixed candidates.

**What is frozen:** each query has five candidates retrieved from ClueWeb22; generative engines are constructed with Gemini, GPT, and Claude-family models; test queries and candidates are fixed. This is not Google AI Overview or ChatGPT's live retrieval path.

**Finding:** learned document-level preference rules beat the original GEO heuristics across three datasets and three LLM-based engines. Extracted rule sets overlapped by roughly 79–84% across Gemini/GPT/Claude, although domain- and engine-specific preferences remained. Crucially, when **all** candidates were rewritten with the same AutoGEO rules, the target's relative visibility fell back near the vanilla level while answer-utility measures generally improved.

**Why this matters:** optimization advantage is competitive and saturable. A widely copied tactic can become hygiene rather than a durable edge.

**Boundary:** apparent cross-engine transfer is inside constructed engines over fixed candidate sets.

#### IF-GEO and cross-query conflict

**Paper/status:** [IF-GEO: Conflict-Aware Instruction Fusion for Multi-Query Generative Engine Optimization](https://aclanthology.org/2026.findings-acl.1373/) — Findings of ACL 2026, peer-reviewed.

**Stage:** one document's visibility across a family of supplied queries.

**What is frozen:** source documents originally came from Google's top five for a source query; each is evaluated against a fixed five-query cluster in the GEO simulator. Main engine is GPT-4o-mini; a Gemini 2.0 Flash transfer test changes only the generation model.

**Finding:** query-specific revision requests conflict under a finite content budget. Conflict-aware fusion improved mean visibility and downside-risk metrics. Expanding from one to nine latent queries improved mean performance, but stability gains diminished beyond five while cost grew roughly linearly.

**Boundary:** simulated engine, generated query clusters, fixed top-ranked documents. This is publisher-side query-family modeling, not observation of a provider's hidden query fan-out.

#### Query decomposition as exploration versus noise

**Paper/status:** [Query Decomposition for RAG: Balancing Exploration-Exploitation](https://aclanthology.org/2026.eacl-long.322/) — EACL 2026, peer-reviewed.

**Stage:** subquery choice and document retrieval.

**What is frozen:** benchmark corpora, candidate documents, human relevance judgments, retrieval budget, and downstream long-form generation task.

**Finding:** dynamically selecting which subquery to pursue, using rank information and human relevance estimates, produced a 35% gain in document precision and 15% in alpha-nDCG, with better long-form generation.

**Article rationale:** query fan-out is not “search everything.” It is a budgeted exploration/exploitation problem.

#### Over-searching

**Paper/status:** [Over-Searching in Search-Augmented Large Language Models](https://aclanthology.org/2026.eacl-long.361/) — EACL 2026, peer-reviewed.

**Stage:** search activation, repeated search, and evidence composition.

**What is frozen:** OverSearchQA's answerable/unanswerable queries, retrieval conditions, model categories, and multi-turn tests.

**Finding:** search generally improved answerable queries but harmed abstention on unanswerable ones. Complex reasoning/deep-research systems over-searched more; noisy retrieval and multiple turns compounded the problem. Negative evidence helped abstention.

**Article rationale:** more fan-out, more sources, and more tokens are not monotonically better.

#### Search Arena

**Paper/status:** [Search Arena: Analyzing Search-Augmented LLMs](https://proceedings.iclr.cc/paper_files/paper/2026/hash/4476dd7320e0eba63961990d73525064-Abstract-Conference.html) — ICLR 2026, peer-reviewed.

**Stage:** live search-agent behavior and human preference.

**What is frozen:** none of the live retrieval internals. The released dataset contains more than 24,000 paired multi-turn interactions, full traces, and about 12,000 preference votes.

**Finding:** users were influenced by the number and type of citations even when cited content did not support the claims. Search could help in general-chat settings, while parametric-only models performed poorly in search-heavy settings.

**Article rationale:** citation appearance is a persuasion mechanism as well as an attribution mechanism.

#### DeepTRACE

**Paper/status:** [DeepTRACE: Auditing Deep Research AI Systems for Tracking Reliability Across Citations and Evidence](https://proceedings.iclr.cc/paper_files/paper/2026/hash/ad08767706825033b99122332293033d-Abstract-Conference.html) — ICLR 2026, peer-reviewed.

**Stage:** end-to-end live answer, listed source, factual support, citation, and balance.

**What is frozen:** 303 questions (168 debate, 135 expertise) and an audit timestamp of 2025-08-27. Nine public search/deep-research interfaces generated 2,727 responses. Model versions, retrieval, and UIs remain live black boxes.

**Finding:** citation accuracy ranged widely, roughly 40–80% across systems/configurations. More sources and longer answers did not reliably improve support. Some deep-research systems had more than half of relevant statements unsupported by their own source lists. The paper explicitly separates listed sources, cited sources, necessary sources, supported statements, citation accuracy, and citation thoroughness.

**Measurement caveat:** its LLM judge correlated `0.72` with humans for confidence and `0.62` for factual support on 100 samples per task—useful, but not ground truth.

#### Rational synthesis, repetition, and primacy

**Paper/status:** [Rational Synthesizers or Heuristic Followers? Analyzing LLMs in RAG-based QA](https://aclanthology.org/2026.findings-acl.2003/) — Findings of ACL 2026, peer-reviewed.

**Stage:** answer absorption from conflicting supplied evidence.

**What is frozen:** GroupQA's 1,635 binary controversial questions, 15,058 retrieved documents, document stance/strength, supplied evidence quantity, paraphrase versus independent evidence, and candidate order.

**Finding:** repeated paraphrases of one source changed beliefs more often than independent sources across all tested models; for Gemini 2.5 Flash, flip rate was 75.6% with paraphrases versus 63.7% with distinct evidence. First-presented evidence had a primacy effect; for Llama 3.1 70B, prior-confirming evidence first raised prior retention by 3.5% versus the inverse order. Larger models were generally more resistant to evidence. Explicit reasoning often rationalized rather than corrected the heuristic aggregation.

**Boundary:** no publisher identity metadata, binary questions, controlled contexts. This is an absorption vulnerability, not an ethical recommendation to repeat claims.

#### Live cross-engine instability

**Paper/status:** [Characterizing Web Search in the Age of Generative AI](https://aclanthology.org/2026.findings-acl.526/) — Findings of ACL 2026, peer-reviewed.

**Stage:** live retrieval footprint, synthesis, source overlap, and temporal/run stability.

**What is frozen:** 4,706 English queries across six datasets, U.S./Germany locations, logged-out execution, and September 2025 collection settings. It compares Google organic with AIO, Gemini, GPT-4o Search, GPT-4o with a search tool, and Perplexity Sonar. Commercial backends remain uncontrolled.

**Finding:** systems retrieved radically different numbers of pages—less than one on average for GPT-Tool versus about 14 for Sonar, 9 for AIO/Gemini, and 4 for GPT-Search—yet often achieved similar topical coverage. After roughly two months, only 18% of AIO URLs overlapped, versus 45% for organic search. Even at temperature zero, 9–27% of ternary answer decisions flipped within five minutes; lexical overlap across repeated outputs was low.

**Article rationale:** one prompt screenshot cannot be treated as a stable rank. Repeat runs are part of the measurement, not an optional confidence boost.

## Preprint frontier: useful signals, not settled rules

### Citation selection versus absorption

**Paper/status:** [From Citation Selection to Citation Absorption](https://arxiv.org/abs/2604.25707) — April 2026 preprint.

**Design/freeze:** observational analysis of a public dataset: 602 controlled prompts across ChatGPT, Google AIO/Gemini, and Perplexity; 21,143 citations; 18,151 fetched pages; 72 extracted features. It does not randomly edit pages.

**Finding:** citation breadth and inferred answer influence diverged. Perplexity and Google cited more pages; ChatGPT cited fewer but showed greater average influence among fetched pages. High-influence pages were associated with length, structure, semantic alignment, definitions, numerical facts, comparisons, and procedures.

**Boundary:** feature correlations are confounded. The paper names and operationalizes absorption; it does not causally prove that making a page longer or adding a definition creates influence.

### Answer bubbles and source-selection bias

**Paper/status:** [Answer Bubbles: Information Exposure in AI-Mediated Search](https://arxiv.org/abs/2603.16138) — March 2026 preprint.

**Design/freeze:** 11,000 real search queries across vanilla GPT, Search GPT, Google AIO, and Google Search. Engines are observed, not controlled.

**Finding:** systems exposed structurally different source sets. Wikipedia and longer sources were overrepresented in AI summaries, while social-media and negatively framed sources were underrepresented. Adding search reduced hedging by up to 60% without a comparable reduction in confidence language.

**Boundary:** descriptive selection and summary associations; no page intervention.

### Chinese-language Web/App interface study

**Paper/status:** [What Do Chinese-Language Generative Search Engines Cite and Surface?](https://arxiv.org/abs/2607.15771) — July 2026 preprint.

**Design/freeze:** eight interfaces across four platforms, 614 queries, three replications per query/platform/interface, and 160,860 cleaned citation records.

**Finding:** only 8.3% of brands present in the citation pool were surfaced in answers; 12.4% of cited sources containing contact information contributed contact details. Source sets differed between Web and App interfaces of the same platform. About 13% of brand exposures could not be matched to the contemporaneous citation pool, and about 71% of contact exposures could not be matched to crawled body text.

**Why this matters:** even a contemporaneous citation pool may not fully explain answer content because parametric knowledge, inaccessible content, UI-specific retrieval, or extraction error can intervene.

**Boundary:** observational, Chinese-language ecosystem, platform interfaces not independently controllable.

### Google AIO activation, source pool, and claim fidelity

**Paper/status:** [Measuring Google AI Overviews: Activation, Source Quality, Claim Fidelity, and Publisher Impact](https://arxiv.org/abs/2605.14021) — May 2026 preprint, explicitly under review.

**Design/freeze:** 55,393 trending queries across 19 topics over 40 days, with 98,020 decomposed claims.

**Finding:** AIO activated on 13.7% overall and 64.7% of question-form queries. Nearly 30% of cited domains were absent from co-displayed first-page results. Eleven percent of atomic claims were unsupported by cited pages, mainly through omission.

**Boundary:** a large longitudinal audit, not a publisher-page field experiment. “Outside page one” means source selection differs from the displayed ranking, not that ordinary indexing is irrelevant.

### Pinterest production system

**Paper/status:** [Generative Engine Optimization: A VLM and Agent Framework for Pinterest Acquisition Growth](https://arxiv.org/abs/2602.02961) — February 2026 first-party production preprint.

**Design/freeze:** a bundle of VLM-generated intent annotations, collection-page construction, multimodal retrieval, and authority-aware interlinking. It reports a one-month collection A/B test and four-week annotation/linking experiments at Pinterest scale.

**Finding:** the paper reports an 18% traffic improvement for systematic annotation over unlinked Pins, a further 18% improvement for VLM annotations over an ANN baseline, 9.2x generative-search traffic overrepresentation for VLM-enabled content, and a 20% production traffic lift for the hybrid ANN/two-tower system.

**Boundary:** multiple interventions are bundled; public tables do not expose all sample sizes, confidence intervals, allocation details, or independent replication. The intervention is product/search architecture for a huge visual corpus, not paragraph rewriting.

**Article rationale:** the strongest positive production case looks like building better indexable products and link graphs, not sprinkling GEO phrases into prose.

### Wikipedia natural experiment

**Paper/status:** [Impact of AI Search Summaries on Website Traffic: Evidence from Google AI Overviews and Wikipedia](https://arxiv.org/abs/2602.18455) — February 2026 preprint, revised May 2026.

**Design/freeze:** difference-in-differences over 46.5 million observations and 161,382 matched article-language pairs. English pages were the earlier-exposed treatment proxy; Hindi, Indonesian, Japanese, and Portuguese versions of the same topics were controls.

**Finding:** the preferred levels specification estimates roughly a 15% reduction in English Wikipedia traffic after AIO exposure. Direction is robust, but magnitude changes materially with estimand/specification: about 3.5% in PPML and 8.1% in a traffic-weighted log model. Topic estimates range from about -19.6% for Culture to -7.4% for STEM.

**Boundary:** language is a proxy for geography/exposure, English has global readership, and this is an AIO rollout effect—not a test of being cited or of a publisher edit.

### Observed AIO clicks

**Paper/status:** [Investigating Click Behaviors on Google Search Result Pages That Produce an AI Overview](https://arxiv.org/abs/2608.04831) — August 2026 arXiv extended abstract presented at IC2S2 2026; the available artifact does not establish archival peer-review status.

**Design/freeze:** one month of browsing from a representative panel of 900 U.S. adults: 91,121 Google visits and 68,879 distinct queries. SERPs were recollected later; only the first three highlighted AIO sources were matched as AIO-source clicks.

**Finding:** 18% of searches generated an AIO. About 1% of AIO visits clicked a highlighted source. Other-result clicks were 8% on AIO pages versus 15% without AIO; session ending was 26% versus 16%. Mixed-effects models controlled measured query attributes and user random effects.

**Boundary:** observational, not causal; historical SERP reconstruction and first-three-source matching can miss exposure/click details.

### Preregistered in-situ Google experiment

**Paper/status:** [AI in Search Reduces Publisher Referrals Without Improving User Experience: Experimental Evidence](https://arxiv.org/abs/2608.18352) — submitted 2026-08-18, preprint.

**Design/freeze:** preregistered randomized browser-extension field experiment with 1,100 active searchers. Three days of baseline were followed by seven days assigned to current Google Search, search with AIO/AI Mode hidden, or forced AI Mode.

**Finding:** forced AI Mode reduced external click-through by 18.8 percentage points versus current search. Because a Google markup change broke part of the no-AI intervention, the intent-to-treat removal effect was not significant, but the prespecified compliance-adjusted estimate was +8.8 percentage points for removing AIO/AI Mode. Forced AI Mode also reduced trust, search sessions, and clicks across multiple publisher categories.

**Boundary:** short study, enforced AI Mode was unfamiliar and rarely used at baseline, no publisher content was changed, and the no-AI estimate depends on an instrumental-variable/exclusion assumption after partial intervention failure.

**Article rationale:** the strongest causal referral result to date is about interface substitution, not GEO efficacy.

## Results that replicate

### 1. Retrieval, citation, and answer use are different events

This is now supported through several independent designs:

- NAACL 2025 directly measures retrieved-but-unanswered core subquestions.
- FAccT 2025 users observe “listed but not used” sources.
- DeepTRACE distinguishes listed, cited, necessary, supported, and thoroughly cited sources.
- The Chinese-interface and citation-absorption preprints find large gaps between citation pools and surfaced answer content.

**Confidence:** established as a stage distinction. The best exact absorption metric is still emerging.

### 2. More citations do not guarantee better grounding

- EMNLP 2023 found only partial sentence support and an inverse relationship between citation precision and perceived utility.
- Search Arena found citation count/type influenced preference even without claim support.
- DeepTRACE found more sources and longer answers did not reliably improve support.
- FAccT users clicked fewer sources and often trusted the engine's selection.

**Confidence:** established. “Citations create trust” and “citations justify trust” are separate claims.

### 3. Relevance and substantive document strategy travel better than isolated formatting

- GEO showed some evidence-rich heuristics help inside supplied contexts.
- FeatGEO and AutoGEO found holistic/query-aware document strategies stronger than one-feature heuristics.
- Competitive GEO found topical relevance and list position dominated formatting-only edits.
- IF-GEO found query-specific requests need conflict-aware coordination.

**Confidence:** established post-retrieval. Not established for organic discovery.

### 4. Generated-search measurement is unstable

- Characterizing Web Search measured 18% AIO URL overlap after two months and answer flips within minutes.
- Chinese Web/App interfaces sourced differently even under the same platform brand.
- Competitive GEO needed repeated trials, counterbalanced order, and mixed-effects models to estimate factor effects.
- The Wikipedia traffic estimate ranges from roughly 3.5% to 15% depending on estimand/specification, even though the direction remains negative.
- AttributionBench and DeepTRACE show the evaluator itself adds non-trivial error.

**Confidence:** established. A reproducible GEO report needs query, locale, interface, date, model/surface, repetitions, raw outputs, and metric definition.

## Results that appear to conflict—and why

### Position is powerful / position is marginal

Both are true under different freezes.

- Competitive GEO, GroupQA, and clean lost-in-the-middle designs hold content quality or distractors fixed and vary order. They identify real primacy and context-position effects.
- The realistic RAG study admits retrieved hard distractors. Preferred positions amplify good and bad passages, so reordering's average benefit disappears.
- The IR position paper studies relevant information **inside a passage**, a different stage again.

**Reconciled claim:** position can be causally important in controlled context, but “put the answer first and citations rise” is not a stable production law.

### Cross-engine transfer works / engines are different

- FeatGEO and AutoGEO show one learned strategy family can improve visibility across several LLM-based fixed-candidate engines.
- AutoGEO also finds 79–84% overlap in extracted rules.
- MAGEO learns engine-specific strategies; IF-GEO's transfer covers only one additional simulator model.
- The live-system audit finds radically different search footprints, source categories, and stability.

**Reconciled claim:** broad quality/relevance principles can transfer inside controlled pipelines; effect sizes and exact preferences do not establish a universal live-web rewrite.

### More fan-out improves coverage / more search harms quality

- Sub-question coverage, adaptive query decomposition, and IF-GEO show that well-chosen query breadth can improve core coverage and cross-query robustness.
- Over-Searching shows unnecessary/noisy retrieval harms abstention and compounds across turns.
- The live-system audit finds more retrieved pages often do not produce more topical coverage.

**Reconciled claim:** the useful variable is not query count. It is marginal relevant coverage under a noise and cost budget.

### Quotations/statistics/citations work / formatting-only changes do little

- GEO and IF-GEO report gains for evidence-enrichment strategies in some fixed contexts.
- FeatGEO finds isolated heuristics often fail.
- Competitive GEO's single-factor trials find formatting small relative to relevance, position, price, and freshness.
- AutoGEO's holistic rewrites outperform the hand-authored heuristics, but global adoption erases relative advantage.

**Reconciled claim:** real evidence can make a page more useful and quotable after retrieval; the visible wrapper around evidence is not a portable ranking spell.

## Advice classification as of 2026-08-25

### Established enough to act on

1. **Name the stage before naming the metric.** Retrieval, citation, support, absorption, click, and conversion require different instruments.
2. **Preserve ordinary eligibility and relevance.** Controlled GEO papers mostly begin after this gate; none shows a machine-only file bypassing it.
3. **Write claims that a source can actually support.** Correct attribution, explicit evidence, and semantic relevance remain useful across engines even when visibility effects vary.
4. **Measure repeated queries, not screenshots.** Freeze query variants, locale, surface, date, and repetition count; preserve raw outputs.
5. **Audit citation correctness as well as presence.** A citation can be misplaced, unnecessary, incomplete, or unrelated.
6. **Prefer real informational coverage to decorative formatting.** Holistic, query-relevant material survives the evidence better than generic stylistic tactics.
7. **Treat retrieval breadth as a precision/noise tradeoff.** Expand around core subquestions; stop when marginal retrieval becomes noisy or redundant.
8. **Measure referrals separately from citations.** The field evidence suggests answer surfaces can reduce clicks even when publishers supply the source material.

### Emerging and worth testing

1. **Topic/query-family coverage instead of one exact prompt.** IF-GEO and RAG decomposition support the idea, but hidden provider fan-out remains unobserved.
2. **Engine/interface-specific measurement.** Live systems differ enough that one cross-platform score hides useful variation.
3. **Absorption metrics.** Track whether distinctive facts, definitions, procedures, or comparisons appear in the answer, not only whether the URL appears.
4. **Source identity audits.** Publisher labels clearly affect controlled citation decisions in political news; test rather than assume the effect in other domains.
5. **Product and corpus architecture.** Pinterest's production preprint suggests indexable collections, intent-aligned representations, and internal link graphs may matter at platform scale.
6. **Competitive saturation tests.** If all candidates adopt a tactic, does it still differentiate, or merely improve baseline answer quality?

### Speculative or unsupported

1. A universal percentage lift from adding quotations, statistics, FAQs, or citations.
2. A claim that `llms.txt`, Markdown, JSON-LD, or special schema independently improves organic AI-search selection.
3. A claim that a provider's hidden query fan-out can be reverse-engineered from one answer.
4. A claim that citation count equals answer influence, traffic, audience, or revenue.
5. A claim that one engine's winning rewrite transfers unchanged to every engine and interface.
6. A claim that first position is always best in a noisy production context.
7. Publishing a page for every guessed latent query.
8. Repeating/paraphrasing the same claim to exploit absorption bias. The GroupQA result describes a reliability vulnerability, not a legitimate editorial strategy.

## Constructive measurement protocol for the blog

This is the smallest design consistent with the frontier:

| Stage | Unit | Minimum observation | Failure condition |
|---|---|---|---|
| Eligibility | URL | Indexed/eligible state, canonical, fetch status | Page cannot enter retrieval |
| Search activation | query-run | Whether external search was used | No retrieval occurred |
| Selection | URL/query-run | Page/domain appeared in cited or exposed pool | Page absent from pool |
| Citation | URL/query-run | URL cited; first/other position | Presence without support |
| Absorption | claim/query-run | Distinctive page facts or language appear and are traceable | Cited page contributes nothing identifiable |
| Fidelity | claim/source pair | Entailment/support plus human spot-check | Citation does not support claim |
| Referral | visit | Human click with surface referrer where available | Citation produces no visit |
| Outcome | visit/session | Engaged read, subscriber, return visit, or chosen goal | Traffic without durable audience value |

Protocol constraints:

- use a small frozen set of real reader questions plus paraphrases;
- run each query multiple times on each named interface;
- keep locale/account state and collection window fixed;
- archive answer text, links, order, and timestamps;
- manually verify a sample of citation-support judgments;
- report denominators and zeroes;
- never infer one stage from another;
- wait through a defined observation window before changing the page again.

## Article-ready distilled insights

These are safe to turn into prose without importing the entire literature review.

1. **GEO is not one ranking.** It is a partially observable route from search activation to retrieval, citation, answer use, and possible referral.
2. **The largest missing metric is absorption.** A system can retrieve a page, cite it, and still use little or none of what made the page valuable.
3. **Query fan-out is a system design tradeoff, not a content calendar.** More subqueries can improve coverage until noise, redundancy, and cost take over.
4. **Citations are both evidence and theater.** They can increase perceived credibility even when they fail to support the sentence.
5. **The strongest controlled levers are relevance and candidate context.** Formatting is usually smaller and more conditional.
6. **A GEO tactic can erase its own advantage.** AutoGEO's global-adoption test returned relative visibility to baseline even while overall answer utility improved.
7. **Position effects are real but conditional.** In a clean two-source experiment, order matters; in noisy retrieval, a favored slot may amplify a distractor.
8. **Brand can affect citation after retrieval.** The best causal evidence comes from swapping news outlet labels, not from open-web brand rankings.
9. **One answer is not a measurement.** Live systems change sources and even answer polarity across runs and time.
10. **The first causal field evidence is uncomfortable for publishers.** Answer surfaces can reduce outbound clicks, but no field experiment yet shows which publisher-side GEO edit wins them back.
11. **The most credible production success is architectural.** Pinterest reports gains from intent modeling, collection pages, multimodal representations, and interlinking—a product intervention, not an engagement-farming prose template.
12. **Good writing remains the non-fake strategy.** Original evidence, clear support, real comparisons, and honest scope help readers and can help models after retrieval. They are worth doing even if the citation lift is zero.

## Cross-references to the existing research folder

- [`00-research-scratchpad.md`](./00-research-scratchpad.md): its selection/use distinction is supported by the NAACL coverage study, DeepTRACE, and the 2026 absorption preprint. Keep its bounded `llms.txt` thesis.
- [`04-thesis-red-team.md`](./04-thesis-red-team.md): the frontier strengthens its warning against inferring discovery from supplied-context GEO experiments.
- [`05-benchmark-question-set.md`](./05-benchmark-question-set.md): add repeated runs and an absorption/fidelity annotation if a future visibility watch is executed; do not retrofit outcomes after seeing them.
- [`08c-green-team-editorial-opportunity.md`](./08c-green-team-editorial-opportunity.md): the positive opportunity is now stronger—build uniquely useful evidence and measurement, not merely a skeptical rebuttal.
- [`11a-final-draft-fact-check.md`](./11a-final-draft-fact-check.md): update the status of Competitive GEO to peer-reviewed SIGIR 2026 and Search Engines in the AI Era to archival FAccT 2025 if either is mentioned as a preprint.
- [`12d-geo-frontier-main-agent-notes.md`](./12d-geo-frontier-main-agent-notes.md): this artifact supplies the academic evidence beneath its provider/frontier synthesis. Keep provider documentation and academic experiments in separate evidence lanes.

## Update triggers

Revisit this map when any of the following appears:

1. a preregistered open-web page intervention that changes one publisher feature while freezing queries, pages, and other site changes;
2. provider telemetry that exposes both candidate selection and answer-level use, not only citation count;
3. an independently replicated Pinterest-style production experiment with disclosed allocation and confidence intervals;
4. a peer-reviewed validation of absorption metrics against human traceability judgments;
5. a multi-engine longitudinal study that reruns the same intervention through provider model/index updates;
6. a causal test of `llms.txt`, Markdown, schema, or other machine-facing artifacts on organic retrieval;
7. a field experiment connecting a publisher intervention to human referral and durable readership.

Until one of those triggers fires, the honest conclusion is not that GEO is fake. It is that most causal GEO evidence begins after discovery, while the outcome publishers care about lies several uncertain stages later.

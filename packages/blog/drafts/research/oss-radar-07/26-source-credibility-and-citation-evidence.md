# Source credibility and citation evidence

Research cutoff: **September 11, 2026**. This is a targeted primary-source review for the rewritten OSS Radar #07, not an exhaustive survey. The strongest sources are Wallat et al. on citation faithfulness, Khan et al. on source selection, and Google's current publisher guidance. Earlier repository research supplied leads; the original papers and documentation were checked again. All study results below are **Reported: primary paper inspected, experiments not rerun**. No model calls were made.

## The useful distinction

A citation helps a reader check an answer. Establishing that the model relied on that source takes a different test. For an engineering publisher, the practical ambition is to make a claim easy to inspect and reuse, then measure whether systems actually find it and represent it correctly.

Keep these questions separate when describing a result:

| Question | Evidence that addresses it |
| --- | --- |
| Can the system access and find the page? | Access checks and retrieval observations, with the system and conditions identified. |
| Does the system choose or cite it? | Captured selections or answers, including the alternatives available. |
| Does the cited passage support the claim? | A claim-to-passage check that preserves qualifications, dates, and versions. |
| Did this source influence the generated claim? | A causal experiment or suitably scoped attribution method. A supportive passage alone does not answer this. |

These are different measurements, not four synonyms for trust. A source can be useful for verification even when causal provenance is unknown.

## Claim table and source rationale

| Claim | Primary evidence and location | State and boundary | Publisher implication |
| --- | --- | --- | --- |
| Citation correctness and causal faithfulness are distinct. | **Wallat et al., ICTIR, July 18, 2025**, [final author PDF](https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf), §4–5, PDF pp. 6–8; [DOI](https://doi.org/10.1145/3731120.3744592). Their definition asks both whether a source supports the claim and whether it causally affects it. | Reported. This paper was selected because it defines the distinction and tests a necessary condition, rather than treating a displayed citation as proof of reliance. | Publish a checkable passage and its evidence. Describe a captured citation as a citation; reserve claims of causal influence for a suitable test. |
| A short matching phrase can induce an additional citation without supplying the complete claim. | Wallat's final **Figure 6, PDF p. 8**, reports the perturbation counts reproduced below. Setup: 1,444 Natural Questions; Command-R+ 104B at 4-bit; KILT Wikipedia; BM25 top 30, ColBERTv2 reranking, five supplied passages. | Reported. One model and a deliberately adversarial test; changed-answer cases were excluded. The final paper's Figure 7 adds recovery checks, but the authors acknowledge generation instability and possible hints from the inserted phrase. This is evidence of a failure mode, not a measurement of all current citations. | Preserve the full proposition, including its conditions. A repeated name or number near a citation is weaker evidence than support for the actual claim. |
| Source identity can change model selection while supplied content is held constant. | **Khan et al., ICLR 2026**, [author PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf), §2–4, pp. 3–7. Twelve models; news, research, and commerce tasks. The research set takes ten venues from each of five fields. Indirect tests use semantically identical paired content with different source labels and controlled order. | Reported. Selected because its controlled design isolates source identity. These are selections among supplied candidates, not organic search rankings or a field test of engineering blogs. The evaluated model set includes GPT-4.1 Mini/Nano and 2024–2025 open models, not every September 2026 agent. | Source reputation may affect selection. This does not tell a small publisher how to manufacture that reputation or establish that adding a biography changes citation rates. |
| Basic search access still matters for Google's AI search features. | **Google Search Central, checked September 11, 2026**, [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features), technical requirements and best practices. Supporting links must be indexed and eligible for a Search snippet; no additional AI file or special schema is required. | Reported provider guidance. Selected because Google can state its own eligibility requirements. Eligibility does not guarantee crawling, indexing, serving, or citation; this guidance is not a controlled ranking study. | Check crawler/CDN access, internal links, readable text, and consistent visible content and metadata. These are concrete publishing tasks with a documented purpose. |
| Authorship and methods are useful context, without constituting a ranking formula. | **Google Search Central**, [helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), “Who, How, and Why” and E-E-A-T sections; page dated December 10, 2025, checked September 11, 2026. | Reported guidance. It recommends original work, clear sourcing, accurate authorship, and methods. It explicitly says E-E-A-T is not itself a specific ranking factor. | State what was built, tested, or observed; identify who did it and how. No verified effect here establishes a first-person pronoun, biography, citation count, or schema as an independent trust or ranking boost. |

### The denominator behind Wallat's “up to 57%”

The intervention appended a short statement from an earlier answer to another document, then regenerated the answer. The denominator for the reported rate contains only cases where the original statement appeared again. Counts were checked in the final published paper's Figure 6, including a visual inspection of PDF page 8.

| Modified document | Perturbation cases | Original statement recovered | Modified document newly cited for that statement | Conditional rate, calculated from figure |
| --- | ---: | ---: | ---: | ---: |
| Random document | 1,344 | 936 | 116 | 12.4% |
| Relevant but previously uncited | 702 | 476 | 273 | 57.4% |
| Previously cited for another statement | 829 | 525 | 290 | 55.2% |

**Safe use:** “In one adversarial Command-R+ test, 273 of 476 answers that preserved the original statement cited the altered, previously uncited document.” Keep the 702 attempted cases nearby. Do not turn this into “57% of AI citations are fake.” The experiment also cannot identify the causal origin of every answer from its final text alone.

### A second numerical result, if the article needs it

Khan's more realistic AllSides experiment uses **3,855 events**, each with three supplied articles. In Figure 6, p. 7, GPT-4.1 Mini selects right-leaning article content **19.9%** of the time with source identities hidden, **4.9%** with identities shown, and **31.1%** when left/right source labels are swapped. These are selection rates within one study, not factual-accuracy scores. Appendix F.4.1 describes the sample; §4 describes six source-label conditions and balancing article order. The paper does not give a raw valid-output denominator beside each plotted percentage, so do not reverse-engineer integer counts. This result is optional: its news setting may distract from the engineering question. [Primary paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf)

## What a publisher can improve now

The following is **editorial and engineering judgment informed by the evidence above**, not an estimated ranking effect:

1. Put the result, denominator, date/version, and material limitation together. A reader should be able to tell whether a statement concerns a synthetic fixture, a public benchmark, or production use without opening an evidence ledger.
2. Link the particular source that can establish the claim: the relevant implementation for behavior, the experiment for a measured outcome, the provider for its stated policy. A famous domain or a long bibliography does not substitute for that match.
3. Keep inspectable artifacts behind consequential claims: commands, configuration, captured results, and a bounded account of what ran. Make the prose useful before asking a reader to inspect them.
4. Use accurate bylines, source dates, corrections, and clearly described firsthand work. These help a reader assess the basis of knowledge; no source reviewed here supplies a causal effect size for doing this on an engineering blog.
5. Measure discovery, citation, support, and referrals separately. Higher citation frequency can be interesting even before its cause is known; it should not silently become a claim of greater accuracy or causal influence.

The defensible bet is that better evidence makes this publication more useful to verify and reuse. Whether that also earns more organic AI citations remains an empirical question.

## Two proposed, falsifiable bets

**Bet 1: keeping conditions beside a result reduces wrong generalizations.** Use 30 version-sensitive engineering claims from existing articles. Prepare two views containing the same facts and source identity: the current presentation and one placing the method, denominator, version, and limitation beside the result. Hold the supplied candidate set fixed, counterbalance order, and include unchanged repeat runs to estimate ordinary variation. Before running, freeze the questions, model versions, scoring rubric, repetition count, and a practical target: a ten-percentage-point gain in answers that preserve both the result and its scope. Score blindly against the artifacts; count omissions, failures, and unsupported generalizations. A confidence interval whose upper bound is below that target rejects the proposed benefit for this fixture; an inconclusive interval stays inconclusive. This tests reuse after retrieval, not organic discovery. **Proposed; not run.**

**Bet 2: precise current evidence can outweigh source identity in engineering decisions.** Construct cases where a dated general source conflicts with a current, inspectable implementation result. In an offline study, vary source identity cues and evidence availability independently, with labels clearly designated experimental and never published as real attribution. Keep content, order, and length controlled within each comparison; retain unchanged-label repeats. The prediction is that providing the verifiable result reduces decisions that follow the familiar source into a version error. Predeclare correct version-specific choice as the primary outcome, and citation frequency as secondary. Reject the target if the upper confidence bound rules out the preregistered improvement; report uncertainty otherwise. A citation increase without better decisions does not satisfy the bet. This extends Khan's selection question to the publisher's actual engineering problem. **Proposed; not run.**

## Boundaries checked, without expanding the article's cast

- **GEO, KDD 2024:** its Perplexity experiment supplied source text as uploaded files and required answers from those files, across **200 test samples**. It can inform experiments on how supplied content is used; it does not establish that adding statistics, quotations, `llms.txt`, or markup makes a page organically retrievable. [Primary paper, Appendix C.1](https://arxiv.org/html/2311.09735v3)
- **Vykopal et al., EACL 2026:** the tempting GPT-5 thinking/non-thinking credibility comparison is observational. The UI automatically selected thinking for **58 of 600 conversations**; Table 3 reports domain-label credibility scores of 85.78% versus 69.83%. That is not a randomized effect of turning reasoning on. Its misinformation-focused tasks and domain-label metric also differ from engineering claim support. Excluded as an agentic-improvement headline. [Primary paper, §4.2 and Table 3, p. 2544](https://aclanthology.org/2026.eacl-long.115.pdf)
- DeepTRACE and the generation/evaluator implementations are covered by other research tracks. No claim here compares old search, current agents, and deep research across incompatible benchmarks.

## Inspection receipt

Public PDFs were downloaded and extracted locally with `pdftotext`; selected figures were rendered with Poppler. No source experiments or implementation tests were rerun. PDF copies remain outside the repository. The final Wallat publication was used instead of relying on its December 2024 preprint. Source content is committed to the following SHA-256 hashes; these identify the inspected copies, not independent validation of the authors' experiments.

| Inspected source | Bytes | SHA-256 |
| --- | ---: | --- |
| Wallat, final ICTIR 2025 author PDF | 584,111 | `6ff6443dbba95a63217b25916dd392fbe4392a7ce9f30ab7ed56312cd8e590ae` |
| Khan, ICLR 2026 author PDF | 4,396,056 | `1edfe3eec142a1e12fcf45d8df8ad046373c69a854eab899298bf48f0b1fc05f` |
| Vykopal, EACL 2026 proceedings PDF | 3,580,147 | `966700c0d1c158d91ae0da1273742f7f80b0137417c68e9e5abe1422d26b2ca4` |

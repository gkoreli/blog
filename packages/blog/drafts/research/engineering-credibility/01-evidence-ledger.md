# Credibility evidence ledger

Review: September 6, 2026 Pacific / September 7 UTC. Primary sources were inspected through their full text or the specific documented section unless a narrower access status is stated. Interpretations below are ours. This ledger does not report new experiments conducted by the blog.

## Human judgment and the basis for belief

### H1. Testimonial evaluation, 2010

[Sperber et al., *Epistemic Vigilance*, Mind & Language 25(4)](https://www.dan.sperber.fr/wp-content/uploads/2010_clement-et-al_epistemic-vigilance.pdf), especially the discussion of competence, honesty, and context around manuscript pages 10–12. This is a theoretical synthesis, not a first-person-title experiment. It describes evaluating communicators and communicated content, with costly assessment sometimes replaced by shortcuts.

**Decision:** explain firsthand ownership as relevant access and attribution. The hypothesis that this increases trust in our title remains untested; competence in one domain does not transfer automatically to another.

### H2. Website presentation and perceived credibility, 2002

[Fogg et al., *How Do People Evaluate a Web Site's Credibility?*](https://credibility.stanford.edu/pdf/How_Do_People_Evaluate_a_Web_Site%27s_Credibility_v37.pdf), report abstract and table 3, printed page 23. The study recruited **2,684 participants**. Design appearance appeared in **46.1% of 2,440 coded comments** about credibility judgments.

**Boundary:** 46.1% is a share of comments mentioning a category. It is not the fraction of credibility caused by design, a conversion lift, or an estimate for engineers in 2026. This historical report concerns perceived credibility during prompted site evaluations.

**Decision:** readable presentation matters to evaluation, but an attractive page is not validation of its claims. Do not turn this percentage into a design prescription.

### H3. Checking outside the site, published 2019

[Wineburg and McGrew, *Lateral Reading and the Nature of Expertise*, author manuscript](https://stacks.stanford.edu/file/druid:yk133ht8603/Wineburg%20McGrew_Lateral%20Reading%20and%20the%20Nature%20of%20Expertise.pdf), linked by the authors' [research group](https://www.inquirygroup.org/publications/research-articles). Full manuscript retrieved by curl after the browser fetch timed out.

The study compared **10 professional fact checkers, 10 PhD historians, and 25 Stanford undergraduates** using think-aloud evaluations of social/political web information. Fact checkers investigated external context; other participants often relied on manipulable surface features. Small, selected groups limit generalization, and group comparisons do not isolate a causal intervention.

**Decision:** make methods and authorship inspectable; seek independent corroboration where the claim requires it. A blog linking its own repository is useful provenance, not two independent sources.

### H4. Communicating uncertainty, 2020

[van der Bles et al., *The effects of communicating uncertainty on public trust in facts and numbers*, PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC7149229/). **Five experiments, N = 5,780**: four online experiments with 4,249 participants and a BBC field experiment with 1,531.

Numerical uncertainty ranges generally produced little loss of trust in the source; verbal uncertainty sometimes reduced it. Outcomes and formulations differed across experiments.

**Decision:** retain relevant limits instead of suppressing them on the assumption that all uncertainty destroys credibility. Do not claim that disclosure always increases trust, or apply these results as an engineering-blog effect size.

### H5. Concrete wording: original finding and counterevidence

[Hansen and Wänke, 2010, original abstract](https://pubmed.ncbi.nlm.nih.gov/20947772/) reported greater judged truth for concrete formulations. The freely accessible [preregistered replication and extension, Collabra: Psychology, 2019](https://online.ucpress.edu/collabra/article/5/1/19/112979/The-Effect-of-Concrete-Wording-on-Truth-Judgements) analyzed **466 participants across two studies**, compared with **46 in the original study being replicated**. Its results did not reproduce that simple effect.

**Decision:** reject a general rule that concrete wording makes people believe us. Concrete methods, units, and results remain useful because they specify a checkable claim. The replication does not prove wording never matters in any context.

## Model behavior and generative search

### M1. Controlled source preferences, ICLR 2026

[Khan et al., *In Agents We Trust, But Who Do Agents Trust? Latent Source Preferences Steer LLM Generations*](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf), methods, experiments, and limitations. **12 LLMs from six providers**, across news, research-paper, and seller choices. Controlled content with different source attribution revealed preferences that could override content signals; instructions to disregard source identities often did not remove them.

**Boundary:** candidate-choice tasks, not an engineering-blog crawl or first-person-title trial. Tested models include GPT-4.1 mini/nano and several smaller open-weight families; the publication year does not make this a census of September 2026 agents.

**Decision:** evaluate source-cue sensitivity separately from evidence quality. Similar-looking human and model behavior does not establish the same underlying psychology.

### M2. Authority metadata, September 2026 preprint

[*Authority Bias in Conversational Search Engines for Academic Paper Recommendation*, arXiv v1](https://arxiv.org/html/2609.00248v1), methods, table 3, and appendix A.4. The design planned **18,000 runs** across eight models; **17,898 parsed**. Metadata swaps coincided with **2,328/5,940 paired recommendation changes (39.2%)**; only **40.9% of those flips** favored higher composite authority.

**Methodological concern (our inference):** cells used provider-default stochastic sampling. We did not identify an unchanged-metadata repeat baseline in the inspected method. Thus the reported flip rate should not be treated as a clean causal effect of authority above ordinary answer variation. The paper is a recent preprint, and we have not replicated it.

**Decision:** include repeated identical conditions and order controls in our own pilot. Do not promote 39.2% into a website-credibility rule or imply every flip favored prestige.

### M3. Citation presence and support, 2023

[Liu, Zhang, and Liang, *Evaluating Verifiability in Generative Search Engines*, Findings of EMNLP 2023](https://aclanthology.org/2023.findings-emnlp.467/), primary paper abstract. Four historical systems were audited. The reported aggregate was **51.5% of generated sentences fully supported by citations**, and **74.5% of citations supporting their associated sentence**.

**Boundary:** these are historical systems and evaluation definitions, not current failure rates. This review uses the verified abstract's aggregate findings, not uninspected subgroup results.

**Decision:** measure claim support and citation presence separately. A visible source link cannot itself establish that an answer used evidence correctly.

### M4. GEO is primarily a test after retrieval, 2024

[Aggarwal et al., *GEO: Generative Engine Optimization*, KDD 2024 / arXiv v3](https://arxiv.org/html/2311.09735v3), sections 3.1 and C.1. The main setup used Google's **top five sources** and GPT-3.5-turbo answer generation. The Perplexity experiment supplied source text as uploaded files for **200 test samples**, restricting answers to those files.

**Decision:** evidence additions can affect generated use under particular supplied-source conditions. That does not show how an unknown blog enters the candidate set. Retire the AGENTS synopsis that treated honesty mechanics as a general AEO strategy; keep honest evidence on its own merits.

## Provider documentation, checked September 2026

| ID / primary source | What the documentation supports | Boundary and editorial consequence |
|---|---|---|
| P1. [Google: helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | Clear authorship, original information, firsthand experience, and explaining how work was produced are recommended. Google says E-E-A-T is not a specific ranking factor. | State these as provider guidance. It gives neither a pronoun advantage nor a disclosed universal credibility score. |
| P2. [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) | Search eligibility and ordinary technical requirements apply; no extra schema or AI-specific text file is required. | Eligibility is not guaranteed selection or citation. Do not claim extra markup proves trust. |
| P3. [OpenAI: crawler and fetcher roles](https://developers.openai.com/api/docs/bots) | OAI-SearchBot serves search discovery; GPTBot concerns potential training; ChatGPT-User handles certain user actions and does not determine Search inclusion. | These are documented roles, not verified identity for an arbitrary matching UA. A server request does not reveal whether content was relied on. |
| P4. [Perplexity: source labels](https://www.perplexity.ai/help-center/en/articles/20260806-understanding-source-labels), updated August 7, 2026 | Its documented domain-review questions include corrections, named authors, and distinguishing news from advertising/opinion. | Labels concern domains, not individual claim accuracy. Perplexity says no label is not a negative judgment and a label is not an endorsement. This is not a measured ranking intervention. |
| P5. [Bing Webmaster Tools: AI Performance](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c) | Reports visible citations and cited pages. The documentation distinguishes these from authority, ranking, and importance. | Useful for observing attribution, not an objective truth score. The search-indexed primary page text was accessible; its direct rendered fetch returned no substantive body. No account dashboard was inspected. |
| P6. [Google: title links](https://developers.google.com/search/docs/appearance/title-link) | Titles may be generated from the title element, main visual title, headings, anchors, and other sources. Accurate, concise, consistent text is recommended. | Replace anthropomorphic claims about Google distrusting titles and guarantees that matching H1 prevents rewriting. |

## Claims this review does not establish

- First-person titles increase trust, clicks, rankings, or AI citations for engineering articles.
- Firsthand experience is always better evidence than independent measurement or relevant research.
- Famous authors, formal prose, many citations, or large token totals establish truth.
- All bots and agents apply one credibility algorithm, or model explanations reveal its internal mechanism.
- Any listed historical percentage describes today's blog audience or current frontier systems.

Additional leads on political personal experience and linguistic-register effects were screened but are not necessary to the adopted rules. We do not generalize political respect into engineering accuracy or prompted deference into organic search performance. The next evidence needed is a [controlled pilot on this blog's actual claims](02-experiments.md).

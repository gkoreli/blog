# GEO Frontier — Main-Agent Research Notes

**Cutoff:** 2026-08-25  
**Purpose:** Expand the article beyond `llms.txt` with current provider behavior, new research, established patterns, and emerging trends.  
**Rule:** A recent source is not automatically strong evidence. Every item below states what it observes, what it cannot establish, and why it belongs in the article.

## Working vocabulary

There is no common web protocol called GEO or AEO. The terms overlap and different providers use them differently.

- **SEO** is the established practice around crawl/index eligibility, relevance, ranking, result presentation, and search traffic.
- **AEO** is commonly used for visibility or direct answers in answer surfaces. It has no single provider-defined measurement contract.
- **GEO** is commonly used for whether and how a source is selected, cited, represented, or absorbed into a generated answer.

For engineering decisions, stage names are more useful than acronym debates: search activation, crawling/indexing, retrieval, reranking/context allocation, citation selection, answer absorption/fidelity, referral, and downstream outcome.

**Rationale:** The article already separates six stages. The July 2026 critical survey independently argues for a longer partially observable pipeline. This makes the stage model a current research-aligned abstraction rather than a private taxonomy.

## Evidence hierarchy for this expansion

1. **Provider implementation and telemetry documentation** — strongest evidence for what that provider exposes or requires; weaker as causal optimization proof.
2. **Controlled peer-reviewed studies** — strongest for the stage they isolate; cannot travel into organic discovery when they freeze candidates or retrieval.
3. **Transparent production experiments** — potentially strong for that product, corpus, and intervention; attribution and external validity must be inspected.
4. **Cross-platform observational datasets and preprints** — useful for new measurement concepts and hypotheses; not yet durable rules.
5. **Vendor/practitioner recommendations** — workflow clues only unless methods and counterfactuals are public.

## Provider frontier

### Google: ordinary Search remains the eligibility layer

[Google's July 2026 guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) says there is no special schema, AI text file, Markdown requirement, or machine-only optimization required for its generative Search features. A page must still be indexed and eligible for a snippet. Google also warns against creating many pages around guessed fan-out query variants to manipulate generative answers.

Google documents query fan-out in AI Overviews and AI Mode: one user question may trigger multiple related searches across subtopics and data sources. The publisher consequence is not “manufacture one page per hidden query.” It is to cover a real information need with original, internally connected material that can satisfy multiple subquestions.

Google's advice extends beyond prose when the entity warrants it:

- Merchant Center feeds and Google Business Profiles for product/local facts;
- accurate images and video that support the same subject;
- structured data only for its supported ordinary Search use cases, not special GEO markup.

**Evidence state:** explicit provider guidance.  
**Cannot establish:** that each recommended practice independently raises AI citations.  
**Article rationale:** establishes the current production path and prevents the article from treating text formatting as the whole of GEO.

### Google: visibility reporting became more specific in June 2026

[Search Console's Generative AI performance reports](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) began rolling out to a subset of sites in June. They report impressions, pages, countries, devices, and dates for generative AI features in Search and Discover. They do not currently document citation counts or grounding-query phrases.

Google also brought Preferred Sources into AI Overviews and AI Mode in 2026 and added publisher-facing source/subscription affordances. This is a new direction where an existing audience's explicit source preference can influence visibility. It is not a generic ranking factor or proof that a publisher can manufacture preference.

**Evidence state:** shipped provider product and limited rollout.  
**Article rationale:** the latest measurement trend is moving from blended Search traffic toward surface-specific visibility, while user source preference makes genuine audience loyalty more—not less—important.

### Bing: citation telemetry is now a distinct publisher surface

[Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) reports total citations, average cited pages, page-level activity, sampled grounding-query phrases, and trends across Microsoft Copilot, Bing AI summaries, and selected partners.

Bing explicitly says the aggregates do not show placement, authority, ranking, or a page's role in a specific answer. Its recommendations—depth, clarity, evidence, freshness, consistent entities across formats, IndexNow, and Bing Places—are operating guidance, not controlled causal effects.

**Evidence state:** first-party telemetry contract and provider recommendations.  
**Article rationale:** supplies the cleanest current example of citation selection reporting while preserving the gap between citation and answer influence.

### OpenAI: eligibility and referral are documented; GEO telemetry is not

[OpenAI's publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq), updated in August 2026, says public sites can appear in ChatGPT search and tells publishers not to block `OAI-SearchBot` if they want summaries/snippets. It distinguishes `noindex` from crawling permission and tells publishers to track ChatGPT referral traffic in ordinary analytics.

OpenAI documents search, training, and user-directed bots separately. It does not expose a Search Console-style publisher dashboard for prompt, citation, or absorption data in the reviewed guidance.

**Evidence state:** explicit inclusion/control/referral guidance; telemetry silence.  
**Article rationale:** demonstrates why crawler eligibility, citation, and human referral need different instruments.

## Research frontier

### GEO is now modeled as a stochastic pipeline, not one rank

The July 2026 preprint [Critical Survey of GEO (2023–2026)](https://arxiv.org/abs/2607.14035) reviews 45 studies and argues that GEO spans search activation, crawling/indexing, retrieval, reranking/context allocation, citation, prominence, absorption/fidelity, and user behavior. It reports topical relevance and context position as the most reproducible levers, weak transfer from generic heuristics, competition between optimized sources, run-to-run variability, and no reviewed stable longitudinal cross-platform causal effect on organic discovery or downstream behavior.

**Evidence state:** recent survey preprint, not a new causal experiment or peer-reviewed consensus.  
**Article rationale:** useful frontier synthesis and evidence hierarchy; should be labeled preprint and used to frame uncertainty, not close the question.

### Citation selection and citation absorption are different outcomes

The April 2026 preprint [From Citation Selection to Citation Absorption](https://arxiv.org/abs/2604.25707) studies a public dataset with 602 controlled prompts across ChatGPT, Google AI Overview/Gemini, and Perplexity. It distinguishes being cited from how much the page's language, evidence, structure, or facts contribute to the answer. Its descriptive result suggests citation breadth and answer influence diverge across platforms.

**Evidence state:** observational cross-platform preprint; associations, not causal editing effects.  
**Article rationale:** adds a missing metric between citation count and referral. A publisher can be cited without materially informing the answer, or influence an answer more deeply through fewer citations.

### Peer-reviewed 2026 work favors topic/document strategy over a portable formatting checklist

- [FeatGEO, ACL 2026](https://aclanthology.org/2026.acl-long.929/) optimizes document-level features across supplied candidates and reports stronger results than token-level rewriting. It still excludes upstream organic retrieval.
- [MAGEO, ACL Findings 2026](https://aclanthology.org/2026.findings-acl.2149/) learns engine-specific editing strategies and freezes retrieval to attribute content effects. Engine-specific preferences argue against one cross-platform recipe.
- [Mind Reader, ACL 2026](https://aclanthology.org/2026.acl-long.1894/) models latent user demands and reasoning coverage. It points toward topic/query-family coverage rather than exact keyword repetition, but its benchmark visibility gains do not prove open-web traffic.
- [Competitive GEO, SIGIR 2026 preprint](https://arxiv.org/abs/2605.25517) finds relevance and candidate position stronger than formatting-only changes in 252,000 paired supplied-candidate trials.

**Established across this controlled family:** content substance, relevance, and the supplied context/candidate arrangement matter.  
**Emerging:** topic-level and engine-specific optimization can outperform simple surface heuristics inside controlled candidate sets.  
**Not established:** a durable cross-engine edit that causes organic discovery, citation, and traffic.

### Production evidence is becoming multimodal and product-specific

The February 2026 [Pinterest GEO production preprint](https://arxiv.org/abs/2602.02961) reports a deployed VLM/agent system that predicts user search language for images, builds coherent collection pages, and creates authority-aware internal links across a visual corpus. It reports 20% organic traffic growth and multi-million monthly-active-user contribution.

This is substantially different from rewriting paragraphs for citations. The intervention combines query modeling, indexable page creation, multimodal representations, and internal-link architecture at Pinterest scale.

**Evidence state:** first-party production preprint with reported business outcome; no independent reproduction and multiple bundled interventions.  
**Article rationale:** the strongest current field evidence suggests “GEO” may look like product/search architecture for a specific corpus, not a generic content checklist.

## Established patterns as of the cutoff

- Search-backed generative products still depend on ordinary crawl/index eligibility.
- A user question may expand into multiple retrieval queries; exact keyword matching is an incomplete mental model.
- Original evidence and semantic relevance are more durable than generic formatting tactics.
- Citation selection, citation placement/prominence, answer absorption, referral, and conversion are different outcomes.
- Clean structure and source-backed claims help humans and can help after retrieval, but do not prove organic entry into the candidate set.
- Provider-specific telemetry should be read using that provider's metric definitions.
- Product, local, image, and video facts may need authoritative feeds/profiles and consistent multimodal data; prose is not the only surface.
- Repeated runs, query paraphrases, fixed dates/locales, and preserved raw outputs are necessary because generated answers vary.

## Bleeding-edge trends to watch

- Dedicated generative visibility reports are appearing, but Google and Bing expose different outcome layers.
- User-chosen preferred sources and subscription labels are entering AI answer surfaces, connecting audience loyalty to machine-mediated discovery.
- Research is moving from citation count toward answer absorption, fidelity, prominence, and downstream outcomes.
- Topic/query-family coverage and engine-specific strategies are replacing single-query, universal rewrite recipes in controlled research.
- Production GEO is becoming corpus-specific and multimodal: feeds, profiles, collection pages, internal-link graphs, and VLM-derived representations.
- Agentic browsing and user-directed fetchers create a separate access path from search crawling; their traces should not be folded into AI-search rankings.

## Claims the article should reject

- “GEO replaces SEO.”
- “One special file or schema type makes a page enter AI answers.”
- “Add statistics, FAQs, or quotations and citations will rise by a fixed percentage.”
- “One prompt screenshot is a ranking measurement.”
- “Citation count equals answer influence, readership, or business impact.”
- “Create a page for every guessed fan-out query.”
- “A platform's content guidance is causal proof.”

## Article delta recommended

Keep `llms.txt` as the concrete doorway, then add a complementary section with five parts:

1. define SEO/AEO/GEO operationally and state that the labels overlap;
2. explain query fan-out and the current eligibility/selection/use pipeline;
3. distinguish citation selection from answer absorption, referral, and outcome;
4. give a current practical workflow for evidence, internal links, multimodal/structured facts, and provider-specific measurement;
5. label established patterns, 2026 trends, and open questions explicitly.

This is enough to teach the current GEO model without promising a complete marketing encyclopedia or letting the fast-moving frontier overwhelm the article's live implementation.

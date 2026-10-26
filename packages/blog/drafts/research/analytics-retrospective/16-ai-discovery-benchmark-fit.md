# AI discovery benchmark fit — October 26, 2026 UTC

The owner supplied a Trakkr onboarding screenshot and asked whether it represents this publication correctly. This is an assessment of the shown setup and public documentation, not a review of paid account data or all Trakkr capabilities. No Trakkr profile, prompt, account or subscription was changed.

## Observed mismatch

The generated description identifies genuine subjects: AI agents, developer tools, prompt caching, bot detection and first-party analytics. It also describes Goga as a platform that sells to buyers, then measures absence from a question comparing multi-agent orchestration tools. Its comparison set includes LangGraph, AutoGen and CrewAI. A personal engineering publication need not be an appropriate recommended orchestration framework. The shown zero-of-seven does not establish failure to discover or cite its articles.

The screenshot's URL contains `demo=running-shoes`. That is a provenance question, not evidence that the displayed answers are fabricated. Without the seven complete records, their prompts, provider/model settings, search mode, timestamps, collection status and citation URLs, we cannot authenticate those particular results or establish whether they are preview/demo/live data. Public product documentation does not settle that screenshot-specific question.

## Cross-reference: product method and our implementation

| Question | Inspected evidence | Conclusion / limit |
|---|---|---|
| What does the tracker ask? | [Trakkr Prompts](https://trakkr.ai/learn/docs/features/prompts), reviewed October 7, read October 26: tracking requests ranked brands rather than reproducing a consumer chat | A buyer-ranking prompt can miss a useful research source by design. This describes the documented tracker, not independently verified backend execution of the screenshot. |
| What does its score represent? | [Metrics](https://trakkr.ai/learn/docs/metrics): ranked appearances across successful responses; prompt/model/market selection changes the denominator | It is a selected-run metric, not a global probability of discovery or a reader count. |
| Are mentions and citations interchangeable? | [Citation tracking](https://trakkr.ai/ai-citation-tracking) distinguishes mention, recommendation, source link and referral | An article may be cited without its author being a recommended product. Fetch, citation and click remain separate outcomes. |
| Does our site identify the author? | [Live public DOM receipt](positioning-live.json); [JSON-LD source](../../../src/templates/jsonld.ts) | Home WebSite has a Person author with stable `/about#goga-koreli` ID and public sameAs links; About is ProfilePage/Person. No service identity was invented. |
| Is the publication obvious on the homepage? | [Home template](../../../src/pages/home.ts), [build metadata](../../../src/pipeline/build.ts), live DOM | Title and description say engineering field notes. Visible opening/H1 is the featured personal essay; there is no short opening publication/author description. This is a plausible clarity gap, not a demonstrated ranking cause. |
| Is the distinction stated elsewhere? | [About](https://gkoreli.com/about) and [its source](../../../src/pages/about.ts); [generated agent index](../../../src/templates/llms.ts) | About explicitly calls it a personal publication and lists ghx, backlog-mcp and Nisli separately. An agent using only the homepage may miss that detail. No assumption that all agents read llms.txt. |
| Does Google require special AI markup? | [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features), read October 26 | Google says existing SEO practices apply and requires no special AI optimization/schema. This is Google-specific guidance, not a promise about every assistant. |

## Proposed next iteration

Add one concise, visible homepage identity statement consistent with About, and align the homepage description with it. Suggested meaning: Goga Koreli's personal publication about building with AI agents, developer tools and systems; engineering investigations, open-source work and personal essays. Preserve the featured essay and the publication's breadth. This is a proposed clarity improvement; no homepage implementation or measured lift is claimed today.

Keep the author/publication identity separate from product identities. A ghx comparison should use its real code-reconnaissance peers; backlog-mcp should use its documented context/memory scope; Nisli should be evaluated for web components. Do not add them as interchangeable author aliases just to lift a blended score. Project-specific landing pages would need demonstrated reader needs and current source-backed capabilities before implementation.

Build a small, stable evaluation set from actual article problems. Candidate questions (hypotheses, not measured demand):

- How can I distinguish crawler requests from human readership without relying on JavaScript?
- Why can edge page counts and JavaScript analytics disagree?
- Can editing an agent's context invalidate its prompt cache?
- How can I reduce GitHub exploration context while preserving evidence?

For each run save exact prompt, provider/model/version where exposed, date, market/language, search setting, complete answer, source URLs and collection failures. Score accurate use of relevant article evidence separately from author mention, recommendation, attributed link, inbound fetch and later referral. Test branded identity questions separately from unaided discovery. Include irrelevant prompts as negative controls; absence on an orchestration-product comparison can be an appropriate result.

No live discovery baseline, search-demand measurement or improvement claim follows from this review. Today establishes a benchmark-fit issue and a concrete site-clarity opportunity. It does not establish that Trakkr caused our traffic, that the publication is broadly invisible, or that metadata will guarantee citations.

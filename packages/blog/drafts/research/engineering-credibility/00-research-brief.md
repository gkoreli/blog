# Firsthand engineering evidence: credibility for readers and AI systems

Research date: September 6, 2026, America/Los_Angeles. Sources accessed September 7 UTC. Status: literature and instruction review complete; our own human and model experiments are unrun.

Firsthand language can identify why an author has access to an observation. Credibility still depends on whether the evidence supports the claim. This review supports making that relationship inspectable; it does not establish a credibility, click-through, or AI-citation increase from adding “I” or “my” to a title.

- Human studies distinguish perceived credibility from warranted conclusions; surface cues can mislead.
- Model experiments show source-label preferences under controlled conditions. They do not expose a universal AI trust mechanism or establish open-web discovery effects.
- Provider documentation distinguishes access, search eligibility, source review, and citation. Those stages require different measurements.
- The durable writing change is to identify the source and scope of firsthand work, show the relevant evidence, and retain limitations.

## Why this research exists

Article 024's title, `Bot Detection Without JavaScript: What My Blog Measured`, prompted a discussion about first versus second person. Ownership communicates that the article reports work on a particular system. Our earlier writing skill went further: it asserted a human signal from first-person titles without a supporting experiment. AGENTS.md also summarized GEO as a general discovery strategy more strongly than the underlying skill and research allowed.

The owner requested a dedicated investigation of the psychological and philosophical basis of credibility and how contemporary agents, bots, and crawlers assess engineering sites. This is a new editorial research scope. It does not reopen article 024's frozen research-footprint accounting or append instruction-maintenance discussion to that article's prompts.

Owner request, reproduced as one complete prompt message:

> wow, i didn't know thats a psychological/philosophical trick (maybe not a trick but more like a best practice) - so shall we take a look at the article writing instructions and agents md and all that, i would love to embrace the: " “My blog” identifies firsthand evidence." and as a result increase the credibility due to the firsthand evidence. I feel like we need a dedicated research into the psychological understanding why people or in 2026 how AI agents and AI Bots, crawlers determine the credibility of the engineering blog websites and articles.

## What the findings mean for this blog

The philosophical distinction is between having reason to accept a claim and merely feeling that its source is credible. A firsthand account can provide relevant access to an event; it can also be mistaken, selective, or uninterpretable without its method. Testimonial evaluation therefore concerns the author's competence and incentives as well as the content. The application to this blog is an inference from [epistemic-vigilance theory](01-evidence-ledger.md#h1-testimonial-evaluation-2010), not a measured title effect.

For an engineering article, the useful question is what a reader can check. A name and biography identify an accountable author. A dated capture establishes what was retained. A query explains the counting rule. A reproducible example can demonstrate a defect. Independent replication tests whether the conclusion survives outside the author's account. These offer different kinds of support; none should be substituted for another.

AI systems need an equally precise vocabulary. An automated fetch may be acquisition for search, training, or a particular task. A downstream model may select sources, synthesize an answer, and attach citations. We can inspect documented behavior and captured outputs, but request logs alone do not reveal those later decisions. Even a provider's domain-level source label is distinct from validating every article. [Provider evidence](01-evidence-ledger.md#provider-documentation-checked-september-2026).

Our proposed policy is to make substantiated work easy to evaluate. Improving perceived trust or citation rate is a separate empirical question. If a wording change increases confidence in an unsupported conclusion, that is a failure of calibration, not an editorial success.

## Research method and limits

This was a targeted primary-source review, not an exhaustive systematic review or meta-analysis. Searches covered source credibility, firsthand experience, epistemic vigilance, concrete wording and replication, uncertainty communication, LLM source preferences, authority bias, and generative-search verification. We followed relevant original studies, counterevidence, and official provider documentation; existing [GEO research](../llms-txt-geo/14b-final-geo-research-audit.md) supplied leads that were checked against the original paper.

The [evidence ledger](01-evidence-ledger.md) records study design, denominators, limits, and the resulting editorial decision. Historical human studies are not estimates of engineering readers in 2026. A paper published in 2026 may test older models. Provider documentation is a statement by the provider, not independent evidence of benefit to gkoreli.com. We did not establish a direct causal effect of first-person engineering titles.

## Worklist and next decision

| Work | Status | Artifact |
|---|---|---|
| Inspect existing instructions and identify unsupported credibility claims | Complete | [Instruction audit](03-instruction-audit.md) |
| Review primary human/model research and current provider documentation | Complete | [Evidence ledger](01-evidence-ledger.md) |
| Add a focused reusable reference and correct the affected instructions | Complete | [Firsthand evidence and credibility](../../../../../.agents/skills/blog-writing/references/firsthand-evidence-and-credibility.md) |
| Specify controlled tests with separate credibility and correctness outcomes | Design complete; execution pending | [Experiments](02-experiments.md) |
| Recruit readers, run model trials, or measure an organic discovery effect | Unperformed | No outcome claimed |

The highest-value next experiments are whether ownership wording changes reader interpretation when evidence is held constant, and whether accessible methods and limitations improve agents' supported answers. Run those against a frozen article-derived corpus before making further universal writing rules. This scope is ready to move from literature review to a measured pilot; it does not require another article 024 rewrite.

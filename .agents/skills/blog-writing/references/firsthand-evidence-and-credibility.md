# Firsthand Evidence and Credibility

Reviewed September 6, 2026, Pacific time; source access continued into September 7 UTC. This reference governs claims about firsthand evidence and credibility. It does not choose an article's form or require a particular pronoun. The [research brief](../../../../packages/blog/drafts/research/engineering-credibility/00-research-brief.md) and [source ledger](../../../../packages/blog/drafts/research/engineering-credibility/01-evidence-ledger.md) distinguish findings from editorial decisions.

## Make the basis for knowledge visible

First person can locate evidence: the author built the system, operated it, ran the experiment, or witnessed the failure. That relationship helps explain why this author can report this observation. It does not establish accuracy, independent corroboration, or general applicability.

Use ownership where it clarifies attribution and scope. Keep the subject in the title. Do not add “I” or “my” as a trust formula, human-authentication signal, or ranking technique. Do not manufacture firsthand experience when the work is a literature synthesis, code review, or agent-assisted investigation; describe who did what when that distinction matters.

The conceptual basis is testimonial evaluation: readers can assess a communicator's topic-specific competence and motives alongside the claim. [Sperber et al., 2010](https://www.dan.sperber.fr/wp-content/uploads/2010_clement-et-al_epistemic-vigilance.pdf) develop this account; applying it to our title is an editorial inference, not an experimentally measured pronoun effect.

## Let readers inspect the consequential claims

Give each important claim the evidence it needs, near the claim or through a precise link:

- What was built, tested, or observed, and by whom.
- Relevant date, version, environment, units, denominator, and exclusions.
- Method and result: a command, query, reproduction, pinned implementation, or appropriately scoped capture.
- Interpretation, alternatives, and what the observation cannot establish.
- Material corrections and independent corroboration when available.

This is a selection guide, not a mandatory article template. A simple implementation explanation does not need a study apparatus. A measured accuracy claim needs labels or another defensible validation method, not just a smaller count. In article 024, retaining 95 of 372 browser-UA observations establishes a 74.5% classification reduction; it does not establish 74.5% bot-detection accuracy. See the [claims ledger](../../../../packages/blog/drafts/research/readers-vs-bots/16-claims-and-work-status-2026-09-06.md).

Make verification practical. An author page, repository, and dated research notes can clarify identity and methods, but they share authorship. A self-authored link is not independent corroboration. In a small study of 45 participants, professional fact checkers investigated outside context instead of relying on a site's own presentation. [Wineburg and McGrew, published 2019; author manuscript](https://stacks.stanford.edu/file/druid:yk133ht8603/Wineburg%20McGrew_Lateral%20Reading%20and%20the%20Nature%20of%20Expertise.pdf).

## Separate useful disclosure from persuasive appearance

Perceived credibility is an outcome to measure separately from correctness. Visual polish, confidence, source prestige, concrete wording, and apparent expertise can become shortcuts. Do not imitate authority or add decorative precision to obtain trust.

The evidence is conditional. A preregistered replication did not reproduce the simple concrete-wording truth effect. Five uncertainty experiments found that numerical ranges generally caused little loss of source trust, not that every admission of uncertainty increases trust. Keep concrete methods and honest limitations because they let readers evaluate the claim. [Concreteness replication, 2019](https://online.ucpress.edu/collabra/article/5/1/19/112979/The-Effect-of-Concrete-Wording-on-Truth-Judgements); [van der Bles et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7149229/).

## Name the machine behavior actually observed

| Evidence | What it establishes | What remains separate |
|---|---|---|
| A request in our logs | A resource was requested; attribution depends on verification | Content consumption, endorsement, citation, and human intent |
| Provider documentation | The provider's stated controls, criteria, or behavior | Undisclosed ranking weights and measured benefit to our site |
| Controlled source selection | The tested model's choice among the supplied candidates | Organic discovery, factual correctness, and behavior of other models |
| A visible citation | Attribution in that captured answer | Whether the citation supports the claim or the reader relied on it |

Google encourages clear authorship, original work, and explanation of methods, while stating that E-E-A-T is not a single ranking factor. Its AI-feature guidance adds no special schema or AI file requirement. Those are documented recommendations and eligibility conditions, not a first-person ranking experiment. [Helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content); [AI features](https://developers.google.com/search/docs/appearance/ai-features), checked September 2026.

Some source cues also affect models. A 2026 ICLR study tested 12 LLMs on three supplied-choice tasks and found source preferences even when content was controlled. That does not establish human-like psychology or an engineering-blog discovery strategy. GEO's 2024 experiments likewise tested content use after sources had been selected or supplied. [Khan et al., 2026](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf); [GEO, sections 3.1 and C.1](https://arxiv.org/html/2311.09735v3).

## Review decisions

Preserve a firsthand title when the article supplies the corresponding work. Narrow an unsupported claim even if its wording sounds credible. Prefer evidence relevant to the claim over a prestigious speaker. Keep a correction or limitation that changes interpretation. Reject guarantees about human trust, AI preference, or discovery unless the actual experiment supports that specific outcome.

Our own pronoun and evidence-access experiments are [designed but unrun](../../../../packages/blog/drafts/research/engineering-credibility/02-experiments.md). A new result may change the guidance; it should not be retroactively claimed as the reason for this editorial decision.

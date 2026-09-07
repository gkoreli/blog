# Two experiments to distinguish credibility cues from useful evidence

Status: design only, September 6, 2026. No participants have been recruited, model trials executed, or outcome numbers collected. The sample and run counts below describe a proposed pilot, not completed work or a statistical power calculation.

The question is whether a reader or agent becomes better able to judge the claim. A rise in reported confidence alone is insufficient: the study must also measure whether that confidence is justified.

## 1. Human interpretation: ownership wording and evidence access

**Question:** does explicit first-person ownership help a cold reader identify the basis and limits of an engineering finding, independently of the evidence made available?

Use a frozen set of article-derived excerpts with known support boundaries. Start with the distinction between a 74.5% reduction in a classification and an accuracy estimate. Do not use a live published title change as a causal test: search position, referrals, readers, and timing would change together.

### Four conditions

| Condition | Attribution | Evidence presentation |
|---|---|---|
| A | First-person ownership | Claim and scoped result |
| B | Neutral attribution to the same author and system | Same claim and scoped result |
| C | First-person ownership | Same claim plus method, conditions, and artifact access |
| D | Neutral attribution to the same author and system | Same added method, conditions, and artifact access |

Keep author identity, claim, dates, figures, caveats, typography, and site appearance constant within each evidence pair. The attribution manipulation must preserve meaning: replacing a case report with a second-person promise of universal success would test a different claim. Added evidence naturally changes available information and may change length; record that bundled intervention instead of pretending it isolates each component.

Randomly assign participants to a condition and counterbalance excerpt order. Prevent a participant seeing multiple versions of the same excerpt. Use readers' actual answers, not model-generated stand-ins for humans. A small convenience pilot can expose confusing materials; determine the smallest meaningful effect and required confirmatory sample before drawing population conclusions.

### Outcomes decided before collection

- **Primary:** correctly distinguish the measured quantity from an unsupported generalization, using a fixed scoring rubric.
- **Secondary:** identify who did the work, find the relevant evidence, recognize a limitation, and rate source credibility and willingness to rely on the result separately.
- **Behavior:** whether an evidence link was opened and whether the answer accurately used it; clicking alone is not verification.
- **Calibration:** compare confidence in supported and unsupported interpretations. Higher trust in both is not a successful result.

Collect anonymous task responses and, only if useful for subgroup interpretation, a coarse technical-experience category. Raw answers need no name, employer, or browsing history. Freeze exclusions, missing-response handling, and analysis before collection. Report uncertainty and recruitment limits; do not turn a small pilot into a percentage for all engineers.

**Decision:** if ownership improves attribution without improving accuracy, keep it for its demonstrated attribution benefit. If added methods help readers reject an overclaim, that supports the evidence presentation in this task. A null result remains publishable and does not make truthful attribution undesirable.

## 2. Agent verification: supplied evidence and preservation of limits

**Question:** once an agent can access an article, does an inspectable method improve supported answers and preserve qualifications? Does first-person wording affect those outcomes when evidence is held constant?

Start with the same four conditions so human and agent results address comparable claims without assuming comparable psychology. Use a fixed local corpus and a constrained tool interface; do not let an uncontrolled web search silently replace the supplied material. A separate future open-web study would be needed to test discovery.

### Proposed bounded pilot

Prepare **12 questions × 4 variants × 5 independent repetitions = 240 runs per model**. Use fresh sessions, randomized condition order, and balanced source position. Repetitions in identical conditions establish ordinary answer variation; comparisons between variants must account for it. These are repeated observations on 12 tasks, not 240 independent engineering problems.

Use questions with explicit expected evidence, including:

- What did the 372-to-95 comparison establish?
- Does the 95-versus-14 disagreement identify its cause?
- What does a verified request signature establish about identity and purpose?
- Which retained fields can and cannot reconstruct an old classification?

Build the remaining questions from frozen, checked artifacts. Maintain a support ledger and clearly labeled test-only examples of unsupported interpretations. Never publish fabricated results, credentials, or endorsements as article content.

For each run retain model identifier, date, interface and tool availability, exact input and artifact hashes, sampling settings or undisclosed provider defaults, tool-call results, final answer, citations, failures, and abstentions. Record access to an artifact separately from whether the answer used it correctly. A model's explanation of why it trusted a source is not direct evidence of its internal mechanism.

### Scoring and decision

Blind the scoring pass to condition. Evaluate claim support, citation support, qualification preservation, attribution, and unsupported inferences with a fixed rubric. Inspect disagreements manually; do not use one unvalidated LLM score as ground truth. Report results by task and model, including failures and same-condition variation, before any aggregate. Token cost is a resource outcome, not a credibility score.

If the method-access variant reduces unsupported claims beyond ordinary variation, carry the tested presentation into article guidance with its model and task limits. If a wording cue increases citations without improving support, record source sensitivity rather than a credibility improvement. A future article can report the fixtures, procedure, results, and failure cases once those runs exist.

## What existing analytics can contribute

Search queries, attributable citations, referrals, and request traces can suggest tasks or reveal delivery failures. They cannot label a reader's belief or an agent's private evaluation. Keep an observational discovery window separate from these controlled tests. Do not treat a crawler request, a click, a citation, and a correctly supported answer as interchangeable outcomes.

This design is ready for fixture preparation and pilot execution. It does not block using the corrected instructions or sharing the existing article.

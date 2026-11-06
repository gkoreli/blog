# OSS research

Use for OSS Radar: reconstruct what shipped, why the project has that shape, and which user decision the evidence supports. Choose a single-project deep dive or a cohort scan as the article’s main focus. Research can use both methods; the article should not become several unrelated reviews. OSS Radar has no prompt file.

## Establish the source and claim set

Record the check date, release or launch, branch and baseline commit for each repository, plus consequential issue/PR states in working notes. Pin code, configuration, architecture and vision links to one baseline SHA per repository; explain a later baseline and recheck live states before publication. Reader copy needs only the state that changes a claim, not the raw audit ledger.

Before drafting, keep a claim table:

| Claim | Product says | Code/test or firsthand report | Evidence state | Inference | Reader consequence |
|---|---|---|---|---|---|

Keep inspected, reproduced, reported and proposed states separate. Working code and failed behavior receive the same proof standard. A field report can expose a missed surface; it remains a report until checked. Negative claims require tracing likely modules, defaults and pinned dependencies, not a search with no result.

Read the README and announcement, then architecture, roadmap and maintainer explanations relevant to the claim. Trace actual user action through called code, stores, network and returned result. Inspect defaults, feature flags, release configuration and external dependencies that could reverse the verdict. A schema, reserved event or unused symbol is not a shipped feature.

Check standards, competing products, deployment, license, privacy, security and cost when they change the decision. Avoid expanding each interesting side issue into another article. Honour an explicit read-time limit: cut repeated background before proof; narrow scope if necessary rather than hiding a verdict-changing fact.

## Test the product thesis

Start from maintainers’ stated thesis. Test a sound rival interpretation when code, users, standards or the market support one; do not invent balance. Keep evidence for, against, direction state and a disproof condition in research notes.

Map what the product **replaces, wraps, extends and relies on**. Using Git does not make a tool a GitHub replacement; taking one workflow may still depend on the same infrastructure. Examine whose task gets easier, who controls data and actions, and who supplies compute, payment or operating work. Include outside perspectives only when they change that map or verdict.

Future direction has four distinct states:

- **Stated:** maintainers describe it.
- **In progress:** active code, PR or tracked work implements it.
- **Enabled:** shipped design makes it possible, without a promise.
- **Speculative:** the author’s theory, attributed as such.

Tie a future idea to `shipped part -> new action -> missing rule/component -> possible product`. Name the missing trust, payment, code or operational work. An extension point is not a roadmap. Prefer the nearer supported path and keep only futures that matter to the article’s decision.

## Single-project deep dive

Build the explanation around the significance and falsifiable verdict, the consequential shipped path, the product theory, its material limits and the adoption decision. These are research obligations, not five mandatory headings.

Name the project, job and current consequential limit immediately, in ordinary words. Use nearby products to define the market without turning them into second reviews. Trace the strongest feature end to end, including outside services and the distinction between account authorization and action approval.

Test the main limit with a meaningful condition and acceptance mark declared before execution. A cost comparison needs the same task, repository state, runtime and acceptance check. Hosted and self-hosted advice may differ because data access and operating work differ.

An adoption article should say who can use it now, who should wait and which bounded results would change that advice. An inquiry should retain its actual unanswered question. End once the supported decision or question is clear; do not force a verdict, recap or future-plan section solely to fill a template.

## Cohort scan

Record the source, author, date, cutoff, inclusion rule and total project count. Inventory the full set before choosing standouts. If full review is impractical, use a repeatable declared sample and state its size and limits.

Give unequal projects unequal space. A featured project needs its exact problem, likely user, practical importance, bounded take, hard question and at least one code fact beyond the README. Do not turn every entry into a deep dive or feature a project that adds no new fact.

Derive patterns from the full inventory or stated sample. Give their denominator, supporting projects, a checkable fact, plausible competing explanation and a condition that would disprove the thesis. A pattern should add insight beyond repeated entries. Source/sample bias belongs beside the claim; do not imply the chosen standouts represent an unreviewed whole.

Close on the supported cohort thesis, with follow-up topics only when useful. A cohort does not need a “try now” matrix or release gates. Labels such as `BOLD BET` are optional and must earn their meaning from evidence.

## Write the result, not the notebook

State the claim, show the relevant code/test/report, then explain the consequence. Link disputed or time-sensitive claims in the body. Every number, date, quotation and market claim needs a source. Explain why each material source matters; merge repeated source claims and remove unused links. Working claim and theory tables stay in research unless a compact reader-facing table genuinely clarifies the argument.

Keep ordinary language throughout metadata, headings, tables, callouts and sources. Preserve exact technical terms; do not replace precision with an approximate everyday word. State uncertainty where it affects the evidence and verdict. Never hide a verdict-changing limit to sound decisive.

For final review, check the selected scope, actual code path, baseline links, competing explanation, future-state labels, adoption or cohort conclusion, and source coverage. The article’s structure must deliver its specific argument; no fixed example count, product count or closing formula substitutes for that review.

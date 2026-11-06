# Evidence and engineering investigations

Use for consequential technical claims, comparisons, measurements or an investigation of a system Goga built or used. A routine sourced explanation does not require a study apparatus.

## Match evidence to the claim

| State | Establishes |
|---|---|
| Observed | First-party telemetry recorded a named event within its measurement boundary |
| Reproduced | A behavior ran under recorded conditions and returned the stated result |
| Code-inspected | A pinned implementation contains the stated path |
| Primary documented | A provider, maintainer or standard states the behavior or policy |
| Reported | A firsthand account describes a result that was not independently rerun |
| Third-party measured / peer-reviewed | An outside study supports its result within its population and conditions |
| Inference | The author’s conclusion from specified evidence |
| Proposed | Intended work or an unaccepted change, not an existing outcome |

Use a source only for the stage it observes. A launch establishes an announcement, an issue a report, a local test its tested behavior. A smaller retained count does not establish detector accuracy; an accuracy claim needs defensible labels or another suitable validation method. Self-authored notes and repository links are inspectable evidence, not independent corroboration.

Prefer accessible primary sources. Check whether the version and conditions still apply; age alone does not invalidate a source. Use Wikipedia to locate originals and cite it only if the original cannot be found. When evidence is inaccessible, state the gap rather than substituting reputation or a weak source. Use as many sources as consequential claims need, with no source-count quota.

First person can locate who built, tested or observed something. Do not manufacture firsthand experience in a literature or code synthesis. Author identity, vivid language and visual polish do not establish correctness or generality. Source preference by a tested model is distinct from factual reliability and human trust.

## Start an investigation from an owned stake and a falsifiable question

State what exists or happened, why it matters to this author and what evidence could change the starting claim. Preserve the live contradiction or failed assumption without inventing one. Map the relevant stages before evaluating whether the system works: request, delivery, selection, use and outcome may need different records.

Keep a working table when the claim set needs one:

| Claim and stage | Evidence state | Source/test and conditions | Supports | Cannot prove / counterevidence | Disposition |
|---|---|---|---|---|---|

Distinguish observation, interpretation and proposal beside the statement, not only in a distant limitations section. Keep populations, units, denominators, cutoffs, sampling, exclusions and meaningful comparator conditions with measurements. Distinguish percentage changes from percentage points and avoid treating overlapping counts as disjoint.

## Keep evidence durable and research bounded

Use the existing article research directory or create one before parallel research. Keep a scratchpad/index, claims and rejected claims, dated source rationales, reproduction records and the final evidence/release audit. Delegated work must leave useful evidence there; chat coordination is not the durable record. Raw operational captures, private feedback and session logs remain outside Git.

Delegate by independent failure mode when authorized. Follow adversarial critique with a constructive pass that recovers the bounded useful result and names conditions that would change it. Test plausible competing explanations rather than inventing balance. Stop expanding research when material claims are supported, narrowed, rejected or explicitly deferred and further sources no longer change the reader’s decision.

Negative claims need a defined search space: inspected modules and dependencies, selected data/window, tested platform or returned result pool. A missing search match or absent captured event is not universal absence. Preserve failed attempts, unavailable evidence and contradictory captures rather than silently rerunning until the story is cleaner.

## Explain the present repair as carefully as the failure

When presenting a repair, connect:

```text
before state -> observed/reproduced failure -> mechanism
  -> current change -> rationale and alternatives -> accepted cost
  -> transferable rule -> remaining unknown
```

Show the actual producer, call path, stored data and reader-visible behavior relevant to the claim. State what a new field or policy gains and loses. A diagnosis with no implemented repair should say so. Code acceptance, deployment activation and measured production behavior need their own evidence; a successful build or homepage GET cannot stand for all three.

Keep durable definitions and decision rules distinct from dated provider behavior, versions and measurements. Recheck volatile claims and explain how a reader could reevaluate them. An unfinished outcome is publishable when the claims made now are grounded; do not wait solely for a clean success narrative or imply the future measurement already happened.

## Machine and audience claims

Log access establishes a request or served event under the collector’s rules. Verification may support attribution of covered components. It does not automatically establish a user trigger, comprehension, endorsement or citation. Provider documentation establishes stated controls, not undisclosed ranking weights or benefit to this site.

Recognize positive supported agent outcomes without requiring a human visit. A controlled supported answer is task evidence; unseeded search selection is discovery evidence; an external copy is distribution evidence. Preserve the relevant sample and source-version limits. Controlled tests stay separate from organic growth and do not become customer adoption.

The [credibility research ledger](../../../../packages/blog/drafts/research/engineering-credibility/01-evidence-ledger.md) retains the studies behind earlier editorial rationale. Do not repeat their old summaries as timeless guidance or imply a prose edit reran those studies.

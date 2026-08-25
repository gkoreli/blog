# Evidence-led engineering investigations

Read this reference when an article starts from a system the author built or used, then tests a disputed technical claim against implementation evidence, reproductions, primary documentation, and outside research.

Do not use it for an ordinary sourced engineering post. Use `oss-radar` when the article's subject and verdict are an open-source project or cohort.

## Keep the article grounded in an owned stake

Start with both:

- an owned system, decision, failure, or observation that gives the author standing;
- a falsifiable question whose answer can change during the research.

The personal stake prevents a generic explainer. The question prevents the personal story from outrunning the evidence. Research must be allowed to weaken, narrow, or reverse the starting thesis.

Write the governing claim and what would disprove it before expanding the draft. Preserve the admission, failed assumption, or live contradiction that made the investigation necessary.

## Build the evidence model before prose

Map the system into stages before evaluating whether something “works.” Name the event at each stage and the evidence that could observe it. A useful chain might separate request, delivery, selection, use, citation, referral, and outcome; another domain will need different stages.

Keep a working claim table:

| Claim | Stage | Evidence state | Source or test | Supports | Cannot prove | Counterevidence | Disposition |
|---|---|---|---|---|---|---|---|

Use evidence states precisely:

- **Observed:** first-party telemetry recorded the stated event, with its measurement boundary.
- **Code-inspected:** the cited implementation contains the stated path.
- **Reproduced:** the behavior ran under recorded conditions and produced the stated result.
- **Primary documented:** an owner, provider, maintainer, or standards body states the policy or behavior.
- **Peer-reviewed:** published research supports the claim inside its experimental boundary.
- **Third-party measured:** an outside empirical study reports a method and sample; population limits remain.
- **Reported:** a first-hand account describes behavior that was not independently rerun.
- **Proposed:** a document or unmerged change describes behavior that may not exist yet.
- **Inference:** the author's conclusion from named evidence; never silently promote it to observation.

Use each source only for the stage and claim it can establish. Record what it cannot prove beside what it supports. Negative claims require a defined search space; “I did not find it” is not “it does not exist.”

## Keep research in durable artifacts

Create one article research directory before fan-out. Keep, at minimum:

- an evolving scratchpad that links the useful artifacts;
- the claim table and rejected claims;
- source notes with check dates, URLs, evidence boundaries, and rationale;
- reproduction or measurement records with conditions and limitations;
- adversarial findings and the constructive follow-up;
- the final evidence ledger and release audit.

Every delegated research task must write its useful evidence into that directory. Chat summaries are coordination, not the durable record.

Delegate by independent failure mode, not by desired volume. Useful lanes include implementation and telemetry, provider or standards guidance, academic evidence, and adversarial review. Follow red-team work with a green-team pass that adapts the surviving thesis, recovers bounded value, and states the conditions under which the rejected idea could still work.

Stop expanding research when every material claim is supported, rejected, narrowed, or explicitly deferred and new sources no longer change a reader decision. Do not use fan-out as a substitute for judgment.

## Draft while the evidence changes

Keep an article draft moving during research so the evidence can expose structural problems early. Mark provisional claims in working notes. Do not let provisional language survive publication merely because it already reads well.

Build the article around:

1. the owned observation or failure;
2. the mechanism that explains it;
3. the competing explanations and evidence boundaries;
4. the bounded decision rule;
5. the evidence that would change the decision.

This is movement, not a mandatory heading template. Keep the governing form from `shape-article`.

## Make the result evergreen without hiding time

Separate two layers:

- **Durable layer:** definitions, stage distinctions, failure modes, decision rules, measurement procedures, and conditions that change the verdict.
- **Dated frontier:** provider behavior, versions, policies, adoption data, current clients, live metrics, and recent research.

Put the check date near volatile claims and in the evidence ledger. Prefer pinned repository links for code claims. State which parts should survive a provider change and which require rechecking.

Evergreen does not mean timeless wording. It means the article remains useful because readers can see what is stable, what was true at the cutoff, and how to reevaluate the conclusion.

## Release with an evidence boundary

Before publication:

- verify every date, number, quote, attribution, external link, repository path, and technical claim at its source;
- ensure the body distinguishes observation, reproduction, documentation, research result, and inference;
- retain counterevidence that materially limits the verdict;
- check generated HTML, metadata, canonical and agent-readable routes, internal links, and the social card;
- make expected pre-push `404` links explicit when the release itself creates their target;
- freeze an optional research footprint only after the prompt and artifact sets are final;
- lead distribution with the finding or contradiction, then put computation and provenance in a reply or secondary note.

A research footprint is provenance, not proof of quality. Never use token volume as the article's main claim.

## Learn after publication

Define the observation window and useful signals before reacting. Prefer page-filtered search queries, reader replies, corrections, attributable referrals, source changes, and evidence from implementers over aggregate pageviews alone.

Record the post-publication result in the article's research directory. Decide whether it warrants a content correction, a discoverability change, a distribution change, a new experiment, or no action. Update `lastModified` only when the served article changes materially.

Keep one-off lessons with the article. Promote a rule into a shared skill when it recurs across articles or prevents a costly failure that the existing instructions do not cover. Start with a focused reference; create a standalone skill only when the workflow has its own stable routing and repeated use.

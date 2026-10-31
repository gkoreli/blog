# ADR-0019: Agentic engineering publication and analytics ambition

## Status

Accepted direction — October 30, 2026. Records the owner's ambition and the working standard below. It amends the product boundary in [ADR-0016.1](0016.1-analytics-purpose-and-decision-loop.md); it does not establish product adoption, authorize external communications, or select a new architecture.

## Owner direction

The complete owner message, preserved exactly:

> This is the level of due dilligence and thorough work that i want to do for my blog: https://x.com/wespreadjam/status/2115568290307469548?a=VLy1Fz13dzpp0dlnl1o&s=46
>
> I want us to be experts in the modern day writing with AI Agents and building in oublic, building the visibility and analytics in the modern day for blogs and websites, the analytics work that we are doing for ourselves will become a defacto analytics for millions of sites in the future thats what i want to achieve. We are builders and engineers and experts in agentic engineering

## Decision

[ADR-0016.19](0016.19-agent-mediated-audience-growth.md) makes explicit that people and agents are both audience. Agent-mediated discovery, access, citations, distribution and use are legitimate growth outcomes at their observed stages; human identification is not a condition for recognizing them.

Develop gkoreli.com as a publication and working environment for agentic engineering: build useful systems, write with AI agents while preserving human authorship, publish inspectable work, and learn how people and agents discover and use it. Develop the analytics we need ourselves with the long-term ambition of serving millions of sites. That scale is the owner's intended destination; current adoption and readiness require their own evidence.

Publication, distribution, and analytics are substantive engineering work. Give each a defined question, implementation or intervention, and acceptance evidence. Expertise comes from explaining mechanisms, testing alternatives, using the result, and correcting errors publicly. Neither agent-generated prose nor a detailed research archive establishes expertise by itself.

The practical publication should teach something readers can use and expose the author's actual decisions, methods, mistakes, and remaining questions. Preserve the existing freedom of personal essays, signature pieces, and OSS Radar. This direction does not turn every article into an acquisition page or require every investigation to become an article.

## What the reference establishes

Read the supplied [X post](https://x.com/wespreadjam/status/2115568290307469548) in the signed-in browser on October 30. A focused search located [Discovered Labs' Granola case study](https://discoveredlabs.com/case-studies/granola), which reports the same 4,600% increase in monthly AI-attributed activated users. It describes question-led diagnosis, page repair, relevant external coverage, and separate Google/AI measurement. These are the agency's reported results, not independently reproduced findings. Its public page does not supply the underlying event export, complete prompt sample, or a causal control. We adopt a testable workflow; no comparable growth is promised. Replies and image content were not audited.

## Working standard

For a material engineering or discovery investigation:

1. Name the reader or site-owner decision and what evidence would change it. Trace consequential external claims to their original source; distinguish reported results, inspected code, reproductions, observations, and inference.
2. Inspect the current implementation and existing work before building. Preserve versions, conditions, denominators, missing data, competing explanations, and failed checks. Scale the investigation to the consequences of being wrong.
3. Use agents for bounded research, implementation, critique, and verification. Preserve material human shaping prompts under the existing article rules. Review the result against original evidence; agent agreement is not independent validation.
4. Produce a usable result: a repair, method, explanation, experiment, or justified no-change decision. Link the evidence needed to inspect it. Keep raw private data and logs outside Git.
5. Separate code completion, deployment activation, measured behavior, and actual reader or operator value. Publish supported lessons while unresolved outcomes remain explicit.
6. Stop expanding when the material claim is supported, narrowed, rejected, or explicitly deferred and further work no longer changes the decision. Thoroughness should improve decisions and delivery.

Existing [writing evidence rules](../../.agents/skills/blog-writing/SKILL.md), [investigation procedure](../../.agents/skills/blog-writing/references/evidence-led-engineering-investigations.md), and [editorial learning loop](../../.agents/skills/blog-writing/references/editorial-learning-loop.md) remain the procedural owners.

## Discovery and visibility loop

Start with a small, versioned set of questions that our intended readers actually face. Mark agent-generated candidates as hypotheses until reader, search, community, or usage evidence supports them. Map each question to an existing article, an actual coverage gap, and the practical outcome the reader needs.

Diagnose a miss before choosing work: missing coverage, an inadequate explanation, crawl/index/access failure, unclear presentation, or a specific external source shaping the answer. Improve the relevant existing page when it already owns the question. Create a new page when a distinct question needs one. Prioritize technical fixes by their effect on these pages and decisions.

Inspect the exact cited or linked sources. Distinguish information we control, profiles we can legitimately maintain, independent coverage we must earn, and factual errors we can substantiate. Prepare useful contributions for appropriate venues; outreach and publishing follow the existing authorization rules.

Record the baseline, chosen change, intended result, and observation window before acting. Rerun the same questions under recorded conditions. For AI observations, retain the prompt-set version, service/model identifier when exposed, date, search mode, relevant locale/account context, repeated-trial count, response evidence, cited URLs, failures, and denominator. A scope or method change starts a separate baseline. A sampled answer is not population visibility, and a before/after result alone does not establish causation.

Keep these outcomes separate:

| Layer | Evidence | Boundary |
| --- | --- | --- |
| Search discovery | Page/query impressions, clicks, and indexing evidence | Search Console scope and access limits remain visible. |
| AI answer visibility | Observed mentions and citations within the declared prompt sample | No claim to cover all questions, users, or model behavior. |
| Audience access | Eligible responses from people, declared agents, crawlers, automation and unresolved clients | Count observed reach and comparable growth; a fetch or signer alone does not establish comprehension or a human trigger. |
| Reader and agent value | Supported answers, citations, specific feedback, corrections, subscriptions, links, and reports of application, including agent-mediated work | Direct human contact is one useful signal; preserve provenance and consent without requiring it for agent outcomes. |
| Product value | Another operator can install, understand, use, and maintain the analytics | Our own successful use does not establish independent adoption. |

Select the next correction, discovery change, distribution change, experiment, or no action from that evidence. Reuse [article reach reporting](0016.18-article-reach-and-source-concentration.md) and saved measurements before adding instrumentation.

## Analytics product path

The broad-product ambition is now accepted. The former blanket statement that the blog must not become an analytics product no longer governs. Retain the decision-first engineering threshold, truthful metric semantics, historical continuity, privacy constraints, query budgets, and separation of observation from interpretation in the analytics ADRs.

Use our site to discover and solve real problems. Then test portability with an independent site and operator: installation, framework/hosting assumptions, metric comprehension, decision usefulness, data ownership, privacy and retention, operational recovery, and cost. Extract reusable contracts from demonstrated needs. Broader architecture, packaging, hosting, pricing, and scale claims need explicit decisions and evidence when those questions arise. Serving millions of sites will require validation beyond a single-site deployment.

Measure progress through demonstrated reader use and independent operator success alongside distribution. Keep feature delivery, visibility, and adoption as separate results.

## Continuity and next bounded action

Use the existing [Analytics Worklist](../folders/FLDR-0001.md) and [retrospective research index](../../packages/blog/drafts/research/analytics-retrospective/00-worklist-index.md). The latest inspected [directory-possession investigation](../../packages/blog/drafts/research/analytics-retrospective/114-directory-possession-and-profile-drift.md) establishes a narrower signature capability boundary; it is not evidence of discovery or adoption. Existing account-access, human-trial, and privacy decisions remain unresolved under their owning records. This direction does not resolve those inputs or reopen completed work.

The initial next action was to prepare a small question-to-article map, label untested questions, and declare one baseline and success condition before intervention. The owner's subsequent execution request starts [experiment 01](../../packages/blog/drafts/research/discovery-experiment-01/00-experiment.md), which owns its actual results and limits. Use [run-discovery-experiment](../../.agents/skills/run-discovery-experiment/SKILL.md) for this workflow. Account observations retain their existing access/input requirements. This ADR remains the direction record; experiment, publication, and adoption evidence live with the work.

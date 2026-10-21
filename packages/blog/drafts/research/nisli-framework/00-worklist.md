# Nisli framework article — worklist

Started October 20, 2026 (America/Los_Angeles). Publication authorized October 21;
latest release status is recorded below. Earlier scope statements are historical.

## Intended article

Working title: **OpenClaw Chose Solid. Here’s Why I’d Choose Nisli.**

Open with Peter Steinberger’s October 20 account and OpenClaw’s public migration timeline. Explain the coordination costs behind the Lit-to-Solid change, then inspect Nisli’s independently developed design. Goga’s experience across Angular, React, Vue, Svelte, Web Components, and other frontend frameworks is the origin; the article must not invent a choice between Lit and Solid as Nisli’s origin story.

Reader payoff: understand update granularity, resource ownership, async correctness versus consistency, and the runtime/compiler tradeoff well enough to assess a framework for a persistent interactive application.

The provocative title expresses an architectural preference. It does not establish that OpenClaw would run faster on Nisli, that its migration would have been cheaper, or that Nisli is globally superior. Concrete browser evidence must be allowed to narrow the preference.

## Evidence boundary

- Nisli: inspect core 0.56.0 at `4afde49c728a330e10ce887a38b8013d63b58498`; local checkout initially clean. The blog uses 0.47.4 and is a separate reference host.
- OpenClaw: distinguish Peter’s report, the AI-authored public timeline, the tracking issue, and individual merged PRs. A source report is not a rerun.
- Lit: include both ordinary reactive properties and the experimental signals integration. `@lit/task` already provides race suppression and abort signals.
- Solid: use the 2.0.0-rc.14 package family named in OpenClaw’s migration plan. Current public npm `next` is rc.16; do not silently substitute it.
- Tests/benchmarks: synthetic local fixtures, identical visible work where compared, explicit versions and production settings. No OpenClaw port or whole-application result is claimed.
- Keep research dependencies and generated bundles outside the site’s package graph and active `dist/`.
- Draft remains under `drafts/`; no article route, RSS item, or publication date is created.

## Work

- [x] Read article, evidence, authorship, and repository guidance.
- [x] Inspect current Nisli source and the relevant historical decisions.
- [x] Read both requested OpenClaw sources and linked issue/PR evidence.
- [x] Build bounded browser fixtures for Lit, Lit signals, Solid 2, and Nisli.
- [x] Check actual update scope, async supersession, and cleanup/lifetime behavior.
- [x] Measure equivalent hot-update and mount workloads if the fixture is fair and reproducible.
- [x] Draft the article with mechanism-level comparisons and firsthand rationale.
- [x] Audit claims, links, sources, code examples, and complete shaping prompts.
- [x] Run appropriate checks and save evidence and next steps.

## Continuity

Runtime sources and method notes: [source ledger](01-source-ledger.md). Claims and rejected claims: [claim ledger](02-claims.md). Draft: [article.md](article.md). Reproduction: [method, source and raw results](repro/README.md). Final review and delivery status: [review and handoff](03-review-and-handoff.md).

The requested draft and bounded experiments are complete. The article includes counterevidence: narrow Lit wins the update fixture; Nisli mounts more slowly; Solid 2 supplies coordinated async consistency that Nisli's independent resources do not.

Delivery target: a scoped commit and push of this unpublished directory to `main`. Git history and the delivery response record that operation separately from the completed draft and experiments.

Next bounded action: Goga's editorial review of the draft. A representative OpenClaw port is an optional future experiment if a stronger whole-application claim is wanted; it is not accepted work or a condition for completing this draft. Publication and distribution have not been requested.

October 20 follow-up: Goga requested an investigation of the mount/update costs and possible core optimizations. That separately scoped work is recorded in [the optimization report](04-core-optimization.md); it preserves the original results and provides a measured candidate rather than changing the release baseline retroactively.

October 20 release preparation: Goga requested landing and a release, with
understanding the changes before landing as a condition. The [release review](release/README.md)
records the repaired prototype regressions, final 0.56.1 candidate, all thirty
samples per timing case, package compatibility, and local gates. The article now
includes that optimization story and before/after table. No main merge or npm
release has occurred. Next bounded action: Goga reviews the concrete candidate
and its tradeoffs; then complete the authorized delivery and verify main CI/npm.

## October 20 publication-preparation pass

Goga returned to article iteration and asked to prepare it for publication. His
explicit instruction for this article is to omit human prompts. The existing
research prompt capture is removed from the current tree; no matching file in
`packages/blog/prompts/` or generated prompt page is prepared. This is a scoped
owner exception to normal collaborative-post provenance. A brief AI-assistance
disclosure and public methods remain; no research-token footprint is published.
Earlier committed prompt content remains in Git history; no history rewrite was
requested or performed.

Current draft: [article.md](article.md), now with publication metadata. Proposed
publication filename: `029-openclaw-chose-solid-why-id-choose-nisli.md`; slug
`openclaw-chose-solid-why-id-choose-nisli`. It remains outside primary `posts/`
discovery. A full site build in a separate managed worktree provides the review
preview without touching the active development output.

Fact-checking found the newly published core 0.57.0. The main table and bundle
comparison were refreshed against the actual npm artifact using the unchanged
workload: [publication evidence](publication/README.md). The old 0.56.0 source
comparison and its unmerged optimization branch remain historical and separate.
The Promise error adapter is still under review; this article request does not
land that branch or authorize another core release.

Next bounded action: inspect the rendered publication candidate and iterate on
Goga's editorial feedback. Publishing the site and distributing the article are
separate from this preparation pass.

## October 21 authorized publication

Goga requested release and committing all active changes. The authoritative
article now lives in [posts/](../../../posts/029-openclaw-chose-solid-why-id-choose-nisli.md);
[article.md](article.md) is a supersession pointer, avoiding two editable copies.
The publication date is October 21 in the updated client’s Pacific timezone. No human
prompts or prompt page are included. The held core optimization branch remains
a separate experiment; this release publishes the article and its evidence.

Next bounded action: validate the promoted article in the isolated site build,
commit and push the active blog changes to main, then verify deployment and
current public content. The [handoff](03-review-and-handoff.md) records the
actual delivery and acceptance separately. No social post is requested.

Publication completed: article commit `29a76af` is pushed; Cloudflare’s build
succeeded and current public acceptance passed. See the
[delivery receipt](03-review-and-handoff.md#article-delivery-and-public-acceptance).
The separate core preservation/cross-validation request does not reopen article
publication or authorize social distribution.

The preservation/cross-validation follow-up is recorded in the
[Nisli backlog](https://github.com/gkoreli/nisli/blob/main/docs/worklists/core-rendering-performance/README.md)
and [negative throughput result](integration/README.md). The queue-only runtime
change was briefly integrated, then reverted after the fresh Firefox result;
no npm release shipped it. Complete source recovery, new regression tests, and
all benchmark samples are retained. The article follow-up is deployed and
publicly verified; the final remote core-CI receipt is in the handoff.

Final acceptance: Nisli main `45e009e` passed
[CI](https://github.com/gkoreli/nisli/actions/runs/39560950654) at 07:31:57 UTC
October 21. The preservation and cross-validation request is complete. Current
runtime remains the baseline; proposed optimization work is explicitly held in
the linked backlog. Article publication and live follow-up acceptance are complete.

## October 21 practical rewrite

A new editorial continuation makes the article shorter and more concrete.
It does not reopen the completed core optimization investigation.

- [x] Inspect real OpenClaw migration before/after code and merged PRs.
- [x] Replace abstract explanation with two practical Nisli examples and
  distinguish its advantages from capabilities Lit and Solid already provide.
- [x] Extract and strictly typecheck the actual article snippets; validate their
  behavior in Chromium, Firefox, and WebKit against public core 0.57.0.
- [x] Preserve measured losses, async tradeoffs, rejected optimizations, and the
  explicit no-prompts exception; reduce the article from 4,120 to about 2,380 words.
- [x] Finish isolated publication checks, commit/push, and verify activation.

The revision is published and live acceptance passed. Source commit `ebb2534`
was pushed to main. The automatic build had not started at the delivery check,
so the validated isolated build was deployed directly; the deployment receipt
is in [the handoff](03-review-and-handoff.md#practical-rewrite-activation).
No article work remains pending. The missing automatic trigger is an observed
operational limit, not a diagnosed cause or an open core-optimization task.

# Nisli framework article — worklist

Started October 20, 2026 (America/Los_Angeles). Working draft; not a publication request.

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

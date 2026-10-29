# Next adoption work: give someone a result they can use

Prepared October 28, 2026. **Item 1 was posted October 29**; the other proposals below remain unsent. [Execution receipt](execution-2026-10-29.md) also records the separately authorized Assaf pitch and historical-demo X post. This extends [the earlier evidence review](battle-tested-2026-10-28.md), rather than repeating the newsletter pitches and posts already executed.

## What the evidence actually supports

[PostHog's founder account](https://newsletter.posthog.com/p/how-we-got-our-first-1000-users) describes onboarding early users by hand, learning from repeat use and keeping outreach short. It is first-hand practice from a developer product, not a conversion estimate for a personal article. Apply the narrow lesson: help one engineer finish a relevant trial, then learn what stopped them.

Their [data-study handbook](https://posthog.com/handbook/content/writing-a-data-study) describes using original observations, checking every number and preparing charts for distribution. That supports a reusable workflow, not a claim that a video or original data guarantees clicks, links or AI citations. We now have the clip, the easy trial and a new application-specific finding, so the next work should involve other engineers rather than more presentation building.

## 1. Finish the Polkadot conversation with the new fix

**Posted:** [the public comment](https://github.com/paritytech/polkadot-cli/issues/218#issuecomment-6500261059), using [the concise maintainer draft](../../research/polkadot-bun-aot/02-maintainer-draft.md), for [their existing rewrite proposal](https://github.com/paritytech/polkadot-cli/issues/218). It keeps the article context and now includes the important counterexample: asset-only AOT was slow on proof verification; a static WASM import changed 609 ms to 67 ms, with a larger executable and more peak memory on that command.

The useful result is a maintainer rerun, a correction, or a request to test one of their actual parity fixtures. A view or a polite thanks is weaker evidence. Do not ask them to share the article or say the rewrite is unnecessary. The prototype and valid/tampered proof fixture are ready; the wider transaction gate is not complete.

This is the strongest next action because someone is already deciding the exact question our work addresses. It is established helper-first practice applied to a verified project need; the outcome is still unobserved.

## 2. Get one independent run, with a small ask

**Named reader:** Vorrapong Kertnat / ICE. His [M5 Bun-framework study](https://blog.icerust.dev/blog/bun-http-framework-benchmark-on-m5-air/) checks response correctness and reshuffles order after finding thermal effects. His [own about page](https://blog.icerust.dev/about/) provides contact. This verifies relevant experience and a public route, not interest or willingness to collaborate. His Elysia AOT setting is not Bun's new native compiler.

Prepared message:

```text
Hey ICE, I tested Bun AOT on an M5 too; the files got smaller, but some commands slowed down. Would you try this small fixture and share the result JSON so we can compare machines? https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/quickstart
```

Send the [result template](adoption/result-template.md) only if useful, rather than making a form a condition of helping. One independent result would be valuable even if it contradicts ours. Ask permission before quoting a reply or publishing someone's identity. Do not count the invitation as a replication.

## 3. Use the counterexample and fix as a new post

**Prepared experiment, not a proven reach tactic.** The previous image already advertised a smaller executable. A new post should add something: a real crypto command got much slower, then the documented import path fixed it. It gives engineers a concrete mistake to avoid.

```text
One Polkadot proof check took 73 ms with regular Bun and 609 ms with AOT; importing its WASM file at build time brought AOT to 67 ms. That made the binary larger—code, measurements and limits: https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/polkadot-bun-aot/03-optimization-experiments.md
```

This is a separate angle from the [30-second historical demo](shot-list.md), which keeps the original server-size and compiler-memory tests clearly separate. Choose one new publication at a time; there is no current evidence that posting both immediately would help. Success is a relevant question, a trial or a correction; platform reactions are context.

## 4. Offer a runnable fixture to an independent benchmark suite

**Named destination:** [jlucaso1/js-compiled](https://github.com/jlucaso1/js-compiled), which already includes Bun AOT and publishes CI results. Its [benchmark contract](https://github.com/jlucaso1/js-compiled#benchmarks) uses deterministic TypeScript and a `RESULT` line checked against Node. This is a small validation project, not a verified source of large traffic.

The [prepared record-scan adapter](adoption/record-scan.ts) has no dependencies or random input and prints `RESULT 562757611`. It fixes the quickstart's input sizes at their defaults and changes the output format; it is a separate source variant. Node 24.14.1, pinned Bun source execution and a Bun AOT build all produced that output. This is preparation, not proof it passes the external harness, every compiler or Linux CI. The suite already has a much larger pipeline benchmark; offer this smaller startup/retained-data case only if its maintainer sees a gap, rather than creating a redundant PR.

Prepared note:

```text
I made a small record-scan case while comparing Bun JIT and AOT. It uses no dependencies and follows your RESULT contract; on my Mac AOT used less memory but ran slower. Would that add anything beyond your pipeline benchmark? Fixture and checks: https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/social/oss-radar-08-bun-aot/adoption
```

An accepted fixture or independently published result would give the article a durable evidence link. It would not establish how many people read it. No PR, issue or message has been sent.

## 5. Offer two bounded trials on readers' own CLIs

**New experiment:** make one public invitation for two public repositories and one offline command each. Cap each trial at 45 minutes, retain failed builds, and give each participant a small result they can use. This applies the helper-first practice above to the exact decision in the article. It is not a proven acquisition tactic for this account.

Prepared post:

```text
If you have a public TypeScript CLI you're considering rewriting for speed, link it with one offline command. I'll test the first two with Bun AOT and share the speed, memory and file-size results, including failures: https://gkoreli.com/oss-radar-08-bun-aot
```

This is a proposed future commitment, not a posted promise or an open-ended support offer. It needs Goga's decision before publication. The useful result is two actual trials and whether either changes a decision; a dozen interested replies without a runnable command is not the same outcome. Do not build a submission website or collect emails for this.

## What not to spend time on next

- Another generic intro post or duplicate newsletter pitch. The existing sends already own that experiment.
- A new Bun issue for Zod: the current slowdown reproduces, but Bun's docs already describe it. Offer the small fixture in a relevant discussion instead.
- A library-wide `aot` export campaign based on one 4% hashing difference. The source-export experiment is not a complete crypto-library test.
- The repository URL embedded in `verifiablejs`'s package metadata was not accessible through the public GitHub checks. Do not invent a maintainer contact route; the existing Polkadot discussion can carry the finding.

Item #1 is complete; #2 remains a proposal requiring authorization. Keep a manual record of replies, reruns, failures and decisions. No new service, tracking system, mass outreach or automated follow-up is needed.

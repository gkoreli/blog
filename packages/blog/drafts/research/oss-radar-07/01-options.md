# OSS Radar #07: Four experiments for the blog

**Selection update, September 8:** Goga chose Promptfoo and the question **Can Promptfoo Preserve the Evidence Behind an AI Answer?** The comparison below preserves the initial selection research. Continue in the [worklist](00-worklist-index.md), [trigger/citation research](04-trigger-provenance-and-ai-citations.md), and [article draft](../../oss-radar-07-promptfoo.md).

**Recommendation: evaluate Promptfoo against a real AI-citation study.** It has the best fit with the open Trellner research task, the credibility experiments, and the missing answer-side analytics. Cloudflare Web Bot Auth is the strongest alternative if the next week should improve the Worker directly.

These are four candidates for one project deep dive, not a proposed four-project issue. Research cutoff: September 8, 2026. The plans below are estimates for one week of focused work. One small offline Promptfoo fixture ran during this investigation; no live model study or Cloudflare account query ran.

## The change in the publication

The recent engineering articles form a clear sequence. [The llms.txt investigation](https://gkoreli.com/does-llms-txt-work), published August 25, asked what an implemented feature could actually establish. [The analytics architecture](https://gkoreli.com/first-party-analytics-for-a-personal-blog), August 26, explained the system needed to observe it. September's fetcher, classification, and referral studies then supplied request captures, counting rules, implementation defects, repairs, and dated results.

Two results show the change especially well. [Article 024](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript) reports that rules moved 277 of 372 browser-User-Agent requests out of the Browsers category, while retaining the unresolved 95-versus-14 disagreement with the script counter. [Article 025](https://gkoreli.com/filter-referrer-spam-without-deleting-analytics-history) explains a reversible Matomo policy and the later reduction from 182,388 to 33,259 D1 reads for the same historical report. These are different quantities, with different dates and denominators. Neither result establishes a count of people.

OSS Radar already has substantial experiments: [#06's interp-engine research](../interp-engine/00-worklist-index.md) includes Mac reproductions and retained result files. The next improvement is to make the Radar experiment solve a problem the blog will continue to operate, so the engineering continuation earns new evidence rather than retelling the product review.

The [credibility brief](../engineering-credibility/00-research-brief.md) adds the right constraint: being easy to inspect is useful; increased trust, discovery, citation, and answer correctness still require separate observations. The proposed reader and model experiments remain unrun.

## Comparison

| Candidate | Verified August–September event | Problem the blog owns | Reusable result | Main reason to choose it |
|---|---|---|---|---|
| **1. Promptfoo** | 0.122.1, August 26: tracing and token-accounting work; 0.122.2, August 28 | We can observe requests but lack a repeatable answer/citation record | Capture adapter, citation dataset, scoring rubric, result explorer | Best fit with the prioritized Trellner study and credibility work |
| **2. Cloudflare Web Bot Auth** | Rust validity fixes August 13/18; key preparation August 31; directory-key fix September 4; IETF draft September 1 | We already verify signatures and need to know exactly what that verification establishes | Cross-implementation test vectors, reason codes, bounded key-cache tests | Most direct Worker improvement |
| **3. Crawl4AI** | 0.9.3, August 31: PDF/Docker security fixes | Our evidence can become incomplete when a tool extracts an article | Extraction fixtures, evidence-retention checks, side-by-side viewer | Best test of whether the article's proof survives retrieval |
| **4. Cap** | Standalone 3.1.11, September 4: cheaper verification of site secrets | Newsletter verification and failure reporting remain open | Signup outcome ledger, challenge benchmarks, recovery tests | Most direct reader-facing reliability study |

All four have a real event in the requested window. The date is a reason to inspect the project; it is not proof that every feature proposed for testing arrived in that release. Exact versions, commits, source rationales, and issue states are in the [evidence ledger](02-evidence-ledger.md).

## 1. Promptfoo: can an evaluation tool preserve citation evidence?

**Working Radar title:** OSS Radar #07: Promptfoo's New Traces, Tested Against AI Citation Evidence.

Promptfoo's August 26 release added test-case roots, target spans, OpenTelemetry GenAI alignment, and more detailed accounting. These changes make it a timely project to judge on whether an engineer can reconstruct a result. The [release notes](https://github.com/promptfoo/promptfoo/releases/tag/0.122.1) establish the changes; [the pinned tracing implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts) shows the evaluation structure.

There is already a concrete finding to pursue. In 0.122.2, the [OpenRouter adapter](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts) builds a normalized response with answer text, usage, cache state, an estimated cost, and finish reason. Its return object omits provider citation fields. Our [offline probe](repro/README.md) executed that module with a synthetic response: the input had one citation URL and one annotation for that same URL; the normalized result exposed neither. Answer text survived. Imported dependencies were mocked, so this establishes the module's return shape, not installed-package behavior or a live Perplexity result.

The native Perplexity route also needs a cost check. Its [calculator](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/perplexity.ts) computes token charges; [Perplexity's pricing](https://docs.perplexity.ai/docs/getting-started/pricing) also includes request fees for Sonar. The OpenRouter route is separate and must be reconciled against that gateway's actual charge. A token estimate is insufficient as the experiment's bill.

**Maintainer thesis:** one open evaluation tool can compare models and inspect failures. **Rival explanation to test:** the framework coordinates useful runs, but provider normalization and scoring still require substantial project-specific work before its results can support a citation audit. This is a test of the framework's fit, not a claim that a generic evaluator promises to measure all citations.

**One-week experiment.** First rerun the adapter finding against the installed release with a mock HTTP endpoint. Add a thin capture layer that retains the original response, returned source URLs, explicit answer citations, trace IDs, cache status, and charge provenance. Then run 12 questions about small-site analytics and agent access, two prompt forms, three fresh repetitions: **72 calls through one retrieval stack**. Compare the unmodified and repaired adapter on the same retained responses, avoiding a second paid run just to test normalization.

This develops [TASK-0132](../../../../../docs/tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md), which already prioritizes Trellner. Its [September 2 report](https://trellner.com/reports/manufactured-sources-behind-ai-recommendations/) sampled two Perplexity tiers through OpenRouter; those tiers are not independent search systems. Adopt its inspectable call-level records while checking citation units, source support, failed lookups, and repeated trials. Our earlier [audit](../agent-native-lane/02-trellner-manufactured-sources.md) is a starting record, not proof that every criticism still holds today.

**Metrics and artifacts.** Measure raw-to-normalized field retention, supported claims, preserved qualifications, unavailable evidence, source-set variation, failed calls, and actual cost per completed answer. Publish JSONL, the question set, method, scripts, and an interactive answer/source comparison. A model-generated score needs human review; a low-popularity domain is not a low-quality source.

**Engineering continuation:** How I Measure AI Citations Alongside Cloudflare Requests. Build an answer-side record that can be compared with existing request observations without pretending that a timestamp match proves causation. The result can later support the [controlled credibility experiment](../engineering-credibility/02-experiments.md); the first week does not execute or replace that full study.

**Decision gate.** Choose Promptfoo if a thin adapter makes the run auditable and remains simpler to maintain than a small purpose-built runner. If the study needs extensive changes to the framework, use the simpler runner and make that the Radar verdict. A null citation result for gkoreli.com remains a valid outcome.

## 2. Cloudflare Web Bot Auth: what does a verified request establish?

**Working Radar title:** OSS Radar #07: Cloudflare Web Bot Auth, Tested Against Signed Requests.

August's fixes are unusually relevant to a site that already records verified signatures. The Rust verifier gained checks for expired signatures on [August 13](https://github.com/cloudflare/web-bot-auth/pull/125) and future creation times on [August 18](https://github.com/cloudflare/web-bot-auth/pull/127). The [September 4 commit](https://github.com/cloudflare/web-bot-auth/commit/fe52630a2c20d248b7e84c132a94d3486ae6a725) changed directory key selection. The [September 1 IETF document](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/00/) is an Internet-Draft, not an RFC.

The blog's [current verifier](https://github.com/gkoreli/blog/blob/935abf29de1a755d2e278f90d4794c11d18a6a43/packages/analytics/src/webbotauth.ts) already checks validity times, selects Ed25519 keys by thumbprint, keys its cache by directory and key ID, and accepts documented legacy forms. There is no basis here to say it shares those upstream Rust defects. The useful question is conformance and operating policy across implementations.

**Maintainer thesis:** signed requests offer an identity mechanism that does not depend on a User-Agent claim. **Rival explanation:** crypto verification is only one part of the result; directory trust, freshness, replay policy, compatibility, and cache behavior determine what an operator may safely infer.

**Meaning of the limit:** a task's trigger and its answer's citations are separate facts. A person can commission a scheduled task; the timer starts a later run, and the answer may cite the article. The verifier cannot recover those events from signer identity alone. This is a boundary of its stated purpose, not a missing promise to detect people. [Prior art and measurement model](04-trigger-provenance-and-ai-citations.md).

**One-week experiment.** Run the same local signature vectors through the blog verifier and the pinned Cloudflare implementations. Vary time windows, key rotation, signed components, signature-agent forms, and directory failures. Separately exercise duplicate-request policy. A replayed valid signature can still pass cryptographic verification; the draft makes replay prevention a deployment concern.

Record verification outcome and reason, key fetches, cold/warm latency, and cache behavior. Reuse retained public captures where sufficient material exists; label reconstructed fixtures and fixed test clocks. Inspect synthetic controls first, then collect a small, explicitly bounded observation window. Do not wait for naturally arriving signed traffic to produce every test case.

**Artifacts and code.** Publish a conformance matrix readers can rerun, a reason-code explorer, and signature/key-directory fixtures. Improve the Worker's reason codes or tests only where disagreement exposes a real gap. Avoid adding D1 writes to every request merely to collect nonce history for an article.

**Engineering continuation:** What My Cloudflare Worker Can Verify About AI Agents. This develops the existing signed-agent article in the [agent-native worklist](../../../../../docs/folders/FLDR-0008.md); it should not become a duplicate of the header study. Keep verification, declared purpose, observed requests, and answer citations distinct.

**Decision gate.** Prefer this option if the conformance pass finds a material operating-policy decision or a reproducible disagreement. If the implementations agree and the blog already handles the relevant paths, publish the vectors as maintenance evidence and keep the Radar issue focused elsewhere.

## 3. Crawl4AI: does extracted Markdown retain the proof?

**Working Radar title:** OSS Radar #07: Crawl4AI 0.9.3 and the Evidence a Research Crawler Must Preserve.

Crawl4AI's [August 31 release](https://github.com/unclecode/crawl4ai/releases/tag/v0.9.3) is a security release. Its [pinned changelog](https://github.com/unclecode/crawl4ai/blob/4bcd5fa8a56000ce103dd499e8ecdff2439f3e9c/CHANGELOG.md) describes PDF-processing and Docker-viewer fixes. That is the timely reason to review the research-crawler workflow. Markdown generation itself predates this release.

The [generator](https://github.com/unclecode/crawl4ai/blob/4bcd5fa8a56000ce103dd499e8ecdff2439f3e9c/crawl4ai/markdown_generation_strategy.py) returns raw Markdown, Markdown with citation markers, references, and filtered Markdown through separate paths. That makes the output chosen by an integrator consequential. Converting a hyperlink into a citation marker does not test whether the linked document supports a claim.

**Maintainer thesis:** crawling and structured extraction make the web useful to model workflows. **Rival explanation:** useful compression can remove the conditions that make an engineering number true, so a compact result needs an evidence-retention test.

**One-week experiment.** Freeze six owned articles and their relevant artifacts. Compare Crawl4AI's raw and filtered outputs with the blog's authored Markdown. Prelabel the numerical result, denominator, date/window, qualification, and evidence URL for each chosen claim. Measure exact retention and broken links before adding a model. Then, if useful, run a small supplied-source question set to see whether extraction differences change supported answers. This tests the named extraction paths; it says nothing about which internal extractor ChatGPT uses.

Use locally served fixtures for the PDF and rendering checks. Keep the scope on safe retrieval and preservation of evidence, rather than turning the article into an unrelated security survey.

**Artifacts and code.** Publish source/extracted pairs, a claim-element matrix, and a side-by-side viewer that highlights missing qualifiers and evidence links. Add a build-time check for the blog's own machine-readable representations. Reuse existing Markdown, citation, and typed-link endpoints; do not build them again.

**Engineering continuation:** How I Test Whether AI Tools Preserve My Articles' Evidence. This complements the planned content-negotiation observations: one study tests what a representation contains, while the other measures which representation a client requests.

**Decision gate.** Choose this if extraction exposes a concrete presentation or artifact-access defect. If the authored Markdown already preserves everything and the other outputs add no useful workflow, document that result and avoid adding a crawler dependency to production. Inspect the pinned licence's extra attribution clause before distributing a runnable Crawl4AI package; do not describe it as an unmodified Apache licence.

## 4. Cap: who pays for newsletter bot protection?

**Working Radar title:** OSS Radar #07: Cap's September Release, Tested on a Newsletter Signup.

Cap's [September 4 release](https://github.com/tiagozip/cap/releases/tag/standalone%403.1.11) merged [PR #308](https://github.com/tiagozip/cap/pull/308), replacing expensive password hashing for high-entropy site secrets with SHA-256. The maintainer-reported timing and memory figures are leads to reproduce, not our measurements. The [verification code](https://github.com/tiagozip/cap/blob/e02138579482c711ee0bb79c7be3486fe0bf3e84/standalone/src/siteverify.js) validates the secret, upgrades valid legacy hashes, consumes the response token through getdel, and checks expiry.

This fits an owned failure. The [newsletter worklist](../../../../../docs/folders/FLDR-0010-newsletter-reliability-and-bot-protection-worklist.md) records Siteverify HTTP 400 with invalid-input-secret and incomplete failure reporting. That observation does not establish that Turnstile rejected a person as a bot. Repairing the current credential/deployment path remains necessary regardless of the CAPTCHA choice.

**Maintainer thesis:** proof of work and instrumentation can make abuse expensive with little reader effort. **Rival explanation:** the system moves costs and failure modes between reader hardware, verification servers, and token storage; the simplest adequate newsletter control may cost less to operate.

**One-week experiment.** Compare a repaired Turnstile staging path, Cap standalone, and a minimal rate-limited double-opt-in baseline. Use owned test forms and synthetic addresses. Measure challenge completion, server verification cost, token reuse, failure categories, and recovery. Exercise malformed and expired tokens as well as success. Treat desktop throttling or mobile emulation as such; they are not measurements of phone battery use or real-reader conversion.

**Artifacts and code.** Publish a signup state/outcome table, reproducible challenge fixtures, server cost results, and a small challenge/failure demo. Improve the newsletter's durable outcome records and error handling. Cap's default standalone service uses Bun and external storage; it is not a drop-in Cloudflare Worker replacement. Inspect that operating cost before adopting it.

**Engineering continuation:** How I Made Newsletter Signup Failures Observable and Recoverable. Develop the existing unpublished newsletter investigation rather than starting a competing article.

**Decision gate.** Choose Cap only if its measured benefit justifies the extra service or a carefully tested integration. A valid outcome is keeping Turnstile and fixing the surrounding system. Signup throughput is not evidence of fewer spam subscriptions, and synthetic trials are not a conversion study.

## What makes these articles worth publishing

Each Radar issue needs a project verdict and an inspectable experiment. Its engineering continuation needs a new result from operating or changing the blog. The same initial evidence may support both, but the second article must answer a different question.

The most useful first artifact is an explorable evidence record: select a case, inspect the input, see the output, and rerun the check. Build it with the site's existing web components, with a static table and downloadable data beneath it. An animation can explain the mechanism; it cannot stand in for measured results.

For Promptfoo, use a proposed $20 incremental API ceiling, not a claim that a consumer subscription includes API calls. Run a short billing preflight, preserve actual charges and retries, then stop within the budget. The [experiment plan](03-experiment-plan.md) separates exploratory citation sampling, controlled evidence tests, and organic discovery. Avoid another large D1 investigation: use saved captures and a bounded export, and serve published research results from static files.

Start with Promptfoo. It respects the existing research priority, already has a bounded local finding, and can produce the answer-side evidence needed by several future engineering articles.

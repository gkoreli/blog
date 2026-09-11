# OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?

Promptfoo's evaluation runner can keep citation evidence through its database and JSON exports, provided we capture it explicitly. On September 8, we tested version 0.122.2 using local servers and made-up AI responses. Promptfoo's built-in connector for OpenRouter left the structured citation fields out of its evaluation summary; the transport cache retained them. A custom provider also preserved successful and failed attempt records after a database restart. This makes Promptfoo worth trying for citation evaluation, with a tested capture layer. No request went to OpenRouter or any model service. [Original comparison](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md); [failure and export checks](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/README.md).

- **The adapter decides what reaches the evaluator.** Answer text survived all three original paths; structured citations survived the cache and custom capture.
- **The repair survives more than a successful response.** Ten controlled cases retained every attempt through the library exporter and a fresh CLI process. One local trace also kept the explicit link to its saved attempt.
- **Preservation is the first step in citation evaluation.** Counting an answer's references, checking their support, and explaining what triggered a run need different records.

## What Promptfoo is building

Promptfoo is a command-line tool and library for testing AI applications, with an [MIT-licensed open-source implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/LICENSE). You supply test cases, choose models or an application to call, and define checks. It runs the cases and lets you compare results. The [project overview](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md) also puts adversarial testing and code review within its scope.

Its public purpose is to help teams ship secure, reliable AI applications. Founders Ian Webster and Michael D'Angelo [describe a shift](https://www.promptfoo.dev/blog/promptfoo-joining-openai/) from systematic application testing toward the security and behavioral risks that blocked deployment. That explains why the project reaches beyond comparing answers.

| Part | What it does | Evidence |
|---|---|---|
| Evaluations | Runs chosen cases against providers or applications and checks their responses | Our [installed evaluation](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md) exercises this path |
| Red teaming | Generates adversarial cases, applies attack strategies, and tests a target application | The [architecture](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md) defines the parts; the [run implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/redteam/shared.ts) connects generation to evaluation |
| Code scanning | Reviews code changes for LLM-related security risks and supplies findings in the development workflow | The [scanner implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/codeScan/scanner/index.ts) calls a scan service; the [GitHub Action](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/src/main.ts) handles the review workflow |

August's work strengthened the records behind those tests. The [August 26 release](https://github.com/promptfoo/promptfoo/releases/tag/0.122.1) added per-test roots, target spans, agent telemetry integrations, and fuller token accounting. The [August 28 scanner-action release](https://github.com/promptfoo/promptfoo/releases/tag/code-scan-action-0.2.0) hardened its installation and dependencies. These are different release tracks. Our installed runner came from the separate [0.122.2 release](https://github.com/promptfoo/promptfoo/releases/tag/0.122.2), also published August 28. The scanner itself predates August: its [engineering introduction](https://www.promptfoo.dev/blog/building-a-security-scanner-for-llm-apps/) appeared in December 2025.

[Promptfoo 0.123.0](https://github.com/promptfoo/promptfoo/releases/tag/0.123.0) shipped on September 10. The experiments here remain pinned to 0.122.2; we have not rerun them on the newer release.

I read that work as an effort to make AI testing part of the normal development process: run a test, inspect the execution, locate a failure, and check a repair. Traces and accounting help explain what happened inside a test. They do not make its judgments correct or its evidence complete.

The project now [identifies itself as part of OpenAI](https://www.promptfoo.dev/about/). Its founders' March announcement commits to maintaining open-source red teaming, scanning, and evals across providers. [OpenAI's announcement](https://openai.com/index/openai-to-acquire-promptfoo/) sets out an additional direction: integrate testing, remediation, reporting, and traceability into Frontier. That is a stated product plan; these sources do not establish that the promised integration has shipped.

The distinction matters for adoption. The MIT runner gives us inspectable code and an extension interface. A connected feature can still depend on a service: the scanner's [default API host](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/action.yml) is Promptfoo's cloud. We need to judge the specific path we use. For this blog, the relevant bet is whether its reusable evaluation and execution records can support our citation study; the citation pipeline remains work we must build and verify.

## Citation analytics needs the answer

Our [blog analytics](/first-party-analytics-for-a-personal-blog) can record requests that reach the site. A citation exists in an answer somewhere else. Bringing those observations together starts with preserving what each system can see.

AI citations are a topic; counting them is analytics, and checking whether their sources support an answer is evaluation. There is already publisher-facing prior art. Microsoft's [AI Performance preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview), announced February 10, reports citation activity across its supported AI surfaces and selected partners. Its coverage is defined by that product. It does not audit every cited claim.

The opportunity for this blog is to publish inspectable cases: the question, captured answer, cited source, review, and records that connect them. We can then compare those cases with our request observations where a defensible connection exists. Whether the blog appears in the answers remains an open result. The capture method should still help another engineer if it does not.

## Where provider evidence enters the result

Promptfoo's [custom-provider interface](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md) lets an operator bring an application into the runner. For this study, that division is useful: reuse the evaluation machinery and retain provider-specific evidence explicitly.

The adapter and experiment sections are for engineers choosing or implementing this path. The pinned [OpenRouter provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts) sends the request through a cache-aware transport, then builds a smaller response from answer text, usage, and completion information. It does not copy the fixture's citation list or answer annotations into that response. The evaluator receives the smaller object.

The shared [response contract](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts) allows both `raw` and arbitrary metadata. This changes the adoption question. We need to test the chosen adapter and export path, rather than assume either that the whole framework preserves everything or that it cannot preserve the evidence at all.

## What survived the installed-package check

The installed experiment located the omission and tested a repair with the same response. It used one invented payload containing one distinct source URL, represented in a citation list and an annotation. No live model answered the question.

We ran the built-in provider against a local HTTP server, repeated the evaluation with caching enabled, then sent the same payload through a custom capture provider. Each evaluation used the public summary API and a text assertion. The script serialized the summaries and read them back before checking the fields. [Runnable probe and saved outputs](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md).

| Observed path | New local requests | Answer text | Citation-list entries retained | Annotations retained |
|---|---:|---|---:|---:|
| Built-in provider, fresh summary | 1 | Preserved | 0 | 0 |
| Built-in provider, cached summary | 0 | Preserved | 0 | 0 |
| Custom capture provider, fresh summary | 1 | Preserved | 1 | 1 |

The [built-in transport cache](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/transport-cache-entry.json) retained the full parsed fixture, including both citation fields. The [custom summary](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/custom-capture.json) retained the exact decoded response text, its hash, the mock request ID, and the structured fields. The omission occurs between the adapter and the summary; the evidence remains available in the cache.

The repair uses fields Promptfoo already accepts. This is the return object from the [tested capture provider](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/probe-installed.ts), after reading the response text and parsing the fixture:

```typescript
return {
  output: parsed.choices[0].message.content,
  raw,
  metadata: { evidence: {
    providerCitations: parsed.citations,
    answerAnnotations: parsed.choices[0].message.annotations,
    requestId: response.headers.get('x-request-id'),
    responseSha256: sha256(raw),
    providerReportedUsage: parsed.usage,
  } },
};
```

This changes what the runner can retain without changing the answer assertion. That original prototype handles the successful fixture only; its saved usage fields are invented inputs, not a billing record.

The fixture's repeated URL is one source, not two lost citations. Its annotation offsets are not validated, and the text assertion checks transport rather than truth. Tracing, database persistence, CLI export, streaming, failure handling, and live billing were outside that original check. The next experiment covers several of those gaps. The [recorded result](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/result.json) keeps those limits beside the measurements.

For a real answer, missing citation fields would mean we could not assess citations through that field. They would not mean the model cited nothing. The controlled fixture lets us establish an omission because we know what entered the adapter.

## What survived failures, a restart, and tracing

The capture layer now preserves failed attempts as well as successful answers. We extended the experiment to ten controlled cases on a Mac, saved each response before parsing it, and checked the same records in the public summary, Promptfoo's JSON exporter, and a separate CLI process reopening the database. All ten retained the complete provider response used by our capture layer. [Method and recorded results](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/README.md).

| Condition | Evaluations | HTTP attempts | What the exported record retains |
|---|---:|---:|---|
| Successful responses | 4 | 4 | The answer plus present, absent, empty, or null citation fields |
| Five failure conditions | 5 | 5 | Malformed JSON, HTTP 429, an error envelope, no answer, and truncation |
| HTTP 429 → success | 1 | 2 | Both attempts, their statuses, and the final answer |

Those counts measure record retention. Five evaluations passed the text assertion; five deliberately failed. A successful export of an error is a useful result for this workload. It keeps a later analyst from quietly excluding a failed request or treating it as an answer with no citations. The [retry export](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/retry-cli-export.json) shows both attempts after restart.

Local tracing also did useful work. The full-success case produced three spans: the test case, provider target, and assertion. Our capture saved the evaluation ID, test-case ID, and `traceparent` supplied by Promptfoo. They matched the [exported trace](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/full-cli-export.json), including the exact target span, through both exporters. That is an observed connection between records, rather than a guess from matching timestamps. The pinned [tracing implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts) explains how the runner supplies that context.

A trace still describes only the participating system. We did not capture a remote provider's retrieval history, and the two retry attempts live in our metadata rather than separate spans. The fixture's reported cost remains invented. These checks establish local retention and joins; live response shape, source review, and billing remain untested.

## Who started the task, and what did the answer cite?

An assistant can use a blog on someone's behalf without that person visiting the site. A person can ask for an article now or commission a report that runs every week. Both serve a human goal. The immediate trigger differs, and neither tells us what the answer cited.

That distinction has prior art. W3C's [provenance model](https://www.w3.org/TR/2013/REC-prov-dm-20130430/) records what started an activity separately from who bears responsibility for it. A Web Bot Auth [use-case draft](https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4) likewise questions the human/bot binary. The [protocol draft](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6) leaves human authentication and delegation outside its scope.

A citation belongs to the answer. We need the captured output to observe it, then the source to check whether it supports the claim. Even that leaves a further question: did the model rely on the source? [Research on citation faithfulness](https://arxiv.org/abs/2412.18004) distinguishes actual reliance from a reference that merely agrees with the answer.

| Question | Record that can answer it | What remains unknown |
|---|---|---|
| What started this run? | A captured submission or scheduler event linked to the run | A website request alone does not establish that event |
| Which client made the request? | A verified request signature and its key identity | Human authorization, the immediate trigger, and the later answer |
| Did the answer cite the article? | The captured answer and its citation fields | Whether a fresh request reached the article's origin |
| Does the source support the claim? | A review of the claim against the retained source | Whether the model actually relied on that source |

For controlled runs, we can preserve the submission or scheduler event and link it to the captured output. A receiving website usually lacks that history. The [research artifact](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md) separates task authority, trigger, URL selection, request identity, content access, citation, and source review. Promptfoo can organize records supplied to it; the trace cannot invent the missing ones.

## What still needs code

The remaining work is in the live capture and source review. The local tests now cover response variants, failed attempts, a bounded retry, database export, and one trace join. They do not establish what a live service returns or what its citations support.

Our [capture provider](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/capture-provider.ts) saves request text and each decoded response before selecting fields. It records missing citation fields separately from empty lists and leaves charge unknown when the response does not expose it. Even a provider-reported charge needs reconciliation with its billing record. Source review needs its own claim boundaries and support rubric. Earlier work such as [ALCE](https://aclanthology.org/2023.emnlp-main.398/) gives citation evaluation a research basis; a returned URL alone is not a support judgment.

The [proposed measurement contract](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md) keeps counts honest. Citation presence uses assessable answers as its denominator and reports observation coverage alongside it. Support uses reviewed claim–citation relationships. Requests, unique URLs, citation occurrences, and people never become interchangeable units. A capture hash helps detect changed bytes; it does not authenticate the provider or make an answer true.

Collection also needs a known network boundary. Our first attempt encountered an unexpected telemetry request despite the opt-out. The final probe blocked one such POST before transmission, matching the pinned [telemetry implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts) and the [upstream report](https://github.com/promptfoo/promptfoo/issues/9968), still open at publication. This does not establish prompt disclosure. It does mean the opt-out alone was insufficient for this restricted local run. The method records the interruption and the guard.

The larger adoption test is whether these additions remain a small capture layer while Promptfoo supplies useful execution and review machinery. A direct runner remains a reasonable alternative if maintaining the integration means rebuilding those parts ourselves.

## The next decision

Promptfoo is worth the next bounded trial for this blog's citation-evaluation workload. The tested interface can retain evidence, and the built-in cache gives useful counterevidence to the strongest loss claim. Anyone who needs complete records from the built-in OpenRouter summary should first add and verify capture on the route they will use.

The local trace and export checks have passed. The next test is a live preflight that retains the request, answer, exposed citation fields, and charge provenance, then checks the cited source against the answer. A service that does not expose the needed evidence, or an integration that forces us to rebuild most of the runner, would change this decision. The [worklist](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md) keeps that test separate from the larger citation-frequency study.

Try Promptfoo when you want its test runner, assertions, and result inspection enough to maintain explicit capture. If you need a complete citation archive from an unmodified adapter, wait or use a direct runner you can audit. Keep the captured records independently replayable; wider adoption depends on the live evidence.

---

## Sources & Evidence

Dates are publication dates unless marked **checked**. Pinned Promptfoo code and documentation refer to the tested 0.122.2 release. Our artifacts record a synthetic-response experiment; the standards and studies supply concepts and methods, not measurements of this blog's citation rate.

### Our experiments and proposed pipeline

| Claim | Source and why it matters | Date |
|---|---|---|
| The installed runner omitted citation fields in its built-in summary; custom capture retained them | [Installed experiment method](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md) — Records the package identity, local setup, commands, outputs, and exclusions behind the verdict. | Sep 8, 2026 |
| Three fixture evaluations made two local HTTP requests and no live model calls | [Recorded measurements](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/result.json) — Keeps retention counts, zero API spend, and the blocked request beside their limits. | Sep 8, 2026 |
| The built-in cache retained the complete parsed fixture | [Saved cache entry](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/transport-cache-entry.json) — Bounds the omission to the tested summary rather than every Promptfoo store. | Sep 8, 2026 |
| Custom raw response text and evidence metadata survived summary export | [Saved custom summary](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/custom-capture.json) — Lets a reader inspect the preserved fields directly. | Sep 8, 2026 |
| The capture provider uses existing response fields and verifies serialized results | [Runnable installed probe](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/probe-installed.ts) — Shows the repair, the equality checks, and the network guard without hiding them behind prose. | Sep 8, 2026 |
| Triggers, request identity, citations, and source review require different records | [Trigger and citation research](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md) — Maps each question to an observer and records the prior art and unrun tests. | Sep 8, 2026 |
| Citation presence and source support need explicit units and missing-data states | [Proposed measurement contract](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md) — Makes the planned denominators inspectable without presenting them as deployed analytics. | Sep 8, 2026 |
| Ten controlled cases retained final response text and all eleven attempts across exports | [Capture and export experiment](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/README.md) — Records the failure matrix, database restart, installation difference, and the tested boundary. | Sep 8, 2026 (PDT) |
| The retry's failed and successful attempts survived the restarted CLI export | [Saved retry export](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/retry-cli-export.json) — Lets a reader check both attempts rather than relying on an aggregate pass count. | Sep 8, 2026 (PDT) |
| The capture provider records field states and attempts before deriving the answer | [Capture implementation](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/capture-provider.ts) — Makes absent/empty states and charge limitations inspectable. | Sep 8, 2026 (PDT) |
| A saved attempt links to the local trace by explicit IDs | [Saved full export with trace](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/full-cli-export.json) — Contains the matching evaluation, test-case, trace, and target-span identifiers. | Sep 8, 2026 (PDT) |
| The runner supplies test roots and target context | [Evaluator tracing implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts) — Explains the local trace path exercised by the continuation. | Sep 8, 2026 (checked) |

### Promptfoo: design, releases, and purpose

| Claim | Source and why it matters | Date |
|---|---|---|
| The inspected implementation is MIT-licensed | [Promptfoo license](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/LICENSE) — Establishes the open-source terms for the code inspected here. | Sep 8, 2026 (checked) |
| The project includes evaluation, red teaming, and code review | [Pinned project overview](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md) — Defines the application-testing scope against which this workload is judged. | Sep 8, 2026 (checked) |
| Founders describe the move toward application security and commit to continued open-source development | [Founders' announcement](https://www.promptfoo.dev/blog/promptfoo-joining-openai/) — Supplies their stated purpose and cross-provider commitment rather than an inferred roadmap. | Mar 9, 2026 |
| Red teaming combines plugins, attack strategies, and targets | [Red-team architecture](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md) — Defines the adversarial-testing workflow; it was inspected, not exercised in this experiment. | Sep 8, 2026 (checked) |
| The red-team run connects case generation to evaluation | [Red-team run implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/redteam/shared.ts) — Checks the documented workflow against shipped orchestration code. | Sep 8, 2026 (checked) |
| Code scanning calls an agent service to perform a scan | [Scanner implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/codeScan/scanner/index.ts) — Shows the service dependency behind the scanner's local entry point. | Sep 8, 2026 (checked) |
| The GitHub Action runs scanning and handles review output | [Scanner action implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/src/main.ts) — Locates code review within the development workflow. | Sep 8, 2026 (checked) |
| The runner added tracing and fuller usage accounting in August | [Promptfoo 0.122.1](https://github.com/promptfoo/promptfoo/releases/tag/0.122.1) — Explains why execution records are relevant to this month's adoption question. | Aug 26, 2026 |
| The experiment installed runner version 0.122.2 | [Promptfoo 0.122.2](https://github.com/promptfoo/promptfoo/releases/tag/0.122.2) — Fixes the tested release separately from the scanner-action track. | Aug 28, 2026 |
| Promptfoo 0.123.0 shipped after the tested release | [Promptfoo 0.123.0](https://github.com/promptfoo/promptfoo/releases/tag/0.123.0) — Marks the newer release separately from the installed experiments, which remain pinned to 0.122.2. | Sep 10, 2026 |
| The scanner action received installation and dependency hardening | [Scanner action 0.2.0](https://github.com/promptfoo/promptfoo/releases/tag/code-scan-action-0.2.0) — Distinguishes recent maintenance from the scanner's earlier introduction. | Aug 28, 2026 |
| The scanner's engineering introduction predates August | [Building a security scanner for LLM apps](https://www.promptfoo.dev/blog/building-a-security-scanner-for-llm-apps/) — Provides the original design account and prevents a false launch chronology. | Dec 16, 2025 |
| Promptfoo identifies itself as part of OpenAI | [Promptfoo about page](https://www.promptfoo.dev/about/) — Records the project's current affiliation without inventing an acquisition closing date. | Sep 10, 2026 (checked, PDT) |
| OpenAI announced a plan to integrate Promptfoo capabilities into Frontier | [OpenAI acquisition announcement](https://openai.com/index/openai-to-acquire-promptfoo/) — Sources the buyer's stated direction; it does not verify completion of that integration. | Mar 9, 2026 |
| The scanner action defaults to Promptfoo's cloud API | [Scanner action configuration](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/action.yml) — Shows why an open-source entry point does not make every feature an offline workflow. | Sep 8, 2026 (checked) |
| An application can implement Promptfoo's provider interface | [Custom-provider documentation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md) — Establishes the supported extension point used by the prototype. | Sep 8, 2026 (checked) |
| The OpenRouter adapter normalizes the provider response | [OpenRouter provider implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts) — Locates the smaller response object that the evaluator receives. | Sep 8, 2026 (checked) |
| Provider responses may carry raw data and arbitrary metadata | [Provider response contract](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts) — Explains why preserving the fixture required capture code without a framework fork. | Sep 8, 2026 (checked) |
| The telemetry opt-out can still initiate a disabled-event beacon | [Telemetry implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts) — Explains the attempted request recorded by the guarded probe. | Sep 8, 2026 (checked) |
| An upstream user reported the opt-out beacon; the issue remained open | [Promptfoo issue #9968](https://github.com/promptfoo/promptfoo/issues/9968) — Adds an independently reported failure path, checked against code and our installed run. | Sep 10, 2026 (checked, PDT) |

### Citation analytics and attribution research

| Claim | Source and why it matters | Date |
|---|---|---|
| Publishers already have a product that reports AI citation activity | [Bing AI Performance preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) — Bounds our novelty claim and shows the limits of a provider-defined citation view. | Feb 10, 2026 |
| An activity's start and an agent's responsibility are separate provenance relations | [W3C PROV-DM](https://www.w3.org/TR/2013/REC-prov-dm-20130430/) — Provides a stable vocabulary for task history without collapsing it into a human/bot label. | Apr 30, 2013 |
| The human/bot binary is contested in bot-authentication design | [Web Bot Auth use-case draft, Appendix A.4](https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4) — Records a concrete prior argument; this individual draft is not an agreed standard. | Apr 1, 2026 |
| The bot-signature draft leaves human authentication and delegation out of scope | [HTTP Message Signatures for automated traffic, §4.6](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6) — Bounds what verified request identity can establish; the document remains a draft. | Sep 1, 2026 |
| A supporting citation does not establish the model's actual reliance on it | [Wallat et al., Correctness is not Faithfulness in RAG Attributions](https://arxiv.org/abs/2412.18004) — Separates support review from causal attribution; its tested systems do not establish 2026 model-wide rates. | Dec 23, 2024 |
| Citation quality can be evaluated separately from answer correctness | [Gao et al., Enabling Large Language Models to Generate Text with Citations](https://aclanthology.org/2023.emnlp-main.398/) — Provides the ALCE research basis for source-support evaluation, not a score for our unrun study. | Dec 2023 |

### Research record

The [worklist](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md) links the experiments, research notes, and open work. The [verbatim shaping prompts](https://github.com/gkoreli/blog/blob/main/packages/blog/prompts/oss-radar-07-promptfoo.prompts.md) are preserved for this issue at the author's request. The methods record the runtimes, dependency lock, scripts, results, and failed setup attempts. Codex executed the experiments for this article; Goga supplied the workload and editorial direction. A [partial research footprint](/oss-radar-07-promptfoo/prompts#research-footprint) records 43,272,331 tokens across eight recovered Codex sessions. The original ChatGPT research and the mixed analytics/publication conversation are excluded. The [accounting method and exclusions](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/19-research-footprint.md) explain the measured portion; human hands-on time remains unmeasured.

---

## Glossary

| Term / Claim | Source | Date |
|---|---|---|
| **Provider adapter:** code that calls a model or application and returns the fields Promptfoo evaluates. | [Custom-provider interface](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md) | Sep 8, 2026 (checked) |
| **Evaluation:** running defined cases and checking the returned answer or behavior. | [Promptfoo overview](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md) | Sep 8, 2026 (checked) |
| **Red teaming:** testing a target with generated adversarial cases and attack strategies. | [Red-team architecture](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md) | Sep 8, 2026 (checked) |
| **Raw response:** the response text retained by our capture provider before selecting answer and citation fields. | [Tested capture implementation](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/probe-installed.ts) | Sep 8, 2026 |
| **Citation analytics:** counts and trends over observed citations, with a declared coverage boundary. | [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) | Feb 10, 2026 |
| **Source list / answer citation:** provider-returned sources and references attached to an answer are distinct fields; a source entry alone need not be an answer citation. | [Our proposed measurement contract](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md) | Sep 8, 2026 |
| **Trigger / responsibility:** the event starting an activity differs from the agent responsible for it. | [W3C PROV-DM](https://www.w3.org/TR/2013/REC-prov-dm-20130430/) | Apr 30, 2013 |
| **Verified request identity:** a signed request can identify its key holder; it does not establish a fresh human action or a citation. | [Bot-signature draft, §4.6](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6) | Sep 1, 2026 |
| **Citation support:** whether a cited source supports the associated claim. | [ALCE](https://aclanthology.org/2023.emnlp-main.398/) | Dec 2023 |
| **Citation faithfulness:** whether the model actually relied on the cited source. | [Wallat et al.](https://arxiv.org/abs/2412.18004) | Dec 23, 2024 |

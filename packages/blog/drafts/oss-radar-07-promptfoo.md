# OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?

Promptfoo is a useful runner for checking cited AI answers when you capture the evidence and review the sources. On September 10, we ran Codex and Claude Code through our existing subscriptions. Both real answers survived Promptfoo 0.122.2's database and JSON exports. Claude's answer still misread a key number: 277 requests had been reclassified, but it called all 277 cloud-classified. The saved answer and tool records let us examine the mistake. [Experiment and records](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md); [source review](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md).

- **Real answers survived the evaluation pipeline.** A custom provider retained the final text and emitted CLI records through both JSON exporters, including a process reopening the database.
- **A citation can accompany a wrong claim.** Claude preserved the article's headline figures but changed their meaning in one sentence. The source review also caught an incorrect description of the classifier.
- **Capture depends on the adapter.** In a separate controlled test, the OpenRouter connector omitted supplied citation fields from its summary while its cache retained them. The runner can preserve evidence that its adapter supplies.

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

The MIT runner is inspectable and extensible, while some features still depend on a service: the scanner's [default API host](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/action.yml) is Promptfoo's cloud. That distinction gives the project two roles: a local evaluation runner you can extend, and an entry point to connected security services. Our citation experiment uses the former.

## Citation analytics needs the answer

Our [blog analytics](/first-party-analytics-for-a-personal-blog) can record requests that reach the site. A citation exists in an answer somewhere else. Bringing those observations together starts with preserving what each system can see.

AI citations are a topic; counting them is analytics, and checking whether their sources support an answer is evaluation. There is already publisher-facing prior art. Microsoft's [AI Performance preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview), announced February 10, reports citation activity across its supported AI surfaces and selected partners. Its coverage is defined by that product. It does not audit every cited claim.

For a publisher investigating an answer, the useful record is the question, answer, cited source, and a review of the associated claims. Request logs supply another observation when a connection can be established. They cannot reconstruct an answer that was never captured.

## Where provider evidence enters the result

Promptfoo's [custom-provider interface](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md) lets an operator bring an application into the runner. It separates the application call from the test runner, so an adapter can retain evidence specific to its provider.

The adapter and experiment sections are for engineers choosing or implementing this path. The pinned [OpenRouter provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts) sends the request through a cache-aware transport, then builds a smaller response from answer text, usage, and completion information. It does not copy the fixture's citation list or answer annotations into that response. The evaluator receives the smaller object.

The shared [response contract](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts) allows both `raw` and arbitrary metadata. An adapter can use those fields to retain the original response alongside the answer being evaluated. The export checks below test that path.

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

The fixture's repeated URL is one source, not two lost citations. Its annotation offsets are not validated, and the text assertion checks transport rather than truth. Tracing, database persistence, CLI export, streaming, failure handling, and live billing were outside that original check. The failure and export checks below cover several of those gaps. The [recorded result](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/result.json) keeps those limits beside the measurements.

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

A trace still describes only the participating system. We did not capture a remote provider's retrieval history, and the two retry attempts live in our metadata rather than separate spans. The fixture's reported cost remains invented. These controlled checks establish local retention and joins. The real CLI experiment below tests a different capture representation; neither experiment reconciles an invoice.

## Real answers through ChatGPT and Claude subscriptions

The same runner also preserved real answers from subscription-backed coding agents. We asked Codex and Claude Code to explain [what this blog measured about readers and bots](/how-i-separate-readers-from-bots-without-javascript), cite the measurements, and state what the comparison with Cloudflare established. Each client received the same question once, in a fresh session with web tools. Both finished, and both records survived a database restart. [Full question, answers, settings, and checks](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md).

| Client | Actual run | Preserved by Promptfoo | Source review |
|---|---|---|---|
| Codex CLI 0.153.4, GPT-6 Astra | One answer, seven emitted CLI events | Final answer, complete stdout, capture metadata | Kept the measured units and the article's limits |
| Claude Code 2.1.260, Opus 5 | One answer, 41 emitted CLI events; five WebFetch calls | The same fields through both exporters | Retained headline figures but changed the 277-request denominator |

Claude's answer said that 60 of 277 cloud-classified requests passed the navigation checks. The article says 277 requests were **reclassified in total**, and that 60 cloud-classified requests passed the checks. Those are different populations. Its earlier fetch summary called 277 the reclassified population correctly; the changed denominator appears in the final answer. The [reviewed source and answer](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md) let a reader check the difference.

The tool record exposed another mistake that the final answer did correct. One WebFetch summary turned the two-day measurement window into `00:00 through 06:00 UTC`. A later extraction restored September 4 00:00 through September 6 00:00. These are summaries produced by a model, not exact copies of page HTML. Keeping them alongside the final answer makes an extraction error distinguishable from an error still present in the answer. Claude's result also reports Haiku usage for the fetching workflow, beyond the named Opus model.

A ChatGPT or Claude subscription can supply these experiments through the official coding clients. [Codex supports ChatGPT sign-in](https://developers.openai.com/codex/auth/) and [scripted execution with saved authentication](https://developers.openai.com/codex/noninteractive/); [Anthropic's current notice](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) includes `claude -p` within subscription usage. We bought no API credits. Claude reported a list-price cost of $0.2654145; that field is not an observed subscription charge.

Promptfoo already has native integrations: its [Codex SDK provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openai/codex-sdk.ts) accepts saved login and retains a serialized turn; its [Claude Agent SDK provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/claude-agent-sdk.ts) supports subscription login with `apiKeyRequired: false`, retaining the final result and selected metadata. We inspected those paths. The experiment used a custom provider calling the installed CLIs so we could retain the entire emitted stdout, including intermediate tool records. It did not test the native SDK providers or capture raw service HTTP responses.

These two directed answers demonstrate a working capture and review method. The question supplied the article URL; the run does not measure organic discovery, rank the models, or prove that a fresh request reached our site. Promptfoo preserved the evidence needed to find the error. Source review supplied the judgment.

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

## Where Promptfoo leaves work to the operator

Promptfoo supplies execution, assertions, storage, and exports. The operator still has to choose what to capture and how to judge source support. Our real runs used no automatic correctness assertion: a successfully stored answer could still contain the errors found in review.

Our [capture provider](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/capture-provider.ts) saves request text and each decoded response before selecting fields. It records missing citation fields separately from empty lists and leaves charge unknown when the response does not expose it. Even a provider-reported charge needs reconciliation with its billing record. Source review needs its own claim boundaries and support rubric. Earlier work such as [ALCE](https://aclanthology.org/2023.emnlp-main.398/) gives citation evaluation a research basis; a returned URL alone is not a support judgment.

The [proposed measurement contract](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md) keeps counts honest. Citation presence uses assessable answers as its denominator and reports observation coverage alongside it. Support uses reviewed claim–citation relationships. Requests, unique URLs, citation occurrences, and people never become interchangeable units. A capture hash helps detect changed bytes; it does not authenticate the provider or make an answer true.

Collection also needs a known network boundary. Our first attempt encountered an unexpected telemetry request despite the opt-out. The final probe blocked one such POST before transmission, matching the pinned [telemetry implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts) and the [upstream report](https://github.com/promptfoo/promptfoo/issues/9968), still open at publication. This does not establish prompt disclosure. It does mean the opt-out alone was insufficient for this restricted local run. The method records the interruption and the guard.

The extra code in these experiments captures provider-specific records; Promptfoo handles the evaluation and persistence. That is a useful division when you need repeatable cases and comparisons. For a single answer you only want to save, a direct CLI script needs fewer parts.

## When to use Promptfoo

Use Promptfoo when you need repeatable tests, assertions, and saved results across models or applications, and can verify the adapter's capture behavior. Its extension interface and exporters preserved both controlled failures and real CLI answers in these tests. If you need citation checking with no capture code or source-review work, it does not supply that workflow by itself. For a one-off answer archive, use the CLI directly.

---

## Glossary & sources

Definitions and supporting evidence share one table. Dates are publication dates unless marked **checked**. Promptfoo code links refer to the tested 0.122.2 baseline. The experiment records distinguish controlled responses, real CLI output, and source review.

| Term or finding | Source and why it matters | Date |
|---|---|---|
| The installed runner omitted citation fields in its built-in summary; custom capture retained them | [Installed experiment method](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md) — Records the package identity, local setup, commands, outputs, and exclusions behind the verdict. | Sep 8, 2026 |
| Three fixture evaluations made two local HTTP requests and no live model calls | [Recorded measurements](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/result.json) — Keeps retention counts, zero API spend, and the blocked request beside their limits. | Sep 8, 2026 |
| The built-in cache retained the complete parsed fixture | [Saved cache entry](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/transport-cache-entry.json) — Bounds the omission to the tested summary rather than every Promptfoo store. | Sep 8, 2026 |
| Custom raw response text and evidence metadata survived summary export | [Saved custom summary](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/custom-capture.json) — Lets a reader inspect the preserved fields directly. | Sep 8, 2026 |
| Raw response: the response text retained by our capture provider before selecting answer and citation fields. | [Runnable installed probe](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/probe-installed.ts) — Shows the repair, the equality checks, and the network guard without hiding them behind prose. | Sep 8, 2026 |
| Triggers, request identity, citations, and source review require different records | [Trigger and citation research](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md) — Maps each question to an observer and records the prior art and unrun tests. | Sep 8, 2026 |
| Source list / answer citation: provider-returned sources and references attached to an answer are distinct fields; a source entry alone need not be an answer citation. | [Proposed measurement contract](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md) — Makes the planned denominators inspectable without presenting them as deployed analytics. | Sep 8, 2026 |
| Ten controlled cases retained final response text and all eleven attempts across exports | [Capture and export experiment](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/README.md) — Records the failure matrix, database restart, installation difference, and the tested boundary. | Sep 8, 2026 (PDT) |
| The retry's failed and successful attempts survived the restarted CLI export | [Saved retry export](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/retry-cli-export.json) — Lets a reader check both attempts rather than relying on an aggregate pass count. | Sep 8, 2026 (PDT) |
| The capture provider records field states and attempts before deriving the answer | [Capture implementation](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/capture-provider.ts) — Makes absent/empty states and charge limitations inspectable. | Sep 8, 2026 (PDT) |
| A saved attempt links to the local trace by explicit IDs | [Saved full export with trace](https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/full-cli-export.json) — Contains the matching evaluation, test-case, trace, and target-span identifiers. | Sep 8, 2026 (PDT) |
| The runner supplies test roots and target context | [Evaluator tracing implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts) — Explains the local trace path exercised by the continuation. | Sep 8, 2026 (checked) |
| The inspected implementation is MIT-licensed | [Promptfoo license](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/LICENSE) — Establishes the open-source terms for the code inspected here. | Sep 8, 2026 (checked) |
| Evaluation: running defined cases and checking the returned answer or behavior. | [Pinned project overview](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md) — Defines the application-testing scope against which this workload is judged. | Sep 8, 2026 (checked) |
| Founders describe the move toward application security and commit to continued open-source development | [Founders' announcement](https://www.promptfoo.dev/blog/promptfoo-joining-openai/) — Supplies their stated purpose and cross-provider commitment rather than an inferred roadmap. | Mar 9, 2026 |
| Red teaming: testing a target with generated adversarial cases and attack strategies. | [Red-team architecture](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md) — Defines the adversarial-testing workflow; it was inspected, not exercised in this experiment. | Sep 8, 2026 (checked) |
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
| Provider adapter: code that calls a model or application and returns the fields Promptfoo evaluates. | [Custom-provider documentation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md) — Establishes the supported extension point used by the prototype. | Sep 8, 2026 (checked) |
| The OpenRouter adapter normalizes the provider response | [OpenRouter provider implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts) — Locates the smaller response object that the evaluator receives. | Sep 8, 2026 (checked) |
| Provider responses may carry raw data and arbitrary metadata | [Provider response contract](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts) — Explains why preserving the fixture required capture code without a framework fork. | Sep 8, 2026 (checked) |
| The telemetry opt-out can still initiate a disabled-event beacon | [Telemetry implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts) — Explains the attempted request recorded by the guarded probe. | Sep 8, 2026 (checked) |
| An upstream user reported the opt-out beacon; the issue remained open | [Promptfoo issue #9968](https://github.com/promptfoo/promptfoo/issues/9968) — Adds an independently reported failure path, checked against code and our installed run. | Sep 10, 2026 (checked, PDT) |
| Citation analytics: counts and trends over observed citations, with a declared coverage boundary. | [Bing AI Performance preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) — Bounds our novelty claim and shows the limits of a provider-defined citation view. | Feb 10, 2026 |
| Trigger / responsibility: the event starting an activity differs from the agent responsible for it. | [W3C PROV-DM](https://www.w3.org/TR/2013/REC-prov-dm-20130430/) — Provides a stable vocabulary for task history without collapsing it into a human/bot label. | Apr 30, 2013 |
| The human/bot binary is contested in bot-authentication design | [Web Bot Auth use-case draft, Appendix A.4](https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4) — Records a concrete prior argument; this individual draft is not an agreed standard. | Apr 1, 2026 |
| Verified request identity: a signed request can identify its key holder; it does not establish a fresh human action or a citation. | [HTTP Message Signatures for automated traffic, §4.6](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6) — Bounds what verified request identity can establish; the document remains a draft. | Sep 1, 2026 |
| Citation faithfulness: whether the model actually relied on the cited source. | [Wallat et al., Correctness is not Faithfulness in RAG Attributions](https://arxiv.org/abs/2412.18004) — Separates support review from causal attribution; its tested systems do not establish 2026 model-wide rates. | Dec 23, 2024 |
| Citation support: whether a cited source supports the associated claim. | [Gao et al., Enabling Large Language Models to Generate Text with Citations](https://aclanthology.org/2023.emnlp-main.398/) — Provides the ALCE research basis for source-support evaluation, the real-answer review applies an explicitly narrower rubric. | Dec 2023 |
| Real CLI capture: final answer and emitted tool records retained through Promptfoo exports | [Real CLI experiment](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md) — Shows the two subscription-backed runs, executable wrapper, reported usage, and preservation checks. | Sep 10, 2026 (PDT) |
| Source review found a wrong denominator and two other material errors in Claude’s answer | [Real-answer source review](https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md) — Links both unchanged answers, source copies, tool events, and explicit review judgments. | Sep 10, 2026 (PDT) |
| Codex accepts ChatGPT subscription sign-in for local work | [Codex authentication](https://developers.openai.com/codex/auth/) — Establishes the authentication route used by the installed client. | Sep 11, 2026 (checked, UTC) |
| Codex exec runs scripts with saved CLI authentication | [Codex non-interactive mode](https://developers.openai.com/codex/noninteractive/) — Documents the non-interactive command and emitted JSONL events. | Sep 11, 2026 (checked, UTC) |
| Claude -p continues to use subscription limits under the current notice | [Claude subscription notice](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) — The top update pauses the proposed billing change; the older section below it is superseded. | Jun 16, 2026; checked Sep 11 UTC |
| Promptfoo’s native Codex SDK provider supports saved login and retains its turn | [Native Codex provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openai/codex-sdk.ts) — Bounds the OpenRouter finding: another built-in adapter already preserves different evidence. | Sep 11, 2026 (checked, UTC) |
| Promptfoo’s native Claude SDK provider supports subscription login with apiKeyRequired: false | [Native Claude provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/claude-agent-sdk.ts) — Distinguishes its final-result capture from the complete CLI stdout retained in our experiment. | Sep 11, 2026 (checked, UTC) |

### Research record

The [worklist](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md) links the experiments, research notes, and open work. The [verbatim shaping prompts](https://github.com/gkoreli/blog/blob/main/packages/blog/prompts/oss-radar-07-promptfoo.prompts.md) are preserved for this issue at the author's request. The methods record the runtimes, dependency lock, scripts, results, and failed setup attempts. Codex executed the experiments for this article; Goga supplied the workload and editorial direction. A [partial research footprint](/oss-radar-07-promptfoo/prompts#research-footprint) records 43,272,331 tokens across eight recovered Codex sessions. The original ChatGPT research, mixed analytics/publication conversation, and subsequent real CLI experiments and reviews are excluded. The original fifteen-prompt snapshot remains frozen; the prompt page includes two later requests. The [accounting method and exclusions](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/19-research-footprint.md) explain the measured portion; human hands-on time remains unmeasured.

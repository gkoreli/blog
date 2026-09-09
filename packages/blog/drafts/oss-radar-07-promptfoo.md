# OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?

Draft started September 8, 2026. Project deep dive; unpublished. The results below come from a local synthetic-response experiment. Live-provider, source-support, and blog-citation studies remain open. [Worklist and artifacts](research/oss-radar-07/00-worklist-index.md).

Promptfoo can carry the evidence needed to inspect an AI answer, but its OpenRouter adapter needs extra capture for this workload. In our September 8 check of the installed 0.122.2 package, the built-in evaluation summary omitted citation fields that the transport cache retained. A custom provider preserved them through the public summary API. That is enough to justify the next bounded trial; it does not yet establish a complete citation-measurement system. [Method and results](research/oss-radar-07/repro/installed/README.md).

- The answer text survived in every tested path. The structured citation fields survived in the custom provider's summary and the built-in transport cache.
- Promptfoo's response interface already has room for raw data and metadata. Our fixture needed no framework fork.
- Citation capture gives analytics something to count and evaluation something to inspect. It cannot reconstruct an unseen human action or establish why a model relied on a source.

The timely change is Promptfoo's August work on execution traces. Its [August 26 release](https://github.com/promptfoo/promptfoo/releases/tag/0.122.1) added per-test roots, target spans, and richer accounting. Those features make a useful question sharper: can the record explain the answer well enough for someone else to check it?

## Citation analytics needs the answer

Our blog analytics can record requests that reach the site. A citation exists in an answer somewhere else. Bringing those observations together starts with preserving what each system can see.

AI citations are a topic; counting them is analytics, and checking whether their sources support an answer is evaluation. There is already publisher-facing prior art. Microsoft's [AI Performance preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview), announced February 10, reports citation activity across its supported AI surfaces and selected partners. Its coverage is defined by that product. It does not audit every cited claim.

The opportunity for this blog is to publish inspectable cases: the question, captured answer, cited source, review, and records that connect them. We can then compare those cases with our request observations where a defensible connection exists. Whether the blog appears in the answers remains an open result. The capture method should still help another engineer if it does not.

## What Promptfoo owns

Promptfoo supplies a common way to run test cases and inspect results across providers and applications. Its [custom-provider interface](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md) also lets an operator bring their own application into that runner. For this study, that division is useful: reuse the evaluation machinery and retain provider-specific evidence explicitly.

The implementation detail matters for anyone choosing an adapter. The pinned [OpenRouter provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts) sends the request through a cache-aware transport, then builds a smaller response from answer text, usage, and completion information. It does not copy the fixture's citation list or answer annotations into that response. The evaluator receives the smaller object.

The shared [response contract](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts) allows both `raw` and arbitrary metadata. This changes the adoption question. We need to test the chosen adapter and export path, rather than assume either that the whole framework preserves everything or that it cannot preserve the evidence at all.

## What survived the installed-package check

The installed experiment located the omission and tested a repair with the same response. It used one invented payload containing one distinct source URL, represented in a citation list and an annotation. No live model answered the question.

We ran the built-in provider against a local HTTP server, repeated the evaluation with caching enabled, then sent the same payload through a custom capture provider. Each evaluation used the public summary API and a text assertion. The script serialized the summaries and read them back before checking the fields. [Runnable probe and saved outputs](research/oss-radar-07/repro/installed/README.md).

| Observed path | New local requests | Answer text | Citation-list entries retained | Annotations retained |
|---|---:|---|---:|---:|
| Built-in provider, fresh summary | 1 | Preserved | 0 | 0 |
| Built-in provider, cached summary | 0 | Preserved | 0 | 0 |
| Custom capture provider, fresh summary | 1 | Preserved | 1 | 1 |

The built-in transport cache retained the full parsed fixture, including both citation fields. The custom summary retained the exact raw response text, its hash, the mock request ID, and the structured fields. Those are two positive findings. The result is narrower than saying Promptfoo discarded the evidence everywhere.

The fixture's repeated URL is one source, not two lost citations. Its annotation offsets are not validated, and the text assertion checks transport rather than truth. Tracing, database persistence, CLI export, streaming, failure handling, and live billing were outside this check. The [recorded result](research/oss-radar-07/repro/installed/recorded/result.json) keeps those limits beside the measurements.

For a real answer, missing citation fields would mean we could not assess citations through that field. They would not mean the model cited nothing. The controlled fixture lets us establish an omission because we know what entered the adapter.

## Who started the task, and what did the answer cite?

An assistant can use a blog on someone's behalf without that person visiting the site. A person can ask for an article now or commission a report that runs every week. Both serve a human goal. The immediate trigger differs, and neither tells us what the answer cited.

That distinction has prior art. W3C's [provenance model](https://www.w3.org/TR/2013/REC-prov-dm-20130430/) records what started an activity separately from who bears responsibility for it. A Web Bot Auth [use-case draft](https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4) likewise questions the human/bot binary. The [protocol draft](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6) leaves human authentication and delegation outside its scope.

A citation belongs to the answer. We need the captured output to observe it, then the source to check whether it supports the claim. Even that leaves a further question: did the model rely on the source? [Research on citation faithfulness](https://arxiv.org/abs/2412.18004) distinguishes actual reliance from a reference that merely agrees with the answer.

For controlled runs, we can preserve the submission or scheduler event and link it to the captured output. A receiving website usually lacks that history. The [research artifact](research/oss-radar-07/04-trigger-provenance-and-ai-citations.md) separates task authority, trigger, URL selection, request identity, content access, citation, and source review. Promptfoo can organize records supplied to it; the trace cannot invent the missing ones.

## What still needs code

The custom provider proves that evidence can cross this interface. A live study needs a capture contract that handles the cases our successful fixture did not exercise.

That contract must preserve exact input and output records, separate provider source lists from answer citations, and retain missing fields, failed attempts, retries, cache state, and charge provenance. Source review then needs its own claim boundaries and support rubric. Earlier work such as [ALCE](https://aclanthology.org/2023.emnlp-main.398/) gives citation evaluation a research basis; a returned URL alone is not a support judgment.

The [proposed measurement contract](research/oss-radar-07/07-citation-measurement-contract.md) keeps counts honest. Citation presence uses assessable answers as its denominator and reports observation coverage alongside it. Support uses reviewed claim–citation relationships. Requests, unique URLs, citation occurrences, and people never become interchangeable units. A capture hash helps detect changed bytes; it does not authenticate the provider or make an answer true.

Collection also needs a known network boundary. Our first attempt encountered an unexpected telemetry request despite the opt-out. The final probe blocked one such POST before transmission, matching the pinned code and the still-open [upstream report](https://github.com/promptfoo/promptfoo/issues/9968). This does not establish prompt disclosure. It does mean the opt-out alone was insufficient for this restricted local run. The method records the interruption and the guard.

The larger adoption test is whether these additions remain a small capture layer while Promptfoo supplies useful execution and review machinery. A direct runner remains a reasonable alternative if maintaining the integration means rebuilding those parts ourselves.

## The next decision

Promptfoo is worth the next bounded trial for this blog's citation-evaluation workload. The tested interface can retain evidence, and the built-in cache gives useful counterevidence to the strongest loss claim. Anyone who needs complete records from the built-in OpenRouter summary should first add and verify capture on the route they will use.

Two results would change the decision: a live preflight that cannot preserve complete success and failure records with defensible charge provenance, or a trace/export check that cannot maintain the explicit joins we choose to depend on. Those tests remain in the [worklist](research/oss-radar-07/00-worklist-index.md). The proposed API ceiling is $20; this fixture run made no live model calls and incurred no API charges.

Use Promptfoo with a capture provider for the next experiment. Keep the raw records independently replayable, and judge wider adoption after the live and trace/export gates. The later engineering article can report what the blog's own pipeline lets us observe about citations; this Radar issue judges whether Promptfoo is a useful part of that pipeline.

# What the discovery evidence supports next

October 31, 2026 UTC. Continues [Research 121](121-offline-search-evidence-workbench.md), the [accepted discovery audit](../discovery-experiment-02/00-worklist.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). The persistent goal is active again; the earlier blocked checkpoint concerned particular measurement inputs. People and agents count as audience under [ADR-0016.19](../../../../../docs/adr/0016.19-agent-mediated-audience-growth.md).

## Decision

Keep developing the request-header and signature-coverage reference. We have evidence that an agent-operated search finds it and that another technical publication uses its captured evidence. This supports that area of expertise more directly than a large undifferentiated request count. It does not measure total topic demand or audience growth.

The Grok discovery gap deserves a focused diagnosis before an article edit. The existing article already describes anonymous browser-shaped requests, signed-in headless requests, attribution by assigned URL and timing, and the tested detectors' failures. Its title, description, opening and dedicated Grok section expose that material. Missing coverage is therefore not established by a missing search result. No new article or title change follows from this repetition alone.

## Independent repetition

This turn initially found an unfinished repeat-study plan and analyzer in the checkout. A later status check showed more files appearing. Inspection confirmed that **Build Agentic Blog Analytics**, another active task, owns that implementation and its own four-call repetition. This turn stopped adopting those files. Its source edits, tests and trials remain separate. Our four calls are retained, including this overlap, rather than discarded or silently pooled into the other study.

We followed the saved four-question set, one exact question per public web-tool call, with `response_length: short`, no supplied site/source URL, and no domain filter. We stopped after four calls. The authoring session already knew the source; the explicit search requests contained only the questions. The baseline artifact does not retain its response-length setting, so identical request conditions are unproven. The underlying model, index, locale, account and personalization are unavailable. This is a descriptive repetition, not an independent randomized trial.

| Frozen question | Prior pool | This turn's pool |
| --- | --- | --- |
| ChatGPT-User Accept-Language Fetch Metadata headers | Canonical returned | Canonical returned |
| Does DuckAssistBot Web Bot Auth signature cover User-Agent request path | Canonical returned | Canonical returned |
| Does Codex web search fetch the original URL | Canonical returned | Canonical returned |
| Can Grok requests be distinguished from human website traffic | Canonical not returned | Canonical not returned |

The canonical study appeared in **3/4 completed pools in each run**. The Web Pulse reproduction appeared for the header question and Arcjet's guide for signature coverage in each run. Our repetition completed at 07:21:51–07:22:00 UTC, with no failed or missing calls. Eight observations still cover four distinct questions; they do not represent eight audience members. No search rank, answer-citation rate, source-selection probability or change in population reach is estimated. The article acquired an external-reference note between the prior audit and this repetition; the page was not held constant.

[Receipt](independent-agent-discovery-review.json) preserves per-question times, raw hashes, returned-source counts and exact tracked-URL presence. We verified all four prior raw-response hashes and their complete extracted source lists before using the baseline. Repeat hashes cover the exact returned text, saved separately from its timestamp envelope. Baseline times retain the prior aggregate record's precision; repeat times are tool-completion times to the second.

## External use is a different outcome

We re-inspected the saved full HTML from [Arcjet's Web Bot Auth guide](https://arcjet.com/learn/web-bot-auth), verified its original SHA-256, and confirmed its direct link to the canonical study. It uses the published DuckAssistBot capture to explain how signature coverage can omit the request path. That is one attributable external reference and evidence-reuse observation, already accepted by the earlier audit. Finding the guide again in search does not create a second reference or new installation of our analytics. This turn did not recapture that page or establish its current contents.

| Question we can answer | Evidence and next action |
| --- | --- |
| Is any of the work being found through an agent? | Yes, within the declared question sample. Preserve the successful reference and its evidence links. |
| Is any technical detail useful outside this blog? | Arcjet's attributed reuse supports the signature-coverage explanation. Maintain the capture and its limitations as the reference evolves. |
| Do these searches tell us what the whole audience wants? | No. The questions are researcher-selected hypotheses. Real query/page evidence, supported answers and reported application can independently strengthen topic decisions. |
| Should we write a new Grok article now? | The repeated miss is a lead; the existing page already covers the question. First examine answer fit, search presentation and source selection in a separately declared experiment. |
| Are we growing overall? | These same-day pools cannot answer that. Comparable completed-window access, repeated question samples and first-observed distribution each need their own history. |

## Two reproduced reporting risks

A bounded reviewer inspected the unfinished analyzer. We reproduced both findings against the **preserved draft snapshot**, SHA-256 `074eca44d63fd05726daa5d7e6a3c388e76da4d5cdf849e1bd9a94e765ea820f`, using pinned Node 24.14.1. These controls are synthetic and do not claim the other task's final implementation retains either issue.

1. Changing one run's service makes `sameDeclaredMethod` false, but the draft still emits four paired questions and three retained matches. A disclaimer does not prevent incompatible methods from looking like a trend. [ADR-0019](../../../../../docs/adr/0019-agentic-engineering-publication-and-analytics-ambition.md) requires a method change to start a separate baseline. Acceptance should explicitly refuse or withhold longitudinal transitions across incompatible methods.
2. Adding `#signature-agent` to the same Arcjet URL raises the draft's distinct-source-page and evidence-reuse-pair totals from one to two. Exact URL identity is not necessarily page identity. Acceptance should distinguish URLs from declared page identities, with explicit fragment handling; query parameters must not be stripped by guesswork.

The first review-harness attempt accidentally shared one method object between both runs, so mutating its service changed both. Its assertion failed. Constructing distinct method objects corrected the harness; the subsequent controls produced the results above. The failed attempt and corrected generator are retained privately. No other task's source, tests, package export, CLI or experiment record was modified.

## Delivery and remaining work

This work adds independent discovery observations, a decision brief and reproduced review evidence. It changes no collector, classification, retention policy, public report or article. There were no own-site requests, production SQL, account requests, human trials or native-provider verdicts. Raw search responses, draft snapshot, generator, failure note and manifest live in the private ignored archive identified by the receipt. Public records contain methods and derived observations.

Next: inspect the owning task's completed analyzer and acceptance against these two reproduced risks before relying on it for comparisons. Then use the existing Grok section for a bounded question-to-answer-fit investigation, rather than writing a duplicate article from request volume. Real saved Search Console input remains another independent path. Human/device calibration, managed-provider agreement, historical proof recovery and collection-policy decisions retain their specific unresolved inputs; the full engineering goal remains active and incomplete.

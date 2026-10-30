---
name: run-discovery-experiment
description: Run a bounded gkoreli.com discovery or reader-use experiment from a real question through diagnosis, one intervention, publication checks, and an evidence-based next decision. Use for testing a growth or visibility idea; ordinary metadata edits use article-discovery-positioning.
---

# Run a discovery experiment

Turn a publishing or site-owner question into one inspectable experiment. Deliver the tested change or justified no-change decision, evidence of what happened, and the next action. Follow [ADR-0019](../../../docs/adr/0019-agentic-engineering-publication-and-analytics-ambition.md); preserve the article's governing form and authorship.

## Choose a consequential question

Read the relevant worklist, latest handoff, saved results, and article before opening a new investigation. Reuse the worklist; keep new experiment evidence in a linked dated directory. Completed work stays complete unless new evidence changes it.

Make a small question-to-existing-page map. Distinguish observed reader/search/use evidence from inferred questions and agent-generated hypotheses. Select a question whose answer can change a publishing or operator decision. Do not turn a request-count ranking into measured demand.

Diagnose the gap: absent coverage, inadequate answer, unclear entry point, delivery/crawl/index problem, or a specific external source. Read structured metadata completely with the repository parser or inspect the full object; a clipped preview cannot establish that a field, link, or relationship is absent. Inspect rendered HTML and Markdown separately when both matter. A URL supplied by the researcher tests access or retrieval, not organic discovery.

Improve an existing page when it already owns the question. Create a page only for a distinct supported need. Preserve a useful page unchanged when no consequential defect is found. Use [article-discovery-positioning](../article-discovery-positioning/SKILL.md) for metadata and relationships; use the governing writing workflow for prose changes.

## Freeze the experiment before intervention

Use the concise [experiment record](references/experiment-record.md) when it helps. Record:

- the reader/operator question, evidence state, competing explanation, and falsifiable hypothesis;
- the selected page, baseline source revision, capture time, exact window and source/method boundaries;
- one intervention, primary observable outcome, preservation checks, stop condition, and follow-up decision;
- unavailable inputs and independent work that remains possible without them.

Match the outcome to the question. A scope/link experiment can establish delivered guidance; a discovery experiment needs search/answer evidence; an adoption experiment needs actual operator use. Do not relabel a local rehearsal as an acquisition result. Record trial counts and denominators without converting check counts into reader counts.

Save the baseline before editing. Keep exact inputs, outputs, logs, hashes, failures, and reproducible commands where practical. Public notes explain the method and limits; raw operational captures, private feedback, and session logs stay outside Git. Preserve frozen historical accounting. Use the existing footprint extractor only when new usage measurement is part of the task; never estimate token costs or rewrite old totals.

## Act, check, and deliver

Apply the smallest useful intervention. Change source files, not generated output. For collaborative articles, preserve complete material human prompts and update modification metadata under the [metadata contract](../article-discovery-positioning/references/metadata-and-discovery.md). Keep an entry-point note proportional to the article; research detail belongs in the linked experiment record.

Follow [blog-maintenance](../blog-maintenance/SKILL.md) for isolation, checks, identity, commit/push, deployment, and evidence. Use an isolated checkout for builds. Compare baseline and candidate under recorded conditions; test the actual artifact or task, not just that an edit exists. Verify destinations and content parity when claiming a working trail. Do not add a testing framework for a simple reversible edit.

For controlled own-site checks, inspect current eligibility before choosing an exclusion method, bound attempts, and record what exclusion was actually verified. Avoid warming public reports or running SQL merely to decorate a publication check. Account access and production-query procedures retain their own authorization and budget boundaries. A permission or external-input gap does not authorize another route around it.

Inspect exact third-party sources when they shape a result. Separate owned pages, maintainable profiles, independent coverage, and substantiated errors. This skill does not authorize outreach, account changes, paid tools, or unrequested posts. Prepare usable material within the request; publish externally only within the user's authorization.

## Interpret each layer separately

| Layer | Evidence needed | Limit |
| --- | --- | --- |
| Delivery and navigation | Actual response bytes, representations, destinations, and placement | No proof of discovery, comprehension, or use. |
| Search discovery | Page/query report with dates, filters, coverage, data state, and timezone | Missing/anonymized queries are not zero demand. |
| AI answer visibility | Frozen questions, service/model when exposed, search mode, date, context, trials, answers, cited URLs, and denominator | Search-tool results alone are not an AI citation rate or all-model visibility. |
| Reader value | Attributable feedback, corrections, subscriptions, links, or reports of application | Requests and agent review do not establish human reception. |
| Product adoption | Independent operator installation and use for an actual decision | Our own successful deployment does not establish portability or scale. |

Keep public search reconnaissance distinct from authenticated Google performance data and from controlled model trials. Do not infer non-indexing or universal absence because a result is missing from one returned pool. A result pool merged across queries does not supply per-query ranking denominators.

Preserve cohort/window/method changes and start a new baseline when the comparison scope changes. Do not pool retries or failed trials invisibly. A before/after change is descriptive unless the design supports a causal claim. Do not run synthetic traffic to manufacture a growth outcome.

## Close the loop and improve the skill

Report change delivery, deployment activation, served behavior, and reader/operator results separately. Choose retain, correct/remove, a new bounded experiment, or no action from the evidence. An inconclusive or negative result can complete the experiment; unavailable outcomes remain unavailable.

Declare any follow-up window and its start condition. A review date is not an automation: schedule only when requested. Do not wait inside a turn for days of organic traffic or imply unattended work is continuing.

Update the existing worklist with artifacts, completed checks, remaining inputs, and the next bounded action. Improve this skill only for a demonstrated failure or explicit owner direction. Keep dated results in the experiment record, not as permanent advice or guarantees.

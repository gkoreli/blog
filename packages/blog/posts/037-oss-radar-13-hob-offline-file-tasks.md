---
title: "OSS Radar #13: Hob Wrote Correct Files with Network Access Blocked"
seoTitle: "Hob Offline AI Tested: Two File Tasks on a 24 GB Mac"
alternativeHeadline: "Hob's recommended local model completed two document tasks with outbound networking denied, after a 14.4 GB download and roughly 45–48 seconds per task"
date: "2026-10-30"
description: "Hob's local engine wrote the correct JSON and CSV report with networking blocked. I tested its recommended model, setup cost, waiting time and M1 selection rules."
section: oss-radar
tags: [oss-radar, local-ai, macos, testing]
---

# OSS Radar #13: Hob Wrote Correct Files with Network Access Blocked

Hob read a brief and wrote the correct facts file. Then it read a CSV and wrote a report with the right total and selected customers. Both tasks finished with **outbound networking blocked for the test process and its model worker**.

The tradeoff: a **14.4 GB model download first**, then roughly **45–48 seconds per task** on my M5 Mac with 24 GiB of memory. I tested Hob’s source-built engine and file workflow, not its desktop interface. The inputs were synthetic.

[Hob presents itself as a local alternative to hosted assistants](https://github.com/FrigadeHQ/hob/blob/74a09d6a69b87eb3297e19107c6410998c53ee79/README.md). These are useful results for that promise:

- The actual saved files passed checks; a reassuring chat reply was not the acceptance test.
- Its recommended model ran locally after setup.
- Its hardware picker gives clear choices, but does not benchmark which model works best on your machine.

## It did the file work

The first brief named an owner, deadline and approved budget. It also contained an obsolete owner and budget, explicitly marked as replaced. I asked Hob to write a JSON file containing only the current values.

The saved file contained exactly:

```json
{
  "owner": "Nika",
  "deadline": "2026-11-18",
  "budget_usd": 7300
}
```

The second task used four CSV rows. Hob had to calculate total revenue and write a Markdown report listing only customers above the specified threshold. The report correctly showed **$5,000 total**, with **Atlas at $1,290** and **Cedar at $2,435**. It excluded the two smaller customers.

| Task | Actual file check | Completed in |
| --- | --- | --- |
| Extract current facts | Exact three-key JSON; obsolete values excluded | 47.5 seconds |
| Calculate and filter CSV | Correct total and complete selected-customer list | 45.3 seconds |

I read and checked the resulting files independently. Both attempts passed. Two short documents do not establish reliable performance on a large spreadsheet or a difficult PDF, but they establish more than a local model answering a greeting.

## The cloud was unavailable during the tasks

I ran Hob’s actual [engine worker](https://github.com/FrigadeHQ/hob/blob/74a09d6a69b87eb3297e19107c6410998c53ee79/app/src/engine/worker.ts), [agent loop](https://github.com/FrigadeHQ/hob/blob/74a09d6a69b87eb3297e19107c6410998c53ee79/app/src/main/agent/turn.ts), SQLite store and [file tools](https://github.com/FrigadeHQ/hob/blob/74a09d6a69b87eb3297e19107c6410998c53ee79/app/src/main/tools/files.ts). A small adapter carried messages through a child process in place of Electron’s transport. Model responses and tool results came from the real implementation.

The OS sandbox denied outbound networking to that process and its worker. A direct outbound connection failed with `EPERM` before inference began. Other applications kept their normal network access.

I allowed fixture file changes and denied requests for additional folder access. The offered tools were read, write and list; no Python calculator or web tool supplied the answer. This checks an offline source path after downloads. It does not audit every desktop feature, plugin or updater for network behavior.

## What “picks the best model” means

[Readers asked what hardware Hob needs](https://news.ycombinator.com/item?id=50251374), including [uncertainty about an M1](https://news.ycombinator.com/item?id=50253609). Its [picker](https://github.com/FrigadeHQ/hob/blob/74a09d6a69b87eb3297e19107c6410998c53ee79/packages/picker/src/pick.ts) estimates memory fit and speed, then ranks models using scores in a catalog.

It reserves a share of memory, accounts for estimated context overhead and uses a [bandwidth table](https://github.com/FrigadeHQ/hob/blob/74a09d6a69b87eb3297e19107c6410998c53ee79/packages/picker/src/bandwidth.ts). It does not run every candidate through your documents and measure which succeeds.

I ran the pinned selection rules with these inputs:

| Hardware input | Recommended model | Picker’s context choice |
| --- | --- | --- |
| My M5, 24 GiB | Gemma 4 26B, Q4_0 | 16,384 tokens |
| Hypothetical M1, 8 GiB | Compact Gemma 4 E4B | 8,192 tokens |
| Hypothetical M1, 16 GiB | Gemma 4 E4B | 16,384 tokens |

Only the M5 recommendation ran the tasks. The M1 rows are outputs of the software’s rules, not measured M1 speed or quality. The engine can expand context beyond the picker’s initial choice; I did not separately measure that allocation.

## Download once, then wait for the work

The recommended file was 14,439,363,584 bytes. Downloading, writing and hashing it took about **6 minutes 24 seconds** on my connection. Its hash matched the pinned catalog. Loading it through the Metal backend took another **15.4 seconds**.

The waiting continued after loading. The first visible answer arrived after **46.6 seconds** for the facts task and **43.5 seconds** for the report. Engine timing logs show much of that interval went into thinking before the visible reply. I used the normal effort policy and ran each task once, so these are observed waits, not a latency benchmark.

[The fixtures, adapters, model hash and results are public](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10). I would try Hob for simple local file work when keeping inference offline matters enough to accept the download and waiting time. I would test my own representative documents before trusting it with a larger workflow; these two correct outputs do not establish general document competence or a smooth desktop setup.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Model choice — records the scores, sizes and immutable downloads used by the picker. | [Pinned catalog](https://github.com/FrigadeHQ/hob/blob/74a09d6a69b87eb3297e19107c6410998c53ee79/catalog/catalog.json) | Source checked October 30, 2026 |
| Offline task test — preserves the actual outputs, timing and network-denial condition. | [Method](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10/repro/hob/README.md), [results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10/results/hob-tasks.json) | Same check date |

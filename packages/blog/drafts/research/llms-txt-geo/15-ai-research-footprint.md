# AI-assisted research footprint

**Status:** Final release-preparation snapshot. Frozen after the article entered `posts/` and all 29 research artifacts were present in `HEAD`.
**Article:** [`019-does-llms-txt-work.md`](../../../posts/019-does-llms-txt-work.md)
**Research window began:** 2026-08-24 23:19:05 PDT  
**Snapshot:** 2026-08-25 01:38:54 PDT

## Why expose this

A token count alone is a spectacle. The useful disclosure is the provenance chain behind the final article:

1. Goga supplied the questions, values, corrections, traffic goal, and decision pressure in raw prompts.
2. The main session inspected the live implementation, built the research map, reconciled evidence, and iterated the draft.
3. Six research-agent sessions handled bounded observability, crawler, adversarial, provider, academic, and operational/editorial work. Later follow-ups reused those sessions for green-team and final-delta review.
4. Every research thread wrote its evidence, rejected claims, caveats, and rationale into the same committed folder.
5. The article distilled those artifacts and retained the raw human prompts on its transparency page.

The number is worth showing only beside that chain. It measures computation processed during the workflow. It does not prove that the article is correct, interesting, or worth reading.

## Final measured footprint

| Measure | Value | Definition |
|---|---:|---|
| Human prompts | 24 | Raw prompts preserved in `07-golden-prompts.md` and the publishable prompt file |
| Codex sessions | 7 | One root article session plus six spawned research sessions |
| Committed research artifacts | 29 | Markdown files in this directory, including this methodology artifact |
| Total processed tokens | 98,829,081 | Input plus output tokens reported by the seven Codex session logs |
| Input tokens | 98,364,856 | Repeated session context plus new input across turns |
| Cached input tokens | 94,633,728 | Subset of input served from cache; do not add again to total |
| Non-cached input tokens | 3,731,128 | Input minus cached input |
| Output tokens | 464,225 | Model output across the seven sessions |
| Reasoning output tokens | 133,614 | Subset of output; do not add again to total |
| Wall-clock window | 140 minutes | Root session start to the latest selected usage record; not human hands-on time |

## What the headline number does and does not mean

`98.8M measured tokens` means the model sessions processed 98,829,081 input-plus-output tokens while this article and its research trail were being built through the release snapshot. Most input was cached context. Long-context collaboration and repeated agent turns make total processed input much larger than the final article.

It is not:

- 82.3 million newly written words;
- a billable-token estimate without the provider's pricing and cache rules;
- an energy, carbon, or water estimate;
- proof that more computation produces a better article;
- a number that should be compared across tools without matching their accounting rules.

## Session inclusion rule

Include the root session and every subagent session whose session metadata names the root thread as its parent. For each session, take the final cumulative `total_token_usage` record at the freeze timestamp. Sum each field once.

Included session roles:

- `/root`
- `/root/static_observability`
- `/root/crawler_classifier`
- `/root/thesis_redteam`
- `/root/green_clients`
- `/root/green_editorial`
- `/root/green_product`

## Final session manifest

This manifest was produced by `packages/blog/scripts/research-footprint.ts` with rules version 1. Each SHA-256 value commits to the private JSONL log prefix through the selected cumulative usage record. The raw logs are not public because they contain conversation and system context.

| Agent path | Session ID | Parent | Usage line | Usage timestamp | Total tokens | Log-prefix SHA-256 |
|---|---|---|---:|---|---:|---|
| `/root` | `01a03792-8926-7f53-ba7e-5b784d9a5e46` | — | 2957 | 2026-08-25T08:38:54.574Z | 54,432,835 | `918792389622410f1d955d6fd31bb46b3408088f1fa5b6321c5cd75805038f61` |
| `/root/static_observability` | `01a037a4-efd6-7653-abb8-45927df4210f` | root | 135 | 2026-08-25T06:45:36.760Z | 1,331,901 | `326ca001e69396359fbb8f861a04b652c0f7dd36e341f8fdc4c51c25347e3005` |
| `/root/crawler_classifier` | `01a037a5-1e3e-7422-a36a-3932e1960d48` | root | 142 | 2026-08-25T06:46:07.927Z | 1,176,321 | `3dfb92b3885b8328c541c71a6e469227398ca720d9bf69d27ee63faaa60ad74c` |
| `/root/thesis_redteam` | `01a037a5-44f9-7392-8929-d181c156038a` | root | 187 | 2026-08-25T06:48:24.707Z | 2,778,338 | `a01cd5e2ffcbd5b6304e65556d19c1746cc7eff166a36fb2f8e7099ca5f4b7ee` |
| `/root/green_clients` | `01a037ba-ec70-74b1-beea-7aeab6c12a25` | root | 876 | 2026-08-25T08:09:58.402Z | 16,115,373 | `5ad9ab2fb44c01616456903ee5a9dba9e6e2292fea17b36635172b817da50ace` |
| `/root/green_product` | `01a037bb-0dfa-7593-b42d-c1a61f57615c` | root | 553 | 2026-08-25T08:10:08.947Z | 10,253,917 | `4d5549f439202fc35601b6363f930f97d4013b8578a6012c4d3f38f969acded5` |
| `/root/green_editorial` | `01a037bb-374b-7ed1-9036-712d7d23955b` | root | 728 | 2026-08-25T08:11:32.835Z | 12,740,396 | `6fa25e37be9e7b2df5c5a501862b24df69963e308da9ea817ed7178644dd5a0c` |

The green sessions include their original constructive review and later final-delta audit because follow-ups reused the same session. The session count measures persistent research contexts, not the number of agent turns or assignments.

## Release freeze procedure

Immediately before the release commit:

1. collect the last cumulative usage record from all seven session logs;
2. recompute totals and non-cached input;
3. set the snapshot timestamp and wall-clock window;
4. count Markdown artifacts in this directory after the final audit files exist;
5. update this artifact and the article's `researchFootprint` frontmatter with the same values;
6. build the blog and inspect the article header, teaser, and transparency page;
7. commit the research directory in the same release as the article;
8. require the public provenance URL and the two load-bearing companion-artifact URLs to return HTTP 200.

## Product decision

This is an optional per-article disclosure. It belongs on collaborative research-heavy posts where session-level usage can be measured and the underlying artifacts are public. It should not appear on exposed essays, whose authorship contract is different, or on posts whose historical usage cannot be reconstructed honestly.

The compact article-header label should remain small: measured token total only. The transparency page carries the sessions, prompts, artifacts, time window, accounting method, and limitations. This keeps the number inspectable without turning the article header into a performance dashboard.

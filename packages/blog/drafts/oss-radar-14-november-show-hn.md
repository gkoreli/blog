---
title: "OSS Radar #14: Coding Agents Need Recovery, Review and Rules"
seoTitle: "November 2026 Show HN: 12 Open-Source Projects Inspected"
alternativeHeadline: "A November 1–10 Show HN scan finds tools for agent guidance, session recovery and inspection, alongside self-hosted services with outside dependencies"
date: "2026-11-11"
description: "Twelve November Show HN projects, inspected in source: agent guidance, command checks, session recovery, durable jobs and the dependencies behind self-hosting."
section: oss-radar
tags: [oss-radar, open-source, agents, developer-tools, self-hosting]
---

# OSS Radar #14: Coding Agents Need Recovery, Review and Rules

November’s Show HN offers tools for the work around a coding agent: choosing current APIs, checking commands, reviewing changes and recovering conversations. The useful question is what each tool actually controls—and what still depends on the agent, another service or you.

I inspected twelve projects from **November 1–10, 2026**. The source set was 1,455 submissions indexed as Show HN. Thirty-seven had at least 50 points when retrieved; twelve of those linked directly to GitHub repositories. Those twelve form this issue’s sample. Their code has an open-source license, though that does not establish the terms of every model or external service they use.

This is a scan of that sample, with source checked November 11. It favors projects that attracted attention and linked to GitHub. Website-first launches and lower-scoring submissions can contain equally useful work. The submission dates describe their Show HN appearances, not necessarily when their development began. [The inventory, selection rule and pinned revisions are available here](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-14-november-show-hn).

The [first OSS Radar](/oss-radar-01-vercel-winter-2026-cohort) used a funding cohort to compare projects and find patterns. This time the common source is a ten-day launch window. I read documentation and source; I did not install or benchmark these products.

## Give the agent current knowledge

### Modern Web Guidance: browser expertise becomes an agent dependency

[Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/README.md) packages web-platform guidance for coding agents. Its practical audience is anyone getting elaborate JavaScript for a problem the browser can already solve.

The interesting part is how the [skill directs retrieval](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/skills/modern-web-guidance/SKILL.md): search for a task, retrieve relevant guides, then check the implementation against them. It also distinguishes widely available features from features requiring a fallback, with an explicit project browser policy able to change the decision.

That is more useful than a blanket instruction to use modern CSS. The [navigation-drawer guide](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/skills/modern-web-guidance/guides/ui-components/navigation-drawer.md), for example, builds a swipe interaction around browser scrolling and scroll snap. The implementation choice is concrete enough to inspect and discuss.

The durable product here could be maintained implementation knowledge delivered at the moment of a decision. The hard question is whether an agent follows the relevant compatibility and accessibility details while adapting an example. A guide in context does not establish that the resulting page works. Generated behavior across a project’s supported browsers is the useful evaluation.

## Keep an account of what happened

### Stroq: the hook is part of the product

[Stroq](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/README.md) offers local inspection and controls for AI coding sessions. Reading an old session and intercepting a future action are separate capabilities: the first explains something that happened; the second needs an installed integration that the agent actually calls.

The [hook dispatcher](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/packages/cli/src/commands/hook.ts) makes that integration work visible. It chooses an adapter for the host agent, handles malformed input and supplies adapter-specific failure responses on exceptions or deadlines. A denial must be expressed in the form the host understands.

That distinction changes the adoption question. A rule can be sensible and still provide no protection if a call never reaches it, or if the host interprets its answer differently. Stroq’s [security documentation](https://github.com/AGGIB/Stroq/blob/4a0011353d7004c9710490a2cd6d52ab4ff80327/SECURITY.md) records substantial integration limits, including incomplete coverage for some MCP paths and host events.

Inspect this as a policy and evidence tool, and verify coverage in the actual agent integration. I have not tested its resistance to bypasses. A useful first trial would check an allowed action, a denied action and an internal hook failure, while retaining the host’s observed result for each.

### tmux-restore: a conversation can survive when its process cannot

[tmux-restore](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/README.md) addresses an ordinary interruption: rebooting a machine with several agent conversations open in terminal panes.

It extends tmux-resurrect and tmux-continuum. Its [Codex adapter](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/agents/codex.sh) finds the conversation’s rollout file among the native process’s open files, extracts its ID and constructs a resume command. That is a specific recovery mechanism, with a specific dependency on the agent’s internal file format.

The [caveats](https://github.com/andrewboldi/tmux-restore/blob/a2020e5ee24488dc5404290ca2387cc0b350d103/docs/caveats.md) matter as much as the demo. Programs restart; an interrupted tool call is not checkpointed. Agent file-format changes can affect recovery. The periodic save also depends on an attached tmux client; the shutdown save is a separate path. Saved scrollback can retain anything a pane displayed.

This has a clear, bounded job. Test restoration with disposable conversations and your normal shell before relying on it. Reopening the right conversation is valuable even though it does not finish the command that was running.

### Waymark: durable work needs durable state

[Waymark](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/README.md) takes recovery into the application. It lets Python workflows coordinate actions while a Rust runtime and Postgres retain their progress. Its stated uses include ordinary background jobs and agents.

The consequential design choice is compilation. The Python [source validator](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/python/src/waymark/compiler/validation.py) walks the syntax tree and dispatches checks through registered handlers. The Rust runtime’s [snapshot implementation](https://github.com/piercefreeman/waymark/blob/d40e7d53a484ad53a7d1e93baec4d02a81539ea6/crates/lib/vm-runtime/src/snapshot.rs) serializes and reconstructs runtime state. The workflow therefore has a representation the engine can preserve beyond the lifetime of a Python process.

That also defines the cost of the abstraction. Workflow code must fit the supported language constructs, actions still perform outside work, and someone operates Postgres and the executor. A recovered workflow also needs a policy for external effects whose completion is uncertain after a failure.

This is worth examining when a multi-step job is expensive or awkward to restart. The decisive trial is a crash around an external side effect, followed by inspection of what runs again. I have not performed that trial, and the maintainer’s throughput claims remain reported results.

## Make the result easier to inspect

### OmniDiff: review has to reach beyond changed lines

[OmniDiff](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/README.md) compares code and several binary content formats. It is relevant whenever a review includes an image, archive, font or PDF that a normal text diff cannot explain.

Its [content dispatcher](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/src/diff/content.rs) recognizes formats from their bytes. That matters when Git gives an external diff temporary filenames without useful extensions. It routes compatible pairs to content-specific engines and applies a shared expansion budget across nested content and workers. The [code-diff pipeline](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/src/diff.rs) separately matches syntax trees and derives changed text ranges.

Better inspection of generated artifacts is a useful companion to faster generation. The test is whether the display helps a reviewer catch a consequential change. The project’s accuracy and speed percentages come from its own evaluation; I did not reproduce them. The pinned [license](https://github.com/ivankovic/omnidiff/blob/ed150471f295de64b48e2ae98b2d317937cc5da5/LICENSE) specifies AGPL-3.0-only, despite GitHub’s license metadata returning an unclassified result during this scan.

### Coldframe: a small project with a precise observation target

[Coldframe](https://github.com/hedgerow-dev/coldframe/blob/e6b126af0ab08c24b48de77abfe063e98ff1b12f/README.md) is a decoy for supermarket refrigeration controllers. It is for operators and researchers who want to observe interactions aimed at that equipment.

The [Python implementation](https://github.com/hedgerow-dev/coldframe/blob/e6b126af0ab08c24b48de77abfe063e98ff1b12f/honeypot.py) implements vendor personas, fake login and control paths, and structured event logging. Its optional Modbus service is disabled unless configured. The fake control paths give an observer more information than a server that only records an incoming connection.

Specificity is the attraction. The unanswered question is whether real scanners and attackers treat the decoy as convincing enough to continue interacting. Source inspection establishes the simulation and logging paths; it does not establish field effectiveness. I have not deployed it or verified the incident history described in its README.

## Self-hosting still has a service boundary

### HolyArrs: one application, with metadata supplied elsewhere

[HolyArrs](https://github.com/HolyArrs/HolyArrs/blob/ddb423156fcb2e0829f1ab7ea647e81908197b83/README.md) combines media-library and acquisition workflows that otherwise span several applications. Reducing the number of interfaces and connections an operator manages is a coherent product thesis.

The default metadata path is consequential. [`ServiceURL()`](https://github.com/HolyArrs/HolyArrs/blob/ddb423156fcb2e0829f1ab7ea647e81908197b83/app/backend/internal/metadata/hosted.go) selects an environment override or the project’s hosted API. The [hosted-service constructor](https://github.com/HolyArrs/HolyArrs/blob/ddb423156fcb2e0829f1ab7ea647e81908197b83/app/backend/internal/metadata/hosted_service.go) registers installation access and routes the default TMDB path through that service. It also contains options for supplying a TMDB key; those options alone do not establish independence for every metadata feature.

Simplifying local operations by sharing a maintained metadata service can be a reasonable trade. It changes what an operator needs to evaluate: the service’s availability, operating model and available alternatives matter alongside the local application. I have not measured the advertised download size or memory use, or tested behavior during a metadata-service outage.

## Five more, with different questions

These projects belong in the same inventory, but each introduces a distinct decision. They do not all support an agent-tooling thesis.

| Project | What the inspected source adds | The question that remains |
| --- | --- | --- |
| [Flide](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/README.md) | Its [session cache](https://github.com/OmniJev/Flide/blob/ee6a919c2c1740743a3f4673ecd731145d23f358/flide/runtime/session.py) reuses saved model state for matching token prefixes, with token-level confirmation and a memory budget. | Does its reported decision-inference speed advantage hold for the model, hardware and request pattern you need? I ran no GPU comparison. |
| [STE80 Humanizer](https://github.com/Dodaios/ste80-humanizer/blob/99bc468482599f5d75f595e2c1adf893ebff4d8f/README.md) | A [Python checker](https://github.com/Dodaios/ste80-humanizer/blob/99bc468482599f5d75f595e2c1adf893ebff4d8f/scripts/ste_check.py) implements heuristic phrase, sentence and style checks alongside the writing skill. | Does a rewrite preserve qualifications, facts and the author’s voice? Passing a style checker cannot answer that. |
| [Kairos](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/README.md) | Its [workflow runner](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/apps/server/src/modules/workflows/libs/runner.ts) budgets execution and schedules retries; its [self-hosting guide](https://github.com/finic-ai/kairos/blob/7ecac21b631a005f0ef9b4f4e4ff6f3d78422327/docs/deployment/self-hosting.md) requires Postgres and internet access to Finic’s model API. | What data and decisions cross that service boundary, and can the operator validate outcomes on representative data? No fraud-detection effectiveness is established here. |
| [HyperFlow H3 Flash](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/README.md) | Its [scheduler](https://github.com/Video-Rebirth/hyperflow-h3-flash/blob/0767e9cd7c72bf7aa832b07ebe1cdbd5daa80295/src/hyperflow_h3_flash/schedule.py) supplies explicit four-, six- and eight-step schedules for joint video/audio generation. | What quality and full memory footprint does the chosen runtime deliver? I did not generate a clip, validate its timings or audit the separate model-weight terms. |
| [Spindle](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/README.md) | Its [OpenAPI generator](https://github.com/hyphatech/spindle/blob/9ed528817b74e4cd13cc1595d1e986dc9580e75f/core/openapi.ml) derives schema and route descriptions from the application representation. | Does the framework cover the OCaml service you need, including its protocol and deployment requirements? I did not run its conformance suite. |

## The pattern to watch

Six of the twelve explicitly address coding-agent behavior or agent workflows: Modern Web Guidance, Stroq, tmux-restore, Waymark, STE80 Humanizer and Kairos. They intervene at different points: knowledge, permission, recovery, orchestration, language and operational decisions.

That suggests a useful product hypothesis: **as agent output gets cheaper, retaining control of the work becomes more valuable.** The sample supports the existence of these products. It does not establish demand, adoption or a market-wide shift. HN’s audience and this scan’s GitHub-link rule are plausible reasons for finding so much developer tooling.

The sharper distinction is how much responsibility a product takes on. A writing instruction can be copied. Maintaining browser guidance, decoding artifacts, preserving recoverable state and translating a policy into several hosts’ actual hook protocols creates continuing work. That work can justify a maintained tool—if users benefit enough to keep it in their workflow.

The hypothesis weakens if those capabilities arrive reliably inside existing agents and runtimes, or if the extra tools cost more attention than they save. The next evidence should come from repeated use: a recovered conversation, a caught change, a correctly handled failed job, or an action the installed integration actually stopped.

Modern Web Guidance offers a small first evaluation: retrieve a guide for one real task and check the resulting page. tmux-restore offers a bounded recovery trial, while Waymark commits more of the application to a durable runtime. HolyArrs and Kairos supply the reminder to draw the hosting boundary before deciding how much control a self-hosted deployment gives you.

---

## Sources and terms

Code links above use one pinned November 11 revision per repository. These are current-source inspections following November 1–10 Show HN submissions, not reproductions of every launch-day version.

| Term or source | What it establishes |
| --- | --- |
| [Selection record and complete indexed inventory](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-14-november-show-hn) | Ten daily query partitions, the 50-point/direct-GitHub rule, all twelve selected submissions and source revisions. Points were captured at retrieval, so submissions had unequal time to collect votes. |
| [HN’s official API](https://github.com/HackerNews/API) and [Algolia’s HN search API](https://hn.algolia.com/api) | The primary discussion service and the indexed search interface used to construct this scan. Indexed availability limits the inventory. |
| Durable execution | A system retains workflow progress so work can continue after a process fails. Waymark’s linked implementation shows its state representation; external-effect behavior still needs testing. |
| Agent hook | A host invokes an integration around an event such as a tool call. Its timing, payload and response handling determine what the integration can observe or stop. |

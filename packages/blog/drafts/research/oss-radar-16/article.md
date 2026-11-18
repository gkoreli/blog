---
title: "OSS Radar #16: Saved Skills, Inbox Replies, and Health Checks"
seoTitle: "OSS Radar #16: Hermes, Plannotator, NemoClaw, and GoDoxy"
alternativeHeadline: "Four open-source projects for carrying instructions, replies, policy, and alerts across interruptions"
date: "2026-11-23"
description: "Hands-on with Hermes Agent, Plannotator, NemoClaw, and GoDoxy. What happens to saved skills, inbox replies, policy edits, and alerts across interruptions?"
section: oss-radar
series:
  id: oss-radar
  title: OSS Radar
  order: 16
tags: [oss-radar, open-source, developer-tools, agents, self-hosting]
---

# OSS Radar #16: Saved Skills, Inbox Replies, and Health Checks

Hermes Agent's skill reader picked up a one-line edit to a saved procedure, and a local model followed the new rule when given the revised instructions. In Plannotator, a reply survived a restart and stayed waiting for the session that asked the question, even after another reader opened the thread.

This issue also looks at NemoClaw's handling of a policy edit when it loses contact with OpenShell, and returns to GoDoxy to see what happens when a service is still down after its scheduled backup window.

## Sources and selection

Hermes Agent, Plannotator, and NemoClaw came from public GitHub release and implementation work. The selection follows three jobs that come up once an agent has ongoing work: carrying a procedure to a new session, getting a human decision back to the right task, and operating the runtime around it. GoDoxy returns from [the first Radar](/oss-radar-01-vercel-winter-2026-cohort), where it appeared in Vercel's Winter 2026 cohort. The return visit follows a maintenance problem raised by someone running scheduled backups.

This is a curated four-project selection. It favors tools with a concrete operating question and enough public source and discussion to investigate it. Repository activity here says little about adoption. The [release pins, fixtures, and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16) cover research through November 18, with AI assistance.

## The projects

### Hermes Agent — carry a procedure into the next session

If you keep explaining the same house rules to an agent, Hermes gives you two places to put them. Its memory files hold short facts and preferences that can enter the starting prompt. Skills are files with a catalog entry, loaded on demand. That gives a long procedure a place to live without putting it into every prompt. [Hermes Agent v0.23.2](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.2) · [Memory store](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/tools/memory_tool_store.py) · [Skill loading](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/tools/skills_tool.py#L634).

A Hermes user reported that the local memory scanner was hiding benign material. In a separate v0.23.2 trial, a flagged phrase hid an entire undivided memory entry from the prompt while the file on disk stayed intact. Putting the clean fact in its own entry made it visible. A memory written during the session also stayed out of that session's frozen starting snapshot and appeared after a fresh load. If the agent seems to have forgotten something, the first check is which entries actually made it into the prompt. [User report #156389](https://github.com/NousResearch/hermes-agent/issues/156389) · [Memory trial](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/hermes).

For the skill trial, the real skill tool saved a workshop dispatch convention with a field order, zero padding, and codes for two priorities. A local Qwen3.5 4B model missed both exact outputs when given only the task, and missed both again with the skill's catalog description. With the full skill loaded by a fresh process, it produced both expected strings. A separate call used `bp4` after another fresh process picked up a patch changing the previous code, `mz2`. The fixture chose which skill to pass to the model, so automatic discovery remains an open question. [Skill fixture and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/hermes).

The useful part is being able to inspect, edit, and test a procedure outside a conversation. Try it first on a task you repeat often enough to bring two real examples of a good result. Keep both examples with the rules. A valid-looking answer can still be following last week's convention.

### Plannotator — get a reply back to the work that asked for it

Plannotator initially gave people a visual way to mark up an agent's plan. The current product also has an Inbox for ongoing review. When an agent asks whether to keep timestamps in a report, the reply can live with that question while the person and the agent go back to other work. The service stores replies in a per-project event log, and its read path tracks which session has checked the reply. [February README](https://github.com/backnotprop/plannotator/blob/1d2948b6a6add18eac70b3511e3c7aa92473411f/README.md) · [Inbox store](https://github.com/backnotprop/plannotator/blob/55e6bbd2b16580b23b5926b235a314a17591d12a/packages/shared/inbox/store.ts) · [Read path](https://github.com/backnotprop/plannotator/blob/55e6bbd2b16580b23b5926b235a314a17591d12a/packages/server/inbox-mcp.ts#L1391).

A user reported that a different reader could consume a reply before the original T3 session granted the Inbox permission to wake it. The follow-up change preserved the original recipient's pending reply. In the published v0.29.0 app, the trial sent a reply from the browser and read that thread through a second local MCP identity. The second reader could see the answer and left the checked mark untouched. After a clean restart, the original identity could read the saved answer and advance the mark. There was no grant in this run, and no turn was queued. [User report #3339](https://github.com/backnotprop/plannotator/issues/3339) · [Fix #3348](https://github.com/backnotprop/plannotator/pull/3348) · [v0.29.0](https://github.com/backnotprop/plannotator/releases/tag/v0.29.0) · [Browser trial](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/plannotator).

An earlier v0.28.67 component trial went further with a scripted T3 service. A late grant led to one queued send, and its receipt survived reopening. A client being temporarily unreachable left the reply waiting. Those distinctions matter if you use Inbox to unblock a task. An answer visible on screen, a send queued for a host, and the agent continuing the work are three observations. Test the last one with the host you actually use before depending on unattended follow-through. [T3 trial and maintainer discussion](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-16/05-tuesday-inbox-ownership.md).

### NemoClaw — manage policy around an agent runtime

NVIDIA's NemoClaw handles agent onboarding and sandbox operations around OpenShell, which owns policy and provides the runtime boundary. The default installer pointed to the `lkg` ref at NemoClaw v0.0.144 on November 18. Its blueprint requires OpenShell 0.0.116, a pairing that matters when you're following instructions or investigating a failed upgrade. The official macOS binary reported that pinned version. [Installer](https://github.com/NVIDIA/NemoClaw/blob/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f/install.sh#L20) · [Blueprint](https://github.com/NVIDIA/NemoClaw/blob/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f/nemoclaw-blueprint/blueprint.yaml#L6) · [Architecture](https://docs.nvidia.com/nemoclaw/latest/user-guide/openclaw/about/how-it-works).

An earlier change moved durable policy ownership to OpenShell. The wrapper still has to tell an operator what happened to a request. Through the released client, a scripted explicit precondition refusal returned a rejection. A disconnect, timeout, and unclassified exit each returned an ambiguous outcome. The policy action can reread the current base policy and revision to see what landed. That is useful when a dropped response could follow a successful write. An older report about a refused provider switch also describes a generated provider left behind, a reminder that policy state and integration cleanup have separate outcomes. [Policy ownership change #10515](https://github.com/NVIDIA/NemoClaw/pull/10515) · [Policy action](https://github.com/NVIDIA/NemoClaw/blob/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f/src/lib/policy/index.ts#L1108) · [User report #13904](https://github.com/NVIDIA/NemoClaw/issues/13904).

The tests ran the client with scripted command results. The Mac lacked both documented container runtimes, so live gateway behavior and sandbox enforcement remain unverified. This is worth an operator's look if you want a packaged setup for OpenShell. Start on a supported disposable host and check which policy is active after a change and after a restart. [Prerequisites](https://docs.nvidia.com/nemoclaw/latest/user-guide/openclaw/get-started/prerequisites) · [Version and client trial](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/nemoclaw).

### GoDoxy — quiet hours for expected downtime

The first Radar covered GoDoxy as a reverse proxy that discovers containers and can sleep idle services, with Proxmox support already visible in March source. The return visit is about what happens after you route real services through it. A contributor running regular backups wanted a quiet window for the expected downtime. Earlier versions already checked health and sent down and recovery notices. The current monitor can defer an initial down notice, then send it on the first eligible failed check after the window without needing a fresh outage. [March source](https://github.com/yusing/godoxy/tree/213e4a5cdb635bf1f5f5985fd04515ad592497d5) · [Contributor's PR #296](https://github.com/yusing/godoxy/pull/296) · [v0.34.0 monitor](https://github.com/yusing/godoxy/blob/77cbac6b532d7d3881010eade21fe1a7f9e4bf8e/internal/health/monitor/monitor.go).

In loopback trials on v0.34.0, an outage that began and recovered entirely inside the quiet window emitted neither notice. If a down notice had already gone out before silence began, recovery still emitted an up notice. A separate trial held a service down across 04:00 with a controlled clock. The monitor called for one down notice, but the local webhook saw two POSTs because it answered the first with HTTP 503. The dispatcher retried, received 204, and later delivered one up notice. The number of POSTs depended on the receiver's response. [Monitor and webhook trials](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/godoxy).

This makes silence useful for an existing GoDoxy installation with predictable maintenance. Set the window per route, and check that your receiver handles repeated deliveries appropriately. The trials covered HTTP checks and a local webhook. Certificate setup, Proxmox, and container restarts remain outside that result.

## What the projects show

The trials put an interruption between an action and its expected result. Sometimes the delay was intentional. GoDoxy still showed the route as unhealthy and waited to send an alert. Sometimes a deliberate check was needed. NemoClaw's policy action can ask OpenShell what landed after an ambiguous response. The useful detail in both cases is that the tool has somewhere to look when the next step is unclear.

That distinction is harder to test in a demo where the skill is already loaded, the agent is online, or the webhook always returns 200. These four projects were chosen in part because their files, read marks, revisions, or delivery attempts give the operator something to inspect. A tool can expose those states and still need good defaults, a reliable runtime, or a clearer way to show them.

## What to try

Hermes is the smallest experiment if you already have a repeatable task and examples of the right result. Plannotator is the better first trial if feedback already gets lost between working sessions. Give it one real decision on the host you use, then close and reopen the host and see whether the answer reaches the waiting task.

For a GoDoxy operator, a narrow window around one backup is a useful starting point. It postpones the first alert if a real outage starts at the same time, so make the window only as long as the expected downtime. NemoClaw takes more setup to evaluate. Its release pair and read-back path tell you what to inspect on a supported host before you give it an ongoing workload.

## Sources

- [Hermes Agent source and MIT license](https://github.com/NousResearch/hermes-agent/tree/ae2a81ccc00e9b7c06301523e5bb09608397149c) · [Memory and skill experiments](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/hermes).
- [Plannotator source and MIT or Apache-2.0 licenses](https://github.com/backnotprop/plannotator/tree/55e6bbd2b16580b23b5926b235a314a17591d12a) · [Inbox experiments](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/plannotator).
- [NemoClaw source and Apache-2.0 license](https://github.com/NVIDIA/NemoClaw/tree/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f) · [OpenShell 0.0.116](https://github.com/NVIDIA/OpenShell/releases/tag/v0.0.116).
- [GoDoxy source and MIT license](https://github.com/yusing/godoxy/tree/77cbac6b532d7d3881010eade21fe1a7f9e4bf8e) · [Health and notification experiments](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/godoxy).

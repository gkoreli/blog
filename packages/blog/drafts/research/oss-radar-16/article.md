---
title: "OSS Radar #16: Saved Skills, Inbox Replies, and Health Checks"
seoTitle: "OSS Radar #16: Hermes, Plannotator, NemoClaw, and GoDoxy"
alternativeHeadline: "Four open-source projects tested through a config reload, a saved skill, a pending reply, and an uncertain policy edit"
date: "2026-11-19"
description: "GoDoxy repeated a down alert after a config reload. Tests of Hermes Agent, Plannotator, and NemoClaw show what to check when saved work is still pending."
section: oss-radar
series:
  id: oss-radar
  title: OSS Radar
  order: 16
tags: [oss-radar, open-source, developer-tools, agents, self-hosting]
---

# OSS Radar #16: Saved Skills, Inbox Replies, and Health Checks

Changing a quiet window in GoDoxy sent a second down alert for a route whose own settings stayed the same and whose health endpoint was still down. When the window expired on its own, the proxy sent only the alert it had deferred.

In Plannotator, another session could see a saved reply while the original session still had it waiting. Hermes Agent and NemoClaw raise a similar question. What can you check when a rule is saved or a change is submitted and the next step still matters?

## Sources and selection

Hermes Agent, Plannotator, and NemoClaw came from public GitHub release and implementation work. The selection follows three jobs that come up once an agent has ongoing work: carrying a procedure to a new session, getting a human decision back to the right task, and operating the runtime around it. GoDoxy returns from [the first Radar](/oss-radar-01-vercel-winter-2026-cohort), where it appeared in Vercel's Winter 2026 cohort. The return visit follows a maintenance problem raised by someone running scheduled backups.

The selection favors tools with a concrete operating question and enough public source and discussion to investigate it. The [release pins, fixtures, and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16) cover research through November 19, with AI assistance.

## The projects

### Hermes Agent — carry a procedure into the next session

If you keep explaining the same house rules to an agent, Hermes gives you two places to put them. Its memory files hold short facts and preferences that can enter the starting prompt. Skills are files with a catalog entry, loaded on demand. That gives a long procedure a place to live without putting it into every prompt. [Hermes Agent v0.23.2](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.2) · [Memory store](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/tools/memory_tool_store.py) · [Skill loading](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/tools/skills_tool.py#L634).

A Hermes user reported that the local memory scanner was hiding benign material. In a separate v0.23.2 trial, a flagged phrase hid an entire undivided memory entry from the prompt while the file on disk stayed intact. Putting the clean fact in its own entry made it visible. A memory written during the session also stayed out of that session's frozen starting snapshot and appeared after a fresh load. If the agent seems to have forgotten something, the first check is which entries actually made it into the prompt. [User report #156389](https://github.com/NousResearch/hermes-agent/issues/156389) · [Memory trial](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/hermes).

For the skill trial, the real skill tool saved a workshop dispatch convention with a field order, zero padding, and codes for two priorities. A local Qwen3.5 4B model missed both exact outputs with the task alone and with the catalog description. With the full skill supplied, it produced both expected lines and picked up a change to one of the priority codes. In the chat CLI, the model named the saved skill without calling it and asked where to find the record that the prompt had already supplied. In a fresh session with the same prompt and the skill explicitly preloaded, it returned the exact line. [Skill fixtures and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/hermes).

Try one task with a known-good result in a fresh session. Check whether the session loaded the saved skill and whether the output follows its rules. Explicit preload is available when you want to choose the procedure yourself.

### Plannotator — get a reply back to the work that asked for it

Plannotator initially gave people a visual way to mark up an agent's plan. The current product also has an Inbox for ongoing review. When an agent asks whether to keep timestamps in a report, the reply can live with that question while the person and the agent go back to other work. The service stores replies in a per-project event log, and its read path tracks which session has checked the reply. [February README](https://github.com/backnotprop/plannotator/blob/1d2948b6a6add18eac70b3511e3c7aa92473411f/README.md) · [Inbox store](https://github.com/backnotprop/plannotator/blob/55e6bbd2b16580b23b5926b235a314a17591d12a/packages/shared/inbox/store.ts) · [Read path](https://github.com/backnotprop/plannotator/blob/55e6bbd2b16580b23b5926b235a314a17591d12a/packages/server/inbox-mcp.ts#L1391).

A user reported that a different reader could consume a reply before the original T3 session granted the Inbox permission to wake it. The follow-up change preserved the original recipient's pending reply. In the published v0.29.0 app, the trial sent a reply from the browser and read that thread through a second local MCP identity. The second reader could see the answer and left the checked mark untouched. After a clean restart, the original identity could read the saved answer and advance the mark. There was no grant in this run, and no turn was queued. [User report #3339](https://github.com/backnotprop/plannotator/issues/3339) · [Fix #3348](https://github.com/backnotprop/plannotator/pull/3348) · [v0.29.0](https://github.com/backnotprop/plannotator/releases/tag/v0.29.0) · [Browser trial](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/plannotator).

An earlier v0.28.67 component trial went further with a scripted T3 service. A late grant led to one queued send, and its receipt survived reopening. A client being temporarily unreachable left the reply waiting. Those distinctions matter if you use Inbox to unblock a task. An answer visible on screen, a send queued for a host, and the agent continuing the work are three observations. Test the last one with the host you actually use before depending on unattended follow-through. [T3 trial and maintainer discussion](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-16/05-tuesday-inbox-ownership.md).

### NemoClaw — manage policy around an agent runtime

NVIDIA's NemoClaw handles agent onboarding and sandbox operations around OpenShell, which owns policy and provides the runtime boundary. On November 19, the default install ref resolved to NemoClaw v0.0.145 and required OpenShell 0.0.116. The previous v0.0.144 tag paired with the same OpenShell release, and the policy client and read-back files checked for this issue match across the two tags. The official OpenShell macOS CLI reported 0.0.116. [Current installer](https://github.com/NVIDIA/NemoClaw/blob/6f36feffb7a0f448194eafef3042e7ad47faa0de/install.sh#L20) · [Blueprint](https://github.com/NVIDIA/NemoClaw/blob/6f36feffb7a0f448194eafef3042e7ad47faa0de/nemoclaw-blueprint/blueprint.yaml#L6) · [Architecture](https://docs.nvidia.com/nemoclaw/latest/user-guide/openclaw/about/how-it-works).

An earlier change moved durable policy ownership to OpenShell. The wrapper still has to tell an operator what happened to a request. Through the released client, a scripted explicit precondition refusal returned a rejection. A disconnect, timeout, and unclassified exit each returned an ambiguous outcome. The policy action can reread the current base policy and revision to see what landed. That is useful when a dropped response could follow a successful write. An older report about a refused provider switch also describes a generated provider left behind, a reminder that policy state and integration cleanup have separate outcomes. [Policy ownership change #10515](https://github.com/NVIDIA/NemoClaw/pull/10515) · [Policy action](https://github.com/NVIDIA/NemoClaw/blob/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f/src/lib/policy/index.ts#L1108) · [User report #13904](https://github.com/NVIDIA/NemoClaw/issues/13904).

The client trial and the upstream policy tests used scripted results at v0.0.144. An ambiguous submission counted as applied when the authoritative read-back matched. When read-back was unavailable, the update remained unconfirmed. Live gateway behavior and sandbox enforcement remain unverified. On a supported disposable host, check which policy is active after a change and after a restart. [Read-back tests](https://github.com/NVIDIA/NemoClaw/blob/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f/src/lib/policy/policy-live-state.test.ts#L636) · [Client trial](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/nemoclaw).

### GoDoxy — quiet hours for expected downtime

The first Radar covered GoDoxy as a reverse proxy that discovers containers and can sleep idle services, with Proxmox support already visible in March source. The return visit is about what happens after you route real services through it. A contributor running regular backups wanted a quiet window for the expected downtime. Earlier versions already checked health and sent down and recovery notices. The current monitor can defer an initial down notice, then send it on the first eligible failed check after the window without needing a fresh outage. [March source](https://github.com/yusing/godoxy/tree/213e4a5cdb635bf1f5f5985fd04515ad592497d5) · [Contributor's PR #296](https://github.com/yusing/godoxy/pull/296) · [v0.34.0 monitor](https://github.com/yusing/godoxy/blob/77cbac6b532d7d3881010eade21fe1a7f9e4bf8e/internal/health/monitor/monitor.go).

The released v0.34.0 proxy ran two file-configured routes in a Linux VM. Both health endpoints returned 503. One route inherited the quiet window and kept probing without sending a down alert. The other used an empty silence list and alerted on its first failed check. Removing the global window reloaded the configuration and sent two alerts, one for the deferred outage and one for the unchanged route that had already alerted. The webhook accepted every delivery. In the run with no config edit, reaching the end of the window sent only the deferred alert. Both routes sent recovery alerts when their health checks returned 200 again. [Release-binary fixture and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/godoxy).

There are two ways a receiver can get a second message. In a separate trial, one down alert caused two webhook requests because the first returned HTTP 503. The reload produced a fresh alert even with a healthy receiver. If you edit a maintenance window mid-outage, account for the possibility of repeat alerts from the routes already down. [Webhook retry control](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-16/godoxy/results/webhook-2026-11-18.json).

## What the projects show

Each tool gives you a record of one step in a longer operation. When an agent recognizes a skill, check the load and compare its output with a known-good result. When an Inbox reply is visible, check whether the intended session acknowledged it. For a policy edit, read the active revision before retrying an uncertain write. For an alert, look at both the monitor and what the receiver accepted.

## What to try

Hermes is the smallest experiment if you already have a repeatable task and an example of the right result. Plannotator is worth trying if feedback gets lost between sessions. Give it one real decision and check whether the waiting task continues after reopening your host.

For an existing GoDoxy setup, start with one scheduled backup and check what your receiver gets if the outage runs long. NemoClaw needs a supported runtime for a useful operating trial. The version pair and read-back path give you a starting point for that check.

## Sources

- [Hermes Agent source and MIT license](https://github.com/NousResearch/hermes-agent/tree/ae2a81ccc00e9b7c06301523e5bb09608397149c) · [Memory and skill experiments](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/hermes).
- [Plannotator source and MIT or Apache-2.0 licenses](https://github.com/backnotprop/plannotator/tree/55e6bbd2b16580b23b5926b235a314a17591d12a) · [Inbox experiments](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/plannotator).
- [NemoClaw source and Apache-2.0 license](https://github.com/NVIDIA/NemoClaw/tree/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f) · [OpenShell 0.0.116](https://github.com/NVIDIA/OpenShell/releases/tag/v0.0.116).
- [GoDoxy source and MIT license](https://github.com/yusing/godoxy/tree/77cbac6b532d7d3881010eade21fe1a7f9e4bf8e) · [Health and notification experiments](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-16/godoxy).

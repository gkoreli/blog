---
title: "OpenWiki Validates My Bet: The Backlog Is the Memory"
seoTitle: "OpenWiki Validates Backlog MCP's Agent Memory Bet"
alternativeHeadline: "OpenWiki, Backlog MCP, and why an agent's work should become its memory"
date: "2026-07-23"
description: "OpenWiki validates the core bet behind backlog-mcp: an agent's live tasks, decisions, evidence, and artifacts can become its durable memory."
section: engineering
tags: [backlog-mcp, openwiki, agent-memory, context-engineering, mcp]
series:
  id: backlog-mcp-saga
  title: "The backlog-mcp saga"
  order: 2
---

# OpenWiki Validates My Bet: The Backlog Is the Memory

*LangChain builds agent memory from sources; backlog-mcp builds it from the work itself.*

OpenWiki validates the idea I have spent more than six months turning into a system: **an agent’s backlog is its memory.**

LangChain reached the same problem by reading what already exists. OpenWiki turns code, email, notes, and web sources into a local wiki. backlog-mcp records tasks, decisions, evidence, and memory while an agent works. Both end in durable files. The timing changes what those files can do.

The names matter. [OpenWiki](https://github.com/langchain-ai/openwiki) is a LangChain project. Google created the [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md), or OKF. Google published its draft on June 12. LangChain released OpenWiki for codebases on July 1, expanded it into [general-purpose “Brains”](https://www.langchain.com/blog/introducing-openwiki-brains-general-purpose-wiki-memory-for-agents) on July 10, and added [OKF support](https://www.langchain.com/blog/openwiki-0-2-adds-okf-support) on July 16.

In fifteen days, OpenWiki added personal memory and OKF support to its repo-docs base. The category now has products, a public format, and competing designs.

## I reached the same problem through tasks

I built the first backlog-mcp prototype on December 19, 2025, because agent plans and research disappeared when sessions ended. The first prototype modeled strict task state; disk-backed storage followed the next day. By the third pull request, each task had become its own Markdown file with YAML frontmatter.

Each real run exposed another gap. Tasks needed attached research. Agents needed search, related context, and a way to recover after a context reset. By June, that path had produced four memory verbs: `wakeup`, `recall`, `remember`, and `forget`.

I documented that path in [117 Pull Requests Later, It Wasn’t a Task Manager Anymore](https://gkoreli.com/one-hundred-pull-requests). The repository history matters here. Each session showed what the next session would lack, so task state became memory.

OpenWiki now confirms two choices behind that work: durable agent context belongs in readable files, and agents should open only the part they need. Google’s OKF defines a public format using Markdown, YAML frontmatter, links, and directory indexes, with Git as the recommended way to ship a bundle. OpenWiki turns that base into a product: generate the wiki, point `AGENTS.md` and `CLAUDE.md` at it, then provide a scheduled workflow to update it.

## The direct comparison

| Question | OpenWiki | backlog-mcp |
| --- | --- | --- |
| What is its main job? | Build and maintain code or personal wikis | Store and preserve live agent work state |
| Where does memory come from? | Repositories and connected sources | Tasks, decisions, artifacts, evidence, and explicit memories |
| How does it write? | Connectors fetch or expose source data, then an agent synthesizes pages | Agents start, block, complete, attach, remember, and correct |
| What is the data model? | OKF concepts: Markdown, frontmatter, open `type` values, and links | Substrates: schemas, relations, lifecycle, identity and disclosure rules, and allowed actions |
| How does an agent retrieve context? | Code mode points instruction files at the wiki; Personal Brain navigates its local wiki with file tools | Bounded `wakeup`, hybrid `recall` and `search`, then `get` to expand |
| What is strongest today? | Setup, connectors, scheduled updates, and OKF support | Operational state, typed writes, retrieval, provenance, and a live viewer |

They differ most at the write boundary. OpenWiki synthesizes pages from other sources. [backlog-mcp’s accepted docs-native design](https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0112-docs-native-project-scoped-backlog.md) makes its Markdown the state agents update and act on. Personal Brain also maintains commitments and open questions, but its default path derives pages from sources. backlog-mcp applies enforced transitions inside the work loop. The comparison comes down to one line: **OpenWiki builds memory from sources; backlog-mcp builds memory from the work itself.**

Suppose an agent tries a database migration, finds a locking problem, blocks the task with the cause, attaches its test results, then completes the task with the final patch as evidence. The next agent needs that chain: the goal, the failed attempt, the constraint, the decision, and the result. A later summary can preserve the result. The live record preserves each step that produced it.

backlog-mcp records those state changes as they happen. Through its agent-facing intent tools, a task is not a page that describes work. It is live state with enforced transitions. An artifact keeps the output next to the work that caused it. An ADR preserves the choice and its grounds. A memory can point back to all of them, expire, or supersede an older fact without erasing history.

That is why the backlog becomes memory. It preserves what changed and why at the moment it happens instead of deriving that state from other sources.

## The substrate is more than a format

OKF stays small on purpose. Its `type` is an open string, and the specification has no schema registry or required runtime. That makes it a strong exchange format.

[backlog-mcp’s substrate model](https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0098-unified-substrate-architecture.md) takes on a different job. A declaration can define validation, identity, relations, workflow, agent actions, and retrieval rules. Built-in types add viewer metadata and agent hints. [Projects can declare new types as data](https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0113-user-defined-substrates.md) with bounded JSON Schema. Task intents enforce `start`, `block`, and `complete`; the memory loop supports `remember`, supersede-on-write, and `forget`. Both paths validate writes in the core.

Its retrieval path is also further along. `wakeup` gives an agent a small opening brief. `recall` combines text and local vector search, returns short stubs, and can pack them to a set token budget. The agent expands only useful items. The read-only viewer exposes the same state, including old or conflicting memory, without creating a second edit path.

On operational memory, backlog-mcp is ahead today. That lead is narrow and testable: richer state, stricter writes, deeper retrieval, and direct use during execution.

I cannot call the whole product mature yet. The [changelog](https://github.com/gkoreli/backlog-mcp/blob/main/CHANGELOG.md) makes that plain. I moved substrate storage into project docs on July 16, fixed recall bugs on July 18, and fixed a viewer hang with a 1,300-document home on July 20. The test set is small, and the declarative type system is young. The architecture is ahead of the product’s proof and polish.

## Where OpenWiki beats me

OpenWiki has the better name, the easier pitch, and the cleaner first run. Install one CLI, point it at sources, and get a visible wiki. Its connectors and update workflows package the dull work of gathering and refreshing knowledge. Its fast adoption of OKF gives other tools a defined format to consume; backlog-mcp does not yet export one.

backlog-mcp still carries its history in public. The name sounds like a task tracker tied to one protocol. Users must grasp substrates, memory verbs, a daemon, an MCP surface, and a viewer. That makes the value hard to see in the first run.

OpenWiki made the first five minutes clear. I spent more than six months building for the next six weeks. backlog-mcp needs both.

## What I take from the convergence

I should test an OKF export without changing backlog-mcp’s core. Substrates already hold more structure than OKF requires, so an export can remain a view instead of becoming another authoritative copy. OpenWiki could supply source-derived knowledge. backlog-mcp could preserve the live state, decisions, and evidence produced while agents act on it.

The deeper question is whether an agent should derive memory from existing sources or write memory into live work as it happens. backlog-mcp is my answer: **the work already contains the memory.**

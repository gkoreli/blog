---
title: "OpenWiki Validates My Bet. I Still Don't Know Where the Memory Should Live"
seoTitle: "OpenWiki Validates Backlog MCP—But Its Architecture Is Still Unsettled"
alternativeHeadline: "Project-home sprawl, unreadable filenames, and the name I still cannot replace"
date: "2026-07-23"
description: "OpenWiki validates the core bet behind backlog-mcp. It does not solve the harder questions I now face about where agent memory lives, how its files read, or what to call the product."
section: engineering
tags: [backlog-mcp, openwiki, agent-memory, context-engineering, mcp]
series:
  id: backlog-mcp-saga
  title: "The backlog-mcp saga"
  order: 2
---

# OpenWiki Validates My Bet. I Still Don't Know Where the Memory Should Live

OpenWiki validates the idea I have spent more than six months turning into a system: **an agent’s backlog is its memory.**

The timing feels good. It also catches me in the middle of a design mess.

I started [backlog-mcp](https://github.com/gkoreli/backlog-mcp) in December because agent plans, research, and failed attempts kept dying with the session. A task list became a set of Markdown files. Then tasks gained artifacts, decisions, links, search, and memory. By June, an agent could `wakeup`, `recall`, `remember`, and `forget`.

I had reached a broader claim: the record of the work is the memory. The goal, the failed attempt, the reason a task got blocked, and the final evidence already contain what the next agent needs.

[OpenWiki](https://github.com/langchain-ai/openwiki) reaches the same need from another direction. Its Code Brain turns a repository into maintained documentation. Its Personal Brain pulls from sources such as email, Notion, and Git, then writes a local wiki for agents. OpenWiki 0.2 also adopted Google’s [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md): Markdown, frontmatter, links, and directory indexes.

That is real validation. Durable agent context should live in files that humans can inspect and agents can open as needed.

It does not prove that my current design is right.

## The overlap—and the line between us

OpenWiki builds memory by reading sources and writing a useful account of them. backlog-mcp records state while the work happens.

| Question | OpenWiki | backlog-mcp |
| --- | --- | --- |
| Where does memory come from? | Repositories and connected sources | Tasks, decisions, artifacts, evidence, and explicit memories |
| When is it written? | During an ingest or update run | During the work itself |
| What does it store? | A maintained wiki | Live state with rules, links, and history |
| How does an agent retrieve it? | Files, instruction links, and wiki navigation | `wakeup`, hybrid `recall`, search, then `get` |

That last part matters to me. A task can be started, blocked with a cause, and completed with evidence. A memory can replace an older belief without deleting it. A decision can link back to the work that forced it. The files do not only explain the project. Agents act on them.

I still think backlog-mcp is ahead on this narrow problem: memory written inside the work loop, with strict types and bounded retrieval. OpenWiki is far ahead on the first five minutes. Its name explains the product. Its install ends with something visible. Mine asks users to learn what a “substrate” is.

The architecture may be deeper. The product is less clear.

## I fixed one pile and created many homes

For most of its life, backlog-mcp had one global home under `~/.backlog`. It worked until it worked too well. I ended up with almost 1,000 tasks and artifacts in one place. Finding the right epic became work. Old projects stayed mixed with active ones. I had built a system to preserve context, then started avoiding it because the preserved context had become hard to place.

So I made what felt like the clear move: [bolt backlog-mcp onto each repository](https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0112-docs-native-project-scoped-backlog.md).

Now a repository’s `docs/` directory can hold its tasks, decisions, requirements, memories, and any custom document type it declares. The Markdown is the truth. Git can review it. The hidden `.backlog/` folder holds only indexes and local state. Existing docs work on day one; the tool does not need to import or rewrite them.

I still believe in most of that.

But project homes spread fast. Every repository I touch can become another home. The viewer now keeps a recent-homes list because otherwise I cannot find them again. That solved discovery and made the sprawl visible.

Now I am asking questions I thought the architecture had answered.

Where should a memory that spans three projects live? If it goes global, agents working in a project may miss it. If I copy it into each home, which copy is true? If every small repository owns a separate backlog, have I restored order or only split one pile into smaller piles?

Cross-home search helps me find things. It does not tell me where they belong.

I am genuinely considering going back to one home for all tasks and memory. Repositories could keep their own durable docs while the operational backlog stays central. That would restore one place to wake up, recall, and manage work. It could also recreate the exact scaling problem that project homes were meant to fix.

I do not know yet. I need to use the system longer and feel which failure costs more: one crowded home or many fragmented ones.

## The files should work without my product

The project-home shift made another flaw obvious. A file called `TASK-0042.md` is readable once opened, but useless in a directory listing. The title is trapped inside the file.

I want managed writes to produce names such as `TASK-0042-fix-home-discovery.md`. backlog-mcp already parses slugged filenames and preserves them when they exist. It still creates new files with the ID alone.

Adding the slug sounds easy. The policy is not. Should the slug stay fixed when the title changes, leaving an old description in the path? Or should the file move, creating Git churn and breaking links that point to it?

I lean toward a fixed slug set at creation. The ID remains the identity; the slug gives a human enough context to browse the files without backlog-mcp. A stale hint may be better than an unstable path. I have not made that call.

This is one test I want every part of the system to pass: if backlog-mcp vanished tomorrow, the repository should still make sense.

## I also need to kill the name

“backlog-mcp” is now a bad name.

“Backlog” says task tracker. The product stores decisions, requirements, memory, evidence, and project knowledge. “MCP” names one way to reach it, not what it does. I have to explain past the name before I can explain the product.

There is already a long naming proposal in the repository. It scores candidates, checks package names, and recommends **Kvali**, the Georgian word for “trace.” I have not accepted it.

I can defend the architecture with code and use. I cannot make myself love a name through a scoring table.

This bothers me more than it should. I need to rename the product, but I do not want to swap one temporary name for another and repeat the migration six weeks later. Package names, command names, tool prefixes, config, and search results all start to harden once a name ships. I am afraid of committing too early, and tired of carrying a name I already know is wrong.

The names I love tend to arrive whole. They stick at once. This one has not arrived.

## Validation is not resolution

OpenWiki gives me confidence in the category: agents need durable knowledge outside their context windows, stored in files they can retrieve a piece at a time.

It does not settle my storage boundary, my filename policy, or my name.

That is where the project stands today. The core bet looks stronger than it did a month ago. The product around it feels less settled because real use keeps exposing choices I can no longer hide behind implementation.

I would rather publish that state than clean it up into a false success story. OpenWiki validates the direction. I am still working out the shape.

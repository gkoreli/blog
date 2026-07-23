---
title: "OpenWiki Validates My Bet. I Still Don't Know Where the Memory Should Live"
seoTitle: "OpenWiki Validates Backlog MCP—But Its Design Is Still Unsettled"
alternativeHeadline: "One backlog became too large. Project homes became too many."
date: "2026-07-23"
description: "OpenWiki validates the main idea behind backlog-mcp. It also forces me to face three problems I have not solved: where agent memory lives, how its files read, and what to call the product."
section: engineering
tags: [backlog-mcp, openwiki, agent-memory, context-engineering, mcp]
series:
  id: backlog-mcp-saga
  title: "The backlog-mcp saga"
  order: 2
---

# OpenWiki Validates My Bet. I Still Don't Know Where the Memory Should Live

OpenWiki validates the idea I have spent more than six months building: **an agent’s backlog is its memory.**

I should feel proven right. Instead, I am staring at three design choices I have not solved.

I started [backlog-mcp](https://github.com/gkoreli/backlog-mcp) in December because useful context kept dying with each agent session. I first stored tasks as Markdown. Then tasks gained linked records and memory. By June, an agent could `wakeup` into a project and `recall` what prior agents had learned.

The work record often held more useful memory than a later summary. A task kept the goal and why work stopped. The next agent needed that record.

The backlog is the memory.

[OpenWiki](https://github.com/langchain-ai/openwiki) starts with source material instead. Its code mode turns a repository into docs for agents. Its personal mode reads sources such as email and Notion, then writes a local wiki. OpenWiki now emits Google’s [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md): Markdown files with YAML frontmatter and links.

That is strong proof from outside my project. Agent memory should live in plain files that people can inspect and agents can read a piece at a time.

It does not prove that my design is right.

## The direct comparison

OpenWiki reads sources and writes a useful account of them. backlog-mcp records state while the work happens.

| Question | OpenWiki | backlog-mcp |
| --- | --- | --- |
| Where does the content come from? | Repositories and linked sources | Work records and explicit memories |
| When does it get written? | During an ingest or update run | During the work |
| What does it store? | A maintained wiki | Typed state with links |
| How does an agent find it? | Files, instruction links, and wiki navigation | `wakeup` and bounded `recall` |

An agent can block a task with a reason and finish it with proof. A new memory can replace an old belief without erasing it. These files do more than explain the project. Agents use them to run the work.

backlog-mcp goes further on this part: agents write memory while they work, with clear types and retrieval limits.

OpenWiki has the better first five minutes. Its name tells me what it is. One install gives me something I can see. backlog-mcp asks people to learn terms such as “substrate” before they know why they should care.

I have built a wider system with worse boundaries and a name that misleads people.

## One backlog became too large

For most of its life, backlog-mcp kept one global home under `~/.backlog`. It worked until I had almost 1,000 tasks and artifacts there. Old projects mixed with active ones. Finding the right epic took too long.

I built the tool to save context. I then began to avoid it because I could no longer place what it had saved.

So I changed the design. I let each repository become a [project home](https://github.com/gkoreli/backlog-mcp/blob/main/docs/adr/0112-docs-native-project-scoped-backlog.md).

A repository can now keep its tasks and memories in `docs/`. Markdown holds the record, and Git can review each change. The hidden `.backlog/` folder holds indexes and local state.

I still believe in that part.

The trouble starts when every repository becomes a home. I now have to remember which homes exist. The viewer keeps a list of recent homes because I would lose them otherwise. That list fixed discovery and showed me how much the data had spread.

Where should a memory shared by several projects live? A global memory may never reach the agent inside a project. Copies in each home can drift apart. Cross-home search can find them, but it cannot tell me which copy owns the truth.

I am now thinking about undoing part of the project-home choice.

One home could hold all tasks and memory. Repositories could keep their own long-lived docs. An agent would have one place to wake up and recall prior work, while each codebase would still carry the docs that belong to it.

That split may bring back the same scale problem. One home grew too large before. Many homes now break up the full history.

I do not know which cost is worse. I need more use, not another design note written before the answer is clear.

## The files need to work without backlog-mcp

Project homes exposed another flaw. `TASK-0042.md` means little in a directory list. Its title sits inside the file, so the listing does not show it.

I want new files to look like `TASK-0042-fix-home-discovery.md`. backlog-mcp already reads slugged names and keeps them when they exist. It still creates new files with the ID alone.

The code change is small. The rule is hard.

If the title changes, should the slug stay fixed and become stale? Should the file move, add noise to Git, and risk old links?

I lean toward setting the slug once, when backlog-mcp creates the file. The ID remains its identity. The slug gives people enough context to browse without backlog-mcp. A stale hint seems less harmful than an unstable path, but I have not made the call.

If backlog-mcp vanished tomorrow, the repository should still make sense.

## I need a new name

“backlog-mcp” is a bad name now.

“Backlog” says task tracker. The product also stores agent memory and project knowledge. “MCP” names one way to reach it. The name forces me to correct its meaning before I can explain the product.

The repository already has a long naming note. It scores options, checks package names, and picks **Kvali**, the Georgian word for “trace.” I have not accepted it.

A scorecard can tell me whether a name is free. It cannot make me like the name.

I know the delay has a cost. Each new user learns a name I plan to drop, and each new doc page adds to the rename work. Still, I do not want to choose a second temporary name and repeat the work six weeks later.

I am afraid of choosing too soon. I am also tired of keeping a name that I know is wrong.

The names I have loved felt right at once. I have not found that name here.

## What OpenWiki changed for me

OpenWiki makes me more sure that agents need durable knowledge outside their context windows. It supports my choice to keep that knowledge in plain files and read it in small pieces.

It also makes my open problems harder to ignore. I need a clear rule for where memory lives. The files must make sense without the tool. The name must describe the product.

I could write that I saw this first and stop there. That would hide the useful part: real use has exposed flaws in a system whose main idea still works.

OpenWiki validates my bet. I still have to decide which parts of my own design to undo.

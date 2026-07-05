---
title: "What If the Agent Was Better Before We Helped?"
seoTitle: "Evaluating Agentic Tools: What If the Agent Was Better Before We Helped?"
date: "2026-07-05"
description: "Everyone talks about evaluating agents and agentic harnesses. I think the bigger missing layer is evaluating the tools we keep giving them: skills, CLIs, wrappers, memory layers, and repo scanners."
section: engineering
tags: [agentic-engineering, evals, ghx, claude-code, codex, hermes]
series:
  id: ghx-field-notes
  title: ghx field notes
  order: 3
---

# What If the Agent Was Better Before We Helped?

Everyone talks about evaluating agents.

Fewer people talk about evaluating the tools we keep giving them.

That gap feels weird to me.

We evaluate models. We evaluate agentic harnesses. We build benchmarks for coding agents, browser agents, long-horizon agents, support agents, research agents. We ask whether the agent can solve the task, whether the harness keeps it on track, whether the trajectory makes sense, whether the final answer passes.

Good. We need that.

But then in day-to-day agentic engineering, we add a pile of intermediate things around the agent and treat them like obvious improvements:

- Claude and Codex wrappers
- Hermes skills
- slash commands
- custom CLIs
- repo scanners
- memory layers
- tool descriptions
- prompt libraries
- context pipelines
- small harnesses that only exist inside one person's workflow

And then we rarely ask the uncomfortable baseline question:

> "Can the original agent do better without all this bloat?"

That is the part I cannot stop thinking about.

## The hidden layer nobody wants to measure

The easiest way to make an agentic workflow feel more engineered is to add scaffolding.

Write a skill. Add a CLI. Add a wrapper. Add a routing rule. Add a memory file. Add a convention. Add a project-specific tool. Add an MCP server. Add a command that injects 700 lines of instructions before every task. Add another command because the first command needed instructions too.

This often feels productive.

It feels like you are improving the agent because you are doing engineering around the agent. You are reducing friction. You are encoding knowledge. You are removing repeated explanations. You are giving the model a sharper interface to the world.

Sometimes that is true.

Sometimes it is just ceremony.

Sometimes the tool makes the agent faster at the wrong thing. Sometimes the skill file anchors it into stale assumptions. Sometimes the wrapper hides useful context. Sometimes the memory layer pollutes the task. Sometimes the CLI saves one tool call but costs more tokens in instructions than it saves in output. Sometimes the agent would have solved the task better if you had left it alone.

That last sentence is painful if you like building tools.

I like building tools.

## I am not above this

I am one of those people most of the time.

I build agent tooling because I keep hitting real pain. I wrote the origin story in [Build the GitHub Exploration Tool, No Mistakes](/build-the-github-exploration-tool-no-mistakes), but the short version is: I built [ghx](https://github.com/gkoreli/ghx), a code reconnaissance CLI for agents, because agents were terrible at exploring GitHub through normal web fetches and raw `gh` commands. They drowned in HTML. They guessed wrong API shapes. They burned context reading files they did not need. They searched badly. They made repo exploration feel much dumber than it had to be.

So I built a tool.

That instinct still feels right to me. ghx gives an agent surgical GitHub context: repo structure, README, file maps, batched reads, code search, and codemode-style multi-step exploration in one CLI. In theory, that should help agents reason about unfamiliar codebases with less waste.

But "in theory" is exactly the problem.

For the first time, I am trying to gate the engineering of ghx on the question I usually avoid:

> "Does the agent perform better with my CLI than without it entirely?"

Not: does ghx feel elegant?

Not: did I reduce a few manual steps?

Not: can I tell a good story about progressive disclosure and context engineering?

The question is more annoying than that.

If I give the same task to the same agent, with and without ghx, does the ghx-enabled agent produce a better result? Does it finish faster? Does it use fewer tokens? Does it make fewer wrong turns? Does it inspect the right files earlier? Does it avoid hallucinating repo structure? Does it recover better when the initial guess is wrong?

Is the signal per token increasing or decreasing?

That is the only question that matters if I am claiming the tool improves the agent.

## Agent evals are not enough

This is where I think a lot of the current eval conversation misses a layer.

If you evaluate the final agent system, you can tell whether the whole thing worked. But you may not know which part helped and which part hurt.

Maybe the base model improved.

Maybe the harness helped.

Maybe the skill helped.

Maybe the skill hurt, but the model was strong enough to recover.

Maybe the CLI reduced output tokens but increased planning errors.

Maybe the wrapper made simple tasks faster and hard tasks worse.

Maybe the tool looks great in traces because the agent calls it confidently, but the final answer is worse because it stopped doing its own exploration.

If all you measure is the finished agentic system, every piece of scaffolding gets to hide inside the aggregate result.

That is not enough.

The tool itself needs an eval.

Not a vanity benchmark. Not a demo task where the tool obviously wins. A real A/B test against the uncomfortable baseline: same agent, same task, same budget, with and without the tool.

For ghx, that means tasks like:

- find the right file in an unfamiliar repo
- explain how a feature is implemented
- identify where to patch a bug
- compare two APIs in a codebase
- trace a call path without reading half the repository
- answer a repo question with citations to exact files

Then compare the runs.

Did ghx actually help? Where? By how much? What did it make worse? Which tasks should not use it? When is raw Claude Code or Codex already good enough?

That last question matters.

Because the goal is not to build more tools around agents. The goal is to make agents better at the actual work.

## Bad evals can become fake rigor too

The opposition to this is reasonable.

People can say evals are expensive. They can say agent workflows are messy. They can say static tasks do not capture production reality. They can say personal tools are about taste and friction, and not everything needs a benchmark.

I agree with parts of that.

Bad evals can absolutely become fake rigor. You can overfit to a tiny set of tasks. You can measure the wrong thing. You can reward the agent for looking clean instead of being correct. You can build an eval that flatters your tool because you secretly wrote the benchmark around the tool's strengths.

That is real.

But the answer cannot be to avoid measurement entirely.

If my only evidence is "it feels better," I am just doing vibes with extra steps.

And if I am building a code reconnaissance tool for agents, the bar should be higher than my personal feeling that the workflow is nicer. At minimum I should be able to show a few tasks where the tool beats the baseline, a few tasks where it does not, and a clear explanation of when to use it.

That is the part that feels missing: not perfect evals, but honest deltas.

Did this tool improve the agent on the work it claims to improve?

## The annoying part: this is hard

I am fuming at how hard it is to run this eval cleanly.

The high-level idea is simple:

1. Pick representative repo-understanding tasks.
2. Run the same agent with ghx available.
3. Run the same agent without ghx.
4. Compare correctness, tokens, time, file choices, tool calls, and quality of reasoning.
5. Repeat enough times that one lucky run does not become the story.

But every step gets annoying fast.

What is the task format? How do I prevent the task from leaking the answer? How do I judge correctness without spending more time grading than building? How do I keep the agent from using other tools that mask the difference? How do I compare a run where one agent reads ten files and another reads three but gets the right answer? How do I avoid optimizing ghx for a toy benchmark that has nothing to do with real agentic engineering?

There are libraries and patterns for model evals. There are harnesses for agent evals. There are benchmarks for coding agents.

But for this middle layer — the skills, CLIs, wrappers, repo scanners, memory layers, and tool descriptions we keep handing to agents — the patterns feel much less established.

That is the gap.

We need evals for agentic tools themselves.

Not because every tool needs a leaderboard.

Because every tool that claims to make an agent better should be willing to face the baseline it is replacing.

## The baseline is the product manager

The baseline is uncomfortable because it acts like a product manager with no sentimentality.

It does not care that I spent weeks building the tool.

It does not care that the architecture is elegant.

It does not care that the CLI feels clean.

It asks one brutal question:

> "Would the agent have done better without this?"

That question protects the work from my ego.

It also protects the agent from my desire to build around it forever.

Because agentic engineering has a dangerous failure mode: agents let us build scaffolding extremely fast, and then that scaffolding becomes part of the system before anyone proves it deserves to exist.

We can create bloat at agent speed now.

Skills, wrappers, tools, memories, hooks, commands, orchestration layers. Some of them are real leverage. Some of them are coping mechanisms. Some of them are just my discomfort with letting the base agent try.

The only honest way through is to measure the deltas.

Not perfectly.

Not with fake academic confidence.

But enough to know whether the tool is earning its context.

Enough to know whether the signal per token is increasing or decreasing.

Enough to know whether I helped the agent, or just built a ritual around it.

That is the standard I want for ghx.

And I think it should be the standard for a lot more agentic tools too.

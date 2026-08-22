---
title: "What If the Agent Was Better Before We Helped?"
seoTitle: "What If the Agent Was Better Before We Helped? — ghx, Agent Sidecars, and Evals"
date: "2026-07-05"
lastModified: "2026-08-21"
description: "I am building ghx, a code reconnaissance CLI for AI agents, and now an agent sidecar framework around it. The hard question is whether any of it actually improves signal per token compared to plain old gh."
section: engineering
tags: [agentic-engineering, evals, ghx, sidecar-agents, opentelemetry, acp]
series:
  id: ghx-field-notes
  title: ghx field notes
  order: 3
---

# What If the Agent Was Better Before We Helped?

I am building [ghx](https://github.com/gkoreli/ghx), a code reconnaissance CLI for AI agents.

That is the clean sentence.

The messier truth is that I am now building at least four things at the same time:

- ghx, the CLI tool
- ghx-sidecar, a specialist code reconnaissance agent that uses ghx under the hood
- an agent sidecar framework, where a main agent delegates a whole competence domain to a cheaper specialist agent
- an eval framework, because I do not trust myself to decide whether any of this deserves to exist by vibes

This is a ridiculous stack of work to create for one product question, but the question is harsh enough that I do not see a shortcut anymore:

> Does ghx actually make agents better, or did I build a beautiful ritual around `gh`?

## The obvious story is not enough

The obvious story for ghx is easy to tell.

Agents are bad at exploring GitHub through generic tools. They fetch HTML pages and drown in navigation junk. They use `gh` but guess the wrong API shapes. They read too many full files when they only needed a map. They search badly. They burn context on repo reconnaissance that should have been cheap and surgical.

So ghx exists to give agents the thing they wanted in the first place:

- repo structure and README in one call
- file maps instead of full file dumps
- batched reads
- code search with better context
- codemode-style multi-step exploration
- less irrelevant context in the main agent's window

That story still feels true to me.

The technological positioning matters here too: ghx is not trying to be Codemap. It sits one step earlier.

[Codemap](https://github.com/JordanCoin/codemap) is useful when a repository has already earned deeper structural analysis: clone the code, build a map, understand the local shape. That is a real step. The mistake is making it the first step.

A lot of agent workflows jump there too early. The agent starts with `gh`, reads random files, maybe clones the repo, maybe runs Codemap, maybe packs too much context, and suddenly a simple reconnaissance question has turned into a context bonfire.

Most of the time the first question is not "map this repo." The first question is:

> is this repo, file, package, function, or pattern even worth reading?

ghx is the layer before the heavier tools: remote-first reconnaissance, repo structure, search, file maps before full reads, narrow reads before local analysis. It helps the agent decide whether deeper work is justified before the workflow commits to it.

That is why "just let the agent use `gh` and Codemap" misses the point. The expensive part is not only the tool call. It is the uncertainty the agent drags through its context while figuring out what it should have looked at in the first place.

In the future, if the sidecar thesis works, the main agent will not care about this distinction at all. ghx-sidecar will decide when to use ghx CLI, when to escalate to Codemap, when to clone locally, and when to stop. ghx becomes the code reconnaissance product, not because the CLI does everything, but because the sidecar brain owns the reconnaissance decision.

That story still has to survive evals.

It is also not enough.

Because a product can have a beautiful story and still fail the baseline. A CLI can feel elegant and still make the agent worse. A skill can encode knowledge and still pollute the context. A sidecar can compress the main agent's view while wasting a different budget somewhere else.

The hard question is not whether ghx sounds useful.

The hard question is whether an agent actually performs better with ghx than without it.

And then the harder question after that:

If ghx helps, does ghx-sidecar help even more, or is the sidecar another layer of ceremony?

## The baseline I do not want to lose against

The baseline is embarrassingly simple.

Plain agent. Plain shell. Plain old `gh` CLI.

No ghx. No sidecar. No special reconnaissance service. No doctrine. No fancy evidence ledger. No OpenTelemetry traces. No beautiful architectural story.

Just the agent trying to answer the repo question with the boring tools it already has.

That is the baseline I need to beat.

Not because `gh` is perfect. It is not. [The origin story for ghx](/how-ghx-was-born) came from real frustration with `gh`, GitHub HTML, API quirks, search weirdness, and context waste.

But frustration is not proof.

Maybe the base agent is already good enough with `gh` for many tasks. Maybe ghx helps only on a narrow slice. Maybe the CLI helps, but the sidecar does not. Maybe the sidecar helps the main agent's context but wastes too much total workflow context. Maybe the right answer is not to build a sidecar framework at all.

I do not want to hand-wave any of that away.

For the first time, I am trying to be the main critique of my own product.

## Plain vs ghx vs ghx-sidecar

The eval I care about is not abstract.

I want to compare three profiles:

1. **plain** — the agent explores with normal shell / `gh` / whatever it can do without ghx
2. **ghx** — the agent gets ghx directly and knows how to use it
3. **ghx-sidecar** — the main agent delegates reconnaissance to a specialist sidecar agent, which uses ghx internally and returns a compact evidence report

The point is not just to ask who got the answer right.

The point is to ask where the context cost lands.

If plain gets the right answer but burns a huge amount of main-agent context, that matters. If ghx gets the right answer faster, that matters. If ghx-sidecar gives the main agent a tiny, cited report but secretly burns a huge sidecar context budget, that also matters.

I need to know both things at the same time:

- is signal per token increasing for the main agent?
- is signal per token increasing for the sidecar / whole workflow too?

Because it is very easy to cheat this in your own head.

You can make the main agent's context look clean by hiding the mess inside the sidecar. That might still be a good product decision if the sidecar is cheap, specialized, and auditable. But it is not honest to pretend the cost disappeared.

It moved.

So the question becomes more precise:

> Did we increase signal per token for the customer agent while keeping the whole workflow honest?

That is the number I want.

Not vibes.

## The sidecar thesis

The sidecar idea is bigger than ghx, but ghx is the proof. The main agent's context is sacred; that is the whole product belief.

If I am using a powerful coding agent, I do not want to spend its context on 170 lines of ghx CLI doctrine, GitHub search gotchas, map-before-read rules, backend choice, command syntax, and repo exploration traces. I want the main agent doing the thing it is good at: engineering.

Reconnaissance should move behind a boundary. The main agent should ask:

```text
where is this behavior implemented? show me the evidence.
```

And the sidecar should decide what that means: ghx search, ghx map, ghx read, local clone, Codemap, stop, escalate, cite uncertainty.

The moat is not the CLI. The moat is the agentic brain: the doctrine for what to inspect, what to ignore, when to read, when to map, when to escalate, and when to stop. ghx CLI, Codemap, `gh`, local clone, OTel traces — these are tools. The product is the reconnaissance judgment that makes those tools disappear from the main agent's head.

That is the thesis.

It still has to earn the right to exist.

## Why this turned into an eval framework

This is the part that surprised me most.

I thought I was building a product.

Then I realized that to build the product honestly, I had to build the measurement machinery too.

There is no clean precedent I can just pick up and use. At least not for the exact thing I need:

- evaluate a tool given to an agent
- compare direct tool use vs specialist sidecar delegation
- isolate whether the baseline cheated by discovering ghx anyway
- capture every tool call and output for audit
- measure correctness and evidence quality without an LLM judge becoming another source of vibes
- track main-agent context, sidecar-internal context, and total workflow context separately
- produce traces that can become future training data

That is how I ended up building the eval machinery inside ghx.

The current stack uses [ACP](https://agentclientprotocol.com/) as the sidecar runtime boundary because I want a real agent process, not a fake function call. It uses OpenTelemetry traces because I do not want to invent a private observability format if the ecosystem already has one. It stores local episode artifacts because I want the data to be inspectable, rerunnable, and eventually useful for training.

This is not because I wanted to build an eval framework.

I wanted to know if ghx works.

But knowing if ghx works now requires an eval framework.

That is the harsh reality I ran into.

## The eval framework also has to be evaluated

The most annoying part is that the eval framework itself can lie.

This has already happened in small ways.

A plain baseline can accidentally use ghx if ghx is on the PATH. Then the comparison is contaminated.

A sidecar can look efficient if you only measure the report it sends back to the main agent, while ignoring the tool output it consumed internally.

A resumed ACP session can replay old tool calls and make the new turn look like it repeated work it did not actually repeat.

A task can leak its own expected answer in the prompt, and then the agent can score by parroting the question.

A preliminary n=1 smoke run can print something that looks like a verdict if the reporter is not careful.

And now I have a more painful example.

One of the first gate-run verdicts scared me. At first glance, it made the future of ghx feel obscure. The results did not look meaningful enough to justify the direction. For a minute, I had the very human reaction: maybe this whole thing is weaker than I thought.

Then I read the run notes and found a critical failure pattern in the eval framework itself.

The ghx-sidecar agent was not actually using ghx correctly. In some BLOCKED episodes, the downstream agent searched its inherited Claude Code tool surface for a deferred tool named `ghx`, found nothing, and took the escape hatch. The persona prompt never made the simple thing explicit enough: ghx is a CLI binary on PATH. Execute it through the shell.

That defeats the entire purpose of the sidecar profile.

If the ghx-sidecar eval is supposed to test whether a specialist agent using ghx can beat direct ghx or plain `gh`, but the specialist does not reliably know that ghx is a CLI binary it can execute, then the verdict is not a product verdict. It is an eval-framework bug report.

That distinction matters.

The old version of me would have been furious because I wanted to build the product, not all this machinery around the product. I still feel that. I want to build ghx. I want to build the sidecar. I want to make the thing useful.

But this is exactly the mental model shift I need.

I am learning to trust the evaluation process enough to let it stop me, not just validate me.

This is exactly why I do not trust vibes here.

It is not enough to run evals. The evals have to be honest enough that I would believe them if they told me to kill my own product direction. They also have to be debuggable enough that when they say something scary, I can tell whether they found a product failure or an evaluation failure.

That means the boring machinery matters:

- profile isolation
- ghx removed from PATH for the plain baseline
- captured tool calls and outputs
- agent identity recorded
- pre-registered gates
- preliminary results labeled as preliminary
- OpenTelemetry traces emitted as inspectable artifacts
- replayed ACP history separated from live turn activity
- signal-per-token reported at main-agent, sidecar-internal, and workflow levels

This is not glamorous work.

But if it is wrong, every product decision after it is downstream of self-deception.

## What I am trying to prove

I want the eval to be capable of telling me the worst possible answer.

Maybe ghx deserves to exist and the sidecar deserves to exist too.

Maybe ghx CLI deserves to exist, but direct usage is enough for now.

Maybe ghx helps only in a narrow slice and the product has to shrink its claims.

Maybe plain old `gh` plus a good agent is good enough.

I do not think the last one is true.

But if the eval is not allowed to say it, the eval is theater.

## The product demands the framework

This connects back to a pattern I already wrote about in [The Builder’s Perfectionism Trap](/i-thought-building-was-enough).

My default instinct is to build and build and build the product. Improve the CLI. Make the sidecar smarter. Add the next feature. Keep moving.

That instinct can be useful.

It can also become avoidance with better branding.

Evals force me to step outside the product and ask the question I would rather postpone:

> is this actually becoming more useful?

Not more elaborate. Not more architecturally satisfying. More useful.

Does it increase signal per token for the main agent?

Does it increase signal per token for the sidecar or the whole workflow?

How much?

Is the improvement large enough to justify the machinery?

That is why the framework work is not a distraction from ghx. It is what ghx is demanding from me.

I wanted to build a code reconnaissance CLI. Then the CLI knowledge itself became context bloat, so I needed a sidecar. Then the sidecar thesis could be fake, so I needed evals. Then eval JSON was not enough, so I needed traces. Then correctness was not enough, so I needed signal per token.

Correctness asks: did we answer?

Signal per token asks: how much useful evidence did each unit of context buy?

That is the metric this product wants to optimize.

The standard is simple and brutal: every layer has to earn itself.

The CLI. The sidecar. The framework. The eval framework too.

Maybe signal per token becomes one of the ways we talk about whether agentic systems are actually getting better. Maybe not.

I want to know — not with a launch post, not with a demo, not with a feeling that the workflow is nicer.

With enough honest eval data that I can look at the thing I built and say:

this improved the agent.

or it did not.

The eval eventually said it did. Six weeks later, my own behavior gave me a harder answer: [the capability worked, but the habit never formed](/my-evals-say-it-works-i-dont-use-it).

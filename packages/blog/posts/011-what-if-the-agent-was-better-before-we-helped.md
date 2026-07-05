---
title: "Does ghx Deserve to Exist?"
seoTitle: "Evaluating ghx and Agent Sidecars: Does the Code Reconnaissance CLI Deserve to Exist?"
date: "2026-07-05"
description: "I am building ghx, a code reconnaissance CLI for AI agents, and now an agent sidecar framework around it. The hard question is whether any of it actually improves signal per token compared to plain old gh or the base agent."
section: engineering
tags: [agentic-engineering, evals, ghx, sidecar-agents, opentelemetry, acp]
series:
  id: ghx-field-notes
  title: ghx field notes
  order: 3
---

# Does ghx Deserve to Exist?

I am building [ghx](https://github.com/gkoreli/ghx), a code reconnaissance CLI for AI agents.

That is the clean sentence.

The messier truth is that I am now building at least four things at the same time:

- ghx, the CLI tool
- ghx-sidecar, a specialist code reconnaissance agent that uses ghx under the hood
- an agent sidecar framework, where a main agent delegates a whole competence domain to a cheaper specialist agent
- an eval framework, because I do not trust myself to decide whether any of this deserves to exist by vibes

This is a ridiculous stack of work to create while trying to answer one product question.

But the question is harsh enough that I do not see a shortcut anymore:

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

It is also not enough.

Because a tool can have a beautiful story and still fail the baseline. A CLI can feel elegant and still make the agent worse. A skill can encode knowledge and still pollute the context. A sidecar can compress the main agent's view while wasting a different budget somewhere else.

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

Not because `gh` is perfect. It is not. [The origin story for ghx](/build-the-github-exploration-tool-no-mistakes) came from real frustration with `gh`, GitHub HTML, API quirks, search weirdness, and context waste.

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

The sidecar idea is bigger than ghx, but ghx is the proof.

The model is simple:

A main agent should not have to load an entire competence domain into its own context just to get a good answer.

If I am using a powerful coding agent, I do not want to spend its context on 170 lines of ghx CLI doctrine, GitHub search gotchas, map-before-read rules, backend choice, command syntax, and repo exploration traces. I want that agent to stay focused on the engineering objective.

So the main agent should ask a specialist:

```text
where is this behavior implemented? show me the evidence.
```

And the sidecar should do the reconnaissance:

- decide which ghx commands to run
- inspect the right files
- avoid repeat reads
- keep a persistent evidence ledger
- cite exact paths and snippets
- return a compact report
- expose traces so the work is auditable

The main agent should not need to know ghx.

Eventually, the main agent should barely know the sidecar exists. It should just get good reconnaissance when it needs it, without carrying the reconnaissance machinery in its own head.

That is the thesis.

It is a good thesis.

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

This is exactly why I do not trust vibes here.

It is not enough to run evals. The evals have to be honest enough that I would believe them if they told me to kill my own product direction.

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

I want to be able to say one of these things truthfully.

Best case:

> ghx deserves to exist. It improves code reconnaissance for agents. ghx-sidecar deserves to exist too because it gives the main agent better evidence with much less main-context burden, while keeping the whole workflow efficient enough to justify the boundary.

Medium case:

> ghx CLI deserves to exist, but the sidecar does not yet. Direct ghx usage is the right product for now.

Painful case:

> ghx helps only sometimes. The product needs to narrow its claims and stop pretending it is the default answer for agent code reconnaissance.

Worst case:

> plain old `gh` plus a good agent is good enough, and ghx does not deserve the weight I have given it.

I do not think the worst case is true.

But I want the eval to be capable of saying it.

Otherwise this is all theater.

## The product demands the framework

This is the weirdest part of building agentic products right now.

Sometimes the product is not just the user-facing artifact.

The product demands its own harness. Its own evals. Its own observability. Its own traces. Its own ergonomics. Its own refusal to believe you.

I wanted to build a code reconnaissance CLI.

Then I needed a sidecar because the CLI knowledge itself was becoming context bloat for the main agent.

Then I needed an eval suite because the sidecar thesis could easily be fake.

Then I needed OTel traces because eval JSON was not enough as a trajectory/debugging surface.

Then I needed signal-per-token because correctness alone does not answer the product question.

Now I am building ghx, an agent sidecar framework, a ghx sidecar, and an eval framework in parallel.

That sounds absurd until you stare at the actual question long enough:

> did the agent get better, or did I just add another layer?

I do not know how to answer that honestly without all this machinery.

## The standard

The standard I want is simple and brutal.

Every layer has to earn itself.

The ghx CLI has to beat the baseline it replaces.

The ghx sidecar has to beat direct ghx on the thing it claims to improve: keeping the main agent's context clean while still returning better evidence.

The agent sidecar framework has to prove that delegation to a specialist agent is not just architecture cosplay.

The eval framework has to be strong enough to tell me no.

And I have to be willing to listen.

That is the part I care about most.

I am not afraid of the harsh questions anymore.

Maybe ghx deserves to exist.

Maybe ghx-sidecar deserves to exist.

Maybe the sidecar framework deserves to exist.

Maybe one of them does not.

I want to know.

Not with a launch post. Not with a demo. Not with a feeling that the workflow is nicer.

With enough honest eval data that I can look at the thing I built and say:

this improved the agent.

or it did not.

i want to write the gkoreli.com blog post article now on the similar theme
---
from all these posts looks like to me that nobody is evaluating agentic tools themselves, they only try to evaluate agentic harnesses and agents themselves, which is quite weird, like what about the clis and skills and all that, i feel like there is a really big gap
---
you are building agentic tools off of pure vibes if you don't run evals

people build Claude/Codex wrappers, Hermes skills, harnesses and what not, and never A/B test if the original agent can do better without all this bloat

is your signal per token increasing or decreasing?
---
the weird gap i am noticing: everyone talks about evaluating agents or agentic harnesses, but almost nobody talks about evaluating the tools we keep giving them

skills, CLIs, wrappers, memory layers, repo scanners

what if the agent was better before we helped?
---
this is my followup, thoughts?
i am one of those people most of the times but for the first time im forcing myself to fully gate the entire engineering of https://github.com/gkoreli/ghx cli unless i prove that agent performs better with my cli vs without it entirely, and i am fuming it is so difficult to just run the eval because there are not enough libraries or established patterns to do the evals easily. 

btw, i want to slightly mention what ghx is, its a code reconnaissance tool for agents
---
we have ghx project pulled locally somewhere, i want you to pull the latest changes and read and understand the recent work that i have been working on and talk about that ghx is the code reconnaissance cli tool for ai agents, and now i am building a agent sidecar framework , and what i am struggling the most is to figure out if the signals per token is increasing for the main agent and ghx sidecare agent both at the same time, or not. Even if its increasing, how much improrvement are we talking about. I am running evals with plain vs ghx vs ghx-sidecar, goal is to figure out if the new agent sidecar framework deserves to exist at all or not. Maybe even ghx cli itself, does it truly help the agents or not. Right now all of it is just vibes, what if just a mere old school gh cli is good enough and entire ghx doesn't need to exist at all? These are harsh questions but i am not afraid any more, this is what i want to answer. I want to be super critical and main critique of my own product. Evaluate with full honesty and in the meanwhile i came across with harsh reality, it is really complicated to truthfully run evals on agents, so in parallel i am building ghx, agent sidecar framework, evals framework, and ghx sidecar all in one, because no other proper precedent exists for me to utilize cleanly. I am using the acp agent as a sidecar runtime and OTel traces for evals to at least reduce re-engineering everything. I want to build the product but at this point it demands from me to build all this frameworks and ergonomics. At the end of the day I will be able to truthfully say that ghx cli deserves to exist, and then ghx sidecar and agent sidecar framework all deserve to exist or not.
---
Research/grounding from local ghx repo after `git pull --ff-only origin mainline` on 2026-07-05:
- `docs/NORTH_STAR.md` frames two products: the Agent Sidecar Framework and ghx as the code reconnaissance sidecar proof.
- Recent commits added evidence ledger, OTel eval traces, replay decontamination, signal-per-token reporting, and formal gate-run infrastructure.
- `internal/sidecar/evals` now compares profiles: plain, ghx, ghx-sidecar.
- ADR-0016.6 defines SPT at main-agent, sidecar-internal, and workflow levels: signal = correctness × evidence, tokens estimated by chars/4, scaled per 1,000 tokens.
- ADR-0016.3/0016.4/0016.5 explain the hard parts: plain baseline can accidentally use ghx, tool calls were opaque, ACP resume can replay old tool calls, OTel traces are emitted for audit, preliminary runs must not masquerade as verdicts.
- `go test ./internal/sidecar/evals ./internal/sidecar` passed locally.

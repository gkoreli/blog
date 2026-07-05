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

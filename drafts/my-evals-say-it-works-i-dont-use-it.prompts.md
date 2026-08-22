In the ghx project when was the last time we wrote an article
---
Read the article and understand what work has been accomplished since then what ambiguity are we sitting in right now. What new vision are we moving towards to, what calculated bets are we making with ghx and SAF? I want to write a new engineering article in the ghx series
---
Where is the pain lessons learned so far and hard challenges that we are banging our heads on? Why dont we have adoption yet still? Like i myself dont use the sidecar ghx yet its slow and not fully proven, and still havent proven why this is much better than sinply triggering a subagent with claude or smth like that
---
Read the skills inside the gkoreli blog repo for writing engineering articles and writing style and start iterating on the article in the ghx series
---
We have been building ghx heavily recently do we even have logs or analytics or soft failures or hard failures logged? Do we know how we are using ghx besides running the evals? Like are we even using it for building the ghx product itself? If not why not? I feel like this needs to be properly investigated and if the ghx product injury exists and we are bleeding out of it just call it out in the article, lets be fully transparent like over these days how much did we reach for it… opensource is full of great ideas and references why are we not looking into it whenever we are building architecture or need to look up some docs or reference implementatuons or looking for inspiration or conpetung ideas?
---
Im using Hermes for engineering last couple days mostly i use my personal laptop and work laptops for engineering and i use ghx more or less heavily but i barely use the ghx sidecar tho, i was just curious like yesterday and today we spent a lot of effort in engineering like heavy efforts and curious if we reached for ghx, or do we even have any of this information available
---
Cross validate more ground your understanding with work, with vision tenets, problems and cross reference open source but dont trust blindly ground yourself with understanding cross references
---
Research grounding (agent, 2026-08-21, from local repos after pull):
- Article 3 published 2026-07-05; its promise was to trust evaluation enough to be stopped by it.
- Since then: M4 THESIS SUPPORTED (90 eps, gates green, 0.908 vs 0.931, 25x compression), runtime hardening wave, three research fanouts converging on over-served-runtime/under-served-adoption, ADR-0040 rebalance (product 45/framework 35/evals 20, proof parked), recon-first serve default with pure JSON envelope, live progress stream (<5s first signal vs 40-106s silent asks), quota-degradation ladder, evidence-contract spec (18 clauses).
- Adoption research: host-native subagents commoditized isolation; defensible trio = remote/discovery + persistent memory + auditable evidence contracts; C8 selection-eval registered with zero episodes; judge uncalibrated pending founder labeling.
- Dogfood loop found stale since 2026-07-03, restored 2026-08-21 (skill re-export, recon MCP re-registered). Research 005 states it plainly.
- Goga's steering line, quoted in the article opening, is his own words about not using the product.

Forensic audit result (agent, from ~/.ghx on this machine):
- ~/.ghx contains 566 files; the oldest is from Aug 21 07:46 — production storage was empty before today despite runtime shipping July 5.
- 4 sessions: badslugnoslash + badslugnoslash2 (failure-path probes), modelcontextprotocol-typescript-sdk (spec/conformance question, 2 turns, 64.7s + 82.1s, cited line-numbered answer), tidwall-gjson (escape parsing question, 1 turn, 37.9s, cited answer).
- Zero discovery-scope sessions ever, though the tier shipped July 6.
- Daemon log: quota-death line twice, SDK report-sink shadow warning on every spawn, streaming lines present post-fix.
- Telemetry itself works: OTel gen_ai duration/tokens/report-size per turn answered the audit in minutes.
- Caveat kept in the article: Mac machine not inventoried; Research 005 independently documents dogfood staleness since Jul 3.

Cross-validation round 2 (agent, 2026-08-22):
- Goga corrected the audit's frame: he uses the ghx CLI heavily from personal + work laptops; what he barely uses is the sidecar. Forensics then showed the bare CLI journals nothing to ~/.ghx by design — only the sidecar writes there. Product telemetry covers half the funnel; CLI-side usage evidence exists only in Hermes session transcripts.
- Session-transcript mining found real CLI usage: Jul 2 release-firefight used `./ghx read gkoreli/ghx ...` against the live incident; Aug 21 sessions ran `ghx explore gkoreli/ghx`, doctor, and a sidecar ask against modelcontextprotocol/typescript-sdk for ADR-0040 P2 prior art; today an MCP probe asked tidwall/gjson escape parsing (~34s, cited answer). So "reached for it" is true at the tool layer and rare at the delegation layer.
- New defect found during cross-check: scripts/dogfood-week.mjs counts report-size histograms in its latency array → reported p50 51.3s vs true 17.5s. FRICTION.md entry committed and pushed (cf925c5) before writing it into the article.
- Competitor number re-grounded at primary source: gh api repos/DeusData/codebase-memory-mcp → 39,811 stars live (repo notes had 27,884 two weeks earlier); created 2026-02-24.
- Tenets cross-checked against findings: dogfooding tenet vs empty storage; context-is-sacred vs main-agent greps; measurement-trust vs the rollup bug (culture caught it, but only via manual trigger); remote-first explains the CLI's statelessness/blindness. One overclaim caught and fixed ("years of dogma" -> weeks).

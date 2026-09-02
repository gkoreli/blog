# What it would take for OSS Radar to reach more readers

Written 2026-09-01 alongside issue #06. This is an assessment with a plan, not a promise. Numbers come from the public `/api/stats` endpoint (browser traffic class, owner excluded), pulled 2026-09-01 evening PT.

## Where the series stands

| Page | Browser views, all time | Daily clients |
|---|---:|---:|
| whole site (since 2026-03-07) | 3,286 | 1,775 |
| homepage | 841 | 540 |
| best post (procrastination essay) | 899 | 632 |
| OSS Radar #03 Buzz (2026-07-24) | 77 | 68 |
| OSS Radar #01 Vercel cohort (2026-03-19) | 56 | 49 |
| OSS Radar #02 Astral (2026-04-12) | 52 | 40 |
| OSS Radar #05 Bun 1.4 (2026-08-26, six days old) | 43 | 37 |
| OSS Radar #04 Herdr (2026-08-21) | 31 | 23 |
| `/oss-radar` section page | 38 | 31 |

AI-user-agent requests in the last 30 days: 7 each for issues #04 and #05, on par with the llms.txt post. Nothing in the series has been cited or linked from outside as far as the referrer data shows (to verify against `referrer_host` before repeating this claim in public).

Reading of the table:

- Each issue reaches roughly 30 to 80 people in its first weeks, and most of them in the first days. That is the size of the author's direct network on X, not a public.
- The one post that reached about 900 people is an essay. It was shared by others. No OSS Radar issue has been shared by someone the author does not know.
- The research depth per issue (the Bun issue counted 114 million tokens and 292 minutes) is an order of magnitude beyond what the readership justifies. That is fine as practice and provenance, but it is not what will bring readers.

## What the evidence says brings readers to work like this

From the repo's own `shareable-engineering` skill and the sources it audited: readers share when a post makes them armed, vindicated, or seen; specificity is the structural advantage of a personal blog; one clear disagreeable claim gets replies; the dead ends are the content; success is contact, not pageviews. From the launch skill: the first post on X must carry the proof before the click, and a thread earns its length only when each post adds a payload.

Applied to OSS Radar, the issues so far are specific and evidence-led but they have lacked three things:

1. **A reader who was already looking.** Buzz, Herdr, and Bun 1.4 issues arrived when nobody was searching for those names and the maintainers were not looking for outside audits. The Astral issue did best relative to its age because the acquisition was already a conversation.
2. **An artifact the community lacked.** The issues audited; they did not add a measurement the maintainers could not make themselves. The Bun issue's canary and agent-density sections came closest.
3. **A route to the people who care.** Distribution has been one X post to the author's followers. No maintainer contact, no community forum, no aggregator.

## What changes with issue #06

interp-engine is the first issue where all three can be true:

- **Looking:** the maintainers announced two days ago and are watching for reactions. The interpretability community (Neuronpedia users, SAELens users, TransformerLens users) is small, online, and reads long technical posts. There is no outside review of the engine yet.
- **Artifact:** the Apple Silicon parity and steering reproduction is something the maintainers benchmarked only on a B200. If the numbers hold, the article is the first evidence that the eager backend is trustworthy on a laptop. If they do not, the article is a bug report worth more than praise.
- **Route:** send the article to Johnny Lin and Decode Research before or at publication, with the reproduction scripts; post on X with the preamble clip and tag Neuronpedia; submit a link post to LessWrong or the Alignment Forum where interpretability tooling is discussed; submit to Hacker News once, plainly titled. Each of these is a qualified audience, not a broadcast.

The measure for this issue: replies or corrections from the maintainers, a reshare by anyone in the interpretability community, and whether the reproduction scripts get run by someone else. Views are a secondary signal.

## Format changes to carry forward

Keep from the skill: verdict in the first 100 words, claim table separation, one decision at the end. Add for reach:

- **A section the reader can run in ten minutes.** Issue #05 had "what engineers get in practice"; #06 has the MPS reproduction with scripts. Every future issue should include one thing the reader can execute and one number the author produced that nobody else has.
- **A maintainer-facing summary.** The decision section should read as a usable audit to the maintainers: what agreed, what did not, what test would change the verdict. Maintainers reshare audits that are fair and specific.
- **A stable, link-worthy asset per issue.** For #06 it is the Gemma hook-name mapping with the measured differences. Put it in one table with a heading a person can link to.
- **A shorter trail between issues.** Issues #04, #05 and #06 share a thesis (the serving engine is where research has to land). Name the trail in one sentence in each issue so a reader who arrives at one finds the others.
- **Publish faster after the announcement.** Two to five days after a launch is when maintainers and early users are still reading reactions. #06 will publish about two days after the blog post.

## What the author's research program adds

The reason this section can turn is not the format. It is that the author now runs the workload the tools serve. OSS Radar on AI infrastructure written by someone measuring steering-vector composition on gemma-2-2b has standing that OSS Radar on Bun did not. Each future issue in this lane should be chosen because the author will use the thing, run it, and report what changed in his own harness. That is the disagreeable claim these issues can make: not "this project is good" but "this project changed, or failed to change, what I do."

Candidates for the next issues, in this order: DFlash 2 (speculative decoding, MLX backend, runs on the author's Mac), SAELens 6.49's Gemma Scope 2 support (the author's next protocol phase uses SAE bases), flash-linear-attention (the on-ramp for the geometric-attention track).

## Open items

- Establish the X baseline (10 to 20 recent original posts, media type, opening move, replies) before the launch post, per the launch skill. Not done in this session.
- Check referrer hosts for any existing outside links to the series before claiming there are none in public.
- Decide whether to publish a research footprint for #06. The footprint script assumes one Codex root thread; this issue's workers were launched from a Claude session as five independent threads. Either extend the script to accept multiple roots or state that no footprint is published for this issue.

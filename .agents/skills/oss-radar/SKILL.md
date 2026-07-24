---
name: oss-radar
description: Research, write, edit, and review OSS Radar issues for gkoreli.com in either single-project deep-dive or cohort-scan mode. Use for code-backed open-source analysis, market framing, claim audits, source rationales, adoption verdicts, and pre-publish checks.
---

# OSS Radar

Turn current open-source work into a clear verdict backed by code.

## Pick one article focus

| Mode | Use it for | Read |
|---|---|---|
| Project deep dive | One launch, repository, or major release | [references/project-deep-dive.md](references/project-deep-dive.md) |
| Cohort scan | One list, program, event, or batch of releases | [references/cohort-scan.md](references/cohort-scan.md) |

Choose one mode before writing. Research may use both methods; the article must keep one focus.

- Keep a project deep dive on one topic. Name at most two nearby products in prose. Use a compact table only when a wider set defines the market.
- Check the full cohort before selecting standouts. If that is not practical, use a repeatable sample and state its limits.
- Save useful side topics for later issues.
- Read [references/typescript-posts.md](references/typescript-posts.md) only when the post lives in `packages/blog/posts/*.ts`.

## Honor the requested scope

Treat an explicit read time as a limit.

- Narrow the topic or save evidence for a follow-up when the full audit will not fit.
- Ask to change the limit only when cutting would hide a fact that changes the verdict.
- Cut repeated claims and background before cutting proof.
- Set `readTime` from the final render.

## Record the research state

Record these facts before drafting:

- check date;
- branch and baseline commit SHA for each repository;
- release or launch in scope;
- state of each cited issue and pull request.

Use one baseline SHA per repository. Explain any later SHA. Recheck live issue and pull-request states before publication.

Put the research state in a short rendered note so readers know the cutoff.

## Build a claim table

Do this before prose:

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|

Use these evidence states:

- **Code-inspected:** The cited code or configuration implements the stated path.
- **Reproduced:** You ran the behavior and recorded the result.
- **Reported:** An issue or other first-hand report describes the behavior; you did not rerun it.
- **Proposed:** A design document or open pull request describes work that has not shipped.

Mark inference in its own field. An inference may use any evidence state, but it remains the author's conclusion.

Use each source only for the claim it can prove. A launch post proves an announcement. An issue proves that someone reported a bug. Attribute reports and proposals.

## Check the claim

1. Read the README and launch copy.
2. Use code, tests, or configuration when the claim concerns shipped behavior.
3. Trace the main code path for a project deep dive.
4. For each featured cohort project, find one code fact beyond the README unless the thesis needs more.
5. Check deployment, privacy, security, and license terms only when they change the verdict.
6. Check whether cited fixes have merged.

Follow the selected mode reference for depth. Do not turn each cohort entry into a project deep dive.

## Write from evidence

State the claim, show the code or report, then give the result.

- Give working code and failures equal proof.
- Separate shipped code from reports and proposals.
- Link disputed and time-sensitive claims in the body.
- Pin code links to that repository's baseline commit.
- Cite every number, quote, date, and market claim.
- Give each source one short `why` sentence that states the result for the reader.
- Keep the internal claim table complete.
- Publish every source used for a material claim, merge repeated claims from the same source, and remove unused links.
- Remove a claim when its evidence fails review.

## Writing rules

These govern prose: metadata, headings, tables, callouts, source cards, the article body, and pull-request text. Never touch code or technical terms; swap in everyday words only where precision survives.

1. Never use a metaphor, simile or other figure of speech which you are used to seeing in print.
2. Never use a long word where a short one will do.
3. If it is possible to cut a word out, always cut it out.
4. Never use the passive where you can use the active.
5. Never use a foreign phrase, a scientific word or a jargon word if you can think of an everyday English equivalent.
6. Break any of these rules sooner than say anything outright barbarous.
7. don't build a straw man to knock down. use not X, it's Y once per piece, max
8. two examples are enough. don't stretch to three
9. don't announce what you're about to say. say it
10. don't end two paragraphs in a row with punchlines
11. vary the length and shape of neighboring sentences
12. break any of these rules sooner than write like a machine

Review every prose output against these rules before publication.

Also:

- Keep a joke only when it adds value. Never add one to meet a quota.
- Never explain why a joke, title, or line works.
- Delete prose such as “the line works,” “the real bet,” “this section shows,” and “before the analysis.”
- State uncertainty in the evidence, not the verdict.
- Read the finished article aloud.

## Common checks

- [ ] One mode and one article focus
- [ ] Requested scope or read-time limit honored
- [ ] Check date, baseline SHA per repository, release, and live issue or pull-request states recorded
- [ ] Claim table separates code-inspected, reproduced, reported, and proposed evidence
- [ ] Inferences marked as the author's
- [ ] Every number, quote, date, and market claim has a source
- [ ] Every source says why it matters
- [ ] Code links use the right repository baseline SHA
- [ ] Orwell review covers metadata through sources
- [ ] No prose explains the title or the article
- [ ] Final section makes one decision and then stops

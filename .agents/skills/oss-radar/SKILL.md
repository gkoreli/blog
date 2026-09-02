---
name: oss-radar
description: Research, write, edit, and review OSS Radar issues for gkoreli.com in either single-project deep-dive or cohort-scan mode. Use for code-backed open-source analysis, product-thesis and vision reconstruction, competing-theory tests, market framing, claim audits, source rationales, adoption verdicts, and pre-publish checks.
---

# OSS Radar

Find what a project built, reconstruct why, test its bet, and give a verdict backed by code.

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

## Keep research state in working notes

Record these facts before drafting:

- check date;
- branch and baseline commit SHA for each repository;
- release or launch in scope;
- state of each cited issue and pull request.

Use one baseline SHA per repository. Explain any later SHA. Recheck live issue and pull-request states before publication.

Do not publish a raw commit and ticket ledger. Pin repository code and documents to the baseline. Put an issue
or pull-request state beside its claim when that state changes the result. Add a short cutoff note only when the
date changes the reader's decision.

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

## Reconstruct the bet

For a project deep dive, do this before prose. For a cohort, use it for the main pattern and for projects that
drive the thesis:

| Theory | Whose view | Evidence for | Evidence against | Direction state | What would disprove it |
|---|---|---|---|---|---|

Start with the maintainers' stated thesis. Add a plausible rival reading when the code, user reports, market, or
standards support one. Do not invent balance. Try to disprove each theory before choosing.

Answer these questions:

- What job does the shipped product do now?
- Why did the maintainers choose this design?
- Which workflow or product layer do they want to own?
- What do they replace, wrap, extend, and still rely on?
- What must become true for the project to matter?
- Who gains control, who pays or takes risk, and who supplies data or compute?
- Which code paths, data models, extension points, issues, and pull requests show direction?
- What evidence would make a smart user choose another theory?

Use the maintainer, user or operator, and ecosystem or standards views when they change the verdict. A field
report can reveal the real workflow. A competitor or standard can show whether the project replaces a product,
takes one conversation or task from it, or still depends on its infrastructure.

Keep future claims in one of four states:

- **Stated:** Maintainers describe the direction.
- **In progress:** Code, an active pull request, or tracked work implements it.
- **Enabled:** The shipped design makes it possible, but the project has not promised it.
- **Speculative:** The idea follows from the evidence but remains the author's theory.

An extension point is not a roadmap. A reserved event kind is not a shipped market. State the evidence and the
missing link.

Do not publish the whole theory map. Pick the strongest lane for the article. Save other sound theories for
follow-up issues.

## Check the claim

1. Read the README and launch copy.
2. Read vision documents, architecture notes, roadmaps, and maintainer issue comments.
3. Use code, tests, or configuration when the claim concerns shipped behavior.
4. Trace the main code path through defaults, feature flags, release builds, stores, network calls, and pinned
   dependencies when they affect the claim.
5. For each featured cohort project, find one code fact beyond the README unless the thesis needs more.
6. Read one first-hand field report when one exists. Use it to find product surfaces the docs miss, then check its
   claims in code, tests, or issues.
7. Treat a field report as a lead, not proof.
8. Test negative claims in the likely modules and pinned dependencies; a search with no result is not enough.
9. Check a relevant standard, competitor, or older workflow when it changes the product theory.
10. Check deployment, privacy, security, license, and cost only when they change the verdict.
11. Check whether cited fixes have merged.

Follow the selected mode reference for depth. Do not turn each cohort entry into a project deep dive.

## Explain what the parts unlock

Tie every future idea to a shipped part:

`shipped part → new action → missing rule or component → possible product`

- State whether the idea belongs to the project, an outside source, or the author.
- Name the missing code, trust rule, payment rule, or operating work.
- Prefer the nearer path when it needs fewer new rules.
- Keep at most two future paths in the article.
- Cut an idea when no shipped part supports it.

## Write from evidence

State the claim, show the code or report, then give the result.

- Give working code and failures equal proof.
- Separate shipped code from reports and proposals.
- Link disputed and time-sensitive claims in the body.
- Pin code, configuration, architecture, and vision links to that repository's baseline commit.
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

- No mannered prose: when a literal phrase is available, use it. "A parameter worth varying," not "a dial worth turning"; "this point still matters," not "this point earns its keep." The full rule, in the owner's words, is in `polish-prose` ("No Mannered Prose").
- Keep a joke only when it adds value. Never add one to meet a quota.
- Never explain why a joke, title, or line works.
- Delete prose such as “the line works,” “the real bet,” “this section shows,” and “before the analysis.”
- State uncertainty in the evidence, not the verdict.
- Read the finished article aloud.

## Common checks

- [ ] One mode and one article focus
- [ ] Requested scope or read-time limit honored
- [ ] Check date, baseline SHA per repository, release, and live issue or pull-request states recorded in working notes
- [ ] Reader copy omits the raw audit ledger and keeps only state that changes a claim
- [ ] Claim table separates code-inspected, reproduced, reported, and proposed evidence
- [ ] Theory map tests the stated thesis against at least one plausible rival when the evidence supports one
- [ ] Product map separates what the project replaces, wraps, extends, and relies on
- [ ] Future claims say stated, in progress, enabled, or speculative
- [ ] Each future idea starts from shipped code and names the missing link
- [ ] Article follows one thesis; sound side theories move to follow-up notes
- [ ] Inferences marked as the author's
- [ ] Every number, quote, date, and market claim has a source
- [ ] Every source says why it matters
- [ ] Repository code and document links use the right baseline SHA
- [ ] Orwell review covers metadata through sources
- [ ] No prose explains the title or the article
- [ ] Final section makes one decision and then stops

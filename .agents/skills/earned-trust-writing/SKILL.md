---
name: earned-trust-writing
description: Shape gkoreli.com articles that deliver independently useful teaching and earn trust through Goga's inspectable work, experience, judgments, mistakes, and unresolved questions. Apply after shape-article, across engineering and practical personal inquiry; use roughly equal substantive weight for transferable value and the author in the work, without inventing evidence or forcing every article into this form.
license: MIT
metadata:
  author: gkoreli
  version: "1.0.0"
  owner-direction-date: "2026-09-19"
---

# Earned-Trust Writing

**Teach something useful. Show the basis for the advice. Let the reader get to know the person doing the work.**

This is the owner's preferred model for substantive articles at gkoreli.com, including practical essays and engineering pieces. A reader should not need to know Goga, trust his reputation, or read previous posts to benefit. The article should provide reasons to accept, question, or reject its claims on the page. Through the same explanation, the reader encounters Goga's decisions, projects, mistakes, convictions, growth, and live uncertainties.

## Origin and Authority

The [complete owner prompt](../../../docs/editorial/2026-09-19-earned-trust-writing.prompt.md) is preserved verbatim. It is historical source material; do not silently tidy, excerpt, splice, or overwrite it. Record later changes in a new dated document.

The owner's reference is [Bot Detection Without JavaScript: What My Blog Measured](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript), source at `packages/blog/posts/024-how-i-separate-readers-from-bots-without-javascript.md`. It combines a reader's practical problem with the author's implementation, measurements, corrections, and unresolved measurement boundaries. The useful pattern is the relationship between explanation and evidence, not its exact headings, length, title punctuation, or chronology.

This direction clarifies earlier rules against generic tutorials: **teach the reader directly; do not publish interchangeable instruction detached from evidence and the author's work.** A builder's journal can be a useful tutorial. Being unfamiliar with the author must not be an obstacle to learning.

This is a model for earning warranted confidence, not a claim that a format guarantees trust, search rankings, subscriptions, or audience growth.

## The Two Perspectives

Aim for roughly **50% transferable reader value and 50% author-present substance**. This is an editorial balance, not a word-count quota or a required midpoint transition. Weave the perspectives together when they strengthen the explanation. A measured failure can teach a general lesson and reveal the author's judgment in the same paragraph.

### Transferable value

Explain the problem, relevant concepts, practical method, evidence, alternatives, and limits in terms a stranger can follow. Give readers something they can understand, use, or test without adopting the author's identity or believing an unsupported personal claim.

Explain how a source supports a claim. State the useful finding and its relevant conditions beside the advice; do not hide all evidence in a references appendix. A reference list is not an argument. For practical advice, distinguish a sensible proposal from an experimentally validated intervention.

### The author in the work

Use material actually supplied by Goga or established in his artifacts: what he built, experienced, tried, observed, believed, changed, regretted, or still cannot resolve. Show the decisions and their costs, rather than appending a biography or a status claim.

Own opinions as opinions. A reader should be able to disagree with a judgment without losing access to the useful explanation. Make unresolved experience concrete: what is at stake, what is still unknown, and what evidence or experience could change the author's mind.

Do not manufacture vulnerability, emotional motives, dialogue, experiments, numerical results, or a recovery story. Articulating a problem is evidence of the author's account and reasoning; it is not proof that his proposed remedy works.

## Evidence Must Match the Claim

Keep these distinct in natural prose:

- **External findings:** what a study, standard, source implementation, or documented experiment establishes, with relevant conditions, population, date/version, and limits.
- **Firsthand observations:** what the author reports or what his artifacts record. A personal account establishes an account, not independent verification or universal causality.
- **Interpretation and opinion:** the reasoning that connects observations to the author's judgment. Show the connection; label uncertainty where it matters.
- **Proposals and open tests:** what the author intends to try, how success or failure could be recognized, and what has not happened yet.

Do not use an employer, job title, research institution, confidence of tone, or citation count as a substitute for support. Do not promote one successful anecdote into a general law. Equally, do not dismiss a useful observation merely because it cannot prove everything.

A small amount of directly relevant evidence is better than decorative research. Preserve material counterexamples and corrections. A limitation belongs beside the claim it qualifies, not in a distant disclaimer that leaves the confident sentence unchanged.

## Title and Opening

Give a cold reader a recognizable subject and a reason to read. Where it fits, a title can combine **the reader problem or method + the author's actual contribution**.

Use words such as *measured*, *tested*, and *learned* only when the record earns them. For a proposed practice, describe a rule to try or a question under investigation. Do not imply successful treatment, guaranteed outcomes, or completed experiments to improve a headline.

The opening should explain the practical value and bring the author into the actual problem promptly. Do not require readers to care about his biography before the article helps them. Do not remove the author so thoroughly that the article becomes a generic how-to.

## Working Sequence

1. **Shape first.** Identify the living center and governing form with `shape-article`. Use this model when the piece can truthfully teach and show the author's work together.
2. **Write the two promises.** What can a stranger take away? What will the reader discover about Goga through the work itself?
3. **Inventory support.** Separate existing sources, actual experiences/artifacts, opinions, proposals, and missing evidence. Do not convert gaps into confident prose.
4. **Interview for missing substance.** Ask a small set of walk-friendly questions about concrete scenes, costs, counterexamples, actual attempts, changed beliefs, and live stakes. Use what is already known; do not repeat answered questions. Ask neutrally rather than feeding the author a flattering or embarrassing story to confirm.
5. **Draft with both perspectives in contact.** A concept should help interpret the experience; an experience should test, illustrate, or complicate the concept. A method needs its rationale and failure modes. Keep a reusable rule, example, or decision aid visible.
6. **Audit the claims.** Verify citations and provenance. Distinguish a laboratory result from real-world validation of the article's full practice. Keep proposed tests future-facing.
7. **Position and polish.** Apply `article-discovery-positioning` after the substance is stable, then `polish-prose`. Preserve Goga's voice and the actual state of the work.

## Three Editorial Tests

**The stranger test:** Remove the byline and imagine no prior familiarity with Goga. Does the reader still get a clear problem, useful explanation, and inspectable reasons for the factual claims?

**The author test:** Remove the generic explanation. Do the remaining scenes, artifacts, decisions, mistakes, and judgments reveal a particular person doing particular work? Or could any author paste in their name?

**The connection test:** Do those two parts strengthen each other? Or is one half a tutorial and the other an unrelated diary entry or subscription pitch?

These are editorial checks, not evidence that real readers trust the result. Human feedback can test whether the intended learning and connection actually occurred.

## Exceptions and Collaboration Boundaries

This is the default direction, not a requirement to turn every poem, exposed essay, announcement, or narrow reference into a tutorial. `shape-article` still chooses the honest form. A genuinely exposed essay remains author-written under `personal-essays`; the agent does not originate its prose. Other inquiry and collaborative forms may combine research and supplied personal material with transparent AI assistance. The no-invented-feelings rule applies everywhere.

Keep roughly equal substance when this model is selected. Do not dilute a useful method to hit a personal-word quota, or pad a personal essay with research to imitate authority. Explain an intentional departure in the working notes when needed; do not silently abandon the owner's two-perspective goal.

Preserve complete shaping prompts under the existing provenance rules. A prompt that changes both shared editorial policy and the article belongs in the historical record and the article's provenance accounting. A mixed-speaker private transcript is different: do not publish unrelated third-party details merely to fill a prompt archive. Record omissions honestly; never call a selected record a complete transcript.

## Audience and Growth

The intended relationship is reciprocal: readers receive useful work and reasons to assess it; Goga makes his projects and thinking visible and invites correction, experience, and continued reading. Subscription is an available next step, not the price of the useful part of the article.

End according to the governing form. A bounded practical takeaway can coexist with an unresolved personal problem. Invite a relevant correction or experience when genuine. Do not manufacture a success story, a cliffhanger, or a follow request to force a conversion.

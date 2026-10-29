# Next round: promotion with actual outcome evidence

Checked October 28, 2026, after executing [the four approved actions](execution-2026-10-28.md). This review replaces neither the article's research nor the earlier historical traction snapshots. New outreach below is **prepared, not sent**.

The useful difference from the first review: these sources describe outcomes, not just audience sizes or a Submit button. They still do not guarantee our outcome. Prefer a small number of relevant placements and actual reader exchanges to a long list of websites.

## What has worked for other writers

| Firsthand source | Reported result | What we can reasonably take from it |
| --- | --- | --- |
| Phil Leggetter, [The JavaScript Weekly Effect](https://www.leggetter.co.uk/blog/the-javascript-weekly-effect/), September 2013 | About 24 hours after coverage: **1,248 unique visits, 29 mailing-list registrations**, approximately six new repo watchers and ten stars. The project had one blog post and an empty public repo. | Focused editorial coverage can produce signups as well as visits. Historical, observational, one project; not a 2026 forecast or a cold-pitch acceptance rate. This supports the Cooperpress pitch we have now sent. |
| Jake Goldsborough, [Where a Blog Post Goes](https://jakegoldsborough.com/blog/2026/where-a-blog-post-goes/), October 24, 2026 | His article recorded **2,277 TLDR referrals**, **67 Labnotes referrals** and **52 Brutalist Report referrals** from publication through October 24. | Both large newsletters and small curators can deliver visits to a personal blog. These are the author's counted visits, not distinct people, completed reads or subscriptions. He does not establish how each placement was secured. |
| Julia Evans, [How I set up an automatic weekly blog digest](https://jvns.ca/blog/2017/12/28/making-a-weekly-newsletter/), December 2017 | **1,050 people signed up** after roughly six months of her email digest. Readers had asked for an email option. | Email can serve people who already want to return. Her existing audience mattered; this does not establish acquisition from zero. We already have a subscription system, so the relevant work is checking and using it, not rebuilding it. |
| Julia Evans, [Some tactics for writing in public](https://jvns.ca/blog/2023/08/07/tactics-for-writing-in-public/), August 2023 | Reader criticism of an omitted DNS-packet parsing explanation helped inspire a more complete runnable DNS guide. She describes asking about concrete experiences and staying available for corrections. | Specific questions and objections can produce a useful next artifact. This is a practiced feedback method, not a measured traffic multiplier. |
| TLDR's [Clerk case study](https://advertise.tldr.tech/case-studies/clerk-com-uncovers-newsletters-as-a-hidden-engine-behind-12x-traffic-and-30-of-signups/), December 2025 | Reports **20% less site traffic and 15% fewer signups** after newsletter ads were paused. | Paid newsletters deserve consideration when economics justify them. This is a vendor-published, non-randomized account of a commercial company's multiple newsletter campaigns; it cannot establish our ROI or the causal size of TLDR's contribution. No purchase or budget is proposed for the current first pass. |

## The next three moves

### 1. Pitch one smaller curator: Assaf Arkin's Weekend Reading

This is the best new ready-to-review move. [Labnotes' October 3 issue](https://labnotes.org/weekend-reading-can-somebody-else-do-it-for-me/) actually links Jake's article, corroborating selection independently of his referral account. It also covers small developer tools, TypeScript projects and software tradeoffs. Assaf's [own about page](https://labnotes.org/about/) lists `assaf@labnotes.org` for contact. This is a general contact address, not an invented newsletter submission form; a personal invitation to pitch is not claimed.

Subject: `Bun AOT: smaller binaries, with a few catches`

```text
Hey Assaf, I tested Bun's new compiler: my server executable went from 121.5 MB to 30.3 MB without rewriting the TypeScript, but the warmed server only gained 6% and a Zod test got slower.

The code, RAM measurements and limits are here, if it fits Tech Stuff: https://gkoreli.com/oss-radar-08-bun-aot

Goga
```

The mention of Tech Stuff refers to the inspected current issue, without inventing a longstanding personal reading habit. No promise of coverage or request for votes/shares. Send once if authorized, then judge by a substantive reply or inclusion, not a demanded response.

### 2. Pitch TLDR's named curator through his verified public profile

TLDR has the strongest recent visit result in this small sample. Its [current Dev edition](https://tldr.tech/dev/2026-10-28) links independent engineering writing and performance-related releases. [The Dev page](https://tldr.tech/dev) confirms the coverage includes web development, now combined into Dev; do not pitch a nonexistent separate current Web Dev edition from an old directory.

No current editorial inbox or suggestion form was verified: `tldr.tech/submit` returns 404, and the inspected homepage, Dev issue and native browser footer lack the claimed form. Third-party lists disagree on email addresses; the privacy-policy support address is not an editorial route. Do not send to a guessed inbox.

The later native-browser check resolved a usable contact route: the [official TLDR account](https://x.com/tldrnewsletter), linked from its issue, explicitly says **“Curated by @tldrdan.”** [Dan Ni's profile](https://x.com/tldrdan) identifies TLDR and displays a Message control. This verifies a named public contact, not an invitation or guarantee of editorial consideration. The two profile captures are retained with the private evidence commitments. No message was composed or sent.

Prepared direct message to Dan, unsent:

```text
Hey Dan, I tested Bun's new compiler: the TypeScript compiler ran 3.3× faster with 64% less peak memory, but the warmed server only gained 6%. Code, smaller executable sizes and the catches, if it fits TLDR Dev: https://gkoreli.com/oss-radar-08-bun-aot
```

Prepared story blurb, if an editor asks for it:

```text
Bun AOT made my TypeScript compiler test 3.3× faster with 64% less peak physical memory, and shrank a server executable from 121.5 MB to 30.3 MB with --trim. A warmed API only gained 6%, and a Zod test got slower. Pinned preview, code and methods: https://gkoreli.com/oss-radar-08-bun-aot
```

This is an outcome-supported destination and a verified personal contact route. It remains an unsent proposal, not a proven result for us. Prefer this one relevant note over sending to multiple guessed TLDR addresses or publicly mentioning the curator repeatedly.

### 3. Use our existing opt-in email channel to earn return readers

The [existing dispatch draft](promotion-copy.md#7-existing-subscriber-dispatch) is already short enough. Before using it, check the active confirmed audience, previous dispatch and delivery state. Do not infer current health from the September signup receipt. Source inspection confirms the repository has the subscription component, email templates, active-subscriber selection and a campaign ID for retry protection; no live audience count or current provider capacity was measured here.

The immediate useful work, if authorized next, is one bounded preflight and one properly identified send to existing confirmed subscribers who should receive it. Success is a reply or later return, not an email-open pixel. If the audience is empty or only contains test recipients, keep editorial placements ahead of this step. No new list, provider, automation or newsletter feature needs building for this test.

## What to do with the posts already live

Leave the image and Reddit text stable unless a factual error or broken link needs repair. A substantive question is a reason to answer the specific issue, not send the same link again. New replies beyond the four approved actions still need authorization; no standing permission to auto-reply to everyone is inferred.

If a reader supplies their own app result, capture the build, workload, metric and warm-up conditions with their consent. A follow-up comparing a real application with our tiny server would be a distinct contribution worth pitching. This is where Julia's feedback method applies; it does not justify inventing a production benchmark before someone participates.

The next measurement window is around 24 hours after these posts and editorial responses when they arrive. This document does not create a timer or monitoring job. A public X embedding check is independent publication evidence; Reddit's anonymous check was unavailable. Neither should be turned into a measured adoption claim.

## Decisions

- **Do next, after authorization:** one Assaf pitch; one short message to TLDR's named curator; preflight the existing subscriber dispatch if the audience warrants it.
- **Keep:** the pinned, inspectable experiments and counterexamples. They give an editor or peer something concrete to assess.
- **Defer:** paid placement, additional accounts and indiscriminate cross-posting. No current cost/return case supports them here.
- **Do not count as new tactics:** the completed internal forward link, another copy of the existing bug report, buying votes or reposting the dead HN item.
- **Evidence limit:** two independent writers report quantified referral/registration outcomes; Julia reports an email audience and a concrete feedback workflow; the paid case has commercial selection bias. None supplies an expected result for this account.

Checks: destination links and contact basis reviewed; new copy compared with the pinned accepted results; existing-subscriber source path inspected without production queries; no new external communication made after the four approved actions. This further research/preparation is complete. Editorial outcomes and proposed additional execution remain unperformed or unobserved, as labeled.

# What the launch teaches us about building readership

September 9 UTC / September 8 PDT, 2026. Article 024 has demonstrated reach and generated a useful reader question. Analytics helped us see the response. The next publication question is whether people choose to follow the work after that first visit.

## What we now know

The [initial report](01-initial-evidence.md) recorded 1,534 article Browser observations on September 7 and 76 on September 8. Across its September 3–9 report, 753 observations reported Hacker News as referrer. The public HN story had 13 points and one visible reader comment at capture. That comment asks whether the rules misclassify real readers.

Authenticated Cloudflare access worked again at **00:52 UTC**. A separate browser-script query for September 7–8 returned **553 article page loads: 523 on September 7 and 30 on September 8**, with Cloudflare's bot filter enabled. One returned group reports a sample interval slightly above one; counts are retained as returned, without multiplying them. This corroborates a launch response through another collection method. It does not establish matching events, readership accuracy, or a resolved comparison with the server counter.

At **00:54:02 UTC**, a single aggregate subscriber query found **one active subscriber, created April 8; zero current pending rows; zero retained signups or confirmations since the HN submission**. It read one row and wrote zero. No email addresses, IPs, or tokens were selected. [Queries, results, and capture commitments](publication-followup-measurements.json).

Goga reports that he fixed signup in parallel and believes the repair preceded the HN spike. Record that as the current owner report; the exact activation and uninterrupted availability during the spike were not verified in this check. Do not keep treating the historical invalid-secret diagnosis as proof that the form is still broken. Conversely, do not assign the absence of new subscriptions to the old fault without a timeline. Expired pending rows can be purged, and some failures happen before persistence, so current rows do not count every historical attempt.

The launch attracted recorded attention. It has not yet produced a recorded new confirmed email subscriber. Returning readers and RSS followers were not measured. These are separate outcomes, and none of them alone is a complete judgment of the article's value.

## Our working explanation for the response

The article presents a recognizable engineering problem, shows work on a real system, supplies numbers and inspectable artifacts, and leaves a consequential question open. Its HN title matches that subject. A reader can understand why to click and then ask a specific question about the method.

That is the combination to repeat in the engineering strand: a problem another engineer recognizes, something we actually did, evidence that helps them make a decision, and a clear account of what remains uncertain. It is an editorial judgment grounded in the article and this response. One launch does not isolate the effect of the title, first person, the footprint, submission timing, or HN placement.

The comment also exposes a communication question: the reader treats 74.5% as a bot share despite the article's qualification. Check how the number reads when someone skims. One comment does not prove a general comprehension problem, but it is useful input. The proposed browser tests can answer the substantive question while the existing editorial pass keeps the number's meaning clear.

HN's [FAQ](https://news.ycombinator.com/newsfaq.html), checked September 9 UTC, describes ranking factors beyond title wording. Julia Evans' accounts of [useful blogging outcomes](https://jvns.ca/blog/2018/02/20/measuring-blog-success/) and [writing about problems and questions](https://jvns.ca/blog/2023/08/07/tactics-for-writing-in-public/), checked the same day, are relevant practitioner experience. They help frame a useful publication; they are not controlled evidence that any tactic caused this launch.

## The next publication improvements

| Priority | Action | What we would learn |
|---|---|---|
| 1 | Make the invitation to follow concrete, and verify that signup and confirmation work through the normal page | Whether readers can understand what they will receive and complete the process |
| 2 | Publish the next useful result in the analytics investigation and connect it to article 024 | Whether the subject supports continued interest, questions, and use |
| 3 | Record outcomes across the next three engineering releases | Whether reach, voluntary subscriptions, replies, and reports of use recur across articles |

The current [subscription component](https://github.com/gkoreli/blog/blob/ac3f3bf/packages/blog/src/templates/artifacts.ts#L68) offers **A note when there is signal** and describes engineering records, failed experiments, and life around the work. [The page template](https://github.com/gkoreli/blog/blob/ac3f3bf/packages/blog/src/templates/page.ts#L131) already links Subscribe and RSS in the sidebar and places the form after the content. Series links also exist. We should examine those existing surfaces before adding more navigation or prompts. No form-impression or click evidence was collected here, so unclear wording or placement is a hypothesis, not an established cause of zero signups.

A concrete copy candidate is **Get new engineering posts and essays by email.** On the analytics article, a nearby sentence can identify the planned browser tests as one reason to follow. Do not promise an analytics-only mailing list or a weekly schedule when the existing newsletter provides neither. Keep the author's wider publication intact; a successful technical article need not turn every essay into the same format.

The parallel newsletter work now favors [adopting a maintained service](../newsletter-reliability/03-protection-options.md#current-direction-adopt-a-maintained-newsletter-service). Keep that simplicity constraint: use the chosen provider's existing signup and confirmation reports before building custom collection. The failure stages identified in [TASK-0126](../../../../../docs/tasks/TASK-0126-make-subscription-outcomes-durable-and-protect-the.md) remain useful acceptance questions: can someone submit, receive the confirmation message, confirm, and appear in the subscriber list? Aggregate outcome counts, where available, would reveal where progress stops; collecting more personal information is not needed for that question. A current subscriber list cannot reconstruct attempts that were never saved or later expired. After a provider migration, query the new subscriber store rather than continuing to treat this D1 table as the whole list.

The next article should give readers a reason to return by doing the work raised in the discussion: test known browser visits, report mistakes, explain any repair, and show the remaining limit. Use the [existing experiment plan](02-experiments-and-article-direction.md). A short field note about the launch remains possible, but the engineering follow-up should deliver another useful result beyond the traffic total.

## A small publication record, not another dashboard

For the next three engineering releases, record the actual publication and sharing times; page observations and reported sources at roughly one day and seven days; new confirmed subscriptions with source attribution only where available; substantive questions, corrections, links, and reports of use. Distinguish unsolicited reader responses from author comments. Different articles and community exposure remain an uncontrolled comparison.

The next evidence of a following is a voluntary subscription, a reader returning with a result, a useful correction, or another person referring to the work. Page totals remain useful for reach. The current daily client identifiers do not identify returning people across days, and RSS requests do not count subscribers. Do not invent a retention rate from them.

No UI change, new subscriber event collection, email, HN response, or article publication was performed in this follow-up. The new measurements and owner-reported repair update are complete; implementation choices and the next publication remain to be carried out. The September 14 review remains a target, not a scheduled job.

## HN reply correction

The current [HN guidelines](https://news.ycombinator.com/newsguidelines.html), checked September 9 UTC, ask for human-written comments and disallow generated or AI-edited comment text. The earlier assistant draft is preserved as a record of the request, not a ready-to-post community reply. Goga should write the comment himself from the facts. This community rule is separate from the provenance disclosure on the externally hosted collaborative article.

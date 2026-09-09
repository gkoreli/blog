# Experiments and the next article

The strongest next engineering question is now specific: **when a known real reader opens this page, what does the counter record?** The HN comment gives that question a reader. The launch data gives it a current setting. We should answer it through the existing controlled-client work before claiming a false-positive rate.

## First: capture known browser visits

This is a proposed first batch for [TASK-0120](../../../../../docs/tasks/TASK-0120.md), not an executed experiment: six conditions with five repetitions each, **30 visits total**, using the same published page and recorded classifier version.

| Condition | What it tests |
|---|---|
| Browser, JavaScript and beacon allowed | Expected request and collection path |
| Same browser, beacon blocked | Whether the page request is counted when the script cannot report it |
| Same browser, JavaScript disabled | Whether server collection remains consistent without script execution |
| Same browser through an available hosting-network VPN | Whether changing the route changes the category |
| Automated browser | Whether known automation receives a browser label |
| HTTP client with a browser User-Agent | Whether the declaration alone changes the result |

Record who operates every condition. A human-operated visit is labelled human only when Goga or another consenting person actually performs it. An agent operating a normal browser is an agent-driven browser test, not independently labelled human readership. If no suitable VPN or human operator is available, record the missing condition rather than silently substitute another one.

Before generating any visit, verify owner/test exclusion and the actual deployed version. For each visit record: condition and repetition, operator, time, page response, request evidence, stored reason/category, whether the script ran, whether a beacon was attempted, and receipt where an actual join is available. An aggregate RUM change without a shared identifier is not proof of that individual visit's receipt. Record unavailable stages as unknown.

Capture the User-Agent and relevant network/TLS information for these controlled clients when they help explain a result. Do not add broad production collection merely because a field exists. Inspect Cloudflare's retained traces first. A dedicated test marker, limited to our own visits, is a possible way to join stages if existing evidence is insufficient; it is not deployed by this plan.

Report **wrong classifications / labelled visits** for each condition, with missing cases separate. Five repetitions can reveal a repeatable defect; they cannot estimate the fraction of all real-world readers affected. Compare the same cases before and after a proposed code repair. A smaller total or closer agreement with RUM is not enough to call a repair successful.

## Second: learn what the article communicated

The article names a familiar engineering problem, reports original measurements, links its working evidence, and leaves a disputed count unresolved. Those are inspectable features of the [published package](../readers-vs-bots/20-discovery-positioning.md). Their contribution to this launch's performance is still a hypothesis.

| Hypothesis | Evidence we have | Next useful check |
|---|---|---|
| Naming bot detection without a browser script helped people recognize the topic | The submitted title uses that wording | Preserve actual titles and comparable-age results on later launches; do not treat different articles as a randomized title test |
| Firsthand measurements made the article useful | A reader asks about a measurable failure mode | Retain explicit reports of use, reproductions, and corrections when they arrive |
| The 74.5% is easy to remember but its meaning can be lost | One comment reads it as a bot percentage | If further readers volunteer, ask what the number establishes before explaining it; count responses and preserve the wording shown |
| The footprint increased credibility | No captured feedback addresses it | Leave unknown unless a reader or a controlled study supplies evidence |

A small comprehension pilot could ask five to eight consenting readers three questions: what does 74.5% mean, does the site block anyone, and what remains unknown? Preserve the exact excerpt and answers, then test revised wording on a separate group if a pattern emerges. This pilot has not run and no invitations have been sent. Model answers would be a separate experiment, not a substitute for human understanding.

Goga also asked for a more human HN reply. Apply that directly to this response: answer the false-positive question first, use ordinary words, and explain what the number counts. Keep this instance in the research record; it does not justify a new universal writing rule or another skill. The existing plain-prose instructions already cover it.

## Article direction and stopping rule

Working subject: **What Hacker News Traffic Revealed About My Blog's Analytics**. This is a subject and question, not final metadata or a publication commitment.

Its center is Goga's response to the launch and the new question it makes worth answering. The current evidence can support a dated field note about the traffic and reader contact. The stronger engineering continuation can join the existing edge-versus-RUM article once known-client tests add a new result. Keep its useful result distinct from a general guide to succeeding on Hacker News.

Potential sections should be earned by the work: the actual launch and submission; what the counters saw; what the reader asked; the visits we deliberately tested; the code or wording decision that followed; and the remaining limit. Preserve Goga's own experience rather than inventing a retrospective lesson for him.

Finish the chosen article when its actual claims are supported, narrowed, or explicitly left open, and the reader can inspect the method. A truthful field note need not wait for a full seven-day window or a positive result. A claim about false-positive frequency does need appropriate labelled data. Do not expand article 024 or recompute its frozen footprint to absorb this work.

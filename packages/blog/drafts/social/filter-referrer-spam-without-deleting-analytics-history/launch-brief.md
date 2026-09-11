# Article 025: X and Hacker News sharing brief

Prepared September 10, 2026 PDT / September 11 UTC. Status: copy prepared; neither platform was used to publish. The owner asked for a somewhat clickbaity way to share the article. This is distribution work after the article's frozen research boundary.

## Reader and hook

An engineer publishing analytics can accidentally give an untrusted site exposure by displaying supplied referrer names. The article shows the incident, implemented controls, tests, and remaining limits. Its [existing passport](../../research/referrer-spam/00-article-passport.md) fixes the engineering case-study form and public-exposure focus.

Selected concept: **a suspicious site topped the author's public referrer rankings → the saved capture shows 35 reported views → public analytics need explicit rules for both counting observations and naming sources**. This is the consequence the owner wanted the article to explain. Historical retention, D1 cost, and token totals do not lead this launch.

The recommended X draft uses the author's own public-dashboard failure as its hook. An alternative starts with the general abuse mechanism and names Matomo. Both are editorial hypotheses; no comparison of their performance has been run. The current article title and metadata stay as published.

## Claims and source checks

| Copy claim | Evidence and boundary |
|---|---|
| A suspicious site ranked first with 35 reported views | The article opening and [September 6 capture record](../../research/readers-vs-bots/17-referral-abuse-defense-verification.md). These are reported requests, not 35 authenticated readers. |
| The ranking gave the site free advertising | The public dashboard displayed the hostname. This describes exposure; it does not establish that anyone subsequently visited that destination or identify an operator's intent. |
| Suspected spam is filtered; unreviewed domain names do not appear in rankings | The [versioned policy activation](../../research/readers-vs-bots/19-referral-policy-activation.md), public projection, and article's practice/result tables. Unknown included traffic stays in a generic bucket. Approved names can still be impersonated. |
| Matomo rules are part of the implementation | The article's pinned-list and local-exception explanation. All 35 exclusions in the fixed production comparison came from the local rule; the copy does not credit them to an upstream match. |

The canonical link returned HTTP 200 through curl on September 11 UTC, with H1 **How I Defend My Analytics Against Referrer Spam**, title **Referrer Spam Defense for Public Analytics**, and the current tested-practices section. The web reader returned an older cached article and a Python urllib request returned 403; those observations do not supersede the successful current curl retrieval or establish browser/composer behavior. This was a link check, not a traffic-measurement experiment.

## Platform fit

- **X:** lead with the concrete incident and link directly to the article in the same post. Both drafts use ASCII characters, so the weighted length is one per non-URL character plus 23 for the canonical URL. [X's official link-count guidance](https://help.x.com/en/using-x/how-to-post-a-link), checked September 11 UTC. Lengths are recorded in [copy.md](copy.md).
- **HN:** use the original published title and canonical link as an ordinary link submission. Its [guidelines](https://news.ycombinator.com/newsguidelines.html), checked September 11 UTC, ask for original titles except specified cleanup and discourage editorialized promotion. Its generated/AI-edited-text restriction is under comments, so any author comment should be written by the author. This brief supplies no HN comment.

The [HN FAQ](https://news.ycombinator.com/newsfaq.html), checked September 11 UTC, describes multiple ranking factors. Article 024's reception does not show that copying a particular title pattern will reproduce its outcome. No account-performance analysis, submission-history check, composer preview, media render, or external publication was performed for this copy request.

An optional later visual could use the dated ranking capture with the hostname obscured and a legible September 6 label. Any recreated illustration would need to be labelled as such. No screenshot or fabricated dashboard is part of this delivery.

## Learning boundary

The useful outcome is qualified reader contact: an implementer's question, correction, or account of applying the policy. If published, record the exact copy, status/submission URLs, time, and available referral evidence before judging results. A single launch cannot isolate the hook's effect. No capture schedule or publication action is created by this brief.

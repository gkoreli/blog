# Reader feedback: referrer-spam article focus and writing practice

Opened September 8, 2026 PDT / September 9 UTC. [TASK-0136](../../../../../docs/tasks/TASK-0136-refocus-article-025-on-referrer-abuse-and-apply-reader.md), filed in [the publishing worklist](../../../../../docs/folders/FLDR-0008.md) and linked from [the referral-defense worklist](../../../../../docs/folders/FLDR-0009.md), tracks this revision. The owner questioned why article 025's title emphasized historical retention and supplied a private X conversation with editorial advice. This is an owner-directed focus correction, independent of the planned September 28 discovery review.

## Original feedback archive

The root `x-message.md` was moved to:

[/Users/goga/.local/share/gkoreli/editorial-feedback/2026-09-08-andrew-healey-x-blog-editorial-advice.md](/Users/goga/.local/share/gkoreli/editorial-feedback/2026-09-08-andrew-healey-x-blog-editorial-advice.md)

The original **3,271 bytes** were copied, compared byte for byte, and verified again before removing the root copy. SHA-256: `fcfd38b0f3e20f470ca2fda69ce04873a9a25614a59ed109be4772ad1552b0b4`. Directory permissions are 0700; file permissions are 0600. September 8 is the date the owner supplied the export. The export contains clock times but no conversation date.

The full conversation remains private. This worklist paraphrases the relevant advice and resulting decisions. Its positive reception is a reported individual response, not a readership experiment or an endorsement of the revised article. The message was general blog feedback, not a review of the new article 025 draft.

## Advice and editorial decisions

| Input | Decision | Evidence boundary |
|---|---|---|
| Short, attention-grabbing titles with substance | Lead with the reader's main problem or result; keep the subject concrete and avoid promotional overstatement | Practitioner advice and owner judgment; no measured title-to-traffic effect |
| A strong opening | State the deployed reporting defense and the public-exposure problem before its history | Supported by the existing implementation and captures |
| Skimmable writing, including headings and useful visuals | Add a reporting-outcome table, separate results from D1 cost, and make the old/new report cost comparable in a table | A comprehension choice; diagrams are optional, not a publication quota |
| Direct prose with transparent AI assistance | Preserve prompt provenance and edit generic or mannered prose on its own merits | Disclosure does not establish clarity or correctness |
| Human feedback on drafts | When a reader is available, ask what they understood, where they became lost, and what they need to assess the claim | Agent review is separate; outside feedback is not a mandatory release gate |
| Avoid chasing short-lived LLM behavior | Build useful, inspectable engineering references with evidence proportionate to the claim | The conversation's prediction about future model behavior remains an assumption |
| The owner's goal of useful engineering references | Preserve methods, artifacts, qualifications, and corrections that engineers and their agents can reuse | A publishing goal, not a demonstrated citation or ranking benefit |

## Article 025 revision

The earlier passport promoted one implementation constraint into the headline. Retaining evidence remains necessary for this design, but the reader first needs to understand how fabricated referrers gain exposure and how a reporting policy limits that abuse. The D1 correction also belongs in the opening's main findings because it shows the operating cost of the chosen defense.

| Surface | Revised value |
|---|---|
| H1 / social title | How I Defend My Analytics Against Referrer Spam |
| SEO title | Referrer Spam Defense for Public Analytics |
| Alternative headline | Matomo rules and reviewed public names limit referral abuse; shared report queries and caching control the cost. |
| Description | Suspected referrer spam reached my dashboard. I added Matomo rules and name review, then cut a fixed report's D1 reads by 81.8%. |
| Primary reader job | Defend public reporting from referral abuse with consistent exclusions, controlled name visibility, and measured query cost |
| Opening | Name the deployed defense, the suspicious 35-view ranking, and the reporting boundary |
| Existing URL | `/filter-referrer-spam-without-deleting-analytics-history` |
| Evidence and non-promises | Existing captures establish policy behavior and a fixed-report read reduction. They do not authenticate callers, prevent all requests, establish human readership, or guarantee a global operating budget |

The original title candidates remain in [the passport](00-article-passport.md) as the historical decision record. The published title, description, opening, section structure, and ending now follow the public-defense emphasis. The provenance quotation moved into its relevant section and remains a complete verbatim prompt. The outcome table distinguishes excluded observations from unfamiliar included hosts. Historical counts and code examples retain their existing scopes.

Article 024's contextual link label follows the new title; its research accounting and historical claims remain unchanged. Modification dates reflect the served changes, while original publication dates and URLs remain. Two new complete shaping prompts are appended to article 025's prompt file. The later file-organization request is bookkeeping, so it belongs in this worklist rather than the article prompt record. The private X conversation is not copied into the public prompt file.

## Shared instruction changes

- `shape-article`: distinguish the reader's main consequence from supporting implementation choices and constraints; correct the stale literary-title exception.
- `article-discovery-positioning`: check that title specificity has not displaced significance, and align its signature-title table with the subject-first rule.
- `blog-writing`: add a skim check and bounded human draft feedback; keep transparency separate from prose quality.
- `shareable-engineering`: state the engineering usefulness goal and apply HN's actual submission/comment guidance without promising virality.
- `AGENTS.md`: preserve the owner correction, practical reader-feedback loop, useful-reference goal, and private-source handling.

The independent agent review was read-only and supplied a second assessment of these changes and the primary guidance below. It is an editorial/code review, not human reader feedback. No new skill or publication approval step was introduced.

## Primary references checked

| Reference | Use and limit |
|---|---|
| [Matomo's 2015 explanation](https://matomo.org/blog/2015/05/stopping-referrer-spam/) | Establishes the referrer-spam mechanism and exposure incentive; does not establish this incident's operator or motive |
| [Matomo's list README](https://github.com/matomo-org/referrer-spam-list) | Documents the community-maintained list and its incompleteness; the article retains its pinned source revision |
| [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link) | Supports concise descriptive titles and consistent title signals; does not predict the effect of this revision |
| [HN guidelines](https://news.ycombinator.com/newsguidelines.html) | Ordinary, faithful submission titles; the generated/AI-edited-text prohibition is under comments |
| [HN FAQ](https://news.ycombinator.com/newsfaq.html) | Ranking involves multiple factors, so a single successful submission does not isolate title or format effects |
| [Google AI-feature guidance](https://developers.google.com/search/docs/appearance/ai-features) | Ordinary search fundamentals remain relevant to Google's features, with no special AI file/schema requirement or inclusion guarantee; does not describe every agent |

Sources were checked September 9, 2026 UTC. The existing [credibility reference](../../../../../.agents/skills/blog-writing/references/firsthand-evidence-and-credibility.md) retains the fuller distinctions between correctness, perceived credibility, retrieval, and citation. This pass adds no new production traffic measurement or broad source-selection study.

## Worklist and acceptance

- [x] Move and rename the private source; verify identical bytes and record its location and hash.
- [x] Diagnose the title's emphasis and preserve the original decision record.
- [x] Revise article 025 and align contextual links and exact prompt provenance.
- [x] Apply focused instruction changes and obtain an independent read-only review.
- [x] Validate changed skills, relative links, exact prompts, and the generated article, metadata, and social card.
- [x] Commit and push the scoped changes; verify the served revision.
- [ ] Obtain human feedback on the revised draft when a willing reader is available; record the result before claiming it helped.

The final item is a future opportunity, not an acceptance gate for this owner-requested revision. No messages were sent and no HN or X submission was performed.

Validation: the four skill validators passed, the blog build produced all 25 posts with the referral-policy integrity check, and [18 generated-output/archive checks](08-editorial-revision-checks.json) passed, including 17 exact rendered prompts and 46 relative file/site links. The 1,396-word article's 42-character SEO title and 128-character description fit the intended presentation. The generated 1200×600 social card was visually inspected with no clipped text. Browser interaction could not be checked because CUA reported no available browser; the temporary local server was stopped. No production SQL was executed.

The independent review caught two precision issues before acceptance: metadata now retains the suspected-abuse qualification, and the reporting table includes absent hostnames. Both tables were checked against the current evaluator/projection and saved production read measurements. A remaining literary-title example in the positioning skill was also aligned with its subject-first instruction.

Published in `85c3451`. Its Cloudflare build `2f60f5cc-b2d7-41fa-a1fd-a64b2f804203` completed successfully at September 9 **00:57:52 UTC**. [Live acceptance](09-editorial-revision-live.json) at **01:00:44 UTC** verified the H1, SEO title, qualified description, structured metadata, both new tables, 17-prompt page, citation title, and social card. The citation JSON and social image match the checked local bytes. The final bookkeeping commit records this acceptance; it changes no article content.

## Public transparency and D1 scope correction

September 9 UTC / September 8 PDT, 2026. [TASK-0139](../../../../../docs/tasks/TASK-0139-explain-public-referrer-abuse-and-refocus-article-025.md) records the owner's further correction: the article must explain why an untrusted destination topping a public report risks readers' safety, the blog's credibility, and honest judgments about readership. The owner also questioned why a database optimization occupied so much of the article, then asked whether spam had been eradicated and emphasized sharing the implementation and lesson. All three complete prompts are appended chronologically; none is quoted in fragments or rewritten as a public prompt.

### Position and evidence

| Point | Evidence and treatment |
|---|---|
| The hostname topped a publicly visible report with 35 views | The existing September 6 capture and ADR establish the displayed ranking; `/stats` is public. The original display used plain text, with no outbound link or HTML injection. |
| The owner considers the destination malicious | Preserve that as the owner's stated assessment, rather than claiming an independent malware/phishing diagnosis. No destination inspection is invented. |
| Referrer spam fabricates referral claims to gain exposure | Matomo's May 13, 2015 explanation describes repeated automated requests and the analytics-promotion incentive. Rechecked September 9 through the official indexed page after a direct retrieval timed out. |
| The 35 observations establish zero legitimate referrals | Unsupported. Repetition supports a suspected-abuse policy; the saved request fields cannot prove that every reported referral was fabricated or identify the operator. The article rejects presenting those observations as 35 established readers. |
| Public exposure can endanger readers and credibility | The owner identifies this risk. Present it conditionally; no incident of a reader following the name or suffering harm has been measured. Plain-text exposure can still make a destination discoverable. |
| Unfiltered rankings can mislead the author about audience growth and discovery | Explain the mechanism and reporting risk. Do not claim a measured amount of false readership or prove that every included, approved source is authentic. |

The bounded domain search found reproductions of our own article and commercial reputation-score pages; it did not provide primary evidence establishing malware, phishing, operator identity, or zero genuine click-throughs. Our own article and its mirrors are not independent corroboration. Inconsistent third-party scores are not used as a safety verdict. The suspected destination was neither visited nor linked.

The published argument is firm about the reporting decision: arbitrary names should not earn public exposure by generating requests, and suspected spam should not be counted as proof of an audience. It remains precise about what the historical observations can establish. The new section names reader safety, the author's credibility, inflated audience interpretation, and distorted referral rankings. The ending makes accountable filtering and correction part of the transparency model.

The answer to complete eradication is explicitly **no**. The article distinguishes the closed promotion path and consistent rule-based report exclusions from continuing possibilities: forged approved names, absent headers, rotated unreviewed names, and automated requests that pass other rules. The known 35-observation exclusion is a fixed-window policy result. The public code, ADR, and captures let others inspect and reuse the defense without promising complete visitor authentication or traffic blocking.

### Why D1 stays brief

The D1 incident is connected to the implementation: repeated referral assessments made reports expensive. It establishes an operating tradeoff of this particular defense. It does not establish referral authenticity, explain the exposure incentive, or prove credibility harm. Giving that incident a long section and a headline opening bullet displaced the article's main reader problem.

The body now keeps one paragraph with the identical-report comparison, 182,388 to 33,259 rows read (81.8% fewer), and the cache freshness tradeoff. Links retain the complete [incident](../d1-read-budget/00-incident.md) and [repair verification](../d1-read-budget/02-recovery.md). No evidence is deleted from those sources; this revision does not create or promise another article. The title and URL stay stable; the description and alternative headline now match the public-abuse focus.

This repeats the earlier weighting error: first historical retention, then query optimization was promoted above the reader's central concern. The existing `shape-article` focus rule now explicitly applies to body space as well as title, opening, and ending. This is a focused correction to an existing skill, without introducing another workflow or publication gate.

### Frozen provenance and acceptance

The [research footprint](10-research-footprint.md) remains frozen at 71,572,616 tokens, four sessions, six committed Markdown artifacts, and the first 18 shaping prompts, ending September 9 at 01:35:07.268 UTC. The public prompt record now contains 21 messages. Its scope text explicitly says later prompts and article edits are outside the frozen measurement. Both earlier manifests and the overlap record remain unchanged; this editorial continuation is recorded in existing research notes rather than adding another Markdown artifact to the counted set.

The material served change occurs on September 8 in the author's timezone, matching the existing `lastModified` date. The original publication date remains September 6. The `shape-article` validator and production build passed; the build generated all 25 posts and passed the referral-policy integrity check. [Seven generated-output checks](13-public-transparency-checks.json) passed, including all 21 exact prompts, the shorter D1 treatment, explicit residual abuse paths, and unchanged frozen accounting. An independent read-only editorial review found no remaining material issue after clarifying that the D1 measurement counts row reads rather than stored rows. Live acceptance will be recorded after deployment. No production SQL or suspicious-destination visit was performed.

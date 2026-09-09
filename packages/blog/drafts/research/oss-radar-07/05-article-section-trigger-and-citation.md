# Article section: who started the task, and what did the answer cite?

Drafted September 8, 2026 for OSS Radar #07 and incorporated into the [Promptfoo draft](../../oss-radar-07-promptfoo.md). This is sourced prose, not a published post or a trigger experiment result. [Research and proposed test](04-trigger-provenance-and-ai-citations.md).

## Who started the task, and what did the answer cite?

An assistant can use a blog on someone's behalf without that person visiting the site. A person can ask for an article now or commission a report that runs every week. Both serve a human goal. The immediate trigger differs, and neither tells us what the answer cited.

That distinction has prior art. W3C's [provenance model](https://www.w3.org/TR/2013/REC-prov-dm-20130430/) records what started an activity separately from who bears responsibility for it. A Web Bot Auth [use-case draft](https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4) likewise questions the human/bot binary. Signed requests identify an automation identity within the protocol's trust model; the [protocol draft](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6) leaves human authentication and delegation outside its scope.

A citation belongs to the answer. We need the captured output to observe it, then the source to check whether it supports the claim. Even that leaves a further question: did the model rely on the source? [Research on citation faithfulness](https://arxiv.org/abs/2412.18004) distinguishes actual reliance from a reference that merely agrees with the answer.

The useful record keeps task history, requests, and outputs separate, then links them where evidence permits. That lets us count assisted access and inspect citations without turning either into an invented count of people.

## Integration notes

- For Promptfoo, place this before the capture and scoring results. Assess which records survive its provider adapters and trace exports. A complete-looking trace must not imply evidence it never received.

Use the research note's diagram if it helps explain the distinction. Label it conceptual until measured cases exist. The completed article still needs the selected project's results and adoption verdict; this passage supplies neither.

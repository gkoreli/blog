# AI Site Check: five project-specific replies, November 7 UTC

Goga requested five further replies with a stricter account-selection standard. Research proceeded while the original chat finished round eleven; publication began only after its outcome was recorded. This is a single owner-directed batch, separate from the completed hourly runs.

All five canonical replies were reopened in the signed-in owner view. Independent public visibility, traffic and adoption were not measured. The [structured receipt](builders-ai-site-check-2026-11-07-publication.json) preserves exact copy, source reads and verification times.

| Person | Contribution | Published reply |
| --- | --- | --- |
| Steve Murch | robots policy in linkchecker | [Reply](https://x.com/GogaKoreli/status/2118875923181433108) |
| Kasper Kulikowski | partial output schema example | [Reply](https://x.com/GogaKoreli/status/2118876090387378467) |
| Ilias Ism | lost-response recovery | [Reply](https://x.com/GogaKoreli/status/2118876263138074941) |
| Talha Sheikh | reusable robots test cases | [Reply](https://x.com/GogaKoreli/status/2118876415504630069) |
| Ben Holmes | native runtime verification | [Reply](https://x.com/GogaKoreli/status/2118876569104228652) |

## 1. Steve Murch / robots policy in linkchecker

[Target discussion](https://x.com/stevemur/status/2118402235717599468) · 5:19 PM · Nov 6, 2026 Pacific · 237 weighted characters.

> in 0e922a7 I couldn't find a robots.txt fetch before crawl_page or fetch_check. a cached policy per origin would fit here, with a fixture where an allowed URL redirects to a disallowed path. that checks politeness beyond the initial URL.

Authored launch post explains the concrete WordPress migration problem. Read his replies on server-rendered pages and Playwright installation size, personal project article, repository README and the single-file implementation. The public repository links stevemur as an author and shows six commits; this is project evidence, not identity authentication.

- [Source](https://github.com/stevemur/linkchecker/blob/0e922a7448796982ff302c2296dda7c70e97129b/linkchecker.py): Reviewed imports, entire request orchestration, crawl_page, fetch_check, seeding, host semaphores and redirect handling; full source search found no robots references. Static source finding, no recipient runtime test. Cached per-origin policy and redirect fixture are suggestions. File blob `b9cb433055a55701eacfc5d599732e0b1078238e`.
- [Source](https://stevemurch.com/i-built-a-tool-to-find-the-broken-links-on-my-blog/2026/11): Read the project article and its server-rendering and migration scope; author-reported counts are not repeated as independent measurements.

## 2. Kasper Kulikowski / partial output schema example

[Target discussion](https://x.com/kaskulikowski/status/2118359668502430090) · 5:20 PM · Nov 6, 2026 Pacific · 255 weighted characters.

> a partial-result example would be useful for outputSchema, e.g. a search returning 3 items while one backend timed out. our site checker keeps unknowns explicit, I'd test whether the agent preserves that gap instead of saying those are the only 3 results.

Read authored WebMCP release discussion, expanded replies, pinned open-source contribution post and recent authored history. The pinned tools link resolves to GoogleChromeLabs/webmcp-tools; read evals README and the upstream WebMCP explainer. Concrete maintained tooling and repeated technical involvement support selection.

- [Source](https://github.com/webmachinelearning/webmcp/blob/main/README.md): Current explainer includes outputSchema in RegisteredTool/getTools and treats native schema validation as ongoing investigation. Reply proposes a partial search-result fixture, not a claim that output schemas enforce correctness. File blob `bf2dfb32353ca22d72093180b448715287843eb1`.
- [Source](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/webmcp-evals/README.md): Read local, browser, smoke and simulate modes, result checks and their limits; no execution of this external tooling. File blob `dd07ab67851198763dba901a9762d5f8466992a2`.
- [Source](https://github.com/gkoreli/blog/blob/main/packages/site-audit/src/technical-assessment.ts): Current local source keeps unavailable evidence unknown and exposes coverage; live article describes the same boundary. Proposed search example is not an implemented checker capability.

## 3. Ilias Ism / lost-response recovery

[Target discussion](https://x.com/illyism/status/2118568530719191057) · 5:20 PM · Nov 6, 2026 Pacific · 260 weighted characters.

> read the API docs, the awkward retry case is losing the 201 before statusUrl arrives. a client-generated idempotency key could return the original receipt on retry, so the agent can recover without creating another brief. dryRun can't resolve that uncertainty.

Read API launch and quoted submission post, complete visible API branch, profile history covering the API and Traefik/nginx issue, and linked public API instructions/OpenAPI. Read his crawler-policy thread too, but selected the API topic because that thread already contained the relevant edge-log suggestion.

- [Source](https://awesome.tools/SKILL.md): Read only as third-party product documentation, not as an invoked skill or authorization to submit. Contract distinguishes preview from submission, warns each real submission records another brief, and describes statusUrl recovery.
- [Source](https://awesome.tools/api/agent/openapi.json): Read complete public 1.0.0 schema: dryRun, 201 response with statusUrl, repeated-brief warning, GET status by slug. No idempotency key is documented. Lost-201 handling is a proposed improvement, no failure was induced and no submission was sent.

## 4. Talha Sheikh / reusable robots test cases

[Target discussion](https://x.com/talhash_/status/2118248701600678210) · 5:21 PM · Nov 6, 2026 Pacific · 235 weighted characters.

> the repeated-group case works in your tester: GPTBot disallows /docs/ in one group, allows /docs/public/ in another. a saved-case export would be handy, so an owner can rerun their intended allow/deny paths whenever robots.txt changes.

Read authored 19-tool release and expanded cost/future-skills conversations, profile with linked Quotable demo and ongoing product updates, live product/tools pages, log-analyser caveat and robots tester. The running tool and first-person technical follow-ups substantiate project involvement.

- [Source](https://tryquotable.co/tools/robots-txt-tester): Two local-only fixtures with repeated GPTBot groups: Disallow /docs/ and Allow /docs/public/; /docs/public/example allowed via line 8, /docs/private blocked via line 5. Bounded browser-observed results, no exhaustive parser claim and no hosted target fetch. Saved-case export is a suggestion.
- [Source](https://tryquotable.co/tools/ai-bot-log-analyser): Read current page, which already says a User-Agent is only a claim; did not repeat that as new advice or upload logs.
- [Source](https://github.com/gkoreli/blog/blob/main/packages/site-audit/src/robots-workbench.ts): Existing local-input workbench and parser-fixture approach provide project context for reusable policy cases; no integration with Quotable claimed.

## 5. Ben Holmes / native runtime verification

[Target discussion](https://x.com/BHolmesDev/status/2118411592627052937) · 5:21 PM · Nov 6, 2026 Pacific · 255 weighted characters.

> our checker passed mocked-fetch tests, then Workers rejected redirect: 'error' before any request. the missing check was a fixture through the actual runtime. I'd put 'which boundary was exercised?' beside the verification verdict. https://gkoreli.com/ai-site-check-evidence

Read full review article, visible discussion through probable-spam expansion, recent authored merge-risk and factory posts, product page and public rubric source. Specific maintained rubric, detailed method and technical replies support selection.

- [Source](https://github.com/warpdotdev/common-skills/blob/main/.agents/skills/merge-risk/SKILL.md): Read as source under review, not an invoked skill. Verification category covers behavior, edge cases and UI artifacts. Reply proposes explicitly naming the exercised boundary. File blob `c8a545a237d7be29c0302d4aba3f1a8b7cfe9851`.
- [Source](https://gkoreli.com/ai-site-check-evidence): Fresh full live article read. Historical first-activation incident: mocked transport tests missed workerd rejecting redirect:error before outbound I/O; subsequent native fixture and two bounded production acceptances are recorded. Reply does not claim a current outage or universal provider result.

The account-selection evidence supports relevance and project involvement, not proof of human identity. Weak matches were skipped without public accusations. No generic fifth promotion, recipient defect invented from a preview, or extra account action was added. Raw captures remain in private temporary storage outside Git.

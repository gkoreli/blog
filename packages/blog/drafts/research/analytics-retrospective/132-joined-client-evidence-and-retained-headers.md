# Joining names, crawler categories and signatures changes the question

November 5, 2026 Pacific / November 6 UTC. Continues [the public uncertainty audit](127-current-unidentified-and-unsigned-traffic.md) under the [ten-hour improvement worklist](128-detection-improvement-worklist.md). This is a fresh, read-only production aggregate plus an authenticated review of already-retained Cloudflare logs. It is not a deployment or new-logging acceptance.

## Exact joined findings

A native-tested aggregate selects included stored events from October 31 at 00:00 through November 6 before 05:42:49 UTC, applying the owner and current referral exclusions. Its **83 groups reconcile to 3,960 events**, matching the earlier seven-day public headline. The query joins name selection, stored declaration cardinality, provider category, signature basis and collection/classifier versions on each event before grouping.

- Exactly **eight** generic-token events have no recognized declaration, no selected name, explicitly absent signature headers and provider category `AI Crawler`.
- Another **two** have those same name/signature facts with provider category `AI Search`.
- The remaining two Other-bot events carrying `AI Crawler` have selected `GoogleOther` names. The earlier public report's lower bound of at least eight unnamed events was valid; the joined query resolves it to eight in this frozen scope.
- There are **2,810** zero-candidate records and **1,150** single-candidate records, with no multiple-candidate record in this particular selection. The equality between no selected name and no recognized declaration is measured here, not a universal identity between those concepts. [The domain audit](130-detection-domain-audit.md) reproduces a compatible multiple-name event that has no selected name despite two recognized declarations.
- Stored classifier profiles split into **260** events under `2026-10-29.3`, **3,284** under `2026-10-31.1`, and **416** under `2026-11-05.1`. This is a mixed-method population; it does not test only the latest classifier.
- Signature bases remain 3,250 unsigned, 697 verified with User-Agent uncovered, and thirteen locally unverified. Names, provider roles and covered signature components remain independent evidence.

The aggregate exports no raw UA, address, daily client ID or observation ID. Its output contains closed states and producer-profile strings. The query and full operational receipt remain private; the public [joined receipt](2026-11-06-joined-client-evidence.json) preserves the aggregate groups, selector, SQL commitment, meters, checks and limits.

## The query exceeded its planned cost gate

Six synthetic local workerd/D1 fixtures verify the actual query and literal Wrangler argument path: five included events across four groups, owner exclusion, a named provider-category event and a compatible multiple-name event without scalar name. Parameterized and literal results match. The prepared SQL is 70,063 bytes, below D1's documented 100,000-byte statement limit. The original native fixture schema lacks the production time indexes, so its plan does not prove production index use.

One remote `--command` statement returns **85,639 rows read, zero rows written and one reported provider attempt**. Its partition and scope checks pass, but **85,639 exceeds the planned 50,000-read review threshold**. The threshold is not server enforced. The private runner stops on that assertion after preserving the successful response; offline review separates the cost failure from the complete data result. No production retry is used to make the cost gate pass. This is an observed cost to address in report design, not a quota outage or a claim about all account activity.

## Existing logs are useful before adding new logging

The authorized Chrome session reaches the native Cloudflare Worker dashboard. Retained invocation details expose request headers and top-level provider category. One inspected header is an iPhone Twitter-app UA; its category is explicitly empty. This is one existing envelope, not an independently labelled human visit or a native managed-verifier comparison. Raw metadata includes sensitive fields and stays outside Git.

A separate dashboard visualization groups the existing `$workers.event.request.headers.user-agent` field over the frozen November 5 06:00–November 6 06:00 UTC window. Its final displayed limit is ten. An attempted change to twenty does not persist; the observation remains a top-ten result, not a twenty-group export. The displayed groups include familiar browser claims, ExaSearchBot, Meta-WebIndexer, and unregistered `Elseweb` and `smallweb-reader` products. A different rolling-hour view also exposes Twitterbot. Those are leads for source review; neither contact-URL text nor a mention of Kagi proves who operated a client or how the content was used.

This view covers retained Worker log events, including asset/API traffic. It is not the D1 eligible-page population, a complete request census, an exact request join or an attributable client count. The native UI warns that events may be sampled beyond a plan threshold. No sampling-completeness or meter coverage is established. No pricing agreement, protection, credential or log setting is changed, and no live tail is started.

The existing retained headers are sufficient to investigate immediate catalogue candidates. New raw-header collection is not justified by this review. The engineering should first fix known text-matching errors and expose the independent facts already retained. A later diagnostic expansion would need a specific remaining question, bounded fields/retention and accurate disclosure.

## Engineering consequence

The proposed report change adds a joint table of stored selected-name state, provider category and local signature basis/profile. It must reconcile with the existing name, provider-category and signature tables. It should say **no single selected name**, since several recognized names can intentionally abstain from selecting one. A matching total validates a partition; matching marginals do not independently authenticate the underlying event correlation. The SQL supplies that join and native fixtures must exercise it.

Runtime implementation, native performance comparison, public presentation and production acceptance remain separate from the measurements above. The active worklist owns those gates. Private captures and the runner are under `/tmp/analytics-detection-improvement-20261106/` pending durable archive; a later archive receipt must replace this temporary-only continuity limit.

# Web Analytics Tools Disagree About What Counts

A server request, a browser pageview, a visit and a signup measure different things. Choosing web analytics starts with deciding which of those you need. AI agents make that choice harder to ignore: they can retrieve useful content without producing the browser events a dashboard expects.

This comparison covers PostHog, Matomo, Plausible, Umami, Rybbit, OpenPanel, GoatCounter, GA4, Cloudflare AI Crawl Control and the analytics library behind this blog. Their differences reach beyond bot detection into identity, conversions, installation and who operates the system.

The library is part of the comparison because I use and develop it. The earlier [User-Agent investigation](/please-stop-misreading-user-agent) examines one part of that work. Version 0.2 now ships portable cached reporting and broader signature verification, with a production history upgrade checked against retained observations. Our strongest technical advantage is precise evidence about signed requests. Established tools remain ahead in campaigns, outcomes and integrations. That makes publisher outcomes the next build to prioritize.

The competitor source and popularity baseline is **November 13, 2026**. Selected detection and integration documentation was checked again on November 14, when our production-upgrade acceptance was completed. No cross-tool installation or identical-traffic replay was performed for this comparison. Our library has execution evidence; the other products are compared through their documented capabilities and inspected mechanisms.

## Start with what the collector can observe

A request passes through several possible stages. A tool can only report the stages for which it receives evidence.

| Stage | What it can establish | What it leaves open |
| --- | --- | --- |
| A request reaches the edge | An attempt occurred, possibly followed by a block or error | Whether the application served the page |
| The application serves a page | A response was produced under the collector's eligibility rules | Whether anything read or used its contents |
| A browser sends an analytics event | The event reached the collector | Whether the browser represents a person, automation or a relay |
| An action completes | A defined signup, purchase or other outcome occurred | Which earlier interaction caused it, unless attribution is supported |
| Content appears in an answer or citation | There is evidence of that particular use or reference | Whether every earlier fetch contributed to it |

Cloudflare's [AI Crawl Control reports](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/) include blocked attempts and error responses. Our [page collector](https://github.com/gkoreli/blog/blob/a85aa06c381a287dcaee8c5ed401f4d4e2c60ace/packages/analytics/src/eligibility.ts) accepts successful eligible HTML or negotiated-Markdown page GETs. A rejection before the Worker runs is outside its view. These populations cannot be made equivalent by giving both totals the label *traffic*.

Cloudflare Web Analytics adds another distinction. It uses a [browser performance beacon](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/); AI Crawl Control observes activity at the edge. They are different Cloudflare products, with different collection boundaries.

This also separates three things often grouped under AI analytics: an agent fetching a page, a referral from an AI service, and an LLM call made by your own application. Each can matter. Each needs its own observation.

## Ten options, compared by the job they do

The collection column describes the documented path relevant to this comparison. Products with SDKs or APIs can accept other explicitly submitted events; that does not give them automatic visibility into requests nobody sends them.

| Tool | Collection and audience treatment | Useful strength and consequential boundary |
| --- | --- | --- |
| [Plausible](https://plausible.io/docs/bot-traffic-filtering) | Browser events and an Events API, with bot filtering; AI referrals are separate from crawler requests | A focused audience dashboard, campaigns and goal workflows; some advanced reports depend on the edition |
| [GoatCounter](https://www.goatcounter.com/help/start) | Script, pixel, backend capture or server-log import; a configurable definition of visits | A small-site counter with import/export paths; repeat-visit deduplication affects totals |
| [Umami v3](https://docs.umami.is/docs) | Website/product events, with traffic, behavior and outcome analysis | Campaigns, goals, funnels, retention, revenue, teams and an official MCP interface |
| [PostHog](https://posthog.com/docs/web-analytics/bot-detection) | Browser/product events plus ingested HTTP logs; retained traffic can be classified at query time | Product analysis and flexible queries; server traffic still needs an ingestion path |
| [OpenPanel](https://openpanel.dev/docs) | Script and SDK events, optional identified users and backend capture | Profiles, funnels, retention, revenue, exports and MCP |
| [Matomo](https://matomo.org/faq/how-to/install-ai-chatbot-tracking/) | Conventional analytics plus a configured server/edge path for separate AI chatbot telemetry | An established analytics platform with dedicated chatbot reports and ordinary acquisition/outcome workflows |
| [Rybbit](https://rybbit.com/docs/bot-detection) | Tracking requests assessed through several signal layers; filtered bots can retain compact evidence records | Browser and behavioral signals beyond our request classifier, alongside a broader analytics suite |
| [GA4](https://support.google.com/analytics/answer/12923437) | Instrumented website/app events organized into acquisition, sessions and outcomes | Campaign and advertising integrations, key events and revenue analysis |
| [Cloudflare AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/) | Edge requests, including blocks/errors, with crawler controls and reporting | Visibility before our collector, transfer volume and requested/served formats |
| [Our library, `@gkoreli/analytics` 0.2](https://github.com/gkoreli/blog/tree/a85aa06c381a287dcaee8c5ed401f4d4e2c60ace/packages/analytics) | Eligible served-page events; people and agents remain in the audience, with separate evidence dimensions | Signature coverage, historical profiles and portable cached reporting; a Worker/D1 package without a general conversion workflow |

This is a representative selection. At review, the seven external code repositories ranged from about **6,200 to 40,800 GitHub stars**. The [recorded snapshot](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/web-analytics-comparison-ai-traffic/repository-snapshot.json) preserves the exact counts and source baselines. Stars measure repository interest. They do not measure installed sites, detector accuracy or successful operator decisions.

For adoption context, [W3Techs' November survey](https://w3techs.com/technologies/overview/traffic_analysis) lists Google Analytics on 46.7% of websites, Cloudflare Web Analytics on 4.5% and Matomo on 1.4%. Those are detected website-use percentages under that survey's method. The Google figure is not a verified GA4-only installation count, and server-only integrations can be less visible to technology detection.

## Plausible, GoatCounter and Umami make different promises

Plausible deliberately filters automated activity. Its documentation distinguishes people clicking links from AI tools from crawlers requesting content, and directs operators to server/CDN logs for the latter. It also applies filtering to Events API traffic. That is a coherent choice for a publisher who wants the documented filtered audience view. It is insufficient evidence for counting all agent access. [Plausible's collection policy](https://plausible.io/docs/bot-traffic-filtering) is explicit about that boundary.

GoatCounter provides a useful counterexample to the idea that a small counter must depend on JavaScript: it supports [following or batch-importing server logs](https://www.goatcounter.com/help/logfile). Its documentation also explains a consequential counting rule. With session tracking enabled, repeat requests to the same path within the documented eight-hour session are deduplicated as visits. There is an option to count every pageview instead. [Visit definition](https://www.goatcounter.com/help/sessions).

For an illustrative reload example, ten recorded loads of one path by the same session can therefore represent one GoatCounter visit. Our library would retain ten events if all ten meet collection rules. A rotating daily identifier would be a third number. This example follows the stated definitions; it was not executed across the two tools.

Umami v3 extends further into product analysis. Its documented reports connect acquisition with behavior, conversion and revenue. The inspected [send route](https://github.com/umami-software/umami/blob/b18d5144dfe7342edeeca6f61d13ba3baabed9ad/src/app/api/send/route.ts) includes campaign handling and a bot check that can be disabled by configuration. Consequently, saying that two installations both run Umami still leaves configuration and event definitions to inspect.

Our library makes another choice: it keeps every eligible page event and reports daily identifiers without calling them people or sessions. The identifier combines site, UTC day, IP and User-Agent through a keyed hash, an HMAC. It deliberately cannot establish cross-day retention. That avoids an unsupported returning-reader metric, while also leaving a real product capability unavailable.

## PostHog and OpenPanel connect events to product decisions

PostHog's current bot documentation describes `$http_log` ingestion from access logs or edge/server integrations. Query-time classification can then distinguish agent, crawler and automation categories while preserving ingested events. This is separate from SDK-side suppression, where an event may never be sent. Its [published definitions](https://github.com/PostHog/posthog/blob/a2b0fe99f5566007dfe62e8096c8597342caecb3/products/web_analytics/backend/hogql_queries/bot_definitions.py) also make the category rules inspectable.

That changes the comparison with our library. Retaining agent traffic and offering several categories are already available elsewhere. Our distinction needs to be more specific than having a bot table.

The identity choice matters too. PostHog documents that HTTP-log ingestion needs an appropriate distinct ID and person-processing setting. A shared ID collapses unique counts; per-request random IDs inflate them. Our daily IDs answer a deliberately limited question. [HTTP-log identity guidance](https://posthog.com/docs/web-analytics/sending-http-logs).

OpenPanel supplies custom event tracking, user identification, profiles and outcome reports through [its script, SDK and API workflows](https://openpanel.dev/docs). Its AI observability features concern calls made by an instrumented application, which is a different task from detecting external agents fetching a publication.

PostHog's [product reports](https://posthog.com/docs/product-analytics) and OpenPanel's event workflows provide a broader route from an event to a business question than our current package. Our newsletter state lives in another module. It does not become a reusable analytics conversion contract merely because it shares infrastructure with page observations.

## Matomo and Cloudflare see agents from different positions

Treating Matomo as a browser-script-only product would miss its current documented AI workflow. Its integrations can submit chatbot telemetry from Cloudflare, CloudFront, WordPress or the HTTP Tracking API. The [setup guide](https://matomo.org/faq/how-to/install-ai-chatbot-tracking/) describes dedicated processing that creates no normal visit or session, and uses User-Agent substring matching for the listed chatbots. The inspected [detector](https://github.com/matomo-org/matomo/blob/58a86dee2acc2aaf73a526fe137871f835a59d86/plugins/BotTracking/BotDetector.php) corroborates that mechanism in the development source baseline.

Matomo's [report documentation](https://matomo.org/faq/reports/ai-chatbots-overview-report/) distinguishes chatbot requests, requested content and acquired visits. An aggregate relationship between retrievals and referrals still does not join a particular fetch to a particular prompt, answer or later click.

Cloudflare starts further upstream. AI Crawl Control reports successful requests alongside attempts that produced blocks or errors. It can also report transferred bytes and compare requested and served formats. Our collector cannot recreate that missing upstream history from successful-page records.

There is an evidence distinction within Cloudflare too: its [GraphQL reference](https://developers.cloudflare.com/ai-crawl-control/reference/graphql-api/) separates spoofable User-Agent filters from Cloudflare-verified detection IDs, with different plan availability. A crawler name selected through a UA filter should not silently inherit the confidence of another detection method.

For this blog, the two views can complement each other. Edge evidence helps explain access failures. Successful-page evidence helps explain what was actually served under our rules. Neither alone establishes that an answer used the page.

## Rybbit makes the evidence comparison more demanding

Rybbit documents five detection layers: User-Agent patterns, header consistency, client-side signals, ASN/network information and rate/anomaly behavior. It retains matching layers in compact bot records when filtering is enabled. By default, those detected requests stay outside normal analytics. [Detection policy](https://rybbit.com/docs/bot-detection).

Here, filtering a bot means controlling its inclusion in analytics. It does not necessarily mean denying that client access to the website. The inspected [tracking entry point](https://github.com/rybbit-io/rybbit/blob/840369a089c393ae16139c18ba1405efd14d32e6/server/src/services/tracker/trackEvent.ts) receives a tracking payload. It cannot classify a page fetch that never produces an ingested event through that path.

The inspected [ingestion service](https://github.com/rybbit-io/rybbit/blob/840369a089c393ae16139c18ba1405efd14d32e6/server/src/services/tracker/ingestEvent.ts) also separates detection from enforcement: with filtering off, detected events enter normal analytics and their detections are mirrored into a separate observations queue. Its [detector](https://github.com/rybbit-io/rybbit/blob/840369a089c393ae16139c18ba1405efd14d32e6/server/src/services/tracker/botBlocking/index.ts) retains layer flags and supporting details.

Rybbit has behavioral and browser evidence our request classifier does not collect. Our report emphasizes separate lexical declarations, network evidence, signed-component verification and unavailable states. Multiple recorded detection reasons are already present in Rybbit; that alone cannot establish our advantage.

There is a concrete policy difference in the source. Rybbit's detector treats generic hosting networks as supporting evidence, separately from its curated bot-provider networks. Our [current rules](https://github.com/gkoreli/blog/blob/a85aa06c381a287dcaee8c5ed401f4d4e2c60ace/packages/analytics/src/readerkind.ts) can assign a cloud-browser category to an otherwise unnamed, unsigned request from hosting-list membership alone, before checking navigation shape. The event stays in our data, but its audience partition changes. That is a consequential classification choice, without a measured accuracy winner.

A fair accuracy comparison would need independently supported labels, the same eligible inputs, each configuration, and explicit treatment of false positives, false negatives and abstentions. We do not have that cross-product result. Counting more rejected bots would not supply it.

## Our library keeps evidence separate

Consider a request declaring a known assistant name. Our stored evidence can distinguish the matched declaration, a published-IP comparison, a local signature result, the signature's covered components and any provider-supplied category. These answer different questions. An unavailable network lookup remains unavailable; a signature does not authenticate an unsigned name or prove a human initiated the request.

That distinction has shaped the [library's contracts and reporting](https://github.com/gkoreli/blog/blob/a85aa06c381a287dcaee8c5ed401f4d4e2c60ace/packages/analytics/README.md). Browser signals also remain signals: browser-like headers on an unlisted network do not authenticate a person. Historical classifications retain their recorded profiles instead of being silently presented as the output of today's detector.

PostHog offers a useful alternative: classification at query time. That makes current rules available over retained data. It also means, by inference, that changing those rules can change the labels reported for older events. Preserving the original decision and recomputing a current interpretation are both useful operations; an operator should know which report they are reading.

The shipped signature module supports all five public-key algorithms initially defined by [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.3). Request checks and directory-proof checks share key policy and verification. Node/Workerd comparisons cover the algorithms, and three published RFC vectors provide independent verification inputs. Transport context, request-body digest validation and nonce replay enforcement retain explicit limits; full conformance is not established. Nor do most ordinary page events arrive with a useful signature.

The core was already a dedicated package. Version 0.2 completes more of the delivery boundary: reusable caching, a small report readable without JavaScript, ordered schema upgrades and explicit cold-report admission. A separate generated project recorded six controlled page events and three daily identifiers, then returned a cache MISS followed by a byte-identical HIT. This validates the agent-operated installation/reporting path. An independent publisher's use remains unmeasured. [Package acceptance](https://github.com/gkoreli/blog/blob/69fa16915884a8318ed2ba51f3ae52df24808e64/docs/worklist/tools-product-opportunities/analytics-package-acceptance-2026-11-13.json).

The production history upgrade is now verified too. Original observations remain authoritative; precomputed reporting fields accelerate their interpretation. A reporting-rules version stamp identifies which derived fields can be reused. The November 14 migration changed that stamp on **43,320 historical rows**, preserving every other reporting value.

The checks connect that storage change to report behavior:

- All stored columns and retained evidence matched in **28 before/after original-record spot checks**, including 24 historical and four newer records. The historical samples had equal old/new interpretations; the newer samples correctly recognized the current format.
- The fixed November 6–12 UTC report retained all metrics, breakdowns and recorded profiles across **4,334 included events**. The old/new readers differed only in the label naming their own current verifier version.
- An isolated native replay of **88 retained originals** produced exactly the same **86-event report across 27 sections** from original evidence and precomputed fields. Complete reporting coverage also passed for the historical corpus and a frozen newer range.

The [production receipt](https://github.com/gkoreli/blog/blob/19d8f8971d1d74b9118c7819bfbb55aa26f7ba9d/docs/worklist/tools-product-opportunities/analytics-production-upgrade-2026-11-14.json) separates the full reporting-field comparison from the sampled original-record checks. The upgrade submitted no writes to original observations. The upgrade and all production verification used **577,811 reported reads and 129,943 indexed writes**, below review limits of 1,000,000 reads and 150,000 writes. Those measure this operation's database work, rather than cost per reader or a competitor benchmark.

Those checks demonstrate history preservation under the recorded conditions. Current and supported historical formats remain readable, and missing historical evidence stays unknown. A newer verifier does not retroactively authenticate an earlier request.

The starter also has a durable daily calculation limit and a returned-read circuit breaker for later fills; an executing query can cross the read threshold. Cache freshness is capped at one hour and UTC midnight. The blog uses the shared cache, while its optional durable admission adapter remains disabled. Shipping that adapter and enabling it at a site are separate operating decisions.

## Our advantages and the remaining gaps

| Dimension | Our shipped position | Relative position |
| --- | --- | --- |
| Signed-request evidence | Five public-key algorithms, recorded coverage and separate declaration/network/proof states | Goes beyond the [Matomo UA](https://matomo.org/faq/how-to/install-ai-chatbot-tracking/) and [PostHog UA/IP](https://posthog.com/docs/web-analytics/bot-detection) detection workflows reviewed here when a verifiable signature is present |
| Historical decisions | Recorded profiles, retained originals and a checked reporting upgrade | Explicit historical interpretation; query-time reinterpretation, as in PostHog, serves a different useful question |
| Worker reporting | A separate-project starter, shared cache, script-free report and ordered upgrades | Delivered engineering; independent operator usefulness is the next validation gap |
| Publisher outcomes | Page/referral evidence without a general campaign-to-conversion contract | Behind the goal and acquisition workflows in GA4, Matomo, Plausible and the broader product suites |
| External integrations | Typed reports and aggregate JSON, with no packaged analytics MCP service or broad SDK/account ecosystem | Behind the integration paths documented by Umami and OpenPanel |
| Observation coverage | Successful eligible pages and request-level evidence | Narrower than Cloudflare's upstream access view and Rybbit's browser/behavioral signals |

The clearest technical lead is **cryptographic evidence granularity within those reviewed workflows**. The history upgrade establishes another strength of our implementation; we have not benchmarked competitors' upgrades against it. Neither result supplies an overall detection-accuracy ranking.

Product readiness is a larger gap. We still have one database per site, no supported cross-day retention report and no independent adoption or scale result. The source is public and MIT licensed. Distribution currently uses the workspace package and a local-project generator, without an npm release or a managed analytics service.

## Compare the offer you can actually run

Edition and operating responsibility can reverse a feature comparison. Plausible's [Cloud/Community Edition comparison](https://plausible.io/self-hosted-web-analytics) excludes funnels, journeys, ecommerce revenue goals, SSO and the sites API from CE, and distinguishes advanced cloud filtering from basic community filtering. Its hosted feature list should not be copied into a claim about the free installation.

PostHog's [self-hosting documentation](https://posthog.com/docs/self-host) explicitly says self-hosted installations are unsupported. That is a material distinction from buying a managed service. For our package, the equivalent responsibility is concrete: the operator owns the Worker, D1 database, configuration, migrations and recovery.

Umami's [official read-only MCP](https://docs.umami.is/docs/faq) is another useful edition check. Its [self-hosted enablement](https://docs.umami.is/docs/environment-variables) starts at v3.4, while the [Cloud integration](https://docs.umami.is/docs/cloud/changelog) uses API subscription and website/team permissions. An agent interface is already an established integration pattern. For our existing typed JSON API, the next step is an independent client's task, explicit version/support expectations and bounded exports where needed. An MCP adapter should follow that working interface.

Privacy also depends on what is enabled. Cookie-free page collection, explicitly identified users, browser replay and request diagnostics have different data boundaries. Compare the fields and retention of the configuration you intend to run, rather than treating a product's privacy label as a complete description.

## Choose the report that supports the decision

GA4 is a strong reference for the gap between traffic classification and an outcome workflow. Its [acquisition report](https://support.google.com/analytics/answer/12923437) connects session sources and campaigns with key events and revenue when instrumented appropriately. Its [known-bot policy](https://support.google.com/analytics/answer/9888366) automatically excludes known bots, without an option to disable that exclusion or inspect its excluded total. A campaign report and a crawler ledger therefore remain different tools, even inside a broad analytics strategy.

For a practical selection:

- If the task is ordinary publishing performance, compare Plausible, GoatCounter and Umami on the metrics and operating model you need. Inspect their visit definitions and filters before comparing totals.
- For campaign outcomes, compare GA4's acquisition reports, [Matomo's goals](https://matomo.org/guide/reports/goals-and-conversions/) and [Plausible's goals](https://plausible.io/docs/goal-conversions), checking edition restrictions. For product journeys and retention, examine PostHog, OpenPanel and Umami. Our package needs more work here.
- If the task is crawler access, blocks or transfer volume, use the edge view or appropriate server logs. For configured AI request reports within a broader analytics installation, examine Matomo and PostHog's ingestion paths.
- If the task is inspecting how declarations, verification and uncertainty support a traffic label on a Worker site, our library is worth evaluating alongside products such as Rybbit. Choose an actual operator question for that evaluation, rather than counting evidence fields.

## The next build: publisher campaigns and outcomes

Portable cached reporting is delivered. The next implementation should connect a publishing choice to an acknowledged result: for example, which distribution campaigns brought served access, and which confirmed subscriptions can be traced through an explicit signup flow.

That calls for a small publisher-outcomes module, with three acceptance conditions:

1. Capture bounded, allowlisted campaign labels and a closed set of meaningful events. A confirmed subscription should come from an acknowledged server transition, with deduplication so retries do not inflate it.
2. Carry attribution only where the flow provides evidence for the relationship. Preserve unknown attribution; arbitrary query strings and invented joins across rotating daily IDs would undermine the current privacy and evidence model.
3. Give another publisher a complete task: install the package, explain a traffic change or compare a distribution choice, and select a publishing action. Record setup friction, failures, query work and what the operator could actually explain.

Served agent access remains a supported audience observation alongside later actions. A conversion does not authenticate a human or establish that an AI answer used the article. The report should keep these stages separately useful.

The operator trial can start with the shipped report; it need not wait for every outcome feature. If a different missing capability prevents the actual decision, that evidence should change the build order. This is the proposed next milestone, not an outcome already achieved.

After that, stabilize the external query/export interface around the existing typed reports, then add read-only MCP if an operator needs it. A common labelled-input comparison should guide further detector changes, including the hosting-network policy difference. Broader tenancy and more dashboard features can follow demonstrated demand. The strongest next result is a publisher making a supported decision with the system.

---

## Terms and source notes

Repository counts and external source baselines are dated November 13, 2026 Pacific. The Matomo, PostHog and Rybbit detection guides and supporting Umami integration documentation were refreshed November 14; owned production acceptance is also dated November 14. Source links pin inspected code, without implying that every hosted or released edition uses that commit. Prices, detector accuracy and same-workload operating costs were not benchmarked. [Research and claim review](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/web-analytics-comparison-ai-traffic).

| Term / reference | Meaning in this comparison |
| --- | --- |
| Event | An observation admitted by a particular collector; its eligibility matters before totals can be compared |
| Visit / session | A product-defined grouping or deduplication rule; see [GoatCounter's definition](https://www.goatcounter.com/help/sessions) and [GA4's report metrics](https://support.google.com/analytics/answer/12923437) |
| Declaration | A client-provided name or other claim; matching a known string does not authenticate the sender |
| Verification | Evidence for a particular assertion, such as covered signature components or a published address comparison; these methods have different scopes |
| HTTP Message Signatures | [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), a published protocol; coverage of algorithms and components must be stated separately |
| Web Bot Auth | The [protocol-01 Internet-Draft](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/01/), still a draft at this review; not a blanket accuracy or trust guarantee |
| MCP | An interface through which an AI application can query authorized data; its presence does not establish the quality of the application's answer |

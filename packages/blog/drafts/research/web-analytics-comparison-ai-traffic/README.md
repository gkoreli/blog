# Web analytics comparison: people, agents and outcomes

Started November 13, 2026 Pacific; revised November 14 after production reporting acceptance. [Draft](article.md); [claim review](claims.md); [November 13 repository baselines and popularity snapshot](repository-snapshot.json).

## Reader and article

Help a site operator choose what to measure and which analytics tool can observe it. Compare the tools with each other, as well as with the library behind gkoreli.com. The organizing distinction is observation stage, event/identity definition, bot-evidence policy, useful outcome workflow and operating responsibility. This is a practical comparison grounded in the owned implementation and checked primary documentation, not a benchmark or a universal ranking.

The table covers PostHog, Matomo, Plausible, Umami, Rybbit, OpenPanel, GoatCounter, GA4, Cloudflare AI Crawl Control and `@gkoreli/analytics`. Cloudflare Web Analytics is explained separately as a different collection surface. OpenPanel comes from the original shortlist; GoatCounter adds a smaller server-log-capable reference.

The earlier [industry comparison](../../../../../docs/worklist/tools-product-opportunities/analytics-industry-comparison-2026-11-13.md) is a pre-engineering snapshot. The article now uses both [package 0.2 acceptance](../../../../../docs/worklist/tools-product-opportunities/analytics-package-acceptance-2026-11-13.json) and [November 14 production acceptance](../../../../../docs/worklist/tools-product-opportunities/analytics-production-upgrade-2026-11-14.json): reusable reporting, five public-key algorithms and a completed historical reporting upgrade. The older receipt's pending-migration state remains a dated fact; the November 14 receipt supersedes that blocker.

## Method and boundaries

- Checked official product documentation and GitHub API repository metadata November 13. The frozen snapshot contains exact stars and default-branch SHAs; stars do not establish installation or adoption. November 14 refresh covers Matomo/PostHog/Rybbit detection documentation and supporting Umami FAQ, environment-variable and Cloud changelog material. The dedicated Umami MCP page was unavailable through the browsing tool in this refresh; other official documents corroborate the integration. This is not evidence of a removed feature or service outage.
- Inspected pinned request-ingestion/classification paths for Matomo, PostHog, Rybbit, Plausible and Umami, plus GoatCounter hit processing. These are source inspections, without running competitor stacks. Matomo's source baseline is `6.x-dev`; development source corroborates the mechanism but does not establish a released installation's capabilities.
- Current documentation establishes a product's stated feature and edition boundary. A default-branch source snapshot is not assumed to be the installed edition. Cost, legal compliance, accuracy, operator comprehension and overall superiority are not compared experimentally.
- Reuse the owned package's dated local/native and production acceptance. The November 14 receipt covers all 43,320 historical report-field rows, 28 unchanged original samples, a fixed 4,334-event report, full historical/newer coverage and an isolated 88-original-record native replay. No additional production SQL, provider trial, outreach or publication runs for this manuscript revision.
- The first guessed Rybbit edition URL returned unavailable. Following the official navigation resolves the page to `https://rybbit.com/docs/self-host-vs-cloud`; the unavailable attempt establishes no missing feature.

Raw author directions are preserved only in the approved private writing archive. Public records summarize decisions and evidence; they contain no source conversation. Source IDs/timestamps not supplied by the platform remain unknown.

## Editorial decisions

Working title: **Web Analytics Tools Disagree About What Counts**. Search title candidate: **Web Analytics Comparison: People, Bots and AI Traffic**. Description candidate: **Compare popular web analytics tools by the traffic they observe, the decisions they support, and the evidence behind this blog's signature and history guarantees.** These are unpublished metadata candidates, without an invented publication date or URL.

The title promises a mechanism for understanding different counts. The stage map, GoatCounter repeat-visit example, Matomo no-visit telemetry and the comparison table deliver that promise. It does not promise a measured disagreement from an identical cross-tool replay. Search queries for tool pairs and AI traffic are plausible discovery routes, not measured demand or rankings.

Rejected approaches: feature-count winner; treating all server-side products as equivalent; treating a bot label as authenticated identity; treating a complete installation as independent adoption; treating AI referrals as the exact requests or prompts that caused them. The useful ending is a concrete choice of measurement plus the owned library's remaining campaign/outcome and operator-use gaps.

The revised competitive verdict is specific: signature coverage and separated proof go beyond the particular Matomo UA and PostHog UA/IP detection workflows reviewed. History preservation is a verified property of the owned implementation, without comparative migration results. Campaigns/outcomes, integration breadth, upstream/behavioral coverage and operator adoption remain gaps. Portable cached reporting is delivered, so it is no longer proposed as the next implementation.

The next proposed build is a bounded publisher campaign/outcome contract with acknowledged events, deduplication and explicit unknown attribution. A real independent operator task can begin with the shipped starter and guide its scope. Stable external query/export support and demand-led read-only MCP follow; a labelled comparative fixture should precede accuracy claims or further policy changes. These are article recommendations, not authorization to implement another module or contact an operator.

## Status and next action

The revised manuscript remains unpublished for author review. It is about 3,800 words and adds a competitive-position table plus a concrete next-build proposal. The site's Markdown renderer produced one H1 and four semantic tables with 32 rows. Checks passed for 54 local links, eight owned source references, the production acceptance figures, code fences, JSON, scoped privacy and whitespace. Revised render and check receipts are saved in ignored `packages/blog/worklog/operations/analytics-comparison-article-20261114/`; the earlier render remains dated November 13.

The source inspection strengthened the Rybbit comparison: when filtering is disabled, its inspected ingestion path still mirrors detections into `bot_observations`. The manuscript does not confuse the documentation's absence from the bot-events view with absence of retained evidence. This is source evidence at the recorded baseline, without an installed-release or hosted-runtime claim.

Next action: author review of the manuscript's emphasis and voice. Keep publication, distribution, cross-product runtime experiments and the separate production-data approval outside this writing task. The article lives under `drafts/research/`, without a post number, publication date or public article URL. Existing retired article dispositions remain unchanged.

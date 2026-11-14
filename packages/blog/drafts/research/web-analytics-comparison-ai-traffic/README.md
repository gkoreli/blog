# Web analytics comparison: people, agents and outcomes

November 13, 2026 Pacific. Active new article direction. [Draft](article.md); [claim review](claims.md); [repository baselines and popularity snapshot](repository-snapshot.json).

## Reader and article

Help a site operator choose what to measure and which analytics tool can observe it. Compare the tools with each other, as well as with the library behind gkoreli.com. The organizing distinction is observation stage, event/identity definition, bot-evidence policy, useful outcome workflow and operating responsibility. This is a practical comparison grounded in the owned implementation and checked primary documentation, not a benchmark or a universal ranking.

The table covers PostHog, Matomo, Plausible, Umami, Rybbit, OpenPanel, GoatCounter, GA4, Cloudflare AI Crawl Control and `@gkoreli/analytics`. Cloudflare Web Analytics is explained separately as a different collection surface. OpenPanel comes from the original shortlist; GoatCounter adds a smaller server-log-capable reference.

The earlier [industry comparison](../../../../../docs/worklist/tools-product-opportunities/analytics-industry-comparison-2026-11-13.md) is a pre-engineering snapshot. The article uses [package 0.2 acceptance](../../../../../docs/worklist/tools-product-opportunities/analytics-package-acceptance-2026-11-13.json), including reusable reporting and five public-key algorithms. Its pending production-history migration remains pending; this writing task does not authorize or execute that mutation.

## Method and boundaries

- Rechecked official product documentation and GitHub API repository metadata on the recorded date. The snapshot contains exact stars and default-branch SHAs; stars do not establish installation or adoption.
- Inspected pinned request-ingestion/classification paths for Matomo, PostHog, Rybbit, Plausible and Umami, plus GoatCounter hit processing. These are source inspections, without running competitor stacks. Matomo's source baseline is `6.x-dev`; development source corroborates the mechanism but does not establish a released installation's capabilities.
- Current documentation establishes a product's stated feature and edition boundary. A default-branch source snapshot is not assumed to be the installed edition. Cost, legal compliance, accuracy, operator comprehension and overall superiority are not compared experimentally.
- Reuse the owned package's dated local/native and narrow live acceptance. No new production SQL, provider trial, outreach or publication is needed for this manuscript.
- The first guessed Rybbit edition URL returned unavailable. Following the official navigation resolves the page to `https://rybbit.com/docs/self-host-vs-cloud`; the unavailable attempt establishes no missing feature.

Raw author directions are preserved only in the approved private writing archive. Public records summarize decisions and evidence; they contain no source conversation. Source IDs/timestamps not supplied by the platform remain unknown.

## Editorial decisions

Working title: **Web Analytics Tools Disagree About What Counts**. Search title candidate: **Web Analytics Comparison: People, Bots and AI Traffic**. Description candidate: **Compare PostHog, Matomo, Plausible, Umami, Rybbit and other analytics tools by what they observe, how they handle agents and which decisions they support.** These are unpublished metadata candidates, without an invented publication date or URL.

The title promises a mechanism for understanding different counts. The stage map, GoatCounter repeat-visit example, Matomo no-visit telemetry and the comparison table deliver that promise. It does not promise a measured disagreement from an identical cross-tool replay. Search queries for tool pairs and AI traffic are plausible discovery routes, not measured demand or rankings.

Rejected approaches: feature-count winner; treating all server-side products as equivalent; treating a bot label as authenticated identity; treating a complete installation as independent adoption; treating AI referrals as the exact requests or prompts that caused them. The useful ending is a concrete choice of measurement plus the owned library's remaining campaign/outcome and operator-use gaps.

## Status and next action

Research, drafting and the claim/edition/privacy review are complete for author review. The actual Markdown renderer produces one H1 and three semantic tables with 25 rows, including all ten comparison entries, without a browser script. The manuscript is about 3,000 words. Local links, source-baseline references, code fences, normalized JSON and the scoped privacy/whitespace checks are checked before delivery; raw render output remains in ignored `packages/blog/worklog/operations/analytics-comparison-article-20261113/`.

The source inspection strengthened the Rybbit comparison: when filtering is disabled, its inspected ingestion path still mirrors detections into `bot_observations`. The manuscript does not confuse the documentation's absence from the bot-events view with absence of retained evidence. This is source evidence at the recorded baseline, without an installed-release or hosted-runtime claim.

Next action: author review of the manuscript's emphasis and voice. Keep publication, distribution, cross-product runtime experiments and the separate production-data approval outside this writing task. The article lives under `drafts/research/`, without a post number, publication date or public article URL. Existing retired article dispositions remain unchanged.

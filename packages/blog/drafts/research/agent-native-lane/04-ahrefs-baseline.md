# First Ahrefs baseline for gkoreli.com

November 4, 2026, America/Los_Angeles. Continues the reference-visibility work in [TASK-0106](../../../../../docs/tasks/TASK-0106.md) and the [Analytics Worklist](../../../../../docs/folders/FLDR-0001.md). The owner added the site to Ahrefs and asked what we could learn and extract. This is a baseline audit, not a new growth experiment or a measured improvement.

## What the account revealed

The signed-in Site Explorer overview lists DR **4.9**, approximately **1.2K backlinks**, **973 referring domains**, **0 organic keywords**, and **0 sampled AI responses**. These are Ahrefs index observations. They do not establish actual Google impressions, visits, all assistant citations, or current availability of every referring page.

The backlink report's default grouping returns **1,041 groups of links**. Keeping the target, grouping and follow type unchanged, its filter excluding known spam domains reduces that to **133 groups**. Fifty filtered rows were inspected. This comparison is about grouped provider records, not unique domains, a complete source audit, or 133 independently earned recommendations. The report was not restricted to links verified live now.

The visible unfiltered sample contains repeated backlink-service advertisements and implausible testimonials naming our domain. Ahrefs marks many of them as spam. The filtered sample supplies useful distribution and reference leads: the Glama Backlog MCP listing, other MCP directories, the known Hacker News launch, The Brutalist Report, secondary-language coverage, social-profile mirrors, and feed or article listings. Automated distribution is still supported reach at that stage. Multiple mirrors of one launch or feed should not be counted as independent recommendations.

## Which articles attract references

These counts come from the downloaded Site Audit internal-URL CSV and agree with the Best by links rows inspected in the UI. The view uses all links, rather than the separate no-spam filter. Domains can overlap across articles.

| Article | Referring domains | Backlinks |
| --- | ---: | ---: |
| [Bot detection without JavaScript](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript) | 50 | 84 |
| [AI fetcher headers](https://gkoreli.com/which-ai-fetchers-send-which-headers) | 16 | 20 |
| [First-party analytics](https://gkoreli.com/first-party-analytics-for-a-personal-blog) | 8 | 10 |
| [Backlog MCP development story](https://gkoreli.com/one-hundred-pull-requests) | 7 | 10 |
| [Linux signal-stack conflict](https://gkoreli.com/linux-signal-stack-conflict) | 5 | 6 |
| [Referrer-spam defense](https://gkoreli.com/filter-referrer-spam-without-deleting-analytics-history) | 4 | 7 |

The measured analytics work has the strongest article-level backlink counts in this snapshot. That is a useful editorial and distribution observation. It does not isolate topic, title, content quality, or the HN launch as the cause, and it does not measure demand for an unwritten article.

Ahrefs also exposes exactly what other pages link to. For example, Glama's [Backlog MCP listing](https://glama.ai/mcp/servers/gkoreli/backlog-mcp) includes the development-story link in its displayed repository README. This is directory distribution of maintainer-supplied material, not an independent review. The public page was retrieved separately to confirm that distinction.

Another lead, a Groas article, points to a different `/blog/chatgpt-claude-gemini-grok-fetcher-headers-measured` path. Ahrefs labels that target not crawled. The article could not be retrieved through the web tool, so its wording, source use, and the target's current behavior remain unchecked. Do not describe it as a verified broken citation or add a redirect without that review.

## Technical findings worth acting on

The existing crawl reports a **94 Health Score**, seven error occurrences across six URLs, 169 warning occurrences, and 136 notices. These are issue occurrences with overlapping affected URLs, not 312 independent defects.

The exported CSV has **107 distinct URL records**: 105 return 200, one redirects with 301, and one returns 404. Ahrefs classifies 70 as indexable; all 70 have matching self-canonical URLs with canonical status 200. That classification does not prove Google indexed them.

| Finding | Evidence and next action |
| --- | --- |
| License target returned 404 | The crawl found `/license` linking to `/LICENSE-CC-BY-NC-ND-4.0`. The repository's `LICENSE` contains that relative file link, and the license page renders license HTML. Review the renderer/source mapping and repair the public destination in a separate scoped change. |
| One orphan transcript | `/one-hundred-pull-requests/prompts` is indexable but has zero href inlinks in the CSV. Check the article's intended prompt-transcript relationship before adding a link or changing discoverability. |
| Four pages flagged for broken links | Includes the license page, two ghx articles, and OSS Radar #01. Some targets are external GitHub 404s; others return 403 from npm/dev.to. Verify each important source before repairing it. A crawler's 403 does not show that a resource disappeared. Historical code links may need immutable commit URLs. |
| Seven noindex URLs | The CSV identifies stats views, design-language and animation-lab pages. These are operational or demonstration routes. Their presence alone is not a defect. |
| Length and resource warnings | Title/description thresholds and redirected JavaScript are review leads. Preserve meaningful article titles, inspect the actual resource chain, and use query evidence before editorial changes. |

This audit did not run a new crawl, query D1, modify articles or runtime code, or change protection rules. No runtime repair or deployment acceptance was performed. Crawl results remain dated observations rather than independent proof of production behavior at reply time.

## What the AI score does and does not tell us

Site Audit gives **99 AI Discoverability**, **100 bot access**, and **62 machine readability**. Its current AI search-performance and freshness components are marked coming soon; the content-without-JavaScript panel has no data. The score is a technical audit result, not an observed selection rate or a probability of citation.

The sole listed AI issue is 25 pages classified as articles without Article schema. The complete affected-URL list consists of **21 prompt transcripts**, the homepage, `/oss-radar`, `/essays`, and `/license`. This is not evidence that 25 published articles lack schema. Adding Article schema indiscriminately would describe some of those pages incorrectly.

Brand Radar's unsubmitted setup uses the brand “Gkoreli” and contains “Korean skincare brands (cosmetics)” as a competitor. How that value entered the form was not observed, and the form was left unchanged. Disambiguate the author and publication with the name/domain and choose relevant comparison subjects before treating a report as evidence about this engineering publication.

## Extracts and practical use

The existing Site Audit **107-row, 33-column UTF-8 CSV** downloaded successfully. Site Explorer's backlink export instead displayed an upgrade requirement, and GSC Insights required a paid plan. No upgrade was purchased. An Ahrefs plugin was found and suggested, but no connection was confirmed; the audit used the signed-in native Chrome session. The original Brand Radar form remains intact, and a separate tab is left on the no-spam backlink report.

The [receipt](04-ahrefs-baseline.json) contains the CSV hash, reproducible counts, article totals, selected source leads, report settings, and limits. The original CSV is retained outside Git under `~/.local/share/gkoreli/research-evidence/2026-11-04-ahrefs-baseline/`. Other UI results are transcribed observations; a full backlink export and frozen UI archive were not captured.

The most useful next work is a reference ledger: referring URL, target article, anchor or cited passage, provider discovery dates, direct-check date, and whether it is original coverage, maintainer-supplied directory material, a launch listing, or syndication. Use it alongside our own access evidence, preserving the difference between an existing link, a request, and demonstrated use. First/last seen are crawler observations, not necessarily publication dates.

For search decisions, obtain a defined-window query/page export from native [Google Search Console](https://support.google.com/webmasters/answer/7576553?hl=en). Its clicks and impressions can resolve questions that Ahrefs' zero-keyword estimate cannot. No first-party query export was read here. Use the page-filtered evidence before changing titles or deciding that a subject has no audience.

This baseline extraction is complete. The license/transcript/source-link repairs, direct reference checks, first-party search analysis, and any public “Referenced by” surface remain separate work. No experiment, recurring report, or publication commitment was created.

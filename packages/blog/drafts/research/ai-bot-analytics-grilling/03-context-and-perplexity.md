# Context.dev and Perplexity: public conversion and a declined retrieval

Trials: November 4, 2026 America/Los_Angeles / November 5 UTC. Export and review completed November 5 local. This batch extends the [worklist](00-worklist.md) and [article draft](../../testing-ai-search-fetch-and-crawl-against-my-analytics.md); the earlier accepted batches remain frozen.

**Later evidence:** [November 5 URL controls](04-perplexity-url-controls.md) add the owner's further conversation and three fresh successful answers through clean/fragment URLs or an explicit fallback. The original refusal and capture below stay dated; they do not establish that Perplexity lacks retrieval capability.

## Conditions and artifacts

The owner requested Context.dev and the existing signed-in Perplexity session, then limited Context.dev to public access. Perplexity showed a Free plan, Search checked and Computer unchecked. Its default model name was not exposed. No model, account, plan, key, connector or protection setting changed.

- [Exact inputs](context-perplexity-inputs.json), [provider results](context-perplexity-results.json), [origin/storage evidence](context-perplexity-evidence.json), and [capture configuration](context-perplexity-config.json).
- [Validation receipt](context-perplexity-checks.json) and [private archive commitment](context-perplexity-archive.json). Raw requests, account UI, exact row references and SQL remain ignored and private.
- Reviewed screenshots: [Perplexity's completed refusal](assets/perplexity-answer-20261104.png) and [Context.dev's converter result](assets/context-markdown-20261105.png). These show service UI; the request/storage chain is separately verified.

One question and one conversion were submitted, each with its own assigned URL. Crawl and Map labels were reserved in the plan but never submitted. A separate unauthenticated MCP initialization tested access, without claiming an executed scrape or a discovered tool schema.

## Context.dev: an anonymous interface worked

The existing Context.dev tab was an Exa-comparison landing page. Sign in opened an unauthenticated login page. The official [MCP documentation](https://docs.context.dev/install-mcp) describes OAuth at `https://mcp.context.dev/mcp`; one credential-free `initialize` request returned HTTP 401 in 1.143 seconds, with a Bearer challenge naming protected-resource metadata and `api.read api.write` scopes. No OAuth client, key or access grant was created, and no tool call followed that gate.

The [free-tools directory](https://www.context.dev/free-tools) provided another usable route: its [URL to Markdown converter](https://www.context.dev/free-tools/url-to-markdown). One conversion of the labelled article completed without sign-in, a key or a manual CAPTCHA. The UI displayed **54,069 characters and 329 lines**. The downloaded file independently contains 54,069 Unicode characters, 54,097 UTF-8 bytes and 329 lines; its hash is in the results.

The returned Markdown includes the correct body H1, maintenance sentence and DuckAssistBot signature example. It also retains navigation, subscription content and the footer. A successful conversion therefore does not establish main-content-only extraction. No UI cache, rendering, engine or proxy option was exposed or changed, and no usage field established credits or billed cost.

The [Scrape API reference](https://docs.context.dev/api-reference/web-scraping/scrape) documents Bearer authentication, requested output formats, per-output success fields and `maxAgeMs: 0` for fresh retrieval. Those are documented controls, not the converter's measured settings. Its authenticated Search, Scrape, Map, Crawl, Answers and CLI interfaces remain untested here.

## Three requests, three declarations to interpret

The public conversion was submitted at **06:52:39.442 UTC**. Its exact assigned URL received three HTTP 200 requests:

| Time UTC | Received product declaration | Cloudflare facts | Stored receipt |
| --- | --- | --- | --- |
| 06:52:40.296 | Chrome 153, Safari compatibility token | AS5650, US, HTTP/1.1 | Browser |
| 06:52:40.368 | Chrome 157, Safari compatibility token | AS5650, US, HTTP/2 | Browser |
| 06:52:42.048 | Slackbot-LinkExpanding 1.0 | AS14618, US, HTTP/1.1 | Preview or Feed |

Both Chrome claims carry navigation Fetch Metadata, including `Sec-Fetch-User: ?1`; the Slackbot claim carries none of those fields. All three are unsigned, have no configured vendor-network checks, and have unavailable native verified-bot/signed-agent booleans. The two Browser receipts have no agent declaration; the third records the Slackbot declaration.

The unique URL and immediate timing connect the three requests to the controlled Context.dev workflow. They do not identify its internal components or establish who operated the Slackbot-claiming client. No Slack message was sent. A declared preview bot in a scraping trial is a reason to retain both the experimental assignment and the received declaration, rather than replace one with the other. The public projection normalizes product/version separators; full headers stay private.

## Perplexity: an explicit failure with a narrow absence result

The fresh Perplexity question was submitted at **06:51:54.389 UTC**. It asked for the body H1, the first maintenance sentence and the components covered by the DuckAssistBot example, with an exact labelled URL and no expected answer in the prompt.

The completed answer displayed **Finished 3s** and reported that its browsing tool returned a fetch error with no page content. It declined all three requested parts and a verified citation. Expanding the completed tool activity showed “Reading web page” with the exact assigned URL. That UI describes attempted work; it does not expose the underlying fetch error code or network path.

No exact Perplexity label appears in the stopped Worker GET capture. This is a current, bounded result, separate from September's Perplexity trials. No corresponding retained edge-security query completed, so this batch does not diagnose an edge block or rule one out.

The current [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) distinguishes PerplexityBot for search discovery from Perplexity-User for user actions and publishes separate address lists. Neither documented name appears for this assigned URL in the capture. Those docs supply expectations; they do not prove which internal path the unsuccessful answer used. Perplexity's API, MCP, CLI and Computer product remain separate untested interfaces in this batch.

## Capture, storage and operational failures

The authorized GET tail ran **06:51:36.247–06:59:36.795 UTC**, stopped at its eight-minute limit and produced 82,877 bytes. Parsing yields eleven complete invocation objects, no malformed/outside fragments and no incomplete suffix. Three exact Context.dev requests and zero nonexact probe side requests are selected. Other traffic stays private; a complete parse is not proof of platform-wide capture completeness.

Each selected invocation has one attempt and one operation-ID-matched storage acknowledgement with a unique returned reference. Native workerd/D1 preflight executes the exact three-ID SQL and confirms an integer-primary-key plan. The first Wrangler D1 metadata request failed with authentication code `10000`. A fresh constant SELECT succeeded with zero reads/writes; a metadata recheck and one exact data SELECT then succeeded. The cause of the initial error remains unknown. The owner subsequently reported signing in again and explicitly reaffirmed CLI authorization; that does not establish the cause or timing of the earlier recovery.

All three full stored receipts equal their acknowledgements, including collector/classifier versions and paths. The data query reports **six reads, zero writes and one attempt**. All three owner-exclusion flags are false. These are elicited requests, not people or organic growth.

A separate manual security-log query was rejected before execution by automatic approval review because it would directly reuse the local Wrangler OAuth credential after the authentication error. The owner reaffirmed Wrangler CLI use, without approving that distinct direct-credential route. No alternate credential route was attempted. Security evidence remains unavailable; the successful CLI row check does not fill that gap.

The converter result was saved at **06:53:05 UTC**. The subsequent browser download/export call stayed pending until **14:51 UTC**, despite a requested 25-second tool timeout. The exact blocking substep is unknown. The completed Markdown was copied then; a better-framed screenshot was saved later. Neither provider request was resubmitted, and the owned tail stopped independently at its bound. This delay is a research-tool limitation, not a measured provider processing time or eight-hour scrape.

The storage checker adds allowlisted Perplexity and Slackbot product names. Its original first-batch mode and the ChatGPT/Brave configuration are checked against saved evidence without new production reads. This batch changes no runtime classifier, deployed content, logging or protection setting.

## Next bounded work

The requested public Context.dev and signed-in Perplexity trials are complete, including the access gate and failed retrieval. Authenticated Context.dev operations would require a separately authorized account path. A retained security-event check through an approved interface could narrow the Perplexity failure; no blocker diagnosis is claimed meanwhile. The article remains unpublished.

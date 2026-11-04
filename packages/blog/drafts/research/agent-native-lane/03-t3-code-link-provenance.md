# T3 Code clone recommendation: a verified wrong link, an unresolved answer trace

November 4, 2026 UTC. Related evidence for [TASK-0132](../../../../../docs/tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md). This bounded investigation follows Goga's request to trace [Theo's report](https://x.com/theo/status/2117859423641272589) back to its information sources. It does not complete the separate Trellner exploration or citation-frequency study.

## Finding

A third-party [review of the real T3 Code](https://bmateas.com/blog/t3-code-review) currently labels a link **“official download page”** while pointing to `https://www.t33[.]codes/download`. The genuine [download page](https://t3.codes/download) is on `t3.codes`. The wrong destination was verified in the review's returned HTML, not inferred from its visible anchor text.

This supplies a concrete possible route: retrieve a favorable review of the genuine product, copy its mislabeled download link, and present the clone as official. It does not require the clone itself to outrank the genuine website. **We have not established that the reported chat retrieved this review.** The original conversation's search activity, queries, and consulted sources remain unavailable.

## What was recovered

| Evidence | Observation | Boundary |
| --- | --- | --- |
| [Original reporter's post and screenshot](https://x.com/doriandeacu/status/2117698026089185753), November 3 | The screenshot shows an answer linking an official download to a preview headed `www.t33[.]codes`. A GitHub source-repository link appears separately. | A screenshot establishes displayed behavior, not the full prompt, hidden activity, generation model, or causal source. The visible model selector is not a generation receipt. |
| [Casey James's reply and screenshot](https://x.com/MrCaseyJames/status/2117873629404737933), November 4 | A backlink-tool screenshot identifies the review and its wrong destination. It displays 55 backlinks; several visible rows have spam and nofollow labels. The review row shows DR 1.7 and estimated domain traffic 0. | These are displayed third-party measurements. We did not run an independent backlink audit. Their existence and these scores do not establish ranking influence or attacker ownership. |
| Review HTML, captured 14:38:36 UTC | Its download anchor targets the clone. Metadata declares publication July 28 and modification October 29, 2026. | Dates are publisher assertions. They do not date this particular link's insertion. |
| [Namecheap RDAP](https://rdap.namecheap.com/domain/t33.codes), captured 14:39:25 UTC | Registration: October 19, 2026, 16:19:36 UTC. Status: client hold and client transfer prohibited. | The current record does not identify the operator, explain the hold, or prove how the model acquired the address. A recent registration does not rule out an independently generated typo. |
| Current Bing HTML, captured 14:39:25 UTC | For `T3 Code download`, the genuine download page is the first displayed organic result; no clone hostname appears among the ten parsed results. | One query, time, client, and location context. It cannot reconstruct the incident or establish which search provider that chat used. |
| Current Bing HTML, captured 14:41:08 UTC | For `T3 Code review`, the review is the first displayed organic result. | Establishes discoverability in this observation, not retrieval by the reported chat. |

Two additional Bing controls were retained: `T3 Code nightly download` returned mostly unrelated T3 results, and an exact quoted clone-domain query returned unrelated fuel-station results. Their page titles and query inputs match the requested queries. These unhelpful results are not evidence of global delisting or index absence. All four captures retain their original HTML privately.

## Acquisition and timing

Direct X retrieval through the web tool failed, and local browser use was disabled. A focused public mirror recovered the thread and the Casey lead. X's official public oEmbed endpoint then confirmed the text and identities of Theo's, Dorian's, and Casey's posts. FxTwitter's public API supplied attachment URLs; the two screenshots were downloaded from X's media CDN and inspected at original resolution. This verifies their association with the reported posts, not the authenticity of the conversation represented inside a screenshot.

The review was fetched through both the web tool and a bounded Python HTTP GET. An exact-title web search also returned an older indexed rendition whose practical-tip section lacks the current download-link paragraph. That rendition is not a timestamped archive of the page and cannot date the change. The Wayback availability response for the review, requested near the time of the original report, returned no snapshot. It does not establish that no archive exists elsewhere.

The review's current HTML declares an October 29 update; Casey's screenshot displays October 31 as the backlink tool's first-seen date for its review row. Both are consistent with a link appearing before Dorian's November 3 report, but neither is an independently recovered edit history. The public `BranislavMateas/personal-website` repository inspected as a possible history source contains only a January 2022 scaffold, with no review. The public GitHub API was rate-limited. No insertion commit or earlier archived HTML was recovered.

Registry routing through `rdap.org` and the IANA-listed registry endpoint returned 403 responses; the registrar endpoint succeeded. The installed yt-dlp attempt did not recover the screenshot and instead followed a post link to the unresolved clone hostname. No program from the clone was downloaded or run.

## What this changes about the SEO explanation

The public evidence supports a wrong download recommendation and an independently verified misleading link in a discoverable review. It does **not** establish exceptional clone authority, a winning backlink strategy, prompt injection, model training contamination, or a specific search-provider failure.

The review appears to recommend Theo's genuine product. An assistant could preserve that recommendation while taking the destination from a faulty link. Product recognition, source selection, and verification of the linked operator are therefore separate things to measure. Improving our own discoverability does not by itself test the latter two.

The clone's reported malicious purpose also needs careful attribution. Theo calls it a scam; Dorian reports concern about malware. Some visible replies say its download links led to genuine GitHub releases. We did not fetch or compare installers, observe credential collection, or attribute the operator. Nothing here establishes that the review author knowingly assisted the clone, or whether the wrong link was a mistake, copied output, compromise, or deliberate placement.

## Remaining work

The next discriminating evidence is the affected conversation's expanded activity under the displayed ten-second work indicator, ideally with a share/export preserving the original prompt and linked sources. Check:

1. Whether it searched, and which queries and pages it used.
2. Whether the review or clone appeared in those results or page reads.
3. Where the clone address first entered the trace: returned URL, page hyperlink, generated answer, or earlier conversation context.
4. Whether the answer checked that destination against the official project's website or repository.

If the review is absent, keep the verified bad link as a separate finding and follow the actual sources. If no search occurred, investigate generated-address error and prior context without assuming retrieval poisoning. A model's later explanation of its choice is not a substitute for a tool trace.

For a future controlled API study, [OpenAI's web-search documentation](https://developers.openai.com/api/docs/guides/tools-web-search#sources) exposes consulted URLs through `web_search_call.action.sources`; inline citations are only a subset. A fresh API run would be a new experiment, not recovery of this ChatGPT conversation, and consulted URLs alone do not establish each source's causal influence. No paid model experiment was run here.

## Evidence retention and status

[The receipt](03-t3-code-link-provenance.json) records capture hashes, selected extracted facts, the four current-query outcomes, and missing evidence. Raw HTTP captures, screenshots, and acquisition notes are outside Git under `~/.local/share/gkoreli/research-evidence/2026-11-04-t3-code-link-provenance/`. Hashes identify the retained bytes; they do not independently authenticate all upstream claims.

The bounded public investigation verified a concrete source defect and current discoverability. **The causal trace remains open.** The next action is to obtain the affected chat's original activity or independently dated link history. No article, site change, SEO intervention, public message, or takedown report was published by this investigation.

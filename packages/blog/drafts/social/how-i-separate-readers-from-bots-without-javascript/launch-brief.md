# X launch: Bot Detection Without JavaScript

Prepared September 6, 2026 Pacific time. Scope: sharing strategy and draft thread. No post has been published and no media has been rendered.

Article: [Bot Detection Without JavaScript: What My Blog Measured](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript).

## Recommended launch

Use the [five-post thread](copy.md). Lead with the measured classification change and the unresolved counter gap. Then give readers three concrete findings: hosting-network requests can pass navigation-header checks; a reproduced HTTP parser defect had a checkable repair; a signed crawler demonstrates why identity and purpose need separate evidence.

The reader is an engineer operating a website, building analytics, or trying to understand agent access. The practical value is a method for inspecting what a counter means before calling it readership. Firsthand language identifies the author's own implementation and observations.

Keep the canonical article link in the first post so the source is immediately available. Repeat it beside the final question. Use the single #BuildInPublic tag already included. No claim is made that this layout, hashtag, or a posting hour improves algorithmic reach.

The text is complete without a media attachment. If adding native media, use the [optional measurement-loop specification](shot-list.md); it must preserve the distinction between the two collections. A link-only launch can use the article's existing preview. Check what the composer actually displays.

## How to post the thread

1. Open X's post composer and paste the first text block from [copy.md](copy.md), including its number and article URL.
2. Add checked media if available. Inspect the preview, labels, and any supported accessibility description.
3. Use the plus button to add each remaining post in order. Paste one text block per post, without the Markdown fences, file headings, or length notes.
4. Keep post 5 free of attached media. Check the final article-link preview and verify that all five posts remain within the character limit.
5. When publishing, use **Post all**, then reopen the resulting thread to check its order, copy, links, and any media playback. Record its URLs and timestamp in [metrics.md](metrics.md).

These composer steps follow [X's thread documentation](https://help.x.com/en/using-x/create-a-thread), checked September 6, 2026 Pacific time. This document prepares the copy; it does not authorize or report an external post.

Choose a time when the author can read and answer substantive replies. No current account-specific timing baseline was gathered for this copy request. Do not claim a best posting hour or a performance forecast from another article's launch.

## Evidence behind the copy

The reviewed article and artifacts are pinned here to repository revision `3d92b10b7a495ab537646b141e2dc9bbba7e20e7`. The public article URL remains unchanged. Dates below describe the measurements, not the date someone eventually posts this thread.

| Post | Claim and source | Boundary retained |
|---|---|---|
| 1 | September 4 00:00 through September 6 00:00, 2026 UTC: 372 browser-UA observations became 95 Browser HTML observations; 277/372 rounds to 74.5%. Comparable Cloudflare RUM page loads total 14. [Published measurement section at the reviewed revision](https://github.com/gkoreli/blog/blob/3d92b10b7a495ab537646b141e2dc9bbba7e20e7/packages/blog/posts/024-how-i-separate-readers-from-bots-without-javascript.md). | These are rule effects and differently collected events. Neither the remaining count nor their difference establishes readership, bots, or missing beacons. |
| 2 | Sixty cloud-classified requests in that browser-UA population passed the navigation-header combination. [Saved production follow-up](https://github.com/gkoreli/blog/blob/3d92b10b7a495ab537646b141e2dc9bbba7e20e7/packages/blog/drafts/research/readers-vs-bots/12-production-followup-2026-09-05.md). | Hosting-network classification does not identify the trigger or prove the access has no human value. |
| 3 | The twelve selected local ingestion cases changed from seven incorrect Accept results to zero. [Experiment and before/after artifacts](https://github.com/gkoreli/blog/blob/3d92b10b7a495ab537646b141e2dc9bbba7e20e7/packages/blog/drafts/research/edge-vs-rum/03-local-experiment.md). Zero quality means unacceptable under [RFC 9110 section 12.4.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.4.2). | Selected constructed requests test known cases; they do not estimate production error rates. The counter gap remains unexplained. |
| 4 | [Exa's own crawler documentation](https://crawler.exa.ai/) describes a search crawler using HTTP Message Signatures. The [Web Bot Auth draft](https://datatracker.ietf.org/doc/html/draft-meunier-webbotauth-httpsig-protocol-01#section-4.6) separates identity from delegation and related claims. | The copy describes the needed distinction; it does not claim the pending production grouping repair is already complete. |
| 5 | The article's final method covers event definitions, matched windows and units, exclusions, evidence preservation, and controlled collection tests. | The invitation asks for a reproduced mechanism. It does not claim our browser/beacon investigation has finished. |

The primary sharing value is the inspected system and its results. The article already links its research footprint and prompts; token volume is not the hook or evidence that the findings are correct.

## Publication and follow-up boundaries

Share the historical measurements as dated. The later referrer-policy article is a separate development; do not silently replace this cohort with a newer dashboard total. Repair a factual error or broken link immediately, but keep the chosen copy stable through the seven-day observation window otherwise.

The useful response is a captured counterexample, an independently reproduced collection failure, or someone applying the method. Record impressions, clicks, and reactions separately from those technical responses. [Measurement plan](metrics.md).

This launch work stays in the social directory. It does not alter article 024's prompts, frozen research footprint, body, or canonical URL.

## Draft verification

All five posts passed the 280-character check, including numbering, line breaks, the hashtag, and 23-character URL accounting: **276, 247, 247, 245, 276**. Ten relative links across the four launch documents resolve, and whitespace checks pass.

A fresh fetch of the live article confirmed the canonical URL, current sharing title, large-image card metadata, and the measurements used in the copy. The parser experiment and the linked HTTP/signature sources were checked. X's actual composer preview and any native media remain untested because this task prepares documents and copy.

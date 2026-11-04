# Groas reference: supported policy claim, broken destination

November 4, 2026. Follows the [supplied backlink analysis](05-ahrefs-backlink-analysis.md) and [TASK-0106](../../../../../docs/tasks/TASK-0106.md). Goga asked how Groas uses the research, how it found the site, and where its unusual URL leads.

## What the reference actually supports

The [Groas article](https://groas.com/post/three-quarters-of-our-ai-bot-traffic-couldn-t-be-verified) contains one link to gkoreli.com. Its anchor, **robots.txt rules may not apply**, supports a statement about OpenAI's user-triggered fetcher policy. Our [canonical study](https://gkoreli.com/which-ai-fetchers-send-which-headers) quotes that policy in its ChatGPT section and links the vendor documentation. The [primary documentation](https://developers.openai.com/api/docs/bots) still contains the policy when checked today.

This is verified secondary sourcing of vendor policy. The passage does not explicitly attribute a captured header or experimental finding to Goga. The adjacent Claude experiment links to SurfacedBy, and Groas attributes its headline statistics to its own logs. This narrows the earlier CSV lead: the surrounding text spanned two different citations. No independent validation of Groas's measurements was performed.

## Actual HTTP behavior

Direct public GET requests at approximately 15:39 UTC returned:

| URL | Status | Redirects |
| --- | ---: | --- |
| [Groas article](https://groas.com/post/three-quarters-of-our-ai-bot-traffic-couldn-t-be-verified) | 200 | None |
| [Their cited destination](https://gkoreli.com/blog/chatgpt-claude-gemini-grok-fetcher-headers-measured) | 404 | None |
| [Canonical study](https://gkoreli.com/which-ai-fetchers-send-which-headers) | 200 | None |

The cited destination serves our missing-page document. It does not redirect to the study or another website. The canonical response identifies its own URL as canonical. These are dated direct responses, not inferences from Ahrefs' not-crawled label. The web tool could not retrieve Groas or the unusual target; a standard-library HTTP client succeeded. No browser rendering was required to inspect the anchor in the response HTML.

## Origin clues and the discovery limit

The malformed path can be reproduced from our SEO title by lowercasing, removing punctuation and the conjunction *and*, hyphenating the remaining words, then adding `/blog/`. The title and the canonical filename already existed in the earliest article commit checked, `ba9028b`. A history search found no occurrence of the malformed slug in tracked posts, Worker sources or `_redirects` across local refs. This supports a title-based reconstruction as a hypothesis. It does not prove the path never existed outside that checked history or identify who generated it.

Five other cited HTML destinations were checked for an upstream link to us. Four returned 200 without one. The adjacent SurfacedBy experiment returned 404. This bounded check found no source establishing that Groas copied our malformed URL from another cited article; it cannot exclude an older version, uncited source or search excerpt.

Current searches can retrieve the canonical study and syndicated coverage. They do not reconstruct Groas's research session. Publisher metadata dates this article to November 3 and names Alexander Perelman; those are publisher assertions. We cannot establish a search engine, query, historical rank, AI model, direct read, or exact discovery route from this public evidence. No author session is identified. Production analytics were not queried: a downstream referral would not by itself establish the author's earlier discovery path.

## Decision and next action

Record this as an external reference to our policy coverage with a broken citation destination. It establishes a published source relationship, without measuring a successful visit or use of our original experimental results.

An exact-path permanent redirect from `/blog/chatgpt-claude-gemini-grok-fetcher-headers-measured` to `/which-ai-fetchers-send-which-headers` is a concrete repair candidate. It would recover this citation's destination. No redirect, runtime change or publisher message was made during this investigation. To establish how the publisher found the source, obtain its research history or ask the author; no contact was sent.

The [derived receipt](06-groas-reference-verification.json) records request timestamps, statuses, redirect hops, hashes, exact anchor mapping, history-search scope, checked neighboring sources and attribution limits. Raw HTML, parsed text, response metadata and search captures are retained outside Git under `~/.local/share/gkoreli/research-evidence/2026-11-04-groas-reference/`. The source-verification investigation is complete within these evidence limits; the discovery route and proposed redirect remain separate follow-up work.

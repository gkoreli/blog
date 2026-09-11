# First publication verified

September 10, 2026 PDT / September 11 UTC. **The first release passed the publication checks, with documented build-environment differences.** [OSS Radar #07](https://gkoreli.com/oss-radar-07-promptfoo) is served from release commit [`ccd6bc6`](https://github.com/gkoreli/blog/commit/ccd6bc6affccf1062a6e618f68ad1211edf8a148). The [machine-readable receipt](publication-verification.json) contains the response hashes, metadata, counts, deployment identity, and observation times. This receipt covers that release, before the subsequent wording and research-footprint revision.

## Deployment and method

The Cloudflare build check for this commit completed successfully at September 11, 03:11:00 UTC, with build ID `a4f0e3af-6c1c-46e0-9a02-8f5fbb8a2765`. A fresh deployment observation at 03:19:09 UTC showed deployment `e01e8770-becd-4cb3-8d5e-609cc851e8d6`, version `cfd8b234-c26f-4039-84d7-b91102a81e85`, serving 100% of traffic. The older deployment capture taken before this build was not used as release evidence.

The publication parent completed type and production-build checks in an isolated checkout. This verification compared the resulting files with eleven direct HTTPS GET responses using `gkoreli-publication-check/1.0`. Every response returned 200 without a redirect. Comparisons used the saved responses, avoiding repeated requests. No production database queries ran.

## Served artifacts

| Check | Result |
|---|---|
| Article HTML | The complete article body matches the isolated release build exactly. The source used for that build matches the release commit. |
| Article structure | One H1, 38 source cards, five tables with 4/4/4/5/11 rows, and the displayed 12-minute reading time. The local narrative count was 2,383 words including the title. |
| Markdown endpoint | Exact byte match with the release build. |
| Prompts page | All 13 prompts match the committed source after decoding HTML entities and converting the template's `<br>` elements back to newlines. The parent also verified that the original twelve prompts were unchanged. |
| Rendering assets | `main.css`, `main.js`, and `immersive.js` each match the local bytes exactly. |
| Social image | The versioned OG PNG matches exactly at 1200×600. Its complete title and branding were visually inspected and remain readable without clipping. |
| Canonical and metadata | Canonical URL, description, OG/Twitter fields, and JSON-LD match the release build. The SEO title is “Promptfoo Review: Preserving AI Citation Evidence”; publication and modification dates are September 10. |
| Discovery | `posts.json` and `sitemap.xml` match exactly. Each contains the article once; the JSON entry records 13 prompts. The OSS Radar index links to the article once. |
| RSS | The article occurs once, with the expected title, description, link, GUID, and September 10 publication date. The time-of-day difference is explained below. |

## Differences accounted for

Article, prompts, and Radar-index HTML each contain 550 additional bytes in production: 183 bytes for the Turnstile script, public site-key attribute, and challenge slot, plus 367 bytes for the Cloudflare Web Analytics script. Removing exactly those four identified additions makes each complete HTML document match the local build. The article body itself needs no normalization. The Turnstile condition is explicit in the [page shell](https://github.com/gkoreli/blog/blob/ccd6bc6affccf1062a6e618f68ad1211edf8a148/packages/blog/src/templates/page.ts) and [subscription form](https://github.com/gkoreli/blog/blob/ccd6bc6affccf1062a6e618f68ad1211edf8a148/packages/blog/src/templates/artifacts.ts).

The live RSS item uses `Thu, 10 Sep 2026 00:00:00 GMT`; the Mac build uses `Thu, 10 Sep 2026 07:00:00 GMT`. The [RSS template](https://github.com/gkoreli/blog/blob/ccd6bc6affccf1062a6e618f68ad1211edf8a148/packages/blog/src/templates/rss.ts) converts [build-local midnight](https://github.com/gkoreli/blog/blob/ccd6bc6affccf1062a6e618f68ad1211edf8a148/packages/blog/src/lib/dates.ts) to UTC. After reducing each RSS timestamp to its publication date, the complete feeds match. This is existing build-time-zone behavior; the article's nominal September 10 date is preserved. No date-generation change was made for this release.

## Limits

The native browser pipe was unavailable during publication. The [earlier desktop/mobile review](15-mobile-depth-and-motion-review.md) remains historical visual evidence; this was not a fresh live-browser review. Successful asset requests do not establish script execution, animation performance, or newsletter signup. The OG image inspection is a separate static-image check.

The published Promptfoo experiments used local HTTP servers and invented responses with version 0.122.2, including its built-in OpenRouter adapter. They did not call the OpenRouter service or a live model. This receipt verifies delivery of those findings; it does not establish live citation capture, source support, or behavior on 0.123.0. X/HN submissions remain unpublished. The later wording and footprint revision requires its own publication check.

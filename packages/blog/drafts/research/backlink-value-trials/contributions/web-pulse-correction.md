# Ready correction sheet: Web Pulse's fetcher-study copy

Prepared October 31, 2026 UTC. **Not sent or accepted.** Target: [the reproduced article](https://wpnews.pro/news/which-ai-fetchers-send-which-headers-measured-on-a-live-site). A direct public HTML response returned 200 at 15:46 UTC; SHA-256 `e06b8657ccc5ef2ad73db6a90fa57959241eb86f43dbb56d8667603abe9a7e82`. The source article's October 29 correction already exists; this contribution asks the reproduction to preserve it.

| Location and short identifying excerpt | Verified problem | Ready replacement |
| --- | --- | --- |
| Opening: “proves who it is” | Verification authenticates the covered signature base under a key; it does not authenticate unsigned User-Agent or request-target fields. | DuckAssistBot signed the captured requests with a published key. The signatures cover the hostname and Signature-Agent, leaving the method, path, query and User-Agent unsigned. |
| Grok opening: “those sixteen requests were sixteen people” | Sixteen controlled requests are not sixteen independently established people. Browser-shaped headers also do not establish a universal limit on every possible classifier. | In two controlled anonymous Grok trials, sixteen requests satisfied the site's browser-header rules. This demonstrates a limitation of those rules in that sample; it does not measure sixteen people or all Grok traffic. |
| Capture method: “A request carrying that URL can only have come from that assistant” | Assigned URL and timing support attribution; they do not independently authenticate every system that could later consume the URL. | The study associates requests with each controlled trial using its assigned URL and timing, then records declared identity, network matches and signature coverage separately. |

Primary evidence: [corrected article](https://gkoreli.com/which-ai-fetchers-send-which-headers), [20-condition cross-implementation replay](../../analytics-retrospective/96-fetcher-reference-coverage-correction.md), [closed receipt](../../analytics-retrospective/fetcher-reference-coverage.json), and [RFC 9421 §7.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1). The replay is historical proof under an explicit clock/current saved key, not a fresh vendor-behavior experiment. These replacements preserve that scope.

Suggested version note: “Reproduces the September 3, 2026 study. The original author corrected the signature-coverage and attribution wording on October 29; this copy incorporates those corrections.” Add the final clause only after the edit is actually applied.

## Cover message prepared for Goga's review

Your copy of my AI-fetcher study retains wording I corrected on October 29. I prepared three replacements above, with the source and replay evidence beside them. The important change is that the captured signature leaves the request path and User-Agent unsigned. The article URL remains the same. Would you update those passages and identify the incorporated correction date?

No new link is requested: the copy already attributes the source. This is an accuracy contribution, whose acceptance and any downstream discovery effect remain unmeasured.

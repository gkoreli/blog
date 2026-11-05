# Dimensions and reporting

Choose the dimensions relevant to the trial; do not manufacture a full factorial benchmark. Keep untested cells visible. Add a dimension when an observation changes a reader or operator decision.

| Dimension | Record or test | Interpretation boundary |
| --- | --- | --- |
| Product and role | Search index crawler, prompted fetcher, content extractor, link mapper, crawl job, research agent, browser tool | Vendor role descriptions do not establish the purpose of every request |
| Entry point | HTTP endpoint/version, exact MCP name/schema, CLI version, playground, browser chat/model | A client wrapper can change options, execution location and output |
| Access | Signed out/in, existing plan, key/OAuth presence, gated feature | One account's result is not a provider-wide availability claim |
| Discovery | Search query, domains, result count/rank, titles, source URLs, highlights | A search result does not require a contemporaneous page fetch |
| Retrieval | Assigned URL, method, cache/freshness, returned content length and truncation, status | Provider HTTP status, per-URL status and origin HTTP status differ |
| Crawl and mapping | Seeds, depth, page cap, include/exclude paths, external links, discovered versus fetched URLs, asynchronous job completion | A discovered URL is not a delivered page; a successful seed is not a completed crawl |
| Rendering and format | HTML/Markdown/JSON/PDF, JS-only element when relevant, H1/title, links/tables/code, media | Browser-shaped headers alone do not prove a particular engine or JS execution |
| Freshness | Index date, publishedDate, last-modified/crawled time, request time, cache policy | Unique query strings and “livecrawled” labels need origin evidence; dates may conflict |
| Origin behavior | First/last request, count, status, redirects, side resources, retries, ASN/country facts | One question can yield several requests; no match is capture-bounded |
| Identity evidence | Declared UA, network method/feed date, signing publisher/key/coverage/lifetime, native booleans/provenance | Keep declarations, network evidence and authentication separate |
| Analytics | Worker/collector/classifier/verifier versions, receipt, storage reference, exact row, representation, exclusions | An AI-assistant label is a classifier outcome; a readback validates storage rather than audience size |
| Calibration and repair | Controlled automation label versus stored verdict, native source for a rule change, historical profiles, storage budgets, deployment/acceptance | A detected defect supports a scoped repair, not complete provider attribution or a universal detection rate |
| Answer and citation | Expected body text, returned claim, quote fidelity, URL retention, source selection, lost caveats | Cite observed controlled use positively; don't convert one question into an organic citation rate |
| Reliability | Errors, partial output, denied access, timeout, repeat conditions, alternative explanations | One failure is an outcome under stated conditions, not a general outage |
| Cost and time | Reported credits/dollars, metered D1 reads/writes/attempts, end-to-end and provider timing | Estimated credits, billed cost and measured account deltas differ |
| Publisher controls | Documented robots/noindex/cache policies, observed responses on an authorized fixture | Documentation review is not a completed compliance test |

## Provider subsection template

Use a common outline so readers can compare providers without searching through unrelated notes:

```markdown
## Provider / product
### What we can trigger
### Search and discovery
### Fetch and extraction
### Crawl and link discovery
### Agent or research answer
### What reached Cloudflare
### Identity and signature coverage
### What analytics stored
### Answer fidelity, dates, and citations
### Cost, failures, and unanswered questions
```

Keep a subsection only when it contains a useful result, documented distinction, or concrete planned test. A provider with no research operation need not get a fictional one.

## Minimal trial record

Store the exact input privately when it contains secrets or session details; publish a reviewed version with credentials removed. Each row should name:

- Stable trial ID, provider/product/operation/interface, auth/model, deliberate-test flag.
- Submission/completion UTC times; input and source/fixture revision hashes; cache and scope parameters.
- Provider transport result, per-page/job result, returned content/source claims, reported cost and timing.
- Captured origin request count/status/header facts and parse completeness; observed collector versions.
- Attempt/ack joins, exact-row readback and full receipt equality, with separate SQL cost.
- Supported conclusion, rejected stronger claim, remaining gap, next bounded test.

Use `observed`, `primary-documented`, `reproduced`, `inference`, `proposed`, `unavailable`, and `not-tested` deliberately. Preserve the first failed attempt when a later run succeeds. Relate later evidence to earlier results rather than overwriting them.

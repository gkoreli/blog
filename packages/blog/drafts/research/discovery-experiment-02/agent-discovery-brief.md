# Agent discovery decision brief

Provenance: saved-observations. Question set: 2026-10-31.1.

Each result is agent-operated search discovery. Reviewed external references and evidence reuse are additional supported outcomes. Human identification is not a condition for counting them.

| Run | Completed questions | Failed | Missing | Tracked source | Found / completed |
| --- | --- | --- | --- | --- | --- |
| initial | 4/4 | 0 | 0 | canonical | 3/4 |
| initial | 4/4 | 0 | 0 | web-pulse | 1/4 |
| initial | 4/4 | 0 | 0 | arcjet | 1/4 |
| repeat | 4/4 | 0 | 0 | canonical | 3/4 |
| repeat | 4/4 | 0 | 0 | web-pulse | 1/4 |
| repeat | 4/4 | 0 | 0 | arcjet | 1/4 |

## initial

Method: {"service":"web.run public search","mode":"one exact query per call; no domain filter","model":null,"context":"Only the frozen question is supplied in each search request; authoring session has prior source knowledge. Search index, underlying model and personalization are unavailable.","responseSetting":"unrecorded in original saved request metadata"}

| Question | Exact query | Source presence |
| --- | --- | --- |
| headers | ChatGPT-User Accept-Language Fetch Metadata headers | canonical: found; web-pulse: found; arcjet: not-returned |
| coverage | Does DuckAssistBot Web Bot Auth signature cover User-Agent request path | canonical: found; web-pulse: not-returned; arcjet: found |
| codex | Does Codex web search fetch the original URL | canonical: found; web-pulse: not-returned; arcjet: not-returned |
| grok | Can Grok requests be distinguished from human website traffic | canonical: not-returned; web-pulse: not-returned; arcjet: not-returned |

## repeat

Method: {"service":"web.run public search","mode":"one exact query per call; no domain filter","model":null,"context":"Only the frozen question is supplied in each search request; authoring session has prior source knowledge. Search index, underlying model and personalization are unavailable.","responseSetting":"short"}

| Question | Exact query | Source presence |
| --- | --- | --- |
| headers | ChatGPT-User Accept-Language Fetch Metadata headers | canonical: found; web-pulse: found; arcjet: not-returned |
| coverage | Does DuckAssistBot Web Bot Auth signature cover User-Agent request path | canonical: found; web-pulse: not-returned; arcjet: found |
| codex | Does Codex web search fetch the original URL | canonical: found; web-pulse: not-returned; arcjet: not-returned |
| grok | Can Grok requests be distinguished from human website traffic | canonical: not-returned; web-pulse: not-returned; arcjet: not-returned |

## initial → repeat

Same declared method: false. New baseline required; transitions withheld. Inspect each run separately.

## Reviewed external references

Distinct source URLs (fragments omitted): 1; source/target pairs: 1; evidence-reuse pairs: 1; saved review observations: 1.

https://arcjet.com/learn/web-bot-auth → canonical: evidence-reuse.
- 2026-10-31T00:52:32.180Z: Prior audit of complete captured HTML verified a direct link to the canonical study and reuse of its DuckAssistBot signature capture to compare coverage. Historical reference observation; no current recapture or independent analytics installation is claimed. (capture SHA-256 6a90a9af0856bb119a68918eef8d62938f1d4a4a2a6c8986cf070fa4cf251855).

## Boundaries

- Returned search pools measure observed agent discovery, not an AI answer citation rate, complete ranking, unique people or origin visits.
- Exact registered URLs match; redirects and unregistered URL variants are not silently joined. Duplicate URLs within a pool count once for presence.
- Failed and missing observations are unavailable, not zero visibility. Completed empty pools are observed non-returns.
- Different declared methods withhold transitions and require a new baseline. Same declared method does not establish the same underlying index, model, context, page version or causal attribution. Repeated trials are not distinct audience members.
- External references and evidence reuse are supplied reviewer assessments with capture hashes; this parser does not fetch sources, authenticate captures or independently judge truth.
- References group source URLs without fragments and retain query strings and review history. Distinct retrieval URLs are not necessarily distinct pages or publishers, independent experiments, analytics installations or proof of human identity. No human label is required for observed agent discovery or external reuse.

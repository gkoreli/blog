# Sources and claim boundaries

Inspected November 5, 2026 Pacific / November 6 UTC. This ledger supports the [article](../../../posts/042-ai-site-check-evidence.md) and [ADR](../../../../../docs/adr/0020-evidence-led-ai-site-check.md). It is an editorial/source checkpoint, not deployment acceptance.

| Claim | Evidence state and source | Supports / limits |
| --- | --- | --- |
| The requested reference is a public site checker | Root recovered official X oEmbed for [the post](https://x.com/laxmankafle1995/status/2118569422554365981) and inspected linked [Exepal `/check`](https://exepal.com/check) | Public workflow: robots, discovery, rendering-related presentation, metadata and synthetic UA comparisons. Hidden implementation and scoring accuracy are unverified. Web-tool fetch of X and Exepal failed in the editorial agent; no invented independent inspection. |
| Different request evidence answers different questions | Published [provider study](../../../posts/041-ai-fetcher-browser-crawler-headers.md), especially “What arrived in the new trials”; [27-row projection](../ai-bot-analytics-grilling/provider-expansion-evidence.json) | Controlled Grok: eleven browser-shaped requests stored Browser; Dot browser/curl: verified publisher; Gemini: bare Google, Unresolved. Conditions and experimental attribution do not become production identification rules. |
| Robots matching/retrieval has meaningful semantics | Primary [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html), §§2.2–2.5 and §3, retrieved via web | Group/rule/path semantics, status distinctions and security boundary. Implementation needs corpus tests; reading the RFC does not certify a parser. |
| Crawl control differs from search exclusion | Primary [Google robots guide](https://developers.google.com/search/docs/crawling-indexing/robots/intro), retrieved via web | A blocked URL can still appear in search; blocking crawl can prevent reading page-level controls. Google-specific documentation is not every provider's behavior. |
| OpenAI products have distinct purposes and user-triggered limits | Primary [crawler docs](https://developers.openai.com/api/docs/bots), retrieved via web | GPTBot, OAI-SearchBot and ChatGPT-User distinctions; robots may not apply to user-initiated requests. A rule calculation cannot guarantee a service's actual request or answer. |
| Same-zone fetch needs explicit public routing | Primary [Cloudflare compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#global-fetch-strictly-public), retrieved via web | Flag routes through public front door rather than legacy origin bypass; deployment must actually include it. |
| Runtime public networking is a security dependency | Primary [workerd network schema](https://github.com/cloudflare/workerd/blob/main/src/workerd/server/workerd.capnp) and [maintainer explanation](https://github.com/cloudflare/workerd/discussions/1523), retrieved via web | Default public-only network filters resolved addresses. This is not proof of every deployment configuration; a preflight DNS answer is not pinning. |
| Arbitrary IP pinning is not available through resolveOverride | Primary [Cloudflare Request docs](https://developers.cloudflare.com/workers/runtime-apis/request/), retrieved via web | resolveOverride is zone-restricted. A custom general HTTP transport is not justified by this feature. |
| TCP sockets are unsuitable for the general checker | Primary [TCP sockets docs](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/), retrieved via web | Cloudflare IP ranges and private addresses are blocked; custom parser/TLS code would add cost and lose broad site coverage. |
| Initial HTML and negotiated Markdown are concrete owned representations | Inspected [build source](../../../src/pipeline/build.ts), [negotiation](../../../src/worker/negotiate.ts), existing publication guidance | Source establishes intended production; isolated build and fresh served checks must establish the actual release. No JavaScript execution is performed by the audit. |
| Ten/day shared quota with HMAC-only counter storage | Accepted design in ADR; root implementing atomic D1 policy | Accepted: final schema/code, thirty-concurrent native admission, second-day native reset and live ten-use exhaustion are recorded in the release receipt. No statement that platform logs retain nothing. |

## Rejected or deliberately unclaimed

- A copied User-Agent proves a request came from the named provider.
- HTTP 200 proves the requested article was delivered or understood.
- Sparse initial HTML proves no provider can render the page.
- Optional files guarantee ranking, citations or a universal AI-readiness score.
- A valid structured-data block establishes full schema validity or rich-result eligibility.
- A successful synthetic check establishes organic discovery or independent operator adoption.
- Separate DNS preflight eliminates rebinding or supplies connection-time address pinning.
- Green tests or a Git commit prove the current production deployment.

## Release audit

The article was checked against final paths, quota/error semantics, input restrictions, assessed fields and report limits. The dated worklist and receipt retain failures, repairs, local/native tests, source activation and fresh served results.

Final fields, paths, limits and quota semantics were compared with the released code. The [acceptance receipt](2026-11-06-acceptance.json) and [worklist](00-worklist.md) preserve the failed first audit, native repair and fresh positive checks. The fixed bot catalogue has 26 reviewed primary-source profiles; the Mistral, Parallel and Exa documents were rechecked on November 6 UTC. Exa’s additional major-search fallback remains unknown when no specific group exists. No comparison score, real-provider access or adoption result is claimed.

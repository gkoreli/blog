# First provider batch: triggers, retrieval and analytics

November 4, 2026 America/Los_Angeles; captures and API requests run November 5 UTC. This is an agent-operated controlled study against the author's publication. Codex operated the interfaces, submitted the questions, read the results and compared the stored evidence. Goga authorized the work and supplied account access; this is not a claim that he personally clicked every interface or inspected every row.

## Artifacts and method

- [Exact reviewed inputs](trial-inputs.json): nine API/MCP request bodies, browser prompts, and inspected playground configurations. Browser settings are not labelled raw wire captures. Credentials and session identifiers are omitted.
- [Provider results](provider-results.json): call timing, returned URLs, reported usage, failure states and the actual Tavily research answer.
- [Origin and storage evidence](first-batch-evidence.json): exact assigned-URL cohort, stopped-stream bounds, parse accounting, classifier/verification outcomes, native query preflight and exact-row acceptance.
- [Storage checker](check-trial-storage.mjs): prepares a private selection and primary-key SQL, runs a seeded native workerd/D1 check, then accepts only full receipt equality against the independent Wrangler readback. Run from the repository root with the blog's tsx loader. Raw captures, operation IDs, row references and SQL stay in the ignored private directory named in the worklist.
- [Actual Duck.ai answer screenshot](assets/duck-ai-answer-20261104.png): reviewed native browser capture. It shows the question, model, returned heading/sentence and source card. It does not show origin traffic, signature verification or storage.

The first raw production-tail request was rejected by automatic approval review because its bounded stream could include unrelated requests. The owner explicitly approved that scope, then separately instructed us to read relevant Cloudflare logs through Wrangler. Two bounded GET tails ran under that approval and were stopped. They contain 6 and 80 complete invocation objects, zero malformed complete frames, zero outside fragments and zero incomplete suffix bytes. Thirteen exact assigned-label requests form the storage cohort. One nonexact probe-shaped request is preserved separately; unrelated traffic remains private and excluded.

No experiment changed Worker code, logging configuration, site protection, analytics labels, public exclusions or the original articles. Ordinary requests were ingested by the existing collector. The explicit diagnostic SQL wrote no rows; that does not mean experimental ingestion produced no writes.

## Operation comparison

| Provider and interface | Operation and conditions | Provider-side result | Exact assigned-label origin evidence |
| --- | --- | --- | --- |
| Exa public MCP | `web_search_exa`; query/objective; three requested results | Original article returned with highlights; 1.180 s end-to-end | Search had no unique retrieval URL; no causal origin join attempted |
| Exa public MCP | `web_fetch_exa`; one URL, `maxCharacters: 24000` | Page content returned; 4.736 s end-to-end | One HTTP 200; ExaUser; AI Assistant; Worker signature verified |
| Exa signed-in playground | Contents; text, `maxAgeHours: 0` | One success, `source: crawled`, $0.001 reported | One HTTP 200; ExaUser; AI Assistant; Worker signature verified |
| Exa signed-in playground | Contents; fresh, one subpage, target `prompts` | Zero results; `CRAWL_TIMEOUT`, error field 504; $0 reported | No exact assigned-label match in the stopped capture |
| DuckDuckGo browser | Site-scoped search | Article returned | Before the approved tail; not observed |
| Duck.ai browser | Two exact-URL questions; GPT-6 Luna shown | Both returned the requested body H1 and sentence | First precedes tail. Second: one HTTP 200; DuckAssistBot; AI Assistant; Worker signature verified |
| Bing browser | Same search, then AI Mode | Listing and cited summary; important qualifications lost | Before the approved tail; not observed; no Bingbot trigger established |
| Tavily API | Search; basic, three results, no generated answer | Three results; 1 reported credit | No unique retrieval URL; no causal origin join attempted |
| Tavily API | Extract; one URL, basic, Markdown | One result, 52,439 content characters, zero failed URLs, 0 reported credits | Three requests for its assigned label: two Browser, one Unresolved; all unsigned/200 |
| Tavily API | Map; depth 1, breadth 2, limit 2, no external domains | Two URLs: assigned seed and canonical form; 0 reported credits | One unsigned HTTP 200, stored Browser |
| Tavily API | Crawl; same scope, basic extraction | Two result URLs with content, both 52,439 characters; 0 reported credits | Four assigned-label requests: three Browser, one Unresolved; all unsigned/200 |
| Tavily API | Research; mini, short, one narrow requested task | Pending → in progress → completed after three polls; bad answer, no sources | No exact research-label match in the stopped capture |
| Firecrawl keyless MCP | Search, then fresh Markdown Scrape | Both tool results `isError: true` despite transport HTTP 200; anonymous access unavailable | No exact MCP scrape-label match in the stopped capture |
| Firecrawl public browser | Crawl; limit 2, depth 1, fresh, no whole-site mode, Markdown | UI reports success/two results; JSON download requires an account | One exact assigned-label HTTP 200; unsigned, stored Browser |
| Firecrawl public browser | Map; limit 2, no subdomains | One visible canonical URL; full links/JSON account-gated | No exact map-label match; one modified-label request, discussed below |
| Firecrawl public browser | Scrape; fresh, 45,000 ms timeout, main content, Markdown | Result UI crashed; later recent-run history says Success | One exact assigned-label HTTP 200; unsigned, stored Browser |
| Firecrawl public browser | Search; three results, content scraping disabled | Three results, including the original article | No unique retrieval URL; no causal origin join attempted |

Counts are by assigned URL in the stopped streams. A later request can reuse a previously exposed label: one Extract-label request arrived during the subsequent Tavily operations. We do not know which internal task caused every later request. Search and canonical-URL side traffic are deliberately outside these exact-label counts.

### Request properties reported by Cloudflare

| Trial cohort | ASN / country facts | HTTP / TLS | Fetch Metadata |
| --- | --- | --- | --- |
| Exa's two retrievals | AS30058, US | HTTP/2, TLSv1.3 | Four selected fields absent |
| Duck.ai's logged question | AS8075, US | HTTP/2, TLSv1.3 | Four selected fields absent |
| Tavily's eight labelled requests | AS7029 (5), AS5650, AS6697, AS268323; US (6), BY, BR | HTTP/1.1, TLSv1.3 | Six Chrome-claiming requests: navigate/document/none and user `?1`; two others omit all four fields |
| Firecrawl browser Crawl and Scrape | AS22773, US | HTTP/2, TLSv1.3 | navigate/document/cross-site and user `?1` |

These are captured Cloudflare facts, not an independent ASN registry audit or proof that a provider operates those networks. A browser claim, navigation headers or `Sec-Fetch-User: ?1` do not establish a person or a particular browser engine. The Firecrawl browser-interface trials do not isolate a backend fetch from a UI preview or another component; assignment and timing support trial attribution at that broader boundary.

## Exa: an operation and a signer display are separate

The live default MCP schema exposed `web_search_exa` and `web_fetch_exa`. Search required `objective` alongside `query`; fetch accepted `urls` and `maxCharacters`. We queried the server directly without installing a plugin or adding a credential. Exa's [official MCP implementation](https://github.com/exa-labs/exa-mcp-server) and live schema are separate evidence sources: only the live result establishes the schema used in this run.

Both actual retrievals declared `ExaUser/1.0`, with `Signature-Agent` naming `https://exauser.crawler.exa.ai`. The captured `Signature-Input` covers `@authority` and `signature-agent`. The Worker recorded successful verification, with path/query/method/User-Agent coverage false. This batch did not independently replay those proofs.

The receipt's signer display is `Other`. [The current display catalogue](../../../../analytics/src/signers.ts) approves `https://crawler.exa.ai` as Exa but does not contain `https://exauser.crawler.exa.ai`; exact-origin lookup therefore returns Other. That explains this display outcome without asserting failed verification or treating every Exa subdomain as an approved identity. The [current crawler page](https://crawler.exa.ai/), dated November 2, distinguishes ExaSearchBot discovery/indexing from ExaUser user-requested pages. The separate ExaUser origin was inaccessible through the web reader used here; no reviewed ExaUser page content is claimed.

Search returned a September 3 publication timestamp. MCP fetch presented `Published: 2026-11-04`, and Contents returned `publishedDate: 2026-11-04T00:00:00.000Z`. The tracked article declares September 3 and `lastModified: 2026-11-01`. This is a recorded metadata discrepancy, not a diagnosis of Exa's date extraction or a claim about every result.

The failed subpage call used the same Contents API family with different scope. Its 504 is a per-URL provider error field; the Worker did not return that error for an accepted cohort request. Neither a query marker nor the UI's fresh-content selection supplies an independent proof of cache behavior. [Contents API](https://exa.ai/docs/reference/get-contents).

## DuckDuckGo and Bing: access and answer fidelity

Both normal searches returned the original article. DuckDuckGo's [result-source documentation](https://duckduckgo.com/duckduckgo-help-pages/results/sources) describes multiple sources and largely Bing-sourced traditional links; these two similar result pages are not evidence of two independent crawler trials. [DuckDuckBot](https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot) and [DuckAssistBot](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot) have distinct documented roles.

Duck.ai's second question connects an actual correct answer with one exact signed request and its row. Its proof covers authority and Signature-Agent, as in the Exa fetches. A valid proof and matching text still do not cryptographically authenticate the unsigned resource or measure a person reading it.

Bing AI Mode visibly cited the original article but described signing-directory evidence as network verification. It described the Grok sample as human visitors and generalized the tested classifier failure to server-side detection. The current article text, also present in this batch's successful content extractions, explicitly narrows those statements. The saved answer establishes these output errors; it does not expose the index version, retrieval path or synthesis cause. No fresh Bingbot request or current Copilot-chat behavior is inferred from this UI.

## Tavily: successful retrieval did not yield a sound research answer

The owner-provided key was read directly by the request process from a local environment file and used only in the Tavily Authorization header. No key was printed, entered in a prompt, committed or embedded in a URL. The signed-in Tavily API playground was inspected. Its Research button opens a separate public research UI asking for a key; this UI was inspected without entering a key or submitting a second research task.

Extract and both Crawl results contain the requested H1 and the “Maintaining this reference” sentence. Their exact returned content has equal length in this sample. Map returned the query-bearing seed and the same article without the query; two returned URLs therefore do not establish two distinct documents.

The research job completed in a reported 29.52 seconds, with no sources and no usage field. It said the H1 and requested sentence were unavailable, then claimed the DuckAssistBot signature did not cover headers beyond User-Agent. That claim is wrong for the source: the captured components are authority and Signature-Agent; User-Agent is unsigned. The failed research answer remains the accepted outcome of this attempt. Direct extraction succeeding does not prove the Research agent used that extraction, and no internal cause is assigned.

The API reported one credit for Search and zero for Extract/Map/Crawl. These are per-response fields, not independently measured account billing. Research cost remains unavailable in the returned data. Tavily documents [Research mini bounds of 4–110 credits](https://docs.tavily.com/documentation/api-credits); those bounds do not measure this job's actual consumption. [Search](https://docs.tavily.com/documentation/api-reference/endpoint/search), [Extract](https://docs.tavily.com/documentation/api-reference/endpoint/extract), [Map](https://docs.tavily.com/documentation/api-reference/endpoint/map), [Crawl](https://docs.tavily.com/documentation/api-reference/endpoint/crawl), [Research](https://docs.tavily.com/documentation/api-reference/endpoint/research).

## Firecrawl: different interfaces, different outcomes

Plugin discovery found an available, uninstalled Firecrawl plugin. No plugin was installed or granted account access. The official public MCP endpoint listed Search/Scrape/Parse schemas, but both executed calls reported anonymous access unavailable. Tool errors inside HTTP 200 responses must remain errors. [Official keyless MCP instructions](https://docs.firecrawl.dev/mcp-server/keyless) describe access as rate-limited and connection-dependent.

A subsequent protocol control initialized MCP normally, sent the initialized notification, listed tools and ran one bounded search. The server identified itself as `firecrawl-fastmcp` 3.37.0 and accepted protocol version `2025-03-26`; the notification returned 202. Search still returned the same keyless-access tool error. This control narrows the setup question without erasing the first direct-call failures or establishing why anonymous access was unavailable.

The public browser playground worked for Search, Map and Crawl in this session. Crawl reports two results; only its exact seed request is in the accepted assigned-label cohort. Map visibly returned one canonical URL. Its nearby nonexact request used `?probe=bot-grill-20261104-firecrawl-map-01/sitemap.xml` and User-Agent `undici`: the pathname remained the article path, rather than `/sitemap.xml`. Our server returned 200. We preserve that request separately instead of promoting it to an exact seed match or evidence that a sitemap was retrieved. Its internal cause is not established.

The Scrape attempt reached the origin and stored a Browser observation, while the result UI crashed with a JavaScript `join` error. Reopening the playground showed that run as Success in recent history. These stages conflict usefully: successful origin delivery and a backend success label do not establish a usable result page. We preserved the error and did not retry the scrape to erase it. Search subsequently succeeded with scraping disabled.

Firecrawl Agent and authenticated API/MCP operations remain untested. An optional request for an existing local credential file is pending; no new account, OAuth grant, purchase or security bypass occurred. [Agent documentation](https://docs.firecrawl.dev/features/agent) supplies a route for a later bounded test, not evidence that one ran.

## Exact storage acceptance

All thirteen attempts have one operation-ID-matched storage acknowledgement and one unique returned reference. A native local workerd/D1 fixture executes the exact frozen primary-key SELECT against seeded rows and verifies the query plan. Database metadata and a separate constant SELECT establish the current Wrangler access path before the one production data SELECT.

The data statement returns thirteen rows and reports **26 reads, zero writes, one attempt**. The constant SELECT reports **zero reads, zero writes, one attempt**. Every path/collector version and full projected observation receipt matches its captured acknowledgement. Stored classes: **three AI Assistant, eight Browser, two Unresolved**. All thirteen are owner-exclusion false, so the study labels them controlled traffic explicitly rather than interpreting them as organic reach.

Missing-row and changed-receipt negative controls are rejected. The first local checker invocation also rejected a nonexact sitemap-shaped label; the corrected selector retains it as a side request. A sandbox loopback denial preceded the successful native run. Both failures are retained privately. No additional production read was needed for those local corrections or controls.

Native Cloudflare `verifiedBot` and `signedAgent` booleans are unavailable in every accepted receipt; network check counts are zero. Neither fact establishes a negative native-verification result or a failed vendor-IP-list match. The source signature checks are Worker outcomes under the recorded verifier profile, not an independent verifier comparison.

## Claim audit and next decisions

| Claim | Evidence state | Supported boundary / next test |
| --- | --- | --- |
| Exa MCP fetch and API Contents use ExaUser here | Observed controlled requests | Two inputs, one account/interface pair; repeat/cache/region variation remains open |
| Exa Other means failed authentication | Rejected by receipt and code inspection | Verification succeeds; display catalogue lacks that exact publisher origin |
| Tavily extraction is recognizable from a named bot UA | Rejected in this sample | Assigned-label requests are unnamed browser claims; current classifier accepts several as Browser |
| Every Browser row represents a person | Rejected by controlled assignment | Eight known trial requests are stored Browser; not a site-wide false-positive/negative rate |
| A successful fetch ensures a sound agent answer | Rejected by these stages | Research output can lack the text or misstate evidence; internal causal paths remain unknown |
| A citation establishes a faithful summary | Rejected by Bing answer audit | Citation presence remains a supported controlled discovery outcome |
| The new batch proves organic growth | Rejected by method | Deliberate trials demonstrate access, discovery and answer behavior under stated inputs |
| All provider APIs/agents were tested | Not established | Firecrawl authenticated/Agent and on-demand Bingbot remain open, alongside repeats and fresh-body controls |

The next useful work is an authenticated Firecrawl comparison if access becomes available; otherwise one deliberately published fresh-body fixture with a value absent from prompts would test content freshness. HTML/Markdown representations, 404s, redirects, robots compliance, independent proof replay, broad repeats and organic discovery measurements remain proposed work. No background monitor is scheduled.

# ChatGPT and Brave: a fetched answer, search context and a later client

November 4, 2026 America/Los_Angeles; execution November 5 UTC. Continues the accepted [first batch](01-first-batch.md) after the owner confirms the signed-in ChatGPT tab and asks for Brave's search website and API. These additions do not refresh or replace the earlier provider results.

## Method and artifacts

- [Reviewed inputs](chatgpt-brave-inputs.json) record one ChatGPT question, one Brave Ask question, a normal Brave search, and two official API-playground requests. ChatGPT was already signed in, in Chat mode, with model label **Medium**. No hidden model ID is inferred. Brave used public website and shared-demo API access, with the credential field empty.
- [Provider results](chatgpt-brave-results.json) preserve answer checks, the bounded search result sets, UI timing fields and export limitations.
- [Origin/storage evidence](chatgpt-brave-evidence.json) records the two exact labelled GETs, phase and tracking-parameter distinctions, stopped capture, native SQL preflight and full receipt acceptance.
- [Batch configuration](chatgpt-brave-config.json) supplies the stream and assigned labels to the [storage checker](check-trial-storage.mjs). Its original no-config mode reproduces all thirteen first-batch projections and the same SQL hash; no old production query is repeated.
- [Actual ChatGPT screenshot](assets/chatgpt-answer-20261104.png) shows the public prompt, returned heading and maintenance sentence, and the beginning of its coverage explanation. The complete answer and coverage checks are separately preserved; the screenshot does not show every covered component or origin/storage verification.

The authorized GET tail ran **06:23:08.345–06:31:08.913 UTC**, stopping automatically at its eight-minute bound. Its 193,980 bytes contain 36 complete invocation objects, zero malformed frames, zero outside fragments and no incomplete suffix. Two exact assigned-label GETs are selected. Other requests remain private. A complete parse is not proof that the platform captured every possible request.

The Web Search API demo ran after this tail stopped. Search queries and API context do not have an assigned retrieval URL to join causally; this batch makes no origin-fetch claim for either API call. No site/runtime/logging setting, protection, subscription or account permission changed.

## ChatGPT: three correct requested parts

One fresh question asked ChatGPT to browse the exact query-labelled article, return its body H1 and the first sentence under “Maintaining this reference”, then identify the components covered by the article's DuckAssistBot signature example. The expected answer was absent from the prompt.

The completed answer returned the correct H1 and sentence. It named `@authority` and `signature-agent`, and correctly left path, query, method and User-Agent unsigned. These three task results match the source. Its final source link retained the probe and added `utm_source=chatgpt.com`.

At **06:23:49.716 UTC**, the assigned URL received HTTP 200 from a client declaring the documented `ChatGPT-User/1.0` string. The Worker classified it as AI Assistant. Its configured vendor-network assessment reported one listed result; the signature was absent. This is the collector's reported network outcome, with full receipt equality, rather than a new independent IP-feed validation. Native Cloudflare verified-bot/signed-agent fields remain unavailable.

[Official OpenAI documentation](https://developers.openai.com/api/docs/bots), searched and fetched for this extension, distinguishes ChatGPT-User actions from OAI-SearchBot search crawling and GPTBot training crawling. It describes possible product paths; the actual received request establishes the declaration in this trial. This browser session does not establish how every ChatGPT model, mode or account retrieves pages.

## The later Browser request is a separate observation

The completed answer snapshot was saved at **06:25:46.465 UTC**. At **06:26:12.921 UTC**, another HTTP 200 GET reached the same probe with the additional `utm_source=chatgpt.com` parameter found in the answer's source link. It claimed Chrome 156 and was stored Browser, without an agent declaration, signature or vendor-network assessment.

This later event is after the saved answer, during subsequent source inspection. It is not counted as another demonstrated ChatGPT backend fetch or as a person. The operator and service path remain unresolved: source previews, another consumer of the answer or another client are possibilities, not established causes. The observed fact is narrower: a different client used the tracking-bearing output URL after the answer had completed.

This is why the skill now asks the controller to separate answering from citation-card, preview and source-link inspection. A unique URL can connect exposure to later traffic without identifying every system that subsequently consumes it.

## Brave's website: useful discovery beyond the exact original URL

The normal site-scoped query produced twelve distinct gkoreli.com main-result URLs in the saved rendered page. It returned the analytics and classifier articles, among others, but not the canonical fetcher article in that main-result set. That is a one-query result boundary, not proof the original is absent from Brave's entire index.

An AI summary appeared separately. It named Goga Koreli and the original fetcher study, described browser-shaped agents and detection limits, and listed the analytics/classifier companion articles as sources. Related source cards also included a Vuink URL naming the original study. Those cards are distinct from the site-filtered main results; they do not establish a broken site filter.

These are observed controlled discovery and reference outcomes. A missing direct original result does not cancel the useful mention or companion-page selection. The Vuink page's body, authorship and redirect behavior were not independently checked in this extension; the card and later Ask mention remain secondary-reference observations.

## Brave Ask: explicit refusal, with a qualified secondary answer

The Ask prompt used a separate assigned URL and the same three requested parts. Its single-line input rejected the first multiline value before submission; the controller replaced the newline with a space, then submitted once. The completed answer said it could not access the exact URL and declined to report the H1 or maintenance sentence.

It mentioned a Vuink URL and supplied `@authority` and `signature-agent` from other sources, while explicitly withholding confirmation about this particular page. Those component names agree with the original example, but the requested direct-page task was not completed. The model's claim that its tools cannot fetch URLs is a statement in this answer, not a verified provider-wide capability contract.

No exact Brave Ask label appears in the stopped GET capture. We did not inspect a matching edge security event or establish that every request would be logged; no protection-block diagnosis or universal no-fetch claim follows.

## Brave's API: two real shared-demo calls

The official [playground](https://api-dashboard.search.brave.com/app/playground) offered a shared demo when the subscription-token field was empty. After Send, its verification completed automatically; no manual CAPTCHA challenge was solved. Both tested endpoints displayed HTTP 200 and returned visible results, without a personal API key, new sign-in, subscription, purchase or key creation. This establishes that demo path in this session, not lasting personal API entitlement.

| Endpoint and explicit input | Displayed result | Displayed timing / size |
| --- | --- | --- |
| `GET /res/v1/llm/context`, site-scoped query; other playground parameters left at defaults | Ten context sources with extracted chunks and source metadata | Server 1,012 ms; browser 1,286 ms; 18.1 kB |
| `GET /res/v1/web/search`, same query, `count: 3` | Three web results: analytics, classifier, and the ghx/sidecars evaluation article | Server 726 ms; browser 776 ms; 8.3 kB |

The original article's canonical URL is absent from these displayed result sets. The contexts include relevant passages from companion articles. The [LLM Context documentation](https://api-dashboard.search.brave.com/documentation/services/llm-context) distinguishes extracted grounding chunks from ordinary web result presentation. These small samples establish returned content under the recorded inputs, not a general quality or latency ranking.

Switching the endpoint reset the query to a default example; the controller re-entered the intended query and explicitly added `count: 3` before sending. Only displayed settings are claimed: no request-wire capture or hidden-default inspection occurred. The direct API's documented authentication is `X-Subscription-Token`; the shared demo handled its own credential. [Official quickstart](https://api-dashboard.search.brave.com/documentation/quickstart), [Web Search reference](https://api-dashboard.search.brave.com/api-reference/web/search/get).

The Data views contained collapsed `{n properties}` placeholders, so their saved rendered text was not complete parseable JSON. The copy-response control did not export the expected JSON through the available clipboard interface. We retain the Viewer/Data captures, displayed status/timing fields and inspected source metadata, and explicitly label them **UI evidence**, rather than manufacturing full raw responses. Billed cost and shared-key quota consumption remain unmeasured. Brave Answers API, personal-key CLI/MCP calls and freshness controls were not tested.

## A named Brave bot is not an expectation

Brave's [crawler documentation](https://safe.search.brave.com/help/brave-search-crawler) says its crawler does not advertise a differentiated User-Agent. That is a material difference from vendors that document distinct crawler and user-fetcher tokens. It is not evidence that either selected ChatGPT-labelled request came from Brave, and we do not invent a Bravebot declaration to make the classifier recognize it.

## Storage and checks

Both labelled invocations have one attempt, one operation-ID-matched acknowledgement and a unique returned reference. Native local workerd/D1 preflight executes the exact two-ID query and confirms its primary-key plan. A fresh Wrangler metadata/constant-access sequence and one data SELECT return both exact rows, with **four reads, zero writes and one attempt** for the data query. The constant SELECT reports zero reads/writes and one attempt.

Both full receipt projections, paths and collector versions equal their acknowledgements. The stored labels are one AI Assistant and one Browser; owner-exclusion is false for both. Only the former has the ChatGPT-User declaration and positive recorded network assessment. The later Browser observation retains unresolved operator attribution.

A citation-popover inspection stalled for 300 seconds and the browser bindings were subsequently recovered. Neither service question was resubmitted. The bounded tail stopped independently, and the saved answer/API views preceded that interruption. The stall and incomplete response exports are research-tool limitations, separate from provider errors.

The optional batch configuration preserves the first batch's thirteen event projections, stopped-stream facts and SQL hash under its original invocation. Missing-row, changed-receipt and invalid-config controls are recorded in the extension's checks. No broad production census, extra traffic generation, classifier change or independent signature replay was required.

## Next bounded questions

Brave's context metadata option could expose a content-fetch timestamp, and a newly published body value absent from the prompt could test freshness more directly. A personal-key API repeat would test account access and retain a more direct export path. Those remain proposals. This extension completes the requested ChatGPT/Brave trials and updates the unpublished article and provider skill; the earlier Firecrawl account-dependent gap remains separate.

# November 5: provider expansion and analytics hardening

The owner expanded the investigation to Grok, Claude Free, ChatGPT Dot's browser and HTTP tools, authenticated Context.dev, Gemini, and the analytics implementation itself. This continues the [previous batches](00-worklist.md); it does not replace their dated outcomes. The article remains unpublished.

[Reviewed inputs](provider-expansion-inputs.json), [service results](provider-expansion-results.json), [request/storage evidence](provider-expansion-evidence.json) and [decision](../../../../../docs/adr/0016.20-provider-method-updates-and-receipt-display-provenance.md) keep the operations and resulting changes inspectable. Raw account UI, credentials, headers, request references and SQL remain in ignored private storage.

## Conditions and execution

November 5 UTC. Grok was signed in, Fast; Claude was Free, Chat / Sonnet 5.5 Medium; Dot was Work / GPT-6.1 Sol Light (2/6); Gemini showed Pro. These are visible labels, not inferred model IDs. Each submitted prompt excluded the expected answer and used its own URL label. Completed answers were saved before source inspection. UI saved-at timestamps are capture times, not precise provider latency.

Three nonoverlapping tails were bounded to 600, 600 and 180 seconds, each with a 16 MiB ceiling. All stopped independently. They contain 62 + 63 + 5 complete objects, no malformed frames, outside fragments or suffix. This does not establish complete collection. Twenty-seven exact labelled page requests join attempt → acknowledgement → exact D1 row; a separate actual sitemap XML request has no page acknowledgement and is deliberately excluded from that page-row assertion.

## Provider outcomes

### Grok

One submitted signed-in Fast question returned the correct H1, exact maintenance sentence and signature coverage, reporting the labelled source. Eleven HTTP 200 requests for that label claimed Chrome 142/143 or Safari. All were unsigned, had no named vendor declaration, and were stored Browser. ASNs: 3257, 212238, 7979, 210906, 273335, 269348, 267708 and 9009. This sample supplies known automation context through experimental assignment; headers alone cannot label unrelated traffic Grok. Account state does not establish the cause of this route.

### Claude

One Free-plan question returned the correct H1 and coverage. The maintenance sentence was explicitly paraphrased; it is not an exact-quote success. One HTTP 200 request declared Claude-User/1.0 on AS396982 and was stored AI Assistant, unsigned, with no configured vendor-IP check under the old profile.

The current [classic-bot feed](https://claude.com/crawling/bots.json), independently fetched November 5, contained 14 IPv4 prefixes and did not list the captured address. Anthropic's [robot documentation](https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) supports positive identification on listed addresses; nonmembership does not prove impersonation. Its [hosted-browser documentation](https://support.claude.com/en/articles/18234133-how-do-anthropic-hosted-browsers-identify-themselves-when-they-browse-the-web-on-a-user-s-behalf) separately specifies Claude-Agent and a SAIL file. That browser product was not exercised by this Free-plan question.

### ChatGPT Dot

The first Work prompt requested two paths. Cloud Chrome rendered the browser label, with correct H1 and maintenance sentence. The model reported connected-browser access unavailable and used its cloud browser; the visible activity showed that browser. The labelled web-open operation returned a tool accessibility error, while its disclosed canonical-URL control returned the requested content. No labelled fetch hit appeared.

A distinct ordinary-HTTP follow-up used curl and disclosed two GETs after initial output truncation. Both received HTTP 200. The logs agree on two curl/8.5.0 requests. Together with the Chrome 155 request, all three came through AS13335, carried locally verified signatures naming `https://chatgpt.com`, and were stored Signed Agent with display Other. They cover authority, method and Signature-Agent, leaving path, query and User-Agent unsigned.

Independent local replay of all three captured proofs succeeded using the later native HTTPS directory snapshot and each capture's timestamp. Changing method or authority rejected; changing path, query and User-Agent together still verified. These local mutations are synthetic controls, not additional provider requests or proof of replay prevention.

### Gemini

The first Pro answer returned the correct H1 and maintenance sentence, disclosed Google Search/base-URL use and omitted the covered-component pair. No initial exact-label match appeared. Its explanation that the query URL was not individually indexed is an unverified model explanation.

The coverage follow-up correctly named `@authority` and `signature-agent`. It reported a labelled browsing fetch, extraction truncation, then Google Search/base-URL fallback. One labelled HTTP 200 request arrived on AS15169 with the entire User-Agent `Google`, no signature or named declaration, and stored Unresolved. Experimental assignment identifies this trial; the bare word plus Google network does not establish a documented Gemini client. Literal `[3.2.1]` answer markers were not validated clickable source citations.

### Context.dev

The signed-in Free dashboard showed 300 credits per month and two concurrent requests. The bounded plan allowed at most 20 reported credits, one existing Default key, no new key or OAuth grant. The key was held in a temporary mode-0600 file and removed after the calls.

| Operation | Conditions | Service result | Reported credits |
| --- | --- | --- | --- |
| UI Scrape | HTML + Markdown, cache off (`maxAgeMs: 0`), main-content-only off | Both formats; displayed 1.5 seconds | 1 |
| REST Scrape | Markdown, `maxAgeMs: 0` | 54,073 Markdown characters, correct requested section | 1 |
| REST Search | Site query, three results, no content/highlights | Includes original article and two companions | 1 |
| REST Map | Three URLs, explicit labelled sitemap | Root, essays and engineering URLs | 1 |
| REST Crawl | Two pages, depth one, same article family, main content only, fresh | Seed article + prompts, two succeeded, 14 skipped | 2 |
| REST Answers | Fast, exact source task and JSON example | Correct H1; wrong requested section sentence; incomplete unsigned-component list, despite cited source | 10 |
| CLI Search | Official v1.24.0 macos_arm64, same three-result query | Exit 0, same three URLs | 1 |
| MCP web-scrape | Full response, Markdown, `maxAgeMs: 0` | HTTP 200, no tool error; 54,073 characters; cache miss age zero | Unavailable in response |

Seventeen credits are explicitly reported across UI, REST and CLI. MCP usage is unavailable; do not invent a precise final balance. Single local end-to-end timings are in the structured results and are not provider-speed benchmarks. The CLI release was verified against both its GitHub asset digest and published checksums; actual help has no Scrape or Map command. MCP initialization and tools/list succeeded with the existing key and exposed 50 tools. Full mode avoided the documented compact clipping.

An initial credential capture selected only the displayed prefix, causing HTTP 401 / NOT_FOUND. Correcting the capture to the complete existing key made the planned request succeed. This is a retained operator error, not evidence that the API plan lacked access. UI Copy JSON did not produce an accepted validated full export; raw REST responses were captured separately. The Context UI screenshot contains a masked key prefix and is excluded from public assets.

The eleven labelled page requests across UI Scrape, REST Scrape/Crawl/Answers and MCP were ten Browser and one Cloud Browser. The Cloud Browser was Chrome 125 on AS396982 during Answers; other requests claimed Chrome 153/157, mainly AS5650, with one MCP request on AS20012. All were unsigned with no named declaration. The sitemap request was an origin delivery, not a page view. The crawl response separately returns the unlabelled `/prompts` child; it is not included in the exact seed-label row cohort.

## Header observation boundary

The [selected header profiles](provider-expansion-headers.json) preserve Accept, language-header presence, Fetch Metadata and compression metadata per labelled workflow, with variant counts. All Worker headers showed gzip/Brotli; Cloudflare's separate original-encoding metadata varied or was unavailable. Cloudflare [documents this replacement boundary](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties). These fields are not an untouched client packet capture and do not identify a provider.

## Storage and method changes

The original 27-row selection cost 54 D1 reads, zero writes and one data-statement attempt. A native local workerd/D1 fixture proved the primary-key plan first. Initial Wrangler metadata returned authentication error 10000; existing-account metadata and a zero-read constant query succeeded, followed by metadata recheck and one successful exact SELECT. No cause is inferred for the earlier error.

Counts under the captured old classifier: 21 Browser, three Signed Agent, one AI Assistant, one Cloud Browser and one Unresolved. All owner-exclusion flags were false. These deliberately elicited requests do not measure organic growth or people. Native Cloudflare verified-bot/signed-agent booleans were unavailable. No new retained edge-security lookup succeeded; the earlier rejected direct-OAuth route was not retried.

Source `05f5548` implements exact ChatGPT/ExaUser public names, retained display provenance for verified publishers, separate ExaUser signing/directory methods, the Anthropic classic-bot feed, the declared Claude-Agent role and prospective Servers.com AS7979 hosting evidence. Old migrations and row classifications remain intact. The verifier implementation/profile is unchanged. Historical receipt replay uses each acknowledgement's externally recorded display profile; all 46 receipts across five saved cohorts still match with zero additional production reads.

Local checks: 397 analytics tests, 185 blog tests, workspace types, 30 Markdown validations, schema/minimal-Worker portability and isolated production build (41 posts) pass. Earlier attempts that exceeded a JSON budget were corrected before delivery; the existing 2 KiB caps and complete closed reason/product evidence remain protected by tests.

## Activation and acceptance

The pushed source and an isolated build are distinct from activation. Wrangler reported a new 100% activation at 16:11:25 UTC. A separate four-minute private capture was started before fresh Dot, Claude and Exa controls. Their service responses completed: Dot disclosed exactly one curl GET, Claude reported one successful labelled fetch, and signed-in Exa Contents returned one livecrawled result with a 1,200-character cap, requested `maxAgeHours: 0` and subpages off. A direct Exa MCP control had first failed initialization with HTTP 403; no MCP fetch ran, and the playground control has a different label/interface.

The [release acceptance](provider-hardening-release.json) joins all three fresh page requests to the 100% active Worker version and exact stored rows. Full receipts match for six D1 reads, zero writes and one data-statement attempt; the separate constant check used zero reads/writes. Dot is Signed Agent / ChatGPT, with the new display profile independently present in stored signature evidence. ExaUser is AI Assistant / Exa, with matching documented signing origin and reviewed publisher; its new display profile is also retained. Claude-User stays AI Assistant, with an actual `anthropic-bots: not-listed` outcome. Native booleans remain unavailable.

The acceptance stream stopped at its four-minute bound. A separate public main.js read for native client source metadata returned HTTP 403; no served-asset source/build-ID match is claimed. Exact Worker version, new collector profiles and accepted behavior are the measured runtime basis. These three controls are separate from the original 27-row cohort and local synthetic mutations.

# Crawler Classifier Audit

**Status:** Working research artifact  
**Audited:** 2026-08-24  
**Scope:** `packages/analytics` visitor classification and the blog's client-side analytics event, checked against the current official crawler guidance from OpenAI, Anthropic, Perplexity, and Google.  
**Method:** Read-only source audit plus primary-source verification. No traffic claims in this document are inferred from third-party crawler lists.

## Result

The current analytics cannot answer whether an AI crawler fetched the blog, `llms.txt`, or a Markdown endpoint.

There are two separate problems:

1. The classifier groups agents by an undifferentiated `AI` visitor type, erasing whether a request was for search indexing, model training, or a single user's request.
2. The classifier runs on a client-side beacon POST, not on the original resource request. Ordinary crawlers that fetch static content without executing JavaScript never reach it.

The public `ai_fetches` number is therefore not a count of AI fetches. It is a count of page-view beacon events whose POST user agent matched the current AI regex.

## What the Current System Measures

The generated page runs this client-side request after the HTML loads:

```ts
fetch('/api/event', {
  method: 'POST',
  keepalive: true,
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({
    path: location.pathname,
    referrer: document.referrer || undefined,
  }),
})
```

Relevant implementation paths:

- `packages/blog/src/templates/page.ts` injects the JavaScript beacon.
- `packages/analytics/src/index.ts` classifies the user agent on `POST /api/event`.
- `packages/analytics/src/classify.ts` reduces the result to `Human`, `Bot`, or `AI`.
- `packages/analytics/src/stats.ts` labels the count of `visitor_type = 2` page-view rows as `ai_fetches`.

That flow does **not** observe the original GET for the page or text resource.

### What is invisible

- A crawler that fetches an HTML article without running its JavaScript.
- Any direct request for `/llms.txt` or `/llms-full.txt`; those are plain-text resources with no beacon.
- Any direct request for a post's `.md` endpoint; it is Markdown with no beacon.
- A command-line agent or retrieval tool that reads the response body but does not execute browser JavaScript.
- The distinction between the HTML that caused a beacon and any other resources the same agent may have fetched.

A render-capable crawler might execute the beacon. That would still prove only that an AI-looking user agent sent the analytics POST. It would not turn the event into a complete server access log or prove that the content was indexed, used, cited, or shown to a user.

## Provider Matrix

The table compares current official provider documentation with the classifier as it existed on 2026-08-24.

| Provider | Official identifier | Provider-described purpose | Current classification | Audit finding |
|---|---|---|---|---|
| OpenAI | `OAI-SearchBot` | Automatic search crawler used to surface websites in ChatGPT search results | `Bot` | Missing from `AI_CRAWLERS`; caught only by generic `bot`/`search` patterns |
| OpenAI | `GPTBot` | Crawls content that may be used to improve and train generative AI foundation models | `AI` | Identifier is found, but its training purpose is erased |
| OpenAI | `ChatGPT-User` | Visits pages for certain user actions in ChatGPT and Custom GPTs; not automatic web crawling | `AI` | Found only through the broad substring `ChatGPT`; conflated with crawlers |
| OpenAI | `OAI-AdsBot` | Validates submitted ChatGPT ad landing pages; not a training crawler | `Bot` | Outside the current AI regex; should be explicit if request-purpose reporting is added |
| Anthropic | `Claude-SearchBot` | Navigates the web to improve the relevance and accuracy of search responses | `Bot` | Missing from `AI_CRAWLERS`; caught only by generic bot/search patterns |
| Anthropic | `ClaudeBot` | Collects public-web content that may contribute to model training | `AI` | Identifier is found, but its training purpose is erased |
| Anthropic | `Claude-User` | Retrieves content at a Claude user's direction | `Human` | Missing from both regexes |
| Perplexity | `PerplexityBot` | Indexes content to surface and link websites in Perplexity search results; not used for foundation-model training | `AI` | Identifier is found, but its search purpose is erased |
| Perplexity | `Perplexity-User` | Fetches a page in response to a user action; not automatic crawling or model training | `Human` | Missing from both regexes |
| Google | `Googlebot` | Crawls for Google Search and related Search features | `Bot` | Reasonable generic result, but not represented as a search crawler |
| Google | `GoogleOther` | Generic crawler used by different Google product teams, including one-off research and development | `AI` | Incorrectly treated as AI-specific |
| Google | `Google-CloudVertexBot` | Performs site-owner-requested crawls for Vertex AI Agents; has no effect on Google Search | `AI` | AI association is plausible, but the site-owner-directed purpose is erased |
| Google | `Google-Extended` | `robots.txt` control token for specified Gemini training and grounding uses of content crawled with existing Google user agents | Not observable | It has no separate HTTP user-agent string and cannot be classified from request UA data |

### Stale or overly broad identifiers

- `Claude-Web` is in the current regex but is not one of the three agents in Anthropic's current official crawler guidance. Keep it only if historical-log compatibility is intentional; do not present it as a current official agent without separate evidence.
- The `ChatGPT` substring is broader than the official `ChatGPT-User` token. Exact identifiers make the evidence easier to explain and reduce accidental matches.
- `GoogleOther` must not be treated as proof of AI retrieval. Google explicitly describes it as a generic crawler with no single product association.
- `Google-Extended` must not be added to the request regex. Google states that it is a control token rather than an HTTP user agent.

The broader `AI_CRAWLERS` list also mixes common web crawlers, training crawlers, product-specific agents, and robots control tokens. This audit does not make claims about providers outside the requested OpenAI, Anthropic, Perplexity, and Google scope, but the same purpose-first review should be applied before using the list for public reporting.

## The Category Error

`AI` is a property of the company or system behind a request. It is not a request purpose.

These events answer different questions:

| Event | Question it can help answer |
|---|---|
| Search crawler request | Did a provider fetch a resource for a search or answer index? |
| Training crawler request | Did a provider fetch a resource under its potential model-training policy? |
| User-directed fetch | Did an assistant retrieve a resource for a particular user action? |
| Human referral from a chat product | Did a person click through from an answer or chat surface? |

Combining them into `AI` produces a large-looking number with little explanatory value. It also makes a crawler request easy to misstate as a reader, referral, citation, or model use.

## Chat Referral Is a Separate Event

OpenAI's publisher guidance says ChatGPT adds `utm_source=chatgpt.com` to referral URLs. That is evidence of a person arriving through a ChatGPT link, not evidence that an OpenAI crawler fetched the page.

The current beacon sends `location.pathname`, so it discards the query string and the documented UTM signal. It may still receive `document.referrer`, but that signal should not be combined with crawler classification.

For privacy-preserving attribution, capture only a sanitized source label:

1. Read a bounded `utm_source` value from the landing URL.
2. Fall back to the referrer hostname.
3. Do not store the full query string, user query, chat text, or full referring URL.

## Proposed Replacement Model

Keep browser page views separate from server-observed resource requests.

```ts
type ActorClass =
  | 'human_browser'
  | 'search_crawler'
  | 'training_crawler'
  | 'user_directed_fetcher'
  | 'site_owner_directed_fetcher'
  | 'other_bot'
  | 'unknown';

type Verification =
  | 'verified'
  | 'claimed'
  | 'not_available';

type Provider =
  | 'openai'
  | 'anthropic'
  | 'perplexity'
  | 'google'
  | 'other';

interface ResourceRequest {
  path: string;
  resourceKind: 'html' | 'markdown' | 'llms' | 'sitemap' | 'other';
  provider: Provider;
  agent: string;
  actorClass: Exclude<ActorClass, 'human_browser'>;
  verification: Verification;
  method: 'GET' | 'HEAD';
  status: number;
  createdAt: string;
}

interface BrowserPageView {
  path: string;
  referrerHost: string | null;
  attributionSource: string | null;
  createdAt: string;
}
```

This is a logical schema, not an instruction to log every human request. A minimal implementation can record known bot/fetcher requests at server or edge ingress while retaining the existing cookieless browser page-view table for humans.

### Exact purpose mappings

```text
OAI-SearchBot         -> openai     / search_crawler
GPTBot                -> openai     / training_crawler
ChatGPT-User          -> openai     / user_directed_fetcher
OAI-AdsBot            -> openai     / other_bot (ad_validation)

Claude-SearchBot      -> anthropic  / search_crawler
ClaudeBot             -> anthropic  / training_crawler
Claude-User           -> anthropic  / user_directed_fetcher

PerplexityBot         -> perplexity / search_crawler
Perplexity-User       -> perplexity / user_directed_fetcher

Googlebot             -> google     / search_crawler
Google-CloudVertexBot -> google     / site_owner_directed_fetcher
GoogleOther           -> google     / other_bot
```

Do not create a request mapping for `Google-Extended`: it is not an HTTP user-agent identifier.

### Metrics that should remain separate

- Search crawler requests
- Training crawler requests
- User-directed fetches
- Site-owner-directed agent fetches
- Other or unknown bot requests
- Human page views referred by ChatGPT or another assistant

None of these counts proves that a provider indexed the page, selected it for an answer, cited it, or caused a human visit. Each label should say only what the observed event supports.

## Verification Caveat

User-agent strings are claims made by the request and can be spoofed. A regex can identify the claimed agent, not authenticate it.

The proposed `verification` field preserves this distinction:

- `verified`: the source matched a current provider-published IP range, reverse-DNS procedure, or an equivalent trustworthy edge verification signal.
- `claimed`: the user-agent token matched, but origin verification was not performed or failed.
- `not_available`: the provider does not supply a practical verification mechanism for the observed request.

Current official verification options:

- OpenAI publishes separate IP-range files for `OAI-SearchBot`, `GPTBot`, `ChatGPT-User`, and `OAI-AdsBot` from its crawler documentation.
- Anthropic's crawler guidance links a current source-IP list and says an address on that list indicates the crawler comes from Anthropic.
- Perplexity publishes separate IP-range files for `PerplexityBot` and `Perplexity-User` and recommends combining user-agent and IP checks.
- Google publishes crawler and fetcher IP ranges plus a forward-and-reverse DNS verification procedure.

Verification establishes who made a request. It still does not establish what the provider later did with the response.

## Minimal Honest Rename Before a Full Fix

If server-side request observation is not implemented immediately, rename the existing public metric from `ai_fetches` to something like `ai_beacon_events` and add a note that it counts client analytics events with matching user agents.

That would correct the claim without pretending the current system can measure crawler GETs.

## Primary Sources

All sources below were accessed on 2026-08-24.

| Source | Why it is used | URL |
|---|---|---|
| OpenAI, “Overview of OpenAI Crawlers” | Official purposes, user-agent strings, robots behavior, and published IP sources for `OAI-SearchBot`, `GPTBot`, `ChatGPT-User`, and `OAI-AdsBot` | https://developers.openai.com/api/docs/bots |
| OpenAI, “Publishers and Developers — FAQ” | Official Search inclusion guidance and the `utm_source=chatgpt.com` referral signal | https://help.openai.com/en/articles/12627856-publishers-and-developers-faq |
| Anthropic, “Does Anthropic crawl data from the web, and how can site owners block the crawler?” | Official separation of `ClaudeBot`, `Claude-SearchBot`, and `Claude-User`; source-IP verification link | https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler |
| Perplexity, “Perplexity Crawlers” | Official purposes, user-agent strings, robots behavior, and IP ranges for `PerplexityBot` and `Perplexity-User` | https://docs.perplexity.ai/docs/resources/perplexity-crawlers |
| Google, “Google's common crawlers” | Official purposes for `Googlebot`, `GoogleOther`, `Google-CloudVertexBot`, and the non-UA nature of `Google-Extended` | https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers |
| Google, “Verify requests from Google crawlers and fetchers” | Official IP-range and forward/reverse-DNS verification process | https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests |

## Article-Level Distillation

The blog did not merely lack a few crawler names. It was asking a client-side page-view system to answer a server-side retrieval question.

That is a stronger and more useful finding than “add more regexes.” The honest sequence is:

1. Observe the right event: the resource request.
2. Classify its purpose: search, training, user-directed, or other.
3. Verify the claimed provider where possible.
4. Keep human chat referrals separate.
5. Never turn a request count into a claim about indexing, citation, answer selection, or readership.

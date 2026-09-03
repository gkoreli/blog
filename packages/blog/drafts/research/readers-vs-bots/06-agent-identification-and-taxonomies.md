# Agent identification, agent User-Agents, headless fingerprints, and reader taxonomies

Research worker: Claude opus, primary sources plus live probes of well-known URLs and one local headless-Chrome experiment, 2026-09-02/03. Every claim carries a URL in the worker's report; this artifact keeps the facts and the URLs that matter for engineering. Full report preserved in the session transcript; re-run the probes before building.

## 1. Web Bot Auth: now an IETF working group

- IETF WG `webbotauth`, charter explicitly includes "AI agents retrieving or interacting with content on behalf of end users". https://datatracker.ietf.org/wg/webbotauth/about/
- Live document: `draft-ietf-webbotauth-httpsig-protocol-00`, "HTTP Message Signatures for automated traffic", Meunier (Cloudflare) and Major (Google), dated 2026-09-01, Standards Track. The directory draft was folded into it. https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/
- Wire format: `Signature`, `Signature-Input` (with mandatory `tag="web-bot-auth"`, `created`, `expires`, `keyid` = JWK SHA-256 thumbprint), `Signature-Agent: sig="https://signer.example.com"`. Must cover `@authority` or `@target-uri` and the `Signature-Agent` member.
- Verification: fetch `/.well-known/http-message-signatures-directory` on the Signature-Agent host (JWKS, `application/http-message-signatures-directory+json`), resolve `keyid`, verify per RFC 9421, check `created`/`expires`. "Key lookup MUST be keyed on the (URL, key) pair, not on the key alone."
- Who serves a directory (probed 2026-09-02, HTTP 200 with Ed25519 keys): OpenAI `https://chatgpt.com` (purpose "ai"; documented for ChatGPT agent's cloud browser, https://help.openai.com/en/articles/11845367-chatgpt-agent-allowlisting); Google `https://agent.bot.goog` (https://developers.google.com/crawling/docs/crawlers-fetchers/google-agent); Meta `https://meta.com` (undocumented); Browserbase (opt-in beta, purpose "rag"); You.com; Cloudflare Browser Rendering (signs by default, non-removable, https://developers.cloudflare.com/browser-rendering/reference/automatic-request-headers/). Cloudflare's 2025-08-28 cohort: ChatGPT agent, Goose (Block), Browserbase, Anchor Browser. https://blog.cloudflare.com/signed-agents/
- No directory found for Anthropic (anthropic.com, claude.ai, claude.com), Perplexity, Vercel, Steel, Anchor, Microsoft, Apple, Amazon.
- Feasible on a free Worker: `crypto.subtle` supports `Ed25519`; Cloudflare's Apache-2.0 reference `web-bot-auth` npm package includes a Workers verification example (https://github.com/cloudflare/web-bot-auth); cache the JWKS. No Bot Management needed: the origin verifies the signature itself. https://developers.cloudflare.com/workers/runtime-apis/web-crypto/

## 2. Vendor-documented agent and crawler User-Agents

On-demand, user-initiated fetchers (the audience to embrace): ChatGPT-User (full UA published, IPs https://openai.com/chatgpt-user.json, https://developers.openai.com/api/docs/bots); Claude-User (token only, combined IP file https://claude.com/crawling/bots.json, https://support.claude.com/en/articles/8896518); Perplexity-User (https://docs.perplexity.ai/guides/bots, IPs https://www.perplexity.com/perplexity-user.json); Meta-ExternalFetcher (`meta-externalfetcher/1.1`, "fetches individual links at a user's request", no IP list, https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/); MistralAI-User (https://docs.mistral.ai/robots); DuckAssistBot (https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot/); Amzn-User (https://developer.amazon.com/amazonbot); Google-Agent ("agents hosted on Google infrastructure ... upon user request", IPs https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json); Google-GeminiNotebook (renamed from Google-NotebookLM).

Search-index crawlers: OAI-SearchBot, Claude-SearchBot (token only), PerplexityBot ("not used to crawl content for AI foundation models"), MistralAI-Index, Amzn-SearchBot, Meta-WebIndexer, Applebot (https://support.apple.com/en-us/119829).

Training crawlers: GPTBot, ClaudeBot (token only), MistralAI-Training (no IP list), Meta-ExternalAgent, Amazonbot, CCBot (Common Crawl warns of spoofing), Google-CloudVertexBot (substring only).

Robots.txt tokens that never appear as User-Agents (seeing them means spoofing): Google-Extended, Applebot-Extended.

Undocumented, do not attribute to a vendor: Bytespider (ByteDance publishes nothing), Cohere (its bot table reads "N/A"), anthropic-ai and Claude-Web (legacy), ChatGPT Atlas and Operator (no UA, no token, ordinary Chrome UA per secondary reports).

Structural note: OpenAI, Perplexity, Meta, Amazon, and Google all state that user-initiated fetchers may ignore robots.txt because a user asked. Anthropic does not carve that out.

## 3. Headless and automation fingerprints (headers only)

Worker's experiment, Chrome 152 `--headless=new` against a local echo server, 2026-09-02:
- User-Agent still contains `HeadlessChrome/152.0.0.0` (source: `if (HasSwitch(kHeadless)) product.insert(0, "Headless")` in chromium `components/embedder_support/user_agent_utils.cc`).
- `Sec-CH-UA` does not leak Headless. Do not use client hints as a signal.
- A scripted headless navigation sent `Sec-Fetch-User: ?1`, `Sec-Fetch-Site: none`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, full Accept and Accept-Language. Sec-Fetch-User is not evidence of a human.

Tools: Playwright raw launch inherits HeadlessChrome, but `npm init playwright` scaffolds `devices['Desktop Chrome']` with a clean spoofed UA (https://github.com/microsoft/playwright/blob/main/packages/isomorphic/deviceDescriptorsSource.json). Puppeteer: HeadlessChrome by default. Cypress: self-identifies with `Cypress/x Chrome/y Electron/z` in the UA. Selenium/ChromeDriver: unmodified UA, no marker. Browserbase: "real browser fingerprints", Web Bot Auth opt-in beta. Steel: spoofs a coherent Chrome fingerprint by default. Browser Use: inherits; leaks HeadlessChrome when headless. Lightpanda: hard-coded `Lightpanda/1.0` UA and fixed `Sec-Ch-Ua: "Lightpanda"`, sends no Sec-Fetch headers, forbids impersonation, supports Web Bot Auth opt-in.

Bottom line: nothing signs by default except Cloudflare Browser Rendering. A verified Signature-Agent at the edge is an affirmative opt-in by the operator: high precision, safe to label as fact.

## 4. The products Goga named

- MeshClaw (Seeed Studio) is an OpenClaw channel plugin for Meshtastic LoRa radio, a messaging transport, not a fetcher. https://github.com/Seeed-Solution/MeshClaw
- OpenClaw itself fetches, with a deliberately Chrome-like UA (`DEFAULT_FETCH_USER_AGENT = "Mozilla/5.0 (Macintosh ...) Chrome/122.0.0.0 Safari/537.36"`), `Accept: text/markdown, text/html;q=0.9, */*;q=0.1`, `Accept-Language: en-US,en;q=0.9`, and blocks operators from overriding those headers. https://github.com/openclaw/openclaw/blob/main/src/agents/tools/web-fetch.ts. The `Accept: text/markdown, text/html;q=0.9` ordering is a tell no real browser produces.
- Hermes Agent (Nous Research, MIT, https://github.com/NousResearch/hermes-agent) runs on the user's own infrastructure, drives real browsers, sets no User-Agent constant, and offers Camoufox (a fingerprint-spoofing Firefox fork) and Lightpanda (self-identifying) as backends. Its visibility depends on which backend the operator chose.

## 5. Taxonomies to cite

- Cloudflare verified bots (updated 2026-07-01): behavior taxonomy Search, Agent ("User-directed agents visiting a page on behalf of a human"), Training, Transact, Data Collection, Security Testing, SEO, Ads Verification, Social / Link Preview, Feed Fetching, Monitoring & Operations; operation axis Direct vs Intermediary; legacy categories include AI Assistant ("Automated AI bot driven by user action"), AI Crawler, AI Search. https://developers.cloudflare.com/bots/concepts/bot/verified-bots/ and https://developers.cloudflare.com/bots/reference/verified-bot-categories/
- Known Agents (Dark Visitors renamed, https://knownagents.com/agents): 17 agent types; AI Assistant "Fetches website content in response to a user prompt, to include in an AI-generated answer" vs AI Data Scraper "Downloads website content to include in datasets used for training AI models"; AI Agent "Uses an actual web browser to autonomously complete complex tasks on behalf of a human user". Has an identification API returning `agent_token`, `agent_type_name`, `operator_name`, `result: verified`. https://knownagents.com/products/agent-identification-api
- matomo device-detector `bots.yml` (commit e1a8504, 2026-08-24): 842 entries; Crawler 416, Search bot 79, Site Monitor 70, Service Agent 54, Security Checker 51, AI Data Scraper 37, Feed Fetcher 28, AI Assistant 22, AI Search Crawler 19, Social Media Agent 14, Validator 12, AI Agent 3, others. No documented category enum; vocabulary is de facto.
- ai.robots.txt `robots.json` (2026-08-25): 166 entries; `function` is free text, only 57% use controlled labels. Not a controlled vocabulary.
- Cloudflare Content Signals Policy (2025-09-24): `Content-Signal: ai-train=no, search=yes, ai-input=no`; categorizes use, not actor. https://contentsignals.org
- IETF aipref: `draft-ietf-aipref-vocab-07` (2026-08-19) defines only `train-ai` and `search`; `ai-use` was removed; `draft-ietf-aipref-attach-05` defines a `Content-Usage` header. Naming collision with Cloudflare's `Content-Signal`.
- IAB "LLM Content Ingest API" was renamed AI Content Monetization Protocols (CoMP); commercial terms only, no categories.

## 6. Cloudflare AI Crawl Control on the free plan

- Available on all plans. Shows requests, data transfer, status codes, paths, and operator grouping; assigns AI Crawler / AI Assistant / AI Search / Search Engine to named bots (ChatGPT-User → AI Assistant, GPTBot → AI Crawler, OAI-SearchBot → AI Search). Referral analytics are paid-only. https://developers.cloudflare.com/ai-crawl-control/ and https://developers.cloudflare.com/ai-crawl-control/reference/bots/
- Export is GraphQL `httpRequestsAdaptiveGroups` only; a Worker cannot read it at request time. `request.cf.botManagement` (including the new `signedAgent` field) requires Bot Management.
- Possible free bridge: `cf.client.bot` and `cf.verified_bot_category` can be stamped into a request header by a Transform Rule (10 free), then read by the Worker. Free-plan availability of `cf.verified_bot_category` not confirmed; test in a WAF rule first.
- Policy to check: Cloudflare's Search/Agent/Training controls reach the free tier (2026-07-01) and from 2026-09-15 Training and Agent are blocked by default on ad-displaying pages for new domains. This site shows no ads and is not new, but verify the zone's AI Crawl Control settings do not block agents, since the goal is to embrace them. https://blog.cloudflare.com/content-independence-day-ai-options/

## Design note (worker's, endorsed)

Four label sources are pure fact and need no hedging: a verified `Signature-Agent`; a vendor-documented UA token matched against the vendor's published IP file; a literal `HeadlessChrome/`, `Cypress/`, or `Lightpanda/1.0` token; and an operator-declared purpose signal. Everything else that spoofs (Steel, Browserbase without signing, OpenClaw, ChatGPT Atlas, Hermes on Camoufox) presents as an ordinary browser, and "presented as an ordinary browser" is itself the honest fact to record.

## Uncertain
Free-plan availability of `cf.verified_bot_category`; GraphQL retention on free; the signed-agent roster beyond the named cohort; whether Anthropic or Perplexity sign under an undiscovered host; Meta's directory scope; the headless capture was over plain http to localhost (trustworthy origin, should be representative; re-run against the real origin).

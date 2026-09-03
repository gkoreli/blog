# Agent-native web landscape, September 2026

Research worker: Claude opus, primary sources dated 2026 where available, 2026-09-03 03:30 UTC. Claims resting only on secondary coverage are marked [secondary]. The worker corrected two earlier errors inline (Pay Per Crawl plan availability; a supposed W3C llms.txt standardization).

## 1. Agent identification: Web Bot Auth
- IETF WG `webbotauth`, active since 2025-10-23. https://datatracker.ietf.org/wg/webbotauth/about/
- Live spec: `draft-ietf-webbotauth-httpsig-protocol-00`, 2026-09-01, WG document, merges protocol and directory. No RFC yet; milestones slipped. https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/
- Base: RFC 9421 HTTP Message Signatures (2024-02), RFC 9530 Digest Fields.
- Wire: `/.well-known/http-message-signatures-directory` (JWKS); headers `Signature`, `Signature-Input`, `Signature-Agent`. `Signature-Agent` is now a Dictionary structured header, `sig="https://signer.example"`, https only; bare-string form deprecated. `tag` MUST be `web-bot-auth`; `keyid` is the JWK SHA-256 thumbprint. "Key lookup MUST be keyed on the (URL, key) pair."
- Cloudflare: message signatures in Verified Bots since 2025-07-01; "Signed Agents" cohort 2025-08-28 (ChatGPT agent, Goose, Browserbase, Anchor Browser); agent registry 2025-10-30 names Amazon Bedrock AgentCore, Vercel, Shopify, Visa. https://blog.cloudflare.com/signed-agents/ https://blog.cloudflare.com/agent-registry/
- Signing today: OpenAI ChatGPT agent (`Signature-Agent: "https://chatgpt.com"`, observed by Simon Willison 2025-08-04), Google-Agent experimental via `https://agent.bot.goog` (docs updated 2026-08-19), Vercel (changelog 2025-08-12), Browserbase, Anchor, Goose. Not confirmed: Anthropic, Perplexity, Microsoft.
- Free Worker can verify: `crypto.subtle` `"Ed25519"`; reference `cloudflare/web-bot-auth` ships a Workers verifier. https://github.com/cloudflare/web-bot-auth

## 2. Agent browsers
- ChatGPT Atlas discontinued 2026-08-09; agentic browsing moved into the ChatGPT app and a Chrome extension. https://help.openai.com/en/articles/20001371-evolving-atlas-into-chatgpt-for-browser-based-agentic-work
- Agents running on the user's device (Perplexity Comet, Claude for Chrome, Edge Copilot Mode, Opera Neon) have no documented identifier and are invisible at HTTP by design. Only cloud-side agents are identifiable, and only signing makes it trustworthy.
- ChatGPT agent: Chrome-mimicking UA, no bot token, but signs.
- Perplexity was de-listed as a Cloudflare Verified Bot in Aug 2025 after the stealth-crawling dispute; no re-listing confirmed [secondary].

## 3. Site-side agent interfaces
- llms.txt: community convention (llmstxt.org v2, modified 2026-08-10), not standardized. Ahrefs June 2026 study of 137,000 domains: 97% of llms.txt files received zero requests in May 2026. Google does not support it. W3C strategy issue #506 (opened 2025-04-27) is an investigation, not a standardization path; "June 2026 W3C draft" stories are unsourced. Works in developer tools (Cursor, Claude Code, Copilot reading docs), not in AI search citation. https://www.searchenginejournal.com/97-of-llms-txt-files-got-no-requests-ahrefs-data-shows/579478/ https://github.com/w3c/strategy/issues/506
- NLWeb: shipping OSS (nlweb-ai/NLWeb, ~6.3k stars), acts as an MCP server, not standardized.
- WebMCP: W3C Web Machine Learning CG draft report dated 2026-09-02, not on the standards track; Chrome 149 origin trial (2026-06-09). For interactive sites exposing actions; a static blog has nothing to register. https://webmachinelearning.github.io/webmcp/
- MCP site discovery: MCP spec revision 2026-07-28 has no `.well-known` discovery; SEP-1649 and SEP-1960 compete, neither merged.
- ai-plugin.json dead (2024). agents.json niche. schema.org 30.0 (2026-03-19) has no agent types.
- Cloudflare "Markdown for Agents": real content negotiation on `Accept: text/markdown`, responses carry `x-markdown-tokens`; opt-in; Pro and above only, Free excluded (docs 2026-07-13). https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/ Since the blog already builds per-post Markdown, implement the negotiation in the Worker for free.
- `draft-car-ai-txt-wellknown-00` proposes `/.well-known/ai.txt`; individual draft.
- No W3C or IETF standard for "here is my machine-readable version".

## 4. Consent, licensing, payment
- IETF AIPREF: `draft-ietf-aipref-vocab-07` (2026-08-19) defines only `train-ai` and `search`, values `y`/`n`; `draft-ietf-aipref-attach-05` attaches via the `Content-Usage` HTTP header or a robots.txt `Content-Usage:` line; no HTML meta mechanism; no RFC, no Last Call.
- Cloudflare Content Signals (2025-09-24): `Content-Signal: search=yes, ai-input=yes, ai-train=no` in robots.txt; `ai-input` is Cloudflare vocabulary, not IETF. Free zones without a robots.txt got comments only.
- RSL 1.0 (2025-09-10, rslstandard.org): robots.txt `License:` line, `Link` header, HTML link, RSS module; adopters Reddit, Yahoo, Medium, Quora, People Inc., Ziff Davis; no AI vendor honors it; OpenAI declined [secondary].
- Pay Per Crawl: closed beta, not on Free (docs 2026-07-28). HTTP 402 with pricing. https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/what-is-pay-per-crawl/
- AI Crawl Control: GA on all plans including Free (docs 2026-08-14).
- 2026-09-15 default: Training and Agent bots blocked on ad-monetized pages for new domains and Free accounts that never changed settings; Search allowed. Verified 2026-09-03 that this zone allows everything (artifact 07).
- TollBit, ScalePost, ProRata, Human Native: publisher intermediaries; not for an individual blog.
- No attribution-request token exists in any vocabulary. The honest robots.txt for "read me and cite me" is: allow retrieval and search, decide training explicitly, state attribution terms in prose and optionally an RSL license link. Trap: Googlebot crawls search and Gemini training under one token.

## 5. Citation and measurement
- No AI vendor notifies a source that it was cited. No agent-era Webmention exists, not even a draft; W3C's 2026 agent groups do not reference Webmention. Academic framing: arXiv 2606.10711, "The Agentic Web Requires New Normative Infrastructure". This is the clearest gap in the landscape.
- Google AI Overviews/AI Mode link changes 2026-05-06 (inline links, hover previews, creator attribution).
- Google Search Console generative-AI reports: announced 2026-06-03, worldwide by 2026-08-31; separate reports for AI Overviews, AI Mode, Discover AI with impressions, pages, countries, devices; no clicks, no queries; free. https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports
- Bing Webmaster "AI Performance" preview from 2026-02-09 with "Grounding Queries" and "Citations" [secondary].
- Cloudflare Radar AI Insights publishes per-operator crawl-to-refer ratios (Anthropic thousands to one, OpenAI hundreds, Google about 5:1); free API exposure unconfirmed. https://radar.cloudflare.com/ai-insights
- Referrer strings seen: chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com; app traffic often lands as direct [secondary].
- C2PA 2.3 (2026-01-05) does not cover HTML or plain text. No Provenance HTTP header RFC; SCITT and `draft-flores-aidp-provenance-00` are drafts.
- Paid AI-visibility trackers start around $80 to $130 per month.

## 6. Persistent identifiers
- Rogue Scholar alive and free: about 54,811 posts from 201 blogs (Aug 2026); Crossref or DataCite DOIs under 10.59350; requires full-text feed and CC-BY; converting to a German non-profit (assembly 2026-12-09); donation-funded. Crossref added a `posted_content` subtype `blog` in schema 5.5.
- Individuals cannot join Crossref directly (organizations only, $200/yr tier from 2026-01); Rogue Scholar registers on the author's behalf.
- OpenAlex indexes Rogue Scholar posts; its API requires a key since 2026-02-13 (100 credits/day unauthenticated).
- arXiv closed to review and position papers without peer review (2025-10-31).
- CSL-JSON via `Accept: application/vnd.citationstyles.csl+json` works at doi.org for DOIs; no convention for arbitrary blog URLs, but nothing prevents serving it.
- CITATION.cff is scoped to software and datasets. No AI vendor states it reads JSON-LD for citations. No study shows a DOI improves AI citation. BibTeX in a page is dated for web content.

## What is actually current (worker's summary, kept verbatim in spirit)
1. Web Bot Auth is the one real shipping standard; the WG draft is two days old; no RFC.
2. `Signature-Agent` is a Dictionary header now; bare string deprecated.
3. A free Worker can verify; Cloudflare ships the verifier.
4. Signing: OpenAI agent, Google-Agent (experimental), Vercel, Browserbase, Anchor, Goose. Not Anthropic, Perplexity, Microsoft.
5. Atlas is dead; on-device agent browsers are undetectable by design.
6. llms.txt is effectively inert for AI search; keep it for dev tools only.
7. Markdown negotiation is real, paid at Cloudflare, free to replicate in the Worker.
8. AIPREF has two tokens; `ai-input` is Cloudflare's; no RFC.
9. Pay Per Crawl closed beta; AI Crawl Control free.
10. Nothing notifies a source it was cited. The gap is real and open.
11. Best free measurement: Search Console generative-AI reports plus Bing AI Performance.

## Could not confirm
Anthropic/Perplexity/Microsoft signing; Perplexity re-listing; identifiers for Comet, Copilot Mode, Neon, Browser Use, Steel; Radar crawl-to-refer via free API; AI Crawl Control free-plan limits; Pay Per Crawl minimum price; Bing AI Performance launch date; any vendor reading JSON-LD for citations; DOI effect on AI citation; Rogue Scholar ORCID requirement; claims that Cloudflare activated Web Bot Auth at the edge in March 2026 and that llms.txt lifts citations 23% (unsourced SEO content, treat as false).

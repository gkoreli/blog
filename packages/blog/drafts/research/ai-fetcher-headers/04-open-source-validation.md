# Open-source validation: what the public bot detectors make of the captured requests

Checked 2026-09-03 against the current `main`/`master` of each project (raw files fetched the same day). The six User-Agent strings are the ones captured in `02-probe-captures.md`.

## Sources (authoritative open-source references)

| Project | What it is | Used by | Fetched file |
|---|---|---|---|
| [omrilotan/isbot](https://github.com/omrilotan/isbot) 5.2.2 | npm library, regex list, ~209 patterns; the most-installed JS bot check | Next.js ecosystems, analytics SDKs | `src/patterns.json`, plus the built package |
| [matomo-org/device-detector](https://github.com/matomo-org/device-detector) | Matomo's UA parser; `regexes/bots.yml` is the largest maintained named-bot list (841 entries parsed) | Matomo, Piwik PRO, many PHP/Go/Python ports | `regexes/bots.yml` |
| [monperrus/crawler-user-agents](https://github.com/monperrus/crawler-user-agents) | JSON list of 1,500 crawler patterns with first-seen dates and sample instances | log analysers, Go/Python/JS ports | `crawler-user-agents.json` |
| [ai-robots-txt/ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) | Community registry of 166 AI agents with operator, respect-robots status, function, description; generates robots.txt and nginx/Caddy blocks | Many small sites and CMS plugins | `robots.json` |
| [arp242/isbot](https://github.com/arp242/isbot) (Go) | GoatCounter's detector: UA heuristics plus hosting IP ranges, each verdict a numbered reason code | GoatCounter | `isbot.go` |
| [cloudflare/web-bot-auth](https://github.com/cloudflare/web-bot-auth) | Reference implementation of HTTP Message Signatures for bots (IETF `draft-ietf-webbotauth-httpsig-protocol`) | Cloudflare Verified Bots, signing agents | `README.md` |
| [ua-parser/uap-core](https://github.com/ua-parser/uap-core) | Browser/device UA regexes; not a bot list | many | `regexes.yaml` (not used for verdicts) |

## Results per captured request

| Captured UA | isbot 5.2.2 | device-detector | crawler-user-agents | ai.robots.txt | GoatCounter isbot (by design) |
|---|---|---|---|---|---|
| ChatGPT-User (full string) | bot | `ChatGPT-User` | `ChatGPT-User` | listed, operator OpenAI, respects robots: Yes | bot (UA contains URL → BotLink; Azure range → BotRangeAzure) |
| Claude-User (claude.ai) | bot | `Claude-User` | `Claude-User` | listed, operator Anthropic, respects robots: Yes | bot (UA contains `+` contact; Google Cloud range → BotRangeGoogleCloud) |
| `Google` (Gemini app) | bot, via the generic `google` pattern | **`Googlebot`**, via an explicit `^Google$` rule (`bots.yml` line 1088) | no match | no entry | likely BotShort (short UA) |
| `Claude-User (claude-code/2.1.259; …)` | bot | `Claude-User` | `Claude-User` | `Claude-Code` entry exists, operator "Unclear at this time" | bot (URL in UA) |
| Grok exit, Safari 26.2 UA | **not a bot** | no match | no match | **no xAI or Grok entry at all** | NoBotNoMatch unless the exit IP is in a listed hosting range (Servers.com and Google Cloud are; Aventice, Web2Objects, the ISPs and the mobile pool are not) |
| Grok exit, Chrome 143 UA | **not a bot** | no match | no match | no entry | same |

## What this validates

1. **The three declared fetchers are recognised everywhere.** ChatGPT-User and Claude-User are named identically by isbot, device-detector, crawler-user-agents and ai.robots.txt. The site's own classifier agrees with the open-source consensus for these two.
2. **The bare `Google` User-Agent is known to exactly one detector, and it mislabels it.** device-detector carries `^Google$` → `Googlebot`, category "Search bot". GitHub blame dates that rule to commit a9f29e5 of 2023-08-07 ("Adds detection for Wear OS, Odd Browser, Mobvoi brand and various bots"), four months before the Gemini app launched, so a bare `Google` User-Agent has been reaching sites since at least mid-2023 and was filed as search crawling from the start. A Gemini app fetch on behalf of a person is therefore counted by Matomo installations as Googlebot search crawling. isbot flags it as a bot only because the generic word `google` is in its list. Neither treats it as an AI assistant. crawler-user-agents and ai.robots.txt have no entry. Prior art on undocumented Gemini UAs: Natzir found `GeminiiOS 1.2025.417 (WKWebView)` in access logs on 2025-10-27 (ppc.land, Search Engine Roundtable); Google did not document it afterwards. Google's own crawler pages checked 2026-09-03 (common crawlers, user-triggered fetchers) list no bare `Google` UA.
3. **isbot's Claude Code pattern does not match Claude Code.** `patterns.json` contains `^claude-code/`, which expects the UA to begin with `claude-code/`. The real UA begins with `Claude-User (claude-code/…)`. The request is still flagged, but only because `Claude-User` matches other patterns. A pull request with the observed string fixes the pattern.
4. **Grok is invisible to every UA-based detector, by construction.** No project has a Grok or xAI entry because there is no token to list. ai.robots.txt, whose whole purpose is to block AI agents in robots.txt, cannot express Grok at all. GoatCounter's IP-range approach catches only the exits that sit in listed clouds (Servers.com, Google Cloud): 1 of the 8 captured exits by its list, at most 3 if Aventice and Web2Objects were added. The five ISP, mobile and "private customer" exits pass every open-source check.
5. **Web Bot Auth is the only mechanism in this set that is not spoofable.** cloudflare/web-bot-auth documents the `Signature-Agent` / `Signature-Input` / `Signature` headers and the `/.well-known/http-message-signatures-directory` lookup. None of the six captured requests carried a signature. That matches the vendor evidence in `01-vendor-documentation.md`: only OpenAI's ChatGPT agent and Google-Agent sign today.

## Upstream contributions this evidence supports (each is a durable inbound link from a trusted repository)

- **omrilotan/isbot**: fix `^claude-code/` to match `claude-code/` anywhere, or add `Claude-User`-prefixed Claude Code sample; add the `Google` bare UA as an AI-assistant sample with the capture as evidence.
- **matomo-org/device-detector**: propose reclassifying `^Google$` from `Googlebot`/"Search bot" to a separate "Google (Gemini app fetcher)" entry with category "AI Assistant", citing the capture and the absence from Google's documentation; add `Claude-User (claude-code/…)` as a Claude Code sample under a distinct name.
- **monperrus/crawler-user-agents**: add an instance for the bare `Google` UA once a second independent capture exists (the project requires observed instances), and add the observed full Claude-User string as an instance.
- **ai-robots-txt/ai.robots.txt**: fill in `Claude-Code` operator (Anthropic) and the observed UA; open a documented issue that xAI/Grok cannot be listed because it sends no token, linking the capture. That issue is the natural home for the "Grok is undetectable" finding.
- **cloudflare/web-bot-auth** discussions or the IETF `webbotauth` list: the Grok capture is direct evidence for why signed agents matter.

Limits: regex matching for device-detector was run with Python `re` on a crude parse of the YAML (841 of the file's entries); a PHP or Go run of the real library should confirm before any upstream PR. isbot was run through the real npm package (5.2.2).

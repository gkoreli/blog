# Probe log: which assistant was asked, when, and what it answered

Operator: a Claude Code browser worker driving the owner's Chrome, 2026-09-03. Prompt sent to each assistant in a fresh chat:

> Please open this exact URL and tell me the exact text of its H1 heading and the first sentence after it: <URL>. Do not answer from memory; fetch the page.

Real H1: "Does llms.txt Work? What a Live Implementation Revealed".

| # | Service | Account | UTC sent | Answered with real H1 | Origin request seen | Notes |
|---|---|---|---|---|---|---|
| 1 | ChatGPT (chatgpt.com) | logged in, Pro | 03:57:00 | yes | yes, 03:57:28 (+ homepage 03:57:31) | "Worked for 43s… I fetched the exact URL." |
| 2 | Claude (claude.ai) | logged in, Max | 03:57:44 | yes | yes, 03:58:09 | Noted the ?probe=claude URL resolved directly, no redirect. |
| 3 | Perplexity | anonymous | 03:58:31, 03:59:19, 04:01:51 | no, 3/3 | none | "the page could not be retrieved by the web tool… I won't guess or answer from memory." |
| 4 | Gemini (gemini.google.com) | logged in, Flash | 04:01:13 | yes, verbatim standfirst | yes, 04:01:10 (send-button click time recorded a few seconds late) | |
| 5 | Microsoft Copilot | not logged in | skipped | | | Sign-in wall. |
| 6 | Grok (grok.com) | anonymous, Fast | 04:02:53 | yes | yes, 8 requests 04:03:18–04:03:30 | Tool step: "Opened page gkoreli.com/does-llms-txt-work?probe=grok". |
| 7 | Mistral (chat.mistral.ai → Vibe) | not logged in | skipped | | | Terms-of-service modal; not accepted by automation. |
| 8 | DuckDuckGo duck.ai | no login needed | skipped | | | "Continue" terms gate before first send; not clicked. Message never sent. |
| 9 | Chrome direct navigation (baseline) | owner's browser | 04:04:00 | | yes, 04:04:03 | Human baseline. |
| 10 | ChatGPT agent mode | logged in | 04:05:44 | did not run | none | No "Agent mode" in the composer menu; ChatGPT: "Agent mode / Cloud Browser is not available to me in this chat". |

Owner-run probes from the terminal (same machine, AS62887):

| Tool | UTC | Origin request seen | Notes |
|---|---|---|---|
| Claude Code WebFetch | 03:55–03:57 | yes, `probe=claudecode-webfetch` | UA `Claude-User (claude-code/2.1.259; +https://support.anthropic.com/)`, `Accept: text/markdown, text/html, */*`, from the owner's own IP. |
| Codex CLI `codex exec -c tools.web_search=true` | 03:59:13 | none | Printed `web search: https://gkoreli.com/does-llms-txt-work?probe=codex%2Dsearch` and answered with the exact H1. D1 and tail both show no request. |
| curl baseline | 03:55 | yes, `probe=hdr1` | Confirms tail records full headers. |

D1 cross-check (`page_observations`, 2026-09-03 03:50–04:05): ChatGPT-User rows stored as `ai`; Claude-User rows (claude.ai and Claude Code) stored as `browser` because the deployed Worker predates commit 5d99371, which added the token; Gemini stored as `browser` (UA `Google`, `accepts_html=1`); all eight Grok rows stored as `browser` with `sec_fetch_mode=navigate`.

IP verification: `02-probe-captures.md` marks which client addresses fall inside a vendor-published list. Lists fetched 2026-09-03: openai.com/chatgpt-user.json, claude.com/crawling/bots.json, perplexity.com/perplexity-user.json, mistral.ai/mistralai-user-ips.json, duckduckgo.com/duckassistbot.json, and Google's googlebot.json, special-crawlers.json, user-triggered-fetchers.json, user-triggered-fetchers-google.json, user-triggered-agents.json. The Gemini address 108.177.67.40 is in none of the five Google lists.

Prior art: Stackfox, "Grok user agent" research, February 2026 (https://stackfox.co/research/grok-user-agent): same probe method, observed Chrome 139 and iPhone Safari UAs from M247 and Datacamp proxy ranges; documented tokens GrokBot/1.0, xAI-Grok/1.0, Grok-DeepSearch/1.0 never observed.

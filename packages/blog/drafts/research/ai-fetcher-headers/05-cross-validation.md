# Cross-validation against established open-source artifacts (2026-09-03)

Three independent checks of the captured facts against artifacts maintained by other people.

## 1. Captured User-Agent strings vs recorded instances in monperrus/crawler-user-agents

The project stores, per pattern, the exact strings contributors have observed in the wild and the date the pattern was added. Comparison of our captured strings with those instances:

| Captured | Pattern (added) | Instances | Exact match |
|---|---|---|---|
| ChatGPT-User | `ChatGPT-User` (2024-04-19) | 1 | yes, byte for byte |
| MistralAI-User | `MistralAI-User` (2026-04-07) | 1 | yes |
| DuckAssistBot/1.2 | `DuckAssistBot` (2026-04-07) | 1 | yes |
| PerplexityBot/1.0 | `PerplexityBot\/` (2024-03-14) | 1 | yes |
| Claude-User (claude.ai) | `Claude-User` (2026-04-07) | 2 | no: recorded instance has `+Claude-User@anthropic.com`, capture has `+claude-user@anthropic.com` (case differs in the contact token) |
| Claude Code `Claude-User (claude-code/2.1.259; …)` | `Claude-User` | 2 | no instance for the Claude Code form |
| `Google` (Gemini app) | none | 0 | no pattern at all |
| `HeadlessChrome/148.0.0.0` (Grok signed in) | `HeadlessChrome` (2019-06-17) | 3 | pattern matches; recorded instances are older versions |

Four vendor fetchers match the community record exactly, which corroborates both. The Claude-User case difference is worth reporting upstream with the capture as evidence (either Anthropic changed the token's case or the recorded instance was normalised). The bare `Google` string remains unrecorded anywhere.

## 2. Grok exit addresses vs the X4BNet datacenter IP list

`X4BNet/lists_vpn` publishes a widely used list of datacenter IPv4 ranges (42,797 ranges on 2026-09-03). Each Grok exit address was checked privately; only the boolean is published.

| Run | ASN, registry holder | In X4BNet datacenter list |
|---|---|---|
| 1 | AS9009 M247 Europe | yes |
| 1 | AS3257 GTT Communications (block: Web2Objects) | no |
| 1 | AS132817 DZCRD Networks (BD ISP) | no |
| 1 | AS13280 Three Ireland mobile | no |
| 1 | AS262988 Pombonet (BR ISP) | no |
| 1 | AS212238 Datacamp | yes |
| 1 | AS7979 Servers.com | yes |
| 1 | AS398781 Oculus Networks | no |
| 2 | AS3257 GTT Communications | no |
| 2 | AS212238 Datacamp | yes |
| 2 | AS268249 DESTAK NET (BR ISP) | no |
| 2 | AS52361 ARSAT (AR telecom) | no |
| 2 | AS55286 B2 Net Solutions | yes |
| 2 | AS28573 Claro (BR) | no |
| 2 | AS11798 Ace Data Centers | no |
| 2 | AS209709 UAB code200 | no |
| signed-in | AS396982 Google Cloud | yes |

A large, maintained datacenter list flags 3 of 8 exits in run 1 and 2 of 8 in run 2. The consumer networks are, as expected, absent, and so are several hosting providers. This is the quantitative form of the article's claim that no IP-reputation rule separates the anonymous Grok fetcher from people.

## 3. Web Bot Auth key directories on vendor hosts

`GET https://<host>/.well-known/http-message-signatures-directory`, redirects followed, 2026-09-03:

| Host | Result |
|---|---|
| chatgpt.com | 200, 1 key (OpenAI's ChatGPT agent; matches research artifact 06 in readers-vs-bots) |
| assistbot.duckduckgo.com | 200, 1 Ed25519 key, thumbprint `Ov3HDsa8JQ39dPEYFvFFN-cUpnz9yNI8LDvr-5LeiBM`, equal to the `keyid` in the captured DuckAssistBot request |
| openai.com, duckduckgo.com, anthropic.com (→ www.anthropic.com), claude.ai, claude.com, perplexity.ai (→ www.perplexity.ai), www.perplexity.ai, x.ai, grok.com, mistral.ai, gemini.google.com, google.com, www.google.com, bing.com (→ www.bing.com) | 404 |
| copilot.microsoft.com | redirects to the Bing homepage |

Seventeen hosts were requested (two with keys, fourteen 404 after redirects, one redirect to a homepage). Only two hosts in the set publish signing keys, and only one of them, DuckDuckGo, signed a request in this study. Google-Agent's directory (documented elsewhere) is not on the consumer Gemini hosts probed here.

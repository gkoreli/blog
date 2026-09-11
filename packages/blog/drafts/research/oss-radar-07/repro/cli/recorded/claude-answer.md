## What the blog can measure without JavaScript

The detection runs in a Cloudflare Worker at the edge, so it sees only what arrives with the HTTP request. Per the article, it uses four evidence sources:

| Signal | What it provides |
|---|---|
| **Network metadata (ASN)** | Whether the request came from a curated hosting network vs. a consumer connection |
| **Fetch Metadata headers** | `Sec-Fetch-Mode: navigate` + `Sec-Fetch-Dest: document` — navigation-shaped intent |
| **`Accept` headers** | Whether HTML is acceptable, and whether a language preference is declared |
| **User-Agent** | Matches against known crawlers/assistants, plus **Web Bot Auth** signature verification |

Two rules do the reclassification work:

- **Rule one:** a browser User-Agent on a curated hosting network becomes `cloud-browser` — "even if it passes the navigation-header check."
- **Rule two:** a request claiming a modern browser (Chromium 76+, Firefox 90+, Safari 16.4+) that lacks Fetch Metadata becomes `http-client`, because that capability is expected from those versions.

Resulting categories: `Browsers`, `cloud-browser`, `http-client`, `legacy-browser` (older/unreadable UA claims), `not-navigation-shaped` (failed the header combination), and signed/verified agents (e.g. Ahrefs, Exa via Web Bot Auth).

**Measured result**, over September 4 00:00 → September 6 00:00 UTC (end-exclusive, i.e. two complete UTC days): 372 browser-UA observations, 277 reclassified (74.5%), leaving 95 in `Browsers`. Notably, **60 of the 277 cloud-classified requests carried the navigation headers the browser rule requires** — network evidence caught traffic that header checks alone would have admitted.

Critically, "observations" are individual requests logged to D1, **not deduplicated by session or user**. So 95 is a request count, not a people count.

## What the Cloudflare Web Analytics comparison establishes

The comparison is 95 Worker-side `Browsers` observations vs. **14 Cloudflare Web Analytics page loads** over the same window — 6.79×. Including bot-tagged RUM loads raises the comparable total to 16, giving 95/16 = 5.94×.

**What it does establish:**
- A large, reproducible gap between the two counters exists. The article notes a read-only extractor "reproduced the 95/14 = 6.79× result in a separate capture and saves queries, sampling, and deployment metadata."
- Bot filtering does not explain the gap: "Bot filtering alone does not account for the discrepancy."

**What it does not establish:**
- Not that the excess is automation: "The counters measure different events, so their disagreement is a starting point for investigation. It cannot, by itself, tell me which requests were automation."
- Not audience accuracy in either direction: "Neither a smaller Browser count nor agreement with a script counter establishes audience accuracy."
- Not readership: "No verified count of distinct people, reading actions, or citations follows from these counters."

The counters are not measuring the same event — the Worker counts eligible successful page GETs; RUM counts page loads after beacon delivery. A gap between them is therefore expected in principle, and its *size* is the finding, not its existence. The article does **not** explicitly state that Cloudflare Web Analytics requires JavaScript, so I won't attribute the gap to that mechanism on the article's authority.

## Stated limitations

- The `Browsers` category "can also exclude legitimate access through cloud browsers or unusual clients" — false negatives are acknowledged, not just false positives.
- Headers can't reveal provenance: "headers alone need not reveal whether it followed a conversation, a scheduled job, or another process."
- Web Bot Auth verification "does not establish the initiating person's identity, delegation, or purpose."
- The claim is deliberately narrow: "The useful claim is narrower than a reader count: these requests met a documented rule," and "A smaller Browser total or a favorable ratio is not a completion criterion."
- The core gap remains open: "Determining how much of that category represents people consuming the article requires evidence the rule does not collect."

## Things to flag

- **The page carries a correction.** Published September 3, 2026, with a note: "September 6 correction: added the September 4–5 measurements; removed the universal accuracy thresholds and lower-bound claim; corrected signature arrivals, vendor-IP validation, and network provenance; disclosed the `Accept` defect." The numbers above come from the corrected September 4–5 dataset. I did not verify the details of the disclosed `Accept` defect — only that the correction note mentions it.
- **Window ambiguity resolved.** An intermediate extraction rendered the window as "00:00 through 06:00 UTC"; a targeted re-check confirmed it is September 4 00:00 through **September 6** 00:00 UTC, two complete days.
- **Retrieval caveat.** I accessed the article through a fetch-and-summarize tool rather than raw HTML. The quoted sentences and the figures 372 / 277 / 95 / 14 / 6.79× were consistent across three independent extractions, which is good but not identical to reading the source markup.
- **A companion post materially weakens the method**, and it's worth knowing: [Which AI Fetchers Send Which Headers](https://gkoreli.com/which-ai-fetchers-send-which-headers) reports that anonymous Grok arrives with full Safari/Chrome headers from rotating residential-style proxy exits across eight networks, so "Anonymous Grok's requests sit inside the browser count of any server-side counter that relies on User-Agent strings and hosting-ASN lists." That is exactly the two signals this method depends on. That post concludes server-side classification is "a lower bound, not a measurement." Note this is a *different* article — I'm citing it as adjacent evidence, not as a claim made in the one you asked about.

Sources:
- [How I Separate Readers from Bots Without JavaScript](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript) — all measurements, category definitions, and limitations above
- [Which AI Fetchers Send Which Headers, Measured on a Live Site](https://gkoreli.com/which-ai-fetchers-send-which-headers) — proxy-pool caveat only
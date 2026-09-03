# Fetch Metadata absence: what prior art already settles

Fable, 2026-09-03 04:40 UTC, primary sources checked directly. Written after Goga asked why the header-absence rule needed our own measurement when other people must have faced this.

## The question

Can "browser User-Agent, no `Sec-Fetch-Mode`" be a verdict (this is not the browser it claims to be), or only a weight?

## What is already known

1. Support is near-universal and dated. caniuse `mdn-http_headers_sec-fetch-mode`: 95.72% of global usage supports it. First versions: Chrome 76 (2019-07), Firefox 90 (2021-07), Safari and iOS Safari 16.4 (2023-03), Samsung Internet 12.0, Opera 63. Missing: Internet Explorer, browsers older than those versions, Opera Mini unknown. https://caniuse.com/mdn-http_headers_sec-fetch-mode
2. Android WebView sends it, since 2019. Privacy Browser issue #495 (2019-09-09/10): "Sec-Fetch headers are sent on all requests as of Chromium 76, and this is also the case for the webview"; maintainer: "Google has recently added Sec-Fetch-Mode, Sec-Fetch-User, and Sec-Fetch-Site to their list of standard headers in WebView." The Chromium intent-to-ship lists all six Blink platforms including Android WebView. https://redmine.stoutner.com/issues/495 https://groups.google.com/a/chromium.org/g/blink-dev/c/yQgJlq5PEOQ/m/erexYRWHBgAJ
3. iOS WebView sends `Sec-Fetch-Mode`, measured in production. mdn/browser-compat-data issue #27928 (2025-09-18, closed by PR #28025): a 24-hour log analysis across multiple large sites, verified on BrowserStack, found `Sec-Fetch-Mode` from Safari desktop, iOS, and iOS WebView in counts that "scale in the millions", while `Sec-Fetch-User` was "in the hundreds" and attributed to faked User-Agents. Conclusion: Safari never sent `Sec-Fetch-User`; the other Fetch Metadata headers are present on all three Safari platforms. https://github.com/mdn/browser-compat-data/issues/27928
4. The "WebViews omit it" caveat traces to one 2025 vendor blog post (Menin, sicuranext) with no data, and to defensive projects (Anubis, caddy-waf, BunkerWeb, bot-signal) whose comments say they hedge because they lack data, not because they measured false positives (artifact 04 part C).
5. Practitioner observation matches: WebmasterWorld threads on `Sec-Fetch-*` report that a User-Agent claiming a recent Chrome without `Sec-Fetch-Mode` is a fake, since real "Chrome/8x passes Sec-Fetch-Mode". https://www.webmasterworld.com/search_engine_spiders/5026762.htm

## What this settles

- For a User-Agent that claims Chrome or any Chromium browser >= 76, Firefox >= 90, or Safari/iOS >= 16.4, the absence of `Sec-Fetch-Mode` on a document request is a verdict: the client is not the browser it names. The WebView exception does not exist for those versions on either platform.
- For a User-Agent that claims an older engine, or one whose engine version cannot be read, absence is expected and proves nothing. Those rows are a separate kind (`legacy-browser`), not automation and not confirmed readers. Their share is bounded by the 4.28% of global usage that caniuse reports as unsupported, and on this site it will be smaller because the audience skews to current browsers.
- `Sec-Fetch-User` must never be required (Safari), which the partition already respects.
- No further site-specific measurement is needed before the rule ships. TASK-0104's calibration against Cloudflare Web Analytics remains the check that the whole partition is honest.

## What remains site-specific

Only the calibration: whether the count of navigation-shaped rows outside hosting networks tracks Cloudflare Web Analytics visits. That is TASK-0104, not a precondition for the rule.

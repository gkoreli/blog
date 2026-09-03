# Standards and vendor vocabulary for traffic classes

Research worker: Claude opus, read-only, web sources. Received 2026-09-03 01:50 UTC. Every claim carries its primary source. Quotes are verbatim from the source.

## 1. MRC / IAB invalid-traffic standard

Document: "Invalid Traffic Detection and Filtration Standards Addendum", June 2020 Update (Final), Media Rating Council. Supersedes the October 2015 Guidelines v1.0. https://mediaratingcouncil.org/sites/default/files/Standards/IVT%20Addendum%20Update%20062520.pdf (IAB landing page: https://www.iab.com/guidelines/mrc-invalid-traffic-ivt-detection-and-filtration-guidelines-addendum/). A 2024 interim update exists and does not change the category lists: https://mediaratingcouncil.org/sites/default/files/Standards/2024_IVT_Interim_Updates_FINAL.pdf

- GIVT definition: "The first, referred to herein as 'General Invalid Traffic' or GIVT, consists of traffic identified through routine means of filtration executed through application of lists or with other standardized parameter checks."
- GIVT examples (§1.1.2, introduced as "Key examples are:", so illustrative not closed):
  - "Known invalid data-center traffic (determined to be a consistent source of invalid traffic; not including routing artifacts of legitimate users or virtual machine legitimate browsing);"
  - "Bots and spiders or other crawlers (except those as noted below in the 'Sophisticated Invalid Traffic' category);"
  - "Non-browser user-agent headers or other forms of unknown browsers;"
  - "Pre-fetch or browser pre-rendered traffic (…)"
  - "Non-rendering capabilities; sessions or traffic without the capability to render or display images (…) such as headless browsers or component devices without a display component."
- SIVT definition: "The second category, herein referred to as 'Sophisticated Invalid Traffic' or SIVT, consists of more difficult to detect situations that require advanced analytics, multi-point corroboration/coordination, significant human intervention, etc., to analyze and identify." Relevant SIVT bullets: "Automated browsing from a dedicated device (…)" and "Bots and spiders or other crawlers masquerading as legitimate users detected via sophisticated means;"
- The GIVT/SIVT line is drawn by detection method, not by the client. "Measurement organizations may choose to classify invalid data-center traffic as SIVT if detected via sophisticated means."
- No positive noun for the remainder. "Valid traffic" appears only in passing ("(valid traffic filtered)" defining false positives). "Human" is never a bucket label.
- MRC floor when no industry list is used: "the MRC is requiring filtration of invalid data-center traffic originating from IPs associated to the three largest known hosting entities: Amazon AWS, Google and Microsoft."

## 2. The industry lists

- "the IAB/ABC International Spiders & Bots List, is maintained by the Alliance for Audited Media/AAM on behalf of the IAB Tech Lab." (MRC §1.1.3). Paid: Member $5,000/year, Non-Member $15,000/year, updated monthly. Contents: "two text files: one for valid browsers or user agents and one for known robots" (dual pass). https://iabtechlab.com/software/iababc-international-spiders-and-bots-list/
- There is no "IAB data center list". The standard names the "TAG Data Center IP list" and its limit: "limited to traffic from data-center IP addresses where human traffic is not expected to originate and excludes mixed data-center IPs."

## 3. Cloudflare vocabulary

- Bot score bands (https://developers.cloudflare.com/bots/concepts/bot-score/): 1 = "Automated" ("Cloudflare is quite certain the request was automated"); 2–29 = "Likely automated"; 30–99 = "Likely human"; 0 = not evaluated. Heuristics engine "gives automated requests a score of 1 for high-confidence, deterministic detections".
- "Verified bots" (https://developers.cloudflare.com/bots/concepts/bot/verified-bots/): "A bot or agent that Cloudflare has confirmed is transparent about who it is and what it does" via Web Bot Auth signature, published IP list with stable user-agent, or reverse DNS, and that "obeys robots.txt and crawl directives".
- Super Bot Fight Mode groupings: "Definitely automated traffic", "Likely automated traffic", "Verified bots". https://developers.cloudflare.com/bots/get-started/super-bot-fight-mode/
- Radar uses two classes: "Likely automated" (scores 1–29) and "Likely human" (30–99). Never bare "Human". https://developers.cloudflare.com/radar/concepts/bot-classes/
- Web Analytics "Exclude bots" dimension: "Exclude bot traffic from the dataset. With this dimension set to Yes, the resulting dataset will be a closer representation of real user traffic." Mechanism not documented. https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/
- Web Analytics defines "Page views" as "A successful HTTP response with a content-type of HTML", the same rule as our edge counter. https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/

## 4. Google Analytics 4

"traffic from known bots and spiders is automatically excluded" using "a combination of Google research and the International Spiders and Bots List, maintained by the Interactive Advertising Bureau." Cannot be disabled or inspected. https://support.google.com/analytics/answer/9888366

## 5. Matomo

`core/Tracker/VisitExcluded.php` (https://github.com/matomo-org/matomo/blob/5.x-dev/core/Tracker/VisitExcluded.php). `isExcluded()` order: `isNonHumanBot()` → rec param → `Tracker.isExcludedVisit` event → `isRequestExcluded()` → `isIgnoreCookieFound()` → `isVisitorIpExcluded()` → `isUserAgentExcluded()` → `isReferrerSpamExcluded()` → `isUrlExcluded()` → `isPrefetchDetected()`. `isNonHumanBot()` is `!$allowBots && ($deviceDetector->isBot() || $this->isIpInRange())`, with regexes at https://github.com/matomo-org/device-detector/blob/master/regexes/bots.yml. Beyond User-Agent it reads only prefetch headers `HTTP_X_PURPOSE` ("preview", "instant") and `HTTP_X_MOZ` ("prefetch"); `Sec-Purpose` not found there.

## 6. Plausible

Four documented mechanisms: "User-Agent filtering", "Referrer spam filtering", "Data center IP filtering" (~32,000 ranges), "Traffic pattern detection". https://plausible.io/docs/bot-traffic-filtering. Community Edition gets "Basic bot filtering that targets the most common non-human traffic based on the User-Agent header and referrer spam domains"; data-center filtering and pattern detection are cloud-only. https://plausible.io/self-hosted-web-analytics. UA library: `ua_inspector`. https://github.com/plausible/analytics/blob/master/mix.exs

## 7. Fathom (closed source)

https://usefathom.com/docs/features/bot-detection. Three layers: "Bot user agents" (list); "Datacenter IPs" ("traffic originating from known datacenter and hosting provider IP ranges (like AWS, Azure, Google Cloud, DigitalOcean, and many others)" with VPN exits excluded); "Suspicious headers" ("malformed, missing, or otherwise suspicious HTTP headers that don't match normal browser behaviour"). Remainder called "real human visitors".

## 8. Fetch Metadata and Accept-Language as automation signals

- Spec: https://www.w3.org/TR/fetch-metadata/. Purpose is resource isolation; the spec never mentions bots. `Sec-` prefix makes them forbidden request headers for page scripts, but any non-browser client can send anything. https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Mode
- Open-source precedent, SearXNG bot detection (https://docs.searxng.org/src/searx.botdetection.html): modules `http_accept` (Accept lacks text/html), `http_accept_language` ("evaluates a request as the request of a bot if the Accept-Language header is unset"), `http_user_agent`, `http_connection`, `http_accept_encoding`, and `http_sec_fetch` (https://github.com/searxng/searxng/blob/master/searx/botdetection/http_sec_fetch.py) requiring Mode ∈ {navigate, cors}, Dest ∈ {document, empty}, Site ∈ {same-origin, same-site, none}; it does not check Sec-Fetch-User.
- Caveat, Andrea Menin, "Sec-Fetch and Client Hints: a powerful tool against automation", 2025-12-16 (https://blog.sicuranext.com/sec-fetch-and-client-hints-a-powerful-tool-against-automation/): "If your rule thinks this is suspicious or 'bot-like', you will get completely normal traffic misclassified as automation", naming Android WebView and iOS WKWebView, which legitimately omit these headers. No per-tool test data given.
- Caveat, Google: "the crawler sends HTTP requests without setting Accept-Language in the request header." https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages. Missing Accept-Language correlates with well-behaved crawlers too.
- No commercial vendor (DataDome, Castle, Kasada) documents Sec-Fetch or Accept-Language as a named signal in official docs.

## 9. What tools call the good bucket

| Tool | Label | Definition | Source |
|---|---|---|---|
| Plausible | Unique Visitors | "The number of people who visited your site." | https://plausible.io/docs/metrics-definitions |
| Fathom | Visitors | "the number of unique individuals who visited your website during a 24-hour period." | https://usefathom.com/docs/start/dashboard |
| GoatCounter | Visits | "A 'visit' is the first time someone loads a page." | https://www.goatcounter.com/help/sessions |
| Umami | Visitors | "Unique number of sessions." | https://docs.umami.is/docs/metric-definitions |
| Matomo | Unique Visitors / Visits | "An unduplicated individual visiting your website" | https://matomo.org/faq/general/faq_43/ |
| Cloudflare Web Analytics | Visits | "A page view that originated from a different website or direct link." | https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/ |
| GA4 | Active users | "The number of unique users who engaged with your site or app" | https://support.google.com/analytics/answer/12253918 |

## Reading for our labels

No standards body offers a positive noun. Nobody says "Humans": MRC avoids it, Cloudflare hedges to "Likely human", every analytics tool uses a counting noun. The defensible move is a counting noun for the good bucket and borrowed terms for the exclusions where they are defined: GIVT categories for UA-list, data-center, non-browser-header, and prefetch checks.

## Uncertain

- Whether any MRC edition after 2020 + 2024 interim revises the GIVT/SIVT bullets.
- Which detections back Cloudflare Web Analytics' "Exclude bots".
- Whether Matomo checks `Sec-Purpose` anywhere else.
- Named referrer-spam list file inside plausible/analytics (only docs mention it).

# Native capability access receipt — October 25 Pacific / October 26 UTC

A signed-in Chrome dashboard inspection adds actual-access evidence after the full-interval capture and hardening release. Read-only product/dataset inspection; no settings, paid add-on, logging pipeline, credential grant or protection change was activated. Raw screenshots and accessibility captures contain private account/request data and stay outside Git.

## What was observed

| Surface | Visible result | Established scope / limit |
|---|---|---|
| gkoreli.com zone overview | Free plan; Active Subscriptions includes Workers Paid Plan | Current UI confirms the distinction previously only owner-reported. It does not establish Enterprise Bot Management or runtime population of signedAgent/verifiedBotCategory. |
| AI Crawl Control → Metrics | Last 7 days view loaded crawler/operator filters, status-code groups, content-type controls and populated crawler/path tables | The native analysis surface is accessible now. It includes assets, redirects and unsuccessful requests; no numerical comparison with eligible D1 page events is accepted. The rolling view is not the full September release interval. |
| Observability → Logs | HTTP requests selected; Last 1 hour; 50 returned rows; timestamp, method, host, path, edge status, cache status, source IP, country and origin-status columns | Recent request-event inspection is accessible through the dashboard. Source IP/request characteristics remain private. No complete retention, unsampled capture, bot-field population or exact D1 join was established. |
| Existing Web Analytics tab | The earlier October 20–26 filtered 117-load view remained visible | Merely revisiting this tab is not a fresh exported dataset or acceptance of a ratio. Its original sampling/path limits remain. |

## The new Logs interface needs a dataset distinction

Primary documentation rechecked:

- [Cloudflare Logs](https://developers.cloudflare.com/observability/logs/), updated October 2, 2026: one interface can inspect multiple datasets; fields and retention vary; request inspection can filter Ray IDs.
- [Datasets](https://developers.cloudflare.com/observability/logs/datasets/), updated October 15: HTTP requests may be the all-plan `httpRequestsAdaptive` sampled analytics dataset, requiring no new enablement. Adaptive sampling can omit events or estimate counts. Unsampled Log Explorer HTTP request datasets require the paid add-on. The UI label alone does not establish which dataset contract covers every displayed row.
- [Legacy Log Search](https://developers.cloudflare.com/observability/logs/log-explorer/log-search/), updated October 15: its datasets now share the Observability Logs page. Do not infer a purchased legacy pipeline from the newer menu.
- [AI traffic analysis](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/): platform crawler metrics have their own filters and population, separate from our successful-page definition.

This corrects an overly narrow access assumption: lacking a historical-query command in Wrangler does not mean the signed-in dashboard cannot show recent request records. It also prevents the opposite overclaim: a table of fifty requests is not proof of a complete unsampled archive.

## Next bounded native check

Identify the exact dataset and effective sampling/retention, then search a known controlled request by its returned Ray ID where retained. Record a positive match or an unmatched result without treating absence as zero traffic. For the R1 investigation, request October 24–25 with the exact hostname filter privately and inventory available UA/referrer/bot evidence before attributing an operator. D1 history has no Ray ID, so general time/path joins remain candidate correlations. This receipt has not completed that investigation or accessed every historical request.

Private evidence: `gk-native-zone-plan.jpg`, `gk-native-crawler-state.txt`, `gk-native-crawler.jpg`, `gk-native-http-logs-state.txt`, `gk-native-http-logs.jpg` in the dated full-interval/hardening archive. Their commitments accompany the release receipt. No IPs, private account emails or new unapproved referral names are published.

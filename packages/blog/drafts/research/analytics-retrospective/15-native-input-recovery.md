# Native input recovery — October 26, 2026 UTC

This supersedes the earlier actual-access gap in [research 11](11-native-access-receipt.md). It does not supersede the frozen D1 counts or establish complete native retention. The owner signed into the agent's in-app browser; the investigation used the supported Workers Observability interface, with no credential extraction, pricing acceptance, configuration change or new production SQL.

## What was actually accessible

Workers Logs and Traces were enabled. A retained `GET /` invocation exposed request headers, raw source address, network and geographic context, TLS details and provider request/trace identifiers. Its attempt and stored application messages shared an invocation identifier, 79 ms apart. That is one observed write sequence, not proof that every attempt succeeded or was logged.

The interface displayed a warning that events beyond 20 million/month would be sampled without accepting new pricing. We did not accept it. A selectable date window and a successful export do not establish an unsampled archive. Previously missing D1 inputs are therefore **partly recoverable in recent provider records**, rather than universally lost. This makes provider-log minimization, access and retention part of the privacy review, separate from the D1 table's schema.

## R1 recovery and replay

The native `cloudflare-workers` query selected the private R1 hostname in the Referer header, from October 24 00:00 through October 26 00:00 UTC, end exclusive. The interface showed 381 successful invocation records. The JSON export limit was 1,000; the downloaded file contained 381 distinct event IDs, with no missing IDs or truncation flags. Exact hostname matching was checked privately; the public alias remains R1.

The original 2,203,760-byte export has SHA-256 `e4c9446c2d143c5a1893fce8654e19e1ea3d985f9437d1a9167834ef24eecf66`. It stays outside Git in the restricted native-recovery evidence directory. Its manifest sets an investigation-copy retention review for October 31 UTC; no automatic deletion or provider-wide erasure promise is implied. Public hashes are capture commitments, not independent authentication of Cloudflare's records.

The [maintained analyzer](analyze-worker-cohort.mjs) replays the actual compiled metadata, classification and software parsers; [aggregate results](r1-native-replay.json) contain no raw UA, IP, referrer name, per-request URL or provider identifier. Run `pnpm -C packages/analytics test` before the analyzer. Its three tests cover real rule premises, output privacy canaries and invalid/duplicate/missing/truncated evidence.

| Measured native population | Result |
|---|---|
| Requests | 381 GETs; 288 October 24, 93 October 25 |
| Response status | 375 HTTP 200; 6 redirects |
| Declared software | 29 UA strings; Edge 93, Chromium 88, Firefox 90, Safari 110 |
| Parsed device claims | Desktop 355; mobile 26; these are declarations, not verified hardware |
| Native source diversity | 381 addresses, 238 ASNs, 44 countries; none is a person count |
| Fetch Metadata | All navigate/document, `Sec-Fetch-User: ?1`; same-origin 118, none 129, cross-site 134 |
| Identity evidence | No signature headers, named-client matches or populated native verified-bot category |
| Current-rule replay | All 381 match Browser; 375 of those have HTTP 200 |

The frozen D1 population has **378 R1 Browser observations** over these two days. The native export has **375 HTTP-200 requests**, plus six redirects. The difference of three is unresolved: neither an exact request join nor complete sampling/eligibility reconciliation was established. In particular, status 200 does not establish that an eligible HTML representation was served. Do not merge these denominators, rewrite historical classifications or infer missing individual rows.

Full UA recovery does not solve operator attribution. These headers can be sent by automation, and the export supplies no authenticated operator or request trigger. R1 remains included and unresolved. This evidence is stronger for testing our rule than for identifying who sent the traffic.

## Beacon configuration check

The excluded `/stats` route contained Cloudflare's versioned beacon script and no destination override. The inspected 31,853-byte vendor script has SHA-256 `637381256384554e1cc3309a62fb238a51b83e7f10b2a56d8ba15dbc73ca762e`. With that version configuration it selects the same-origin `/cdn-cgi/rum` destination, consistent with [Cloudflare's proxied-site documentation](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/). The existing `connect-src 'self'` permits that destination. Script presence does not prove execution or receipt; no production beacon success or CSP defect is inferred.

Next: use [known collection-stage trials](../edge-vs-rum/06-controlled-stage-experiment.md), then establish provider retention/sampling and production receipt evidence before expanding collection. The optional `private-v1` profile remains off; lawful basis, durable rights/opt-out handling, public small-cell exposure and long-lived linked-row retention remain open in [research 13](13-eu-us-collection-boundaries.md).

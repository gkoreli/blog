import { html } from '@nisli/core';
import { ANALYTICS_EVIDENCE_SINCE, DIAGNOSTIC_RETENTION_DAYS } from '@gkoreli/analytics/contracts';

const evidenceDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(new Date(`${ANALYTICS_EVIDENCE_SINCE}T00:00:00Z`));

export function privacyPage() {
  return html`<article class="post-content">
  <h1>Privacy</h1>

  <p>This is a personal engineering blog. Here's what's collected and why.</p>

  <h2>First-party analytics</h2>
  <p>From classifier version 2026-10-27.2, routine observations also retain closed derived classification evidence: all recognized client names and reviewed product aliases, their category agreement, a coarse browser-family claim, missing/listed/not-listed network evidence, navigation shape, the activation marker's presence/form, and a bounded referrer-context inconsistency flag. Unrecognized free-text products and raw User-Agent values are not copied into this record. These facts remain linked to the routine pseudonymous observation under its existing retention; they do not authenticate a device, person, purpose or vendor.</p>
  <p>From October 27, 2026 UTC, routine observations also retain the local signature-verification outcome/profile and derived coverage facts: which request components were authenticated, the signature's age and validity duration, its wire format, and the expiry-only replay policy. From October 28, 2026 UTC, successful verification also records the first-valid selection policy and counts of matched, tagged, attempted and unassessed signature candidates; these counts do not establish how many signers are valid. A separate assessment compares a verified key publisher with reviewed first-party directory origins; its review date, missing mappings and conflicts remain explicit. It is distinct from a documented promise to sign each client's requests. Any available Cloudflare verified-bot or signed-agent booleans and reviewed provider-category values are recorded separately; unavailable fields remain unknown. Category evidence distinguishes empty, unavailable and unrecognized inputs without retaining arbitrary source text. Raw signature bytes, key material, nonce values and the signed header values are not stored in this evidence record. These facts remain linked to the routine pseudonymous observation and share its retention; they do not establish a person's identity, authorization or reading.</p>

  <p>For a successful, non-prefetch GET that serves an HTML page or negotiated Markdown, this site records the page path, referring hostname, country, a daily pseudonymous client ID, a heuristic traffic class (browser, bot, or AI User-Agent), the matched User-Agent rule name when available, device type, the request's network (autonomous system number and organization name, such as an internet provider or cloud host), the values of the Fetch Metadata headers Sec-Fetch-Mode, Sec-Fetch-Dest, Sec-Fetch-Site, and Sec-Fetch-User when a browser sends them, whether the Accept header included HTML, and whether an Accept-Language header was present (the Accept and Accept-Language values themselves are not stored), whether the request is mine, and the UTC observation time. It does not record query strings, full referrer URLs, city, continent, raw IP addresses, or raw User-Agent strings in the main observation table. This request evidence has been collected since ${evidenceDate}.</p>

  <p>From collection version 2026-10-27.5, routine client-form evidence records exact mobile/tablet User-Agent markers, a coarse browser-family claim, the already-sent Sec-CH-UA-Mobile preference as mobile/non-mobile/absent/unsupported, and differing or conflicting indicators. No extra hints, device model or browser hardware probes are requested. The old three-value device field remains a deprecated compatibility heuristic with an explicit default flag in new evidence; current reports use the new claims and label earlier heuristics separately. Neither non-mobile preference nor missing markers authenticates desktop hardware. These derived facts remain linked to the observation and share its retention.</p>
  <p>For recognized client declarations with a configured public IP feed, the collector also compares the edge-supplied address with the vendor’s published ranges. The address stays in memory and is not sent to that vendor or added to this record. Stored facts include the method/profile, address availability/source/family, applicable-source identifiers, listed/nonlisted/unavailable/not-assessed outcomes, and the public feed’s digest, version, prefix count and fetch/validation/freshness times. These facts remain linked to the observation and are not anonymous. We do not perform reverse-DNS lookups or treat range membership as proof of a person, intent or readership. Unrecognized declarations do not trigger a feed lookup.</p>
  <p>The edge daily client ID is the first 128 bits of an HMAC-SHA-256 value derived from the site host, UTC date, IP address, and User-Agent using a secret key. The IP address and User-Agent are processed to create it. Raw IP addresses are not retained by this analytics model; User-Agent evidence, when retained, follows the separate diagnostic policy below. The ID can link requests within one UTC day; it is not anonymous, does not identify a person, and cannot establish the same client across dates, devices, or networks. Public stats exclude rows marked as mine; owner marking depends on server-side configuration and may not identify every request I make. Recording is best effort and uses no cookies.</p>

  <p>New page observations also distinguish external, internal, absent, and unusable referrers. For an internal referrer, only a recognized public blog page path is retained, without query strings or fragments. This supports aggregate reports of movement between pages. Arbitrary internal URLs, API paths, and confirmation or unsubscribe tokens are not retained as referring paths. Older records did not preserve this distinction and remain unknown where the original value was discarded.</p>

  <p>The browser-beacon dataset collected before August 26, 2026 remains intact. Its source table stores page path, cleaned referrer host/path, country, city, continent, a daily date-derived IP + User-Agent hash, heuristic traffic and device classes, owner status, and UTC time; it never stored raw IP addresses or raw User-Agent strings. A minimized, source-marked copy is included in public stats so the historical trends are not lost.</p>

  <p>Routine first-party observation rows are retained until I delete them; there is currently no automatic expiration for those rows. The source marker distinguishes historical beacon events from newer edge observations.</p>

  <p>Private operational logs record observation attempts and outcomes. Successful storage logs repeat a limited subset of the recorded classification, reviewed client declarations, verification outcome/profile, signature-coverage flags and any recorded candidate-selection counts, reviewed signer name and provider bot facts. The operation reference connects the receipt to its request's Cloudflare log context. From October 27, 2026 UTC, an available database row reference also links it to the exact stored event. Neither reference is included in public stats. These linked records follow separate provider-log retention and sampling, and restricted investigation-copy lifecycles. A missing receipt does not prove that a database write is missing.</p>

  <h2>Private request diagnostics</h2>

  <p>To investigate collection errors and incorrect traffic classifications, an optional private diagnostic layer can retain bounded, filtered User-Agent and Accept header evidence, claimed browser and operating-system family and major version, client form, coarse preferred language, response status, HTTP and TLS version/cipher, Cloudflare data-center code, request correlation references, and collection/verifier versions and outcomes. Capture is limited to recognized public pages. It does not request additional device information through browser probes.</p>

  <p>Names, email addresses, cookies, authorization, form bodies, unrestricted URL queries, full external referrers and precise location are not requested for this layer. Familiar identifying and credential patterns are filtered from header evidence; arbitrary client-supplied text is still treated as potentially personal. Redaction and truncation are recorded so incomplete evidence is not presented as an exact original. These records are private and are not included in public stats or joined to newsletter/account records.</p>

  <p>The optional layer is omitted when the request carries Global Privacy Control or Do Not Track. That does not disable the separate routine page counter described above. Diagnostic source records expire from private reads after ${DIAGNOSTIC_RETENTION_DAYS} days and are removed by scheduled cleanup; cleanup failure can delay physical removal. Cloudflare's database backup history can retain earlier states for up to thirty additional days. Restored copies must be cleaned before diagnostic access resumes. Routine operational logs and Cloudflare Web Analytics have separate retention and processing.</p>

  <p>For access, correction, deletion or objections concerning this processing, use the contact links below. A daily pseudonymous client ID does not establish a person's identity; I do not create a cross-day identity solely to answer such requests.</p>

  <h2>Cloudflare Web Analytics</h2>

  <p>Explicitly activated owner-excluded measurement trials can retain closed stage counters, a random trial reference, planned condition/operator labels and an expiration time. These references join to routine excluded observations and are not anonymous. Activation lasts at most fifteen minutes and receipt access requires the current-day owner mark. Counters become deletion-eligible 24 hours after activation ends; the nightly job performs bounded cleanup, so eligibility is not a maximum physical retention guarantee. The routine excluded observations retain the lifecycle described above. Planned labels do not establish actual human operation. These trials request no additional device probes and do not enable the optional raw diagnostic layer.</p>
  <p>Cloudflare Web Analytics is separate from the first-party dataset above. Its JavaScript beacon supplies Cloudflare's performance dashboard and does not feed this site's public <a href="/stats">stats</a>. Cloudflare may process request and browser data for that service; see <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Cloudflare's Privacy Policy</a>.</p>

  <h2>Newsletter</h2>

  <p>If you request a subscription, your email address is stored in a Cloudflare D1 database and sent to Resend to deliver confirmation and newsletter emails. You become a subscriber after opening the confirmation link and pressing the confirmation button. The signup record may also include the page where you subscribed, an allowlisted campaign source and campaign name, the referring site's hostname, a truncated request IP address, a browser user agent, and request and confirmation times.</p>

  <p>To limit unwanted confirmation emails and diagnose delivery failures, the site retains confirmation reservations for seven days. These records contain the email address, a random request identifier, a hashed confirmation token, timestamps, send outcome, and any returned provider message identifier and HTTP status. They are private operational records. An accepted send does not establish that an email reached the inbox. Routine confirmation diagnostics use the request identifier and outcome, without the address, form contents, or tokens.</p>

  <p>You can unsubscribe via the link in every newsletter. Confirmation emails also offer a way to block further confirmation requests for up to 90 days. Unsubscribed and bounced addresses, including their suppression state, are purged after 90 days; expired pending signup records are removed by nightly cleanup. An already admitted email may still arrive after an opt-out.</p>

  <h2>Bot protection</h2>

  <p>The newsletter signup form uses <a href="https://www.cloudflare.com/products/turnstile/" target="_blank" rel="noopener">Cloudflare Turnstile</a> when you submit a request. Turnstile analyses browser and network signals to assess automated abuse. Verification may require interaction and can fail; the form reports a problem and lets you retry. Cloudflare may process data as part of this assessment — see <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Cloudflare's Privacy Policy</a>.</p>

  <h2>Error diagnostics</h2>

  <p>If something breaks in the browser, a small first-party error report may be sent to help debug the problem. Reports include the page path, error message, component name, browser user agent, and coarse Cloudflare request metadata. They do not include email addresses, form contents, cookies, localStorage values, Turnstile tokens, or full URLs with query strings. Error reports are deleted after 30 days.</p>

  <h2>Other services</h2>

  <p>No advertising networks, social tracking pixels, or session recording are used. Cloudflare provides site infrastructure, Cloudflare Web Analytics, and Turnstile; Google Fonts supplies fonts.</p>

  <h2>Contact</h2>

  <p>Questions? Reach out on <a href="https://x.com/GogaKoreli" target="_blank" rel="noopener">X</a> or <a href="https://www.linkedin.com/in/goga-koreli/" target="_blank" rel="noopener">LinkedIn</a>.</p>

  <p>The license for everything published here is on the <a href="/license">license page</a>.</p>
</article>`;
}

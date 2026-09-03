import { staticHtml as html, raw } from '@nisli/core/static';
import { ANALYTICS_EVIDENCE_SINCE } from '@gkoreli/analytics/contracts';

const ext = (url: string) => raw(`href="${url}" target="_blank" rel="noopener"`);

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

  <p>For a successful, non-prefetch GET that serves an HTML page, this site records the page path, referring hostname, country, a daily pseudonymous client ID, a heuristic traffic class (browser, bot, or AI User-Agent), the matched User-Agent rule name when available, device type, the request's network (autonomous system number and organization name, such as an internet provider or cloud host), the values of the Fetch Metadata headers Sec-Fetch-Mode, Sec-Fetch-Dest, Sec-Fetch-Site, and Sec-Fetch-User when a browser sends them, whether the Accept header included HTML, and whether an Accept-Language header was present (the Accept and Accept-Language values themselves are not stored), whether the request is mine, and the UTC observation time. It does not record query strings, full referrer URLs, city, continent, raw IP addresses, or raw User-Agent strings for these edge observations. This request evidence has been collected since ${evidenceDate}.</p>

  <p>The edge daily client ID is the first 128 bits of an HMAC-SHA-256 value derived from the site host, UTC date, IP address, and User-Agent using a secret key. The IP address and User-Agent are processed transiently to create it but are not stored. The ID can link requests within one UTC day; it is not anonymous, does not identify a person, and cannot establish the same client across dates, devices, or networks. Public stats exclude rows marked as mine; owner marking depends on server-side configuration and may not identify every request I make. Recording is best effort and uses no cookies.</p>

  <p>The browser-beacon dataset collected before August 26, 2026 remains intact. Its source table stores page path, cleaned referrer host/path, country, city, continent, a daily date-derived IP + User-Agent hash, heuristic traffic and device classes, owner status, and UTC time; it never stored raw IP addresses or raw User-Agent strings. A minimized, source-marked copy is included in public stats so the historical trends are not lost.</p>

  <p>First-party analytics rows are retained until I delete them; there is currently no automatic expiration. The source marker distinguishes historical beacon events from newer edge observations.</p>

  <h2>Cloudflare Web Analytics</h2>

  <p>Cloudflare Web Analytics is separate from the first-party dataset above. Its JavaScript beacon supplies Cloudflare's performance dashboard and does not feed this site's public <a href="/stats">stats</a>. Cloudflare may process request and browser data for that service; see <a ${ext('https://www.cloudflare.com/privacypolicy/')}>Cloudflare's Privacy Policy</a>.</p>

  <h2>Newsletter</h2>

  <p>If you subscribe, your email address is stored in a Cloudflare D1 database. It's used exclusively to send you new articles. The signup record may also include the page where you subscribed, an allowlisted campaign source and campaign name, and the referring site's hostname — never a full referrer URL. You can unsubscribe at any time via the link in every email. Unsubscribed and bounced addresses are automatically purged after 90 days.</p>

  <h2>Bot protection</h2>

  <p>The newsletter signup form is protected by <a ${ext('https://www.cloudflare.com/products/turnstile/')}>Cloudflare Turnstile</a> (invisible mode). Turnstile analyses browser and network signals in the background to assess signup requests for automated abuse. No interaction is normally required. Cloudflare may process data as part of this assessment — see <a ${ext('https://www.cloudflare.com/privacypolicy/')}>Cloudflare's Privacy Policy</a>.</p>

  <h2>Error diagnostics</h2>

  <p>If something breaks in the browser, a small first-party error report may be sent to help debug the problem. Reports include the page path, error message, component name, browser user agent, and coarse Cloudflare request metadata. They do not include email addresses, form contents, cookies, localStorage values, Turnstile tokens, or full URLs with query strings. Error reports are deleted after 30 days.</p>

  <h2>Other services</h2>

  <p>No advertising networks, social tracking pixels, or session recording are used. Cloudflare provides site infrastructure, Cloudflare Web Analytics, and Turnstile; Google Fonts supplies fonts.</p>

  <h2>Contact</h2>

  <p>Questions? Reach out on <a ${ext('https://x.com/GogaKoreli')}>X</a> or <a ${ext('https://www.linkedin.com/in/goga-koreli/')}>LinkedIn</a>. <a href="/license">License</a>.</p>
</article>`;
}

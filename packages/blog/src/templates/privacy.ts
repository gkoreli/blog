import { html, raw } from 'nisli-static';

const ext = (url: string) => raw(`href="${url}" target="_blank" rel="noopener"`);

export function privacyTemplate() {
  return html`<article class="post-content">
  <h1>Privacy</h1>

  <p>This is a personal engineering blog. Here's what's collected and why.</p>

  <h2>Analytics</h2>

  <p>Page views are recorded server-side (path and referrer only) using a self-built analytics system running on Cloudflare Workers. No cookies. No cross-site tracking. No third-party scripts involved in analytics.</p>

  <h2>Newsletter</h2>

  <p>If you subscribe, your email address is stored in a Cloudflare D1 database. It's used exclusively to send you new articles. You can unsubscribe at any time via the link in every email. Unsubscribed and bounced addresses are automatically purged after 90 days.</p>

  <h2>Bot protection</h2>

  <p>The newsletter signup form is protected by <a ${ext('https://www.cloudflare.com/products/turnstile/')}>Cloudflare Turnstile</a> (invisible mode). Turnstile analyses browser and network signals in the background to verify requests are made by a human. No interaction is required from you. Cloudflare may process data as part of this verification — see <a ${ext('https://www.cloudflare.com/privacypolicy/')}>Cloudflare's Privacy Policy</a>.</p>

  <h2>No third-party tracking</h2>

  <p>No advertising networks, no social tracking pixels, no session recording. The only third-party service that touches a visitor's request is Cloudflare (infrastructure + Turnstile) and Google Fonts (font loading).</p>

  <h2>Contact</h2>

  <p>Questions? Reach out on <a ${ext('https://x.com/GogaKoreli')}>X</a> or <a ${ext('https://www.linkedin.com/in/goga-koreli/')}>LinkedIn</a>.</p>
</article>`;
}

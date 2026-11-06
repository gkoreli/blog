import { html } from '@nisli/core';

/** One target contract for the directory entry point and the full checker. */
export function siteCheckForm() {
  return html`<form class="ai-check-form" action="/ai-check" method="post" novalidate><label for="ai-check-url">Your public page URL</label><div class="ai-check-input-row"><input id="ai-check-url" name="url" type="text" inputmode="url" placeholder="your-site.com/article" required autocomplete="url" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="ai-check-input-help ai-check-url-error"><button type="submit">Check this page <span aria-hidden="true">→</span></button></div><p id="ai-check-url-error" class="ai-check-field-error" data-audit-field-error role="alert" hidden></p><p id="ai-check-input-help" class="tool-caption">Enter a domain or HTTPS URL. We’ll add https:// for you.</p><span class="ai-check-allowance">10 free checks per network address per UTC day · No account needed</span></form>`;
}

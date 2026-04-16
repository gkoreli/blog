import { html } from 'nisli-static';
import type { StaticResult } from 'nisli-static';

interface ArtifactMeta {
  label: string;
  value: string;
}

interface ArtifactSurfaceProps {
  className?: string;
  label: string;
  code?: string;
  meta: ArtifactMeta[];
  body: StaticResult;
  action: StaticResult;
  mark?: string;
  stamp?: StaticResult;
}

export function ArtifactSurface({ className, label, code, meta, body, action, mark, stamp }: ArtifactSurfaceProps) {
  const classes = className ? `artifact-surface ${className}` : 'artifact-surface';

  return html`<section class="${classes}">
    ${stamp ? html`<div class="artifact-stamp" aria-hidden="true">${stamp}</div>` : ''}
    <header class="artifact-header">
      <div class="artifact-topline">
        <p class="artifact-label">${label}</p>
        ${code ? html`<p class="artifact-code">${code}</p>` : ''}
      </div>
      <dl class="artifact-meta">
        ${meta.map(item => html`<div>
          <dt>${item.label}</dt>
          <dd>${item.value}</dd>
        </div>`)}
      </dl>
      ${mark ? html`<p class="artifact-mark">${mark}</p>` : ''}
    </header>
    <div class="artifact-body">
      ${body}
    </div>
    <div class="artifact-action">
      ${action}
    </div>
  </section>`;
}

interface ReplySlipProps {
  turnstileSiteKey: string;
}

export function ReplySlip({ turnstileSiteKey }: ReplySlipProps) {
  return html`<form id="sub-form" class="reply-slip subscribe-form" novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}>
    <label for="subscribe-email" class="reply-label subscribe-label">Reply address</label>
    <div class="reply-row subscribe-row">
      <input id="subscribe-email" type="email" name="email" class="reply-input subscribe-input" placeholder="your@email.com" required autocomplete="email">
      <button type="submit" class="reply-action subscribe-btn">Subscribe</button>
    </div>
    <p class="reply-note subscribe-note">No noise. Unsubscribe anytime.</p>
    <p class="subscribe-msg" aria-live="polite" role="status"></p>
    ${turnstileSiteKey ? html`<div class="turnstile-slot"></div>` : ''}
  </form>`;
}

export function DispatchSlip({ turnstileSiteKey }: ReplySlipProps) {
  return ArtifactSurface({
    className: 'dispatch-slip subscribe glass-panel glass-sage',
    label: 'Dispatch',
    code: 'GK-DISPATCH-001',
    meta: [
      { label: 'From', value: 'Goga Koreli' },
      { label: 'To', value: 'Readers who want the next one' },
      { label: 'Mode', value: 'Occasional' },
    ],
    mark: 'Filed from the workbench when there is something worth sending.',
    stamp: html`<img src="/icons/mail.svg" width="28" height="28" alt="">`,
    body: html`<h2 class="subscribe-title">A note when there is signal.</h2>
      <p class="subscribe-desc">No drip sequence. No growth hacks. Just the next essay from the build log.</p>`,
    action: ReplySlip({ turnstileSiteKey }),
  });
}

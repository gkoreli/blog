import { staticHtml as html, raw } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

interface ArtifactMeta {
  label: string;
  value: string;
}

interface ArtifactSurfaceProps {
  className?: string;
  labelledBy?: string;
  label: string;
  code?: string;
  meta?: ArtifactMeta[];
  body: StaticResult;
  action: StaticResult;
  mark?: string;
  stamp?: StaticResult;
}

export function ArtifactSurface({ className, labelledBy, label, code, meta = [], body, action, mark, stamp }: ArtifactSurfaceProps) {
  const classes = className ? `artifact-surface ${className}` : 'artifact-surface';
  const labelledByAttr = labelledBy ? raw(` aria-labelledby="${labelledBy}"`) : '';

  return html`<section class="${classes}"${labelledByAttr}>
    ${stamp ? html`<div class="artifact-stamp" aria-hidden="true">${stamp}</div>` : ''}
    <header class="artifact-header">
      <div class="artifact-topline">
        <p class="artifact-label">${label}</p>
        ${code ? html`<p class="artifact-code">${code}</p>` : ''}
      </div>
      ${meta.length > 0 ? html`<dl class="artifact-meta">
        ${meta.map(item => html`<div>
          <dt>${item.label}</dt>
          <dd>${item.value}</dd>
        </div>`)}
      </dl>` : ''}
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
  return html`<form id="sub-form" class="dispatch-form subscribe-form" novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}>
    <div class="dispatch-form-row">
      <input id="subscribe-email" type="email" name="email" class="dispatch-input subscribe-input" placeholder="your@email.com" required autocomplete="email">
      <button type="submit" class="dispatch-submit subscribe-btn">Subscribe</button>
    </div>
    <p class="dispatch-note">One essay per send · no drip · unsubscribe anytime</p>
    <p class="subscribe-msg" aria-live="polite" role="status"></p>
    ${turnstileSiteKey ? html`<div class="turnstile-slot"></div>` : ''}
  </form>`;
}

export function DispatchSlip({ turnstileSiteKey }: ReplySlipProps) {
  return ArtifactSurface({
    className: 'dispatch-slip',
    labelledBy: 'dispatch-title',
    label: 'Dispatch',
    code: 'GK-001',
    body: html`<h2 id="dispatch-title" class="dispatch-headline"><em>A note when there is signal.</em></h2>`,
    action: ReplySlip({ turnstileSiteKey }),
  });
}

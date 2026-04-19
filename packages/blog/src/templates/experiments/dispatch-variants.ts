import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

interface ReplySlipProps {
  turnstileSiteKey: string;
}

/* Experimental newsletter subscribe design sketches.
 * Pair with src/styles/dispatch-variants.css on a dedicated experiments page.
 */

/* ── Strata Variant A: Receipt Tape ── */
export function DispatchReceipt({ turnstileSiteKey }: ReplySlipProps) {
  const today = new Date().toISOString().slice(0, 10);
  return html`<section class="ds-receipt">
    <div class="ds-receipt-feed">
      <div class="ds-receipt-header">
        <p class="ds-receipt-title">DISPATCH</p>
        <p class="ds-receipt-date">${today}</p>
      </div>
      <div class="ds-receipt-divider">- - - - - - - - - - - - - - - - - - - -</div>
      <dl class="ds-receipt-meta">
        <div><dt>FROM</dt><dd>Goga Koreli</dd></div>
        <div><dt>TO</dt><dd>Readers who want the next one</dd></div>
        <div><dt>REF</dt><dd>GK-DISPATCH-001</dd></div>
        <div><dt>MODE</dt><dd>Occasional</dd></div>
      </dl>
      <div class="ds-receipt-divider">- - - - - - - - - - - - - - - - - - - -</div>
      <div class="ds-receipt-body">
        <p>A note when there is signal.</p>
        <p>No drip sequence. No growth hacks.</p>
        <p>Just the next essay from the build log.</p>
      </div>
      <div class="ds-receipt-divider">- - - - - - - - - - - - - - - - - - - -</div>
      <form class="ds-receipt-form" novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}>
        <label class="ds-receipt-form-label" for="receipt-email">REPLY ADDRESS</label>
        <div class="ds-receipt-row">
          <input id="receipt-email" class="ds-receipt-input" type="email" name="email" placeholder="your@email.com" required autocomplete="email">
          <button type="submit" class="ds-receipt-submit">SEND</button>
        </div>
        <p class="ds-receipt-note">No noise. Unsubscribe anytime.</p>
        ${turnstileSiteKey ? html`<div class="turnstile-slot"></div>` : ''}
      </form>
    </div>
    <div class="ds-receipt-tear"></div>
  </section>`;
}

/* ── Strata Variant B: Signal ── */
export function DispatchSignal({ turnstileSiteKey }: ReplySlipProps) {
  return html`<div class="ds-signal">
    <div class="ds-signal-header">
      <span class="ds-signal-label">DISPATCH</span>
      <span class="ds-signal-code">GK-DISPATCH-001</span>
    </div>
    <div class="ds-signal-meta">
      <span>Goga Koreli</span>
      <span class="ds-signal-sep">·</span>
      <span>Readers who want the next one</span>
      <span class="ds-signal-sep">·</span>
      <span>Occasional</span>
    </div>
    <div class="ds-signal-line"></div>
    <div class="ds-signal-body">
      <p>A note when there is signal.</p>
      <p>No drip sequence. No growth hacks. Just the next essay from the build log.</p>
    </div>
    <form class="ds-signal-form" novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}>
      <div class="ds-signal-prompt">
        <span class="ds-signal-cursor">&gt;</span>
        <input class="ds-signal-email" type="email" name="email" placeholder="your@email.com" required autocomplete="email">
      </div>
      <div class="ds-signal-foot">
        <span class="ds-signal-note">No noise. Unsubscribe anytime.</span>
        <button type="submit" class="ds-signal-submit">BROADCAST</button>
      </div>
      ${turnstileSiteKey ? html`<div class="turnstile-slot"></div>` : ''}
    </form>
    <div class="ds-signal-line"></div>
  </div>`;
}

/* ── Strata Variant C: Library Card ── */
export function DispatchCard({ turnstileSiteKey }: ReplySlipProps) {
  return html`<section class="ds-card">
    <div class="ds-card-catalog">
      <span class="ds-card-call">GK-DISPATCH-001</span>
      <span class="ds-card-type">SERIAL PUBLICATION</span>
    </div>
    <div class="ds-card-body">
      <div class="ds-card-entry">
        <span class="ds-card-key">AUTHOR</span>
        <span class="ds-card-val">Koreli, Goga</span>
        <span class="ds-card-key">TITLE</span>
        <span class="ds-card-val">Dispatch</span>
        <span class="ds-card-key">SUBJECT</span>
        <span class="ds-card-val">Engineering · Build Log · Signal</span>
        <span class="ds-card-key">FREQ.</span>
        <span class="ds-card-val">Occasional</span>
      </div>
      <p class="ds-card-desc">Filed from the workbench when there is something worth sending. No drip sequence. No growth hacks. Just the next essay.</p>
    </div>
    <form class="ds-card-form" novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}>
      <label class="ds-card-form-label" for="card-email">PATRON ADDRESS</label>
      <div class="ds-card-row">
        <input id="card-email" class="ds-card-input" type="email" name="email" placeholder="your@email.com" required autocomplete="email">
        <button type="submit" class="ds-card-submit">SIGN OUT</button>
      </div>
      <p class="ds-card-note">No noise. Unsubscribe anytime.</p>
      ${turnstileSiteKey ? html`<div class="turnstile-slot"></div>` : ''}
    </form>
  </section>`;
}

/* ── Strata Variant D: Schlieren — heat density field ── */
export function SchlierenFilters() { return html``; }

function schlierenShell(
  palette: 'heat' | 'brand',
  turnstileSiteKey: string,
  inputId: string,
) {
  return html`<div class="ds-schlieren" data-schlieren-host>
    <canvas class="sch-canvas" data-schlieren data-palette="${palette}" aria-hidden="true"></canvas>
    <div class="sch-content">
      <div class="sch-header">
        <span class="sch-label">DISPATCH</span>
        <span class="sch-code">GK-DISPATCH-001</span>
      </div>
      <div class="sch-meta">
        <div class="sch-meta-row"><span class="sch-meta-key">FROM</span><span>Goga Koreli</span></div>
        <div class="sch-meta-row"><span class="sch-meta-key">TO</span><span>Readers who want the next one</span></div>
        <div class="sch-meta-row"><span class="sch-meta-key">MODE</span><span>Occasional</span></div>
      </div>
      <div class="sch-body">
        <p>A note when there is signal.</p>
        <p>No drip sequence. No growth hacks. Just the next essay from the build log.</p>
      </div>
      <form class="sch-form" novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}>
        <label class="sch-form-label" for="${inputId}">REPLY ADDRESS</label>
        <div class="sch-row">
          <input id="${inputId}" class="sch-input" type="email" name="email" placeholder="your@email.com" required autocomplete="email">
          <button class="sch-submit" type="submit">SEND</button>
        </div>
        <p class="sch-note">No noise. Unsubscribe anytime.</p>
        ${turnstileSiteKey ? html`<div class="turnstile-slot"></div>` : ''}
      </form>
    </div>
  </div>`;
}

export function DispatchSchlieren({ turnstileSiteKey }: ReplySlipProps) {
  return schlierenShell('heat', turnstileSiteKey, 'sch-email');
}

export function DispatchSchlierenBloom({ turnstileSiteKey }: ReplySlipProps) {
  return schlierenShell('heat', turnstileSiteKey, 'sch-bloom-email');
}

export function DispatchSchlierenFilament({ turnstileSiteKey }: ReplySlipProps) {
  return schlierenShell('heat', turnstileSiteKey, 'sch-fil-email');
}

export function DispatchSchlierenBrand({ turnstileSiteKey }: ReplySlipProps) {
  return schlierenShell('brand', turnstileSiteKey, 'sch-brand-email');
}

export function SchlierenMark({ children, palette = 'brand' }: { children: StaticResult; palette?: 'heat' | 'brand' }) {
  return html`<div class="sch-mark" data-schlieren-host>
    <canvas class="sch-canvas" data-schlieren data-palette="${palette}" aria-hidden="true"></canvas>
    <div class="sch-content">${children}</div>
  </div>`;
}

/* ── Strata Variant E: Caustic — light through water ── */
export function DispatchCaustic({ turnstileSiteKey }: ReplySlipProps) {
  return html`<div class="ds-caustic">
    <canvas class="cst-canvas" aria-hidden="true"></canvas>
    <div class="cst-body">
      <div class="cst-header">
        <span class="cst-label">DISPATCH</span>
        <span class="cst-code">GK-DISPATCH-001</span>
      </div>
      <div class="cst-meta">
        <span>Goga Koreli</span>
        <span class="cst-sep">·</span>
        <span>Readers who want the next one</span>
        <span class="cst-sep">·</span>
        <span>Occasional</span>
      </div>
      <div class="cst-rule"></div>
      <div class="cst-body-text">
        <p>A note when there is signal.</p>
        <p>No drip sequence. No growth hacks. Just the next essay from the build log.</p>
      </div>
      <form class="cst-form" novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}>
        <div class="cst-prompt">
          <span class="cst-cursor">&gt;</span>
          <input class="cst-email" type="email" name="email" placeholder="your@email.com" required autocomplete="email">
        </div>
        <div class="cst-foot">
          <span class="cst-note">No noise. Unsubscribe anytime.</span>
          <button type="submit" class="cst-submit">BROADCAST</button>
        </div>
        ${turnstileSiteKey ? html`<div class="turnstile-slot"></div>` : ''}
      </form>
    </div>
  </div>`;
}

/* ── Strata Variant F: Interference — two grids, emergent moiré ── */
export function DispatchInterference({ turnstileSiteKey }: ReplySlipProps) {
  return html`<div class="ds-interference">
    <div class="if-header">
      <span class="if-label">DISPATCH</span>
      <div class="if-axes">
        <div>α  0°  · 90°</div>
        <div>β  4°  · 94°</div>
      </div>
    </div>
    <div class="if-meta">
      <div class="if-meta-row"><span class="if-meta-key">FROM</span><span>Goga Koreli</span></div>
      <div class="if-meta-row"><span class="if-meta-key">TO</span><span>Readers who want the next one</span></div>
      <div class="if-meta-row"><span class="if-meta-key">REF</span><span>GK-DISPATCH-001</span></div>
      <div class="if-meta-row"><span class="if-meta-key">MODE</span><span>Occasional</span></div>
    </div>
    <p class="if-body">A note when there is signal. No drip sequence. No growth hacks. Just the next essay from the build log.</p>
    <form class="if-form" novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}>
      <label class="if-form-label" for="if-email">REPLY ADDRESS</label>
      <div class="if-row">
        <input id="if-email" class="if-input" type="email" name="email" placeholder="your@email.com" required autocomplete="email">
        <button type="submit" class="if-submit">SEND</button>
      </div>
      <p class="if-note">No noise. Unsubscribe anytime.</p>
      ${turnstileSiteKey ? html`<div class="turnstile-slot"></div>` : ''}
    </form>
  </div>`;
}

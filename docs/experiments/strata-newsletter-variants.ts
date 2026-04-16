/**
 * STRATA — Newsletter Subscribe Variant Experiments
 *
 * Preserved from design exploration session (April 2026).
 * All variants render a subscribe form in a different "physical layer" aesthetic.
 *
 * To use: import and render in page.ts subscribe block, or create a /experiments route.
 * Canvas animations (schlieren, caustic) require /schlieren.js and /caustic.js to be loaded.
 */

import { html, raw } from 'nisli-static';
import type { StaticResult } from 'nisli-static';
import {
  DispatchReceipt,
  DispatchSignal,
  DispatchCard,
  DispatchSchlieren,
  DispatchSchlierenBloom,
  DispatchSchlierenFilament,
  DispatchSchlierenBrand,
  DispatchCaustic,
  DispatchInterference,
} from '../../packages/blog/src/templates/artifacts.js';

/**
 * Full demo block — all subscribe variants with labels.
 * Used during design exploration to compare variants side-by-side.
 */
export function strataDemo({ turnstileSiteKey = '' }: { turnstileSiteKey?: string } = {}): StaticResult {
  return html`<div class="strata-demo">
    <div>
      <p class="strata-demo-label">A — RECEIPT TAPE</p>
      ${DispatchReceipt({ turnstileSiteKey })}
    </div>
    <div>
      <p class="strata-demo-label">B — SIGNAL</p>
      ${DispatchSignal({ turnstileSiteKey })}
    </div>
    <div>
      <p class="strata-demo-label">C — LIBRARY CARD</p>
      ${DispatchCard({ turnstileSiteKey })}
    </div>
    <div>
      <p class="strata-demo-label">D — SCHLIEREN (heat density field)</p>
      ${DispatchSchlieren({ turnstileSiteKey })}
    </div>
    <div>
      <p class="strata-demo-label">D-ii — SCHLIEREN BLOOM (displaced glow)</p>
      ${DispatchSchlierenBloom({ turnstileSiteKey })}
    </div>
    <div>
      <p class="strata-demo-label">D-iii — SCHLIEREN FILAMENT (vertical plasma columns)</p>
      ${DispatchSchlierenFilament({ turnstileSiteKey })}
    </div>
    <div>
      <p class="strata-demo-label">D-iv — SCHLIEREN BRAND (deep green + mint + sky)</p>
      ${DispatchSchlierenBrand({ turnstileSiteKey })}
    </div>
    <div>
      <p class="strata-demo-label">E — CAUSTIC (light through water)</p>
      ${DispatchCaustic({ turnstileSiteKey })}
    </div>
    <div>
      <p class="strata-demo-label">F — INTERFERENCE (emergent moiré)</p>
      ${DispatchInterference({ turnstileSiteKey })}
    </div>
  </div>
  <script type="module" src="/caustic.js"></script>
  <script type="module" src="/schlieren.js"></script>`;
}

/*
 * VARIANT NOTES
 *
 * A — Receipt Tape (DispatchReceipt)
 *   Thermal paper aesthetic. Monospaced font, dashed dividers, tear-off bottom.
 *   CSS: .ds-receipt, .ds-receipt-feed, .ds-receipt-tear
 *
 * B — Signal (DispatchSignal)
 *   Terminal/broadcast aesthetic. Blinking cursor, > prompt, BROADCAST button.
 *   CSS: .ds-signal, .ds-signal-cursor, .ds-signal-prompt
 *
 * C — Library Card (DispatchCard)
 *   Catalog card aesthetic. DL grid for metadata, PATRON ADDRESS / SIGN OUT.
 *   CSS: .ds-card, .ds-card-catalog, .ds-card-entry
 *
 * D — Schlieren (DispatchSchlieren / Bloom / Filament / Brand)
 *   Canvas-based heat field animation. data-schlieren on <canvas>,
 *   data-schlieren-host on wrapper. Two palettes: 'heat' (amber/blue),
 *   'brand' (deep green/mint/sky). Single shared rAF loop in schlieren.ts,
 *   ~20fps throttle, focus convergence on focusin.
 *   CSS: .ds-schlieren, .sch-canvas, .sch-content (from strata.css)
 *
 * E — Caustic (DispatchCaustic)
 *   Canvas-based light-through-water animation. 22 Lissajous focal points,
 *   screen blend mode, ~60fps. canvas.cst-canvas picked up by caustic.ts.
 *   CSS: .ds-caustic, .cst-canvas, .cst-body
 *
 * F — Interference (DispatchInterference)
 *   CSS-only moiré pattern via two rotated grid layers. No canvas.
 *   CSS: .ds-interference, .if-header, .if-axes
 */

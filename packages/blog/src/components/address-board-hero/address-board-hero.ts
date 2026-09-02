import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

type BoardTap = {
  point: string;
  translation?: string;
  x: number;
  y: number;
  delay: number;
  mobileRow: number;
  position: 'spine' | 'branch';
  argument?: boolean;
  labelShift?: number;
};

const BOARD_TAPS: BoardTap[] = [
  { point: 'resid_pre.4', translation: 'blocks.4.hook_resid_pre', x: 13, y: 5, delay: 300, mobileRow: 1, position: 'spine' },
  { point: 'attn_in.4', x: 37, y: 17, delay: 560, mobileRow: 3, position: 'branch' },
  { point: 'attn_out.4', translation: 'blocks.4.attn.hook_out', x: 62, y: 27, delay: 820, mobileRow: 5, position: 'branch', labelShift: -50 },
  { point: 'attn_out_post.4', translation: 'blocks.4.hook_attn_out', x: 79, y: 37, delay: 1080, mobileRow: 7, position: 'branch', labelShift: -90 },
  { point: 'resid_mid.4', translation: 'blocks.4.hook_resid_mid', x: 13, y: 46, delay: 1340, mobileRow: 9, position: 'spine' },
  { point: 'mlp_in.4', x: 37, y: 57, delay: 1600, mobileRow: 11, position: 'branch' },
  { point: 'mlp_out.4', translation: 'blocks.4.mlp.hook_out', x: 62, y: 67, delay: 1860, mobileRow: 13, position: 'branch', labelShift: -50 },
  { point: 'mlp_out_post.4', translation: 'blocks.4.hook_mlp_out', x: 79, y: 77, delay: 2120, mobileRow: 15, position: 'branch', argument: true, labelShift: -90 },
  { point: 'resid_post.4', translation: 'blocks.4.hook_resid_post', x: 13, y: 90, delay: 2380, mobileRow: 17, position: 'spine' },
];

function tapNodes(): StaticResult[] {
  return BOARD_TAPS.map(tap => html`
    <span
      class="address-board-tap address-board-tap--${tap.position}${tap.argument ? ' address-board-tap--argument' : ''}"
      style="--address-board-x: ${tap.x}%; --address-board-y: ${tap.y}%; --address-board-tap-delay: ${tap.delay}ms; --address-board-label-shift: ${tap.labelShift ?? 0}%; --address-board-mobile-row: ${tap.mobileRow}"
    >
      <span class="address-board-tap-dot"></span>
      <span class="address-board-tap-copy">
        <code>${tap.point}</code>
        ${tap.translation ? html`<code class="address-board-mobile-translation">${tap.translation}</code>` : ''}
        ${tap.argument ? html`
          <span class="address-board-mobile-argument">
            <span class="address-board-mobile-mismatch">≠ same name, different tensor</span>
            <span class="address-board-mobile-resolved">✓ residual contribution</span>
            <span class="address-board-mobile-reduced">hook_mlp_out → mlp_out_post</span>
          </span>
        ` : ''}
      </span>
    </span>
  `);
}

type LedgerRow = {
  translation: string;
  x: number;
  y: number;
  delay: number;
  argument?: boolean;
};

const LEDGER_ROWS: LedgerRow[] = BOARD_TAPS.flatMap(tap => tap.translation ? [{
  translation: tap.translation,
  x: tap.x,
  y: tap.y,
  delay: tap.delay + 200,
  argument: tap.argument === true,
}] : []);

function ledgerRows(): StaticResult[] {
  return LEDGER_ROWS.map(row => html`
    <div
      class="address-board-ledger-row${row.argument ? ' address-board-ledger-row--argument' : ''}"
      style="--address-board-x: ${row.x * 0.58}%; --address-board-y: ${row.y}%; --address-board-row-delay: ${row.delay}ms"
    >
      <span class="address-board-ledger-entry">
        <code>${row.translation}</code>
        ${row.argument ? html`
          <span class="address-board-argument-state">
            <span class="address-board-argument-mismatch">≠</span>
            <span class="address-board-argument-check">✓</span>
          </span>
          <span class="address-board-argument-caption">
            <span class="address-board-caption-mismatch">same name, different tensor</span>
            <span class="address-board-caption-resolved">residual contribution</span>
            <span class="address-board-caption-reduced">hook_mlp_out → mlp_out_post</span>
          </span>
        ` : html`<span class="address-board-ledger-check">✓</span>`}
      </span>
    </div>
  `);
}

/**
 * AddressBoardHero — a no-JavaScript hook-address board for OSS Radar #06.
 *
 * The Gemma-2 block separates raw sublayer output from the post-norm residual
 * contribution. CSS adds the forward-pass sequence and resolves the one
 * intentionally mismatched TransformerLens block-level hook name.
 */
export function AddressBoardHero({
  issueNum,
  date,
  tags,
  title,
  subtitle,
  author,
  readTime,
  footprint,
}: {
  issueNum: string;
  date: string;
  tags: string;
  title: StaticResult;
  subtitle: string;
  author: string;
  readTime: string;
  footprint?: { label: string; url: string };
}) {
  return html`<div class="address-board-hero">
    <div class="address-board-heading">
      <div class="address-board-pills">
        <span class="address-board-pill address-board-pill--accent">${issueNum}</span>
        <span class="address-board-pill">${date}</span>
      </div>
      <span class="address-board-kicker">${tags}</span>
      ${title}
      <p class="address-board-subtitle">${subtitle}</p>
      <div class="address-board-byline">
        <span><strong>${author}</strong></span>
        <span class="address-board-byline-sep">·</span>
        <span>${readTime}</span>
      </div>
      ${footprint ? html`<a class="address-board-footprint" href="${footprint.url}">
        ${footprint.label} <span aria-hidden="true">↗</span>
      </a>` : ''}
    </div>

    <figure
      class="address-board-machine"
      role="img"
      aria-label="On a Gemma-2 sandwich-norm block, the TransformerLens name blocks.4.hook_mlp_out means the post-norm residual contribution, not the raw MLP output; interp-engine names the two tensors separately and validates the mapping."
    >
      <div class="address-board-machine-inner" aria-hidden="true">
        <div class="address-board-panel">
          <div class="address-board-block">
            <span class="address-board-block-title">Gemma-2 · decoder block · layer 4</span>
            <div class="address-board-diagram">
              <svg class="address-board-wiring" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path class="address-board-spine" d="M13 5 V90"></path>
                <path class="address-board-branch" d="M13 10 H22 V17 H37 L45 27 H62 L68 37 H79 L85 41 H88 V44 H13"></path>
                <path class="address-board-branch" d="M13 50 H22 V57 H37 L45 67 H62 L68 77 H79 L85 81 H88 V86 H13"></path>
              </svg>
              <span class="address-board-spine-pulse"></span>

              <span class="address-board-box address-board-box--attn-norm">norm</span>
              <span class="address-board-box address-board-box--attention">attention</span>
              <span class="address-board-box address-board-box--attn-post">post norm</span>
              <span class="address-board-add address-board-add--attention">+<small>add</small></span>

              <span class="address-board-box address-board-box--mlp-norm">norm</span>
              <span class="address-board-box address-board-box--mlp">MLP</span>
              <span class="address-board-box address-board-box--mlp-post">post norm</span>
              <span class="address-board-add address-board-add--mlp">+<small>add</small></span>

              ${tapNodes()}
            </div>
          </div>

          <div class="address-board-ledger-title">TransformerLens says</div>
          <div class="address-board-ledger-rule"></div>
          <div class="address-board-ledger-rows">${ledgerRows()}</div>
        </div>

        <p class="address-board-legend">34 points · one name each · checked against TransformerLens and nnsight</p>
      </div>
    </figure>
  </div>`;
}

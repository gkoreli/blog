import { html } from '@nisli/core';

/** One illustrated invitation; all content and the destination work without JavaScript. */
export function homeToolsInvitation(headingId = 'home-tools-heading') {
  return html`<section class="home-tools-invitation" aria-labelledby=${headingId}>
    <div class="home-tools-body">
      <div class="home-tools-copy">
        <h2 id=${headingId}>From notes to tools.</h2>
        <p>Check access. Test rules. Compare reports.</p>
      </div>
      <div class="home-tools-illustration" aria-hidden="true">
        <svg viewBox="0 0 250 154" fill="none" focusable="false">
          <path class="home-tools-grid" d="M0 38h250M0 77h250M0 116h250M42 0v154M83 0v154M125 0v154M167 0v154M208 0v154"/>
          <rect class="home-tools-paper" x="45" y="26" width="102" height="111" rx="8" transform="rotate(-8 45 26)"/>
          <rect class="home-tools-paper home-tools-paper-front" x="65" y="15" width="102" height="120" rx="8"/>
          <path class="home-tools-ink" d="M80 33h5m6 0h5m6 0h5M79 48h74M83 67l-7 7 7 7m15-14 7 7-7 7m-7-16-3 18M79 98h52m-52 9h37m-37 9h60"/>
          <path class="home-tools-trace" d="M157 75h37V49h30m-30 26v35h30"/>
          <circle class="home-tools-node" cx="194" cy="75" r="5"/>
          <rect class="home-tools-chip" x="211" y="36" width="28" height="28" rx="7"/>
          <rect class="home-tools-chip" x="211" y="96" width="28" height="28" rx="7"/>
          <path class="home-tools-symbol" d="m219 50 4 4 7-8m-10 61h10m-10 6h7"/>
          <circle class="home-tools-node" cx="38" cy="111" r="4"/>
          <path class="home-tools-trace" d="M38 107V88h21"/>
        </svg>
      </div>
    </div>
    <a class="home-tools-action" href="/tools">
      <span>Open the workbench</span>
    </a>
  </section>`;
}

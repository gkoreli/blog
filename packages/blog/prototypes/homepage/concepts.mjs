// Code-native illustrations: the diagrams describe tasks, never measured scores.
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const corner = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';

function accessDrawing() {
  return `<svg class="tool-drawing" viewBox="0 0 250 154" fill="none" aria-hidden="true">
    <path class="drawing-grid" d="M0 38h250M0 77h250M0 116h250M42 0v154M83 0v154M125 0v154M167 0v154M208 0v154"/>
    <rect class="drawing-paper" x="45" y="26" width="102" height="111" rx="8" transform="rotate(-8 45 26)"/>
    <rect class="drawing-paper drawing-front" x="65" y="15" width="102" height="120" rx="8"/>
    <path class="drawing-ink" d="M80 33h5m6 0h5m6 0h5M79 48h74M83 67l-7 7 7 7m15-14 7 7-7 7m-7-16-3 18M79 98h52m-52 9h37m-37 9h60"/>
    <path class="drawing-trace" d="M157 75h37V49h30m-30 26v35h30"/>
    <circle class="drawing-node" cx="194" cy="75" r="5"/>
    <rect class="drawing-chip" x="211" y="36" width="28" height="28" rx="7"/>
    <rect class="drawing-chip" x="211" y="96" width="28" height="28" rx="7"/>
    <path class="drawing-accent" d="m219 50 4 4 7-8m-10 61h10m-10 6h7"/>
    <circle class="drawing-node" cx="38" cy="111" r="4"/><path class="drawing-trace" d="M38 107V88h21"/>
  </svg>`;
}

function rulesDrawing() {
  return `<svg class="tool-drawing" viewBox="0 0 250 154" fill="none" aria-hidden="true">
    <path class="drawing-grid" d="M0 38h250M0 77h250M0 116h250M42 0v154M83 0v154M125 0v154M167 0v154M208 0v154"/>
    <rect class="drawing-paper" x="32" y="27" width="136" height="104" rx="8"/>
    <path class="drawing-ink" d="M47 46h7m7 0h7m7 0h7M47 64h72m-72 14h54m-54 14h67m-67 14h35"/>
    <path class="drawing-trace" d="M151 78h29V45h35m-35 33v35h35"/>
    <circle class="drawing-node" cx="180" cy="78" r="5"/>
    <circle class="drawing-chip" cx="219" cy="45" r="15"/><path class="drawing-accent" d="m212 45 5 5 8-9"/>
    <circle class="drawing-chip" cx="219" cy="113" r="15"/><path class="drawing-accent" d="m214 108 10 10m0-10-10 10"/>
  </svg>`;
}

function compareDrawing() {
  return `<svg class="tool-drawing" viewBox="0 0 250 154" fill="none" aria-hidden="true">
    <path class="drawing-grid" d="M0 38h250M0 77h250M0 116h250M42 0v154M83 0v154M125 0v154M167 0v154M208 0v154"/>
    <rect class="drawing-paper" x="31" y="28" width="78" height="104" rx="7" transform="rotate(-5 31 28)"/>
    <rect class="drawing-paper drawing-front" x="142" y="24" width="78" height="104" rx="7" transform="rotate(5 142 24)"/>
    <path class="drawing-ink" d="M46 47h38m-38 15h28m-28 15h38m-38 15h19m-19 15h30M156 45h38m-38 15h28m-28 15h38m-38 15h19m-19 15h30"/>
    <rect class="drawing-chip" x="108" y="60" width="33" height="33" rx="16.5"/>
    <path class="drawing-accent" d="M116 76h17m-5-5 5 5-5 5"/>
  </svg>`;
}

export const concepts = [
  {
    id: 'field-kit', label: '01 · Field kit',
    content: `<section class="home-tool-study field-kit" aria-labelledby="field-kit-title">
      <div class="kit-topline"><span class="study-kicker">From the workbench</span><span class="kit-mark" aria-hidden="true">GK / 01</span></div>
      <div class="kit-body"><div class="kit-copy"><h2 id="field-kit-title">Field notes,<br>meet field tools.</h2><p>See what reaches a client.<br>Find the rule. Follow the evidence.</p></div><div class="kit-illustration">${accessDrawing()}</div></div>
      <a class="study-action kit-action" href="/tools"><span>Open the workbench</span><span class="action-disc">${arrow}</span></a>
      <div class="kit-footnote"><span>Page access</span><span>Robots rules</span><span>Report comparison</span></div>
    </section>`,
  },
  {
    id: 'tool-shelf', label: '02 · Tool shelf',
    content: `<section class="home-tool-study tool-shelf" aria-labelledby="tool-shelf-title">
      <header class="shelf-heading"><div><span class="study-kicker">Built from the field notes</span><h2 id="tool-shelf-title">Made to be used.</h2></div><a class="shelf-all" href="/tools">All tools ${corner}</a></header>
      <div class="shelf-items">
        <a class="shelf-item shelf-access" href="/ai-check"><div class="shelf-visual">${accessDrawing()}<span class="shelf-number">01</span><span class="shelf-launch">${corner}</span></div><span class="shelf-name">AI access<br>check</span><span class="shelf-caption">See what’s readable</span></a>
        <a class="shelf-item shelf-rules" href="/tools/robots"><div class="shelf-visual">${rulesDrawing()}<span class="shelf-number">02</span><span class="shelf-launch">${corner}</span></div><span class="shelf-name">Robots<br>playground</span><span class="shelf-caption">Find the matching rule</span></a>
        <a class="shelf-item shelf-compare" href="/tools/compare"><div class="shelf-visual">${compareDrawing()}<span class="shelf-number">03</span><span class="shelf-launch">${corner}</span></div><span class="shelf-name">Report<br>comparison</span><span class="shelf-caption">See what changed</span></a>
      </div>
    </section>`,
  },
  {
    id: 'interactive-lens', label: '03 · Interactive lens',
    content: `<section class="home-tool-study interactive-lens" aria-labelledby="lens-title">
      <header class="lens-heading"><span class="study-kicker">A closer look</span><h2 id="lens-title">Make the web legible.</h2><p>Three small tools. A clearer picture.</p></header>
      <prototype-tool-lens>
        <div class="lens-tabs" aria-label="Explore the tools"><button type="button" id="tab-access" data-panel="access" aria-controls="panel-access">Page access</button><button type="button" id="tab-rules" data-panel="rules" aria-controls="panel-rules">Robots rules</button><button type="button" id="tab-compare" data-panel="compare" aria-controls="panel-compare">Changes</button></div>
        <div class="lens-panel" id="panel-access" data-tool-panel="access"><div class="lens-visual lens-access">${accessDrawing()}<span class="lens-annotation">HTML → client → evidence</span></div><div class="lens-detail"><div><h3>What can a client read?</h3><p>Inspect a page’s delivered HTML, crawler policy and discovery links.</p></div><a class="study-action" href="/ai-check"><span>Check a page</span>${arrow}</a></div></div>
        <div class="lens-panel" id="panel-rules" data-tool-panel="rules"><div class="lens-visual lens-rules">${rulesDrawing()}<span class="lens-annotation">Client + path → matching rule</span></div><div class="lens-detail"><div><h3>Which rule applies?</h3><p>Try a client and path against a robots.txt policy, right in your browser.</p></div><a class="study-action" href="/tools/robots"><span>Test a policy</span>${arrow}</a></div></div>
        <div class="lens-panel" id="panel-compare" data-tool-panel="compare"><div class="lens-visual lens-compare">${compareDrawing()}<span class="lens-annotation">Two reports → the differences</span></div><div class="lens-detail"><div><h3>What actually changed?</h3><p>Compare two saved reports and see the evidence behind the differences.</p></div><a class="study-action" href="/tools/compare"><span>Compare reports</span>${arrow}</a></div></div>
      </prototype-tool-lens>
      <a class="lens-directory" href="/tools">Visit the full workbench ${corner}</a>
    </section>`,
  },
];

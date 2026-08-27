import { staticHtml as html } from '@nisli/core/static';

interface LabExperiment {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly tagline: string;
  readonly status: string;
  readonly metricLabel: string;
  readonly substrates: readonly string[];
  readonly quick: string;
  readonly distilled: string;
  readonly rationale: readonly string[];
  readonly insights: readonly string[];
  readonly proves: readonly string[];
  readonly controls: readonly { readonly id: string; readonly label: string; readonly min: number; readonly max: number; readonly value: number; readonly step: number }[];
}

const EXPERIMENTS: readonly LabExperiment[] = [
  {
    id: 'ambient-drift',
    number: '01',
    title: 'Ambient Drift',
    tagline: 'Three depths of air move as one current.',
    status: 'baseline',
    metricLabel: 'Particles',
    substrates: ['Layered Emitters', 'Fields', 'Lozenges', 'Depth'],
    quick: 'Three particle layers move at different scales and speeds. Near flecks catch the eye; distant flecks make the field feel larger than the canvas.',
    distilled: 'Atmosphere needs depth, not more dots.',
    rationale: [
      'Validates the particle store, field substrate, material substrate, and baseline renderer path.',
      'Sets the taste threshold for motion that can live behind an article without stealing the article.',
      'Creates the performance baseline before more expressive motifs get layered on top.',
    ],
    insights: [
      'The runtime needs a calm register before it earns dramatic registers.',
      'Density is part of taste, not just a performance number.',
      'The field should read as atmosphere, not screensaver noise.',
    ],
    proves: [
      'A field-driven scene can remain legible and smooth.',
      'The publication can have background motion without becoming a toy.',
      'The base substrate is stable enough to build from.',
    ],
    controls: [
      { id: 'particles', label: 'Density', min: 48, max: 180, value: 112, step: 1 },
      { id: 'drift', label: 'Current', min: 20, max: 72, value: 34, step: 1 },
      { id: 'glow', label: 'Fleck Scale', min: 70, max: 130, value: 100, step: 1 },
    ],
  },
  {
    id: 'memory-zone',
    number: '02',
    title: 'Memory Zone',
    tagline: 'Motion gains meaning when space changes behavior.',
    status: 'semantic',
    metricLabel: 'Particles',
    substrates: ['Field', 'Zone', 'Event', 'Glow', 'Decay'],
    quick: 'Neutral frames enter from the left, cross a named memory chamber, and leave larger, warmer, and permanently changed.',
    distilled: 'A place becomes meaningful when what leaves it still carries the crossing.',
    rationale: [
      'Tests zone occupancy as a semantic primitive, not a renderer trick.',
      'Exercises one-time enter transitions whose color, size, alpha, and emissive state persist after exit.',
      'Makes before, inside, and remembered-after states visible in the same frame.',
    ],
    insights: [
      'The chamber is context; the changed travelers are the subject.',
      'Persistence makes memory legible without relying on color alone.',
      'A left-to-right itinerary reads more clearly than a uniform particle field.',
    ],
    proves: [
      'The zone model is worth keeping.',
      'Event-triggered effects can carry editorial meaning.',
      'Animation can encode place, not just movement.',
    ],
    controls: [
      { id: 'particles', label: 'Travelers', min: 80, max: 240, value: 150, step: 1 },
      { id: 'drift', label: 'Current', min: 20, max: 80, value: 42, step: 1 },
      { id: 'glow', label: 'Memory Heat', min: 20, max: 100, value: 60, step: 1 },
    ],
  },
  {
    id: 'text-emergence',
    number: '03',
    title: 'Text Emergence',
    tagline: 'The writing itself becomes a source of motion.',
    status: 'editorial',
    metricLabel: 'Particles',
    substrates: ['Text Source', 'Emitter', 'Field', 'Material'],
    quick: 'Two layers of upright ink fragments lift directly from the rendered glyphs while the word remains stable, bright, and unquestionably primary.',
    distilled: 'Language can shed material without surrendering its form.',
    rationale: [
      'Binds the runtime to publication composition instead of generic particle spectacle.',
      'Validates text-bound emitters as an authoring concept.',
      'Creates a path toward article heroes where prose and motion are one object.',
    ],
    insights: [
      'The text must remain primary. The motion is evidence of the text, not a replacement for it.',
      'Glyph sampling keeps every fragment tied to the actual letterforms.',
      'Core and ghost fragments need different scale, density, and lift to create a shaped plume rather than a cloud.',
    ],
    proves: [
      'The runtime belongs inside the publication voice.',
      'Text can act as an emitter and a composition anchor.',
      'Future museum pieces can be content-shaped, not only canvas-shaped.',
    ],
    controls: [
      { id: 'particles', label: 'Glyph Dust', min: 50, max: 180, value: 96, step: 1 },
      { id: 'drift', label: 'Lift', min: 20, max: 90, value: 54, step: 1 },
      { id: 'glow', label: 'Ink Light', min: 20, max: 80, value: 44, step: 1 },
    ],
  },
  {
    id: 'fracture-pulse',
    number: '04',
    title: 'Fracture Pulse',
    tagline: 'A hairline rupture, then silence.',
    status: 'event',
    metricLabel: 'Branches',
    substrates: ['Timeline', 'Polyline', 'Hierarchy', 'Silence'],
    quick: 'Most of the cycle is dark. A single fault tears outward through connected hairline branches, holds for a fraction of a second, then disappears.',
    distilled: 'Rupture is geometry plus timing. It is not a particle cloud.',
    rationale: [
      'Tests whether renderer-neutral lines can carry a discrete high-energy event.',
      'Makes silence part of the effect: the long calm interval gives the rupture consequence.',
      'Defines fracture as connected topology instead of glowing dots with tails.',
    ],
    insights: [
      'Hairline branches read as force only when they share a believable fault topology.',
      'Propagation should finish in under 300ms; afterglow should die before one second.',
      'Round particle heads, visible trigger zones, and constant motion destroy the fracture metaphor.',
    ],
    proves: [
      'Polyline primitives can reveal and decay through deterministic timeline bindings.',
      'The runtime can stage a short rupture without filling the scene with ambient motion.',
      'A high-energy motif can still preserve the publication’s restraint.',
    ],
    controls: [
      { id: 'particles', label: 'Branches', min: 4, max: 7, value: 7, step: 1 },
      { id: 'drift', label: 'Spread', min: 45, max: 90, value: 62, step: 1 },
      { id: 'glow', label: 'Afterglow', min: 20, max: 80, value: 45, step: 1 },
    ],
  },
];

function ExperimentSection(experiment: LabExperiment) {
  return html`<section class="al-experiment al-${experiment.id}" id="${experiment.id}" data-lab-experiment="${experiment.id}" data-stage-label="${experiment.metricLabel}">
    <header class="al-exp-header">
      <div>
        <div class="al-note-kicker">Experiment ${experiment.number}</div>
        <h2>${experiment.title}</h2>
        <p>${experiment.tagline}</p>
      </div>
      <div class="al-status">${experiment.status}</div>
    </header>

    <div class="al-stage-shell">
      <div class="al-stage">
        <canvas data-lab-canvas aria-label="${experiment.title} live animation"></canvas>
        <div class="al-stage-overlay">
          <span>${experiment.substrates.join(' / ')}</span>
          <span data-stage-particles>${experiment.metricLabel}: -</span>
        </div>
      </div>

      <aside class="al-console">
        <div class="al-panel-label">Scene controls</div>
        ${experiment.controls.map(control => html`<label>
          <span class="al-control-heading">
            <span>${control.label}</span>
            <output data-control-value="${control.id}">${control.value}</output>
          </span>
          <input type="range" min="${control.min}" max="${control.max}" value="${control.value}" step="${control.step}" data-control="${control.id}" data-default-value="${control.value}">
        </label>`)}

        <div class="al-panel-label al-debug-label">Timeline debugger</div>
        <label class="al-timeline-control">
          <span class="al-control-heading">
            <span>Playhead</span>
            <output data-timeline-value>0.00s / —</output>
          </span>
          <input type="range" min="0" max="1000" value="0" step="1" data-timeline-scrub disabled>
        </label>
        <div class="al-timeline-phase">
          <span>Phase</span>
          <strong data-timeline-phase>Continuous</strong>
        </div>

        <div class="al-actions">
          <button type="button" data-action="pause" aria-pressed="false">Freeze</button>
          <button type="button" data-action="restart">Restart</button>
          <button type="button" data-action="defaults">Defaults</button>
          <button type="button" data-action="stress" aria-pressed="false">Stress</button>
        </div>
        <div class="al-metrics" data-metrics>
          <div><span>Status</span><strong data-metric="status" aria-live="polite">Waiting</strong></div>
          <div><span>FPS</span><strong data-metric="fps">-</strong></div>
          <div><span>Frame</span><strong data-metric="frame">-</strong></div>
          <div><span>${experiment.metricLabel}</span><strong data-metric="particles">-</strong></div>
        </div>
        <details class="al-config">
          <summary>Scene manifest</summary>
          <pre data-config-snapshot>scene: ${experiment.id}
status: waiting for viewport</pre>
        </details>
      </aside>
    </div>

    <div class="al-exp-body">
      <div class="al-notes">
        <div class="al-substrates">${experiment.substrates.map(tag => html`<span>${tag}</span>`)}</div>

        <div class="al-note-block">
          <h3>Quick Explanation</h3>
          <p>${experiment.quick}</p>
        </div>

        <div class="al-distilled">
          <h3>Distilled</h3>
          <p>${experiment.distilled}</p>
        </div>

        <div class="al-note-grid">
          <div class="al-note-block">
            <h3>Rationale</h3>
            <ul>${experiment.rationale.map(item => html`<li>${item}</li>`)}</ul>
          </div>
          <div class="al-note-block">
            <h3>Insights</h3>
            <ul>${experiment.insights.map(item => html`<li>${item}</li>`)}</ul>
          </div>
          <div class="al-note-block">
            <h3>What This Proves</h3>
            <ul>${experiment.proves.map(item => html`<li>${item}</li>`)}</ul>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

export function animationsLabPage() {
  return html`<div class="al-page" data-animations-lab>
    <header class="al-header">
      <div class="al-header-rule"></div>
      <div class="al-header-top">
        <div>
          <div class="al-eyebrow">gkoreli / animations lab</div>
          <h1>Animations Lab</h1>
        </div>
        <div class="al-live">Live Experiments</div>
      </div>
      <p>Motion studies for the publication runtime. Each experiment gets its own stage, its own thesis, and enough room to be judged as an authored visual object.</p>
      <div class="al-header-meta">
        <a href="#ambient-drift">01 Ambient Drift</a>
        <a href="#memory-zone">02 Memory Zone</a>
        <a href="#text-emergence">03 Text Emergence</a>
        <a href="#fracture-pulse">04 Fracture Pulse</a>
      </div>
    </header>

    <div class="al-scroll-stack">
      ${EXPERIMENTS.map(ExperimentSection)}
    </div>
  </div>`;
}

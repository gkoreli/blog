import { staticHtml as html } from '@nisli/core/static';

interface LabExperiment {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly tagline: string;
  readonly status: string;
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
    tagline: 'The default breath of the system.',
    status: 'baseline',
    substrates: ['Emitter', 'Field', 'Material', 'Modulation'],
    quick: 'A low-density field that establishes the quiet life-sign of the runtime. This one is allowed to be restrained because it is the baseline.',
    distilled: 'Quiet motion only matters if restraint still feels alive.',
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
      { id: 'particles', label: 'Density', min: 60, max: 260, value: 140, step: 20 },
      { id: 'drift', label: 'Drift', min: 15, max: 90, value: 38, step: 5 },
      { id: 'glow', label: 'Glow', min: 10, max: 80, value: 32, step: 4 },
    ],
  },
  {
    id: 'memory-zone',
    number: '02',
    title: 'Memory Zone',
    tagline: 'Motion gains meaning when space changes behavior.',
    status: 'semantic',
    substrates: ['Field', 'Zone', 'Event', 'Glow', 'Decay'],
    quick: 'A visible memory chamber changes the behavior of particles that cross it. The point is semantic space: motion reacts to where it is.',
    distilled: 'Space is no longer neutral. It has memory, temperature, and consequence.',
    rationale: [
      'Tests zone occupancy as a semantic primitive, not a renderer trick.',
      'Exercises enter and continuous-in-zone effects through the pipeline.',
      'Makes the user see why zones matter before reading the implementation notes.',
    ],
    insights: [
      'A zone has to be visually authored; invisible geofences read as random particles.',
      'Warmth and persistence make spatial meaning legible faster than raw particle count.',
      'The effect needs slow decay so memory feels like memory.',
    ],
    proves: [
      'The zone model is worth keeping.',
      'Event-triggered effects can carry editorial meaning.',
      'Animation can encode place, not just movement.',
    ],
    controls: [
      { id: 'particles', label: 'Travelers', min: 80, max: 320, value: 180, step: 20 },
      { id: 'drift', label: 'Current', min: 15, max: 100, value: 44, step: 5 },
      { id: 'glow', label: 'Memory Heat', min: 10, max: 110, value: 58, step: 4 },
    ],
  },
  {
    id: 'text-emergence',
    number: '03',
    title: 'Text Emergence',
    tagline: 'The writing itself becomes a source of motion.',
    status: 'editorial',
    substrates: ['Text Source', 'Emitter', 'Field', 'Material'],
    quick: 'Literal text anchors the scene. The title remains visible while particles lift from its bounds and drift into the surrounding field.',
    distilled: 'If motion can emerge from language, the engine has found its home.',
    rationale: [
      'Binds the runtime to publication composition instead of generic particle spectacle.',
      'Validates text-bound emitters as an authoring concept.',
      'Creates a path toward article heroes where prose and motion are one object.',
    ],
    insights: [
      'The text must remain primary. The motion is evidence of the text, not a replacement for it.',
      'Bounds are acceptable for v1, but glyph-aware emission is the real next step.',
      'Editorial animation should make language feel physical.',
    ],
    proves: [
      'The runtime belongs inside the publication voice.',
      'Text can act as an emitter and a composition anchor.',
      'Future museum pieces can be content-shaped, not only canvas-shaped.',
    ],
    controls: [
      { id: 'particles', label: 'Glyph Dust', min: 70, max: 260, value: 150, step: 10 },
      { id: 'drift', label: 'Lift', min: 15, max: 100, value: 58, step: 5 },
      { id: 'glow', label: 'Ink Light', min: 10, max: 95, value: 46, step: 4 },
    ],
  },
  {
    id: 'fracture-pulse',
    number: '04',
    title: 'Fracture Pulse',
    tagline: 'A restrained rupture: intensity used as punctuation.',
    status: 'volatile',
    substrates: ['Event', 'Pulse', 'Electric Material', 'Pipeline'],
    quick: 'A calm field is interrupted by sharp fracture geometry and electric particles. The point is controlled rupture, not constant chaos.',
    distilled: 'The system needs a way to break composure without losing taste.',
    rationale: [
      'Adds dynamic contrast after the quiet and semantic experiments.',
      'Tests temporary intensity as punctuation rather than decoration.',
      'Defines what high-energy article moments could look like without becoming generic VFX.',
    ],
    insights: [
      'Sparse fracture lines read stronger than noisy sparks.',
      'The reset back to calm is part of the design.',
      'Volatile effects should be hard to promote into core until they survive restraint.',
    ],
    proves: [
      'The runtime can carry expressive contrast.',
      'Events and pulse-like modulation deserve first-class treatment.',
      'The visual language can include tension without becoming tacky.',
    ],
    controls: [
      { id: 'particles', label: 'Charge', min: 60, max: 300, value: 150, step: 20 },
      { id: 'drift', label: 'Instability', min: 20, max: 130, value: 78, step: 5 },
      { id: 'glow', label: 'Voltage', min: 20, max: 140, value: 92, step: 4 },
    ],
  },
];

function StageArt(experiment: LabExperiment) {
  if (experiment.id === 'memory-zone') {
    return html`<div class="al-memory-field" aria-hidden="true">
      <div class="al-memory-core">MEMORY</div>
      <div class="al-memory-edge edge-a"></div>
      <div class="al-memory-edge edge-b"></div>
    </div>`;
  }

  if (experiment.id === 'text-emergence') {
    return html`<div class="al-text-art" aria-hidden="true">
      <div class="al-text-source-line line-a"></div>
      <div class="al-text-source-line line-b"></div>
    </div>`;
  }

  if (experiment.id === 'fracture-pulse') {
    return html`<div class="al-fracture-art" aria-hidden="true">
      <span class="crack c1"></span>
      <span class="crack c2"></span>
      <span class="crack c3"></span>
      <span class="crack c4"></span>
      <span class="crack c5"></span>
      <div class="al-pulse-core">PULSE</div>
    </div>`;
  }

  return html`<div class="al-ambient-art" aria-hidden="true">
    <span></span>
    <span></span>
    <span></span>
  </div>`;
}

function ExperimentSection(experiment: LabExperiment) {
  return html`<section class="al-experiment al-${experiment.id}" id="${experiment.id}" data-lab-experiment="${experiment.id}">
    <header class="al-exp-header">
      <div>
        <div class="al-note-kicker">Experiment ${experiment.number}</div>
        <h2>${experiment.title}</h2>
        <p>${experiment.tagline}</p>
      </div>
      <div class="al-status">${experiment.status}</div>
    </header>

    <div class="al-stage">
      <canvas data-lab-canvas aria-label="${experiment.title} live animation"></canvas>
      ${StageArt(experiment)}
      <div class="al-stage-overlay">
        <span>${experiment.substrates.join(' / ')}</span>
        <span data-stage-particles>Particles: -</span>
      </div>
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

      <aside class="al-console">
        <div class="al-panel-label">Controls</div>
        ${experiment.controls.map(control => html`<label>
          <span>${control.label}</span>
          <input type="range" min="${control.min}" max="${control.max}" value="${control.value}" step="${control.step}" data-control="${control.id}">
        </label>`)}
        <div class="al-actions">
          <button type="button" data-action="pause">Pause</button>
          <button type="button" data-action="reset">Reset</button>
          <button type="button" data-action="stress">Stress</button>
        </div>
        <div class="al-metrics" data-metrics>
          <div><span>Status</span><strong data-metric="status">Waiting</strong></div>
          <div><span>FPS</span><strong data-metric="fps">-</strong></div>
          <div><span>Frame</span><strong data-metric="frame">-</strong></div>
          <div><span>Particles</span><strong data-metric="particles">-</strong></div>
        </div>
        <pre data-config-snapshot>scene: ${experiment.id}
status: waiting for viewport</pre>
      </aside>
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

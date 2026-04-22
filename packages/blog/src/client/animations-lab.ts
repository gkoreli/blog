import {
  createScene,
  defineRectZone,
  electricMaterial,
  glowMaterial,
  noiseField,
  particles,
  pointEmitter,
  rectEmitter,
  textSource,
  textBoxEmitter,
  timeTimeline,
} from '@gkoreli/animation/authoring';
import { compileScene } from '@gkoreli/animation/compile';
import type { CompiledRuntimeScene } from '@gkoreli/animation/compile';
import {
  add,
  applyFieldVelocity,
  decayAlpha,
  insideZone,
  multiply,
  onEnterZone,
  pipe,
  timelinePulse,
} from '@gkoreli/animation/effects';
import { mountScene } from '@gkoreli/animation/core';
import type { MountedScene, RuntimePrimitive, RuntimeUpdateContext } from '@gkoreli/animation/core';
import { createPixiRenderer } from '@gkoreli/animation/renderer-pixi';

interface LabSceneTuning {
  readonly particles: number;
  readonly drift: number;
  readonly glow: number;
}

interface LabSceneConfig {
  readonly id: string;
  readonly zones: number;
  readonly stages: number;
  readonly snapshot: string;
  createScene(tuning: LabSceneTuning, stress: boolean): CompiledRuntimeScene;
}

interface LabRuntime {
  readonly section: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly stageParticles: HTMLElement;
  readonly snapshot: HTMLElement;
  readonly actionButtons: readonly HTMLButtonElement[];
  readonly controlInputs: readonly HTMLInputElement[];
  readonly metricValues: ReadonlyMap<string, HTMLElement>;
  readonly config: LabSceneConfig;
  host: LabSceneHost | undefined;
  scene: CompiledRuntimeScene | undefined;
  mounted: MountedScene | undefined;
  paused: boolean;
  stress: boolean;
  metricsFrame: number;
  lastMetricAt: number;
  metricTickCount: number;
}

class LabSceneHost implements CompiledRuntimeScene {
  constructor(private current: CompiledRuntimeScene) {}

  get id(): string {
    return this.current.id;
  }

  get plan(): CompiledRuntimeScene['plan'] {
    return this.current.plan;
  }

  replace(scene: CompiledRuntimeScene): void {
    const previous = this.current;
    this.current = scene;
    previous.dispose();
  }

  update(context: RuntimeUpdateContext): void {
    this.current.update(context);
  }

  primitives(): readonly RuntimePrimitive[] {
    return this.current.primitives();
  }

  particleBatches(): ReturnType<CompiledRuntimeScene['particleBatches']> {
    return this.current.particleBatches();
  }

  dispose(): void {
    this.current.dispose();
  }
}

const SCENES: readonly LabSceneConfig[] = [
  {
    id: 'ambient-drift',
    zones: 0,
    stages: 3,
    snapshot: 'substrates: emitter, field, material, timeline\nvisual thesis: ambient motion must survive restraint',
    createScene: (tuning, stress) => compileScene(
      createScene('lab-ambient-drift')
        .field('flow', noiseField({ strength: stress ? scaleControl(0.58, tuning.drift, 38) : scaleControl(0.32, tuning.drift, 38), scale: 2.8, speed: 0.28, seed: 11 }))
        .material('thought', glowMaterial({ color: '#6ec9a8', radius: scaleControl(2.1, tuning.glow, 32), alpha: 0.68, emissive: scaleControl(0.22, tuning.glow, 32), trail: 0.08 }))
        .emitter('field', rectEmitter({
          x: 0.08,
          y: 0.14,
          width: 0.84,
          height: 0.72,
          rate: stress ? 110 : emissionRate(30, tuning.particles, 140),
          material: 'thought',
          speed: { min: 0.01, max: 0.04 },
          lifetime: { min: 5.2, max: 9 },
        }))
        .timeline('breath', timeTimeline({ inputStart: 0, inputEnd: 1, outputStart: 0.18, outputEnd: 0.88 }))
        .system('particles', particles({
          emitter: 'field',
          material: 'thought',
          capacity: stress ? 460 : tuning.particles,
          pipes: [
            pipe('soft-flow', [applyFieldVelocity('flow', stress ? scaleControl(1.35, tuning.drift, 38) : scaleControl(0.78, tuning.drift, 38)), decayAlpha({ rate: 0.022 })]),
            pipe('breath', [timelinePulse('breath', 'alpha', { min: 0.3, max: 0.76 })]),
          ],
        }))
        .build(),
    ),
  },
  {
    id: 'memory-zone',
    zones: 1,
    stages: 5,
    snapshot: 'substrates: field, zone, event, glow, decay\nvisual thesis: space can carry memory',
    createScene: (tuning, stress) => compileScene(
      createScene('lab-memory-zone')
        .field('current', noiseField({ strength: stress ? scaleControl(0.72, tuning.drift, 44) : scaleControl(0.42, tuning.drift, 44), scale: 2.1, speed: 0.36, seed: 21 }))
        .material('traveler', glowMaterial({ color: '#e8c87a', radius: scaleControl(2.3, tuning.glow, 58), alpha: 0.72, emissive: scaleControl(0.46, tuning.glow, 58), trail: 0.16 }))
        .zone('memory', defineRectZone({ x: 0.25, y: 0.24, width: 0.5, height: 0.46, tags: ['memory'] }))
        .emitter('travelers', rectEmitter({
          x: 0.04,
          y: 0.16,
          width: 0.92,
          height: 0.68,
          rate: stress ? 120 : emissionRate(40, tuning.particles, 180),
          material: 'traveler',
          speed: { min: 0.012, max: 0.052 },
          lifetime: { min: 4.4, max: 7.6 },
        }))
        .system('particles', particles({
          emitter: 'travelers',
          material: 'traveler',
          capacity: stress ? 520 : tuning.particles,
          pipes: [
            pipe('field', [applyFieldVelocity('current', stress ? scaleControl(1.45, tuning.drift, 44) : scaleControl(0.9, tuning.drift, 44)), decayAlpha({ rate: 0.028 })]),
            pipe('memory-transition', [onEnterZone('memory', add('emissive', scaleControl(0.32, tuning.glow, 58))), insideZone('memory', multiply('radius', 1.008))]),
          ],
        }))
        .build(),
    ),
  },
  {
    id: 'text-emergence',
    zones: 0,
    stages: 3,
    snapshot: 'substrates: text source, glyph sampler, field, material\nvisual thesis: language can be the emitter',
    createScene: (tuning, stress) => compileScene(
      createScene('lab-text-emergence')
        .field('lift', noiseField({ strength: stress ? scaleControl(0.48, tuning.drift, 58) : scaleControl(0.24, tuning.drift, 58), scale: 3.2, speed: 0.28, seed: 31 }))
        .material('ink', glowMaterial({ color: '#93c5fd', radius: scaleControl(1.55, tuning.glow, 46), alpha: 0.62, emissive: scaleControl(0.34, tuning.glow, 46), trail: 0.08 }))
        .textSource('depth-word-source', textSource({
          text: 'DEPTH',
          x: 0.16,
          y: 0.31,
          width: 0.68,
          height: 0.24,
          fontSize: 0.72,
          fontWeight: '700',
          color: '#faf8f5',
          alpha: 0.88,
          letterSpacing: 0,
          glow: {
            color: '#93c5fd',
            alpha: scaleControl(0.34, tuning.glow, 50),
            blur: scaleControl(22, tuning.glow, 50),
          },
          debugBounds: stress,
          tags: ['source', 'text'],
        }))
        .emitter('depth-word', textBoxEmitter({
          x: 0.16,
          y: 0.31,
          width: 0.68,
          height: 0.24,
          source: 'depth-word-source',
          rate: stress ? 110 : emissionRate(26, tuning.particles, 150),
          material: 'ink',
          direction: { min: -2.24, max: -0.9 },
          speed: { min: 0.012, max: 0.045 },
          lifetime: { min: 1.8, max: 4.2 },
        }))
        .timeline('loosen', timeTimeline({ inputStart: 0, inputEnd: 1, outputStart: 0.2, outputEnd: 0.95 }))
        .system('particles', particles({
          emitter: 'depth-word',
          material: 'ink',
          capacity: stress ? 580 : tuning.particles,
          pipes: [
            pipe('emergence', [applyFieldVelocity('lift', stress ? scaleControl(0.9, tuning.drift, 58) : scaleControl(0.42, tuning.drift, 58)), decayAlpha({ rate: 0.072 })]),
            pipe('loosen', [timelinePulse('loosen', 'alpha', { min: 0.2, max: 0.68 })]),
          ],
        }))
        .build(),
    ),
  },
  {
    id: 'fracture-pulse',
    zones: 1,
    stages: 4,
    snapshot: 'substrates: event, pulse, electric material, pipeline\nvisual thesis: rupture should be sparse and intentional',
    createScene: (tuning, stress) => compileScene(
      createScene('lab-fracture-pulse')
        .field('charge', noiseField({ strength: stress ? scaleControl(1.15, tuning.drift, 78) : scaleControl(0.66, tuning.drift, 78), scale: 4.6, speed: 0.74, seed: 41 }))
        .material('arc', electricMaterial({ color: '#67e8f9', radius: scaleControl(2, tuning.glow, 92), alpha: 0.78, emissive: scaleControl(0.72, tuning.glow, 92), trail: 0.2 }))
        .zone('threshold', defineRectZone({ x: 0.16, y: 0.38, width: 0.68, height: 0.22, tags: ['fracture'] }))
        .emitter('pulse', pointEmitter({
          x: 0.5,
          y: 0.5,
          rate: stress ? 100 : emissionRate(24, tuning.particles, 150),
          burst: stress ? 12 : 4,
          material: 'arc',
          speed: { min: 0.055, max: 0.16 },
          lifetime: { min: 1.1, max: 3.5 },
        }))
        .timeline('surge', timeTimeline({ inputStart: 0, inputEnd: 1, outputStart: 0.1, outputEnd: 1 }))
        .system('particles', particles({
          emitter: 'pulse',
          material: 'arc',
          capacity: stress ? 400 : tuning.particles,
          pipes: [
            pipe('charge', [applyFieldVelocity('charge', stress ? scaleControl(2.2, tuning.drift, 78) : scaleControl(1.35, tuning.drift, 78)), decayAlpha({ rate: 0.08 })]),
            pipe('threshold', [insideZone('threshold', multiply('radius', 1.012)), timelinePulse('surge', 'alpha', { min: 0.18, max: 0.96 })]),
          ],
        }))
        .build(),
    ),
  },
];

const labRoot = document.querySelector('[data-animations-lab]');
if (labRoot instanceof HTMLElement) {
  initLab(labRoot);
}

function initLab(root: HTMLElement): void {
  const runtimes = Array.from(root.querySelectorAll('[data-lab-experiment]'))
    .filter(isElement)
    .map(createRuntime)
    .filter(isRuntime);

  for (const runtime of runtimes) {
    bindRuntime(runtime);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!(entry.target instanceof HTMLElement)) continue;

      const runtime = runtimes.find(item => item.section === entry.target);
      if (!runtime || runtime.mounted) continue;
      void loadScene(runtime);
    }
  }, { rootMargin: '420px 0px', threshold: 0.08 });

  for (const runtime of runtimes) {
    observer.observe(runtime.section);
  }
}

function createRuntime(section: HTMLElement): LabRuntime | undefined {
  const experimentId = section.dataset.labExperiment;
  const config = SCENES.find(item => item.id === experimentId);
  const canvas = section.querySelector('[data-lab-canvas]');
  const stageParticles = section.querySelector('[data-stage-particles]');
  const snapshot = section.querySelector('[data-config-snapshot]');

  if (!config || !(canvas instanceof HTMLCanvasElement) || !(stageParticles instanceof HTMLElement) || !(snapshot instanceof HTMLElement)) {
    return undefined;
  }

  const actionButtons = Array.from(section.querySelectorAll('[data-action]')).filter(isButton);
  const controlInputs = Array.from(section.querySelectorAll('[data-control]')).filter(isInput);
  const metricValues = new Map(
    Array.from(section.querySelectorAll('[data-metric]'))
      .filter(isElement)
      .map(element => [element.dataset.metric ?? '', element]),
  );

  return {
    section,
    canvas,
    stageParticles,
    snapshot,
    actionButtons,
    controlInputs,
    metricValues,
    config,
    host: undefined,
    scene: undefined,
    mounted: undefined,
    paused: false,
    stress: false,
    metricsFrame: 0,
    lastMetricAt: performance.now(),
    metricTickCount: 0,
  };
}

function bindRuntime(runtime: LabRuntime): void {
  for (const button of runtime.actionButtons) {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'pause') {
        togglePause(runtime, button);
      } else if (button.dataset.action === 'reset') {
        void loadScene(runtime);
      } else if (button.dataset.action === 'stress') {
        runtime.stress = !runtime.stress;
        runtime.section.classList.toggle('is-stress', runtime.stress);
        button.classList.toggle('active', runtime.stress);
        button.textContent = runtime.stress ? 'Stress On' : 'Stress';
        void loadScene(runtime);
      }
    });
  }

  for (const input of runtime.controlInputs) {
    input.addEventListener('change', () => {
      void loadScene(runtime);
    });
  }
}

async function loadScene(runtime: LabRuntime): Promise<void> {
  const tuning = readTuning(runtime);
  const scene = runtime.config.createScene(tuning, runtime.stress);
  runtime.metricsFrame = cancelFrame(runtime.metricsFrame);
  runtime.lastMetricAt = performance.now();
  runtime.metricTickCount = 0;
  runtime.scene = scene;
  runtime.section.classList.add('is-loading');
  runtime.snapshot.textContent = `scene: ${runtime.config.id}
${runtime.config.snapshot}
particles: ${tuning.particles}
drift: ${tuning.drift}
glow: ${tuning.glow}
stress: ${runtime.stress ? 'on' : 'off'}`;
  setMetric(runtime, 'status', 'Loading');

  const existingHost = runtime.host;
  if (existingHost) {
    existingHost.replace(scene);
    runtime.section.classList.remove('is-loading');
    runtime.section.classList.add('is-running');
    setMetric(runtime, 'status', runtime.paused ? 'Paused' : 'Running');
    updateStaticMetrics(runtime);
    if (!runtime.paused) runtime.metricsFrame = requestAnimationFrame(now => updateMetrics(runtime, now));
    return;
  }

  const host = new LabSceneHost(scene);
  runtime.host = host;
  runtime.mounted = await mountScene({
    canvas: runtime.canvas,
    container: runtime.canvas.parentElement ?? runtime.canvas,
    scene: host,
    renderer: createPixiRenderer({ antialias: true, backgroundAlpha: 0 }),
  });
  runtime.section.classList.remove('is-loading');
  runtime.section.classList.add('is-running');
  setMetric(runtime, 'status', 'Running');
  updateStaticMetrics(runtime);
  runtime.metricsFrame = requestAnimationFrame(now => updateMetrics(runtime, now));
}

function togglePause(runtime: LabRuntime, button: HTMLButtonElement): void {
  runtime.paused = !runtime.paused;
  if (runtime.paused) {
    runtime.mounted?.stop();
    runtime.metricsFrame = cancelFrame(runtime.metricsFrame);
    runtime.section.classList.add('is-paused');
    button.textContent = 'Resume';
    setMetric(runtime, 'status', 'Paused');
  } else {
    runtime.mounted?.start();
    runtime.section.classList.remove('is-paused');
    button.textContent = 'Pause';
    setMetric(runtime, 'status', 'Running');
    runtime.lastMetricAt = performance.now();
    runtime.metricTickCount = 0;
    runtime.metricsFrame = requestAnimationFrame(now => updateMetrics(runtime, now));
  }
}

function updateStaticMetrics(runtime: LabRuntime): void {
  setMetric(runtime, 'particles', String(countParticles(runtime.scene)));
}

function updateMetrics(runtime: LabRuntime, now: number): void {
  if (runtime.paused) return;

  const scene = runtime.scene;
  if (!scene) return;

  runtime.metricTickCount += 1;
  const elapsed = now - runtime.lastMetricAt;
  const particles = countParticles(scene);
  runtime.stageParticles.textContent = `Particles: ${particles}`;
  setMetric(runtime, 'particles', String(particles));

  if (elapsed >= 500) {
    const fps = Math.round((runtime.metricTickCount * 1_000) / elapsed);
    setMetric(runtime, 'fps', String(Math.min(60, fps)));
    setMetric(runtime, 'frame', `${Math.max(1, Math.round(1_000 / Math.max(1, Math.min(60, fps))))}ms`);
    runtime.lastMetricAt = now;
    runtime.metricTickCount = 0;
  }

  runtime.metricsFrame = requestAnimationFrame(next => updateMetrics(runtime, next));
}

function readTuning(runtime: LabRuntime): LabSceneTuning {
  return {
    particles: readRangeValue(runtime, 'particles', 160),
    drift: readRangeValue(runtime, 'drift', 50),
    glow: readRangeValue(runtime, 'glow', 50),
  };
}

function readRangeValue(runtime: LabRuntime, control: string, fallback: number): number {
  const input = runtime.controlInputs.find(item => item.dataset.control === control);
  if (!input) return fallback;
  const value = Number.parseFloat(input.value);
  if (Number.isNaN(value)) return fallback;
  return value;
}

function countParticles(scene: CompiledRuntimeScene | undefined): number {
  if (!scene) return 0;
  return scene.plan.systems.reduce((total, system) => total + system.store.count, 0);
}

function scaleControl(base: number, value: number, midpoint: number): number {
  return base * (value / midpoint);
}

function emissionRate(base: number, particles: number, midpoint: number): number {
  return Math.max(1, Math.round(scaleControl(base, particles, midpoint)));
}

function setMetric(runtime: LabRuntime, key: string, value: string): void {
  const element = runtime.metricValues.get(key);
  if (element) element.textContent = value;
}

function cancelFrame(frame: number): number {
  if (frame !== 0) cancelAnimationFrame(frame);
  return 0;
}

function isRuntime(runtime: LabRuntime | undefined): runtime is LabRuntime {
  return runtime !== undefined;
}

function isButton(element: Element): element is HTMLButtonElement {
  return element instanceof HTMLButtonElement;
}

function isElement(element: Element): element is HTMLElement {
  return element instanceof HTMLElement;
}

function isInput(element: Element): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

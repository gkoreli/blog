import {
  createScene,
  defineRectZone,
  electricMaterial,
  glowMaterial,
  noiseField,
  polyline,
  particles,
  pointEmitter,
  rectEmitter,
  textSource,
  textBoxEmitter,
  timeTimeline,
} from '@gkoreli/animation/authoring';
import { analyzeScene, compileScene } from '@gkoreli/animation/compile';
import type { CompiledRuntimeScene, SceneAnalysis } from '@gkoreli/animation/compile';
import type { SceneDefinition } from '@gkoreli/animation/authoring';
import {
  add,
  applyFieldVelocity,
  decayAlpha,
  insideZone,
  override,
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
  readonly thesis: string;
  createDefinition(tuning: LabSceneTuning, stress: boolean): SceneDefinition;
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
  reloadTimer: number;
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
    thesis: 'ambient motion must survive restraint',
    createDefinition: (tuning, stress) => (
      createScene('lab-ambient-drift', { seed: 11 })
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
        .build()
    ),
  },
  {
    id: 'memory-zone',
    thesis: 'space can carry memory',
    createDefinition: (tuning, stress) => (
      createScene('lab-memory-zone', { seed: 21 })
        .field('current', noiseField({ strength: stress ? scaleControl(0.72, tuning.drift, 44) : scaleControl(0.42, tuning.drift, 44), scale: 2.1, speed: 0.36, seed: 21 }))
        .material('traveler', glowMaterial({ color: '#e8c87a', radius: scaleControl(2.3, tuning.glow, 58), alpha: 0.72, emissive: scaleControl(0.46, tuning.glow, 58), trail: 0.16 }))
        .zone('memory', defineRectZone({
          x: 0.25,
          y: 0.24,
          width: 0.5,
          height: 0.46,
          tags: ['memory'],
          visual: {
            stroke: '#e8c87a',
            strokeAlpha: 0.54,
            fill: '#e8c87a',
            fillAlpha: 0.075,
          },
        }))
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
            pipe('memory-transition', [onEnterZone('memory', add('emissive', scaleControl(0.32, tuning.glow, 58))), insideZone('memory', override('radius', scaleControl(3.15, tuning.glow, 58)))]),
          ],
        }))
        .build()
    ),
  },
  {
    id: 'text-emergence',
    thesis: 'language can be the emitter',
    createDefinition: (tuning, stress) => (
      createScene('lab-text-emergence', { seed: 31 })
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
        .build()
    ),
  },
  {
    id: 'fracture-pulse',
    thesis: 'rupture should be sparse and intentional',
    createDefinition: (tuning, stress) => (
      createScene('lab-fracture-pulse', { seed: 41 })
        .field('charge', noiseField({ strength: stress ? scaleControl(1.15, tuning.drift, 78) : scaleControl(0.66, tuning.drift, 78), scale: 4.6, speed: 0.74, seed: 41 }))
        .material('arc', electricMaterial({ color: '#67e8f9', radius: scaleControl(2, tuning.glow, 92), alpha: 0.78, emissive: scaleControl(0.72, tuning.glow, 92), trail: 0.2 }))
        .zone('threshold', defineRectZone({
          x: 0.16,
          y: 0.38,
          width: 0.68,
          height: 0.22,
          tags: ['fracture'],
          visual: {
            stroke: '#67e8f9',
            strokeAlpha: stress ? 0.42 : 0.18,
            fill: '#67e8f9',
            fillAlpha: stress ? 0.04 : 0.015,
          },
        }))
        .polyline('fracture-north-west', polyline({
          points: [{ x: 0.5, y: 0.5 }, { x: 0.38, y: 0.34 }, { x: 0.28, y: 0.2 }],
          color: '#67e8f9',
          alpha: stress ? 0.86 : 0.54,
          width: stress ? 1.8 : 1.1,
          glow: { color: '#67e8f9', alpha: stress ? 0.28 : 0.16, width: stress ? 8 : 5 },
        }))
        .polyline('fracture-east', polyline({
          points: [{ x: 0.5, y: 0.5 }, { x: 0.66, y: 0.43 }, { x: 0.82, y: 0.36 }],
          color: '#93c5fd',
          alpha: stress ? 0.9 : 0.58,
          width: stress ? 1.8 : 1.1,
          glow: { color: '#93c5fd', alpha: stress ? 0.3 : 0.17, width: stress ? 8 : 5 },
        }))
        .polyline('fracture-south', polyline({
          points: [{ x: 0.5, y: 0.5 }, { x: 0.56, y: 0.68 }, { x: 0.6, y: 0.84 }],
          color: '#a78bfa',
          alpha: stress ? 0.8 : 0.46,
          width: stress ? 1.6 : 1,
          glow: { color: '#a78bfa', alpha: stress ? 0.26 : 0.14, width: stress ? 7 : 4 },
        }))
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
            pipe('threshold', [insideZone('threshold', override('radius', scaleControl(3.2, tuning.glow, 92))), timelinePulse('surge', 'alpha', { min: 0.18, max: 0.96 })]),
          ],
        }))
        .build()
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
    reloadTimer: 0,
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
        resetRuntime(runtime);
      } else if (button.dataset.action === 'stress') {
        setStress(runtime, button, !runtime.stress);
        void loadScene(runtime);
      }
    });
  }

  for (const input of runtime.controlInputs) {
    updateControlValue(runtime, input);
    input.addEventListener('input', () => {
      updateControlValue(runtime, input);
      scheduleReload(runtime);
    });
  }
}

function scheduleReload(runtime: LabRuntime): void {
  if (runtime.reloadTimer !== 0) window.clearTimeout(runtime.reloadTimer);
  runtime.reloadTimer = window.setTimeout(() => {
    runtime.reloadTimer = 0;
    void loadScene(runtime);
  }, 80);
}

function resetRuntime(runtime: LabRuntime): void {
  if (runtime.reloadTimer !== 0) {
    window.clearTimeout(runtime.reloadTimer);
    runtime.reloadTimer = 0;
  }

  for (const input of runtime.controlInputs) {
    const defaultValue = input.dataset.defaultValue;
    if (defaultValue !== undefined) input.value = defaultValue;
    updateControlValue(runtime, input);
  }

  const stressButton = runtime.actionButtons.find(button => button.dataset.action === 'stress');
  if (stressButton) setStress(runtime, stressButton, false);
  void loadScene(runtime);
}

function setStress(runtime: LabRuntime, button: HTMLButtonElement, active: boolean): void {
  runtime.stress = active;
  runtime.section.classList.toggle('is-stress', active);
  button.classList.toggle('active', active);
  button.setAttribute('aria-pressed', String(active));
  button.textContent = active ? 'Stress On' : 'Stress';
}

async function loadScene(runtime: LabRuntime): Promise<void> {
  const tuning = readTuning(runtime);
  const definition = runtime.config.createDefinition(tuning, runtime.stress);
  const analysis = analyzeScene(definition);
  runtime.snapshot.textContent = formatSceneSnapshot(runtime, analysis, tuning);

  if (!analysis.ok) {
    runtime.section.classList.remove('is-loading', 'is-running');
    runtime.section.classList.add('is-error');
    setMetric(runtime, 'status', 'Invalid');
    return;
  }

  const scene = compileScene(definition);
  runtime.lastMetricAt = performance.now();
  runtime.metricTickCount = 0;
  runtime.scene = scene;
  runtime.section.classList.remove('is-error');
  runtime.section.classList.add('is-loading');
  setMetric(runtime, 'status', 'Loading');

  const existingHost = runtime.host;
  if (existingHost) {
    existingHost.replace(scene);
    runtime.mounted?.renderOnce();
    runtime.section.classList.remove('is-loading');
    runtime.section.classList.add('is-running');
    setMetric(runtime, 'status', runtime.paused ? 'Paused' : runningStatus());
    updateStaticMetrics(runtime);
    return;
  }

  const host = new LabSceneHost(scene);
  const renderer = createPixiRenderer({ antialias: true, backgroundAlpha: 0 });
  runtime.host = host;

  try {
    const mounted = await mountScene({
      canvas: runtime.canvas,
      container: runtime.canvas.parentElement ?? runtime.canvas,
      scene: host,
      renderer,
      onFrame: time => updateMetrics(runtime, time.now),
    });
    runtime.mounted = mounted;
    if (runtime.paused) mounted.stop();
    runtime.section.classList.remove('is-loading');
    runtime.section.classList.add('is-running');
    setMetric(runtime, 'status', runtime.paused ? 'Paused' : runningStatus());
    updateStaticMetrics(runtime);
  } catch (error) {
    renderer.dispose();
    host.dispose();
    runtime.host = undefined;
    runtime.scene = undefined;
    runtime.section.classList.remove('is-loading', 'is-running');
    runtime.section.classList.add('is-error');
    runtime.snapshot.textContent += `\nerror: ${readErrorMessage(error)}`;
    setMetric(runtime, 'status', 'Error');
  }
}

function togglePause(runtime: LabRuntime, button: HTMLButtonElement): void {
  runtime.paused = !runtime.paused;
  button.setAttribute('aria-pressed', String(runtime.paused));

  if (runtime.paused) {
    runtime.mounted?.stop();
    runtime.section.classList.add('is-paused');
    button.textContent = 'Resume';
    setMetric(runtime, 'status', 'Paused');
    return;
  }

  runtime.mounted?.start();
  runtime.section.classList.remove('is-paused');
  button.textContent = 'Pause';
  setMetric(runtime, 'status', runningStatus());
  runtime.lastMetricAt = performance.now();
  runtime.metricTickCount = 0;
}

function updateStaticMetrics(runtime: LabRuntime): void {
  const particles = countParticles(runtime.scene);
  runtime.stageParticles.textContent = `Particles: ${particles}`;
  setMetric(runtime, 'particles', String(particles));
}

function updateMetrics(runtime: LabRuntime, now: number): void {
  if (runtime.paused || !runtime.scene) return;
  runtime.metricTickCount += 1;
  const elapsed = now - runtime.lastMetricAt;
  if (elapsed < 500) return;

  const particles = countParticles(runtime.scene);
  const fps = Math.round((runtime.metricTickCount * 1_000) / elapsed);
  const frameMs = elapsed / runtime.metricTickCount;
  runtime.stageParticles.textContent = `Particles: ${particles}`;
  setMetric(runtime, 'particles', String(particles));
  setMetric(runtime, 'fps', String(fps));
  setMetric(runtime, 'frame', `${frameMs.toFixed(1)}ms`);
  runtime.lastMetricAt = now;
  runtime.metricTickCount = 0;
}

function formatSceneSnapshot(
  runtime: LabRuntime,
  analysis: SceneAnalysis,
  tuning: LabSceneTuning,
): string {
  const counts = analysis.manifest.counts;
  const stageCount = analysis.manifest.systems.reduce((total, system) => total + system.stages.length, 0);
  const diagnostics = analysis.diagnostics.length === 0
    ? 'ok'
    : analysis.diagnostics.map(diagnostic => `${diagnostic.code} @ ${diagnostic.path}`).join(', ');

  return `scene: ${analysis.manifest.id}
schema: ${analysis.manifest.version}
seed: ${analysis.manifest.seed}
thesis: ${runtime.config.thesis}
primitives: ${counts.textSources} text / ${counts.polylines} polylines / ${counts.zones} zones
systems: ${counts.systems} / stages: ${stageCount}
particles: ${tuning.particles}
drift: ${tuning.drift}
glow: ${tuning.glow}
stress: ${runtime.stress ? 'on' : 'off'}
diagnostics: ${diagnostics}`;
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

function updateControlValue(runtime: LabRuntime, input: HTMLInputElement): void {
  const control = input.dataset.control;
  if (!control) return;
  const output = runtime.section.querySelector(`[data-control-value="${control}"]`);
  if (output instanceof HTMLOutputElement) output.value = input.value;
}

function countParticles(scene: CompiledRuntimeScene | undefined): number {
  if (!scene) return 0;
  let count = 0;
  for (const system of scene.plan.systems) {
    for (let index = 0; index < system.store.count; index += 1) {
      if ((system.store.alive[index] ?? 0) === 1) count += 1;
    }
  }
  return count;
}

function scaleControl(base: number, value: number, midpoint: number): number {
  return base * (value / midpoint);
}

function emissionRate(base: number, particles: number, midpoint: number): number {
  return Math.max(1, Math.round(scaleControl(base, particles, midpoint)));
}

function runningStatus(): string {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Static' : 'Running';
}

function setMetric(runtime: LabRuntime, key: string, value: string): void {
  const element = runtime.metricValues.get(key);
  if (element) element.textContent = value;
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

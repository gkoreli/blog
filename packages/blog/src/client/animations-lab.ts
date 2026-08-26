import {
  createScene,
  defineRectZone,
  noiseField,
  polyline,
  particles,
  rectEmitter,
  textSource,
  solidMaterial,
  textBoxEmitter,
  timeTimeline,
} from '@gkoreli/animation/authoring';
import { analyzeScene, compileScene } from '@gkoreli/animation/compile';
import type {
  CompiledRuntimeScene,
  ParticleRenderBatch,
  SceneAnalysis,
  PrimitiveTimelineDebugState,
} from '@gkoreli/animation/compile';
import type { SceneDefinition } from '@gkoreli/animation/authoring';
import {
  applyFieldVelocity,
  decayAlpha,
  override,
  onEnterZone,
  pipe,
} from '@gkoreli/animation/effects';
import { mountScene } from '@gkoreli/animation/core';
import type { MountedScene, PrimitivePoint, RuntimePrimitive, RuntimeUpdateContext } from '@gkoreli/animation/core';
import { createPixiRenderer } from '@gkoreli/animation/renderer-pixi';

interface LabSceneTuning {
  readonly particles: number;
  readonly drift: number;
  readonly glow: number;
}

interface LabSceneConfig {
  readonly id: string;
  readonly thesis: string;
  readonly metric: 'particles' | 'polylines';
  readonly debugTimelineId?: string;
  createDefinition(tuning: LabSceneTuning, stress: boolean): SceneDefinition;
}

interface LabRuntime {
  readonly section: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly stageParticles: HTMLElement;
  readonly stageLabel: string;
  readonly snapshot: HTMLElement;
  readonly actionButtons: readonly HTMLButtonElement[];
  readonly controlInputs: readonly HTMLInputElement[];
  readonly timelineInput: HTMLInputElement;
  readonly timelineOutput: HTMLOutputElement;
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
  lastTimelineAt: number;
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

  particleBatches(): readonly ParticleRenderBatch[] {
    return this.current.particleBatches();
  }

  primitiveTimelineDebugStates(): readonly PrimitiveTimelineDebugState[] {
    return this.current.primitiveTimelineDebugStates();
  }

  seekPrimitiveTimeline(timelineId: string, timeMs: number): void {
    this.current.seekPrimitiveTimeline(timelineId, timeMs);
  }

  dispose(): void {
    this.current.dispose();
  }
}

const SCENES: readonly LabSceneConfig[] = [
  {
    id: 'ambient-drift',
    thesis: 'ambient motion must survive restraint',
    metric: 'particles',
    createDefinition: (tuning, stress) => (
      createScene('lab-ambient-drift', { seed: 11 })
        .field('flow', noiseField({ strength: stress ? 0.28 : 0.2, scale: 3, speed: 0.16, seed: 11 }))
        .material('thought', solidMaterial({
          color: '#6ec9a8',
          radius: scaleControl(2.2, tuning.glow, 100),
          alpha: 0.34,
          emissive: 0,
          trail: 0,
          mark: { kind: 'lozenge', aspect: 3.7 },
        }))
        .emitter('field', rectEmitter({
          x: 0.04,
          y: 0.08,
          width: 0.92,
          height: 0.84,
          rate: stress ? 72 : emissionRate(18, tuning.particles, 112),
          material: 'thought',
          speed: { min: 0.004, max: 0.016 },
          lifetime: { min: 8, max: 13 },
        }))
        .system('particles', particles({
          emitter: 'field',
          material: 'thought',
          capacity: stress ? 360 : tuning.particles,
          pipes: [
            pipe('soft-flow', [applyFieldVelocity('flow', stress ? scaleControl(0.9, tuning.drift, 34) : scaleControl(0.58, tuning.drift, 34)), decayAlpha({ rate: 0.018 })]),
          ],
        }))
        .build()
    ),
  },
  {
    id: 'memory-zone',
    thesis: 'space can carry memory',
    metric: 'particles',
    createDefinition: (tuning, stress) => (
      createScene('lab-memory-zone', { seed: 21 })
        .field('current', noiseField({ strength: stress ? 0.18 : 0.12, scale: 2.4, speed: 0.2, seed: 21 }))
        .material('traveler', solidMaterial({
          color: '#9a9589',
          radius: 2.1,
          alpha: 0.38,
          emissive: 0,
          trail: 0,
          mark: { kind: 'frame', strokeWidth: 0.8 },
        }))
        .zone('memory', defineRectZone({
          x: 0.27,
          y: 0.22,
          width: 0.46,
          height: 0.56,
          tags: ['memory'],
          visual: {
            stroke: '#e8c87a',
            strokeAlpha: Math.min(0.54, Math.max(0.24, scaleControl(0.36, tuning.glow, 60))),
            fill: '#e8c87a',
            fillAlpha: Math.min(0.085, Math.max(0.025, scaleControl(0.055, tuning.glow, 60))),
          },
        }))
        .emitter('travelers', rectEmitter({
          x: 0.04,
          y: 0.14,
          width: 0.08,
          height: 0.72,
          rate: stress ? 36 : emissionRate(10, tuning.particles, 150),
          material: 'traveler',
          direction: { min: -0.14, max: 0.14 },
          speed: { min: 0.032, max: 0.058 },
          lifetime: { min: 13, max: 19 },
        }))
        .system('particles', particles({
          emitter: 'travelers',
          material: 'traveler',
          capacity: stress ? 420 : tuning.particles,
          pipes: [
            pipe('field', [applyFieldVelocity('current', stress ? scaleControl(0.68, tuning.drift, 42) : scaleControl(0.42, tuning.drift, 42)), decayAlpha({ rate: 0.01 })]),
            pipe('memory-transition', [
              onEnterZone('memory', override('color', [232, 200, 122]), 'memory:remember-color'),
              onEnterZone('memory', override('radius', Math.min(4, Math.max(2.55, 2.1 + scaleControl(1.1, tuning.glow, 60)))), 'memory:remember-radius'),
              onEnterZone('memory', override('alpha', Math.min(0.86, Math.max(0.56, 0.5 + scaleControl(0.22, tuning.glow, 60)))), 'memory:remember-alpha'),
              onEnterZone('memory', override('emissive', Math.min(0.8, Math.max(0.2, scaleControl(0.48, tuning.glow, 60)))), 'memory:remember-emissive'),
            ]),
          ],
        }))
        .build()
    ),
  },
  {
    id: 'text-emergence',
    thesis: 'language can be the emitter',
    metric: 'particles',
    createDefinition: (tuning, stress) => (
      createScene('lab-text-emergence', { seed: 31 })
        .field('lift', noiseField({ strength: stress ? 0.16 : 0.1, scale: 3.4, speed: 0.16, seed: 31 }))
        .material('ink', solidMaterial({
          color: '#93c5fd',
          radius: 1.8,
          alpha: Math.min(0.68, Math.max(0.38, 0.32 + scaleControl(0.2, tuning.glow, 44))),
          emissive: 0,
          trail: 0,
          mark: { kind: 'bar', aspect: 3.6 },
        }))
        .textSource('depth-word-source', textSource({
          text: 'DEPTH',
          x: 0.16,
          y: 0.31,
          width: 0.68,
          height: 0.24,
          fontSize: 0.72,
          fontWeight: '700',
          color: '#faf8f5',
          alpha: 0.9,
          letterSpacing: 0,
          glow: {
            color: '#93c5fd',
            alpha: Math.min(0.22, Math.max(0.1, 0.08 + scaleControl(0.08, tuning.glow, 44))),
            blur: Math.min(20, Math.max(12, 10 + scaleControl(6, tuning.glow, 44))),
          },
          debugBounds: stress,
          tags: ['source', 'text'],
        }))
        .emitter('depth-word', textBoxEmitter({
          x: 0.21,
          y: 0.34,
          width: 0.58,
          height: 0.16,
          source: 'depth-word-source',
          rate: stress ? 84 : emissionRate(22, tuning.particles, 96),
          material: 'ink',
          direction: { min: -1.88, max: -1.26 },
          speed: {
            min: scaleControl(0.028, tuning.drift, 54),
            max: scaleControl(0.058, tuning.drift, 54),
          },
          lifetime: { min: 2.6, max: 4.6 },
        }))
        .system('particles', particles({
          emitter: 'depth-word',
          material: 'ink',
          capacity: stress ? 320 : tuning.particles,
          pipes: [
            pipe('emergence', [applyFieldVelocity('lift', stress ? 0.55 : 0.3), decayAlpha({ rate: 0.12 })]),
          ],
        }))
        .build()
    ),
  },
  {
    id: 'fracture-pulse',
    thesis: 'rupture is geometry plus timing',
    metric: 'polylines',
    debugTimelineId: 'fracture-cycle',
    createDefinition: createFractureScene,
  },
];
interface FractureBranch {
  readonly id: string;
  readonly points: readonly PrimitivePoint[];
  readonly color: string;
  readonly alpha: number;
  readonly width: number;
  readonly revealStart: number;
  readonly revealEnd: number;
  readonly fadeStart: number;
  readonly fadeEnd: number;
}

const FRACTURE_ORIGIN: PrimitivePoint = { x: 0.48, y: 0.53 };
const FRACTURE_BRANCHES: readonly FractureBranch[] = [
  {
    id: 'fault-northwest',
    points: [
      FRACTURE_ORIGIN,
      { x: 0.45, y: 0.48 },
      { x: 0.41, y: 0.43 },
      { x: 0.38, y: 0.36 },
      { x: 0.34, y: 0.3 },
    ],
    color: '#dffcff',
    alpha: 0.88,
    width: 1.1,
    revealStart: 0.004,
    revealEnd: 0.026,
    fadeStart: 0.105,
    fadeEnd: 0.165,
  },
  {
    id: 'fault-southeast',
    points: [
      FRACTURE_ORIGIN,
      { x: 0.52, y: 0.58 },
      { x: 0.55, y: 0.64 },
      { x: 0.59, y: 0.7 },
      { x: 0.62, y: 0.77 },
    ],
    color: '#dffcff',
    alpha: 0.82,
    width: 1,
    revealStart: 0.012,
    revealEnd: 0.036,
    fadeStart: 0.108,
    fadeEnd: 0.17,
  },
  {
    id: 'branch-north',
    points: [
      { x: 0.41, y: 0.43 },
      { x: 0.44, y: 0.37 },
      { x: 0.46, y: 0.31 },
    ],
    color: '#67e8f9',
    alpha: 0.72,
    width: 0.82,
    revealStart: 0.022,
    revealEnd: 0.043,
    fadeStart: 0.11,
    fadeEnd: 0.172,
  },
  {
    id: 'branch-west',
    points: [
      { x: 0.45, y: 0.48 },
      { x: 0.38, y: 0.49 },
      { x: 0.31, y: 0.47 },
      { x: 0.26, y: 0.43 },
    ],
    color: '#93c5fd',
    alpha: 0.66,
    width: 0.78,
    revealStart: 0.027,
    revealEnd: 0.05,
    fadeStart: 0.111,
    fadeEnd: 0.174,
  },
  {
    id: 'branch-east',
    points: [
      { x: 0.52, y: 0.58 },
      { x: 0.59, y: 0.55 },
      { x: 0.66, y: 0.53 },
      { x: 0.72, y: 0.48 },
    ],
    color: '#67e8f9',
    alpha: 0.7,
    width: 0.82,
    revealStart: 0.03,
    revealEnd: 0.055,
    fadeStart: 0.112,
    fadeEnd: 0.176,
  },
  {
    id: 'branch-southwest',
    points: [
      FRACTURE_ORIGIN,
      { x: 0.42, y: 0.59 },
      { x: 0.37, y: 0.65 },
      { x: 0.31, y: 0.67 },
    ],
    color: '#a78bfa',
    alpha: 0.58,
    width: 0.72,
    revealStart: 0.035,
    revealEnd: 0.062,
    fadeStart: 0.113,
    fadeEnd: 0.178,
  },
  {
    id: 'branch-northeast',
    points: [
      { x: 0.44, y: 0.37 },
      { x: 0.51, y: 0.34 },
      { x: 0.57, y: 0.29 },
      { x: 0.63, y: 0.27 },
    ],
    color: '#93c5fd',
    alpha: 0.58,
    width: 0.68,
    revealStart: 0.041,
    revealEnd: 0.068,
    fadeStart: 0.114,
    fadeEnd: 0.18,
  },
  {
    id: 'branch-lower-east',
    points: [
      { x: 0.55, y: 0.64 },
      { x: 0.62, y: 0.65 },
      { x: 0.68, y: 0.69 },
    ],
    color: '#67e8f9',
    alpha: 0.54,
    width: 0.66,
    revealStart: 0.047,
    revealEnd: 0.073,
    fadeStart: 0.115,
    fadeEnd: 0.182,
  },
  {
    id: 'branch-upper-left',
    points: [
      { x: 0.38, y: 0.36 },
      { x: 0.32, y: 0.35 },
      { x: 0.28, y: 0.32 },
    ],
    color: '#67e8f9',
    alpha: 0.48,
    width: 0.62,
    revealStart: 0.052,
    revealEnd: 0.078,
    fadeStart: 0.116,
    fadeEnd: 0.184,
  },
  {
    id: 'branch-lower',
    points: [
      { x: 0.37, y: 0.65 },
      { x: 0.39, y: 0.72 },
      { x: 0.41, y: 0.76 },
    ],
    color: '#a78bfa',
    alpha: 0.44,
    width: 0.6,
    revealStart: 0.058,
    revealEnd: 0.084,
    fadeStart: 0.117,
    fadeEnd: 0.186,
  },
];

function createFractureScene(tuning: LabSceneTuning, stress: boolean): SceneDefinition {
  const branchCount = stress
    ? FRACTURE_BRANCHES.length
    : Math.min(FRACTURE_BRANCHES.length, Math.max(4, Math.round(tuning.particles)));
  const spread = Math.min(1.35, Math.max(0.65, tuning.drift / 62));
  const voltage = Math.min(1.4, Math.max(0.35, tuning.glow / 58));
  const builder = createScene('lab-fracture-pulse', { seed: 41 })
    .timeline('fracture-cycle', timeTimeline({
      durationMs: stress ? 3_800 : 6_200,
      inputStart: 0,
      inputEnd: 1,
      outputStart: 0,
      outputEnd: 1,
    }));

  for (let index = 0; index < branchCount; index += 1) {
    const branch = FRACTURE_BRANCHES[index];
    if (!branch) continue;
    const points = branch.points.map(point => ({
      x: FRACTURE_ORIGIN.x + (point.x - FRACTURE_ORIGIN.x) * spread,
      y: FRACTURE_ORIGIN.y + (point.y - FRACTURE_ORIGIN.y) * spread,
    }));
    builder.polyline(branch.id, polyline({
      points,
      color: branch.color,
      alpha: Math.min(0.92, branch.alpha * (0.72 + voltage * 0.28)),
      width: branch.width * (0.82 + voltage * 0.18),
      glow: {
        color: branch.color,
        alpha: Math.min(0.16, 0.055 + voltage * 0.055),
        width: Math.min(4.2, 1.8 + voltage * 1.35),
      },
      timeline: {
        timelineId: 'fracture-cycle',
        revealStart: branch.revealStart,
        revealEnd: branch.revealEnd,
        fadeStart: branch.fadeStart,
        fadeEnd: branch.fadeEnd,
      },
    }));
  }

  return builder.build();
}


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
  const stageLabel = section.dataset.stageLabel ?? 'Particles';
  const config = SCENES.find(item => item.id === experimentId);
  const canvas = section.querySelector('[data-lab-canvas]');
  const stageParticles = section.querySelector('[data-stage-particles]');
  const snapshot = section.querySelector('[data-config-snapshot]');
  const timelineInput = section.querySelector('[data-timeline-scrub]');
  const timelineOutput = section.querySelector('[data-timeline-value]');

  if (
    !config ||
    !(canvas instanceof HTMLCanvasElement) ||
    !(stageParticles instanceof HTMLElement) ||
    !(snapshot instanceof HTMLElement) ||
    !(timelineInput instanceof HTMLInputElement) ||
    !(timelineOutput instanceof HTMLOutputElement)
  ) {
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
    stageLabel,
    snapshot,
    actionButtons,
    controlInputs,
    timelineInput,
    timelineOutput,
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
    lastTimelineAt: 0,
  };
}

function bindRuntime(runtime: LabRuntime): void {
  for (const button of runtime.actionButtons) {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'pause') {
        togglePause(runtime, button);
      } else if (button.dataset.action === 'restart') {
        restartRuntime(runtime);
      } else if (button.dataset.action === 'defaults') {
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
  runtime.timelineInput.addEventListener('input', () => {
    scrubPrimitiveTimeline(runtime);
  });
}

function scheduleReload(runtime: LabRuntime): void {
  if (runtime.reloadTimer !== 0) window.clearTimeout(runtime.reloadTimer);
  runtime.reloadTimer = window.setTimeout(() => {
    runtime.reloadTimer = 0;
    void loadScene(runtime);
  }, 80);
}
function restartRuntime(runtime: LabRuntime): void {
  const state = readPrimitiveTimelineState(runtime);
  if (runtime.host && state) {
    runtime.host.seekPrimitiveTimeline(state.timelineId, 0);
    runtime.mounted?.renderCurrentFrame();
    updateTimelineControl(runtime);
    return;
  }
  void loadScene(runtime);
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
    runtime.mounted?.renderCurrentFrame();
    runtime.section.classList.remove('is-loading');
    runtime.section.classList.add('is-running');
    setMetric(runtime, 'status', runtime.paused ? 'Frozen' : runningStatus());
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
    setMetric(runtime, 'status', runtime.paused ? 'Frozen' : runningStatus());
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

function togglePause(runtime: LabRuntime, _button: HTMLButtonElement): void {
  setFrozenState(runtime, !runtime.paused);
}

function setFrozenState(runtime: LabRuntime, frozen: boolean): void {
  runtime.paused = frozen;
  const button = runtime.actionButtons.find(item => item.dataset.action === 'pause');
  if (button) {
    button.setAttribute('aria-pressed', String(frozen));
    button.textContent = frozen ? 'Resume' : 'Freeze';
  }

  runtime.section.classList.toggle('is-paused', frozen);
  if (frozen) {
    runtime.mounted?.stop();
    setMetric(runtime, 'status', 'Frozen');
    return;
  }

  runtime.mounted?.start();
  setMetric(runtime, 'status', runningStatus());
  runtime.lastMetricAt = performance.now();
  runtime.metricTickCount = 0;
}

function scrubPrimitiveTimeline(runtime: LabRuntime): void {
  const host = runtime.host;
  const state = readPrimitiveTimelineState(runtime);
  if (!host || !state) return;
  setFrozenState(runtime, true);
  host.seekPrimitiveTimeline(state.timelineId, Number.parseFloat(runtime.timelineInput.value));
  runtime.mounted?.renderCurrentFrame();
  updateTimelineControl(runtime);
}

function readPrimitiveTimelineState(runtime: LabRuntime): PrimitiveTimelineDebugState | undefined {
  const timelineId = runtime.config.debugTimelineId;
  if (!timelineId || !runtime.host) return undefined;
  return runtime.host.primitiveTimelineDebugStates().find(state => state.timelineId === timelineId);
}

function updateTimelineControl(runtime: LabRuntime): void {
  const state = readPrimitiveTimelineState(runtime);
  if (!state) {
    runtime.timelineInput.disabled = true;
    runtime.timelineInput.value = '0';
    runtime.timelineOutput.value = 'Continuous · freeze only';
    return;
  }

  runtime.timelineInput.disabled = false;
  runtime.timelineInput.max = String(Math.max(0, Math.ceil(state.durationMs) - 1));
  runtime.timelineInput.value = String(Math.round(state.timeMs));
  runtime.timelineOutput.value = `${(state.timeMs / 1_000).toFixed(2)}s / ${(state.durationMs / 1_000).toFixed(2)}s`;
}

function updateStaticMetrics(runtime: LabRuntime): void {
  const count = countSceneMetric(runtime);
  runtime.stageParticles.textContent = `${runtime.stageLabel}: ${count}`;
  setMetric(runtime, 'particles', String(count));
  updateTimelineControl(runtime);
}

function updateMetrics(runtime: LabRuntime, now: number): void {
  if (now - runtime.lastTimelineAt >= 80) {
    updateTimelineControl(runtime);
    runtime.lastTimelineAt = now;
  }
  if (runtime.paused || !runtime.scene) return;
  runtime.metricTickCount += 1;
  const elapsed = now - runtime.lastMetricAt;
  if (elapsed < 500) return;

  const count = countSceneMetric(runtime);
  const fps = Math.round((runtime.metricTickCount * 1_000) / elapsed);
  const frameMs = elapsed / runtime.metricTickCount;
  runtime.stageParticles.textContent = `${runtime.stageLabel}: ${count}`;
  setMetric(runtime, 'particles', String(count));
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
  const tuningSnapshot = runtime.config.metric === 'polylines'
    ? `branches: ${tuning.particles}\nspread: ${tuning.drift}\nvoltage: ${tuning.glow}`
    : `particles: ${tuning.particles}\ndrift: ${tuning.drift}\nglow: ${tuning.glow}`;

  return `scene: ${analysis.manifest.id}
schema: ${analysis.manifest.version}
seed: ${analysis.manifest.seed}
thesis: ${runtime.config.thesis}
primitives: ${counts.textSources} text / ${counts.polylines} polylines / ${counts.zones} zones
systems: ${counts.systems} / stages: ${stageCount}
${tuningSnapshot}
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

function countSceneMetric(runtime: LabRuntime): number {
  if (!runtime.scene) return 0;
  if (runtime.config.metric === 'polylines') return runtime.scene.plan.manifest.counts.polylines;
  return countParticles(runtime.scene);
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

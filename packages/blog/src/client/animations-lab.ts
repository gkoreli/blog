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
  readonly debugPhase?: (state: PrimitiveTimelineDebugState) => string;
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
  readonly timelinePhase: HTMLElement;
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
    thesis: 'atmosphere has depth without demanding attention',
    metric: 'particles',
    createDefinition: createAmbientScene,
  },
  {
    id: 'memory-zone',
    thesis: 'crossing a place leaves a persistent visual state',
    metric: 'particles',
    createDefinition: createMemoryScene,
  },
  {
    id: 'text-emergence',
    thesis: 'language sheds material without surrendering legibility',
    metric: 'particles',
    createDefinition: createTextScene,
  },
  {
    id: 'fracture-pulse',
    thesis: 'rupture is geometry plus timing',
    metric: 'polylines',
    debugTimelineId: 'fracture-cycle',
    debugPhase: fracturePhase,
    createDefinition: createFractureScene,
  },
];

function createAmbientScene(tuning: LabSceneTuning, stress: boolean): SceneDefinition {
  const totalCapacity = stress ? 360 : tuning.particles;
  const farCapacity = Math.max(1, Math.round(totalCapacity * 0.4));
  const middleCapacity = Math.max(1, Math.round(totalCapacity * 0.4));
  const nearCapacity = Math.max(1, totalCapacity - farCapacity - middleCapacity);
  const current = tuning.drift / 34;
  const scale = tuning.glow / 100;

  return createScene('lab-ambient-drift', { seed: 11 })
    .field('far-flow', noiseField({ strength: stress ? 0.18 : 0.11, scale: 4.2, speed: 0.09, seed: 11 }))
    .field('middle-flow', noiseField({ strength: stress ? 0.28 : 0.18, scale: 3, speed: 0.15, seed: 12 }))
    .field('near-flow', noiseField({ strength: stress ? 0.36 : 0.22, scale: 2.2, speed: 0.2, seed: 13 }))
    .material('far-air', solidMaterial({
      color: '#789b8f',
      radius: 2 * scale,
      alpha: 0.24,
      emissive: 0,
      trail: 0,
      mark: { kind: 'lozenge', aspect: 3.2 },
    }))
    .material('middle-air', solidMaterial({
      color: '#77d7b5',
      radius: 3.4 * scale,
      alpha: 0.52,
      emissive: 0,
      trail: 0,
      mark: { kind: 'lozenge', aspect: 4.1 },
    }))
    .material('near-air', solidMaterial({
      color: '#c5f2e0',
      radius: 5.2 * scale,
      alpha: 0.78,
      emissive: 0,
      trail: 0,
      mark: { kind: 'lozenge', aspect: 5.4 },
    }))
    .emitter('far-source', rectEmitter({
      x: 0.02,
      y: 0.04,
      width: 0.96,
      height: 0.92,
      rate: stress ? 36 : emissionRate(7, totalCapacity, 112),
      material: 'far-air',
      speed: { min: 0.002, max: 0.008 },
      lifetime: { min: 14, max: 22 },
    }))
    .emitter('middle-source', rectEmitter({
      x: 0.04,
      y: 0.1,
      width: 0.92,
      height: 0.78,
      rate: stress ? 30 : emissionRate(9, totalCapacity, 112),
      material: 'middle-air',
      speed: { min: 0.004, max: 0.014 },
      lifetime: { min: 10, max: 17 },
    }))
    .emitter('near-source', rectEmitter({
      x: 0.08,
      y: 0.16,
      width: 0.84,
      height: 0.66,
      rate: stress ? 14 : emissionRate(4, totalCapacity, 112),
      material: 'near-air',
      speed: { min: 0.006, max: 0.018 },
      lifetime: { min: 12, max: 20 },
    }))
    .system('far-layer', particles({
      emitter: 'far-source',
      material: 'far-air',
      capacity: farCapacity,
      pipes: [
        pipe('far-current', [applyFieldVelocity('far-flow', 0.34 * current), decayAlpha({ rate: 0.001 })]),
      ],
    }))
    .system('middle-layer', particles({
      emitter: 'middle-source',
      material: 'middle-air',
      capacity: middleCapacity,
      pipes: [
        pipe('middle-current', [applyFieldVelocity('middle-flow', 0.58 * current), decayAlpha({ rate: 0.003 })]),
      ],
    }))
    .system('near-layer', particles({
      emitter: 'near-source',
      material: 'near-air',
      capacity: nearCapacity,
      pipes: [
        pipe('near-current', [applyFieldVelocity('near-flow', 0.82 * current), decayAlpha({ rate: 0.004 })]),
      ],
    }))
    .build();
}

function createMemoryScene(tuning: LabSceneTuning, stress: boolean): SceneDefinition {
  const heat = tuning.glow / 60;
  const activatedRadius = Math.min(4, Math.max(2.55, 2.1 + 1.1 * heat));
  const activatedAlpha = Math.min(0.86, Math.max(0.56, 0.5 + 0.22 * heat));
  const activatedEmissive = Math.min(0.8, Math.max(0.2, 0.48 * heat));

  return createScene('lab-memory-zone', { seed: 21 })
    .field('current', noiseField({ strength: stress ? 0.18 : 0.12, scale: 2.4, speed: 0.2, seed: 21 }))
    .material('traveler', solidMaterial({
      color: '#8f9189',
      radius: 2.1,
      alpha: 0.34,
      emissive: 0,
      trail: 0,
      mark: { kind: 'frame', strokeWidth: 0.75 },
    }))
    .textSource('memory-label', textSource({
      text: 'MEMORY',
      x: 0.27,
      y: 0.22,
      width: 0.46,
      height: 0.56,
      fontSize: 0.18,
      fontWeight: '500',
      color: '#e8c87a',
      alpha: 0.17,
      letterSpacing: 4,
      glow: { color: '#e8c87a', alpha: 0.07, blur: 10 },
      tags: ['zone-label'],
    }))
    .zone('memory', defineRectZone({
      x: 0.27,
      y: 0.22,
      width: 0.46,
      height: 0.56,
      tags: ['memory'],
      visual: {
        stroke: '#e8c87a',
        strokeAlpha: Math.min(0.38, Math.max(0.16, 0.24 * heat)),
        fill: '#e8c87a',
        fillAlpha: Math.min(0.055, Math.max(0.018, 0.035 * heat)),
      },
    }))
    .emitter('travelers', rectEmitter({
      x: 0.025,
      y: 0.16,
      width: 0.06,
      height: 0.68,
      rate: stress ? 24 : emissionRate(7, tuning.particles, 150),
      material: 'traveler',
      direction: { min: -0.1, max: 0.1 },
      speed: { min: 0.034, max: 0.054 },
      lifetime: { min: 15, max: 21 },
    }))
    .system('travelers', particles({
      emitter: 'travelers',
      material: 'traveler',
      capacity: stress ? 280 : tuning.particles,
      pipes: [
        pipe('memory-current', [applyFieldVelocity('current', stress ? scaleControl(0.6, tuning.drift, 42) : scaleControl(0.34, tuning.drift, 42)), decayAlpha({ rate: 0.008 })]),
        pipe('memory-transition', [
          onEnterZone('memory', override('color', [232, 200, 122]), 'memory:remember-color'),
          onEnterZone('memory', override('radius', activatedRadius), 'memory:remember-radius'),
          onEnterZone('memory', override('alpha', activatedAlpha), 'memory:remember-alpha'),
          onEnterZone('memory', override('emissive', activatedEmissive), 'memory:remember-emissive'),
        ]),
      ],
    }))
    .build();
}

function createTextScene(tuning: LabSceneTuning, stress: boolean): SceneDefinition {
  const totalCapacity = stress ? 300 : tuning.particles;
  const coreCapacity = Math.max(1, Math.round(totalCapacity * 0.68));
  const ghostCapacity = Math.max(1, totalCapacity - coreCapacity);
  const lift = tuning.drift / 54;
  const light = tuning.glow / 44;

  return createScene('lab-text-emergence', { seed: 31 })
    .field('core-lift', noiseField({ strength: stress ? 0.15 : 0.09, scale: 3.6, speed: 0.14, seed: 31 }))
    .field('ghost-lift', noiseField({ strength: stress ? 0.11 : 0.065, scale: 4.4, speed: 0.1, seed: 32 }))
    .material('core-ink', solidMaterial({
      color: '#b9d8ff',
      radius: 1.8,
      alpha: Math.min(0.72, Math.max(0.46, 0.52 * light)),
      emissive: 0,
      trail: 0,
      mark: { kind: 'bar', aspect: 3.6 },
    }))
    .material('ghost-ink', solidMaterial({
      color: '#6f91bc',
      radius: 1.25,
      alpha: Math.min(0.34, Math.max(0.16, 0.24 * light)),
      emissive: 0,
      trail: 0,
      mark: { kind: 'bar', aspect: 5 },
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
      alpha: 0.92,
      letterSpacing: 0,
      glow: {
        color: '#93c5fd',
        alpha: Math.min(0.2, Math.max(0.08, 0.12 * light)),
        blur: Math.min(20, Math.max(10, 14 * light)),
      },
      debugBounds: stress,
      tags: ['source', 'text'],
    }))
    .emitter('core-source', textBoxEmitter({
      x: 0.2,
      y: 0.33,
      width: 0.6,
      height: 0.18,
      source: 'depth-word-source',
      rate: stress ? 54 : emissionRate(15, totalCapacity, 96),
      material: 'core-ink',
      direction: { min: -1.82, max: -1.32 },
      speed: { min: 0.03 * lift, max: 0.058 * lift },
      lifetime: { min: 2.8, max: 4.8 },
    }))
    .emitter('ghost-source', textBoxEmitter({
      x: 0.2,
      y: 0.33,
      width: 0.6,
      height: 0.18,
      source: 'depth-word-source',
      rate: stress ? 30 : emissionRate(7, totalCapacity, 96),
      material: 'ghost-ink',
      direction: { min: -2.02, max: -1.12 },
      speed: { min: 0.018 * lift, max: 0.042 * lift },
      lifetime: { min: 3.8, max: 6.2 },
    }))
    .system('core-fragments', particles({
      emitter: 'core-source',
      material: 'core-ink',
      capacity: coreCapacity,
      pipes: [
        pipe('core-emergence', [applyFieldVelocity('core-lift', stress ? 0.52 : 0.3), decayAlpha({ rate: 0.1 })]),
      ],
    }))
    .system('ghost-fragments', particles({
      emitter: 'ghost-source',
      material: 'ghost-ink',
      capacity: ghostCapacity,
      pipes: [
        pipe('ghost-emergence', [applyFieldVelocity('ghost-lift', stress ? 0.34 : 0.18), decayAlpha({ rate: 0.055 })]),
      ],
    }))
    .build();
}

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

const FRACTURE_ORIGIN: PrimitivePoint = { x: 0.47, y: 0.49 };
const FRACTURE_BRANCHES: readonly FractureBranch[] = [
  {
    id: 'primary-west',
    points: [
      FRACTURE_ORIGIN,
      { x: 0.438, y: 0.478 },
      { x: 0.401, y: 0.489 },
      { x: 0.366, y: 0.454 },
      { x: 0.321, y: 0.461 },
      { x: 0.286, y: 0.438 },
    ],
    color: '#93c5fd',
    alpha: 0.82,
    width: 1,
    revealStart: 0.65,
    revealEnd: 0.681,
    fadeStart: 0.725,
    fadeEnd: 0.85,
  },
  {
    id: 'primary-east',
    points: [
      FRACTURE_ORIGIN,
      { x: 0.503, y: 0.47 },
      { x: 0.542, y: 0.477 },
      { x: 0.575, y: 0.439 },
      { x: 0.618, y: 0.43 },
      { x: 0.662, y: 0.392 },
      { x: 0.716, y: 0.378 },
    ],
    color: '#93c5fd',
    alpha: 0.82,
    width: 1,
    revealStart: 0.65,
    revealEnd: 0.681,
    fadeStart: 0.725,
    fadeEnd: 0.85,
  },
  {
    id: 'secondary-upper',
    points: [
      { x: 0.401, y: 0.489 },
      { x: 0.387, y: 0.444 },
      { x: 0.352, y: 0.416 },
      { x: 0.344, y: 0.374 },
      { x: 0.316, y: 0.342 },
    ],
    color: '#93c5fd',
    alpha: 0.66,
    width: 0.7,
    revealStart: 0.672,
    revealEnd: 0.698,
    fadeStart: 0.725,
    fadeEnd: 0.825,
  },
  {
    id: 'secondary-lower',
    points: [
      { x: 0.542, y: 0.477 },
      { x: 0.557, y: 0.518 },
      { x: 0.59, y: 0.536 },
      { x: 0.606, y: 0.576 },
      { x: 0.635, y: 0.604 },
    ],
    color: '#93c5fd',
    alpha: 0.66,
    width: 0.7,
    revealStart: 0.675,
    revealEnd: 0.7,
    fadeStart: 0.725,
    fadeEnd: 0.825,
  },
  {
    id: 'secondary-east-hook',
    points: [
      { x: 0.618, y: 0.43 },
      { x: 0.642, y: 0.455 },
      { x: 0.68, y: 0.46 },
      { x: 0.704, y: 0.488 },
    ],
    color: '#93c5fd',
    alpha: 0.66,
    width: 0.7,
    revealStart: 0.68,
    revealEnd: 0.703,
    fadeStart: 0.725,
    fadeEnd: 0.825,
  },
  {
    id: 'tertiary-upper',
    points: [
      { x: 0.352, y: 0.416 },
      { x: 0.326, y: 0.4 },
      { x: 0.309, y: 0.373 },
    ],
    color: '#93c5fd',
    alpha: 0.5,
    width: 0.45,
    revealStart: 0.687,
    revealEnd: 0.703,
    fadeStart: 0.725,
    fadeEnd: 0.794,
  },
  {
    id: 'tertiary-lower',
    points: [
      { x: 0.59, y: 0.536 },
      { x: 0.621, y: 0.547 },
      { x: 0.642, y: 0.57 },
    ],
    color: '#93c5fd',
    alpha: 0.5,
    width: 0.45,
    revealStart: 0.69,
    revealEnd: 0.703,
    fadeStart: 0.725,
    fadeEnd: 0.794,
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
      durationMs: stress ? 4_800 : 8_000,
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
      alpha: Math.min(0.86, branch.alpha * (0.82 + voltage * 0.18)),
      width: branch.width * (0.9 + voltage * 0.1),
      glow: {
        color: branch.color,
        alpha: Math.min(0.09, 0.025 + voltage * 0.04),
        width: Math.min(2.5, 1.2 + voltage * 0.8),
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
function fracturePhase(state: PrimitiveTimelineDebugState): string {
  const progress = state.durationMs > 0 ? state.timeMs / state.durationMs : 0;
  if (progress < 0.65 || progress >= 0.85) return 'Quiet';
  if (progress < 0.703) return 'Reveal';
  if (progress < 0.725) return 'Hold';
  return 'Decay';
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
  const timelinePhase = section.querySelector('[data-timeline-phase]');

  if (
    !config ||
    !(canvas instanceof HTMLCanvasElement) ||
    !(stageParticles instanceof HTMLElement) ||
    !(snapshot instanceof HTMLElement) ||
    !(timelineInput instanceof HTMLInputElement) ||
    !(timelineOutput instanceof HTMLOutputElement) ||
    !(timelinePhase instanceof HTMLElement)
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
    timelinePhase,
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
    runtime.timelinePhase.textContent = 'Continuous';
    return;
  }

  runtime.timelineInput.disabled = false;
  runtime.timelineInput.max = String(Math.max(0, Math.ceil(state.durationMs) - 1));
  runtime.timelineInput.value = String(Math.round(state.timeMs));
  runtime.timelineOutput.value = `${(state.timeMs / 1_000).toFixed(2)}s / ${(state.durationMs / 1_000).toFixed(2)}s`;
  runtime.timelinePhase.textContent = runtime.config.debugPhase?.(state) ?? 'Primitive timeline';
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

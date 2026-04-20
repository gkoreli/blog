import {
  createScene,
  defineRectZone,
  glowMaterial,
  noiseField,
  particles,
  scrollTimeline,
  textBoxEmitter,
} from '../authoring/index.js';
import { compileScene } from '../compile/index.js';
import type { CompiledRuntimeScene } from '../compile/index.js';
import {
  add,
  applyFieldVelocity,
  decayAlpha,
  insideZone,
  multiply,
  onEnterZone,
  pipe,
  timelinePulse,
} from '../effects/index.js';

export function createFoundationScene(sceneId = 'foundation-particle-field'): CompiledRuntimeScene {
  const definition = createScene(sceneId)
    .field('hero-noise', noiseField({
      strength: 0.35,
      scale: 2.4,
      speed: 0.45,
      seed: 15,
    }))
    .material('thought', glowMaterial({
      color: '#6ec9a8',
      radius: 2.4,
      alpha: 0.72,
      emissive: 0.35,
      trail: 0.12,
    }))
    .zone('memory', defineRectZone({
      x: 0.18,
      y: 0.18,
      width: 0.64,
      height: 0.42,
      tags: ['memory'],
    }))
    .emitter('hero-title', textBoxEmitter({
      x: 0.12,
      y: 0.16,
      width: 0.76,
      height: 0.22,
      rate: 28,
      material: 'thought',
      speed: { min: 0.02, max: 0.07 },
      lifetime: { min: 3.5, max: 7 },
    }))
    .timeline('hero-scroll', scrollTimeline({
      inputStart: 0,
      inputEnd: 0.35,
      outputStart: 0.25,
      outputEnd: 1,
    }))
    .system('nodes', particles({
      emitter: 'hero-title',
      material: 'thought',
      capacity: 180,
      pipes: [
        pipe('ambient-drift', [
          applyFieldVelocity('hero-noise', 0.9),
          decayAlpha({ rate: 0.035 }),
        ]),
        pipe('memory-glow', [
          onEnterZone('memory', add('emissive', 0.22)),
          insideZone('memory', multiply('radius', 1.005)),
        ]),
        pipe('section-pulse', [
          timelinePulse('hero-scroll', 'alpha', { min: 0.45, max: 0.92 }),
        ]),
      ],
    }))
    .build();

  return compileScene(definition);
}

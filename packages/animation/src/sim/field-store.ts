import type { FieldDefinition } from '../authoring/index.js';

export function sampleFieldVelocity(
  field: FieldDefinition,
  x: number,
  y: number,
  timeSeconds: number,
): readonly [number, number] {
  const phase = field.seed * 12.9898 + timeSeconds * field.speed;
  const angle = Math.sin((x * field.scale + phase) * 8.31) + Math.cos((y * field.scale - phase) * 7.17);
  const vx = Math.cos(angle * Math.PI) * field.strength;
  const vy = Math.sin(angle * Math.PI) * field.strength;
  return [vx, vy];
}

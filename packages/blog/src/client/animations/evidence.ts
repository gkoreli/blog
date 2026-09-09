/**
 * Evidence stacks — projected records open in depth, then settle into alignment.
 * Every face retains the same seeded source signature. Phones get two compact
 * stacks above and below the title; wide layouts place them on opposite flanks.
 * All geometry is derived from seed, size, and time, including the spring settle.
 */
import type { AnimationModule, AnimationPoint } from './pipeline.js';

interface EvidenceOptions { seed?: number; }
interface Point3D { x: number; y: number; z: number; }
interface ProjectedPoint extends AnimationPoint { depth: number; }
interface SourceMark { width: number; height: number; inset: number; }
interface CardPose {
  origin: AnimationPoint;
  x: number; y: number; z: number;
  sinX: number; cosX: number;
  sinY: number; cosY: number;
  sinZ: number; cosZ: number;
  focal: number;
}

const CYCLE_FRAMES = 360;
const LAYERS = [-1, 0, 1];

function cyclePhase(t: number): number {
  return ((t % CYCLE_FRAMES) + CYCLE_FRAMES) % CYCLE_FRAMES / CYCLE_FRAMES;
}

function seededRandom(seed: number): () => number {
  let state = Math.trunc(seed) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getTheme() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    bg: read('--color-bg', '#faf8f5'),
    face: read('--color-surface', '#f0ece6'),
    ink: read('--color-text-muted', '#7a7568'),
    source: read('--color-link', '#1a6b4e'),
    answer: read('--color-accent-warm', '#a88a2a'),
    dark: document.documentElement.getAttribute('data-theme') === 'dark',
  };
}

function ease(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

/** Open over 3.4 seconds, then register with one short damped overshoot. */
function spread(phase: number): number {
  if (phase < 0.56) return Math.sin(phase / 0.56 * Math.PI / 2);
  const closing = (phase - 0.56) / 0.44;
  const spring = Math.exp(-5 * closing) * (Math.cos(9 * closing) + 5 / 9 * Math.sin(9 * closing));
  return spring * (1 - ease((closing - 0.7) / 0.3));
}

function project(point: Point3D, pose: CardPose): ProjectedPoint {
  const x = point.x + pose.x;
  const y = point.y + pose.y;
  const z = point.z + pose.z;
  const tiltedY = y * pose.cosX - z * pose.sinX;
  const tiltedZ = y * pose.sinX + z * pose.cosX;
  const turnedX = x * pose.cosY + tiltedZ * pose.sinY;
  const turnedZ = -x * pose.sinY + tiltedZ * pose.cosY;
  const scale = pose.focal / (pose.focal - turnedZ);
  return {
    x: pose.origin.x + (turnedX * pose.cosZ - tiltedY * pose.sinZ) * scale,
    y: pose.origin.y + (turnedX * pose.sinZ + tiltedY * pose.cosZ) * scale,
    depth: turnedZ,
  };
}

function polygon(ctx: CanvasRenderingContext2D, points: readonly AnimationPoint[]): void {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
}

function surfaceRect(ctx: CanvasRenderingContext2D, pose: CardPose, x: number, y: number, w: number, h: number): void {
  polygon(ctx, [
    project({ x, y, z: 0 }, pose),
    project({ x: x + w, y, z: 0 }, pose),
    project({ x: x + w, y: y + h, z: 0 }, pose),
    project({ x, y: y + h, z: 0 }, pose),
  ]);
}

export function evidence(options: EvidenceOptions = {}): AnimationModule {
  const random = seededRandom(options.seed ?? 7);
  const sourceMarks: SourceMark[] = Array.from({ length: 9 }, () => ({
    width: 2 + Math.floor(random() * 3),
    height: 8 + Math.floor(random() * 4) * 3,
    inset: Math.floor(random() * 2) * 3,
  }));
  const answerLengths = [0.68, 0.83, 0.52].map(length => length + random() * 0.05);
  let theme = getTheme();
  let narrow = false;
  let cardWidth = 0;
  let cardHeight = 0;
  let focal = 0;
  let corners: Point3D[] = [];

  const themeObserver = new MutationObserver(() => { theme = getTheme(); });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function drawCard(ctx: CanvasRenderingContext2D, pose: CardPose, front: boolean): void {
    const face = corners.map(point => project(point, pose));
    const back = corners.map(point => project({ ...point, z: -3.5 }, pose));

    // A bounded shadow and projected side faces establish depth. Drawing cards
    // from far to near lets the foreground records occlude those behind them.
    ctx.save();
    ctx.translate(3, 8);
    polygon(ctx, back);
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = theme.dark ? 0.13 : 0.085;
    ctx.shadowColor = theme.ink;
    ctx.shadowBlur = 11;
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = theme.dark ? 0.34 : 0.23;
    face.forEach((point, index) => {
      const next = (index + 1) % face.length;
      const nextFace = face[next];
      const nextBack = back[next];
      const backPoint = back[index];
      if (!nextFace || !nextBack || !backPoint) return;
      polygon(ctx, [point, nextFace, nextBack, backPoint]);
      ctx.fill();
    });

    polygon(ctx, face);
    ctx.globalAlpha = 0.97;
    ctx.fillStyle = theme.face;
    ctx.fill();
    ctx.globalAlpha = front ? 0.54 : 0.32;
    ctx.strokeStyle = theme.source;
    ctx.lineWidth = front ? 1.1 : 0.8;
    ctx.stroke();

    const upperLeft = face[0];
    const lowerRight = face[3];
    if (upperLeft && lowerRight) {
      const wash = ctx.createLinearGradient(upperLeft.x, upperLeft.y, lowerRight.x, lowerRight.y);
      wash.addColorStop(0, theme.source);
      wash.addColorStop(0.55, theme.bg);
      wash.addColorStop(1, theme.answer);
      ctx.fillStyle = wash;
      ctx.globalAlpha = theme.dark ? 0.09 : 0.055;
      ctx.fill();
    }

    const topStart = face[0];
    const topEnd = face[1];
    if (topStart && topEnd) {
      ctx.beginPath();
      ctx.moveTo(topStart.x, topStart.y);
      ctx.lineTo(topEnd.x, topEnd.y);
      ctx.strokeStyle = theme.source;
      ctx.globalAlpha = theme.dark ? 0.7 : 0.48;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }

    const inset = narrow ? 17 : 23;
    const left = -cardWidth / 2 + inset;
    const top = -cardHeight / 2 + inset;
    const spacing = narrow ? 7 : 8;
    ctx.fillStyle = theme.source;
    ctx.globalAlpha = front ? 0.77 : 0.57;
    for (const reflected of [false, true]) {
      sourceMarks.forEach((mark, index) => {
        const x = left + index * spacing;
        const y = top + mark.inset;
        surfaceRect(ctx, pose,
          reflected ? -x - mark.width : x,
          reflected ? -y - mark.height : y,
          mark.width, mark.height);
        ctx.fill();
      });
    }

    // The answer and its retained-field row are projected on the same face.
    ctx.fillStyle = theme.answer;
    ctx.globalAlpha = front ? 0.4 : 0.25;
    answerLengths.forEach((length, row) => {
      surfaceRect(ctx, pose, left, -7 + row * 9, (cardWidth - inset * 2) * length, row === 0 ? 2 : 1.3);
      ctx.fill();
    });
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = 0.25;
    for (let index = 0; index < 3; index++) {
      surfaceRect(ctx, pose, left + index * 14, cardHeight / 2 - inset - 9, 8, 1.5);
      ctx.fill();
    }
  }

  return {
    resize(w) {
      narrow = w < 620;
      cardWidth = narrow ? Math.min(290, w * 0.67) : Math.min(380, w * 0.32);
      cardHeight = cardWidth * (narrow ? 0.57 : 0.61);
      focal = Math.max(620, w * 0.8);
      const halfW = cardWidth / 2;
      const halfH = cardHeight / 2;
      const cut = narrow ? 10 : 14;
      corners = [
        { x: -halfW, y: -halfH, z: 0 },
        { x: halfW - cut, y: -halfH, z: 0 },
        { x: halfW, y: -halfH + cut, z: 0 },
        { x: halfW, y: halfH, z: 0 },
        { x: -halfW, y: halfH, z: 0 },
      ];
      theme = getTheme();
    },

    tick(t, w, h): AnimationPoint[] {
      const wave = cyclePhase(t) * Math.PI * 2;
      return [
        {
          x: w * (narrow ? 0.32 : 0.14) + Math.sin(wave) * (narrow ? 4 : 9),
          y: h * (narrow ? 0.12 : 0.28) + Math.cos(wave) * 5,
        },
        {
          x: w * (narrow ? 0.7 : 0.86) - Math.sin(wave) * (narrow ? 4 : 9),
          y: h * (narrow ? 0.88 : 0.73) - Math.cos(wave) * 5,
        },
      ];
    },

    draw(ctx, points, t, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cycle = cyclePhase(t);
      const wave = cycle * Math.PI * 2;
      points.forEach((origin, stackIndex) => {
        const direction = stackIndex === 0 ? 1 : -1;
        const phase = (cycle + 0.12 + stackIndex * 0.08) % 1;
        const amount = spread(phase);
        const tiltX = direction * (0.5 + Math.sin(wave + stackIndex) * 0.14);
        const tiltY = direction * (-0.35 + Math.cos(wave) * 0.17);
        const tiltZ = direction * (-0.14 + Math.sin(wave) * 0.055);
        const poses = LAYERS.map(layer => {
          const pose: CardPose = {
            origin,
            x: direction * layer * (10 + amount * (narrow ? 14 : 23)),
            y: -direction * layer * (5 + amount * 13),
            z: layer * (15 + amount * (narrow ? 43 : 58)),
            sinX: Math.sin(tiltX), cosX: Math.cos(tiltX),
            sinY: Math.sin(tiltY), cosY: Math.cos(tiltY),
            sinZ: Math.sin(tiltZ), cosZ: Math.cos(tiltZ),
            focal,
          };
          return { pose, depth: project({ x: 0, y: 0, z: 0 }, pose).depth };
        }).sort((a, b) => a.depth - b.depth);

        poses.forEach(({ pose }, index) => drawCard(ctx, pose, index === poses.length - 1));
      });
      ctx.globalAlpha = 1;
    },

    dispose() {
      themeObserver.disconnect();
    },
  };
}

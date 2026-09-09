/**
 * Evidence plates — translucent records separate and return to registration.
 * Each plate retains the same seeded source-mark pattern. A broad answer rule
 * stays quiet in the middle; the evidence is readable around the outer edges.
 *
 * Geometry is a function of time, dimensions, and seed, so seeking or resizing
 * cannot change a record's marks. The shared runner owns visibility and timing.
 */
import type { AnimationModule, AnimationPoint } from './pipeline.js';

interface EvidenceOptions {
  seed?: number;
}

interface SourceMark {
  width: number;
  height: number;
  inset: number;
}

interface Plate {
  depth: number;
  tilt: number;
}

const CYCLE_FRAMES = 1080;
const PLATES: readonly Plate[] = [
  { depth: -1, tilt: -0.014 },
  { depth: 0, tilt: 0.005 },
  { depth: 1, tilt: 0.016 },
];

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

/** Hold, separate, inspect, register, hold — one unbroken 18-second cycle. */
function separation(t: number): number {
  const phase = ((t / CYCLE_FRAMES) % 1 + 1) % 1;
  const opening = ease((phase - 0.08) / 0.3);
  const closing = ease((phase - 0.56) / 0.32);
  return 0.2 + 0.8 * opening * (1 - closing);
}

function plateOutline(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const fold = Math.min(23, width * 0.07);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width - fold, 0);
  ctx.lineTo(width, fold);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
}

function registrationMark(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x + 5, y);
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x, y + 5);
}

export function evidence(options: EvidenceOptions = {}): AnimationModule {
  const random = seededRandom(options.seed ?? 7);
  const sourceMarks: SourceMark[] = Array.from({ length: 9 }, () => ({
    width: 2 + Math.floor(random() * 3),
    height: 5 + Math.floor(random() * 4) * 3,
    inset: Math.floor(random() * 2) * 3,
  }));
  const answerLengths = [0.58, 0.79, 0.45].map(length => length + random() * 0.05);
  let theme = getTheme();
  let plateWidth = 0;
  let plateHeight = 0;
  let spreadX = 0;
  let spreadY = 0;
  let sourceSpacing = 0;

  const themeObserver = new MutationObserver(() => { theme = getTheme(); });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function drawSourceMarks(ctx: CanvasRenderingContext2D, x: number, y: number, reflected: boolean): void {
    ctx.save();
    ctx.translate(x, y);
    if (reflected) ctx.rotate(Math.PI);
    ctx.beginPath();
    ctx.moveTo(-8, -5);
    ctx.lineTo(-8, 21);
    ctx.lineTo(-3, 21);
    ctx.moveTo(sourceSpacing * sourceMarks.length + 2, -5);
    ctx.lineTo(sourceSpacing * sourceMarks.length + 2, 21);
    ctx.lineTo(sourceSpacing * sourceMarks.length - 3, 21);
    ctx.stroke();
    sourceMarks.forEach((mark, index) => {
      ctx.fillRect(index * sourceSpacing, mark.inset, mark.width, mark.height);
    });
    ctx.restore();
  }

  return {
    resize(w, h) {
      // On phones the top-left and bottom-right records extend out of frame;
      // their identifying marks remain inside the narrow visible corners.
      const narrow = w < 620;
      plateWidth = w * (narrow ? 0.89 : 0.82);
      plateHeight = h * (narrow ? 0.77 : 0.72);
      spreadX = Math.min(58, w * (narrow ? 0.058 : 0.046));
      spreadY = Math.min(61, h * 0.07);
      sourceSpacing = narrow ? 6 : 8;
      theme = getTheme();
    },

    tick(t, w, h): AnimationPoint[] {
      const amount = separation(t);
      return PLATES.map(plate => ({
        x: w / 2 + plate.depth * spreadX * amount,
        y: h / 2 + plate.depth * spreadY * amount,
      }));
    },

    draw(ctx, points, t, w, h) {
      ctx.clearRect(0, 0, w, h);
      const amount = separation(t);
      const registered = 1 - (amount - 0.2) / 0.8;
      const left = (w - plateWidth) / 2;
      const top = (h - plateHeight) / 2;

      // Fixed printer's registration crosses make the alignment legible.
      ctx.strokeStyle = theme.ink;
      ctx.globalAlpha = theme.dark ? 0.22 : 0.2;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      registrationMark(ctx, left - 13, top - 13);
      registrationMark(ctx, left + plateWidth + 13, top - 13);
      registrationMark(ctx, left - 13, top + plateHeight + 13);
      registrationMark(ctx, left + plateWidth + 13, top + plateHeight + 13);
      ctx.stroke();

      PLATES.forEach((plate, index) => {
        const point = points[index];
        if (!point) return;
        const front = index === PLATES.length - 1;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(plate.tilt * amount);
        ctx.translate(-plateWidth / 2, -plateHeight / 2);

        // Transparent fills prevent the rear sheets from becoming a busy grid.
        plateOutline(ctx, plateWidth, plateHeight);
        ctx.globalAlpha = front ? 0.16 : 0.1;
        ctx.fillStyle = theme.bg;
        ctx.fill();
        ctx.globalAlpha = (theme.dark ? 0.2 : 0.17) + index * 0.035;
        ctx.strokeStyle = front ? theme.source : theme.ink;
        ctx.lineWidth = front ? 1 : 0.8;
        ctx.stroke();

        // Folded corner and inner margin give the layers a document silhouette.
        const fold = Math.min(23, plateWidth * 0.07);
        ctx.beginPath();
        ctx.moveTo(plateWidth - fold, 0);
        ctx.lineTo(plateWidth - fold, fold);
        ctx.lineTo(plateWidth, fold);
        ctx.moveTo(15, 63);
        ctx.lineTo(15, plateHeight - 64);
        ctx.moveTo(plateWidth - 15, 64);
        ctx.lineTo(plateWidth - 15, plateHeight - 63);
        ctx.stroke();

        // Exactly the same marks remain on every layer, on both exposed corners.
        ctx.globalAlpha = (theme.dark ? 0.38 : 0.34) + registered * 0.13;
        ctx.strokeStyle = theme.source;
        ctx.fillStyle = theme.source;
        ctx.lineWidth = 0.7;
        drawSourceMarks(ctx, 23, 23, false);
        drawSourceMarks(ctx, plateWidth - 23, plateHeight - 23, true);

        // Short margin rules suggest retained fields without imitating UI text.
        ctx.strokeStyle = theme.ink;
        ctx.globalAlpha = theme.dark ? 0.17 : 0.15;
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        for (let row = 0; row < 4; row++) {
          const ruleY = 83 + row * 11;
          const ruleWidth = 19 + (row % 3) * 7;
          ctx.moveTo(23, ruleY);
          ctx.lineTo(23 + ruleWidth, ruleY);
          ctx.moveTo(plateWidth - 23, plateHeight - ruleY);
          ctx.lineTo(plateWidth - 23 - ruleWidth, plateHeight - ruleY);
        }
        ctx.stroke();

        // The answer occupies a much quieter center than its surrounding record.
        ctx.strokeStyle = theme.answer;
        ctx.globalAlpha = theme.dark ? 0.09 : 0.075;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        answerLengths.forEach((length, row) => {
          const ruleY = plateHeight * 0.48 + row * 12;
          ctx.moveTo(plateWidth * 0.14, ruleY);
          ctx.lineTo(plateWidth * (0.14 + length * 0.72), ruleY);
        });
        ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    },

    dispose() {
      themeObserver.disconnect();
    },
  };
}

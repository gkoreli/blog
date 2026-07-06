import { staticHtml as html, raw } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

/**
 * PrStreamHero — animated merge-stream preamble for the backlog-mcp
 * "One Hundred Pull Requests" post.
 *
 * Every tick is a real merged PR from gkoreli/backlog-mcp, positioned by its
 * actual merge date (day 0 = 2026-01-16, day 77 = 2026-04-03). The data is
 * baked in at build time — the animation is a chart, not a decoration.
 *
 * PRs 67–87 (the framework weekend, Feb 7–12) render in warm gold: the six
 * days in which the nisli framework was designed, built, and fully migrated.
 * After Apr 3 the merges stop and plain commit ticks continue — the moment
 * the project outgrew its own pull requests.
 *
 * Pure CSS/SVG animation: the main line draws left to right, each merge pops
 * when the line reaches its date, and a counter (CSS @property + counter()
 * trick) counts merges with burst-accurate keyframes generated from the same
 * data. No client JS. prefers-reduced-motion gets the final state.
 */

/** Merged PRs grouped by merge day. Day 0 = 2026-01-16. Source: GitHub API. */
const MERGE_DAYS: { day: number; prs: number[] }[] = [
  { day: 0, prs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, // Jan 16 — launch burst
  { day: 1, prs: [11, 12, 13, 14, 15] },
  { day: 4, prs: [16, 17] },
  { day: 5, prs: [18, 19, 20, 21, 22] },
  { day: 6, prs: [23, 24, 25, 26, 27] },
  { day: 7, prs: [28] },
  { day: 8, prs: [29, 32, 33] },
  { day: 9, prs: [34, 36] }, // Jan 25 — transport saga begins
  { day: 10, prs: [37, 39, 40, 41, 42, 43, 44, 48, 49] },
  { day: 11, prs: [50, 51, 52, 55] },
  { day: 12, prs: [56, 57] },
  { day: 13, prs: [58] },
  { day: 15, prs: [59] },
  { day: 18, prs: [60, 61] }, // Feb 3 — spotlight + activity, +8112 lines
  { day: 20, prs: [62, 63] },
  { day: 21, prs: [64, 65] },
  { day: 22, prs: [66] },
  { day: 23, prs: [67, 68] }, // Feb 8 — framework ADR weekend
  { day: 24, prs: [69, 70, 71, 72, 73, 74, 75, 76, 77, 78] }, // Feb 9 — framework day
  { day: 25, prs: [79, 80, 81] },
  { day: 26, prs: [82, 83, 84, 85] },
  { day: 27, prs: [86, 87] },
  { day: 29, prs: [88, 89, 90] }, // Feb 14 — context hydration begins
  { day: 30, prs: [91, 92, 93, 94] },
  { day: 31, prs: [95, 96] },
  { day: 33, prs: [97] },
  { day: 35, prs: [98] },
  { day: 36, prs: [99] },
  { day: 39, prs: [100, 101, 102, 103, 104, 105] }, // Feb 24 — nisli extracted to npm
  { day: 69, prs: [106, 107, 108, 109] }, // Mar 26 — after a month of direct commits
  { day: 77, prs: [110, 111, 112, 113, 114, 115, 116, 117] }, // Apr 3 — the last PR day
];

/** The framework weekend: React skill removed, nisli born (PRs 67–87). */
const FW_RANGE: [number, number] = [67, 87];

// Geometry (SVG viewBox 1000 × 250)
const LINE_X0 = 30;
const LINE_X1 = 970;
const ERA_X0 = 40; // day 0
const ERA_X1 = 760; // day 77 — last PR; direct commits continue to the right
const DAYS = 77;
const BASE_Y = 205;
const DOT_Y0 = 185;
const STACK_GAP = 13;

// Timing (seconds)
const START = 0.9; // line starts after the title begins to rise
const DRAW = 5.5; // full line draw duration

const xForDay = (day: number): number => ERA_X0 + (day * (ERA_X1 - ERA_X0)) / DAYS;
const delayAtX = (x: number): number => START + ((x - LINE_X0) / (LINE_X1 - LINE_X0)) * DRAW;

function mergeMarks(): StaticResult[] {
  const marks: StaticResult[] = [];
  for (const { day, prs } of MERGE_DAYS) {
    const x = xForDay(day);
    const d = delayAtX(x);
    prs.forEach((pr, k) => {
      const y = DOT_Y0 - k * STACK_GAP;
      const fw = pr >= FW_RANGE[0] && pr <= FW_RANGE[1];
      marks.push(html`<g class="prs-merge${fw ? ' fw' : ''}" style="--d: ${(d + k * 0.05).toFixed(2)}s">
        <line x1="${x}" y1="${y + 4}" x2="${x}" y2="${BASE_Y - 2}"></line>
        <circle cx="${x}" cy="${y}" r="3.4"><title>PR #${pr}</title></circle>
      </g>`);
    });
  }
  return marks;
}

/** Plain commit ticks after the last PR — the direct-commit era. */
function directCommitTicks(): StaticResult[] {
  const ticks: StaticResult[] = [];
  for (let i = 0; i < 18; i++) {
    const x = 778 + i * 9.5;
    const d = delayAtX(x);
    ticks.push(html`<line class="prs-dc" style="--d: ${d.toFixed(2)}s" x1="${x}" y1="${BASE_Y - 6}" x2="${x}" y2="${BASE_Y + 6}"></line>`);
  }
  return ticks;
}

/**
 * Burst-accurate counter keyframes: the merge counter freezes during the
 * month-long gap and leaps on burst days, because the stops are generated
 * from the same merge data that places the dots.
 */
function counterKeyframes(): string {
  const total = MERGE_DAYS.reduce((n, g) => n + g.prs.length, 0);
  const dur = START + DRAW;
  let cumulative = 0;
  const stops: string[] = ['0% { --prs-n: 0; }'];
  // Hold at the previous count until the line reaches each merge day,
  // then step up — two stops per day make the bursts read as jumps.
  for (const { day, prs } of MERGE_DAYS) {
    const at = delayAtX(xForDay(day));
    const before = Math.max(0, ((at - 0.06) / dur) * 100);
    const after = Math.min(100, ((at + prs.length * 0.05) / dur) * 100);
    stops.push(`${before.toFixed(2)}% { --prs-n: ${cumulative}; }`);
    cumulative += prs.length;
    stops.push(`${after.toFixed(2)}% { --prs-n: ${cumulative}; }`);
  }
  stops.push(`100% { --prs-n: ${total}; }`);
  return `@keyframes prs-count { ${stops.join(' ')} }`;
}

const MONTHS: { x: number; label: string }[] = [
  { x: xForDay(0), label: 'JAN 16' },
  { x: xForDay(16), label: 'FEB' },
  { x: xForDay(44), label: 'MAR' },
  { x: xForDay(75), label: 'APR 3' },
];

export function PrStreamHero({ kicker, title, byline }: { kicker: string; title: StaticResult; byline: StaticResult }) {
  return html`<div class="prs-hero">
    <style>${raw(counterKeyframes())}</style>
    <div class="prs-hero-inner">
      <span class="prs-kicker">${kicker}</span>
      ${title}
      ${byline}
    </div>
    <div class="prs-stream" role="img" aria-label="Timeline of 108 merged pull requests on backlog-mcp from January 16 to April 3, 2026, with dense bursts on launch day, the framework weekend of February 9, and the final OAuth day — after which pull requests stop and direct commits continue.">
      <svg viewBox="0 0 1000 250" preserveAspectRatio="xMidYMid meet">
        <path class="prs-line" d="M ${LINE_X0} ${BASE_Y} H ${LINE_X1}" pathLength="1"></path>
        ${mergeMarks()}
        ${directCommitTicks()}
        ${MONTHS.map((m) => html`<text class="prs-month" x="${m.x}" y="232">${m.label}</text>`)}
        <text class="prs-era" x="862" y="232">direct commits →</text>
      </svg>
      <div class="prs-fade"></div>
      <p class="prs-legend">
        <span class="prs-count" aria-hidden="true"></span><span class="prs-count-label"> merged pull requests · 78 days · every tick is real</span>
      </p>
    </div>
    <span class="prs-scroll">↓ scroll to read</span>
  </div>`;
}

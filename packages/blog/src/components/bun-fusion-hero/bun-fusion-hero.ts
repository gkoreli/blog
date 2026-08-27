import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

type DependencyJob = {
  packageName: string;
  bunSurface: string;
};

/**
 * The fifteen package-job mappings in Bun's 1.4 release post. These are job
 * substitutions, not claims of package API equivalence.
 * Source: https://bun.com/blog/bun-v1.4#whats-new
 */
const DEPENDENCY_JOBS: DependencyJob[] = [
  { packageName: 'sharp', bunSurface: 'Bun.Image' },
  { packageName: 'puppeteer', bunSurface: 'Bun.WebView' },
  { packageName: 'marked', bunSurface: 'Bun.markdown' },
  { packageName: 'node-cron', bunSurface: 'Bun.cron' },
  { packageName: 'node-pty', bunSurface: 'Bun.Terminal' },
  { packageName: 'concurrently', bunSurface: 'bun run --parallel' },
  { packageName: 'npm-run-all', bunSurface: 'bun run --parallel' },
  { packageName: 'serve-static', bunSurface: 'Bun.serve routes' },
  { packageName: 'json5', bunSurface: 'Bun.JSON5' },
  { packageName: 'fast-xml-parser', bunSurface: 'Bun.XML' },
  { packageName: 'tar', bunSurface: 'Bun.Archive' },
  { packageName: 'string-width', bunSurface: 'Bun.stringWidth' },
  { packageName: 'slice-ansi', bunSurface: 'Bun.sliceAnsi' },
  { packageName: 'cli-truncate', bunSurface: 'Bun.sliceAnsi' },
  { packageName: 'wrap-ansi', bunSurface: 'Bun.wrapAnsi' },
];

function dependencyRows(): StaticResult[] {
  return DEPENDENCY_JOBS.map((job, index) => html`
    <li class="bun-fusion-row" style="--bun-fusion-row-delay: ${650 + index * 115}ms">
      <span class="bun-fusion-package">
        <span class="bun-fusion-sign">−</span>
        <code>${job.packageName}</code>
      </span>
      <span class="bun-fusion-seam">
        <span class="bun-fusion-tooth bun-fusion-tooth--left"></span>
        <span class="bun-fusion-tooth bun-fusion-tooth--right"></span>
      </span>
      <span class="bun-fusion-surface">
        <span class="bun-fusion-sign">+</span>
        <code>${job.bunSurface}</code>
      </span>
    </li>
  `);
}

/**
 * BunFusionHero — a no-JavaScript dependency zipper for the Bun 1.4 issue.
 *
 * Fifteen release-post mappings close row by row into a single Bun binary.
 * The Rust migration is deliberately shown inside the binary, on a separate
 * plane from the package-job convergence. Motion adds sequence; the complete
 * mapping and thesis remain visible as static HTML.
 */
export function BunFusionHero({
  issueNum,
  date,
  tags,
  title,
  subtitle,
  author,
  readTime,
  footprint,
}: {
  issueNum: string;
  date: string;
  tags: string;
  title: StaticResult;
  subtitle: string;
  author: string;
  readTime: string;
  footprint?: { label: string; url: string };
}) {
  return html`<div class="bun-fusion-hero">
    <div class="bun-fusion-heading">
      <div class="bun-fusion-pills">
        <span class="bun-fusion-pill bun-fusion-pill--accent">${issueNum}</span>
        <span class="bun-fusion-pill">${date}</span>
      </div>
      <span class="bun-fusion-kicker">${tags}</span>
      ${title}
      <p class="bun-fusion-subtitle">${subtitle}</p>
      <div class="bun-fusion-byline">
        <span><strong>${author}</strong></span>
        <span class="bun-fusion-byline-sep">·</span>
        <span>${readTime}</span>
      </div>
      ${footprint ? html`<a class="bun-fusion-footprint" href="${footprint.url}">
        ${footprint.label} <span aria-hidden="true">↗</span>
      </a>` : ''}
    </div>

    <figure
      class="bun-fusion-machine"
      role="img"
      aria-label="Bun 1.4 maps fifteen package jobs to built-in Bun surfaces that ship in one binary, while Bun's internal implementation changes from Zig to Rust to move more lifetime checks into compiler feedback."
    >
      <div class="bun-fusion-machine-inner" aria-hidden="true">
        <div class="bun-fusion-ledger">
          <div class="bun-fusion-ledger-head">
            <span>package.json · job</span>
            <span>built into Bun · surface</span>
          </div>
          <ol class="bun-fusion-rows" style="--bun-fusion-count: ${DEPENDENCY_JOBS.length}">
            ${dependencyRows()}
          </ol>
          <span class="bun-fusion-zipper">
            <span class="bun-fusion-zipper-mark">BUN</span>
          </span>
        </div>

        <div class="bun-fusion-funnel">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <div class="bun-fusion-binary">
          <div class="bun-fusion-binary-cap">
            <span>15 package jobs</span>
            <span class="bun-fusion-cap-arrow">→</span>
            <span>one binary</span>
          </div>
          <div class="bun-fusion-binary-name">
            <span class="bun-fusion-prompt">$</span>
            <strong>bun</strong>
            <span>1.4</span>
          </div>
          <div class="bun-fusion-core">
            <span class="bun-fusion-core-label">internal core</span>
            <div class="bun-fusion-core-swap">
              <code class="bun-fusion-zig">Zig</code>
              <span class="bun-fusion-core-arrow">→</span>
              <code class="bun-fusion-rust">Rust</code>
            </div>
            <span class="bun-fusion-core-note">more lifetime checks at compile time</span>
          </div>
        </div>

        <p class="bun-fusion-legend">fifteen named job mappings · one runtime-owned boundary</p>
      </div>
    </figure>

    <span class="bun-fusion-scroll">↓ scroll to inspect the trade</span>
  </div>`;
}

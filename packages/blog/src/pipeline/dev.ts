import { execSync } from 'node:child_process';
import { context } from 'esbuild';
import browserSync from 'browser-sync';
import { DIST, SRC, POSTS_DIR, PROMPTS_DIR, PUBLIC_DIR, ROOT, ESBUILD_ENTRIES } from '../lib/paths.js';
import { loadLocalEnv } from './env.js';

loadLocalEnv();

const buildHTML = () => {
  execSync('tsx src/pipeline/build-html.ts', { cwd: ROOT, stdio: 'inherit' });
};

buildHTML();

const ctx = await context({
  entryPoints: ESBUILD_ENTRIES,
  bundle: true,
  outdir: DIST,
  entryNames: '[name]',
  format: 'esm',
  target: 'es2024',
});
await ctx.rebuild();

const bs = browserSync.create();

bs.init({
  server: DIST,
  port: 3000,
  open: false,
  notify: false,
  ui: false,
  logLevel: 'silent',
}, () => console.log('Dev server at http://localhost:3000'));

let building = false;
let pendingRebuild: 'full' | 'client' | null = null;

const runBuild = async (mode: 'full' | 'client') => {
  if (mode === 'full') {
    buildHTML();
    await ctx.rebuild();
  } else {
    await ctx.rebuild();
  }
  bs.reload();
};

const schedule = async (mode: 'full' | 'client') => {
  if (building) {
    // Queue a rebuild — 'full' trumps 'client'
    pendingRebuild = pendingRebuild === 'full' ? 'full' : mode;
    return;
  }
  building = true;
  try {
    await runBuild(mode);
    // Drain queued rebuild if changes arrived during build
    while (pendingRebuild) {
      const next = pendingRebuild;
      pendingRebuild = null;
      await runBuild(next);
    }
  } finally {
    building = false;
  }
};

// Watch source files — chokidar handles debouncing and deduplication
// Templates, lib, pipeline, styles (HTML + esbuild rebuild)
bs.watch(`${SRC}/**/*.{ts,css}`, { ignoreInitial: true, ignored: '**/client/**' })
  .on('change', () => schedule('full'));

// Client components — esbuild rebuild + reload only (no HTML rebuild needed)
bs.watch(`${SRC}/client/**/*.ts`, { ignoreInitial: true })
  .on('change', () => schedule('client'));

// Posts (markdown + TypeScript immersive posts)
bs.watch(`${POSTS_DIR}/**/*.{md,ts}`, { ignoreInitial: true })
  .on('change', () => schedule('full'));

// Prompts — affects post header links + prompts pages
bs.watch(`${PROMPTS_DIR}/**/*.md`, { ignoreInitial: true })
  .on('change', () => schedule('full'));

// Static assets — icons, images, fonts, _headers, etc.
bs.watch(`${PUBLIC_DIR}/**/*`, { ignoreInitial: true })
  .on('change', () => schedule('full'));

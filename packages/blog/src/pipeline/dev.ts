import { execSync } from 'node:child_process';
import { context } from 'esbuild';
import browserSync from 'browser-sync';
import { CLIENT_ENTRY, DIST, SRC, POSTS_DIR, STYLES_SRC, ROOT } from '../lib/paths.js';

const buildHTML = () => {
  execSync('tsx src/pipeline/build-html.ts', { cwd: ROOT, stdio: 'inherit' });
};

buildHTML();

const ctx = await context({
  entryPoints: [CLIENT_ENTRY, STYLES_SRC],
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

const rebuild = async () => {
  if (building) return;
  building = true;
  try {
    buildHTML();
    await ctx.rebuild();
    bs.reload();
  } finally {
    building = false;
  }
};

// Watch source files — chokidar handles debouncing and deduplication
bs.watch(`${SRC}/**/*.{ts,css}`, { ignoreInitial: true, ignored: '**/client/**' })
  .on('change', rebuild);

bs.watch(`${POSTS_DIR}/**/*.md`, { ignoreInitial: true })
  .on('change', rebuild);

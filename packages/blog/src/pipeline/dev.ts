import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { basename, join, relative } from 'node:path';
import { context } from 'esbuild';
import browserSync from 'browser-sync';
import { DIST, SRC, POSTS_DIR, PROMPTS_DIR, PUBLIC_DIR, ROOT, ESBUILD_ENTRIES } from '../lib/paths.js';
import { loadLocalEnv } from './env.js';

loadLocalEnv();
process.env['DEV'] = '1';

const clear = () => process.stdout.write('\x1b[2J\x1b[H');
const COMPONENT_STYLES = join(SRC, 'styles', 'components.css');
const REBUILD_DEBOUNCE_MS = 75;
let currentBuild: ChildProcess | null = null;
let building = false;
let pendingRebuild: 'full' | 'client' | null = null;
let pendingFile: string | undefined;
let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
let shuttingDown = false;

const isFullBuildIgnored = (file: string): boolean => {
  const sourcePath = relative(SRC, file);
  return file === COMPONENT_STYLES || sourcePath === 'client' || sourcePath.startsWith('client/');
};

const stopCurrentBuild = () => {
  const pid = currentBuild?.pid;
  if (!pid) return;

  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    currentBuild?.kill('SIGTERM');
  }
};

const shutdown = async (exitCode: number) => {
  if (shuttingDown) {
    process.exit(exitCode);
  }
  shuttingDown = true;

  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
    rebuildTimer = null;
  }

  stopCurrentBuild();
  bs.exit();
  await ctx.dispose();
  process.exit(exitCode);
};

const buildHTML = async () => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('tsx', ['src/pipeline/build-html.ts'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, DEV: '1' },
      detached: true,
    });

    currentBuild = child;

    child.once('error', (err) => {
      if (currentBuild === child) currentBuild = null;
      reject(err);
    });

    child.once('exit', (code, signal) => {
      if (currentBuild === child) currentBuild = null;
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`HTML build exited with ${signal ?? `code ${code ?? 'unknown'}`}`));
    });
  });
};

await buildHTML();

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

process.once('SIGINT', () => {
  void shutdown(130);
});

process.once('SIGTERM', () => {
  void shutdown(143);
});

const runBuild = async (mode: 'full' | 'client', file?: string) => {
  const label = file ? basename(file) : mode;
  clear();
  console.log(`\x1b[2m${label} changed → rebuilding…\x1b[0m`);
  try {
    if (mode === 'full') {
      await buildHTML();
      await ctx.rebuild();
    } else {
      await ctx.rebuild();
    }
    bs.reload();
  } catch (err) {
    // buildHTML errors already print via stdio:'inherit' — only log esbuild ctx errors
    if (!(err instanceof Error && 'status' in err)) console.error(err);
    console.error('⚠ Build failed — waiting for next change…');
  }
};

const schedule = async (mode: 'full' | 'client', file?: string) => {
  if (shuttingDown) return;

  if (building) {
    pendingRebuild = pendingRebuild === 'full' ? 'full' : mode;
    pendingFile = file;
    return;
  }
  building = true;
  try {
    await runBuild(mode, file);
    while (pendingRebuild) {
      const next = pendingRebuild;
      const nextFile = pendingFile;
      pendingRebuild = null;
      pendingFile = undefined;
      await runBuild(next, nextFile);
    }
  } finally {
    building = false;
  }
};

const queueRebuild = (mode: 'full' | 'client', file?: string) => {
  if (rebuildTimer) clearTimeout(rebuildTimer);

  pendingRebuild = pendingRebuild === 'full' ? 'full' : mode;
  pendingFile = file;
  rebuildTimer = setTimeout(() => {
    const next = pendingRebuild;
    const nextFile = pendingFile;
    rebuildTimer = null;
    pendingRebuild = null;
    pendingFile = undefined;
    if (next) void schedule(next, nextFile);
  }, REBUILD_DEBOUNCE_MS);
};

bs.watch(`${SRC}/**/*.{ts,css}`, { ignoreInitial: true, ignored: isFullBuildIgnored })
  .on('change', (f: string) => queueRebuild('full', f));

bs.watch(`${SRC}/client/**/*.ts`, { ignoreInitial: true })
  .on('change', (f: string) => queueRebuild('client', f));

bs.watch(`${POSTS_DIR}/**/*.{md,ts}`, { ignoreInitial: true })
  .on('change', (f: string) => queueRebuild('full', f));

bs.watch(`${PROMPTS_DIR}/**/*.md`, { ignoreInitial: true })
  .on('change', (f: string) => queueRebuild('full', f));

bs.watch(`${PUBLIC_DIR}/**/*`, { ignoreInitial: true })
  .on('change', (f: string) => queueRebuild('full', f));

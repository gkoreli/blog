/**
 * paths.ts — Canonical path constants for the blog package.
 *
 * All paths are absolute and resolved from the package root (packages/blog/).
 * Import from here instead of computing paths with import.meta.dirname.
 */

import { resolve, join } from 'node:path';

/** packages/blog/ — the package root */
export const ROOT = resolve(import.meta.dirname, '..', '..');

/** repo root */
export const REPO_ROOT = resolve(ROOT, '..', '..');

/** packages/blog/src/ */
export const SRC = join(ROOT, 'src');

/** packages/blog/posts/ — markdown source files */
export const POSTS_DIR = join(ROOT, 'posts');

/** packages/blog/dist/ — build output */
export const DIST = join(ROOT, 'dist');

/** packages/blog/public/ — static assets copied as-is to dist */
export const PUBLIC_DIR = join(ROOT, 'public');

/** packages/blog/prompts/ — prompt source files */
export const PROMPTS_DIR = join(ROOT, 'prompts');
export const STYLES_SRC = join(SRC, 'styles', 'main.css');

/** packages/blog/src/client/main.ts — browser entry point */
export const CLIENT_ENTRY = join(SRC, 'client', 'main.ts');

/** packages/blog/src/client/stats.ts — stats page entry point (loads only on /stats) */
export const STATS_ENTRY = join(SRC, 'client', 'stats.ts');

/** packages/blog/src/client/immersive.ts — rich post components (loads only on immersive posts) */
export const IMMERSIVE_ENTRY = join(SRC, 'client', 'immersive.ts');

/** packages/blog/src/client/animations-lab.ts — Animations Lab entry point (loads only on /animations-lab) */
export const ANIMATIONS_LAB_ENTRY = join(SRC, 'client', 'animations-lab.ts');

/** packages/blog/src/client/canvas.ts — neural canvas (loads only on pages with a sec-canvas-banner) */
export const CANVAS_ENTRY = join(SRC, 'client', 'canvas.ts');

/** All esbuild entry points — single source of truth for dev and prod builds */
export const ESBUILD_ENTRIES = [CLIENT_ENTRY, STATS_ENTRY, IMMERSIVE_ENTRY, ANIMATIONS_LAB_ENTRY, CANVAS_ENTRY, STYLES_SRC];

/** Section archive route slugs */
export const ESSAYS_PAGE = 'essays';
export const ENGINEERING_PAGE = 'engineering';
export const OSS_RADAR_PAGE = 'oss-radar';

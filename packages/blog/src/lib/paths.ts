/**
 * paths.ts — Canonical path constants for the blog package.
 *
 * All paths are absolute and resolved from the package root (packages/blog/).
 * Import from here instead of computing paths with import.meta.dirname.
 */

import { resolve, join } from 'node:path';

/** packages/blog/ — the package root */
export const ROOT = resolve(import.meta.dirname, '..', '..');

/** packages/blog/src/ */
export const SRC = join(ROOT, 'src');

/** packages/blog/posts/ — markdown source files */
export const POSTS_DIR = join(ROOT, 'posts');

/** packages/blog/dist/ — build output */
export const DIST = join(ROOT, 'dist');

/** packages/blog/public/ — static assets copied as-is to dist */
export const PUBLIC_DIR = join(ROOT, 'public');

/** packages/blog/src/styles/main.css */
export const STYLES_SRC = join(SRC, 'styles', 'main.css');

/** packages/blog/src/client/main.ts — browser entry point */
export const CLIENT_ENTRY = join(SRC, 'client', 'main.ts');

import { readdirSync } from 'node:fs';
import { copyPublicAssets, writeRoot as writeStaticRoot } from '@nisli/ssg';
import { join } from 'node:path';
import { POSTS_DIR, DIST, PUBLIC_DIR } from './paths.js';

export function discoverPosts(): string[] {
  return readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.ts'))
    .sort()
    .map(f => join(POSTS_DIR, f));
}

export function writeRoot(filename: string, content: string): void {
  writeStaticRoot(DIST, filename, content);
}

export function copyAssets(): void {
  copyPublicAssets({ publicDir: PUBLIC_DIR, outDir: DIST });
}

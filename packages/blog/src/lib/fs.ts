import { readdirSync, mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { POSTS_DIR, DIST, PUBLIC_DIR } from './paths.js';

export function discoverPosts(): string[] {
  return readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => join(POSTS_DIR, f));
}

export function writeOutput(slug: string, html: string): void {
  const dir = join(DIST, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

export function writeRoot(filename: string, content: string): void {
  mkdirSync(DIST, { recursive: true });
  writeFileSync(join(DIST, filename), content, 'utf-8');
}

export function copyAssets(): void {
  mkdirSync(DIST, { recursive: true });
  if (existsSync(PUBLIC_DIR)) {
    cpSync(PUBLIC_DIR, DIST, { recursive: true });
  }
}

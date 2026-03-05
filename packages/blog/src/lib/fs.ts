import { readdirSync, mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');

export function discoverPosts(): string[] {
  const postsDir = join(ROOT, 'posts');
  return readdirSync(postsDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => join(postsDir, f));
}

export function writeOutput(slug: string, html: string): void {
  const dir = join(ROOT, 'dist', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

export function writeRoot(filename: string, content: string): void {
  const dir = join(ROOT, 'dist');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), content, 'utf-8');
}

export function copyAssets(): void {
  const dist = join(ROOT, 'dist');
  const publicDir = join(ROOT, 'public');
  mkdirSync(dist, { recursive: true });

  if (existsSync(publicDir)) {
    cpSync(publicDir, dist, { recursive: true });
  }
}

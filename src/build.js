// Minimal build script — placeholder until you wire up @nisli/core rendering
// For now: copies posts and public assets to dist/

import { readdir, readFile, writeFile, mkdir, cp } from 'fs/promises';
import { join } from 'path';

const POSTS_DIR = 'posts';
const PUBLIC_DIR = 'public';
const DIST_DIR = 'dist';

async function build() {
  await mkdir(DIST_DIR, { recursive: true });

  // Copy public assets
  try {
    await cp(PUBLIC_DIR, DIST_DIR, { recursive: true });
  } catch {}

  // Read and list posts
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} post(s)`);

  for (const file of files) {
    const content = await readFile(join(POSTS_DIR, file), 'utf-8');
    const title = content.match(/^#\s+(.+)$/m)?.[1] || file;
    console.log(`  → ${title}`);
  }

  // TODO: Parse markdown, render with @nisli/core components, output HTML
  console.log('\nBuild complete (scaffold only — wire up @nisli/core rendering next)');
}

build().catch(console.error);

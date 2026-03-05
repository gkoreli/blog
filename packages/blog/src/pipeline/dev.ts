import { watch } from 'node:fs';
import { execSync } from 'node:child_process';
import { context } from 'esbuild';
import { CLIENT_ENTRY, DIST, SRC, POSTS_DIR, STYLES_SRC, ROOT } from '../lib/paths.js';

const buildSite = () => {
  execSync('tsx src/pipeline/build-html.ts', { cwd: ROOT, stdio: 'inherit' });
};

// Initial HTML build
buildSite();

const ctx = await context({
  entryPoints: [CLIENT_ENTRY, STYLES_SRC],
  bundle: true,
  outdir: DIST,
  entryNames: '[name]',
  format: 'esm',
  target: 'es2024',
  banner: {
    js: `new EventSource('/esbuild').addEventListener('change', () => location.reload());`,
  },
});

await ctx.watch();
const { port } = await ctx.serve({ servedir: DIST, port: 3000 });
console.log(`Dev server at http://localhost:${port}`);

let debounce: ReturnType<typeof setTimeout>;
for (const dir of [SRC, POSTS_DIR]) {
  watch(dir, { recursive: true }, (_event, filename) => {
    if (filename?.endsWith('.ts') && filename.includes('client')) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      buildSite();
      ctx.rebuild().catch(() => {});
    }, 100);
  });
}

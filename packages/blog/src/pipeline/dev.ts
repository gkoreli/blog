import { watch } from 'node:fs';
import { context, type Plugin } from 'esbuild';
import { CLIENT_ENTRY, DIST, SRC, POSTS_DIR, STYLES_SRC } from '../lib/paths.js';
import { buildSite } from './build.js';

const sitePlugin: Plugin = {
  name: 'site-builder',
  setup(build) {
    build.onEnd(async () => {
      await buildSite(false);
    });
  },
};

const ctx = await context({
  entryPoints: [CLIENT_ENTRY, STYLES_SRC],
  bundle: true,
  outdir: DIST,
  entryNames: '[name]',
  format: 'esm',
  target: 'es2024',
  plugins: [sitePlugin],
  banner: {
    js: `new EventSource('/esbuild').addEventListener('change', () => location.reload());`,
  },
});

await ctx.watch();
const { port } = await ctx.serve({ servedir: DIST, port: 3000 });
console.log(`Dev server at http://localhost:${port}`);

// Templates and markdown aren't in esbuild's dependency graph.
// Touch a watched file to trigger esbuild's own rebuild cycle,
// which ensures the SSE change event fires properly.
let debounce: ReturnType<typeof setTimeout>;
for (const dir of [SRC, POSTS_DIR]) {
  watch(dir, { recursive: true }, (_event, filename) => {
    // Skip changes to files esbuild already watches (client JS/CSS)
    if (filename?.endsWith('.ts') && filename.includes('client')) return;
    if (filename?.endsWith('.css')) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => ctx.rebuild().catch(() => {}), 100);
  });
}

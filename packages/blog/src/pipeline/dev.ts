import { watch } from 'node:fs';
import { context, type Plugin } from 'esbuild';
import { CLIENT_ENTRY, DIST, SRC, POSTS_DIR, STYLES_SRC } from '../lib/paths.js';
import { buildSite } from './build.js';

const sitePlugin: Plugin = {
  name: 'site-builder',
  setup(build) {
    build.onStart(async () => {
      await buildSite(false);
    });
  },
};

const ctx = await context({
  entryPoints: [CLIENT_ENTRY, STYLES_SRC],
  bundle: true,
  outdir: DIST,
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
// Watch them and call rebuild() — the documented way to trigger
// esbuild's change event from external file changes.
let debounce: ReturnType<typeof setTimeout>;
for (const dir of [SRC, POSTS_DIR]) {
  watch(dir, { recursive: true }, () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => ctx.rebuild().catch(() => {}), 50);
  });
}

import { context, type Plugin } from 'esbuild';
import { CLIENT_ENTRY, DIST } from '../lib/paths.js';
import { buildSite } from './build.js';

const sitePlugin: Plugin = {
  name: 'site-builder',
  setup(build) {
    build.onStart(async () => {
      await buildSite();
    });
  },
};

const ctx = await context({
  entryPoints: [CLIENT_ENTRY],
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

import { aot } from 'elysia/plugin/aot/bun';
const [entry, app, output] = process.argv.slice(2);
const result = await Bun.build({ entrypoints: [entry], outdir: output, naming: 'index.js', target: 'bun', minify: false, plugins: [aot(app, { target: 'bun' })] });
if (!result.success) console.error(result.logs);
// Importing the API for the plugin opens its DB pool, as in upstream's build.
process.exit(result.success ? 0 : 1);

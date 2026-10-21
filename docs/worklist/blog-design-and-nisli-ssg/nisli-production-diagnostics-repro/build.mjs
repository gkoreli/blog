import { build, version as esbuildVersion } from 'esbuild';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const variants = [
  { name: 'old-core', version: '0.47.4', alias: { '@nisli/core': 'nisli-old' }, expectedN102: false },
  { name: 'default-minify', version: '0.56.0', expectedN102: true },
  { name: 'node-env-production', version: '0.56.0', define: { 'process.env.NODE_ENV': '"production"' }, expectedN102: true },
  { name: 'import-meta-production', version: '0.56.0', define: { 'import.meta.env': '{"DEV":false,"PROD":true}' }, expectedN102: false },
  { name: 'runtime-off', version: '0.56.0', entry: 'entry-off.js', expectedN102: false },
];

await rm('output', { recursive: true, force: true });
await mkdir('output');
const manifest = [];
for (const variant of variants) {
  const result = await build({
    entryPoints: [variant.entry ?? 'entry.js'],
    outfile: `output/${variant.name}.js`,
    platform: 'browser',
    format: 'esm',
    target: 'es2024',
    bundle: true,
    minify: true,
    treeShaking: true,
    write: false,
    metafile: true,
    ...(variant.alias ? { alias: variant.alias } : {}),
    ...(variant.define ? { define: variant.define } : {}),
  });
  const file = result.outputFiles[0];
  const inputs = Object.values(result.metafile.outputs)[0].inputs;
  const auditBytes = Object.entries(inputs)
    .filter(([name]) => name.endsWith('/template-audit.js'))
    .reduce((sum, [, data]) => sum + data.bytesInOutput, 0);
  const row = {
    name: variant.name,
    core: variant.version,
    esbuild: esbuildVersion,
    expectedN102: variant.expectedN102,
    bytes: file.contents.length,
    gzipLevel9Bytes: gzipSync(file.contents, { level: 9 }).length,
    templateAuditMinifiedBytes: auditBytes,
    containsN102: file.text.includes('N102'),
    sha256: createHash('sha256').update(file.contents).digest('hex'),
    warnings: result.warnings.map(warning => warning.text),
  };
  manifest.push(row);
  await writeFile(file.path, file.contents);
  await writeFile(`output/${variant.name}.meta.json`, JSON.stringify(result.metafile, null, 2));
  const harness = `const codes=[];const previous=console.error;console.error=(...args)=>{codes.push(...Array.from(String(args[0]).matchAll(/\\[nisli (N\\d+)\\]/g),match=>match[1]));previous(...args)};window.reproCodes=codes;`;
  await writeFile(`output/${variant.name}.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><title>${variant.name}</title><body><div id="app"></div><pre id="result">Loading</pre><script>${harness}</script><script type="module" src="./${variant.name}.js"></script><script>window.addEventListener('load',()=>{const button=document.querySelector('#counter');button?.click();queueMicrotask(()=>{const result={name:${JSON.stringify(variant.name)},codes:window.reproCodes,counter:button?.textContent,processType:typeof globalThis.process,userAgent:navigator.userAgent,passed:window.reproCodes.includes('N102')===${variant.expectedN102}&&button?.textContent==='Count: 1'};document.querySelector('#result').textContent=JSON.stringify(result,null,2);window.reproResult=result})})</script></body></html>`);
}
await writeFile('output/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
await writeFile('output/index.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Nisli production diagnostics reproduction</title><style>body{font:16px system-ui;max-width:1100px;margin:2rem auto;padding:1rem}iframe{width:100%;height:220px;border:1px solid #aaa}section{margin:1.5rem 0}code{font-size:14px}</style><h1>Nisli production diagnostics reproduction</h1><p>All bundles: browser ESM, minified, tree shaking enabled. The misspelled <code>@clik</code> is deliberate; the real <code>@click</code> must still update the counter. Each iframe has an independent runtime.</p>${manifest.map(row => `<section><h2>${row.name}</h2><p>${row.bytes} bytes; gzip ${row.gzipLevel9Bytes} bytes; audit module ${row.templateAuditMinifiedBytes} minified bytes.</p><iframe title="${row.name}" src="./${row.name}.html"></iframe></section>`).join('')}</html>`);
console.table(manifest.map(({ name, bytes, gzipLevel9Bytes, templateAuditMinifiedBytes }) => ({ name, bytes, gzipLevel9Bytes, templateAuditMinifiedBytes })));

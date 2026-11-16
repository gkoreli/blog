// Released high-level wrapper, native/WASM renderer injection and CommonJS export shape.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, fixture, output] = process.argv.slice(2).map(value => resolve(value));
await mkdir(fixture);
const from = file => import(pathToFileURL(join(runtime, 'node_modules/takumi-js/dist', file)));
const wrapper = await from('index.mjs');
const native = await from('node.mjs');
const wasm = await from('wasm.mjs');
const nativeRenderer = new native.Renderer();
const wasmRenderer = new wasm.Renderer();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const image = await nativeRenderer.render({ type: 'container', style: { width: 2, height: 2, backgroundColor: '#ef3340' } }, { width: 2, height: 2, format: 'png' });
const requests = [];
let phase = 'setup';
const server = createServer((request, response) => {
  requests.push({ phase, path: request.url });
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.end(image);
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert(address && typeof address === 'object');
const origin = `http://127.0.0.1:${address.port}`;
const html = `<style>.panel{width:64px;height:32px;background-color:#234b80;background-image:url('${origin}/drawn.png');background-size:100% 100%}.hidden{display:none}</style><div class="panel"><img class="hidden" src="${origin}/hidden.png"></div>`;
const options = { width: 64, height: 32, format: 'png' };
const localFetch = (url, options) => {
  assert.equal(new URL(url).origin, origin);
  return fetch(url, options);
};
try {
  phase = 'raw-native';
  const raw = Buffer.from(await nativeRenderer.render(html, options));
  assert.equal(requests.length, 0);
  const artifacts = [];
  for (const [name, renderer] of [['native', nativeRenderer], ['wasm', wasmRenderer]]) {
    phase = name;
    const bytes = Buffer.from(await wrapper.render(html, { ...options, renderer, images: { fetch: localFetch, allowUrl: url => new URL(url).origin === origin } }));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.notEqual(hash(bytes), hash(raw));
    await writeFile(join(fixture, `${name}.png`), bytes, { flag: 'wx' });
    artifacts.push({ backend: name, bytes: bytes.length, sha256: hash(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
  }
  assert.deepEqual(requests, [{ phase: 'native', path: '/drawn.png' }, { phase: 'wasm', path: '/drawn.png' }]);
  const requireRuntime = createRequire(join(runtime, 'package.json'));
  const commonjs = requireRuntime('takumi-js/wasm');
  let initError;
  try { await commonjs.init(); } catch (error) { initError = error instanceof Error ? `${error.name}: ${error.message}` : String(error); }
  const lock = JSON.parse(await readFile(join(runtime, 'package-lock.json'), 'utf8'));
  const packages = Object.fromEntries(['takumi-js','@takumi-rs/core','@takumi-rs/wasm','@takumi-rs/helpers'].map(name => {
    const p = lock.packages[`node_modules/${name}`];
    assert.equal(p.version, '2.20.0');
    return [name, { version: p.version, integrity: p.integrity }];
  }));
  const result = { source: 'ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d', node: process.version, packages, requests, artifacts,
    pngBytesEqualInThisCase: artifacts[0].sha256 === artifacts[1].sha256,
    commonjs: { initType: typeof commonjs.init, initError }, esm: { initType: typeof wasm.init },
    scope: 'One high-level HTML/CSS/image render through explicit native and WASM renderers in Node, plus the CommonJS init export. No full conformance, browser/bundler or Cloudflare deployment result.' };
  await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ requests, pngBytesEqualInThisCase: result.pngBytesEqualInThisCase, commonjs: result.commonjs, esm: result.esm }));
} finally {
  wasmRenderer[Symbol.dispose]?.();
  nativeRenderer[Symbol.dispose]?.();
  server.close(); server.closeAllConnections();
  await once(server, 'close');
}

// Actual published native preparation/render paths with owned HTTP resources and synthetic artwork.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, fixture, output] = process.argv.slice(2).map(value => resolve(value));
assert(runtime && fixture && output);
await mkdir(fixture);
const requireRuntime = createRequire(join(runtime, 'package.json'));
const { Renderer } = await import(pathToFileURL(requireRuntime.resolve('@takumi-rs/core')));
const lock = JSON.parse(await readFile(join(runtime, 'package-lock.json'), 'utf8'));
const pkg = lock.packages['node_modules/@takumi-rs/core'];
assert.equal(pkg.version, '2.20.0');
const renderer = new Renderer();
const sha = value => createHash('sha256').update(value).digest('hex');
const asset = await renderer.render({ type: 'container',
  style: { width: 2, height: 2, backgroundColor: '#ef3340' } }, { width: 2, height: 2, format: 'png' });
await writeFile(join(fixture, 'owned-red.png'), asset, { flag: 'wx' });
const requests = [];
const fetchCalls = [];
let phase = 'setup';
const server = createServer((request, response) => {
  requests.push({ phase, path: request.url });
  if (request.url === '/used.png' || request.url === '/hidden.png') {
    response.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': asset.length });
    response.end(asset);
  } else { response.writeHead(404); response.end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert(address && typeof address === 'object');
const origin = `http://127.0.0.1:${address.port}`;
const drawn = `${origin}/used.png`;
const hidden = `${origin}/hidden.png`;
const html = `<style>
.panel { width: 64px; height: 32px; background-color: #234b80;
  background-image: url('${drawn}'); background-size: 100% 100%; }
.hidden { display: none; }
</style><div class="panel"><img class="hidden" src="${hidden}" width="2" height="2"></div>`;
const dimensions = { width: 64, height: 32 };
const artifacts = [];
async function keep(name, bytes) {
  await writeFile(join(fixture, name), bytes, { flag: 'wx' });
  const result = { name, bytes: Buffer.byteLength(bytes), sha256: sha(bytes) };
  if (name.endsWith('.png')) {
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    result.width = bytes.readUInt32BE(16); result.height = bytes.readUInt32BE(20);
    assert.equal(result.width, 64); assert.equal(result.height, 32);
  }
  artifacts.push(result);
  return result;
}
const localFetch = async (url, options) => {
  assert.equal(new URL(url).origin, origin, 'Fixture refuses external transport');
  fetchCalls.push({ phase, path: new URL(url).pathname });
  return fetch(url, options);
};
const localOnly = url => new URL(url).origin === origin;
try {
  phase = 'raw-without-bytes';
  const raw = await renderer.render(html, { ...dimensions, format: 'png' });
  await keep('raw-without-bytes.png', raw);
  assert.equal(requests.length, 0);

  phase = 'prepare-fetch';
  const prepared = await renderer.prepare(html, { ...dimensions,
    images: { fetch: localFetch, allowUrl: localOnly } });
  const afterPrepare = requests.map(value => ({ ...value }));
  assert.deepEqual(afterPrepare.map(value => value.path), ['/used.png']);
  assert.deepEqual(fetchCalls.map(value => value.path), ['/used.png']);

  phase = 'prepared-outputs';
  const png = await renderer.render(prepared, { format: 'png' });
  await keep('prepared.png', png);
  const svg = await renderer.renderSvg(prepared);
  await keep('prepared.svg', svg);
  const measure = await renderer.measure(prepared);
  await writeFile(join(fixture, 'measure.json'), JSON.stringify(measure, null, 2) + '\n', { flag: 'wx' });
  assert(svg.startsWith('<svg'));
  assert(svg.includes('data:image'), 'Prepared SVG embeds its image');
  assert(!svg.includes(origin));
  assert.notEqual(sha(raw), sha(png), 'Loaded image must affect the output');
  assert.deepEqual(requests, afterPrepare);

  phase = 'direct-supplied';
  const direct = await renderer.render(html, { ...dimensions, format: 'png', images: [{ src: drawn, data: asset }] });
  await keep('direct-supplied.png', direct);
  assert.equal(sha(direct), sha(png));

  phase = 'prepare-supplied';
  const supplied = await renderer.prepare(html, { ...dimensions,
    images: { sources: [{ src: drawn, data: asset }], fetch: localFetch, allowUrl: localOnly } });
  const suppliedPng = await renderer.render(supplied, { format: 'png' });
  await keep('prepared-supplied.png', suppliedPng);
  assert.equal(sha(suppliedPng), sha(png));
  assert.equal(fetchCalls.length, 1);
  assert.deepEqual(requests, afterPrepare);

  phase = 'denied-url';
  let denied;
  try {
    await renderer.prepare(html, { ...dimensions, images: { fetch: localFetch, allowUrl: () => false } });
  } catch (error) { denied = error instanceof Error ? error.message.replaceAll(origin, '<origin>') : String(error); }
  assert(denied, 'Denied preparation must reject');
  assert.equal(fetchCalls.length, 1);
  assert.deepEqual(requests, afterPrepare);

  const receipt = { sourceCommit: 'ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d',
    packageVersion: pkg.version, packageIntegrity: pkg.integrity,
    node: process.version, platform: process.platform, architecture: process.arch,
    fixture: { source: 'authored HTML/CSS, red PNG and CSS-hidden image', ...dimensions, assetSha256: sha(asset) },
    serverRequests: requests, fetchHookCalls: fetchCalls,
    conditions: { rawMissingBytesFetched: false, hiddenImageFetched: false,
      preparedOutputsFetchedAgain: false, suppliedBytesFetched: false,
      preparedEqualsDirectSupplied: true, loadedImageChangesPng: true,
      svgEmbedsImage: true, svgContainsFixtureOrigin: false,
      deniedUrlRejectedBeforeTransport: true, denial: denied },
    artifacts, scope: 'One authored native HTML/CSS preparation case and controls; resource selection/reuse across PNG, SVG and measure, not layout-cache, PDF/WASM, conformance, security or performance acceptance.',
    publicWebsiteUsed: false, realUserDataUsed: false, modelServiceCalls: 0 };
  await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ transportRequests: requests.length, hiddenImageFetched: false,
    preparedEqualsDirectSupplied: true, repeatedOutputsRefetched: false, deniedBeforeTransport: true }));
} finally {
  server.close();
  server.closeAllConnections();
  await once(server, 'close');
}

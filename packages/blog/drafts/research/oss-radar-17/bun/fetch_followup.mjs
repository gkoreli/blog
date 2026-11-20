// Run with Node 24: node fetch_followup.mjs STABLE_BUN TESTED_CANARY NEWER_CANARY FRESH_OUTPUT
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { brotliCompressSync, gzipSync, zstdCompressSync } from 'node:zlib';

const exec = promisify(execFile);
const encodings = ['identity', 'gzip', 'br', 'zstd'];
const modes = ['buffered-origin', 'chunked-origin'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function consume(origin) {
  const cases = [];
  for (const mode of modes) {
    for (const encoding of encodings) {
      const response = await fetch(`${origin}/${mode}/${encoding}`, { signal: AbortSignal.timeout(10000) });
      const reader = response.body.getReader();
      const hash = createHash('sha256');
      const chunkLengths = [];
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          hash.update(value);
          chunkLengths.push(value.length);
          if (mode === 'chunked-origin') await delay(2);
        }
      } finally {
        reader.releaseLock();
      }
      cases.push({ mode, encoding, status: response.status,
        content_encoding: response.headers.get('content-encoding'), sha256: hash.digest('hex'),
        bytes: chunkLengths.reduce((sum, length) => sum + length, 0), chunk_lengths: chunkLengths });
    }
  }
  return { version: Bun.version, revision: Bun.revision, cases };
}

async function run(stable, tested, newer, output) {
  await mkdir(output, { mode: 0o700 });
  const rows = ['orders', 'products', 'inventory', 'receipts'];
  const data = Buffer.from(Array.from({ length: 4000 }, (_, id) => JSON.stringify({
    id, route: rows[id % rows.length], time_ms: (id * 109 + 71) % 414,
    request_id: digest(`followup-${id}`).slice(0, 24), cached: id % 5 !== 0,
  })).join('\n') + '\n');
  const bodies = { identity: data, gzip: gzipSync(data), br: brotliCompressSync(data), zstd: zstdCompressSync(data) };
  const allowed = new Set(modes.flatMap(mode => encodings.map(encoding => `/${mode}/${encoding}`)));
  const server = createServer(async (request, response) => {
    if (!allowed.has(request.url)) { response.writeHead(404).end(); return; }
    const [, mode, encoding] = request.url.split('/');
    const body = bodies[encoding];
    const headers = { 'Content-Encoding': encoding, 'Content-Type': 'application/x-ndjson' };
    if (mode === 'buffered-origin') {
      response.writeHead(200, { ...headers, 'Content-Length': body.length }).end(body);
      return;
    }
    response.writeHead(200, headers);
    for (let offset = 0; offset < body.length; offset += 4093) {
      if (response.destroyed) return;
      response.write(body.subarray(offset, offset + 4093));
      await delay(1);
    }
    response.end();
  });
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  const dataHash = digest(data);
  const result = { node: process.version, platform: process.platform, arch: process.arch,
    input_bytes: data.length, input_sha256: dataHash,
    encoded_sizes: Object.fromEntries(encodings.map(encoding => [encoding, bodies[encoding].length])),
    consumer_pause_ms: 2, origin_slice_bytes: 4093, builds: {} };
  try {
    for (const [label, binary] of Object.entries({ stable, tested, newer })) {
      const { stdout } = await exec(resolve(binary), [fileURLToPath(import.meta.url), '--consume',
        `http://127.0.0.1:${server.address().port}`], { cwd: output, timeout: 45000,
        env: { HOME: process.env.HOME, PATH: process.env.PATH, BUN_ENABLE_CRASH_REPORTING: '0',
          NO_PROXY: '127.0.0.1,localhost' } });
      result.builds[label] = JSON.parse(stdout);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(done => server.close(done));
  }
  await writeFile(join(output, 'results.json'), `${JSON.stringify(result, null, 2)}\n`);
  for (const { cases } of Object.values(result.builds)) {
    assert.equal(cases.length, 8);
    for (const entry of cases) {
      assert.equal(entry.status, 200);
      assert.equal(entry.content_encoding, entry.encoding);
      assert.equal(entry.bytes, data.length);
      assert.equal(entry.sha256, dataHash);
    }
  }
}

if (process.argv[2] === '--consume') console.log(JSON.stringify(await consume(process.argv[3])));
else await run(...process.argv.slice(2));

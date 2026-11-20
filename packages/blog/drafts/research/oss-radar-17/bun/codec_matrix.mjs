// Run with Node 24: node codec_matrix.mjs STABLE_BUN CANARY_BUN FRESH_OUTPUT BLOG_MARKDOWN
// Node acts as a third encoder/decoder and serves ordinary compressed bodies on loopback.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { availableParallelism, release, type } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import * as zlib from 'node:zlib';

const run = promisify(execFile);
const filename = fileURLToPath(import.meta.url);
const corpora = ['api-log', 'blog-markdown', 'seeded-binary'];
const formats = ['gzip', 'br', 'zstd'];
const builds = ['stable', 'canary', 'node'];
const modes = ['buffer', 'stream'];

const codecs = {
  gzip: {
    encode: zlib.gzipSync, decode: zlib.gunzipSync,
    encodeStream: zlib.createGzip, decodeStream: zlib.createGunzip,
    options: { level: 6 },
  },
  br: {
    encode: zlib.brotliCompressSync, decode: zlib.brotliDecompressSync,
    encodeStream: zlib.createBrotliCompress, decodeStream: zlib.createBrotliDecompress,
    options: { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } },
  },
  zstd: {
    encode: zlib.zstdCompressSync, decode: zlib.zstdDecompressSync,
    encodeStream: zlib.createZstdCompress, decodeStream: zlib.createZstdDecompress,
    options: { params: { [zlib.constants.ZSTD_c_compressionLevel]: 3 } },
  },
};

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function artifactName(corpus, format, build, mode) {
  return `${corpus}.${format}.${build}.${mode}`;
}

function identity() {
  return {
    version: globalThis.Bun?.version ?? process.version,
    revision: globalThis.Bun?.revision ?? null,
    platform: process.platform,
    arch: process.arch,
    libraries: {
      zlib: process.versions.zlib ?? null,
      brotli: process.versions.brotli ?? null,
      zstd: process.versions.zstd ?? null,
    },
  };
}

async function inputs(directory, articlePath) {
  const log = [];
  const routes = ['/orders', '/inventory', '/users', '/invoices', '/health'];
  for (let index = 0; index < 4000; index++) {
    log.push(JSON.stringify({
      request: digest(`radar-17-log-${index}`).slice(0, 16), route: routes[index % routes.length],
      customer: `cust-${index % 753}`, status: index % 49 === 0 ? 503 : 200,
      latency_ms: 3 + (index * 47 % 274), cache: index % 3 === 0 ? 'miss' : 'hit',
      message: index % 49 === 0 ? 'request returned a temporary error' : 'request completed',
    }));
  }
  const binary = Buffer.alloc(128 * 1024);
  for (let offset = 0; offset < binary.length; offset += 32) {
    createHash('sha256').update(`radar-17-binary-${offset}`).digest().copy(binary, offset);
  }
  const buffers = {
    'api-log': Buffer.from(`${log.join('\n')}\n`),
    'blog-markdown': await readFile(articlePath),
    'seeded-binary': binary,
  };
  await Promise.all(corpora.map(name => writeFile(join(directory, name), buffers[name])));
  return Object.fromEntries(corpora.map(name => [name, { bytes: buffers[name].length, sha256: digest(buffers[name]) }]));
}

async function throughStream(input, transform) {
  function* chunks() {
    for (let offset = 0; offset < input.length; offset += 4093) {
      yield input.subarray(offset, offset + 4093);
    }
  }
  const pieces = [];
  for await (const piece of Readable.from(chunks()).pipe(transform)) pieces.push(piece);
  return Buffer.concat(pieces);
}

async function encode(directory, build) {
  const observations = [];
  for (const corpus of corpora) {
    const input = await readFile(join(directory, corpus));
    for (const format of formats) {
      const codec = codecs[format];
      const outputs = {
        buffer: codec.encode(input, codec.options),
        stream: await throughStream(input, codec.encodeStream(codec.options)),
      };
      for (const mode of modes) {
        const bytes = outputs[mode];
        await writeFile(join(directory, artifactName(corpus, format, build, mode)), bytes);
        observations.push({ corpus, format, mode, bytes: bytes.length, sha256: digest(bytes) });
      }
    }
  }
  return { identity: identity(), observations };
}

async function decode(directory) {
  const runs = [];
  for (const corpus of corpora) {
    const expected = await readFile(join(directory, corpus));
    for (const format of formats) {
      const codec = codecs[format];
      for (const producer of builds) for (const mode of modes) {
        const compressed = await readFile(join(directory, artifactName(corpus, format, producer, mode)));
        try {
          const buffer = codec.decode(compressed).equals(expected);
          const stream = (await throughStream(compressed, codec.decodeStream())).equals(expected);
          runs.push({ corpus, format, producer, mode, buffer, stream });
        } catch (error) {
          runs.push({ corpus, format, producer, mode, error: String(error) });
        }
      }
    }
  }
  return runs;
}

async function timeBuffers(directory) {
  const samples = [];
  for (const corpus of corpora) {
    const input = await readFile(join(directory, corpus));
    for (const format of formats) {
      const codec = codecs[format];
      const reference = await readFile(join(directory, artifactName(corpus, format, 'node', 'buffer')));
      const iterations = Math.max(5, Math.min(160, Math.ceil(7 * 1024 ** 2 / input.length)));
      for (let warm = 0; warm < 3; warm++) {
        if (!codec.decode(reference).equals(input)) throw new Error(`${corpus}/${format} malformed fixture result`);
        codec.encode(input, codec.options);
      }
      const startEncode = performance.now();
      for (let trial = 0; trial < iterations; trial++) codec.encode(input, codec.options);
      const encodeMs = performance.now() - startEncode;
      const startDecode = performance.now();
      for (let trial = 0; trial < iterations; trial++) codec.decode(reference);
      const decodeMs = performance.now() - startDecode;
      samples.push({ corpus, format, iterations, input_bytes: input.length, encode_ms: encodeMs, decode_ms: decodeMs });
    }
  }
  return samples;
}

async function fetchBodies(directory, port) {
  const expected = await readFile(join(directory, 'api-log'));
  const runs = [];
  for (const producer of builds) for (const format of formats) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/${producer}/${format}`, {
        signal: AbortSignal.timeout(5000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      runs.push({ producer, format, status: response.status, encoding: response.headers.get('content-encoding'),
        decoded_bytes: bytes.length, match: bytes.equals(expected) });
    } catch (error) {
      runs.push({ producer, format, error: String(error) });
    }
  }
  return runs;
}

async function compressedOrigin(directory) {
  const allowed = new Map();
  for (const producer of builds) for (const format of formats) {
    allowed.set(`/${producer}/${format}`, {
      format, bytes: await readFile(join(directory, artifactName('api-log', format, producer, 'buffer'))),
    });
  }
  const server = createServer((request, response) => {
    const entity = allowed.get(request.url);
    if (!entity) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Encoding': entity.format, 'Content-Length': entity.bytes.length,
      'Content-Type': 'application/x-ndjson' }).end(entity.bytes);
  });
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  return server;
}

async function matrix(stable, canary, output, articlePath) {
  const bins = { stable: resolve(stable), canary: resolve(canary), node: process.execPath };
  const directory = resolve(output);
  await mkdir(directory, { mode: 0o700 });
  const env = { HOME: process.env.HOME, PATH: process.env.PATH, CI: '1',
    NO_PROXY: '127.0.0.1,localhost', BUN_ENABLE_CRASH_REPORTING: '0' };
  async function worker(build, mode, ...args) {
    const result = await run(bins[build], [filename, '--worker', mode, directory, ...args], {
      cwd: directory, env, timeout: 60_000, maxBuffer: 2 * 1024 ** 2,
    });
    if (result.stderr) await writeFile(join(directory, `${build}-${mode}.stderr`), result.stderr);
    return JSON.parse(result.stdout);
  }
  const report = {
    machine: { os: type(), kernel: release(), assigned_vcpus: availableParallelism() },
    input: await inputs(directory, articlePath), encodings: {}, decodings: {}, http: {}, timing: [],
  };
  for (const build of builds) report.encodings[build] = await worker(build, 'encode', build);
  for (const build of builds) report.decodings[build] = await worker(build, 'decode');
  const server = await compressedOrigin(directory);
  try {
    const address = server.address();
    for (const build of ['stable', 'canary']) report.http[build] = await worker(build, 'fetch', String(address.port));
  } finally {
    await new Promise(done => server.close(done));
  }
  for (let trial = 0; trial < 5; trial++) {
    const order = trial % 2 === 0 ? ['stable', 'canary'] : ['canary', 'stable'];
    for (const build of order) report.timing.push({ trial: trial + 1, build, samples: await worker(build, 'time') });
  }
  await writeFile(join(directory, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[2] === '--worker') {
  const [, , , mode, directory, argument] = process.argv;
  const execute = { encode, decode, fetch: fetchBodies, time: timeBuffers }[mode];
  console.log(JSON.stringify(await execute(directory, argument)));
} else {
  await matrix(...process.argv.slice(2));
}

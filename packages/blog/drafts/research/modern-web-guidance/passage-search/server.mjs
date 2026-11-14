import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { loadEncoder, modelConfig } from './model.mjs';
import { createSearcher, readVectors } from './retrieval.mjs';

if (process.argv.length !== 7) throw new Error('Usage: node server.mjs /passages /vectors /runtime /model /new-receipt');
const [passageFile, vectorFile, runtime, model, receipt] = process.argv.slice(2).map(value => resolve(value));
const root = dirname(fileURLToPath(import.meta.url));
const passages = JSON.parse(readFileSync(passageFile, 'utf8'));
const questions = JSON.parse(readFileSync(join(root, 'queries.json'), 'utf8')).queries;
const encoder = await loadEncoder(runtime, model);
const searcher = createSearcher(passages.passages, readVectors(readFileSync(vectorFile)));
const assets = new Map([['/', ['interface.html', 'text/html']], ['/interface.css', ['interface.css', 'text/css']], ['/interface.mjs', ['interface.mjs', 'text/javascript']]]);
const samples = ['Q04', 'Q14', 'Q18', 'Q22', 'Q28', 'Q32'].map(id => questions.find(row => row.id === id).query);
let queue = Promise.resolve();
let queued = 0;
let address;
const server = createServer(async (request, response) => {
  const send = (status, type, body) => { response.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(body); };
  const json = (status, value) => send(status, 'application/json', JSON.stringify(value));
  try {
    if (!['127.0.0.1:' + address.port, 'localhost:' + address.port].includes(request.headers.host)) return json(403, { error: 'Local host required' });
    if (request.headers.origin && !['http://127.0.0.1:' + address.port, 'http://localhost:' + address.port].includes(request.headers.origin)) return json(403, { error: 'Same-origin request required' });
    if (request.method === 'GET' && assets.has(request.url)) {
      const [file, type] = assets.get(request.url); return send(200, type, readFileSync(join(root, file)));
    }
    if (request.method === 'GET' && request.url === '/catalog') return json(200, { articles: new Set(passages.passages.map(row => row.article)).size, passages: passages.passages.length, model: modelConfig.id, samples });
    if (request.method !== 'POST' || request.url !== '/search') return json(404, { error: 'Not found' });
    if (queued >= 8) return json(429, { error: 'Search is busy. Try again shortly.' });
    let body = ''; for await (const chunk of request) { body += chunk; if (Buffer.byteLength(body) > 8192) return json(413, { error: 'Query is too long' }); }
    const parsed = JSON.parse(body);
    if (typeof parsed.query !== 'string') return json(400, { error: 'Enter a search query' });
    const query = parsed.query.trim();
    if (!query || query.length > 4096) return json(400, { error: 'Enter a query between 1 and 4096 characters' });
    if (encoder.countTokens(modelConfig.queryPrefix + query) > modelConfig.maximumTokens) return json(400, { error: 'Query exceeds 480 model tokens. Shorten it and try again.' });
    queued++;
    const operation = queue.then(async () => {
      const start = performance.now();
      const [vector] = await encoder.embed([modelConfig.queryPrefix + query]);
      const queryEncodingMs = performance.now() - start;
      const ranked = searcher.rankings(query, vector);
      return { query, timing: { queryEncodingMs, ...ranked.timing }, methods: Object.fromEntries(Object.entries(ranked.lists).map(([name, rows]) => [name, { count: rows.length, results: searcher.describe(rows, 10, true) }])) };
    });
    queue = operation.then(() => {}, () => {});
    try { json(200, await operation); } finally { queued--; }
  } catch (error) { json(400, { error: error instanceof SyntaxError ? 'Invalid request' : 'Search could not complete. Try a shorter query.' }); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
address = server.address();
const url = 'http://127.0.0.1:' + address.port + '/';
writeFileSync(receipt, JSON.stringify({ url, pid: process.pid, startedAt: new Date().toISOString(), model: modelConfig, passages: passages.passages.length, queriesLogged: false }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ url, pid: process.pid, ready: true }));

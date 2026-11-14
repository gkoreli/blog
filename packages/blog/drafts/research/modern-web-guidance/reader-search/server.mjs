import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadEncoder, modelConfig } from '../passage-search/model.mjs';
import { tokenizeBm25 } from '../passage-search/vendor/bm25.ts';
import { loadData } from './load-data.mjs';
import { rankHierarchy } from './hierarchy.mjs';
import { focusQuery } from './query-v2.mjs';
import { paragraphLink } from './navigation.mjs';
import { renderPage } from './page.mjs';
import { sourceContexts } from './context.mjs';

if (![4, 5].includes(process.argv.length)) throw new Error('Usage: node server.mjs /local-runtime-config.json /new-server-receipt.json [loopback-port]');
const port = process.argv[4] === undefined ? 0 : Number(process.argv[4]);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid loopback port');
const data = loadData(resolve(process.argv[2])); const encoder = await loadEncoder(data.config.runtime, data.config.model);
let queue = Promise.resolve(); let queued = 0; let address;
const server = createServer(async (request, response) => {
  const send = (status, type, body) => { response.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(body); };
  const json = (status, value) => send(status, 'application/json', JSON.stringify(value));
  let query = ''; let method = 'hybrid'; let focus = 'literal';
  try {
    if (!['127.0.0.1:' + address.port, 'localhost:' + address.port].includes(request.headers.host)) return json(403, { error: 'Local host required' });
    if (request.headers.origin && !['http://127.0.0.1:' + address.port, 'http://localhost:' + address.port].includes(request.headers.origin)) return json(403, { error: 'Same-origin request required' });
    if (request.method !== 'GET') return json(405, { error: 'GET required' });
    const url = new URL(request.url, 'http://127.0.0.1:' + address.port);
    if (url.pathname === '/style.css') return send(200, 'text/css', readFileSync(new URL('./style.css', import.meta.url)));
    if (url.pathname === '/catalog') return json(200, data.catalog);
    if (!['/', '/api/search'].includes(url.pathname)) return json(404, { error: 'Not found' });
    query = (url.searchParams.get('q') ?? '').trim(); method = url.searchParams.get('method') ?? 'hybrid'; focus = url.searchParams.get('focus') ?? 'literal';
    if (!['hybrid', 'keyword', 'semantic'].includes(method) || !['topic', 'literal'].includes(focus)) throw new Error('Unknown search option');
    if (!query) return send(200, 'text/html', renderPage({ catalog: data.catalog, method, focus }));
    if (query.length > 4096) throw new Error('Shorten the query to at most 4096 characters.');
    const focused = focusQuery(query); const searchText = focus === 'topic' ? focused.focused : focused.original;
    if (encoder.countTokens(modelConfig.queryPrefix + searchText) > modelConfig.maximumTokens) throw new Error('Shorten the query to at most 480 model tokens.');
    if (queued >= 8) throw new Error('Search is busy. Try again shortly.');
    queued++;
    const operation = queue.then(async () => {
      const start = performance.now(); const [vector] = await encoder.embed([modelConfig.queryPrefix + searchText]);
      const ranked = rankHierarchy(data.indexes.passage, data.indexes.block, searchText, vector, method);
      const contexts = sourceContexts(data.indexes.passage, searchText, vector, method, data.live);
      const articles = ranked.articles.map(article => ({ ...article, matches: article.matches.map(unit => {
        const navigation = paragraphLink(unit, data.live.get(unit.article), searchText);
        if (navigation.verifiedText && unit.kind !== 'p') navigation.label = 'Open matching text';
        return { ...unit, navigation };
      }), contexts: contexts.get(article.article) ?? [] }));
      const terms = [...new Set(tokenizeBm25(searchText))];
      return { query, searchText, method, focus, changed: searchText !== focused.original, focusAvailable: focused.changed, articles, missingLiteralTerms: ranked.missingLiteralTerms, allLiteralTermsMissing: terms.length > 0 && terms.every(term => ranked.missingLiteralTerms.includes(term)), elapsedMs: performance.now() - start };
    });
    queue = operation.then(() => {}, () => {});
    try {
      const result = await operation;
      if (url.pathname === '/api/search') return json(200, result);
      send(200, 'text/html', renderPage({ catalog: data.catalog, query, method, focus, result }));
    } finally { queued--; }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search could not complete.';
    if (request.url?.startsWith('/api/')) return json(400, { error: message });
    send(400, 'text/html', renderPage({ catalog: data.catalog, query, method: ['hybrid', 'keyword', 'semantic'].includes(method) ? method : 'hybrid', focus: focus === 'topic' ? focus : 'literal', error: message }));
  }
});
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
} catch (error) { await encoder.dispose(); throw error; }
address = server.address(); const url = 'http://127.0.0.1:' + address.port + '/';
writeFileSync(resolve(process.argv[3]), JSON.stringify({ startedAt: new Date().toISOString(), url, pid: process.pid, catalog: data.catalog, inputHashes: data.inputHashes, queriesLogged: false, defaultFocus: 'literal', queryNormalizer: 'v2 retains project qualifiers; optional focus only', architecture: 'Passage article candidates; source-block paragraph ranking within each article; optional original passage context; verified live-text fragments' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ready: true, url, pid: process.pid }));

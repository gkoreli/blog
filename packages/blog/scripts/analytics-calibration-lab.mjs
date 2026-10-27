/** Local-only collection-stage lab. Compile analytics with its test command first. */
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { observePageResponse } from '../../analytics/.test-dist/index.js';
import { extractRequestEvidence } from '../../analytics/.test-dist/request-evidence.js';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const output = resolve(process.argv[2] ?? '/tmp/gk-analytics-stage-lab');
const baseline = process.argv[3] ? await import(pathToFileURL(resolve(process.argv[3]))) : null;
mkdirSync(output, { recursive: true, mode: 0o700 });
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'stage-lab' } });
const db = await mf.getD1Database('DB');
const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
const trials = new Map();
for (const mode of ['normal', 'block-beacon', 'block-script', 'fail-write', 'http-client', 'narrow-viewport', 'fixture-unlisted-network', 'fixture-hosting-network']) {
  for (let repeat = 1; repeat <= 3; repeat++) {
    const id = randomUUID();
    trials.set(id, { id, mode, repeat, operator: mode === 'http-client' ? 'curl-controlled' : 'agent-operated-browser', received: 0, observationAcknowledged: 0, observationFailed: 0, scriptReports: 0, beaconAttemptReports: 0, queueResults: [], beaconReceipts: 0, softwareClaims: null, baselinePrediction: null, storedKind: null, storedRows: 0, formEvidence: null, networkInput: mode === 'fixture-unlisted-network' ? 'injected-unlisted-asn' : mode === 'fixture-hosting-network' ? 'injected-hosting-asn' : 'absent-in-local-server' });
  }
}
let origin;
function snapshot() {
  const report = { checkedAt: new Date().toISOString(), origin, productionCalls: 0, environment: 'Node HTTP server, actual analytics collector, native local D1', collectionVersion: COLLECTION_VERSION, classifierVersion: CLASSIFIER_VERSION, baselineCommit: baseline?.baselineCommit ?? null,
    limits: ['Agent-operated browser and controlled curl; no human label inferred.', 'CSP script blocking is not a browser JavaScript-off setting.', 'A narrow viewport is not a real mobile device.', 'Local first-party beacon; not Cloudflare ingestion or a historical error-rate estimate.', 'Network fixtures inject an ASN for a rule comparison; they do not measure the browser actual network.', 'No human-operated negative controls or physical mobile/tablet observations.'], trials: [...trials.values()] };
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  return report;
}
const client = `
(async()=>{
 const id=location.pathname.split('/').pop();const status=document.querySelector('#state');
 const stage=async(event,value)=>{const r=await fetch('/stage/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,value})});if(!r.ok)throw new Error('Stage report rejected');};
 status.textContent='Script executed';await stage('script');
 await stage('attempt');let result;
 try{result=navigator.sendBeacon('/beacon/'+id,new Blob([JSON.stringify({trial:id,event:'load'})],{type:'application/json'}))?'queued':'not-queued';}catch{result='threw';}
 document.querySelector('#queue').textContent=result;await stage('queue',result);
 const update=async()=>{const r=await fetch('/receipt/'+id);const data=await r.json();document.querySelector('#receipt').textContent=String(data.beaconReceipts);document.querySelector('#stored').textContent=data.observationAcknowledged?'acknowledged':data.observationFailed?'failed':'pending';status.textContent='Script and attempt reported';};
 await update();document.querySelector('#refresh').addEventListener('click',update);
})();`;
async function bodyJson(request) {
  let text = '';
  for await (const chunk of request) { text += chunk; if (Buffer.byteLength(text) > 2048) throw new Error('Body too large'); }
  return JSON.parse(text);
}
function page(trial) {
 return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Analytics stage lab</title><style>body{font:17px system-ui;max-width:760px;margin:40px auto;padding:20px}dt{font-weight:bold}dd{margin-bottom:14px}</style><h1>Analytics stage lab</h1><p>Controlled ${trial.operator}; ${trial.mode}, repetition ${trial.repeat}. Local fixture only.</p><dl><dt>Script</dt><dd id="state">Not observed</dd><dt>Beacon queue result</dt><dd id="queue">Not attempted</dd><dt>Server beacon receipts</dt><dd id="receipt">Not checked</dd><dt>Observation write</dt><dd id="stored">Not checked</dd></dl><noscript>Browser JavaScript is disabled.</noscript><button id="refresh">Refresh receipt</button><p><a href="/">All trials</a></p><script src="/client.js" defer></script></html>`;
}
const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url ?? '/', origin);
    outgoing.setHeader('Cache-Control', 'no-store'); outgoing.setHeader('X-Content-Type-Options', 'nosniff');
    if (url.pathname === '/') {
      outgoing.setHeader('Content-Type', 'text/html; charset=utf-8');
      outgoing.end('<!doctype html><html lang="en"><title>Analytics stage lab</title><h1>Analytics stage lab</h1><p>Every browser visit is agent-operated; these trials never enter production totals.</p><ul>' + [...trials.values()].map(t => `<li>${t.mode === 'http-client' ? `<span>${t.mode} ${t.repeat}: ${origin}/trial/${t.id}</span>` : `<a href="/trial/${t.id}">${t.mode} ${t.repeat}</a>`}</li>`).join('') + '</ul></html>'); return;
    }
    if (url.pathname === '/client.js') { outgoing.setHeader('Content-Type', 'text/javascript'); outgoing.end(client); return; }
    const match = /^\/(trial|stage|beacon|receipt)\/([0-9a-f-]{36})$/.exec(url.pathname);
    const trial = match ? trials.get(match[2]) : undefined;
    if (!match || !trial) { outgoing.writeHead(404); outgoing.end(); return; }
    if (match[1] === 'trial' && incoming.method === 'GET') {
      trial.received++;
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) if (typeof value === 'string') headers.set(key, value);
      const request = new Request(url, { headers });
      if (trial.mode === 'fixture-unlisted-network' || trial.mode === 'fixture-hosting-network') Object.defineProperty(request, 'cf', { value: { asn: trial.mode === 'fixture-hosting-network' ? 16509 : 12345 } });
      const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src ${trial.mode === 'block-script' ? "'none'" : "'self'"}; connect-src ${trial.mode === 'block-beacon' ? origin + '/stage/ ' + origin + '/receipt/' : "'self'"}; base-uri 'none'; frame-ancestors 'none'`;
      const response = new Response(page(trial), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': csp } });
      trial.softwareClaims = extractRequestEvidence(request, response);
      trial.baselinePrediction = baseline?.baselinePrediction(request) ?? null;
      const targetDb = trial.mode === 'fail-write' ? { prepare(sql) { if (sql.startsWith('INSERT INTO page_observations')) throw new Error('Injected local write failure'); return db.prepare(sql); } } : db;
      const work = [];
      observePageResponse(request, response, 'html', { DB: targetDb, ANALYTICS_HASH_KEY: 'local-fixture-only' }, { waitUntil(promise) { work.push(promise); } });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(await response.text());
      try { await Promise.all(work); trial.observationAcknowledged++; }
      catch { trial.observationFailed++; }
      const row = await db.prepare('SELECT reader_kind,client_form_evidence FROM page_observations WHERE path=? ORDER BY id DESC LIMIT 1').bind(url.pathname).first();
      trial.storedKind = row?.reader_kind ?? null;
      trial.formEvidence = row?.client_form_evidence ? JSON.parse(row.client_form_evidence) : null;
      trial.storedRows = (await db.prepare('SELECT COUNT(*) AS n FROM page_observations WHERE path=?').bind(url.pathname).first()).n; snapshot(); return;
    }
    if (match[1] === 'receipt' && incoming.method === 'GET') {
      outgoing.setHeader('Content-Type','application/json'); outgoing.end(JSON.stringify({ observationAcknowledged: trial.observationAcknowledged, observationFailed: trial.observationFailed, beaconReceipts: trial.beaconReceipts })); return;
    }
    if (incoming.method !== 'POST' || incoming.headers.origin !== origin || !String(incoming.headers['content-type']).startsWith('application/json')) { outgoing.writeHead(403); outgoing.end(); return; }
    const body = await bodyJson(incoming);
    if (match[1] === 'beacon') {
      if (body.trial !== trial.id || body.event !== 'load' || Object.keys(body).length !== 2) throw new Error('Unexpected beacon');
      trial.beaconReceipts++;
    } else if (match[1] === 'stage') {
      if (body.event === 'script' && body.value === undefined) trial.scriptReports++;
      else if (body.event === 'attempt' && body.value === undefined) trial.beaconAttemptReports++;
      else if (body.event === 'queue' && ['queued','not-queued','threw'].includes(body.value)) trial.queueResults.push(body.value);
      else throw new Error('Unexpected stage');
    } else throw new Error('Unexpected route');
    snapshot(); outgoing.writeHead(204); outgoing.end();
  } catch { outgoing.writeHead(400); outgoing.end('Invalid local trial request'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
origin = `http://127.0.0.1:${server.address().port}`;
snapshot();
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify({ origin, trials: [...trials.values()].map(({ id, mode, repeat }) => ({ id, mode, repeat, url: `${origin}/trial/${id}` })) }, null, 2) + '\n', { mode: 0o600 });
console.log(`Local calibration lab: ${origin}\nEvidence: ${output}`);
async function stop() { snapshot(); server.close(); await mf.dispose(); }
process.once('SIGINT', () => void stop()); process.once('SIGTERM', () => void stop());
const deadline = setTimeout(() => void stop(), 15 * 60 * 1000); deadline.unref();

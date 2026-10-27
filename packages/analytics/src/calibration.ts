import type { Env } from './db.js';
import { createDailyClientId } from './hash.js';
import { extractRequestMetadata } from './metadata.js';
import { isReaderKind } from './contracts.js';

const CONDITIONS = ['normal', 'block-script', 'block-beacon', 'http-client', 'javascript-off'] as const;
const OPERATORS = ['agent-browser', 'controlled-curl', 'human-reported'] as const;
const STAGES = ['script', 'attempt', 'queued', 'not-queued', 'threw', 'beacon'] as const;
type Condition = typeof CONDITIONS[number];
type Operator = typeof OPERATORS[number];
export type CalibrationCondition = Condition;
export type CalibrationOperator = Operator;
type Stage = typeof STAGES[number];
const COLUMNS: Record<Stage, string> = { script: 'script', attempt: 'attempt', queued: 'queued', 'not-queued': 'not_queued', threw: 'threw', beacon: 'beacon' };
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
interface Trial { id: string; condition: Condition; operator: Operator }
interface Config { issuedAt: number; expiresAt: number; trials: Trial[] }
interface Counts { page_responses: number; script: number; attempt: number; queued: number; not_queued: number; threw: number; beacon: number }
export interface CalibrationResponse { response: Response; collect: boolean }
function record(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v); }
function config(raw: string | undefined, now: Date): Config | null {
  if (!raw || raw.length > 8192 || !Number.isFinite(now.getTime())) return null;
  let v: unknown; try { v = JSON.parse(raw); } catch { return null; }
  if (!record(v) || typeof v.issuedAt !== 'number' || typeof v.expiresAt !== 'number' || !Number.isSafeInteger(v.issuedAt) || !Number.isSafeInteger(v.expiresAt)
    || v.expiresAt <= v.issuedAt || v.expiresAt - v.issuedAt > 900000 || now.getTime() < v.issuedAt || now.getTime() >= v.expiresAt
    || !Array.isArray(v.trials) || v.trials.length < 1 || v.trials.length > 32) return null;
  const trials: Trial[] = [];
  for (const item of v.trials) {
    if (!record(item) || typeof item.id !== 'string' || !UUID.test(item.id)) return null;
    const condition = CONDITIONS.find(c => c === item.condition), operator = OPERATORS.find(o => o === item.operator);
    if (!condition || !operator || trials.some(t => t.id === item.id)) return null;
    trials.push({ id: item.id, condition, operator });
  }
  return { issuedAt: v.issuedAt, expiresAt: v.expiresAt, trials };
}
function stamp(now: Date): string { return now.toISOString().replace('T', ' ').slice(0, 19); }
function response(body: string, status = 200, type = 'application/json'): Response {
  return new Response(body, { status, headers: { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' } });
}
function result(body: string, status = 200): CalibrationResponse { return { response: response(body, status), collect: false }; }
async function ownerMarked(request: Request, env: Env, now: Date): Promise<boolean> {
  if (!env.ANALYTICS_HASH_KEY) return false;
  const m = extractRequestMetadata(request, env.OWNER_IPS);
  const day = now.toISOString().slice(0, 10);
  const id = await createDailyClientId({ masterKey: env.ANALYTICS_HASH_KEY, siteHost: m.siteHost, utcDate: day, ip: m.ip, userAgent: m.userAgent });
  return await env.DB.prepare('SELECT 1 AS marked FROM owner_clients WHERE daily_client_id = ? AND utc_date = ?').bind(id, day).first() !== null;
}
async function unitBody(request: Request): Promise<boolean> {
  const reader = request.body?.getReader(); if (!reader) return false;
  let value = '';
  try {
    for (;;) { const chunk = await reader.read(); if (chunk.done) break; if (chunk.value.byteLength + value.length > 8) { await reader.cancel(); return false; } value += new TextDecoder().decode(chunk.value); }
    return value === '1';
  } finally { reader.releaseLock(); }
}
const CLIENT = `const id=location.pathname.split('/').pop(),base='/api/analytics-calibration/'+id;
const stage=async name=>{const r=await fetch(base+'/stage/'+name,{method:'POST',body:'1'});if(!r.ok)throw Error('Stage report rejected: '+r.status)};
const refresh=async()=>{const r=await fetch(base+'/receipt',{headers:{Accept:'application/json'}});if(!r.ok)throw Error('Receipt unavailable: '+r.status);document.querySelector('#receipt').textContent=JSON.stringify(await r.json(),null,2)};
(async()=>{await stage('script');document.querySelector('#script').textContent='Script report received';await stage('attempt');let outcome;
try{outcome=navigator.sendBeacon(base+'/beacon','1')?'queued':'not-queued'}catch{outcome='threw'}
document.querySelector('#queue').textContent=outcome;await stage(outcome);await refresh();document.querySelector('#refresh').addEventListener('click',()=>refresh().catch(e=>document.querySelector('#state').textContent=e.message));document.querySelector('#state').textContent='Stage reports complete'} )().catch(e=>document.querySelector('#state').textContent=e.message);`;

/** Off by default. No anonymous page, stage write or receipt is exposed. */
export async function handleCalibration(request: Request, env: Env, now = new Date()): Promise<CalibrationResponse | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/analytics-check/') && !url.pathname.startsWith('/api/analytics-calibration/')) return null;
  const active = config(env.ANALYTICS_CALIBRATION, now);
  if (!active) return result('{}', 404);
  const pageMatch = /^\/analytics-check\/([^/]+)$/.exec(url.pathname);
  const apiMatch = /^\/api\/analytics-calibration\/([^/]+)\/(ready|client\.js|receipt|beacon|stage\/[^/]+)$/.exec(url.pathname);
  const id = pageMatch?.[1] ?? apiMatch?.[1];
  const trial = active.trials.find(t => t.id === id);
  if (!trial) return result('{}', 404);
  if (!await ownerMarked(request, env, now)) return result('{"error":"Current-day owner mark required"}', 403);
  const action = apiMatch?.[2];
  const peers = active.trials.filter(t => t.condition === trial.condition && t.operator === trial.operator);
  const position = peers.findIndex(t => t.id === trial.id);
  const next = peers[position + 1];
  const nextLink = next ? `<p><a href="/api/analytics-calibration/${next.id}/ready">Next trial</a></p>` : '<p>This is the last planned repeat for this condition.</p>';
  if (action === 'ready' && request.method === 'GET') {
    return { response: response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Ready for a controlled trial</title><h1>Ready for a controlled trial</h1><p>Condition: ${trial.condition}. Repeat ${position + 1} of ${peers.length}. Planned operator: ${trial.operator}.</p><p>This ready page creates no page observation or stage counters. Start only when the planned operator is actually taking the action; the label alone proves nothing.</p><p>Your current marked profile is excluded. The trial stores stage counters and the usual excluded observation, with no extra device probe or raw diagnostics.</p>${trial.condition === 'javascript-off' ? '<p>Disable JavaScript for this site yourself before starting. This label does not change your browser settings.</p>' : ''}<p><a href="/analytics-check/${trial.id}">Start trial</a></p>`, 200, 'text/html'), collect: false };
  }
  if (pageMatch && request.method === 'GET') {
    const expiry = stamp(new Date(active.expiresAt + 86400000));
    await env.DB.prepare('INSERT INTO analytics_calibration_trials(id,condition,operator,expires_at) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(trial.id, trial.condition, trial.operator, expiry).run();
    const updated = await env.DB.prepare('UPDATE analytics_calibration_trials SET page_responses=page_responses+1 WHERE id=? AND condition=? AND operator=? AND page_responses<4').bind(trial.id, trial.condition, trial.operator).run();
    if (updated.meta.changes !== 1) return result('{"error":"Trial response limit or configuration mismatch"}', 429);
    const api = url.origin + '/api/analytics-calibration/' + trial.id;
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Controlled analytics trial</title><style>body{font:17px system-ui;max-width:760px;margin:40px auto;padding:20px}pre{white-space:pre-wrap}</style><h1>Controlled analytics trial</h1><p>Condition: ${trial.condition}. Planned operator label: ${trial.operator}. A planned label is not proof that a person operated this trial.</p><p>This marked profile is excluded from public totals. Only experiment stage counters are added; no extra device probe or raw diagnostics are enabled.</p><p id="state">Script execution not reported</p><p id="script">No script report yet</p><p id="queue">Beacon queue outcome not reported</p><button id="refresh">Refresh receipt</button><pre id="receipt">Receipt not requested</pre><p><a href="${api}/receipt">Open server receipt (works without JavaScript)</a></p>${nextLink}<noscript>JavaScript is disabled in this browser. The server receipt remains available.</noscript><script src="${api}/client.js" defer></script></html>`;
    const r = response(html, 200, 'text/html');
    const connects = trial.condition === 'block-beacon' ? api + '/stage/ ' + api + '/receipt' : "'self'";
    r.headers.set('Content-Security-Policy', `default-src 'none'; script-src ${trial.condition === 'block-script' ? "'none'" : "'self'"}; connect-src ${connects}; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`);
    return { response: r, collect: true };
  }
  if (action === 'client.js' && request.method === 'GET') return { response: response(CLIENT, 200, 'text/javascript'), collect: false };
  if (action === 'receipt' && request.method === 'GET') {
    const counters = await env.DB.prepare('SELECT page_responses,script,attempt,queued,not_queued,threw,beacon FROM analytics_calibration_trials WHERE id=? AND expires_at>?').bind(trial.id, stamp(now)).first<Counts>();
    if (!counters) return result('{}', 404);
    const path = '/analytics-check/' + trial.id;
    const observations = await env.DB.prepare('SELECT reader_kind AS kind, is_owner AS ownerExcluded, COUNT(*) AS observations FROM page_observations WHERE path=? GROUP BY reader_kind,is_owner').bind(path).all<{ kind: string; ownerExcluded: number; observations: number }>();
    if (!observations.results.every(o => isReaderKind(o.kind))) return result('{"error":"Unrecognized stored classification"}', 500);
    const payload = { profile: 'production-stage-v1', condition: trial.condition, plannedOperator: trial.operator, counters, observations: observations.results, persistenceLimit: 'No observed row can mean pending, failure or interruption; absence is not a failed-operation verdict', operatorLimit: 'Planned operator requires independent execution evidence; no human readership is inferred' };
    const body = JSON.stringify(payload, null, 2);
    return { response: response(request.headers.get('Accept')?.includes('text/html') ? '<!doctype html><html lang="en"><meta charset="utf-8"><title>Trial receipt</title><h1>Trial receipt</h1><pre>' + body + '</pre></html>' : body, 200, request.headers.get('Accept')?.includes('text/html') ? 'text/html' : 'application/json'), collect: false };
  }
  const stage = action === 'beacon' ? 'beacon' : STAGES.find(s => action === 'stage/' + s && s !== 'beacon');
  if (!stage || request.method !== 'POST') return result('{}', 405);
  if (request.headers.get('Origin') !== url.origin) return result('{}', 403);
  if (!await unitBody(request)) return result('{}', 400);
  const column = COLUMNS[stage];
  const updated = await env.DB.prepare(`UPDATE analytics_calibration_trials SET ${column}=${column}+1 WHERE id=? AND expires_at>? AND ${column}<8`).bind(trial.id, stamp(now)).run();
  return result('{}', updated.meta.changes === 1 ? 200 : 429);
}

export async function purgeExpiredCalibration(db: D1Database, now = new Date()): Promise<number> {
  const result = await db.prepare('DELETE FROM analytics_calibration_trials WHERE id IN (SELECT id FROM analytics_calibration_trials WHERE expires_at<=? ORDER BY expires_at LIMIT 1000)').bind(stamp(now)).run();
  return result.meta.changes ?? 0;
}

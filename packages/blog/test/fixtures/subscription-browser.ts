/** Manual native-browser acceptance fixture. No production credentials or email sends.
 * pnpm -C packages/blog exec node --import tsx test/fixtures/subscription-browser.ts hold
 * Scenarios: hold | accepted | html | redirect | failure | loader-failure | main-failure
 *           | late-provider | late-loader-failure.
 */
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { ReplySlip } from '../../src/templates/artifacts.js';
import { renderContent } from '../../src/lib/ssg.js';
import { clientBootstrap } from '../../src/templates/client-bootstrap.js';
import { parseClientErrorPayload } from '../../../client-observability/src/schema.js';
import type { SubscriptionErrorEvidence } from '@gkoreli/client-observability/client';

const scenario = process.argv[2] ?? 'accepted';
if (!['hold', 'accepted', 'html', 'redirect', 'failure', 'loader-failure', 'main-failure', 'late-provider', 'late-loader-failure'].includes(scenario)) throw new Error('Unknown fixture scenario');
const sitekey = scenario === 'failure' ? '2x00000000000000000000AB' : '1x00000000000000000000AA';
const lateProvider = scenario === 'late-provider' || scenario === 'late-loader-failure';
const forms = await renderContent(['first', 'second'].map(formId => ReplySlip({ turnstileSiteKey: sitekey, formId })));
const bundle = await build({
  stdin: { contents: `
    import {initSubscribeForm} from './src/client/subscribe.ts';
    import {createDefaultClientLogger} from '@gkoreli/client-observability/client';
    initSubscribeForm({logger:createDefaultClientLogger({buildId:'native-browser-fixture'})});
    document.getElementById('load-provider')?.addEventListener('click',()=>{
      if(document.querySelector('script[data-native-provider]'))return;
      const script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=gkTurnstileReady';
      script.async=true;script.defer=true;script.dataset.nativeProvider='true';document.head.append(script);
    });
    document.getElementById('repeat-ready').addEventListener('click',()=>window.gkTurnstileReady());
    document.getElementById('release').addEventListener('click',async()=>{await fetch('/fixture/release',{method:'POST'});});
    document.getElementById('refresh').addEventListener('click',async()=>{
      const response=await fetch('/fixture/evidence');
      document.getElementById('evidence').textContent=JSON.stringify(await response.json(),null,2);
    });
  `, resolveDir: fileURLToPath(new URL('../..', import.meta.url)), sourcefile: 'native-browser-fixture.ts', loader: 'ts' },
  bundle: true, write: false, platform: 'browser', format: 'esm', target: 'es2022',
});
const client = bundle.outputFiles[0]?.text;
if (!client) throw new Error('Fixture client build missing');
const clientSha256 = createHash('sha256').update(client).digest('hex');
const script = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=gkTurnstileReady';
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Native subscription acceptance fixture</title>
  <style>body{font:17px system-ui;max-width:780px;margin:40px auto;padding:0 24px;background:#f5f2e9;color:#232823}h1{font-size:28px}form{padding:20px;margin:20px 0;border:1px solid #aaa;border-radius:8px;background:white}input,button{padding:10px;font:inherit}button{cursor:pointer}button:disabled{cursor:wait}label{display:block;margin-bottom:8px}.dispatch-note{font-size:13px}.subscribe-msg{font-weight:600}form[data-subscribe-status=success]{border-color:#267548}form[data-subscribe-status=error]{border-color:#a64d2e}pre{white-space:pre-wrap;word-break:break-word;background:white;padding:15px;font-size:12px}</style>
  <script>${clientBootstrap(JSON.stringify('native-browser-fixture'))}</script>
  ${lateProvider ? '' : `<script src="${script}" data-native-provider="true" defer></script>`}<script src="${scenario === 'main-failure' ? '/main.js' : '/fixture/client.js'}" type="module"></script>
  </head><body><h1>Native subscription acceptance fixture</h1>
  <p>Scenario: <strong>${scenario}</strong>. Actual SSG form, subscription client, bootstrap and Cloudflare API. Official dummy sitekey. Local receiver only; no email sends.</p>
  <h2>First form</h2>${forms[0]}<h2>Second form</h2>${forms[1]}
  <p>${lateProvider ? '<button id="load-provider">Load provider script</button> ' : ''}<button id="repeat-ready">Repeat provider readiness signal</button> <button id="release">Release pending responses</button> <button id="refresh">Refresh evidence</button></p>
  <pre id="evidence">No evidence requested yet.</pre></body></html>`;

const evidence: {
  scenario: string; clientSha256: string; signupPosts: number; acceptedDummyTokens: number; redirectTargetRequests: number;
  attemptIds: string[]; diagnosticStages: string[]; subscriptionEvidence: SubscriptionErrorEvidence[]; heldResponses: number;
} = { scenario, clientSha256, signupPosts: 0, acceptedDummyTokens: 0, redirectTargetRequests: 0, attemptIds: [], diagnosticStages: [], subscriptionEvidence: [], heldResponses: 0 };
let released = scenario !== 'hold';
const pending: (() => void)[] = [];
const server = createServer(async (request, response) => {
  response.setHeader('cache-control', 'no-store');
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  if (request.method === 'GET' && url.pathname === '/') {
    response.setHeader('content-type', 'text/html; charset=utf-8');
    // Controlled enforced policy, exercising a real resource error for the actual provider URL.
    if (scenario === 'loader-failure' || scenario === 'late-loader-failure') response.setHeader('content-security-policy', "script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src https://challenges.cloudflare.com");
    response.end(html); return;
  }
  if (request.method === 'GET' && url.pathname === '/fixture/client.js') { response.setHeader('content-type', 'text/javascript'); response.end(client); return; }
  if (request.method === 'GET' && url.pathname === '/fixture/evidence') { response.setHeader('content-type', 'application/json'); response.end(JSON.stringify(evidence)); return; }
  if (request.method === 'POST' && url.pathname === '/fixture/release') {
    released = true; for (const send of pending.splice(0)) send(); evidence.heldResponses = 0; response.writeHead(204).end(); return;
  }
  if (request.method === 'GET' && url.pathname === '/fixture/redirect-target') {
    evidence.redirectTargetRequests++; response.setHeader('content-type', 'application/json'); response.end('{"ok":true}'); return;
  }
  if (request.method === 'POST' && (url.pathname === '/api/subscribe' || url.pathname === '/api/client-error')) {
    const chunks: Buffer[] = []; let bytes = 0;
    for await (const chunk of request) {
      if (!Buffer.isBuffer(chunk)) { response.writeHead(400).end(); return; }
      bytes += chunk.length; if (bytes > 16_384) { response.writeHead(413).end(); return; }
      chunks.push(chunk);
    }
    let value: unknown;
    try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { response.writeHead(400).end(); return; }
    if (typeof value !== 'object' || value === null) { response.writeHead(400).end(); return; }
    if (url.pathname === '/api/client-error') {
      const event = parseClientErrorPayload(value, `http://${request.headers.host}`);
      if (!event || !/^[a-z_-]{1,80}$/.test(event.message)) { response.writeHead(400).end(); return; }
      evidence.diagnosticStages.push(event.message);
      if (event.subscriptionEvidence) evidence.subscriptionEvidence.push(event.subscriptionEvidence);
      response.writeHead(204).end(); return;
    }
    evidence.signupPosts++;
    const id = request.headers['x-subscription-attempt-id'];
    if (typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) evidence.attemptIds.push(id);
    if (!('turnstile' in value) || value.turnstile !== 'XXXX.DUMMY.TOKEN.XXXX'
      || !('email' in value) || typeof value.email !== 'string' || !value.email.endsWith('@example.invalid')) {
      response.writeHead(400).end(); return;
    }
    evidence.acceptedDummyTokens++;
    const send = () => {
      response.setHeader('x-request-id', crypto.randomUUID());
      if (scenario === 'redirect') { response.writeHead(302, { location: '/fixture/redirect-target' }).end(); return; }
      response.setHeader('content-type', scenario === 'html' ? 'text/html' : 'application/json');
      response.writeHead(202).end(scenario === 'html' ? '<html>Unexpected intermediary response</html>' : '{"ok":true}');
    };
    if (!released) { pending.push(send); evidence.heldResponses++; } else send();
    return;
  }
  response.writeHead(404).end();
});
server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  if (address && typeof address === 'object') console.log(JSON.stringify({ fixture: `http://127.0.0.1:${address.port}`, scenario, liveEmailSends: 0 }));
});
process.once('SIGINT', () => { server.closeAllConnections(); server.close(); });

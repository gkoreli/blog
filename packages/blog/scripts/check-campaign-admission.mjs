import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const baseline = process.argv[2], output = process.argv[3];
assert.match(baseline ?? '', /^[0-9a-f]{40}$/);
assert.ok(output?.startsWith('/'), 'Pass a fresh absolute private evidence directory');
mkdirSync(output, { mode: 0o700 });
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(`${repo}/package.json`), blogRequire = createRequire(`${repo}/packages/blog/package.json`);
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const { build } = await import(pathToFileURL(blogRequire.resolve('esbuild')));
const migrations = ['0001_create_subscribers.sql', '0003_add_bounced_at.sql', '0004_delivery_logs.sql', '0005_confirmation_admission.sql', '0006_campaign_admission.sql'];
const oldController = execFileSync('git', ['show', `${baseline}:packages/newsletter/src/send.ts`], { cwd: repo, encoding: 'utf8' });
const oldEmail = execFileSync('git', ['show', `${baseline}:packages/newsletter/src/email.ts`], { cwd: repo, encoding: 'utf8' });
const oldDatabase = execFileSync('git', ['show', `${baseline}:packages/newsletter/src/db.ts`], { cwd: repo, encoding: 'utf8' });
const payload = { campaign_id: 'native-campaign', subject: 'Synthetic native campaign', html: '<p>synthetic only</p>', text: 'synthetic only' };
const evidence = { checkedAt: new Date().toISOString(), baseline,
  method: 'Paired actual workerd handlers and D1; before pins send.ts, email.ts and db.ts to the baseline campaign slice, while after uses current code. Token generation and the native runtime are shared. Provider effects are local outboundService controls, never external email.',
  compatibilityDate: '2026-03-06', productionCalls: 0, realRecipients: 0, variants: {} };

for (const variant of ['before', 'after']) {
  let mode = 'accepted', hold = false, providerCalls = 0;
  const releases = [], keys = [];
  const bundle = await build({ stdin: { resolveDir: `${repo}/packages/blog`, contents: `
    import { handleSend } from 'owned-campaign-controller';
    export default { fetch(request, env) { return handleSend(request, {
      DB: env.DB, ADMIN_SECRET: 'synthetic-admin', RESEND_API_KEY: 'synthetic-key'
    }); } };
  ` }, bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2024', plugins: [{ name: 'owned-controller', setup(api) {
    api.onResolve({ filter: /^owned-campaign-controller$/ }, () => ({ path: 'controller', namespace: 'owned' }));
    api.onResolve({ filter: /^\.\/(email|db)\.js$/, namespace: 'owned' }, args => variant === 'before'
      ? { path: args.path === './email.js' ? 'legacy-email' : 'legacy-database', namespace: 'owned' } : undefined);
    api.onLoad({ filter: /.*/, namespace: 'owned' }, args => ({
      contents: args.path === 'legacy-email' ? oldEmail : args.path === 'legacy-database' ? oldDatabase
        : variant === 'before' ? oldController : readFileSync(`${repo}/packages/newsletter/src/send.ts`, 'utf8'),
      resolveDir: `${repo}/packages/newsletter/src`, loader: 'ts',
    }));
  } }] });
  const worker = new Miniflare({ modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: evidence.compatibilityDate, cf: {}, d1Databases: { DB: `campaign-admission-${variant}` },
    outboundService: async request => {
      assert.equal(request.url, 'https://api.resend.com/emails/batch', 'Unexpected destination; no external requests allowed');
      providerCalls++;
      keys.push(request.headers.get('Idempotency-Key'));
      const messages = await request.json();
      if (hold) await new Promise(resolve => releases.push(resolve));
      if (mode === 'lost') return new Response('Synthetic incomplete provider JSON', {
        status: 200, headers: { 'content-type': 'application/json' },
      });
      return Response.json({ data: mode === 'malformed' ? [] : messages.map(() => ({ id: crypto.randomUUID() })) });
    },
  });
  const rows = [];
  try {
    const db = await worker.getD1Database('DB');
    for (const name of migrations) {
      // These pinned migrations contain line comments, including semicolons in
      // inline comments. Remove those before statement splitting.
      const source = readFileSync(`${repo}/packages/newsletter/migrations/${name}`, 'utf8').replace(/--[^\n]*/g, '');
      for (const sql of source.split(';').filter(sql => sql.trim())) await db.prepare(sql).run();
    }
    const seed = async count => {
      await db.batch([db.prepare('DELETE FROM newsletter_campaign_runs'), db.prepare('DELETE FROM delivery_logs'), db.prepare('DELETE FROM subscribers')]);
      for (let index = 0; index < count; index++) await db.prepare(`INSERT INTO subscribers (id,email,status,unsubscribe_token,confirmed_at)
        VALUES (?,?,'active',?,datetime('now'))`).bind(`native-${index}`, `native-${index}@example.invalid`, `native-token-${index}`).run();
      providerCalls = 0; keys.length = 0; mode = 'accepted'; hold = false;
    };
    const send = () => worker.dispatchFetch('https://fixture.invalid/api/send', { method: 'POST',
      headers: { authorization: 'Bearer synthetic-admin', 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const campaign = () => db.prepare('SELECT state,accepted_count,failed_count,unknown_count,not_attempted_count,interruption_reason FROM newsletter_campaign_runs WHERE campaign_id=?').bind(payload.campaign_id).first();
    await seed(1); hold = true;
    const first = send();
    for (let attempts = 0; attempts < 400 && providerCalls < 1; attempts++) await wait(5);
    assert.equal(providerCalls, 1);
    let secondDone = false;
    const second = send().then(response => { secondDone = true; return response; });
    try {
      for (let attempts = 0; attempts < 400 && !secondDone && providerCalls < 2; attempts++) await wait(5);
      assert.equal(providerCalls, variant === 'before' ? 2 : 1);
      if (variant === 'after') assert.equal((await second).status, 409);
    } finally { hold = false; for (const release of releases.splice(0)) release(); }
    const firstStatus = (await first).status, secondStatus = (await second).status;
    assert.equal(firstStatus, 200);
    rows.push({ case: 'concurrent-same-id', firstStatus, secondStatus, providerCalls, stableOperationKey: variant === 'after' && /^newsletter-campaign\/[0-9a-f-]{36}\/0$/.test(keys[0] ?? ''), campaign: await campaign() });

    await seed(1); mode = 'lost';
    let lostStatus;
    try { lostStatus = (await send()).status; } catch { lostStatus = 'thrown'; }
    let repeatStatus;
    try { repeatStatus = (await send()).status; } catch { repeatStatus = 'thrown'; }
    assert.equal(providerCalls, variant === 'before' ? 2 : 1);
    if (variant === 'after') { assert.equal(lostStatus, 503); assert.equal(repeatStatus, 409); }
    rows.push({ case: 'unreadable-provider-success-receipt', firstStatus: lostStatus, repeatStatus, providerCalls, campaign: await campaign() });

    await seed(1);
    await db.prepare("CREATE TRIGGER synthetic_log_failure BEFORE INSERT ON delivery_logs BEGIN SELECT RAISE(ABORT, 'synthetic log failure'); END").run();
    let logStatus;
    try { logStatus = (await send()).status; } catch { logStatus = 'thrown'; }
    let logRepeat;
    try { logRepeat = (await send()).status; } catch { logRepeat = 'thrown'; }
    assert.equal(providerCalls, variant === 'before' ? 2 : 1);
    if (variant === 'after') { assert.equal(logStatus, 503); assert.equal(logRepeat, 409); }
    rows.push({ case: 'accepted-send-log-failure', firstStatus: logStatus, repeatStatus: logRepeat, providerCalls, campaign: await campaign() });
    await db.prepare('DROP TRIGGER synthetic_log_failure').run();

    await seed(101); mode = 'malformed';
    const malformed = await send();
    assert.equal(providerCalls, variant === 'before' ? 2 : 1);
    const result = await malformed.json();
    if (variant === 'after') { assert.equal(malformed.status, 503); assert.equal(result.unknown, 100); assert.equal(result.not_attempted, 1); }
    rows.push({ case: 'uncertain-batch-stops-later-effects', status: malformed.status, providerCalls, result, campaign: await campaign() });
    evidence.variants[variant] = { workerSha256: createHash('sha256').update(bundle.outputFiles[0].text).digest('hex'), rows };
    writeFileSync(`${output}/${variant}.json`, JSON.stringify(evidence.variants[variant], null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  } finally { for (const release of releases.splice(0)) release(); await worker.dispose(); }
}
writeFileSync(`${output}/native.json`, JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ nativeCampaignAdmission: 'pass', casesPerVariant: 4,
  beforeProviderCalls: evidence.variants.before.rows.map(row => row.providerCalls),
  afterProviderCalls: evidence.variants.after.rows.map(row => row.providerCalls), productionCalls: 0, realRecipients: 0 }));

// Run: pnpm -C packages/blog exec tsx drafts/research/newsletter-reliability/repro/d1-admission.mjs
// Actual local workerd D1; temporary storage, synthetic addresses, no provider calls.
import assert from 'node:assert/strict';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { admitConfirmation } from '../../../../../newsletter/src/confirmation-store.ts';

const requireWrangler = createRequire(realpathSync(new URL('../../../../../../node_modules/wrangler/package.json', import.meta.url)));
const { Miniflare } = requireWrangler('miniflare');
const mf = new Miniflare({
  modules: true,
  script: 'export default { fetch() { return new Response("local D1 fixture"); } }',
  d1Databases: ['DB'],
});
const results = [];
let sequence = 0;
function input(email, mode = 'subscribe') {
  const id = `fixture-${++sequence}`;
  return { id, email, mode, tokenHash: id, subscriberId: id, unsubscribeToken: `unsub-${id}`,
    source: null, consentIp: null, userAgent: null };
}

try {
  const db = await mf.getD1Database('DB');
  for (const file of ['0001_create_subscribers.sql', '0003_add_bounced_at.sql', '0004_delivery_logs.sql', '0005_confirmation_admission.sql']) {
    const sql = readFileSync(new URL(`../../../../../newsletter/migrations/${file}`, import.meta.url), 'utf8');
    const statements = sql.replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
    await db.batch(statements.map(s => db.prepare(s)));
  }
  results.push({ check: 'fresh migration path 0001/0003/0004/0005', passed: true });

  async function clear() {
    await db.batch([db.prepare('DELETE FROM confirmation_attempts'), db.prepare('DELETE FROM subscribers')]);
  }
  async function count() {
    return (await db.prepare('SELECT COUNT(*) AS n FROM confirmation_attempts').first()).n;
  }

  const same = await Promise.all(Array.from({ length: 48 }, (_, i) =>
    admitConfirmation(db, input('one@example.invalid', i % 2 === 0 ? 'subscribe' : 'resend'))));
  assert.equal(same.filter(r => r.decision === 'admitted').length, 1);
  assert.equal(await count(), 1);
  results.push({ check: '48 concurrent mixed-endpoint admissions for one address', admitted: 1, passed: true });

  for (let i = 0; i < 2; i++) {
    await db.prepare('UPDATE confirmation_attempts SET reserved_at = reserved_at - 601').run();
    assert.equal((await admitConfirmation(db, input('one@example.invalid', 'resend'))).decision, 'admitted');
  }
  await db.prepare('UPDATE confirmation_attempts SET reserved_at = reserved_at - 601').run();
  assert.equal((await admitConfirmation(db, input('one@example.invalid'))).decision, 'unchanged');
  assert.equal(await count(), 3);
  results.push({ check: 'rolling address day cap after cooldowns', admitted: 3, passed: true });

  await clear();
  for (let hour = 0; hour < 4; hour++) {
    if (hour > 0) await db.prepare('UPDATE confirmation_attempts SET reserved_at = reserved_at - 3601').run();
    const wave = await Promise.all(Array.from({ length: 60 }, (_, i) =>
      admitConfirmation(db, input(`wave-${hour}-${i}@example.invalid`))));
    assert.equal(wave.filter(r => r.decision === 'admitted').length, 25);
    assert.equal(wave.filter(r => r.decision === 'capacity').length, 35);
  }
  await db.prepare('UPDATE confirmation_attempts SET reserved_at = reserved_at - 3601').run();
  assert.equal((await admitConfirmation(db, input('over-day@example.invalid'))).decision, 'capacity');
  assert.equal(await count(), 100);
  results.push({ check: 'four 60-request concurrent waves with shifted fixture times; rolling hour/day caps', admitted: 100, passed: true });

  await clear();
  await db.prepare(`CREATE TRIGGER reject_fixture BEFORE INSERT ON subscribers
    WHEN NEW.email = 'rollback@example.invalid' BEGIN SELECT RAISE(ABORT, 'fixture rollback'); END`).run();
  await assert.rejects(() => admitConfirmation(db, input('rollback@example.invalid')));
  assert.equal(await count(), 0);
  await db.prepare('DROP TRIGGER reject_fixture').run();
  results.push({ check: 'subscriber write failure rolls back admission reservation', passed: true });

  const output = {
    checkedAt: new Date().toISOString(), runtime: 'Miniflare local workerd D1',
    miniflareVersion: requireWrangler('miniflare/package.json').version,
    scope: 'Admission store and fresh migration path. No remote database, Turnstile, Resend, browser, or production-quota acceptance.',
    results,
  };
  writeFileSync(new URL('./d1-admission-results.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
} finally {
  await mf.dispose();
}

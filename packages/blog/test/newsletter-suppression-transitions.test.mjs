import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { markBounced, markComplained, unsubscribeByToken, purgeOldInactive } from '../../newsletter/src/db.ts';

/** Actual production SQL and SQLite transactions, never emulated state changes. */
function harness(t, { status = 'active', reason = null, days = 89 } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  for (const file of ['0001_create_subscribers.sql', '0003_add_bounced_at.sql', '0004_delivery_logs.sql', '0005_confirmation_admission.sql']) {
    sqlite.exec(readFileSync(new URL(`../../newsletter/migrations/${file}`, import.meta.url), 'utf8'));
  }
  sqlite.prepare(`INSERT INTO subscribers
    (id,email,status,unsubscribe_token,confirm_token,confirm_token_expires_at,suppression_reason,bounced_at,unsubscribed_at)
    VALUES ('synthetic-subscriber','reader@example.invalid',?,'synthetic-optout','synthetic-hash',datetime('now','+1 day'),?,datetime('now',?),datetime('now',?))`)
    .run(status, reason, `-${days} days`, `-${days} days`);
  sqlite.exec(`INSERT INTO confirmation_attempts(id,email,token_hash,reserved_at,expires_at)
    VALUES ('synthetic-attempt','reader@example.invalid','synthetic-hash',unixepoch(),unixepoch()+86400)`);
  const prepare = (query, values = []) => ({
    bind(...next) { return prepare(query, next); },
    async run() { return this.execute(); },
    execute() {
      const result = sqlite.prepare(query).run(...values);
      return { results: [], success: true, meta: { changes: Number(result.changes) } };
    },
  });
  const db = { prepare, async batch(statements) {
    sqlite.exec('BEGIN IMMEDIATE');
    try { const result = statements.map(statement => statement.execute()); sqlite.exec('COMMIT'); return result; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
  return { sqlite, db,
    row: () => sqlite.prepare('SELECT * FROM subscribers').get(),
    revoked: () => sqlite.prepare('SELECT revoked FROM confirmation_attempts').get().revoked,
    failSubscriberUpdate() { sqlite.exec(`CREATE TRIGGER reject_suppression BEFORE UPDATE ON subscribers BEGIN SELECT RAISE(ABORT,'synthetic failure'); END`); },
  };
}

const families = [
  { name: 'bounce', apply: markBounced, status: 'bounced', reason: 'bounce', timestamp: 'bounced_at' },
  { name: 'complaint', apply: markComplained, status: 'unsubscribed', reason: 'complaint', timestamp: 'unsubscribed_at' },
];
for (const family of families) {
  test(`duplicate ${family.name} preserves its 89-day retention anchor`, async t => {
    const h = harness(t, family);
    const before = h.row()[family.timestamp];
    await family.apply(h.db, 'reader@example.invalid');
    assert.equal(h.row()[family.timestamp], before);
    assert.equal(h.row().confirm_token, null);
    assert.equal(h.revoked(), 1);
  });
  for (const status of ['active', 'pending']) {
    test(`${family.name} starts a fresh timestamp on transition from ${status}`, async t => {
      const h = harness(t, { status });
      const before = h.row()[family.timestamp];
      await family.apply(h.db, 'reader@example.invalid');
      assert.equal(h.row().status, family.status);
      assert.equal(h.row().suppression_reason, family.reason);
      assert.notEqual(h.row()[family.timestamp], before);
      assert.equal(h.revoked(), 1);
    });
  }
  test(`${family.name} repairs a missing timestamp`, async t => {
    const h = harness(t, family);
    h.sqlite.exec(`UPDATE subscribers SET ${family.timestamp} = NULL`);
    await family.apply(h.db, 'reader@example.invalid');
    assert.ok(h.row()[family.timestamp]);
  });
  test(`${family.name} failure rolls back token revocation and state`, async t => {
    const h = harness(t);
    h.failSubscriberUpdate();
    await assert.rejects(family.apply(h.db, 'reader@example.invalid'));
    assert.equal(h.row().status, 'active');
    assert.equal(h.row().confirm_token, 'synthetic-hash');
    assert.equal(h.revoked(), 0);
  });
  test(`duplicate ${family.name} does not rescue a 91-day row from cleanup`, async t => {
    const h = harness(t, { ...family, days: 91 });
    await family.apply(h.db, 'reader@example.invalid');
    assert.equal(await purgeOldInactive(h.db), 1);
    assert.equal(h.row(), undefined);
  });
}

test('complaint after ordinary unsubscribe starts its suppression interval', async t => {
  const h = harness(t, { status: 'unsubscribed' });
  const before = h.row().unsubscribed_at;
  await markComplained(h.db, 'reader@example.invalid');
  assert.notEqual(h.row().unsubscribed_at, before);
  assert.equal(h.row().suppression_reason, 'complaint');
});

test('confirmation opt-out starts once; its repeat and ordinary unsubscribe preserve the anchor', async t => {
  const h = harness(t, { status: 'unsubscribed' });
  const old = h.row().unsubscribed_at;
  await unsubscribeByToken(h.db, 'synthetic-optout', true);
  assert.notEqual(h.row().unsubscribed_at, old);
  assert.equal(h.row().suppression_reason, 'confirmation-opt-out');
  h.sqlite.exec("UPDATE subscribers SET unsubscribed_at = datetime('now','-89 days')");
  const anchor = h.row().unsubscribed_at;
  await unsubscribeByToken(h.db, 'synthetic-optout', true);
  await unsubscribeByToken(h.db, 'synthetic-optout');
  assert.equal(h.row().unsubscribed_at, anchor);
  assert.equal(h.row().unsubscribe_token, 'synthetic-optout');
  assert.equal(h.revoked(), 1);
});

test('bounce preserves an existing complaint reason; a later complaint is a distinct state transition', async t => {
  const h = harness(t, { status: 'unsubscribed', reason: 'complaint' });
  await markBounced(h.db, 'reader@example.invalid');
  assert.equal(h.row().status, 'bounced');
  assert.equal(h.row().suppression_reason, 'complaint');
  const old = h.row().unsubscribed_at;
  await markComplained(h.db, 'reader@example.invalid');
  assert.equal(h.row().status, 'unsubscribed');
  assert.equal(h.row().suppression_reason, 'complaint');
  assert.notEqual(h.row().unsubscribed_at, old);
});

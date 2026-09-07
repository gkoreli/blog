// Real in-memory SQLite with production handlers; all provider requests are mocked.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { handleSubscribe } from '../../../../../newsletter/src/subscribe.ts';
import { handleConfirm } from '../../../../../newsletter/src/confirm.ts';

const sqlite = new DatabaseSync(':memory:');
for (const migration of ['0001_create_subscribers.sql', '0003_add_bounced_at.sql', '0004_delivery_logs.sql']) {
  sqlite.exec(readFileSync(new URL(`../../../../../newsletter/migrations/${migration}`, import.meta.url), 'utf8'));
}
const DB = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    return { bind(...values) { return {
      async first() { return statement.get(...values) ?? null; },
      async run() { const info = statement.run(...values); return { meta: { changes: info.changes } }; },
    }; } };
  },
};
const originalFetch = globalThis.fetch;
const result = { node: process.version, probes: {} };
let emailRequests = 0;
try {
  globalThis.fetch = async url => {
    if (String(url) !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      emailRequests++;
      throw new Error('Unexpected external operation in lifecycle probe');
    }
    return Response.json({ success: true });
  };
  const env = { DB, TURNSTILE_SECRET_KEY: 'synthetic-secret', RESEND_API_KEY: 'unused' };
  for (const status of ['unsubscribed', 'bounced']) {
    const email = `${status}@example.invalid`;
    sqlite.prepare('INSERT INTO subscribers (id, email, status, unsubscribe_token) VALUES (?, ?, ?, ?)')
      .run(status, email, status, 'synthetic-unsubscribe-token');
    let thrown;
    try {
      await handleSubscribe(new Request('https://gkoreli.com/api/subscribe', {
        method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://gkoreli.com' },
        body: JSON.stringify({ email, turnstile: 'synthetic-token' }),
      }), env, { waitUntil() { throw new Error('Unexpected email scheduling'); } });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      thrown = error.message;
    }
    result.probes[status + 'Resubscription'] = { thrownError: thrown ?? null };
  }
  const confirmation = await handleConfirm(new Request('https://gkoreli.com/api/confirm/synthetic-missing-token'), env, 'synthetic-missing-token');
  const html = await confirmation.text();
  result.probes.unknownConfirmation = {
    responseStatus: confirmation.status,
    claimsSubscriptionActive: html.includes('Your subscription is active'),
    activeRows: sqlite.prepare("SELECT COUNT(*) AS count FROM subscribers WHERE status = 'active'").get().count,
  };
  assert.equal(emailRequests, 0);
  result.emailRequests = emailRequests;
} finally {
  globalThis.fetch = originalFetch;
  sqlite.close();
}
console.log(JSON.stringify(result, null, 2));

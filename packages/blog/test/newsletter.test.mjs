import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { handleSubscribe } from '../../newsletter/src/subscribe.ts';
import { handleResendConfirmation } from '../../newsletter/src/resend-confirmation.ts';
import { handleConfirm } from '../../newsletter/src/confirm.ts';
import { handleUnsubscribe } from '../../newsletter/src/unsubscribe.ts';
import { handleResendWebhook } from '../../newsletter/src/webhook.ts';
import { hashToken } from '../../newsletter/src/tokens.ts';

test('provider rate-limit retry honors a short wait and reuses the same operation', async t => {
  const h = harness(t);
  const waits = [];
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    waits.push(delay);
    queueMicrotask(callback);
    return 0;
  });
  h.setProvider(async () => h.mail.length === 1
    ? new Response(null, { status: 429, headers: { 'retry-after': '2' } })
    : Response.json({ id: 'accepted-after-reset' }));
  assert.equal((await h.submit('rate-reset@example.invalid')).status, 202);
  assert.deepEqual(waits, [2000]);
  assert.equal(h.mail.length, 2);
  assert.equal(h.mail[0].body, h.mail[1].body);
  assert.equal(new Headers(h.mail[0].headers).get('Idempotency-Key'), new Headers(h.mail[1].headers).get('Idempotency-Key'));
  assert.equal(h.attempts()[0].outcome, 'accepted');
});

test('a provider reset beyond the interactive budget does not trigger an early retry', async t => {
  const h = harness(t);
  h.setProvider(async () => new Response(null, { status: 429, headers: { 'retry-after': '120' } }));
  assert.equal((await h.submit('long-reset@example.invalid')).status, 503);
  assert.equal(h.mail.length, 1);
  assert.equal(h.attempts()[0].outcome, 'failed');
  assert.equal((await h.resend('long-reset@example.invalid')).status, 202);
  assert.equal(h.mail.length, 1);
});

const SITE = 'https://gkoreli.com';
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAIL_URL = 'https://api.resend.com/emails';
const WEBHOOK_KEY = Buffer.from('synthetic newsletter webhook signing secret');
const MIGRATIONS = [
  '0001_create_subscribers.sql', '0003_add_bounced_at.sql',
  '0004_delivery_logs.sql', '0005_confirmation_admission.sql',
];

/** Execute production SQL transactionally; never emulate admission with JS counters. */
function harness(t, beforeAdmissionMigration = () => {}) {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of MIGRATIONS) {
    if (name.startsWith('0005')) beforeAdmissionMigration(sqlite);
    sqlite.exec(readFileSync(new URL(`../../newsletter/migrations/${name}`, import.meta.url), 'utf8'));
  }
  t.after(() => sqlite.close());
  const mail = [];
  const verification = [];
  const webhookRequests = [];
  const limiterKeys = [];
  const logs = [];
  let rejectedBatchIndex = null;
  let outcomeWriteFails = false;
  let allowed = true;
  let provider = async () => Response.json({ id: `synthetic-mail-${mail.length}` });
  let verifier = async () => Response.json({ success: true, hostname: 'gkoreli.com', action: 'subscribe' });

  function prepared(sql, values = []) {
    function execute() {
      if (outcomeWriteFails && /UPDATE confirmation_attempts SET outcome/.test(sql)) {
        throw new Error('Synthetic outcome write failure');
      }
      const statement = sqlite.prepare(sql);
      if (statement.columns().length) {
        return { results: statement.all(...values), success: true, meta: { changes: 0 } };
      }
      const info = statement.run(...values);
      return { results: [], success: true, meta: { changes: Number(info.changes) } };
    }
    return {
      bind(...nextValues) { return prepared(sql, nextValues); },
      async first(column) {
        const row = sqlite.prepare(sql).get(...values);
        return row ? column ? row[column] : row : null;
      },
      async all() { return execute(); },
      async run() { return execute(); },
      execute,
    };
  }
  const DB = {
    prepare: prepared,
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const result = statements.map((statement, index) => {
          if (index === rejectedBatchIndex) throw new Error('Synthetic transaction failure');
          return statement.execute();
        });
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const env = {
    DB, RESEND_API_KEY: 'synthetic-resend-key', TURNSTILE_SECRET_KEY: 'synthetic-turnstile-secret',
    RESEND_WEBHOOK_SECRET: `whsec_${WEBHOOK_KEY.toString('base64')}`,
    SUBSCRIBE_RATE_LIMITER: {
      async limit({ key }) { limiterKeys.push(key); return { success: allowed }; },
    },
  };
  t.mock.method(console, 'log', (...args) => { logs.push(args); });
  t.mock.method(console, 'warn', (...args) => { logs.push(args); });
  t.mock.method(console, 'error', (...args) => { logs.push(args); });
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (String(url) === VERIFY_URL) {
      verification.push({ url, ...init });
      return verifier(url, init);
    }
    if (String(url) === MAIL_URL) {
      const request = { url, ...init };
      mail.push(request);
      const key = new Headers(init?.headers).get('Idempotency-Key');
      const id = key?.replace('newsletter-confirmation/', '');
      assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM confirmation_attempts WHERE id = ?').get(id).count, 1,
        'every mail call must already have a durable reservation');
      return provider(url, init);
    }
    throw new Error(`External requests are disabled in this harness: ${String(url)}`);
  });
  const ctx = { waitUntil() { throw new Error('Confirmation must finish before the response'); } };

  function request(email, mode = 'subscribe', options = {}) {
    const path = mode === 'subscribe' ? '/api/subscribe' : '/api/resend-confirmation';
    return new Request(`${SITE}${path}`, {
      method: 'POST',
      headers: {
        origin: SITE, 'content-type': 'application/json', 'cf-connecting-ip': options.ip ?? '192.0.2.1',
        ...options.headers,
      },
      body: options.rawBody ?? JSON.stringify({ email, turnstile: 'synthetic-challenge-token', ...options.body }),
    });
  }

  function signedWebhook(payload, options = {}) {
    const body = options.rawBody ?? JSON.stringify(payload);
    const id = 'synthetic-webhook-id';
    const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1000));
    const computed = createHmac('sha256', WEBHOOK_KEY).update(`${id}.${timestamp}.${body}`).digest('base64');
    const signature = options.signature ?? `v1,${computed}`;
    const request = new Request(`${SITE}/api/webhooks/resend`, {
      method: 'POST', body,
      headers: { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': signature },
    });
    webhookRequests.push(request);
    return handleResendWebhook(request, env);
  }

  return {
    sqlite, DB, env, mail, verification, webhookRequests, limiterKeys, logs, request, signedWebhook,
    submit(email, options) { return handleSubscribe(request(email, 'subscribe', options), env, ctx); },
    resend(email, options) { return handleResendConfirmation(request(email, 'resend', options), env, ctx); },
    row(email) { return sqlite.prepare('SELECT * FROM subscribers WHERE email = ?').get(email); },
    attempts(email) {
      return email
        ? sqlite.prepare('SELECT * FROM confirmation_attempts WHERE email = ? ORDER BY rowid').all(email)
        : sqlite.prepare('SELECT * FROM confirmation_attempts ORDER BY rowid').all();
    },
    ageAttempts(seconds) {
      sqlite.prepare('UPDATE confirmation_attempts SET reserved_at = reserved_at - ?').run(seconds);
    },
    setProvider(value) { provider = value; },
    setVerifier(value) { verifier = value; },
    denyLimiter() { allowed = false; },
    failBatchAt(index) { rejectedBatchIndex = index; },
    failOutcomeWrite() { outcomeWriteFails = true; },
    confirm(rawToken, method = 'POST') {
      return handleConfirm(new Request(`${SITE}/api/confirm/${rawToken}`, { method }), env, rawToken);
    },
    unsubscribe(rawToken, { block = false, method = 'POST', view = false } = {}) {
      const url = new URL(`${SITE}/api/unsubscribe/${rawToken}`);
      if (block) url.searchParams.set('confirmations', 'off');
      if (view) url.searchParams.set('view', '1');
      return handleUnsubscribe(new Request(url, { method }), env, rawToken);
    },
    webhook(type, email) { return signedWebhook({ type, data: { to: [email] } }); },
  };
}

function confirmationToken(mail) {
  const body = JSON.parse(mail.body);
  assert.equal(typeof body.text, 'string');
  const token = body.text.match(/\/api\/confirm\/([a-f0-9]{64})/)?.[1];
  assert.ok(token, 'mail contains the raw confirmation URL');
  return token;
}

function mailKey(mail) { return new Headers(mail.headers).get('Idempotency-Key'); }

async function accepted(response) {
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true });
}

test('concurrent new signup requests across IPs reserve and send once', async t => {
  const h = harness(t);
  const responses = await Promise.all(Array.from({ length: 20 }, (_, index) =>
    h.submit('race@example.invalid', { ip: `192.0.2.${index + 1}` })));
  await Promise.all(responses.map(accepted));
  assert.equal(h.mail.length, 1);
  assert.equal(h.attempts().length, 1);
  assert.equal(h.row('race@example.invalid').status, 'pending');
  assert.equal(new Set(h.limiterKeys).size, 20);
});

test('concurrent pending signup and resend share one reservation and keep prior tokens', async t => {
  const h = harness(t);
  await accepted(await h.submit('pending@example.invalid'));
  const firstToken = confirmationToken(h.mail[0]);
  const optOut = h.row('pending@example.invalid').unsubscribe_token;
  h.ageAttempts(601);
  const responses = await Promise.all(Array.from({ length: 20 }, (_, index) =>
    index % 2 ? h.resend('pending@example.invalid', { ip: `198.51.100.${index}` })
      : h.submit('pending@example.invalid', { ip: `198.51.100.${index}` })));
  await Promise.all(responses.map(accepted));
  assert.equal(h.mail.length, 2);
  assert.equal(h.attempts().length, 2);
  assert.equal(h.row('pending@example.invalid').unsubscribe_token, optOut);
  assert.equal((await h.confirm(firstToken)).status, 200);
  assert.equal(h.row('pending@example.invalid').status, 'active');
  assert.ok(h.attempts().every(row => row.revoked === 1));
});

test('recipient cooldown and three-per-day budget apply across both routes and IPs', async t => {
  const h = harness(t);
  await accepted(await h.submit(' Reader@Example.Invalid '));
  await accepted(await h.resend('reader@example.invalid', { ip: '198.51.100.2' }));
  assert.equal(h.mail.length, 1);
  for (let index = 0; index < 2; index++) {
    h.ageAttempts(601);
    await accepted(await h.resend('reader@example.invalid', { ip: `203.0.113.${index + 1}` }));
  }
  assert.equal(h.mail.length, 3);
  h.ageAttempts(601);
  await accepted(await h.submit('reader@example.invalid', { ip: '203.0.113.20' }));
  assert.equal(h.mail.length, 3);
  assert.equal(h.attempts().length, 3);
  h.ageAttempts(86_401);
  await accepted(await h.submit('reader@example.invalid'));
  assert.equal(h.mail.length, 4);
});

test('the hourly budget admits 25 from a concurrent burst of unique addresses', async t => {
  const h = harness(t);
  const responses = await Promise.all(Array.from({ length: 40 }, (_, index) =>
    h.submit(`hour-${index}@example.invalid`, { ip: `192.0.2.${index + 1}` })));
  assert.equal(responses.filter(response => response.status === 202).length, 25);
  assert.equal(responses.filter(response => response.status === 429).length, 15);
  assert.equal(h.mail.length, 25);
  assert.equal(h.attempts().length, 25);
  assert.ok(responses.filter(response => response.status === 429)
    .every(response => response.headers.get('retry-after') === '3600'));
});

test('the daily budget stops at 100 after successive hourly windows', async t => {
  const h = harness(t);
  for (let hour = 0; hour < 4; hour++) {
    if (hour > 0) h.ageAttempts(3601);
    for (let index = 0; index < 25; index++) {
      await accepted(await h.submit(`day-${hour}-${index}@example.invalid`));
    }
  }
  assert.equal(h.mail.length, 100);
  h.ageAttempts(3601);
  assert.equal((await h.submit('day-overflow@example.invalid')).status, 429);
  assert.equal(h.mail.length, 100);
  h.ageAttempts(86_401);
  await accepted(await h.submit('day-overflow@example.invalid'));
  assert.equal(h.mail.length, 101);
});

for (const [label, provider, expectedOutcome, expectedCalls] of [
  ['permanent provider rejection', async () => new Response('private-address@example.invalid', { status: 400 }), 'failed', 1],
  ['provider server failure', async () => new Response('private-token-detail', { status: 500 }), 'unknown', 2],
  ['network failure', async () => { throw new Error('private-address@example.invalid'); }, 'unknown', 2],
  ['malformed successful provider body', async () => Response.json({ accepted: true }), 'unknown', 2],
]) {
  test(`${label} stays charged and does not send again during cooldown`, async t => {
    const h = harness(t);
    h.setProvider(provider);
    const result = await h.submit('failure@example.invalid');
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('retry-after'), '600');
    assert.equal(h.mail.length, expectedCalls);
    assert.equal(h.attempts()[0].outcome, expectedOutcome);
    assert.equal(h.attempts()[0].provider_id, null);
    await accepted(await h.resend('failure@example.invalid', { ip: '198.51.100.1' }));
    assert.equal(h.mail.length, expectedCalls);
    assert.equal(h.attempts().length, 1);
    assert.doesNotMatch(JSON.stringify(h.logs), /private-address|private-token-detail|failure@example.invalid/);
  });
}

test('provider retries reuse the exact body and key for one durable attempt', async t => {
  const h = harness(t);
  h.setProvider(async () => h.mail.length === 1
    ? new Response(null, { status: 500 }) : Response.json({ id: 'provider-confirmation-123' }));
  const result = await h.submit('retry@example.invalid');
  await accepted(result.clone());
  assert.equal(h.mail.length, 2);
  assert.equal(h.mail[0].body, h.mail[1].body);
  assert.equal(mailKey(h.mail[0]), mailKey(h.mail[1]));
  assert.equal(mailKey(h.mail[0]), `newsletter-confirmation/${result.headers.get('x-request-id')}`);
  const attempt = h.attempts()[0];
  assert.equal(attempt.outcome, 'accepted');
  assert.equal(attempt.provider_id, 'provider-confirmation-123');
  assert.equal(attempt.token_hash, await hashToken(confirmationToken(h.mail[0])));
  assert.notEqual(attempt.token_hash, confirmationToken(h.mail[0]));
});

test('failed and unknown sends consume both recipient and global budgets', async t => {
  const h = harness(t);
  h.setProvider(async () => new Response(null, { status: 400 }));
  for (let index = 0; index < 3; index++) {
    if (index) h.ageAttempts(601);
    assert.equal((await h.submit('charged@example.invalid')).status, 503);
  }
  h.ageAttempts(601);
  await accepted(await h.resend('charged@example.invalid'));
  assert.equal(h.mail.length, 3);
  h.setProvider(async () => new Response(null, { status: 500 }));
  for (let index = 0; index < 22; index++) {
    assert.equal((await h.submit(`charged-${index}@example.invalid`)).status, 503);
  }
  assert.equal(h.attempts().length, 25);
  assert.equal((await h.submit('charged-overflow@example.invalid')).status, 429);
  assert.equal(h.mail.length, 47, 'three terminal failures and 22 operations retried once');
});

for (const failureIndex of [0, 2, 3]) {
  test(`admission failure at statement ${failureIndex + 1} rolls back and sends no mail`, async t => {
    const h = harness(t);
    h.failBatchAt(failureIndex);
    assert.equal((await h.submit('ledger-failure@example.invalid')).status, 503);
    assert.equal(h.mail.length, 0);
    assert.equal(h.attempts().length, 0);
    assert.equal(h.row('ledger-failure@example.invalid'), undefined);
  });
}

test('an outcome-write failure retains the reservation and prevents another immediate send', async t => {
  const h = harness(t);
  h.failOutcomeWrite();
  await accepted(await h.submit('outcome-failure@example.invalid'));
  assert.equal(h.attempts()[0].outcome, 'reserved');
  await accepted(await h.resend('outcome-failure@example.invalid'));
  assert.equal(h.mail.length, 1);
  assert.equal(h.attempts().length, 1);
});

test('migration imports a pending token with its original expiry; a resend keeps it usable', async t => {
  const oldToken = 'a'.repeat(64);
  const oldHash = await hashToken(oldToken);
  const permanentOptOut = 'b'.repeat(64);
  const h = harness(t, sqlite => {
    sqlite.prepare(`INSERT INTO subscribers
      (id, email, status, confirm_token, confirm_token_expires_at, unsubscribe_token)
      VALUES ('legacy-pending', 'legacy@example.invalid', 'pending', ?, datetime('now', '+2 hours'), ?)`)
      .run(oldHash, permanentOptOut);
  });
  const legacy = h.attempts()[0];
  assert.equal(legacy.outcome, 'legacy');
  assert.equal(legacy.expires_at,
    h.sqlite.prepare('SELECT unixepoch(confirm_token_expires_at) AS expiry FROM subscribers').get().expiry);
  await accepted(await h.resend('legacy@example.invalid'));
  assert.equal(h.mail.length, 1);
  assert.equal(h.attempts().length, 2);
  assert.equal(h.row('legacy@example.invalid').unsubscribe_token, permanentOptOut);
  assert.equal((await h.confirm(oldToken)).status, 200);
  assert.equal(h.row('legacy@example.invalid').status, 'active');
  assert.ok(h.attempts().every(row => row.revoked === 1));
});

test('a token written by the old deployment after migration is preserved when replaced', async t => {
  const h = harness(t);
  const oldToken = 'c'.repeat(64);
  h.sqlite.prepare(`INSERT INTO subscribers
    (id, email, status, confirm_token, confirm_token_expires_at, unsubscribe_token)
    VALUES ('rolling-old', 'rolling@example.invalid', 'pending', ?, datetime('now', '+1 hour'), ?)`)
    .run(await hashToken(oldToken), 'd'.repeat(64));
  await accepted(await h.resend('rolling@example.invalid'));
  assert.equal(h.attempts().filter(row => row.outcome === 'legacy').length, 1);
  assert.equal((await h.confirm(oldToken)).status, 200);
  assert.equal(h.row('rolling@example.invalid').status, 'active');
});

test('GET previews confirmation; POST activates; old token cannot reactivate a later cycle', async t => {
  const h = harness(t);
  const email = 'lifecycle@example.invalid';
  await accepted(await h.submit(email));
  const oldToken = confirmationToken(h.mail[0]);
  const optOut = h.row(email).unsubscribe_token;
  const preview = await h.confirm(oldToken, 'GET');
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /method="post"/);
  assert.equal(h.row(email).status, 'pending');
  assert.equal((await h.confirm(oldToken)).status, 200);
  assert.equal(h.row(email).status, 'active');
  assert.equal(h.row(email).confirm_token, null);
  assert.equal((await h.confirm(oldToken)).status, 200, 'idempotent active-state explanation');
  assert.equal((await h.unsubscribe(optOut, { method: 'GET' })).status, 200);
  assert.equal(h.row(email).status, 'active');
  assert.equal((await h.unsubscribe(optOut)).status, 200);
  assert.equal(h.row(email).status, 'unsubscribed');
  assert.equal(h.row(email).suppression_reason, null);
  h.ageAttempts(601);
  await accepted(await h.submit(email));
  assert.equal(h.row(email).unsubscribe_token, optOut);
  assert.equal(h.row(email).status, 'pending');
  assert.equal((await h.confirm(oldToken)).status, 400);
  assert.equal(h.row(email).status, 'pending');
  assert.equal(h.attempts().at(-1).revoked, 0, 'failed replay must not revoke the new cycle');
  assert.equal((await h.confirm(confirmationToken(h.mail[1]))).status, 200);
  assert.equal(h.row(email).status, 'active');
  assert.equal((await h.unsubscribe(optOut)).status, 200, 'permanent opt-out survives resubscription');
  assert.equal(h.row(email).status, 'unsubscribed');
});

for (const [event, status, reason] of [
  ['email.bounced', 'bounced', 'bounce'],
  ['email.complained', 'unsubscribed', 'complaint'],
]) {
  test(`${event} suppresses confirmation and preserves the retained opt-out token`, async t => {
    const h = harness(t);
    const email = 'suppressed@example.invalid';
    await accepted(await h.submit(email));
    const token = confirmationToken(h.mail[0]);
    const optOut = h.row(email).unsubscribe_token;
    assert.equal((await h.webhook(event, email)).status, 200);
    assert.equal(h.row(email).status, status);
    assert.equal(h.row(email).suppression_reason, reason);
    assert.equal(h.attempts()[0].revoked, 1);
    assert.equal((await h.confirm(token)).status, 400);
    h.ageAttempts(601);
    await accepted(await h.submit(email));
    await accepted(await h.resend(email));
    assert.equal(h.mail.length, 1);
    assert.equal((await h.unsubscribe(optOut, { block: true })).status, 200);
    assert.equal(h.row(email).suppression_reason, reason);
    assert.equal(h.row(email).unsubscribe_token, optOut);
  });
}

test('confirmation opt-out previews safely and blocks later public requests', async t => {
  const h = harness(t);
  const email = 'blocked@example.invalid';
  await accepted(await h.submit(email));
  const token = confirmationToken(h.mail[0]);
  const optOut = h.row(email).unsubscribe_token;
  assert.match(JSON.parse(h.mail[0].body).text, new RegExp(`/api/unsubscribe/${optOut}\\?confirmations=off`));
  assert.equal((await h.unsubscribe(optOut, { method: 'GET', block: true })).status, 200);
  assert.equal(h.row(email).suppression_reason, null);
  assert.equal((await h.unsubscribe(optOut, { block: true, view: true })).status, 200);
  assert.equal(h.row(email).suppression_reason, 'confirmation-opt-out');
  assert.equal(h.row(email).status, 'unsubscribed');
  assert.equal((await h.confirm(token)).status, 400);
  h.ageAttempts(86_401);
  await accepted(await h.submit(email));
  await accepted(await h.resend(email));
  assert.equal(h.mail.length, 1);
  assert.equal(h.row(email).unsubscribe_token, optOut);
});

test('migration keeps ambiguous old opt-outs and bounces suppressed', async t => {
  const h = harness(t, sqlite => {
    for (const status of ['unsubscribed', 'bounced']) {
      sqlite.prepare('INSERT INTO subscribers (id, email, status, unsubscribe_token) VALUES (?, ?, ?, ?)')
        .run(status, `${status}@example.invalid`, status, 'e'.repeat(64));
    }
  });
  assert.equal(h.row('unsubscribed@example.invalid').suppression_reason, 'legacy-inactive');
  assert.equal(h.row('bounced@example.invalid').suppression_reason, 'bounce');
  for (const email of ['unsubscribed@example.invalid', 'bounced@example.invalid']) {
    await accepted(await h.submit(email));
  }
  assert.equal(h.mail.length, 0);
  assert.equal(h.attempts().length, 0);
});

test('resend does not create a new subscriber, and active signup does not send again', async t => {
  const h = harness(t);
  await accepted(await h.resend('absent@example.invalid'));
  assert.equal(h.row('absent@example.invalid'), undefined);
  await accepted(await h.submit('active@example.invalid'));
  await h.confirm(confirmationToken(h.mail[0]));
  await accepted(await h.submit('active@example.invalid'));
  await accepted(await h.resend('active@example.invalid'));
  assert.equal(h.mail.length, 1);
});

for (const [label, body, status] of [
  ['invalid secret', { success: false, 'error-codes': ['invalid-input-secret'] }, 503],
  ['invalid token', { success: false, 'error-codes': ['invalid-input-response'] }, 400],
  ['wrong hostname', { success: true, hostname: 'elsewhere.invalid' }, 400],
  ['wrong action', { success: true, hostname: 'gkoreli.com', action: 'login' }, 400],
  ['malformed result', { result: true }, 503],
]) {
  test(`${label} rejects both public send routes without a reservation`, async t => {
    const h = harness(t);
    h.setVerifier(async () => Response.json(body));
    assert.equal((await h.submit('verify@example.invalid')).status, status);
    assert.equal((await h.resend('verify@example.invalid')).status, status);
    assert.equal(h.mail.length, 0);
    assert.equal(h.attempts().length, 0);
  });
}

test('missing required bindings and native limiter rejection cannot send mail', async t => {
  const h = harness(t);
  h.denyLimiter();
  assert.equal((await h.submit('limited@example.invalid')).status, 429);
  assert.equal(h.verification.length, 0);
  for (const key of ['RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'SUBSCRIBE_RATE_LIMITER']) {
    const original = h.env[key];
    delete h.env[key];
    assert.equal((await h.submit('limited@example.invalid')).status, 503);
    h.env[key] = original;
  }
  assert.equal(h.mail.length, 0);
  assert.equal(h.attempts().length, 0);
});

test('invalid body, missing token, foreign Origin, and oversized body stop before admission', async t => {
  const h = harness(t);
  assert.equal((await h.submit('bad')).status, 400);
  assert.equal((await h.submit('valid@example.invalid', { body: { turnstile: '' } })).status, 400);
  assert.equal((await h.submit('valid@example.invalid', { headers: { origin: 'https://elsewhere.invalid' } })).status, 403);
  assert.equal((await h.submit('valid@example.invalid', { rawBody: 'x'.repeat(4097) })).status, 400);
  assert.equal(h.mail.length, 0);
  assert.equal(h.attempts().length, 0);
});

test('unknown and expired confirmation links never claim an active subscription', async t => {
  const h = harness(t);
  const unknown = await h.confirm('f'.repeat(64));
  assert.equal(unknown.status, 400);
  assert.doesNotMatch(await unknown.text(), /subscription is active/);
  await accepted(await h.submit('expired@example.invalid'));
  const token = confirmationToken(h.mail[0]);
  h.sqlite.exec("UPDATE confirmation_attempts SET expires_at = unixepoch() - 1");
  h.sqlite.exec("UPDATE subscribers SET confirm_token_expires_at = datetime('now', '-1 second')");
  assert.equal((await h.confirm(token, 'GET')).status, 400);
  assert.equal((await h.confirm(token)).status, 400);
  assert.equal(h.row('expired@example.invalid').status, 'pending');
});

test('verifier network and HTTP failures fail closed before admission on both routes', async t => {
  const h = harness(t);
  for (const response of [
    async () => { throw new Error('private verifier network detail'); },
    async () => Response.json({ success: true, hostname: 'gkoreli.com' }, { status: 500 }),
  ]) {
    h.setVerifier(response);
    assert.equal((await h.submit('verifier-network@example.invalid')).status, 503);
    assert.equal((await h.resend('verifier-network@example.invalid')).status, 503);
  }
  assert.equal(h.mail.length, 0);
  assert.equal(h.attempts().length, 0);
  assert.doesNotMatch(JSON.stringify(h.logs), /private verifier network detail/);
});

test('cached clients without a widget action remain compatible with hostname verification', async t => {
  const h = harness(t);
  for (const action of [undefined, '']) {
    h.setVerifier(async () => Response.json({ success: true, hostname: 'gkoreli.com', action }));
    await accepted(await h.submit(`cached-${String(action)}@example.invalid`));
  }
  assert.equal(h.mail.length, 2);
});

test('signed webhooks normalize every valid current and legacy recipient and deduplicate', async t => {
  const h = harness(t);
  for (const name of ['first', 'second', 'third']) await accepted(await h.submit(`${name}@example.invalid`));
  const result = await h.signedWebhook({
    type: 'email.complained',
    data: {
      to: ['malformed', null, 123, ' FIRST@EXAMPLE.INVALID ', 'second@example.invalid'],
      email: { to: ['first@example.invalid', 'third@example.invalid'] },
    },
  });
  assert.equal(result.status, 200);
  for (const name of ['first', 'second', 'third']) {
    assert.equal(h.row(`${name}@example.invalid`).suppression_reason, 'complaint');
  }
  assert.ok(h.attempts().every(row => row.revoked === 1));
  const webhookLog = h.logs.find(entry => entry[0] === '[newsletter:webhook]');
  assert.deepEqual(webhookLog?.[1], { event: 'email.complained', recipients: 3 });
  assert.doesNotMatch(JSON.stringify(h.logs), /first@example.invalid|second@example.invalid|third@example.invalid/);
});

test('signed malformed and unknown webhook payloads cannot change subscriber state', async t => {
  const h = harness(t);
  await accepted(await h.submit('webhook-shape@example.invalid'));
  for (const payload of [null, [], {}, { type: 'email.delivered' }, { type: 'email.bounced', data: [] }]) {
    assert.equal((await h.signedWebhook(payload)).status, 200);
  }
  assert.equal((await h.signedWebhook(null, { rawBody: '{' })).status, 400);
  assert.equal(h.row('webhook-shape@example.invalid').status, 'pending');
  assert.equal(h.attempts()[0].revoked, 0);
});

test('invalid webhook signature or malformed and stale timestamps cause no suppression', async t => {
  const h = harness(t);
  const email = 'webhook-auth@example.invalid';
  await accepted(await h.submit(email));
  const payload = { type: 'email.bounced', data: { to: [email] } };
  const now = Math.floor(Date.now() / 1000);
  for (const options of [
    { signature: 'v1,not-a-valid-signature' },
    { timestamp: `${now}abc` },
    { timestamp: `${now}.5` },
    { timestamp: String(now - 600) },
  ]) {
    assert.equal((await h.signedWebhook(payload, options)).status, 401);
  }
  assert.equal(h.row(email).status, 'pending');
  assert.equal(h.attempts()[0].revoked, 0);
});

test('webhook payload size is enforced without Content-Length', async t => {
  const h = harness(t);
  const email = 'webhook-size@example.invalid';
  await accepted(await h.submit(email));
  const payload = { type: 'email.bounced', data: { to: [email] }, padding: 'x'.repeat(64 * 1024) };
  assert.equal((await h.signedWebhook(payload)).status, 413);
  assert.equal(h.webhookRequests.at(-1).headers.has('Content-Length'), false);
  assert.equal(h.row(email).status, 'pending');
  assert.equal(h.attempts()[0].revoked, 0);
});

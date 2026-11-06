import assert from 'node:assert/strict';
import { setTimeout as wait } from 'node:timers/promises';
import test from 'node:test';
import { handleSend } from '../../newsletter/src/send.ts';
import { campaignHarness } from './fixtures/campaign-harness.mjs';
import { admitCampaign, completeCampaign } from '../../newsletter/src/campaign-store.ts';

test('one durable campaign admission precedes concurrent provider effects', async t => {
  const h = campaignHarness(t, handleSend);
  const entered = Promise.withResolvers();
  const releases = [];
  h.setProvider(async (_url, init) => {
    entered.resolve();
    const ready = Promise.withResolvers();
    releases.push(() => ready.resolve(Response.json({ data: JSON.parse(init.body).map(() => ({ id: crypto.randomUUID() })) })));
    return ready.promise;
  });
  const first = h.send();
  await entered.promise;
  let secondDone = false;
  const second = h.send().then(response => { secondDone = true; return response; });
  try {
    for (let attempt = 0; attempt < 200 && !secondDone && h.mail.length < 2; attempt++) await wait(5);
    assert.equal(h.mail.length, 1);
    assert.equal((await second).status, 409);
    assert.equal(h.row().state, 'reserved');
    assert.equal(h.row().accepted_count, null);
  } finally { for (const release of releases) release(); }
  assert.equal((await first).status, 200);
  assert.equal(h.row().state, 'completed');
  assert.equal(h.row().accepted_count, 1);
  assert.equal(h.deliveryCount(), 1);
  assert.match(new Headers(h.mail[0].headers).get('Idempotency-Key'), /^newsletter-campaign\/[0-9a-f-]{36}\/0$/);
});

test('lost provider response remains charged and cannot authorize a second execution', async t => {
  const h = campaignHarness(t, handleSend);
  h.setProvider(async () => { throw new TypeError('private synthetic lost response'); });
  const response = await h.send();
  assert.equal(response.status, 503);
  const result = await response.json();
  assert.equal(result.unknown, 1);
  assert.equal(result.failed, 0);
  assert.equal(h.row().state, 'interrupted');
  assert.equal(h.row().interruption_reason, 'delivery-unconfirmed');
  assert.equal(h.deliveryCount(), 0, 'unknown delivery is not recorded as a definite failed recipient');
  assert.equal((await h.send()).status, 409);
  assert.equal(h.mail.length, 1);
});

test('accepted sending followed by a delivery-log failure cannot be replayed', async t => {
  const h = campaignHarness(t, handleSend);
  h.failDeliveryLog();
  const response = await h.send();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).sent, 1);
  assert.equal(h.row().accepted_count, 1);
  assert.equal(h.row().interruption_reason, 'delivery-log-unconfirmed');
  assert.equal((await h.send()).status, 409);
  assert.equal(h.mail.length, 1);
  assert.equal(h.deliveryCount(), 0);
});

test('an unrecorded completion leaves the durable reservation charged', async t => {
  const h = campaignHarness(t, handleSend);
  h.failCompletion();
  const response = await h.send();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).receipt_confirmed, false);
  assert.equal(h.row().state, 'reserved');
  assert.equal(h.row().accepted_count, null);
  assert.equal((await h.send()).status, 409);
  assert.equal(h.mail.length, 1);
});

test('historical recipient logs still block campaign admission before provider calls', async t => {
  const h = campaignHarness(t, handleSend);
  h.sqlite.prepare(`INSERT INTO delivery_logs (id,campaign_id,sub_id,email,status)
    VALUES ('historical','campaign-one','subscriber-0','recipient-0@example.invalid','sent')`).run();
  assert.equal((await h.send()).status, 409);
  assert.equal(h.row(), undefined);
  assert.equal(h.mail.length, 0);
});

test('an empty admitted campaign keeps its identity when the audience later changes', async t => {
  const h = campaignHarness(t, handleSend, { recipients: 0 });
  assert.equal((await h.send()).status, 200);
  assert.equal(h.row().state, 'completed');
  assert.equal(h.row().recipient_count, 0);
  h.sqlite.prepare(`INSERT INTO subscribers (id,email,status,unsubscribe_token) VALUES ('later','later@example.invalid','active','later-token')`).run();
  assert.equal((await h.send()).status, 409);
  assert.equal(h.mail.length, 0);
});

test('a campaign identity cannot be reassigned to changed content', async t => {
  const h = campaignHarness(t, handleSend);
  assert.equal((await h.send()).status, 200);
  const conflict = await h.send({ ...h.body, subject: 'Changed private content' });
  assert.equal(conflict.status, 409);
  assert.match((await conflict.json()).error, /different content/);
  assert.equal(h.mail.length, 1);
});

test('omitting the optional campaign ID still creates separate operations', async t => {
  const h = campaignHarness(t, handleSend);
  const { campaign_id, ...payload } = h.body;
  const first = await h.send(payload), second = await h.send(payload);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  const firstId = (await first.json()).campaign_id, secondId = (await second.json()).campaign_id;
  assert.match(firstId, /^[0-9a-f]{64}$/);
  assert.notEqual(firstId, secondId);
  assert.equal(h.mail.length, 2, 'No shared intent is inferred when callers omit identity');
});

test('durable campaign identity remains charged beyond the provider key retention window', async t => {
  const h = campaignHarness(t, handleSend);
  assert.equal((await h.send()).status, 200);
  h.sqlite.prepare("UPDATE newsletter_campaign_runs SET created_at=datetime('now','-2 days')").run();
  assert.equal((await h.send()).status, 409);
  assert.equal(h.mail.length, 1);
});

test('unknown first batch stops later batches and preserves not-attempted count', async t => {
  const h = campaignHarness(t, handleSend, { recipients: 101 });
  h.setProvider(async () => Response.json({ data: [] }));
  const response = await h.send();
  assert.equal(response.status, 503);
  const result = await response.json();
  assert.equal(result.unknown, 100);
  assert.equal(result.not_attempted, 1);
  assert.equal(result.failed, 0);
  assert.equal(h.row().not_attempted_count, 1);
  assert.equal(h.mail.length, 1);
});

test('authentication, configuration and invalid command gates run before admission', async t => {
  const h = campaignHarness(t, handleSend);
  assert.equal((await h.send(h.body, { headers: { authorization: 'Bearer wrong' } })).status, 401);
  for (const payload of [null, [], { ...h.body, campaign_id: 42 }, { ...h.body, campaign_id: '../unsafe' },
    { ...h.body, campaign_id: 'x'.repeat(129) }, { ...h.body, subject: 'line\nbreak' }]) {
    assert.equal((await h.send(payload)).status, 400);
  }
  h.env.RESEND_API_KEY = '';
  assert.equal((await h.send()).status, 503);
  assert.equal(h.row(), undefined);
  assert.equal(h.mail.length, 0);
});

test('missing additive admission schema fails closed before any provider effect', async t => {
  const h = campaignHarness(t, handleSend);
  h.sqlite.exec('DROP TABLE newsletter_campaign_runs');
  assert.equal((await h.send()).status, 503);
  assert.equal(h.mail.length, 0);
});

test('lost admission acknowledgment can charge an ID without a send, and does not authorize replay', async t => {
  const h = campaignHarness(t, handleSend);
  h.loseAdmissionAck();
  assert.equal((await h.send()).status, 503);
  assert.equal(h.row().state, 'reserved');
  assert.equal(h.row().accepted_count, null);
  assert.equal(h.mail.length, 0);
  assert.equal((await h.send()).status, 409);
  assert.equal(h.mail.length, 0);
});

test('bounded command ingestion and closed observations retain no message/recipient/credential', async t => {
  const h = campaignHarness(t, handleSend);
  assert.equal((await h.send(h.body, { rawBody: ' '.repeat(256 * 1024 + 1) })).status, 413);
  assert.equal(h.row(), undefined);
  assert.equal((await h.send()).status, 200);
  assert.doesNotMatch(JSON.stringify(h.logs), /Private subject|Private content|Private text|recipient-0@|unsubscribe-0|synthetic-admin|synthetic-provider-key|campaign-one/);
  assert.ok(h.logs.every(([, event]) => /^[0-9a-f-]{36}$/.test(event.requestId)));
});

test('definite provider rejection is recorded without pretending delivery was attempted twice', async t => {
  const h = campaignHarness(t, handleSend);
  h.setProvider(async () => new Response('private provider error payload', { status: 400 }));
  const response = await h.send();
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.failed, 1);
  assert.equal(result.unknown, 0);
  assert.equal(h.row().state, 'completed');
  assert.equal(h.sqlite.prepare('SELECT error FROM delivery_logs').get().error, 'provider_rejected');
  assert.equal((await h.send()).status, 409);
  assert.equal(h.mail.length, 1);
  assert.doesNotMatch(JSON.stringify(h.logs), /private provider error/);
});

test('SQL admission and completion enforce non-null identity and ownership', async t => {
  const h = campaignHarness(t, handleSend);
  assert.throws(() => h.sqlite.prepare(`INSERT INTO newsletter_campaign_runs
    (campaign_id,request_id,payload_hash,recipient_count) VALUES (NULL,'wrong',?,0)`).run('a'.repeat(64)));
  const input = { campaignId: 'owned-campaign', requestId: crypto.randomUUID(), payloadHash: 'a'.repeat(64), recipientCount: 1 };
  assert.deepEqual(await admitCampaign(h.env.DB, input), { admitted: true });
  await assert.rejects(completeCampaign(h.env.DB, { ...input, requestId: crypto.randomUUID() },
    { accepted: 1, failed: 0, unknown: 0, notAttempted: 0, total: 1 }, null), /not recorded/);
  assert.equal(h.row('owned-campaign').state, 'reserved');
  await assert.rejects(completeCampaign(h.env.DB, input,
    { accepted: 2, failed: 0, unknown: 0, notAttempted: 0, total: 1 }, null));
  assert.equal(h.row('owned-campaign').state, 'reserved');
});

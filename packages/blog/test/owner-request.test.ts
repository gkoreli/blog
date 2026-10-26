import assert from 'node:assert/strict';
import test from 'node:test';
import { markOwner } from '../src/client/owner-request.js';

test('owner marking sends the credential only in the same-origin authorization header', async () => {
  const day = await markOwner('fixture-owner-credential', async (url, init) => {
    assert.equal(url, '/api/owner');
    assert.equal(init?.method, 'POST');
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer fixture-owner-credential');
    assert.equal(init?.body, undefined);
    assert.equal(init?.credentials, 'omit');
    assert.equal(init?.redirect, 'error');
    assert.equal(init?.cache, 'no-store');
    return Response.json({ marked: true, utcDate: '2026-10-26' });
  });
  assert.equal(day, '2026-10-26');
});

test('failed or malformed owner replies never claim a successful mark or expose a credential', async () => {
  for (const response of [new Response(null, { status: 401 }), new Response(null, { status: 500 }), Response.json({ marked: false, utcDate: '2026-10-26' }), Response.json({ marked: true, utcDate: 'unexpected' })]) {
    await assert.rejects(markOwner('private-fixture-value', async () => response), error =>
      error instanceof Error && !error.message.includes('private-fixture-value'));
  }
});

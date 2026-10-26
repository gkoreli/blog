import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryStats } from '../.test-dist/stats.js';

const now = new Date('2026-10-26T12:00:00Z');

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(sql) {
      return { bind(...values) { return { execute() { return { results: sqlite.prepare(sql).all(...values) }; } }; } };
    },
    async batch(statements) { return statements.map(statement => statement.execute()); },
  };
  let id = 0;
  function add(origin, options = {}) {
    const client = options.client ?? (++id).toString(16).padStart(32, '0');
    sqlite.prepare(`INSERT INTO page_observations
      (path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,signature_status,signature_agent,observed_at)
      VALUES('/article',?,'bot','desktop',0,?,?,?,?, '2026-10-26 02:00:00')`)
      .run(client, options.kind ?? 'signed-agent', options.reason ?? origin,
        options.status ?? 'verified', origin);
  }
  return { sqlite, db, add };
}

test('public signer names and signed reasons hide arbitrary origins while retaining exact counts and private history', async () => {
  const { sqlite, db, add } = fixture();
  const shared = 'f'.repeat(32);
  add('https://private-reader-one.example', { client: shared });
  add('https://private-reader-two.example', { client: shared });
  add('https://crawler.exa.ai', { client: 'e'.repeat(32) });
  add('https://crawler.exa.ai', { client: 'e'.repeat(32) });
  add('https://ahrefs.com', { kind: 'seo-crawler', reason: 'AhrefsBot' });
  add('https://assistbot.duckduckgo.com');
  add('https://crawler.exa.ai', { status: 'unverified', kind: 'other-bot', reason: 'generic-bot; signature:signature-invalid' });
  add(null, { reason: 'https://private-missing-directory.example' });
  const before = sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all();
  for (const range of ['7d', 'all']) {
    const stats = await queryStats(db, { range, traffic: 'all' }, now);
    assert.equal(stats.totals.views, 8);
    assert.deepEqual(stats.bySigner, [
      { signatureAgent: 'Exa', views: 2 }, { signatureAgent: 'Other', views: 2 },
      { signatureAgent: 'Ahrefs', views: 1 }, { signatureAgent: 'DuckDuckGo', views: 1 },
    ]);
    assert.deepEqual(stats.byKind.find(row => row.kind === 'signed-agent' && row.reason === 'Other'),
      { kind: 'signed-agent', reason: 'Other', views: 3, dailyClients: 2 });
    assert.deepEqual(stats.byKind.find(row => row.kind === 'signed-agent' && row.reason === 'Exa'),
      { kind: 'signed-agent', reason: 'Exa', views: 2, dailyClients: 1 });
    assert.ok(stats.byKind.some(row => row.kind === 'seo-crawler' && row.reason === 'AhrefsBot'));
    for (const canary of ['private-reader-one', 'private-reader-two', 'private-missing-directory', 'https://crawler.exa.ai', 'https://ahrefs.com', 'https://assistbot.duckduckgo.com']) {
      assert.equal(JSON.stringify(stats).includes(canary), false, canary);
    }
    assert.equal(stats.byKind.reduce((sum, row) => sum + row.views, 0), stats.totals.views);
  }
  assert.deepEqual(sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all(), before);
});

test('suffixes, subdomains, schemes, ports and malformed historical signer strings cannot acquire a public service name', async () => {
  const { db, add } = fixture();
  const origins = [
    'https://crawler.exa.ai.private.example', 'https://private.example/crawler.exa.ai',
    'https://crawler.exa.ai:444', 'http://crawler.exa.ai', 'https://unreviewed.exa.ai',
    'https://crawler.exa.ai@private.example', 'https://AHREFS.com', 'private contact@example.invalid',
  ];
  for (const origin of origins) add(origin);
  const stats = await queryStats(db, { range: '7d', traffic: 'all' }, now);
  assert.deepEqual(stats.bySigner, [{ signatureAgent: 'Other', views: origins.length }]);
  assert.deepEqual(stats.byKind, [{ kind: 'signed-agent', reason: 'Other', views: origins.length, dailyClients: origins.length }]);
  for (const origin of origins) assert.equal(JSON.stringify(stats).includes(origin), false);
});

test('report decoding fails closed if either signer output channel contains an unreviewed name', async () => {
  for (const section of ['signer', 'kind']) {
    const { db } = fixture();
    const malformed = {
      prepare: db.prepare,
      async batch(statements) {
        const results = await db.batch(statements);
        for (const row of results[0].results) {
          if (row.section !== section) continue;
          row.payload = JSON.stringify([{ key1: section === 'signer' ? 'https://private.example' : 'signed-agent', key2: 'https://private.example', views: 1, dailyClients: 1 }]);
        }
        return results;
      },
    };
    await assert.rejects(queryStats(malformed, { range: '7d', traffic: 'all' }, now), /Malformed statistics report/);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createReferralAssessor, canonicalRuleHost } from '../.test-dist/referral-policy.js';
import { referralAbusePredicate } from '../.test-dist/referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from '../.test-dist/referral-policy.generated.js';

const start = '2026-09-04';
const end = '2026-09-06';
const local = (id, host, scope, action) => ({ id, host, scope, action, reason: 'fixture', evidence: 'fixture' });

test('source artifact bytes and generated policy have verifiable commitments', () => {
  const source = ACTIVE_REFERRAL_POLICY.source;
  const dir = new URL(`../data/referrer-sources/matomo/${source.revision}/`, import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));
  for (const [name, hash] of Object.entries(manifest.files)) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(name, dir))).digest('hex'), hash);
  }
  assert.equal(source.entryCount, 2348);
  assert.equal(source.sha256, manifest.files['spammers.txt']);
  const raw = readFileSync(new URL('spammers.txt', dir), 'utf8');
  const domains = raw.split(/\r?\n/).filter(Boolean).map(canonicalRuleHost).sort();
  assert.deepEqual(ACTIVE_REFERRAL_POLICY.upstreamHosts, domains);
  const { sha256, ...definition } = ACTIVE_REFERRAL_POLICY;
  assert.equal(createHash('sha256').update(JSON.stringify(definition)).digest('hex'), sha256);
  assert.equal(domains.includes('uniuit.com'), false);
});

test('domain decisions distinguish source matching, overrides, visibility and unknown identity', () => {
  const policy = { ...ACTIVE_REFERRAL_POLICY, upstreamHosts: ['spam.example', 'bad.tenant.example'], localRules: [
    local('exception', 'reader.spam.example', 'subtree', 'include'),
    local('excluded-child', 'bad.reader.spam.example', 'subtree', 'exclude'),
    local('exact-exception', 'exact.spam.example', 'host', 'include'),
    local('local-abuse', 'local.example', 'subtree', 'exclude'),
  ], publicHosts: ['reader.spam.example'] };
  const assess = createReferralAssessor(policy);
  assert.equal(assess('SPAM.EXAMPLE.').matchedRule.source, 'matomo');
  assert.equal(assess('reader.spam.example').visibility, 'named');
  assert.equal(assess('sub.reader.spam.example').action, 'include');
  assert.equal(assess('sub.reader.spam.example').visibility, 'other');
  assert.equal(assess('bad.reader.spam.example').action, 'exclude');
  assert.equal(assess('exact.spam.example').action, 'include');
  assert.equal(assess('sub.exact.spam.example').action, 'exclude');
  assert.equal(assess('tenant.example').action, 'include');
  assert.equal(assess('bad.tenant.example').action, 'exclude');
  assert.equal(assess('local.example').matchedRule.source, 'local');
  assert.equal(assess('notspam.example').matchedRule, null);
  assert.equal(assess(null).visibility, 'absent');
  assert.equal(assess('unknown.example').visibility, 'other');
});

test('TypeScript and SQLite agree for the complete upstream list, variants, overrides and malformed history', () => {
  const policy = { ...ACTIVE_REFERRAL_POLICY, localRules: [...ACTIVE_REFERRAL_POLICY.localRules,
    local('include', 'reader.semalt.com', 'subtree', 'include'),
    local('child', 'bad.reader.semalt.com', 'subtree', 'exclude'),
    local('exact', 'semalt.com', 'host', 'include'),
  ] };
  const hosts = [null, '', 'uniuit.com', 'WWW.UNIUIT.COM.', 'uniuit.com.example', 'notuniuit.com',
    'reader.semalt.com', 'sub.reader.semalt.com', 'bad.reader.semalt.com', 'semalt.com',
    'www.semalt.com', 'good.example/path/semalt.com', 'semalt.com@innocent.example',
    'x'.repeat(260) + '.uniuit.com', 'a..uniuit.com', 'Kambasoft.com', 'Kagi.com',
    ...policy.upstreamHosts.flatMap(host => [host, 'sub.' + host, host.toUpperCase() + '.', host + '.example']),
  ];
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE page_observations (id INTEGER PRIMARY KEY, referrer_host TEXT, observed_at TEXT)');
  const insert = db.prepare('INSERT INTO page_observations (id, referrer_host, observed_at) VALUES (?, ?, ?)');
  for (const [id, host] of hosts.entries()) insert.run(id, host, '2026-09-05 12:00:00');
  const before = db.prepare('SELECT * FROM page_observations').all();
  const predicate = referralAbusePredicate(policy, start, end);
  assert.equal(predicate.values.length, 3);
  assert.ok(Buffer.byteLength(predicate.sql) < 100000);
  assert.ok(Buffer.byteLength(predicate.values[0]) < 2000000);
  const query = `SELECT id, ${predicate.sql} AS excluded FROM page_observations ORDER BY id`;
  const rows = db.prepare(query).all(...predicate.values);
  const assess = createReferralAssessor(policy);
  for (const row of rows) assert.equal(Boolean(row.excluded), assess(hosts[row.id]).action === 'exclude', String(hosts[row.id]));
  assert.deepEqual(db.prepare('SELECT * FROM page_observations').all(), before);
});

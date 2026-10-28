import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryStats } from '../.test-dist/stats.js';

test('verification aggregates preserve unknown history, independent native outcomes, coverage overlap and every exclusion', async () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const db = { prepare(sql) { return { bind(...values) { return { execute() { return { results: sqlite.prepare(sql).all(...values) }; } }; } }; }, async batch(statements) { return statements.map(s => s.execute()); } };
  const coverage = { version: '2026-10-27.1', headerForm: 'dictionary', covered: { authority: true, targetUri: false, method: false, path: false, query: false, userAgent: false, contentDigest: false }, otherComponentCount: 0, validitySeconds: 300, ageSeconds: 0, replayPolicy: 'expiry-only' };
  const base = { version: '2026-10-27.1', source: 'local-webbotauth', verifierProfile: 'fixture', localStatus: 'verified', localReason: null, coverage, native: { verifiedBot: null, signedAgent: null } };
  const insert = sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_evidence,referrer_host) VALUES(?,?,'browser','desktop',?,'browser','fixture',?,?,?)`);
  let next = 0;
  const add = (evidence, options = {}) => insert.run(options.path ?? '/article', (++next).toString(16).padStart(32,'0'), options.owner ?? 0, options.at ?? '2026-10-27 01:00:00', evidence === null ? null : JSON.stringify(evidence), options.referrer ?? null);
  add(null);
  add(base);
  add({ ...base, coverage: { ...coverage, covered: { ...coverage.covered, method: true, path: true, userAgent: true } }, native: { verifiedBot: false, signedAgent: false } });
  add({ ...base, localStatus: 'absent', coverage: null, native: { verifiedBot: true, signedAgent: true } });
  add({ ...base, localStatus: 'unverified', localReason: 'key-not-found', coverage: null });
  add(base, { owner: 1 }); add(base, { referrer: 'traffic2cash.xyz' }); add(base, { at: '2026-10-28 01:00:00' });
  const report = await queryStats(db, { range: '7d', traffic: 'all' }, new Date('2026-10-27T02:00:00Z'));
  assert.equal(report.totals.views, 5);
  assert.deepEqual(report.verification, { localInvalidViews: 0, localUnsupportedViews: 0, localUnavailableViews: 0, localPolicyRejectedViews: 0, localNotApplicableViews: 0, localIndeterminateViews: 0, unverifiedOutcomeNotRecordedViews: 1, vendorDocumentedViews: 0, vendorMatchingOriginViews: 0, vendorDifferentOriginViews: 0, vendorOriginConflictViews: 0, vendorConflictWithMatchingOriginViews: 0, vendorNotVerifiedViews: 0, vendorUnmappedDeclarationViews: 0, vendorUserAgentBoundViews: 0, vendorCheckNotRecordedViews: 5, recordedViews: 4, notRecordedViews: 1, localVerifiedViews: 2, localUnverifiedViews: 1, localAbsentViews: 1, testVerdictViews: 0, selectionRecordedViews: 0, selectionNotRecordedVerifiedViews: 2, selectionUnrecognizedVerifiedViews: 0, multipleTaggedCandidateViews: 0, unassessedCandidateViews: 0, coverageRecordedViews: 2, userAgentBoundViews: 1, resourceBoundViews: 1, methodBoundViews: 1, authorityOnlyViews: 1, nativeAvailableViews: 2, nativeVerifiedBotViews: 1, nativeSignedAgentViews: 1, localVerifiedNativeNotVerifiedViews: 1 });
  const empty = await queryStats(db, { range: '7d', traffic: 'all', path: '/missing' }, new Date('2026-10-27T02:00:00Z'));
  assert.ok(Object.values(empty.verification).every(value => value === 0));
  assert.equal(report.verification.recordedViews + report.verification.notRecordedViews, report.totals.views);
  add({ ...base, source: 'test-injected', coverage: null });
  const withFixture = await queryStats(db, { range: '7d', traffic: 'all' }, new Date('2026-10-27T02:00:00Z'));
  assert.equal(withFixture.verification.testVerdictViews, 1);
  assert.equal(withFixture.verification.localVerifiedViews, 2);
});

test('signature evidence migration preserves old rows and enforces the stored JSON budget', () => {
  const sqlite = new DatabaseSync(':memory:');
  const schema = readFileSync(new URL('../schema.sql', import.meta.url),'utf8').split('\n').filter(line => !line.trim().startsWith('signature_evidence ')).join('\n');
  sqlite.exec(schema);
  sqlite.exec("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner) VALUES('/old','00000000000000000000000000000000','browser','desktop',0)");
  sqlite.exec(readFileSync(new URL('../migrations/0012_signature_evidence.sql', import.meta.url),'utf8'));
  assert.equal(sqlite.prepare('SELECT signature_evidence FROM page_observations').get().signature_evidence,null);
  assert.throws(() => sqlite.prepare('UPDATE page_observations SET signature_evidence=?').run('not-json'));
  assert.throws(() => sqlite.prepare('UPDATE page_observations SET signature_evidence=?').run(JSON.stringify({ value:'x'.repeat(2049) })));
});

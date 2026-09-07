import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/src/referral-policy.generated.ts';
import { canonicalRuleHost } from '../../analytics/src/referral-policy.ts';
import {
  compileReferralPolicy, parseSpammerHosts, policyDifference, policySpecSchema,
  renderPolicyModule, reportEvidence, sha256, sourceManifestSchema, verifyPolicyCommitment,
  referralEvidenceSchema,
} from '../scripts/referral-policy.models.ts';

const analytics = new URL('../../analytics/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, analytics), 'utf8');
const active = ACTIVE_REFERRAL_POLICY;
const sourceDir = `data/referrer-sources/matomo/${active.source.revision}/`;
const source = sourceManifestSchema.parse(JSON.parse(read(sourceDir + 'manifest.json')));
const raw = read(sourceDir + 'spammers.txt');
const spec = policySpecSchema.parse(JSON.parse(read(`policies/${active.version}.json`)));

test('offline policy compilation reproduces the committed module and source without fetching', () => {
  const policy = compileReferralPolicy(spec, source, raw);
  assert.deepEqual(policy, active);
  assert.equal(renderPolicyModule(policy), read('src/referral-policy.generated.ts'));
  verifyPolicyCommitment(policy, read(`policies/${policy.version}.sha256`).trim());
  assert.equal(compileReferralPolicy({ ...spec, publicHosts: [...spec.publicHosts].reverse() }, source, raw).sha256, policy.sha256);
});

test('source/config boundaries reject malformed entries, duplicates and tampering', () => {
  for (const host of ['https://spam.example', '*.spam.example', 'a..example', 'example.com/path', 'example.com?x',
    'example.com#x', 'example.com:80', 'example.com@other.com', ' example.com', 'example.com ',
    'exa%mple.com', '-bad.example', 'bad-.example', 'com', 'a'.repeat(64) + '.example']) {
    assert.throws(() => canonicalRuleHost(host), host);
  }
  assert.equal(canonicalRuleHost('QIWI.xyz'), 'qiwi.xyz');
  assert.equal(canonicalRuleHost('bücher.example'), 'xn--bcher-kva.example');
  assert.equal(parseSpammerHosts(raw + '\n\n').length, source.entryCount);
  assert.throws(() => parseSpammerHosts(raw + '\nQIWI.xyz\n'), /Duplicate/);
  assert.throws(() => parseSpammerHosts(raw + '\n# comment\n'));
  assert.throws(() => parseSpammerHosts('example.com\n'), /size/);
  assert.throws(() => compileReferralPolicy(spec, source, raw + '\n'), /hash mismatch/);
  assert.throws(() => compileReferralPolicy(spec, { ...source, entryCount: 1 }, raw), /count mismatch/);
  assert.throws(() => compileReferralPolicy({ ...spec, sourceRevision: '0'.repeat(40) }, source, raw), /revision\/hash mismatch/);
});

test('conflicting rules, missing commitments and edits under an existing version fail review gates', () => {
  const rule = spec.localRules[0];
  assert.ok(rule);
  assert.throws(() => compileReferralPolicy({ ...spec, localRules: [rule, { ...rule, id: 'conflict', action: 'include' }] }, source, raw), /conflicting/);
  assert.throws(() => compileReferralPolicy({ ...spec, publicHosts: [...spec.publicHosts, rule.host] }, source, raw), /Display\/exclusion conflict/);
  assert.throws(() => compileReferralPolicy({ ...spec, publicHosts: [...spec.publicHosts, spec.publicHosts[0]!] }, source, raw), /unique canonical/);
  verifyPolicyCommitment(active, undefined, true);
  assert.throws(() => verifyPolicyCommitment(active, undefined), /Missing policy commitment/);
  const changed = compileReferralPolicy({ ...spec, localRules: [] }, source, raw);
  assert.throws(() => verifyPolicyCommitment(changed, active.sha256, true), /create a new version/);
  const next = compileReferralPolicy({ ...spec, version: '2026-09-07.1', localRules: [] }, source, raw);
  assert.deepEqual(policyDifference(active, next), {
    previous: active.version, next: next.version, added: [], removed: [], localRulesChanged: true, displayChanged: false,
  });
});

function report() {
  return {
    period: { start: '2026-09-01', end: '2026-09-06', updatedAt: '2026-09-06T12:00:00Z' },
    filters: { range: '7d', traffic: 'browser', path: null }, totals: { views: 5 },
    byReferrer: [{ referrerHost: 'google.com', views: 3 }], otherReferrerViews: 2,
    referralPolicy: { version: active.version, sha256: active.sha256, evaluator: active.evaluator,
      source: { provider: active.source.provider, revision: active.source.revision, sha256: active.source.sha256 }, excludedViews: 1 },
  };
}

test('report capture preserves the received bytes and rejects a different or unprotected policy', () => {
  const body = JSON.stringify(report(), null, 2) + '\n';
  const captured = reportEvidence(body, 'https://gkoreli.com/api/stats?range=7d', '2026-09-06T12:01:00Z', active);
  assert.equal(captured.responseBody, body);
  assert.equal(captured.responseSha256, sha256(body));
  assert.equal(captured.policySha256, active.sha256);
  assert.equal(captured.period.updatedAt, '2026-09-06T12:00:00Z');
  assert.equal(captured.capturedAt, '2026-09-06T12:01:00Z');
  const wrong = report(); wrong.referralPolicy.sha256 = '0'.repeat(64);
  assert.throws(() => reportEvidence(JSON.stringify(wrong), '', '', active), /requested archived policy/);
  const leaked = report(); leaked.byReferrer.push({ referrerHost: 'unknown.example', views: 1 });
  assert.throws(() => reportEvidence(JSON.stringify(leaked), '', '', active), /unapproved referrer/);
  assert.throws(() => reportEvidence(JSON.stringify({ totals: { views: 5 } }), '', '', active));
});

test('private assessments require successful read-only hostname results', () => {
  const valid = [{ success: true, results: [{ referrer_host: 'example.com', views: 1 }], meta: { rows_written: 0 } }];
  assert.equal(referralEvidenceSchema.parse(valid)[0]?.results[0]?.referrer_host, 'example.com');
  assert.throws(() => referralEvidenceSchema.parse([]));
  assert.throws(() => referralEvidenceSchema.parse([{ ...valid[0], meta: { rows_written: 1 } }]));
  assert.throws(() => referralEvidenceSchema.parse([{ ...valid[0], success: false }]));
  assert.throws(() => referralEvidenceSchema.parse([{ ...valid[0], results: [{ unrelated_count: 1 }] }]));
});

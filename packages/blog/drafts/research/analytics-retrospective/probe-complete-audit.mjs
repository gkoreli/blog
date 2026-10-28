import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { signatureSelectionFixture } from '../../../../analytics/test/fixtures/signature-selection.mjs';
import { auditWebBotAuth } from '../../../../analytics/.test-dist/webbotauth-audit.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const [output, python, source, fixtureOutput] = process.argv.slice(2); assert.ok(output && python && source && fixtureOutput);
const fixture = await signatureSelectionFixture();
writeFileSync(fixtureOutput, JSON.stringify(fixture) + '\n', { mode: 0o600, flag: 'wx' });
const comparison = JSON.parse(execFileSync(python, ['packages/blog/drafts/research/analytics-retrospective/probe-pyauth-audit.py', source], { input: JSON.stringify(fixture), encoding: 'utf8' }));
const rows = [];
for (const trial of fixture.cases) {
  const audit = await auditWebBotAuth(new Request('https://publication.example/a', { headers: trial.headers }), { now: fixture.now, fetcher: async url => {
    assert.ok(Object.hasOwn(fixture.directories, String(url)));
    return Response.json(fixture.directories[String(url)], { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  assert.equal(audit.assessment, trial.name.startsWith('unpaired-') ? 'partial' : 'complete');
  rows.push({ name: trial.name, audit, independentReference: comparison.rows.find(row => row.name === trial.name).calls });
}
const both = rows.find(row => row.name === 'both-valid'); assert.equal(both.audit.verifiedCandidates, 2); assert.equal(both.independentReference[0].returnedResults, 2);
for (const name of ['first-invalid', 'later-invalid-unassessed']) {
  const row = rows.find(row => row.name === name);
  assert.equal(row.audit.verifiedCandidates, 1); assert.equal(row.audit.notVerifiedByProfileCandidates, 1);
  assert.equal(row.independentReference[0].returnedResults, null);
  assert.ok(row.independentReference.slice(1).some(call => call.returnedResults === 1));
}
const hash = data => createHash('sha256').update(data).digest('hex');
const result = { checkedAt: new Date().toISOString(), verifierProfile: VERIFIER_PROFILE_VERSION,
  method: 'Compare the bounded local profile audit with the pinned Python generic RFC verifier. Both use real Ed25519 math and explicit fixture-key resolvers. Generic tag/label policy, strict label-set matching and Web Bot Auth discovery/trust are different capabilities.',
  pythonSourceCommit: execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  privateFixtureSha256: hash(readFileSync(fixtureOutput)), rows, referenceCalls: comparison.referenceCalls,
  externalRequests: 0, productionRequests: 0,
  limits: ['A complete assessment can include failed proofs; it is not message authorization.', 'A failed all-signature reference call returns no result list, not proof that all signatures are invalid.', 'Public-key fixtures do not authenticate Exa, Ahrefs or native providers.'] };
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ cases: rows.length, referenceCalls: result.referenceCalls, externalRequests: 0 }));

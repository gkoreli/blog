import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { forwardedClaimFacts } from '../../../../analytics/.test-dist/forwarded-purpose.js';
import { forwardedSyntaxCases } from '../../../../analytics/test/fixtures/forwarded-purpose.mjs';

const [sourceRoot, output] = process.argv.slice(2); assert.ok(output);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(readFileSync(new URL('./forwarded-parser-sources.json', import.meta.url)));
assert.equal(manifest.commit, '2d397f0f28b713f272c83b9c91611fc55dd858ad');
for (const file of manifest.files) assert.equal(hash(readFileSync(join(sourceRoot, file.path))), file.sha256, file.path);
const require = createRequire(import.meta.url), parse = require(join(sourceRoot, 'index.js'));
const differences = new Map([
  ['duplicate-different', 'Conflicting duplicate rejected; reference uses the last value'],
  ['duplicate-same', 'Equal duplicate rejected; reference uses the last value'],
  ['duplicate-purpose', 'Conflicting use rejected; reference uses the last value'],
  ['element-bound', 'Local element admission bound'],
  ['parameter-bound', 'Local parameter admission bound'],
]);
const cases = [];
for (const item of forwardedSyntaxCases) {
  if (item.header === null) continue;
  const local = forwardedClaimFacts(item.header); let reference;
  try { reference = parse(item.header); } catch (error) { assert.equal(error.name, 'ParseError'); }
  const referenceParsed = reference !== undefined;
  const differs = referenceParsed !== (local.syntax === 'parsed');
  if (differs) assert.ok(differences.has(item.name), `Unexpected disagreement: ${item.name}`);
  else assert.ok(!differences.has(item.name), `Expected distinction missing: ${item.name}`);
  let prototypeFieldLoss = false;
  if (referenceParsed && local.syntax === 'parsed') {
    assert.equal(reference.length, local.elements.length);
    for (const [index, element] of reference.entries()) {
      assert.equal(local.elements[index].operator.value, element.for === 'openai' ? 'openai' : null);
      assert.equal(local.elements[index].use.value, ['immediate', 'reference', 'full'].includes(element.use) ? element.use : null);
    }
    if (item.name === 'prototype-key-is-data') {
      assert.equal(Object.hasOwn(reference[0], '__proto__'), false);
      assert.equal(local.elements[0].otherParameterCount, 1); prototypeFieldLoss = true;
    }
  }
  cases.push({ name: item.name, localSyntax: local.syntax, referenceParsed, distinction: differs ? differences.get(item.name) : null,
    explicitEmptyStateInsteadOfException: item.name === 'empty', referencePrototypeFieldLost: prototypeFieldLoss });
}
const result = { checkedAt: new Date().toISOString(), repository: manifest.repository, commit: manifest.commit, sourceFilesRechecked: manifest.files.length,
  cases, externalRequests: 0, dependenciesInstalled: 0,
  limits: ['This independently compares syntax acceptance and closed projections, not trust, signature validity or proxy selection.', 'Upstream tests were inspected, not executed with their development test runner. No upstream conformance claim.'] };
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ compared: cases.length, deliberateAdmissionDifferences: cases.filter(row => row.distinction).length, prototypeFieldLossCounterexamples: cases.filter(row => row.referencePrototypeFieldLost).length }));

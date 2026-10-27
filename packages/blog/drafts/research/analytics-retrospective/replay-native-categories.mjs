import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { nativeCategoryEvidence } from '../../../../analytics/.test-dist/native-bot-evidence.js';

const [input, output] = process.argv.slice(2); assert.ok(input && output, 'Provide a private native export and new aggregate path');
const bytes = readFileSync(input), rows = JSON.parse(bytes.toString()); assert.ok(Array.isArray(rows));
const counts = {}, ids = new Set(); let invalidRows = 0, duplicateIds = 0, missingIds = 0, nativeBooleanRecords = 0;
for (const row of rows) {
  const request = row?.$workers?.event?.request;
  if (!request || typeof request.url !== 'string' || typeof request.method !== 'string') { invalidRows++; continue; }
  const category = nativeCategoryEvidence(request.cf), basis = category.value ?? category.status;
  counts[basis] = (counts[basis] ?? 0) + 1;
  const management = request.cf?.botManagement;
  if (typeof management?.verifiedBot === 'boolean' || typeof management?.signedAgent === 'boolean') nativeBooleanRecords++;
  const id = row.$metadata?.id;
  if (typeof id !== 'string') missingIds++;
  else { if (ids.has(id)) duplicateIds++; ids.add(id); }
}
const receipt = { checkedAt: new Date().toISOString(), method: 'Offline category-only replay of retained native request.cf metadata through the actual closed-value normalizer. No signature re-verification or native method inference.',
  records: rows.length, invalidRows, distinctProviderIds: ids.size, duplicateProviderIds: duplicateIds, missingProviderIds: missingIds,
  providerCategories: counts, nativeBooleanRecords, inputSha256: createHash('sha256').update(bytes).digest('hex'), inputBytes: bytes.length,
  normalizerSha256: createHash('sha256').update(readFileSync(new URL('../../../../analytics/src/native-bot-evidence.ts', import.meta.url))).digest('hex'),
  networkCalls: 0, productionPageRequests: 0,
  limits: ['Provider category does not establish which native verification method ran, request purpose or a human trigger.', 'Raw provider IDs, request context and arbitrary category strings are absent from this aggregate.', 'Retained export coverage, unique-event counts, exact D1 joins and current organic collection acceptance remain unproven.'],
};
writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ records: rows.length, invalidRows, providerCategories: counts, nativeBooleanRecords }));

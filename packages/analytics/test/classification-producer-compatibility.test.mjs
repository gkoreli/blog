import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fetchMetadataReportCtes, fetchMetadataReportProjectionSql } from '../.test-dist/fetch-metadata-report.js';
import { current } from './fixtures/fetch-metadata-summary.mjs';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from '../.test-dist/versions.js';

test('new classification schema and producer pair retain Fetch Metadata guards and historical compatibility', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const base = { ...current(), collection_version: COLLECTION_VERSION };
  const classification = JSON.parse(base.classification_evidence);
  assert.equal(classification.version, '2026-11-06.1');
  assert.equal(CLASSIFIER_VERSION, '2026-11-06.1');
  const changed = (fields = {}, evidence = {}) => ({ ...base, ...fields,
    classification_evidence: JSON.stringify({ ...classification, ...evidence }) });
  const cases = [
    ['current', base, 'recognized'],
    ['historical-unchanged', changed({ collection_version: '2026-11-05.1', classifier_version: '2026-11-05.1' }, { version: '2026-10-29.2', classifierProfile: '2026-11-05.1' }), 'recognized'],
    ['new-profile-old-schema', changed({}, { version: '2026-10-29.2' }), 'inconsistent'],
    ['old-profile-new-schema', changed({ collection_version: '2026-11-05.1', classifier_version: '2026-11-05.1' }, { classifierProfile: '2026-11-05.1' }), 'inconsistent'],
    ['future-schema', changed({}, { version: 'future' }), 'unrecognized'],
    ['future-producer', changed({ classifier_version: 'future' }, { classifierProfile: 'future' }), 'unrecognized'],
    ['new-producer-missing-bits', changed({}, { fetchMetadataBits: undefined }), 'inconsistent'],
    ['new-producer-invalid-bits', changed({}, { fetchMetadataBits: 7 }), 'inconsistent'],
    ['new-producer-scalar-conflict', changed({ sec_fetch_mode: 'NAVIGATE' }), 'inconsistent'],
    ['new-producer-activation-conflict', changed({}, { activation: 'absent' }), 'inconsistent'],
    ['new-producer-profile-conflict', changed({}, { classifierProfile: '2026-11-05.1' }), 'inconsistent'],
  ];
  for (const [label, row, expected] of cases) {
    db.prepare('DELETE FROM page_observations').run();
    const columns = Object.keys(row);
    db.prepare(`INSERT INTO page_observations(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`).run(...Object.values(row));
    const before = db.prepare('SELECT classification_evidence FROM page_observations').get().classification_evidence;
    const result = JSON.parse(db.prepare(`WITH included AS (SELECT * FROM page_observations), ${fetchMetadataReportCtes()} SELECT (${fetchMetadataReportProjectionSql()}) AS payload`).get().payload);
    assert.equal(result.length, 1, label);
    assert.equal(result[0].state, expected, label);
    assert.equal(db.prepare('SELECT classification_evidence FROM page_observations').get().classification_evidence, before, label);
  }
});

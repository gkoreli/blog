import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { freshSchemaPath, historicalSchema, renderFreshSchema, schemaObjects } from '../scripts/fresh-schema.mjs';

test('the blog upgrade chain requires a legacy table on an otherwise empty database', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync(new URL('../migrations/0001_create_page_observations.sql', import.meta.url), 'utf8'));
    assert.throws(() => db.exec(readFileSync(new URL('../migrations/0002_backfill_legacy_page_views.sql', import.meta.url), 'utf8')), /no such table: page_views/);
  } finally { db.close(); }
});

test('empty-install schema preserves all historical tables, indexes and constraints without blog data', () => {
  const db = new DatabaseSync(':memory:');
  try {
    const source = readFileSync(freshSchemaPath, 'utf8');
    assert.equal(source, renderFreshSchema());
    db.exec(source);
    assert.deepEqual(schemaObjects(db), historicalSchema());
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='page_views'").get().n, 0);
    for (const table of schemaObjects(db).filter(row => row.type === 'table')) {
      assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table.name}`).get().n, 0);
    }
    assert.throws(() => db.exec(source), /already exists/);
  } finally { db.close(); }
});

test('empty-install schema rejects malformed observations and retains owner/diagnostic relations', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON');
    db.exec(readFileSync(freshSchemaPath, 'utf8'));
    const insert = db.prepare(`INSERT INTO page_observations
      (path,daily_client_id,traffic_class,device_type,is_owner) VALUES (?,?,?,?,?)`);
    assert.throws(() => insert.run('/notes', 'bad-id', 'browser', 'desktop', 0), /CHECK/);
    assert.throws(() => insert.run('/notes', 'a'.repeat(32), 'invented', 'desktop', 0), /CHECK/);
    insert.run('/notes', 'a'.repeat(32), 'browser', 'desktop', 0);
    assert.throws(() => db.exec("UPDATE page_observations SET classification_evidence='broken'"), /CHECK/);
    db.exec(`INSERT INTO page_observation_diagnostics VALUES
      (1,'fixture','2026-10-31','2026-11-01','{}');
      DELETE FROM page_observations WHERE id=1;`);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM page_observation_diagnostics').get().n, 0);
    db.exec("INSERT INTO owner_clients(daily_client_id,utc_date) VALUES('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','2026-10-31')");
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM owner_clients').get().n, 1);
  } finally { db.close(); }
});

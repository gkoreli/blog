import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const migrations = new URL('../migrations/', import.meta.url);
export const freshSchemaPath = new URL('../schema/0001_fresh_analytics.sql', import.meta.url);

// Only a compatibility fixture for replaying our site's historical migrations.
// It is never part of the fresh schema or used to migrate another site's data.
export const legacyTable = `CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL, referrer TEXT,
  country TEXT, city TEXT, continent TEXT, visitor_hash TEXT,
  visitor_type INTEGER DEFAULT 0, is_owner INTEGER DEFAULT 0,
  device_type TEXT DEFAULT 'desktop', created_at TEXT DEFAULT (datetime('now'))
);`;

export function schemaObjects(db) {
  return db.prepare(`SELECT type, name, sql FROM sqlite_master
    WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name <> 'page_views'
    ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name`).all();
}

export function historicalSchema() {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(legacyTable);
    for (const name of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) {
      db.exec(readFileSync(new URL(name, migrations), 'utf8'));
    }
    return schemaObjects(db);
  } finally { db.close(); }
}

export function renderFreshSchema() {
  return `-- Empty databases only. Never apply to the blog's existing database.
-- Schema snapshot through migration 0016; no historical rows or backfills.
-- Regenerate: node packages/analytics/scripts/fresh-schema.mjs --write
-- Future schema changes must update this snapshot and provide an upgrade path.
\n` + historicalSchema().map(row => row.sql + ';').join('\n\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--write') writeFileSync(freshSchemaPath, renderFreshSchema());
  else if (process.argv[2] === '--check') {
    if (readFileSync(freshSchemaPath, 'utf8') !== renderFreshSchema()) throw new Error('Fresh analytics schema is stale');
    console.log('Fresh analytics schema matches the historical migration chain');
  } else throw new Error('Expected --write or --check');
}

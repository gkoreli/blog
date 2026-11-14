import { DatabaseSync } from 'node:sqlite';
import { portableSchemaSource } from '../../scripts/fresh-schema.mjs';

/** Transactional local adapter; meters are explicitly synthetic test inputs. */
export function reportingStore() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  sqlite.exec(portableSchemaSource());
  let batches = 0;
  const db = {
    prepare(sql) {
      const make = values => ({ sql, values, bind: (...bound) => make(bound) });
      return make([]);
    },
    async batch(statements) {
      batches++;
      sqlite.exec('BEGIN');
      try {
        const result = statements.map(s => ({ success: true, results: sqlite.prepare(s.sql).all(...s.values),
          meta: { rows_read: 10, rows_written: 0, total_attempts: 1, duration: 0 } }));
        sqlite.exec('COMMIT');
        return result;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  return { sqlite, db, batches: () => batches };
}

export function memoryReportCache() {
  const values = new Map();
  return { values, async match(request) { return values.get(request.url)?.clone(); },
    async put(request, response) { values.set(request.url, response.clone()); } };
}

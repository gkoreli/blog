/** Existing database row reference, confined to private operational logs. */
export type ObservationStorageReference = {
  version: '2026-10-27.1';
  status: 'returned';
  observationId: string;
} | {
  version: '2026-10-27.1';
  status: 'unavailable';
  observationId: 'unavailable';
};

/** SQLite rowids are signed 64-bit integers; JavaScript numbers cannot represent all of them. */
export function isObservationId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n;
}

export function observationStorageReference(rows: unknown): ObservationStorageReference {
  if (Array.isArray(rows) && rows.length === 1) {
    const row: unknown = rows[0];
    if (typeof row === 'object' && row !== null && 'observation_id' in row && isObservationId(row.observation_id)) {
      return { version: '2026-10-27.1', status: 'returned', observationId: row.observation_id };
    }
  }
  return { version: '2026-10-27.1', status: 'unavailable', observationId: 'unavailable' };
}

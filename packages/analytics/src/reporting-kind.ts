import { READER_KINDS } from './contracts.js';
import { PUBLIC_SIGNERS } from './signers.js';

export const CLASSIFICATION_NOT_RECORDED = 'classification-not-recorded';
export const UNRECOGNIZED_CLASSIFICATION = 'unrecognized-stored-classification';
export const CLASSIFICATION_REASON_UNAVAILABLE = 'classification-reason-unavailable';

/** Fixed storage columns and closed catalogue only; never caller-provided SQL. */
const knownKinds = READER_KINDS.map(kind => "'" + kind + "'").join(', ');

/** Reporting projection only. Original missing/unrecognized stored values survive. */
export function reportedKindSql(): string {
  return `CASE WHEN reader_kind IN (${knownKinds}) THEN reader_kind ELSE 'unresolved' END`;
}

export function unresolvedKindSql(): string {
  return `(reader_kind = 'unresolved' OR reader_kind IS NULL OR reader_kind NOT IN (${knownKinds}))`;
}

export function reportedReasonSql(): string {
  const signer = `CASE reader_reason ${PUBLIC_SIGNERS.map(({ origin, name }) =>
    `WHEN '${origin.replaceAll("'", "''")}' THEN '${name.replaceAll("'", "''")}'`).join(' ')} ELSE 'Other' END`;
  return `CASE
    WHEN reader_kind IS NULL THEN '${CLASSIFICATION_NOT_RECORDED}'
    WHEN reader_kind NOT IN (${knownKinds}) THEN '${UNRECOGNIZED_CLASSIFICATION}'
    WHEN reader_reason IS NULL OR reader_reason = '' THEN '${CLASSIFICATION_REASON_UNAVAILABLE}'
    WHEN reader_kind = 'signed-agent' THEN ${signer}
    ELSE reader_reason END`;
}

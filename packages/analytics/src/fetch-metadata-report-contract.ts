/** Counts of stored parsing facts, never engine or operator authentication. */
export const FETCH_METADATA_REPORT_FIELDS = ['mode', 'destination', 'site', 'activation'] as const;
export const FETCH_METADATA_REPORT_STATES = ['notAssessedViews', 'absentViews', 'validViews', 'unrecognizedViews', 'invalidViews', 'policyLimitedViews'] as const;
export type FetchMetadataReportField = typeof FETCH_METADATA_REPORT_FIELDS[number];
export interface FetchMetadataFieldSummary {
  notAssessedViews: number;
  absentViews: number;
  validViews: number;
  unrecognizedViews: number;
  invalidViews: number;
  policyLimitedViews: number;
  /** Overlaps valid/unrecognized/invalid; parameters were parsed then discarded. */
  parametersViews: number;
}
export interface FetchMetadataSummary {
  records: { recognizedViews: number; notRecordedViews: number; unrecognizedViews: number; inconsistentViews: number };
  fields: Record<FetchMetadataReportField, FetchMetadataFieldSummary>;
  activation: { trueClaimViews: number; falseValueViews: number };
}
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const recordKeys = ['recognizedViews', 'notRecordedViews', 'unrecognizedViews', 'inconsistentViews'] as const;
const fieldKeys = [...FETCH_METADATA_REPORT_STATES, 'parametersViews'] as const;
function counts<K extends string>(value: unknown, keys: readonly K[], total: number): value is Record<K, number> {
  return object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key) && typeof value[key] === 'number'
    && Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] <= total);
}
/** Strict client/server contract: every event is accounted once per field;
 * unavailable records contribute unassessed facts, never header absence. */
export function consistentFetchMetadataSummary(value: unknown, total: number): value is FetchMetadataSummary {
  if (!Number.isSafeInteger(total) || total < 0 || !object(value) || Object.keys(value).length !== 3 || !['records', 'fields', 'activation'].every(key => Object.hasOwn(value, key))
    || !counts(value.records, recordKeys, total) || !object(value.fields)
    || Object.keys(value.fields).length !== FETCH_METADATA_REPORT_FIELDS.length) return false;
  if (!counts(value.activation, ['trueClaimViews', 'falseValueViews'] as const, total)) return false;
  const records = value.records;
  if (recordKeys.reduce((sum, key) => sum + records[key], 0) !== total) return false;
  for (const field of FETCH_METADATA_REPORT_FIELDS) {
    const row = value.fields[field];
    if (!Object.hasOwn(value.fields, field) || !counts(row, fieldKeys, total) || FETCH_METADATA_REPORT_STATES.reduce((sum, key) => sum + row[key], 0) !== total
      || row.notAssessedViews < total - records.recognizedViews
      || row.parametersViews > row.validViews + row.unrecognizedViews + row.invalidViews) return false;
  }
  const activationField = value.fields.activation;
  return counts(activationField, fieldKeys, total) && activationField.unrecognizedViews === 0 && value.activation.trueClaimViews + value.activation.falseValueViews === activationField.validViews;
}
export function emptyFetchMetadataSummary(): FetchMetadataSummary {
  const field = (): FetchMetadataFieldSummary => ({ notAssessedViews: 0, absentViews: 0, validViews: 0, unrecognizedViews: 0, invalidViews: 0, policyLimitedViews: 0, parametersViews: 0 });
  return { records: { recognizedViews: 0, notRecordedViews: 0, unrecognizedViews: 0, inconsistentViews: 0 },
    fields: { mode: field(), destination: field(), site: field(), activation: field() }, activation: { trueClaimViews: 0, falseValueViews: 0 } };
}

import { FETCH_METADATA_TOKENS, fetchMetadataFields } from './fetch-metadata.js';
import { FETCH_METADATA_REPORT_FIELDS, FETCH_METADATA_REPORT_STATES, emptyFetchMetadataSummary, consistentFetchMetadataSummary, type FetchMetadataSummary } from './fetch-metadata-report-contract.js';

const recordStates = ['recognized', 'not-recorded', 'unrecognized', 'inconsistent'] as const;
const stateKey = { recognized: 'recognizedViews', 'not-recorded': 'notRecordedViews', unrecognized: 'unrecognizedViews', inconsistent: 'inconsistentViews' } as const;
const tokens = (values: readonly string[]) => values.map(v => `'${v.replaceAll("'", "''")}'`).join(',');
/** Trusted expressions only, with a guarded JSON document. Known format/profile
 * plus encoded states must agree with retained canonical scalars. This does not
 * authenticate the original header, other classification facts, or an operator. */
function recordStateSql(): string {
  // The cache-evidence collection bump preserves this parser/record format.
  // Keep explicit compatibility; an arbitrary future collector must not inherit it.
  const compatibleCollection = "collection_version IN ('2026-10-29.6','2026-10-30.1')";
  const j = (key: string) => `json_extract(metadata_json,'$.${key}')`;
  const t = (key: string) => `json_type(metadata_json,'$.${key}')`;
  const bit = j('fetchMetadataBits');
  const checks = [
    "observation_source = 'edge'", compatibleCollection, "classifier_version = '2026-10-29.3'",
    `${t('fetchMetadataBits')} = 'integer'`, `${bit} BETWEEN 0 AND 65535`,
    "NOT EXISTS (SELECT 1 FROM json_each(metadata_json) GROUP BY key HAVING COUNT(*) > 1)",
  ];
  const columns: readonly { column: string; allowed: readonly string[] | null }[] = [
    { column: 'sec_fetch_mode', allowed: FETCH_METADATA_TOKENS.mode },
    { column: 'sec_fetch_dest', allowed: FETCH_METADATA_TOKENS.dest },
    { column: 'sec_fetch_site', allowed: FETCH_METADATA_TOKENS.site },
    { column: 'sec_fetch_user', allowed: null },
  ];
  for (const [index, { column, allowed }] of columns.entries()) {
    const code = `((${bit} >> ${index * 3}) & 7)`, parameter = `(${bit} & ${1 << (12 + index)})`;
    const scalarValid = allowed === null ? `typeof(${column}) = 'integer' AND ${column} IN (0,1)`
      : `typeof(${column}) = 'text' AND ${column} IN (${tokens(allowed)})`;
    checks.push(`${code} BETWEEN 0 AND 5`, `(${parameter} = 0 OR ${code} IN (2,3,4))`,
      `CASE WHEN ${code} = 0 THEN 1 WHEN ${code} = 2 THEN (${scalarValid}) ELSE ${column} IS NULL END`);
    // Activation has no unrecognized enum: non-Boolean Items have invalid type.
    if (index === 3) checks.push(`${code} <> 3`, `CASE ${code} WHEN 0 THEN 1 WHEN 1 THEN ${j('activation')} = 'absent' WHEN 2 THEN ${j('activation')} = CASE WHEN sec_fetch_user = 1 THEN 'true-claim' ELSE 'other-value' END WHEN 4 THEN ${j('activation')} = 'invalid' WHEN 5 THEN ${j('activation')} = 'policy-limit' ELSE 0 END`);
  }
  return `CASE WHEN metadata_missing = 1 THEN 'not-recorded'
    WHEN json_type(metadata_json) <> 'object' THEN 'unrecognized'
    WHEN ${j('version')} IN ('2026-10-27.2','2026-10-29.1') AND ${t('fetchMetadataBits')} IS NULL THEN
      CASE WHEN ${compatibleCollection} OR classifier_version = '2026-10-29.3' OR ${j('classifierProfile')} = '2026-10-29.3' THEN 'inconsistent' ELSE 'not-recorded' END
    WHEN ${j('version')} IS NULL OR ${j('version')} <> '2026-10-29.2' THEN 'unrecognized'
    WHEN NOT COALESCE(${t('classifierProfile')} = 'text' AND ${j('classifierProfile')} = classifier_version,0) THEN 'inconsistent'
    WHEN collection_version IS NULL OR classifier_version IS NULL OR NOT (${compatibleCollection}) OR classifier_version <> '2026-10-29.3' THEN 'unrecognized'
    WHEN NOT COALESCE((${checks.join(' AND ')}),0) THEN 'inconsistent'
    ELSE 'recognized' END`;
}

export function fetchMetadataReportCtes(): string {
  return `metadata_inputs AS MATERIALIZED (
    SELECT classification_evidence IS NULL AS metadata_missing,
      CASE WHEN typeof(classification_evidence) = 'text' AND json_valid(classification_evidence) THEN classification_evidence ELSE '{}' END AS metadata_json,
      observation_source, collection_version, classifier_version, sec_fetch_mode, sec_fetch_dest, sec_fetch_site, sec_fetch_user, COUNT(*) AS metadata_views
    FROM included
    GROUP BY classification_evidence, observation_source, collection_version, classifier_version, sec_fetch_mode, sec_fetch_dest, sec_fetch_site, sec_fetch_user
  ), metadata_facts AS MATERIALIZED (
    SELECT ${recordStateSql()} AS metadata_state, json_extract(metadata_json,'$.fetchMetadataBits') AS metadata_bits, sec_fetch_user AS metadata_user, metadata_views
    FROM metadata_inputs
  )`;
}
export function fetchMetadataReportProjectionSql(): string {
  const user = "CASE WHEN metadata_state = 'recognized' AND ((metadata_bits >> 9) & 7) = 2 THEN metadata_user ELSE NULL END";
  return `SELECT COALESCE(json_group_array(json(row_json)),json('[]')) FROM (
    SELECT json_object('state',metadata_state,'bits',CASE WHEN metadata_state = 'recognized' THEN metadata_bits ELSE NULL END,'activation',${user},'views',SUM(metadata_views)) AS row_json
    FROM metadata_facts GROUP BY metadata_state, CASE WHEN metadata_state = 'recognized' THEN metadata_bits ELSE NULL END, ${user}
    ORDER BY metadata_state, metadata_bits
  )`;
}

/** Closed grouped inputs only. Reject partial/malformed marginals rather than
 * showing plausible zeros or treating unknown history as absent headers. */
export function decodeFetchMetadataRows(rows: readonly Record<string, unknown>[], total: number): FetchMetadataSummary {
  const summary = emptyFetchMetadataSummary(), seen = new Set<string>();
  for (const row of rows) {
    const state = row.state, bits = row.bits, activation = row.activation, views = row.views;
    if (Object.keys(row).length !== 4 || !['state', 'bits', 'activation', 'views'].every(key => Object.hasOwn(row, key))) throw new Error('Malformed Fetch Metadata cohort');
    if (typeof state !== 'string' || !recordStates.some(s => s === state) || typeof views !== 'number' || !Number.isSafeInteger(views) || views < 1) throw new Error('Malformed Fetch Metadata summary');
    const key = JSON.stringify([state,bits,activation]);
    if (seen.has(key)) throw new Error('Duplicate Fetch Metadata summary cohort');
    seen.add(key);
    if (state === 'recognized') {
      const decoded = fetchMetadataFields(bits);
      if (decoded === null || decoded.states[3] === 'unrecognized') throw new Error('Malformed Fetch Metadata encoding');
      if (decoded.states[3] === 'valid') {
        if (activation !== 0 && activation !== 1) throw new Error('Missing activation value');
        if (activation === 1) summary.activation.trueClaimViews += views;
        else summary.activation.falseValueViews += views;
      } else if (activation !== null) throw new Error('Unassessed activation carried a value');
      summary.records.recognizedViews += views;
      for (const [index, field] of FETCH_METADATA_REPORT_FIELDS.entries()) {
        const stateIndex = ['not-assessed', 'absent', 'valid', 'unrecognized', 'invalid', 'policy-limit'].indexOf(decoded.states[index]);
        const count = FETCH_METADATA_REPORT_STATES[stateIndex];
        if (count === undefined) throw new Error('Unrecognized Fetch Metadata state');
        summary.fields[field][count] += views;
        if (decoded.parameters[index]) summary.fields[field].parametersViews += views;
      }
    } else {
      if (bits !== null || activation !== null) throw new Error('Unassessed Fetch Metadata cohort carried claims');
      if (state !== 'not-recorded' && state !== 'unrecognized' && state !== 'inconsistent') throw new Error('Unknown Fetch Metadata record');
      summary.records[stateKey[state]] += views;
      for (const field of FETCH_METADATA_REPORT_FIELDS) summary.fields[field].notAssessedViews += views;
    }
  }
  if (!consistentFetchMetadataSummary(summary, total)) throw new Error('Inconsistent Fetch Metadata summary');
  return summary;
}

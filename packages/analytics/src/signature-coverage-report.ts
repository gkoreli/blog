/** Stored coverage facts only; this does not reverify a signature or impose
 * today's time policy on historical results. All booleans must be JSON booleans.
 */
export function signatureCoverageRecordedSql(): string {
  const path = (key: string) => `'$.coverage.${key}'`;
  const value = (key: string) => `json_extract(signature_evidence, ${path(key)})`;
  const type = (key: string) => `json_type(signature_evidence, ${path(key)})`;
  return `COALESCE((json_type(signature_evidence, '$.coverage') = 'object'
    AND ${value('version')} IN ('2026-10-27.1','2026-10-28.1')
    AND ${value('headerForm')} IN ('dictionary','legacy-string','bare-uri')
    AND ${value('replayPolicy')} = 'expiry-only'
    AND ${['authority','targetUri','method','path','query','userAgent','contentDigest'].map(key => `${type('covered.' + key)} IN ('true','false')`).join(' AND ')}
    AND ${['otherComponentCount','validitySeconds'].map(key => `${type(key)} = 'integer' AND ${value(key)} BETWEEN 0 AND 9007199254740991`).join(' AND ')}
    AND ${type('ageSeconds')} = 'integer' AND ${value('ageSeconds')} BETWEEN -9007199254740991 AND 9007199254740991
  ),0)`;
}

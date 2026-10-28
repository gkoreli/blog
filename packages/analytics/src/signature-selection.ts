/** Validate a closed stored assessment before reporting its counts. A missing
 * historical assessment must not turn into a measured zero-candidate result.
 * Eligibility means a paired member tagged web-bot-auth, not a verified signer.
 */
export function signatureSelectionRecordedSql(): string {
  const value = (key: string) => `json_extract(signature_evidence, '$.coverage.selection.${key}')`;
  const counts = ['matchedCandidates', 'taggedCandidates', 'attemptedCandidates', 'unassessedCandidates'];
  return `COALESCE((signature_status = 'verified'
    AND json_extract(signature_evidence, '$.version') = '2026-10-27.5'
    AND json_extract(signature_evidence, '$.source') = 'local-webbotauth'
    AND json_extract(signature_evidence, '$.localStatus') = 'verified'
    AND json_extract(signature_evidence, '$.localOutcome') = 'verified'
    AND json_extract(signature_evidence, '$.coverage.version') = '2026-10-28.1'
    AND ${value('policy')} = 'first-valid-in-input-order'
    AND ${counts.map(key => `json_type(signature_evidence, '$.coverage.selection.${key}') = 'integer' AND ${value(key)} BETWEEN 0 AND 9007199254740991`).join('\n    AND ')}
    AND ${value('taggedCandidates')} >= 1
    AND ${value('attemptedCandidates')} >= 1
    AND ${value('matchedCandidates')} >= ${value('taggedCandidates')}
    AND ${value('taggedCandidates')} >= ${value('attemptedCandidates')}
    AND ${value('unassessedCandidates')} = ${value('taggedCandidates')} - ${value('attemptedCandidates')}
  ), 0)`;
}

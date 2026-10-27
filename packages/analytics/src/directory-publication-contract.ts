/** Shared closed display vocabulary; no verifier or discovery dependency. */
export const DIRECTORY_PUBLICATION_PROFILE = '2026-10-27.1';
export const DIRECTORY_PUBLICATION_STATUSES = [
  'no-declaration', 'not-configured', 'not-verified', 'matching-publisher',
  'different-publisher', 'partial-mapping', 'conflicting-publishers', 'test-injected',
] as const;
export type DirectoryPublicationStatus = typeof DIRECTORY_PUBLICATION_STATUSES[number];
export type DirectoryPublicationBasis = DirectoryPublicationStatus | 'not-recorded' | 'unrecognized-record';
export interface DirectoryPublicationEvidence {
  profile: typeof DIRECTORY_PUBLICATION_PROFILE;
  method: 'reviewed-first-party-directory';
  reviewedOn: '2026-10-27';
  configuredDeclarationCount: number;
  unmappedDeclarationCount: number;
  status: DirectoryPublicationStatus;
}

export function isDirectoryPublicationBasis(value: unknown): value is DirectoryPublicationBasis {
  return value === 'not-recorded' || value === 'unrecognized-record' || DIRECTORY_PUBLICATION_STATUSES.some(status => status === value);
}
export const DIRECTORY_PUBLICATION_LABELS: Record<DirectoryPublicationBasis, string> = {
  'no-declaration': 'No recognized named client declaration',
  'not-configured': 'No reviewed directory for these declarations',
  'not-verified': 'Reviewed publisher; local signature not verified',
  'matching-publisher': 'Verified key publisher matches reviewed endpoint',
  'different-publisher': 'Verified key publisher differs from reviewed endpoint',
  'partial-mapping': 'Some declarations lack a reviewed directory',
  'conflicting-publishers': 'Declarations name different reviewed publishers',
  'test-injected': 'Injected test verdict — no publisher proof',
  'not-recorded': 'Directory assessment not recorded',
  'unrecognized-record': 'Unrecognized or inconsistent directory assessment',
};


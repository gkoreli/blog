import { isReaderKind, type ReaderKind } from './contracts.js';
import { isNativeCategoryBasis, type NativeCategoryBasis } from './native-bot-evidence.js';
import { isSignatureBasis, type SignatureBasis } from './signature-basis.js';
import { isReportedVerifierProfile, type ReportedVerifierProfile } from './verifier-profile.js';

/** Selection from the stored catalogue result, not an operator identity test.
 * No selected name includes no match, multiple matches and earlier missing data.
 */
export const CLIENT_NAME_SELECTIONS = ['selected', 'not-selected'] as const;
export type ClientNameSelection = typeof CLIENT_NAME_SELECTIONS[number];
export const CLIENT_NAME_SELECTION_LABELS: Record<ClientNameSelection, string> = {
  selected: 'One catalogue name selected',
  'not-selected': 'No single catalogue name selected',
};
export interface ClientEvidenceRow {
  kind: ReaderKind | null;
  nameSelection: ClientNameSelection;
  nativeCategory: NativeCategoryBasis;
  signatureBasis: SignatureBasis;
  verifierProfile: ReportedVerifierProfile;
  views: number;
}
export interface ClientNameCoverage {
  selectedNameViews: number;
  noSelectedNameViews: number;
}
type SignatureRow = { kind: ReaderKind | null; basis: SignatureBasis; profile: ReportedVerifierProfile; views: number };
type CategoryRow = { kind: ReaderKind | null; basis: NativeCategoryBasis; views: number };
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function isClientNameSelection(value: unknown): value is ClientNameSelection {
  return CLIENT_NAME_SELECTIONS.some(state => state === value);
}

/** Decode the joint table without coercing missing facts into plausible zeros. */
export function decodeClientEvidenceRows(rows: readonly Record<string, unknown>[], total: number): ClientEvidenceRow[] {
  const result: ClientEvidenceRow[] = [], keys = new Set<string>();
  for (const row of rows) {
    const kind = row.key1, nameSelection = row.key2, nativeCategory = row.key3,
      signatureBasis = row.key4, verifierProfile = row.key5, views = row.views;
    if ((kind !== null && (typeof kind !== 'string' || !isReaderKind(kind)))
      || !isClientNameSelection(nameSelection) || !isNativeCategoryBasis(nativeCategory)
      || typeof signatureBasis !== 'string' || !isSignatureBasis(signatureBasis)
      || !isReportedVerifierProfile(verifierProfile) || !count(views) || views === 0) throw new Error('Malformed client evidence');
    const key = JSON.stringify([kind, nameSelection, nativeCategory, signatureBasis, verifierProfile]);
    if (keys.has(key)) throw new Error('Duplicate client evidence');
    keys.add(key); result.push({ kind, nameSelection, nativeCategory, signatureBasis, verifierProfile, views });
  }
  if (!count(total) || result.reduce((sum, row) => sum + row.views, 0) !== total) throw new Error('Incomplete client evidence');
  return result;
}

export function clientNameCoverage(rows: readonly ClientEvidenceRow[]): ClientNameCoverage {
  let selectedNameViews = 0, noSelectedNameViews = 0;
  for (const row of rows) {
    if (row.nameSelection === 'selected') selectedNameViews += row.views;
    else noSelectedNameViews += row.views;
  }
  return { selectedNameViews, noSelectedNameViews };
}

function marginal<Row>(rows: readonly Row[], key: (row: Row) => string, views: (row: Row) => number, unique = false): Map<string, number> {
  const values = new Map<string, number>();
  for (const row of rows) {
    const amount = views(row);
    if (!count(amount) || amount === 0) throw new Error('Malformed client evidence marginal');
    const id = key(row);
    if (unique && values.has(id)) throw new Error('Duplicate client evidence marginal');
    values.set(id, (values.get(id) ?? 0) + amount);
  }
  return values;
}
function sameCounts(left: ReadonlyMap<string, number>, right: ReadonlyMap<string, number>): boolean {
  return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value);
}

/** Independent name, provider-role and local-proof facts must describe the same
 * included event population. A matching total alone cannot establish that join.
 */
export function consistentClientEvidence(
  rows: readonly ClientEvidenceRow[], coverage: ClientNameCoverage, total: number,
  signatures: readonly SignatureRow[], categories: readonly CategoryRow[],
  selectedNames: readonly { agentName: string; trafficClass: string; views: number }[],
): boolean {
  try {
    if (!count(total) || !object(coverage) || !count(coverage.selectedNameViews) || !count(coverage.noSelectedNameViews)) return false;
    const normalized = decodeClientEvidenceRows(rows.map(row => ({
      key1: row.kind, key2: row.nameSelection, key3: row.nativeCategory,
      key4: row.signatureBasis, key5: row.verifierProfile, views: row.views,
    })), total);
    const actual = clientNameCoverage(normalized);
    if (actual.selectedNameViews !== coverage.selectedNameViews || actual.noSelectedNameViews !== coverage.noSelectedNameViews
      || selectedNames.some(row => !count(row.views) || row.views === 0 || typeof row.agentName !== 'string'
        || row.agentName.trim().length === 0 || (row.trafficClass !== 'bot' && row.trafficClass !== 'ai'))
      || selectedNames.reduce((sum, row) => sum + row.views, 0) !== actual.selectedNameViews) return false;
    const kind = (value: unknown) => value === null || (typeof value === 'string' && isReaderKind(value));
    if (signatures.some(row => !kind(row.kind) || typeof row.basis !== 'string' || !isSignatureBasis(row.basis) || !isReportedVerifierProfile(row.profile))
      || categories.some(row => !kind(row.kind) || !isNativeCategoryBasis(row.basis))) return false;
    marginal(selectedNames, row => JSON.stringify([row.agentName, row.trafficClass]), row => row.views, true);
    return sameCounts(
      marginal(normalized, row => JSON.stringify([row.kind, row.signatureBasis, row.verifierProfile]), row => row.views),
      marginal(signatures, row => JSON.stringify([row.kind, row.basis, row.profile]), row => row.views, true),
    ) && sameCounts(
      marginal(normalized, row => JSON.stringify([row.kind, row.nativeCategory]), row => row.views),
      marginal(categories, row => JSON.stringify([row.kind, row.basis]), row => row.views, true),
    );
  } catch { return false; }
}

import { fetchMetadataFields } from './fetch-metadata.js';
import type { ClientDeclarations } from './classify.js';
import { networkEvidence, type NetworkEvidence } from './networks.js';
import { agentReaderKind, type ReaderKindFacts } from './readerkind.js';
import { isReaderKind, type ReaderKind } from './contracts.js';
import { CLASSIFIER_VERSION } from './versions.js';

/** Closed derived facts; no raw UA, IP, free-text product or arbitrary URL. */
export interface ClassificationEvidence {
  version: '2026-10-29.2';
  classifierProfile: string;
  declarations: ClientDeclarations;
  /** Fixed bit assignments below; names and matched product aliases remain complete. */
  declaredCategoryBits: number;
  fetchMetadataBits: number;
  categoryAgreement: 'no-match' | 'single-match' | 'multiple-same-category' | 'multiple-categories';
  network: NetworkEvidence;
  navigationShaped: boolean;
  activation: 'true-claim' | 'absent' | 'other-value' | 'invalid' | 'policy-limit' | 'not-assessed';
  referrerContext: 'external-with-same-origin' | 'no-conflict-observed' | 'not-assessed';
}

/** Encoding v1: fixed assignments, never inferred from a mutable array order. */
const CATEGORY_BITS: Record<ReaderKind, number> = {
  'signed-agent': 1,
  'ai-assistant': 2,
  'ai-search': 4,
  'ai-crawler': 8,
  'search-crawler': 16,
  'seo-crawler': 32,
  'preview-or-feed': 64,
  'headless-browser': 128,
  'other-bot': 256,
  'cloud-browser': 512,
  'http-client': 1024,
  'legacy-browser': 2048,
  browser: 4096,
  unresolved: 8192,
};
const ALL_CATEGORY_BITS = Object.values(CATEGORY_BITS).reduce((value, bit) => value | bit, 0);
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Decode category facts only, not the coherence or authenticity of the record.
 * Old arrays remain readable; unknown versions/bits stay unassessed. */
export function retainedDeclaredCategories(value: unknown): ReaderKind[] | null {
  if (!record(value)) return null;
  if (value.version === '2026-10-27.2') {
    const kinds = value.declaredCategories;
    if (!Array.isArray(kinds) || !kinds.every((kind: unknown): kind is ReaderKind => typeof kind === 'string' && isReaderKind(kind))
      || new Set(kinds).size !== kinds.length) return null;
    return [...kinds].sort();
  }
  if (value.version !== '2026-10-29.1' && value.version !== '2026-10-29.2') return null;
  const bits = value.declaredCategoryBits;
  if (typeof bits !== 'number' || !Number.isSafeInteger(bits) || bits < 0 || bits > ALL_CATEGORY_BITS || (bits & ALL_CATEGORY_BITS) !== bits) return null;
  return Object.entries(CATEGORY_BITS).flatMap(([kind, bit]) => isReaderKind(kind) && (bits & bit) !== 0 ? [kind] : []).sort();
}

export function classificationEvidence(facts: ReaderKindFacts, declarations: ClientDeclarations): ClassificationEvidence {
  const userState = fetchMetadataFields(facts.fetchMetadataBits)?.states[3];
  const declaredCategories = [...new Set(declarations.candidates.map(agentReaderKind))].sort();
  return {
    version: '2026-10-29.2', classifierProfile: CLASSIFIER_VERSION, declarations,
    fetchMetadataBits: facts.fetchMetadataBits ?? 0,
    declaredCategoryBits: declaredCategories.reduce((bits, kind) => bits | CATEGORY_BITS[kind], 0),
    categoryAgreement: declarations.status === 'none' ? 'no-match' : declarations.status === 'single' ? 'single-match'
      : declaredCategories.length === 1 ? 'multiple-same-category' : 'multiple-categories',
    network: networkEvidence(facts.asn),
    navigationShaped: facts.secFetchMode === 'navigate' && facts.secFetchDest === 'document' && facts.acceptsHtml === 1 && facts.hasAcceptLanguage === 1,
    activation: userState === 'invalid' || userState === 'policy-limit' || userState === 'not-assessed' ? userState : facts.secFetchUser === null ? 'absent' : facts.secFetchUser === 1 ? 'true-claim' : 'other-value',
    referrerContext: facts.referrerState === undefined || facts.secFetchSite === null ? 'not-assessed'
      : facts.referrerState === 'external' && facts.secFetchSite === 'same-origin' ? 'external-with-same-origin' : 'no-conflict-observed',
  };
}

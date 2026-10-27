import type { ClientDeclarations } from './classify.js';
import { networkEvidence, type NetworkEvidence } from './networks.js';
import { agentReaderKind, type ReaderKindFacts } from './readerkind.js';
import type { ReaderKind } from './contracts.js';
import { CLASSIFIER_VERSION } from './versions.js';

/** Closed derived facts; no raw UA, IP, free-text product or arbitrary URL. */
export interface ClassificationEvidence {
  version: '2026-10-27.2';
  classifierProfile: string;
  declarations: ClientDeclarations;
  declaredCategories: ReaderKind[];
  categoryAgreement: 'no-match' | 'single-match' | 'multiple-same-category' | 'multiple-categories';
  network: NetworkEvidence;
  navigationShaped: boolean;
  activation: 'true-claim' | 'absent' | 'other-value';
  referrerContext: 'external-with-same-origin' | 'no-conflict-observed' | 'not-assessed';
}

export function classificationEvidence(facts: ReaderKindFacts, declarations: ClientDeclarations): ClassificationEvidence {
  const declaredCategories = [...new Set(declarations.candidates.map(agentReaderKind))].sort();
  return {
    version: '2026-10-27.2', classifierProfile: CLASSIFIER_VERSION, declarations,
    declaredCategories,
    categoryAgreement: declarations.status === 'none' ? 'no-match' : declarations.status === 'single' ? 'single-match'
      : declaredCategories.length === 1 ? 'multiple-same-category' : 'multiple-categories',
    network: networkEvidence(facts.asn),
    navigationShaped: facts.secFetchMode === 'navigate' && facts.secFetchDest === 'document' && facts.acceptsHtml === 1 && facts.hasAcceptLanguage === 1,
    activation: facts.secFetchUser === null ? 'absent' : facts.secFetchUser === 1 ? 'true-claim' : 'other-value',
    referrerContext: facts.referrerState === undefined || facts.secFetchSite === null ? 'not-assessed'
      : facts.referrerState === 'external' && facts.secFetchSite === 'same-origin' ? 'external-with-same-origin' : 'no-conflict-observed',
  };
}

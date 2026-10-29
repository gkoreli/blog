import type { PageObservation } from './db.js';
import type { ClassificationEvidence } from './classification-evidence.js';
import type { VerificationEvidence } from './signature-evidence.js';
import { publicSignerName, SIGNER_DISPLAY_PROFILE, type PublicSignerName } from './signers.js';
import { vendorIpReceipt } from './vendor-ip-receipt.js';

type ReceiptInput = Pick<PageObservation, 'readerKind' | 'signatureStatus' | 'signatureAgent' | 'vendorIpEvidence'> & {
  classificationEvidence: ClassificationEvidence;
  signatureEvidence: VerificationEvidence;
};

function booleanState(value: boolean | null): 'true' | 'false' | 'unavailable' {
  return value === true ? 'true' : value === false ? 'false' : 'unavailable';
}

/** Closed projections of the values passed to the insert, never a second verdict.
 * Snapshot before the insert; emit only after D1 acknowledges its one-row write.
 * The caller adds operation and returned database references outside this projection.
 */
export function storedObservationReceipt(observation: ReceiptInput) {
  const evidence = observation.signatureEvidence;
  const classification = observation.classificationEvidence;
  const coverage = evidence.coverage;
  const selection = coverage?.version === '2026-10-28.1' ? coverage.selection : null;
  const signer: PublicSignerName | 'none' = evidence.source === 'local-webbotauth'
    && evidence.localOutcome === 'verified' && observation.signatureStatus === 'verified'
    ? publicSignerName(observation.signatureAgent) : 'none';
  return {
    // One retained export omitted nulls/empty arrays from the same v1 operations. Scalars
    // make those states queryable without reconstructing missing fields.
    version: '2026-10-29.1' as const,
    classifierProfile: classification.classifierProfile,
    readerKind: observation.readerKind,
    vendorNetwork: vendorIpReceipt(observation.vendorIpEvidence),
    directoryPublication: { ...evidence.directoryPublication },
    declarations: {
      status: classification.declarations.status,
      candidateCount: classification.declarations.candidates.length,
      candidateNames: [...classification.declarations.candidates].sort().join(',') || 'none',
      categoryAgreement: classification.categoryAgreement,
    },
    signature: {
      evidenceVersion: evidence.version,
      source: evidence.source,
      verifierProfile: evidence.verifierProfile ?? 'not-applicable',
      status: evidence.localStatus,
      outcome: evidence.localOutcome,
      reason: evidence.localReason ?? 'none',
      reasonCount: evidence.localReasons.length,
      reasonNames: [...evidence.localReasons].sort().join(',') || 'none',
      signer,
      signerDisplayProfile: SIGNER_DISPLAY_PROFILE,
      documentedVendorStatus: evidence.vendor.status,
      userAgentCovered: booleanState(evidence.vendor.userAgentCovered),
      ...(selection === null ? {} : { selection: { ...selection } }),
      coverage: coverage === null ? { status: 'unavailable' as const } : {
        status: 'recorded' as const,
        authority: coverage.covered.authority, targetUri: coverage.covered.targetUri,
        method: coverage.covered.method, path: coverage.covered.path,
        query: coverage.covered.query, userAgent: coverage.covered.userAgent,
        contentDigest: coverage.covered.contentDigest,
        replayPolicy: coverage.replayPolicy,
      },
    },
    native: {
      verifiedBot: booleanState(evidence.native.verifiedBot),
      signedAgent: booleanState(evidence.native.signedAgent),
      categoryStatus: evidence.native.category.status,
      categoryValue: evidence.native.category.value ?? 'none',
    },
  };
}

export type StoredObservationReceipt = ReturnType<typeof storedObservationReceipt>;

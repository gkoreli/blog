import type { PageObservation } from './db.js';
import type { ClassificationEvidence } from './classification-evidence.js';
import type { VerificationEvidence } from './signature-evidence.js';
import { PUBLIC_SIGNERS, type PublicSignerName } from './signers.js';

type ReceiptInput = Pick<PageObservation, 'readerKind' | 'signatureStatus' | 'signatureAgent'> & {
  classificationEvidence: ClassificationEvidence;
  signatureEvidence: VerificationEvidence;
};

/** Closed projections of the values passed to the insert, never a second verdict.
 * Snapshot before the insert; emit only after D1 acknowledges its one-row write.
 * The caller supplies the existing operationId, not a new reader/row correlator.
 */
export function storedObservationReceipt(observation: ReceiptInput) {
  const evidence = observation.signatureEvidence;
  const classification = observation.classificationEvidence;
  const coverage = evidence.coverage;
  const signer: PublicSignerName | null = evidence.source === 'local-webbotauth'
    && evidence.localOutcome === 'verified' && observation.signatureStatus === 'verified'
    ? PUBLIC_SIGNERS.find(signer => signer.origin === observation.signatureAgent)?.name ?? 'Other' : null;
  return {
    version: '2026-10-27.1' as const,
    classifierProfile: classification.classifierProfile,
    readerKind: observation.readerKind,
    declarations: {
      status: classification.declarations.status,
      candidates: [...classification.declarations.candidates],
      categoryAgreement: classification.categoryAgreement,
    },
    signature: {
      evidenceVersion: evidence.version,
      source: evidence.source,
      verifierProfile: evidence.verifierProfile,
      status: evidence.localStatus,
      outcome: evidence.localOutcome,
      reason: evidence.localReason,
      reasons: [...evidence.localReasons],
      signer,
      documentedVendorStatus: evidence.vendor.status,
      userAgentCovered: evidence.vendor.userAgentCovered,
      coverage: coverage === null ? null : {
        authority: coverage.covered.authority, targetUri: coverage.covered.targetUri,
        method: coverage.covered.method, path: coverage.covered.path,
        query: coverage.covered.query, userAgent: coverage.covered.userAgent,
        contentDigest: coverage.covered.contentDigest,
        replayPolicy: coverage.replayPolicy,
      },
    },
    native: {
      verifiedBot: evidence.native.verifiedBot,
      signedAgent: evidence.native.signedAgent,
      categoryStatus: evidence.native.category.status,
      categoryValue: evidence.native.category.value,
    },
  };
}

export type StoredObservationReceipt = ReturnType<typeof storedObservationReceipt>;

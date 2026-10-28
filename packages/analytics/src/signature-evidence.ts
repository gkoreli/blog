import { VERIFIER_PROFILE_VERSION } from './versions.js';
import type { SignatureEvidence, WebBotAuthResult } from './webbotauth.js';
import type { KnownAgentName } from './classify.js';
import { vendorSignatureEvidence, type VendorSignatureEvidence } from './vendor-signatures.js';
import { nativeCategoryEvidence, type NativeCategoryEvidence } from './native-bot-evidence.js';
import { directoryPublicationEvidence, type DirectoryPublicationEvidence } from './directory-publication.js';

/** These are local-profile outcomes, not universal RFC validity or intent verdicts. */
export const FAILURE_OUTCOMES = {
  'missing-signature-agent': 'invalid', 'missing-signature-input': 'invalid', 'missing-signature': 'invalid',
  'malformed-signature-agent': 'invalid', 'malformed-signature-fields': 'invalid',
  'duplicate-component': 'invalid',
  'malformed-field-component': 'invalid', 'invalid-request-target': 'invalid',
  'invalid-validity-window': 'invalid', 'missing-keyid': 'invalid', 'invalid-signature-agent': 'invalid', 'signature-invalid': 'invalid',
  'bare-uri-signature-agent': 'unsupported', 'unsupported-alg': 'unsupported',
  'non-ascii-signature-base': 'unsupported',
  'directory-unavailable': 'unavailable', 'key-not-found': 'unavailable', 'key-not-yet-valid': 'unavailable', 'key-expired': 'unavailable', 'key-invalid': 'unavailable', 'verification-timeout': 'unavailable',
  'missing-validity': 'policy-rejected', 'not-yet-valid': 'policy-rejected', 'expired': 'policy-rejected', 'validity-policy-exceeded': 'policy-rejected', 'missing-target-component': 'policy-rejected', 'discovery-policy-rejected': 'policy-rejected', 'known-test-key': 'policy-rejected', 'key-metadata-rejected': 'policy-rejected', 'key-metadata-conflict': 'policy-rejected', 'key-validity-conflict': 'policy-rejected',
  'not-web-bot-auth': 'not-applicable', 'no-web-bot-auth-signature': 'not-applicable',
  'unsupported-or-missing-component': 'indeterminate', 'invalid-max-age-policy': 'indeterminate', 'invalid-verification-time': 'indeterminate', 'verification-error': 'indeterminate',
} as const;

type FailureReason = keyof typeof FAILURE_OUTCOMES;
export type VerificationOutcome = typeof FAILURE_OUTCOMES[FailureReason] | 'verified' | 'absent' | 'test-injected';
function knownReason(value: string): value is FailureReason { return Object.hasOwn(FAILURE_OUTCOMES, value); }

export function verificationOutcome(result: WebBotAuthResult, injected = false): VerificationOutcome {
  if (injected) return 'test-injected';
  if (result.status !== 'unverified') return result.status;
  const outcomes = new Set([result.reason, ...result.reasons ?? []].map(reason => knownReason(reason) ? FAILURE_OUTCOMES[reason] : 'indeterminate'));
  return outcomes.size === 1 ? outcomes.values().next().value ?? 'indeterminate' : 'indeterminate';
}

export interface VerificationEvidence {
  version: '2026-10-27.5';
  source: 'local-webbotauth' | 'test-injected';
  verifierProfile: string | null;
  localStatus: WebBotAuthResult['status'];
  localReason: string | null;
  localReasons: string[];
  localOutcome: VerificationOutcome;
  vendor: VendorSignatureEvidence;
  directoryPublication: DirectoryPublicationEvidence;
  coverage: SignatureEvidence | null;
  native: { verifiedBot: boolean | null; signedAgent: boolean | null; category: NativeCategoryEvidence };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Native assessment and local verification are independent; unavailable is null. */
export function verificationEvidence(request: Request, result: WebBotAuthResult, injected = false, declarations: readonly KnownAgentName[] = []): VerificationEvidence {
  const cf: unknown = request.cf;
  const management = record(cf) && record(cf.botManagement) ? cf.botManagement : null;
  return {
    version: '2026-10-27.5', source: injected ? 'test-injected' : 'local-webbotauth',
    verifierProfile: injected ? null : VERIFIER_PROFILE_VERSION,
    localStatus: result.status,
    localReason: result.status === 'unverified' ? knownReason(result.reason) ? result.reason : 'unrecognized-verifier-reason' : null,
    localReasons: result.status === 'unverified' ? [...new Set([result.reason, ...result.reasons ?? []].map(reason => knownReason(reason) ? reason : 'unrecognized-verifier-reason'))].sort() : [],
    localOutcome: verificationOutcome(result, injected),
    vendor: vendorSignatureEvidence(declarations, result, injected),
    directoryPublication: directoryPublicationEvidence(declarations, result, injected),
    coverage: result.status === 'verified' && !injected ? result.evidence ?? null : null,
    native: {
      verifiedBot: typeof management?.verifiedBot === 'boolean' ? management.verifiedBot : null,
      signedAgent: typeof management?.signedAgent === 'boolean' ? management.signedAgent : null,
      category: nativeCategoryEvidence(cf),
    },
  };
}

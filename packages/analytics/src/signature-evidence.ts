import { VERIFIER_PROFILE_VERSION } from './versions.js';
import type { SignatureEvidence, WebBotAuthResult } from './webbotauth.js';

export interface VerificationEvidence {
  version: '2026-10-27.1';
  source: 'local-webbotauth' | 'test-injected';
  verifierProfile: string | null;
  localStatus: WebBotAuthResult['status'];
  localReason: string | null;
  coverage: SignatureEvidence | null;
  native: { verifiedBot: boolean | null; signedAgent: boolean | null };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Native assessment and local verification are independent; unavailable is null. */
export function verificationEvidence(request: Request, result: WebBotAuthResult, injected = false): VerificationEvidence {
  const cf: unknown = request.cf;
  const management = record(cf) && record(cf.botManagement) ? cf.botManagement : null;
  return {
    version: '2026-10-27.1', source: injected ? 'test-injected' : 'local-webbotauth',
    verifierProfile: injected ? null : VERIFIER_PROFILE_VERSION,
    localStatus: result.status,
    localReason: result.status === 'unverified' ? result.reason : null,
    coverage: result.status === 'verified' && !injected ? result.evidence ?? null : null,
    native: {
      verifiedBot: typeof management?.verifiedBot === 'boolean' ? management.verifiedBot : null,
      signedAgent: typeof management?.signedAgent === 'boolean' ? management.signedAgent : null,
    },
  };
}

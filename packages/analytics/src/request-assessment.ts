import { analyzeTraffic } from './classify.js';
import { classificationEvidence } from './classification-evidence.js';
import { clientFormEvidence } from './client-form.js';
import { extractRequestMetadata } from './metadata.js';
import { classifyReaderKind } from './readerkind.js';
import { verifyRequestSignature } from './request-verification.js';
import { verificationEvidence } from './signature-evidence.js';
import { publicSignerName } from './signers.js';
import { verifyVendorIp } from './vendor-ip.js';
import type { WebBotAuthResult } from './webbotauth.js';

export { trustedEdgeAddress } from './vendor-ip.js';

export const REQUEST_ASSESSMENT_VERSION = '2026-11-06.1';

export interface RequestAssessmentDependencies {
  verifySignature?: (request: Request) => Promise<WebBotAuthResult>;
  verifyNetwork?: typeof verifyVendorIp;
  now?: () => Date;
}

/** Assess the actual request. Never accepts a JSON bag of supposedly trusted headers.
 * Returns closed evidence only; does not persist or echo raw headers/addresses. */
export async function assessRequest(request: Request, dependencies: RequestAssessmentDependencies = {}) {
  const metadata = extractRequestMetadata(request, undefined);
  const traffic = analyzeTraffic(metadata.userAgent);
  const [signature, vendorNetwork] = await Promise.all([
    verifyRequestSignature(request, metadata.hasSignatureHeaders, dependencies.verifySignature),
    (dependencies.verifyNetwork ?? verifyVendorIp)(request, traffic.declarations.candidates),
  ]);
  const facts = {
    ...metadata, ...traffic, observationSource: 'edge' as const, signature,
  };
  const reader = classifyReaderKind(facts);
  const verification = verificationEvidence(request, signature, dependencies.verifySignature !== undefined, traffic.declarations.candidates);
  return {
    version: REQUEST_ASSESSMENT_VERSION,
    checkedAt: (dependencies.now?.() ?? new Date()).toISOString(),
    provenance: 'incoming-request' as const,
    classification: { trafficClass: traffic.trafficClass, readerKind: reader.kind,
      reason: reader.kind === 'signed-agent' ? dependencies.verifySignature === undefined ? 'verified-signing-publisher' : 'test-injected-signing-publisher' : reader.reason },
    evidence: classificationEvidence(facts, traffic.declarations),
    clientForm: clientFormEvidence(metadata.userAgent, request.headers.get('Sec-CH-UA-Mobile'), traffic.declarations.browserFamily),
    network: { asn: metadata.asn, vendorNetwork },
    signature: { ...verification, signer: signature.status === 'verified' ? publicSignerName(signature.agent) : null },
    limits: [
      'Header declarations and client-form markers are claims, not authenticated software, hardware or people.',
      'Network lists, Cloudflare categories and signature coverage are independent evidence. A signature may not cover the User-Agent.',
      'Missing evidence stays unresolved. This request does not establish a human trigger, reading, citation or use for training.',
      'This endpoint assesses the request that reaches it; it does not inspect traffic arriving at another site.',
    ],
  };
}

export type RequestAssessment = Awaited<ReturnType<typeof assessRequest>>;

import type { KnownAgentName } from './classify.js';
import type { WebBotAuthResult } from './webbotauth.js';

/** Documented key discovery, independent of the public signer display catalogue.
 * This comparison adds no trust to arbitrary origins and makes no IP/trigger claim.
 * Sources checked 2026-10-27; version the registry when its scope changes.
 */
export const VENDOR_SIGNATURE_METHODS = [{
  vendor: 'Exa', origin: 'https://crawler.exa.ai',
  declarations: ['ExaSearchBot', 'ExaUser'],
  sources: ['https://crawler.exa.ai/', 'https://crawler.exa.ai/exauser'],
}] as const;

export interface VendorSignatureEvidence {
  profile: '2026-10-27.1';
  method: 'documented-signing-origin';
  documentedDeclarationCount: number;
  unmappedDeclarationCount: number;
  status: 'no-declaration' | 'not-configured' | 'not-verified' | 'matching-origin' | 'different-origin' | 'test-injected';
  userAgentCovered: boolean | null;
}

export function vendorSignatureEvidence(names: readonly KnownAgentName[], signature: WebBotAuthResult, injected = false): VendorSignatureEvidence {
  const declarations = new Set(names);
  const methods = VENDOR_SIGNATURE_METHODS.filter(method => method.declarations.some(name => declarations.has(name)));
  const mapped = new Set(methods.flatMap(method => method.declarations.filter(name => declarations.has(name))));
  return {
    profile: '2026-10-27.1', method: 'documented-signing-origin',
    documentedDeclarationCount: mapped.size, unmappedDeclarationCount: declarations.size - mapped.size,
    status: injected ? 'test-injected' : declarations.size === 0 ? 'no-declaration' : methods.length === 0 ? 'not-configured'
      : signature.status !== 'verified' ? 'not-verified'
        : methods.every(method => method.origin === signature.agent) ? 'matching-origin' : 'different-origin',
    userAgentCovered: !injected && signature.status === 'verified' ? signature.evidence?.covered.userAgent ?? null : null,
  };
}

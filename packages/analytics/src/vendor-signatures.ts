import type { KnownAgentName } from './classify.js';
import type { WebBotAuthResult } from './webbotauth.js';

/** Documented key discovery, independent of the public signer display catalogue.
 * This comparison adds no trust to arbitrary origins and makes no IP/trigger claim.
 * Parallel sources checked 2026-10-29; earlier entries retain their dated evidence.
 * Version the registry when its scope changes.
 */
export const VENDOR_SIGNATURE_PROFILE = '2026-10-29.1';
export const VENDOR_SIGNATURE_METHODS = [{
  vendor: 'Exa', origin: 'https://crawler.exa.ai',
  declarations: ['ExaSearchBot', 'ExaUser'],
  sources: ['https://crawler.exa.ai/', 'https://crawler.exa.ai/exauser'],
}, {
  // Experimental, partial rollout: absence of a signature is not impersonation.
  vendor: 'Google', origin: 'https://agent.bot.goog',
  declarations: ['Google-Agent'],
  sources: ['https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth',
    'https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers#google-agent'],
}, {
  vendor: 'Parallel', origin: 'https://shapbot.parallel.ai',
  declarations: ['ShapBot'],
  sources: ['https://parallel.ai/parallel-web-systems-bots'],
}, {
  vendor: 'Parallel', origin: 'https://shap-user.parallel.ai',
  declarations: ['Shap-User'],
  sources: ['https://parallel.ai/parallel-web-systems-bots'],
}] as const;

export interface VendorSignatureEvidence {
  profile: typeof VENDOR_SIGNATURE_PROFILE;
  method: 'documented-signing-origin';
  documentedDeclarationCount: number;
  unmappedDeclarationCount: number;
  expectedOriginCount: number;
  /** Selected verified proof only. Null when no applicable, non-injected proof exists. */
  matchingDeclarationCount: number | null;
  differentOriginDeclarationCount: number | null;
  status: 'no-declaration' | 'not-configured' | 'not-verified' | 'matching-origin' | 'different-origin' | 'conflicting-origins' | 'test-injected';
  userAgentCovered: boolean | null;
}

export function vendorSignatureEvidence(names: readonly KnownAgentName[], signature: WebBotAuthResult, injected = false): VendorSignatureEvidence {
  const declarations = new Set(names);
  const methods = VENDOR_SIGNATURE_METHODS.filter(method => method.declarations.some(name => declarations.has(name)));
  const mapped = new Set(methods.flatMap(method => method.declarations.filter(name => declarations.has(name))));
  const origins = new Set(methods.map(method => method.origin));
  const matching = !injected && signature.status === 'verified' && mapped.size > 0
    ? new Set(methods.filter(method => method.origin === signature.agent)
      .flatMap(method => method.declarations.filter(name => declarations.has(name)))).size : null;
  return {
    profile: VENDOR_SIGNATURE_PROFILE, method: 'documented-signing-origin',
    documentedDeclarationCount: mapped.size, unmappedDeclarationCount: declarations.size - mapped.size,
    expectedOriginCount: origins.size, matchingDeclarationCount: matching,
    differentOriginDeclarationCount: matching === null ? null : mapped.size - matching,
    status: injected ? 'test-injected' : declarations.size === 0 ? 'no-declaration' : methods.length === 0 ? 'not-configured'
      : origins.size > 1 ? 'conflicting-origins' : signature.status !== 'verified' ? 'not-verified'
        : methods.every(method => method.origin === signature.agent) ? 'matching-origin' : 'different-origin',
    userAgentCovered: !injected && signature.status === 'verified' ? signature.evidence?.covered.userAgent ?? null : null,
  };
}

import { analyzeTraffic, type ClientDeclarations } from './classify.js';
import { clientFormEvidence, type ClientFormEvidence } from './client-form.js';
import { browserClaim, type BrowserClaim } from './user-agent-browser.js';
import { platformClaim, type PlatformClaim } from './user-agent-platform.js';
import { claimsFetchMetadataFromProducts, userAgentClaimText, userAgentProducts } from './user-agent-products.js';

export const USER_AGENT_ASSESSMENT_PROFILE = 'user-agent-claims/2026-11-10.2';
export type UserAgentCaution = 'missing-header' | 'empty-header' | 'self-declared-input'
  | 'multiple-client-names' | 'conflicting-browser-claims' | 'unresolved-browser-version'
  | 'conflicting-platform-claims' | 'matches-frozen-platform-pattern'
  | 'form-is-not-hardware' | 'unsupported-mobile-hint' | 'policy-token-is-not-request-identity';

export interface UserAgentAssessment {
  profile: typeof USER_AGENT_ASSESSMENT_PROFILE;
  sourceState: 'missing' | 'empty' | 'present';
  authentication: 'not-performed';
  declarations: ClientDeclarations;
  automationDeclaration: boolean;
  browser: BrowserClaim;
  platform: PlatformClaim;
  form: Pick<ClientFormEvidence, 'form' | 'markers' | 'mobileHint' | 'comparison'>;
  capability: { fetchMetadata: 'claimed-compatible' | 'not-established' };
  cautions: UserAgentCaution[];
}

/** Pure supplied-input assessment: no network, Worker fields, raw echo, storage,
 * high-entropy hint request or identity verification. A recognized token and a
 * successful parse do not establish software execution, hardware or a person. */
export function assessUserAgent(value: string | null, mobileHint: string | null = null): UserAgentAssessment {
  const text = value ?? '';
  const claimText = userAgentClaimText(text);
  const products = userAgentProducts(claimText);
  const traffic = analyzeTraffic(text);
  const browser = browserClaim(products);
  const platform = platformClaim(claimText);
  const form = clientFormEvidence(text, mobileHint, traffic.declarations.browserFamily);
  const sourceState = value === null ? 'missing' : /^[ \t]*$/.test(text) ? 'empty' : 'present';
  const cautions: UserAgentCaution[] = ['self-declared-input', 'form-is-not-hardware'];
  if (sourceState === 'missing') cautions.push('missing-header');
  if (sourceState === 'empty') cautions.push('empty-header');
  if (traffic.declarations.status === 'multiple') cautions.push('multiple-client-names');
  if (browser.state === 'conflicting') cautions.push('conflicting-browser-claims');
  if (browser.state === 'version-unresolved') cautions.push('unresolved-browser-version');
  if (platform.state === 'conflicting') cautions.push('conflicting-platform-claims');
  // These match documented compatibility patterns. They do not prove that the
  // sender is a genuine reduced browser or reveal its hidden actual OS.
  if (platform.family === 'macos' && /\bMac OS X 10[_.]15[_.]7(?=[ \t;),]|$)/i.test(claimText)
    || platform.family === 'windows-nt' && /\bWindows NT 10[_.]0(?=[ \t;),]|$)/i.test(claimText)
    || platform.family === 'android' && platform.major === 10 && /\bAndroid 10; K(?=[ \t;),]|$)/i.test(claimText)
    || platform.family === 'ios' && /\b(?:CPU (?:iPhone )?OS|iPhone OS) 18[_.]6(?=[ \t;),]|$)/i.test(claimText)
      && browser.family === 'safari' && (browser.major ?? 0) >= 26) {
    cautions.push('matches-frozen-platform-pattern');
  }
  if (form.mobileHint === 'unsupported') cautions.push('unsupported-mobile-hint');
  if (traffic.declarations.candidates.some(name => name === 'Google-Extended' || name === 'Applebot-Extended')) cautions.push('policy-token-is-not-request-identity');
  return { profile: USER_AGENT_ASSESSMENT_PROFILE, sourceState, authentication: 'not-performed',
    declarations: traffic.declarations, automationDeclaration: traffic.trafficClass !== 'browser', browser, platform,
    form: { form: form.form, markers: form.markers, mobileHint: form.mobileHint, comparison: form.comparison },
    capability: { fetchMetadata: claimsFetchMetadataFromProducts(text, products) ? 'claimed-compatible' : 'not-established' }, cautions };
}

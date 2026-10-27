import { classifyDevice, userAgentProductNames, type ClientDeclarations } from './classify.js';
import type { DeviceType } from './contracts.js';

export const CLIENT_FORM_PROFILE = '2026-10-27.1';
export const CLIENT_FORMS = ['mobile-marker', 'tablet-marker', 'conflicting-markers', 'mobile-preference', 'non-mobile-preference', 'no-form-marker', 'unknown'] as const;
export type ClientForm = typeof CLIENT_FORMS[number];
export const REPORTED_CLIENT_FORMS = [...CLIENT_FORMS, 'historical-desktop-default', 'historical-mobile-heuristic', 'historical-tablet-heuristic', 'unrecognized-record'] as const;
export type ReportedClientForm = typeof REPORTED_CLIENT_FORMS[number];
export const CLIENT_FORM_LABELS: Record<ReportedClientForm, string> = {
  'mobile-marker': 'Mobile marker in User-Agent',
  'tablet-marker': 'Tablet marker in User-Agent',
  'conflicting-markers': 'Conflicting phone and tablet markers',
  'mobile-preference': 'Mobile preference; no specific UA form marker',
  'non-mobile-preference': 'Non-mobile preference; form unresolved',
  'no-form-marker': 'Recognized browser; no mobile/tablet marker',
  unknown: 'Unknown client form',
  'historical-desktop-default': 'Earlier desktop/default heuristic',
  'historical-mobile-heuristic': 'Earlier mobile heuristic',
  'historical-tablet-heuristic': 'Earlier tablet heuristic',
  'unrecognized-record': 'Unrecognized form-evidence record',
};
const reportForms: ReadonlySet<string> = new Set(REPORTED_CLIENT_FORMS);
export function isReportedClientForm(value: string): value is ReportedClientForm { return reportForms.has(value); }
const MARKERS = ['Mobile', 'iPhone', 'iPod', 'IEMobile', 'iPad', 'Tablet', 'PlayBook'] as const;
type Marker = typeof MARKERS[number];
export interface ClientFormEvidence {
  profile: typeof CLIENT_FORM_PROFILE;
  form: ClientForm;
  markers: Marker[];
  browserFamily: ClientDeclarations['browserFamily'];
  mobileHint: 'mobile' | 'non-mobile' | 'absent' | 'unsupported';
  comparison: 'aligned-mobile' | 'different-indicators' | 'not-comparable';
  /** Deprecated three-value storage contract, explicitly not a hardware verdict. */
  legacyCompatibility: { value: DeviceType; defaulted: boolean };
}

/** Describe claims already sent. No Accept-CH, high-entropy hint or device probe. */
export function clientFormEvidence(userAgent: string, hint: string | null, browserFamily: ClientDeclarations['browserFamily']): ClientFormEvidence {
  const products = userAgentProductNames(userAgent);
  const markers = MARKERS.filter(marker => products.has(marker.toLowerCase()));
  const tablet = markers.some(marker => marker === 'iPad' || marker === 'Tablet' || marker === 'PlayBook');
  const phone = markers.some(marker => marker === 'iPhone' || marker === 'iPod' || marker === 'IEMobile');
  const mobile = phone || markers.includes('Mobile');
  const mobileHint = hint === null ? 'absent' : hint.trim() === '?1' ? 'mobile' : hint.trim() === '?0' ? 'non-mobile' : 'unsupported';
  // iPad commonly includes Mobile for compatibility; that pair is not a conflict.
  const form = tablet && phone ? 'conflicting-markers' : tablet ? 'tablet-marker' : mobile ? 'mobile-marker'
    : mobileHint === 'mobile' ? 'mobile-preference' : mobileHint === 'non-mobile' ? 'non-mobile-preference'
      : browserFamily !== 'unrecognized' ? 'no-form-marker' : 'unknown';
  const comparison = form === 'mobile-marker' && mobileHint === 'mobile' ? 'aligned-mobile'
    : form === 'mobile-marker' && mobileHint === 'non-mobile' || !mobile && !tablet && browserFamily !== 'unrecognized' && mobileHint === 'mobile' ? 'different-indicators' : 'not-comparable';
  const legacy = classifyDevice(userAgent);
  return { profile: CLIENT_FORM_PROFILE, form, markers, browserFamily, mobileHint, comparison,
    legacyCompatibility: { value: legacy, defaulted: legacy === 'desktop' } };
}

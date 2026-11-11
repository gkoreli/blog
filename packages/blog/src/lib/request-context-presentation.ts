import type { ReferrerState } from '@gkoreli/analytics/contracts';

const referrers: Record<ReferrerState, { label: string; meaning: string }> = {
  external: {
    label: 'External source reported',
    meaning: 'An external referrer was supplied. Reloads and history can retain it; this does not verify the source or establish a new search click.',
  },
  internal: {
    label: 'This site reported',
    meaning: 'The request reports this site as its source. The Inspect button makes a request from this page; this is not evidence of a new external arrival.',
  },
  absent: {
    label: 'No referrer supplied',
    meaning: 'The source is unknown. An absent referrer cannot distinguish a typed address, privacy settings or automation.',
  },
  unusable: {
    label: 'Referrer could not be interpreted',
    meaning: 'A value was supplied but this check could not interpret it as a supported source. The original value is not returned.',
  },
};

function knownReferrer(value: unknown): value is ReferrerState {
  return value === 'external' || value === 'internal' || value === 'absent' || value === 'unusable';
}

/** Explain closed request facts without promoting a header into source authentication. */
export function requestContextPresentation(referrerState: unknown, fetchSite: unknown, referrerContext: unknown) {
  const referrer = knownReferrer(referrerState) ? referrers[referrerState]
    : { label: 'Not recorded', meaning: 'This response has no recognized referrer-state record. Its source remains unknown.' };
  const site = fetchSite === 'cross-site' ? 'Cross-site'
    : fetchSite === 'same-origin' ? 'Same origin'
      : fetchSite === 'same-site' ? 'Same site'
        : fetchSite === 'none' ? 'No site initiator reported' : 'Unavailable';
  const conflict = referrerState === 'external' && referrerContext === 'external-with-same-origin';
  return {
    referrer: referrer.label, meaning: referrer.meaning, site,
    consistency: conflict ? 'Needs review: conflicting context'
      : knownReferrer(referrerState) && referrerContext === 'no-conflict-observed' ? 'No conflict observed; source unverified' : 'Not assessed',
    review: conflict ? 'The external referrer and same-origin navigation claim disagree. Review how the client or proxy sets these headers. This does not prove automation.' : null,
  };
}

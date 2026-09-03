export type NegotiatedRepresentation = 'html' | 'markdown' | 'csl-json' | 'bibtex';

interface MediaPreference {
  mediaType: string;
  quality: number;
}

const REPRESENTATION_MEDIA_TYPES: Array<{
  representation: Exclude<NegotiatedRepresentation, 'html'>;
  mediaType: string;
}> = [
  { representation: 'csl-json', mediaType: 'application/vnd.citationstyles.csl+json' },
  { representation: 'bibtex', mediaType: 'application/x-bibtex' },
  { representation: 'markdown', mediaType: 'text/markdown' },
];

function parameterQuality(parameters: string[]): number {
  const qualityParameter = parameters.find(parameter => /^q\s*=/i.test(parameter));
  if (!qualityParameter) return 1;

  const rawQuality = qualityParameter.slice(qualityParameter.indexOf('=') + 1).trim();
  const quality = Number(rawQuality.replace(/^"|"$/g, ''));
  return Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0;
}

function parseAccept(accept: string | null): MediaPreference[] {
  if (accept === null) return [];

  return accept.split(',').flatMap(range => {
    const [rawMediaType, ...parameters] = range.split(';');
    const mediaType = rawMediaType?.trim().toLowerCase();
    if (!mediaType) return [];
    return [{ mediaType, quality: parameterQuality(parameters) }];
  });
}

function qualityFor(preferences: MediaPreference[], mediaType: string): number | undefined {
  const qualities = preferences
    .filter(preference => preference.mediaType === mediaType)
    .map(preference => preference.quality);
  return qualities.length > 0 ? Math.max(...qualities) : undefined;
}

export function negotiateRepresentation(accept: string | null): NegotiatedRepresentation {
  const preferences = parseAccept(accept);
  const htmlQuality = qualityFor(preferences, 'text/html');
  let selected: NegotiatedRepresentation = 'html';
  let selectedQuality = -1;

  for (const candidate of REPRESENTATION_MEDIA_TYPES) {
    const quality = qualityFor(preferences, candidate.mediaType);
    if (quality === undefined || quality === 0) continue;
    if (htmlQuality !== undefined && quality <= htmlQuality) continue;
    if (quality <= selectedQuality) continue;
    selected = candidate.representation;
    selectedQuality = quality;
  }

  return selected;
}

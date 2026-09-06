// HTML evidence for the site's text/html; charset=utf-8 representation.
// RFC 9110 §12.5.1: the most specific matching range determines quality.
function splitQuoted(value: string, separator: string): string[] | null {
  const parts: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let i = 0; i < value.length; i++) {
    const character = value[i];
    if (escaped) { escaped = false; continue; }
    if (quoted && character === '\\') { escaped = true; continue; }
    if (character === '"') quoted = !quoted;
    if (!quoted && character === separator) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  if (quoted || escaped) return null;
  parts.push(value.slice(start));
  return parts;
}

export function htmlAcceptance(accept: string | null): 0 | 1 | null {
  // Keep absence distinct from a supplied header, even though HTTP permits
  // any representation when Accept is absent. This field records evidence.
  if (accept === null) return null;
  const ranges = splitQuoted(accept, ',');
  if (ranges === null) return 0;
  let selectedSpecificity = -1;
  let selectedQuality = 0;
  for (const range of ranges) {
    const segments = splitQuoted(range, ';');
    if (segments === null) continue;
    const [rawType, ...parameters] = segments;
    const mediaType = rawType?.trim().toLowerCase();
    const specificity = mediaType === 'text/html' ? 2 : mediaType === 'text/*' ? 1 : mediaType === '*/*' ? 0 : -1;
    if (specificity < 0) continue;
    let quality = 1;
    let matches = true;
    let parameterCount = 0;
    const names = new Set<string>();
    for (const parameter of parameters) {
      const equals = parameter.indexOf('=');
      if (equals < 1) { matches = false; break; }
      const name = parameter.slice(0, equals).trim().toLowerCase();
      const value = parameter.slice(equals + 1).trim();
      if (names.has(name)) { matches = false; break; }
      names.add(name);
      if (name === 'q') {
        // Invalid weights provide no positive acceptance evidence.
        quality = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value) ? Number(value) : 0;
      } else {
        const decoded = value.startsWith('"') && value.endsWith('"')
          ? value.slice(1, -1).replace(/\\(.)/g, '$1') : value;
        if (name !== 'charset' || decoded.toLowerCase() !== 'utf-8') { matches = false; break; }
        parameterCount++;
      }
    }
    if (!matches) continue;
    const rank = specificity * 2 + parameterCount;
    if (rank > selectedSpecificity) {
      selectedSpecificity = rank;
      selectedQuality = quality;
    } else if (rank === selectedSpecificity) {
      selectedQuality = Math.max(selectedQuality, quality);
    }
  }
  return selectedQuality > 0 ? 1 : 0;
}

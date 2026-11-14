// Verify exact text against the captured live page before offering a paragraph link.
const normalize = text => text.replace(/\s+/g, ' ').trim();
const wordCharacter = character => !!character && /[\p{L}\p{N}_]/u.test(character);
const encodeText = text => encodeURIComponent(text).replace(/[-!'()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());

export function uniqueTextOccurrence(text, phrase) {
  const page = normalize(text).toLocaleLowerCase('en'); const target = normalize(phrase).toLocaleLowerCase('en');
  if (!target) return false;
  let count = 0;
  for (let position = page.indexOf(target); position >= 0; position = page.indexOf(target, position + 1)) {
    const before = page[position - 1]; const after = page[position + target.length];
    if ((wordCharacter(target[0]) && wordCharacter(before)) || (wordCharacter(target.at(-1)) && wordCharacter(after))) continue;
    if (++count > 1) return false;
  }
  return count === 1;
}

export function paragraphLink(unit, liveText, query = '') {
  const fallback = { url: unit.url, label: new URL(unit.url).hash ? 'Open section' : 'Open article', verifiedText: null };
  if (!liveText) return fallback;
  const words = normalize(unit.text).split(' ');
  const queryTerms = new Set((query.toLocaleLowerCase('en').match(/[\p{L}\p{N}][\p{L}\p{N}_-]+/gu) ?? []).filter(word => word.length > 2));
  const candidates = [];
  for (const length of [...new Set([Math.min(24, words.length), Math.min(12, words.length), Math.min(6, words.length), Math.min(3, words.length)])]) {
    if (!length) continue;
    for (let offset = 0; offset + length <= words.length; offset++) {
      const phrase = words.slice(offset, offset + length).join(' ');
      if (phrase.length < 8 || phrase.length > 240) continue;
      const matched = (phrase.toLocaleLowerCase('en').match(/[\p{L}\p{N}][\p{L}\p{N}_-]+/gu) ?? []).filter(word => queryTerms.has(word)).length;
      candidates.push({ phrase, priority: matched * 100 + length - offset / (words.length + 1) });
    }
  }
  candidates.sort((a, b) => b.priority - a.priority);
  for (const { phrase } of candidates) {
    if (!uniqueTextOccurrence(liveText, phrase)) continue;
    const url = new URL(unit.url); url.hash = url.hash.slice(1).split(':~:')[0] + ':~:text=' + encodeText(phrase);
    return { url: url.href, label: 'Open paragraph', verifiedText: phrase };
  }
  return fallback;
}

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

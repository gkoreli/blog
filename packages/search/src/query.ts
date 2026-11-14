const stop = new Set('a an and are as at be been being by can could did do does for from had has have how i if in is it its me my of on or our that the their them there these they this those to us was we were what when where which who will with would you your'.split(' '));
const framing = [
  /^(?:in\s+)?(?:which|what)\s+(?:article|post)\s+(?:did\s+(?:i|we|you)\s+(?:write|talk)\s+about|(?:talks?|talked|writes?|wrote)\s+about|discuss(?:es|ed)?|cover(?:s|ed)?)\s+/iu,
  /^(?:find|show)\s+(?:me\s+)?(?:the|an?)\s+(?:article|post|paragraph)\s+(?:about|on|discussing|covering)\s+/iu,
  /^where\s+(?:did\s+(?:i|we|you)\s+(?:write|talk)\s+about|did\s+(?:i|we|you)\s+discuss|(?:can|could)\s+i\s+find\s+(?:the|an?)\s+(?:article|post|paragraph)\s+about)\s+/iu,
  /^i\s+remember\s+(?:reading\s+)?(?:an?|the)\s+(?:article|post|paragraph)\s+about\s+/iu,
  /^show\s+me\s+where\s+(?:i|we|you)\s+(?:wrote|talked)\s+about\s+/iu,
];

export function normalizeWord(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('en');
}

export function tokenize(text: string): string[] {
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}_+#.-]*/gu) ?? []).map(term => normalizeWord(term.replace(/[.-]+$/gu, ''))).filter(Boolean);
}

/** Keep the whole question for semantic inference; lexical preparation is explicit. */
export function parseQuery(value: string): { text: string; lexical: string; terms: readonly string[]; phrases: readonly string[] } {
  const text = value.trim().replace(/\s+/gu, ' ');
  if (text.length > 512) throw new Error('Please shorten the search to 512 characters.');
  const phrases = [...text.matchAll(/"([^"\n]+)"/gu)].map(match => normalizeWord(match[1] ?? '').trim()).filter(Boolean);
  let topic = text;
  for (const prefix of framing) if (prefix.test(topic)) { topic = topic.replace(prefix, '').trim(); break; }
  const terms = tokenize(topic).filter(term => !stop.has(term));
  if (terms.length > 40) throw new Error('Please use a shorter search.');
  return { text, terms, lexical: terms.join(' '), phrases };
}

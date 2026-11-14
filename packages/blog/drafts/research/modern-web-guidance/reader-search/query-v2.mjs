// Post-validation repair: preserve project/tool/library qualifiers inside the topic.
// The original query.mjs remains frozen with its measured outputs.
const framing = [
  /^(?:in\s+)?(?:which|what)\s+(?:article|post)\s+(?:did\s+(?:i|we|you)\s+(?:write|talk)\s+about|(?:talks?|talked|writes?|wrote)\s+about|discuss(?:es|ed)?|cover(?:s|ed)?)\s+/i,
  /^(?:find|show)\s+(?:me\s+)?(?:the|an?)\s+(?:article|post|paragraph)\s+(?:about|on|discussing|covering)\s+/i,
  /^where\s+(?:did\s+(?:i|we|you)\s+(?:write|talk)\s+about|did\s+(?:i|we|you)\s+discuss|(?:can|could)\s+i\s+find\s+(?:the|an?)\s+(?:article|post|paragraph)\s+about)\s+/i,
  /^i\s+remember\s+(?:reading\s+)?(?:an?|the)\s+(?:article|post|paragraph)\s+about\s+/i,
  /^show\s+me\s+where\s+(?:i|we|you)\s+(?:wrote|talked)\s+about\s+/i,
];

export function focusQuery(value) {
  const original = value.trim().replace(/\s+/g, ' ');
  for (const pattern of framing) {
    if (!pattern.test(original)) continue;
    const focused = original.replace(pattern, '').trim();
    return { original, focused: focused || original, changed: !!focused && focused !== original };
  }
  return { original, focused: original, changed: false };
}

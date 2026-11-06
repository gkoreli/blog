/** Lossless storage encoding of closed UA product declarations, not identities.
 * Bit positions are historical evidence: append a new profile when the current
 * catalogue changes. Never derive this order from the mutable client registry.
 */
export const RETAINED_CLIENT_PRODUCT_PROFILE = '2026-11-06.1';
export const RETAINED_CLIENT_PRODUCTS_20261106 = Object.freeze([
  'AI2Bot', 'AhrefsBot', 'AhrefsSiteAudit', 'Amazonbot', 'Amzn-SearchBot',
  'Amzn-User', 'Applebot', 'Applebot-Extended', 'Baiduspider', 'Bingbot',
  'Bytespider', 'CCBot', 'ChatGPT-User', 'Checkly', 'Claude-Agent',
  'Claude-SearchBot', 'Claude-User', 'Claude-Web', 'ClaudeBot', 'Cohere-AI',
  'Cypress', 'DotBot', 'DuckAssistBot', 'DuckDuckBot', 'ExaSearchBot', 'ExaUser',
  'Facebot', 'GPTBot', 'Google-Agent', 'Google-CloudVertexBot', 'Google-Extended',
  'Google-GeminiNotebook', 'GoogleOther', 'GoogleOther-Image', 'GoogleOther-Video',
  'Googlebot', 'Googlebot-Image', 'Googlebot-Video', 'HeadlessChrome', 'Lightpanda',
  'LinkedInBot', 'MJ12bot', 'Meta-ExternalAds', 'Meta-ExternalAgent',
  'Meta-ExternalFetcher', 'Meta-WebIndexer', 'MistralAI-Index',
  'MistralAI-Training', 'MistralAI-User', 'OAI-AdsBot', 'OAI-SearchBot',
  'Perplexity-User', 'PerplexityBot', 'PetalBot', 'RyteBot', 'SemrushBot',
  'SemrushBot-BA', 'SemrushBot-ESI', 'SemrushBot-FT', 'SemrushBot-OCOB',
  'SemrushBot-SI', 'SemrushBot-SWA', 'Shap-User', 'ShapBot', 'SiteAuditBot',
  'Slack-ImgProxy', 'Slackbot', 'Slackbot-LinkExpanding', 'SplitSignalBot',
  'YandexBot', 'axios', 'facebookexternalhit', 'node-fetch', 'python-httpx',
] as const);

/** Historical arrays used this closed alias vocabulary before the new profile.
 * This is a decoder vocabulary, not a claim that each old producer supported
 * every alias. Other profile/schema coherence needs its own assessment. */
export const LEGACY_RETAINED_CLIENT_PRODUCTS = Object.freeze([
  'AhrefsBot', 'AhrefsSiteAudit', 'Amazonbot', 'Amzn-SearchBot', 'Amzn-User',
  'Applebot', 'Applebot-Extended', 'Baiduspider', 'Bingbot', 'Bytespider', 'CCBot',
  'ChatGPT-User', 'Claude-Agent', 'Claude-SearchBot', 'Claude-User', 'Claude-Web',
  'ClaudeBot', 'Cohere-AI', 'Cypress', 'DuckAssistBot', 'DuckDuckBot',
  'ExaSearchBot', 'ExaUser', 'Facebot', 'GPTBot', 'Google-Agent',
  'Google-CloudVertexBot', 'Google-Extended', 'Google-GeminiNotebook',
  'GoogleOther', 'GoogleOther-Image', 'GoogleOther-Video', 'Googlebot',
  'Googlebot-Image', 'Googlebot-Video', 'HeadlessChrome', 'Lightpanda',
  'LinkedInBot', 'Meta-ExternalAds', 'Meta-ExternalAgent', 'Meta-ExternalFetcher',
  'Meta-WebIndexer', 'MistralAI-Index', 'MistralAI-Training', 'MistralAI-User',
  'OAI-AdsBot', 'OAI-SearchBot', 'Perplexity-User', 'PerplexityBot', 'PetalBot',
  'Shap-User', 'ShapBot', 'Slack-ImgProxy', 'Slackbot', 'Slackbot-LinkExpanding',
  'YandexBot', 'facebookexternalhit',
] as const);

export const RETAINED_CLIENT_PRODUCT_PROFILES = Object.freeze([
  Object.freeze({ profile: RETAINED_CLIENT_PRODUCT_PROFILE, products: RETAINED_CLIENT_PRODUCTS_20261106 }),
] as const);

export interface EncodedMatchedProducts {
  productProfile: typeof RETAINED_CLIENT_PRODUCT_PROFILE;
  /** Minimal lowercase hexadecimal; zero is exactly "0". */
  matchedProductBits: string;
}
const positions = new Map<string, number>(RETAINED_CLIENT_PRODUCTS_20261106.map((product, index) => [product, index] as const));
const legacyProducts: ReadonlySet<string> = new Set(LEGACY_RETAINED_CLIENT_PRODUCTS);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Unknown/duplicate input is a producer error, never silently truncated. */
export function encodeMatchedProducts(products: readonly string[]): EncodedMatchedProducts {
  if (products.length > positions.size || new Set(products).size !== products.length) throw new Error('Invalid matched client products');
  let bits = 0n;
  for (const product of products) {
    const position = positions.get(product);
    if (position === undefined) throw new Error('Unrecognized matched client product');
    bits |= 1n << BigInt(position);
  }
  return { productProfile: RETAINED_CLIENT_PRODUCT_PROFILE, matchedProductBits: bits.toString(16) };
}

/** Field decoder only, not record coherence, current identity or verification.
 * Old arrays remain readable without mutation. Unsupported schema/profile,
 * malformed/mixed encodings and bits outside the frozen budget return null. */
export function retainedMatchedProducts(value: unknown): string[] | null {
  if (!object(value) || !object(value.declarations)) return null;
  const declarations = value.declarations;
  if (value.version === '2026-10-27.2' || value.version === '2026-10-29.1' || value.version === '2026-10-29.2') {
    if (Object.hasOwn(declarations, 'productProfile') || Object.hasOwn(declarations, 'matchedProductBits')) return null;
    const products = declarations.matchedProducts;
    if (!Array.isArray(products) || products.length > legacyProducts.size
      || new Set(products).size !== products.length) return null;
    const dense = Array.from(products);
    if (!dense.every((product: unknown): product is string => typeof product === 'string' && legacyProducts.has(product))) return null;
    return dense.sort();
  }
  if (value.version !== '2026-11-06.1' || Object.hasOwn(declarations, 'matchedProducts')) return null;
  const profile = RETAINED_CLIENT_PRODUCT_PROFILES.find(entry => entry.profile === declarations.productProfile);
  const encoded = declarations.matchedProductBits;
  if (profile === undefined || typeof encoded !== 'string' || encoded.length > Math.ceil(profile.products.length / 4)
    || !/^(?:0|[1-9a-f][0-9a-f]*)$/.test(encoded)) return null;
  const bits = BigInt(`0x${encoded}`);
  if (bits >= 1n << BigInt(profile.products.length)) return null;
  return profile.products.filter((_product, index) => (bits & 1n << BigInt(index)) !== 0n).slice().sort();
}

import type { ReaderKind, TrafficClass } from './contracts.js';

/** Current lexical declarations, independently versioned from verification.
 * A name/role is a request claim, never an authenticated operator or purpose.
 * Historical declaration/method snapshots must not derive from this live table.
 */
export const CLIENT_REGISTRY_PROFILE = '2026-11-06.1';

/** Inherited documentation is a source pointer, not a fresh vendor review.
 * Checked source pins and the new first-party reviews are preserved in research
 * 129 and 2026-11-06-oss-detection-source-ledger.json. */
export const CLIENT_REGISTRY_SOURCES = {
  openai: { url: 'https://developers.openai.com/api/docs/bots', basis: 'inherited-catalogue', checkedOn: null },
  anthropic: { url: 'https://privacy.claude.com/en/articles/8896518', basis: 'inherited-catalogue', checkedOn: null },
  'anthropic-browser': { url: 'https://support.claude.com/en/articles/18234133', basis: 'inherited-catalogue', checkedOn: null },
  perplexity: { url: 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers', basis: 'inherited-catalogue', checkedOn: null },
  meta: { url: 'https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/', basis: 'inherited-catalogue', checkedOn: null },
  mistral: { url: 'https://docs.mistral.ai/robots', basis: 'inherited-catalogue', checkedOn: null },
  amazon: { url: 'https://developer.amazon.com/amazonbot', basis: 'inherited-catalogue', checkedOn: null },
  google: { url: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers', basis: 'inherited-catalogue', checkedOn: null },
  'google-agent': { url: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-agent', basis: 'inherited-catalogue', checkedOn: null },
  'google-vertex': { url: 'https://docs.cloud.google.com/generative-ai-app-builder/docs/prepare-data', basis: 'inherited-catalogue', checkedOn: null },
  apple: { url: 'https://support.apple.com/en-us/119829', basis: 'inherited-catalogue', checkedOn: null },
  duckassist: { url: 'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot/', basis: 'inherited-catalogue', checkedOn: null },
  exa: { url: 'https://crawler.exa.ai/', basis: 'inherited-catalogue', checkedOn: null },
  'exa-user': { url: 'https://exauser.crawler.exa.ai/', basis: 'inherited-catalogue', checkedOn: null },
  ahrefs: { url: 'https://ahrefs.com/robot', basis: 'inherited-catalogue', checkedOn: null },
  parallel: { url: 'https://parallel.ai/parallel-web-systems-bots', basis: 'inherited-catalogue', checkedOn: null },
  slack: { url: 'https://api.slack.com/robots', basis: 'inherited-catalogue', checkedOn: null },
  'legacy-catalogue': { url: 'https://github.com/gkoreli/blog/blob/18606bd538c3899ea8786abd71517519df5834cd/packages/analytics/src/classify.ts', basis: 'inherited-catalogue', checkedOn: null },
  ai2: { url: 'https://allenai.org/crawler', basis: 'first-party-documentation', checkedOn: '2026-11-06' },
  semrush: { url: 'https://www.semrush.com/bot/', basis: 'first-party-documentation', checkedOn: '2026-11-06' },
  majestic: { url: 'https://www.mj12bot.com/', basis: 'first-party-documentation', checkedOn: '2026-11-06' },
  moz: { url: 'https://dc8hdnsmzapvm.cloudfront.net/help/moz-procedures/crawlers/dotbot', basis: 'first-party-documentation', checkedOn: '2026-11-06' },
  httpx: { url: 'https://github.com/encode/httpx/blob/b5addb64f0161ff6bfe94c124ef76f6a1fba5254/httpx/_client.py#L119', basis: 'first-party-source', checkedOn: '2026-11-06' },
  axios: { url: 'https://github.com/axios/axios/blob/1fcaf82dd3637afd57454fc5abd5e3458f619bcf/lib/adapters/http.js#L911-L915', basis: 'first-party-source', checkedOn: '2026-11-06' },
  'node-fetch': { url: 'https://github.com/node-fetch/node-fetch/blob/8b3320d2a7c07bce4afc6b2bf6c3bbddda85b01f/src/request.js#L277-L278', basis: 'first-party-source', checkedOn: '2026-11-06' },
  checkly: { url: 'https://www.checklyhq.com/blog/changelog-march-2021/', basis: 'first-party-documentation', checkedOn: '2026-11-06' },
} as const;

interface ClientDefinitionShape {
  readonly name: string;
  readonly products: readonly string[];
  readonly trafficClass: Exclude<TrafficClass, 'browser'>;
  readonly readerKind: ReaderKind;
  readonly source: keyof typeof CLIENT_REGISTRY_SOURCES;
}

const CLIENT_DEFINITIONS = [
  { name: 'Shap-User', products: ['Shap-User'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'parallel' },
  { name: 'ShapBot', products: ['ShapBot'], trafficClass: 'ai', readerKind: 'ai-search', source: 'parallel' },
  { name: 'ExaUser', products: ['ExaUser'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'exa-user' },
  { name: 'ExaSearchBot', products: ['ExaSearchBot'], trafficClass: 'ai', readerKind: 'ai-search', source: 'exa' },
  { name: 'ChatGPT-User', products: ['ChatGPT-User'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'openai' },
  { name: 'Claude-User', products: ['Claude-User'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'anthropic' },
  { name: 'Claude-Agent', products: ['Claude-Agent'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'anthropic-browser' },
  { name: 'Perplexity-User', products: ['Perplexity-User'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'perplexity' },
  { name: 'Meta-ExternalFetcher', products: ['Meta-ExternalFetcher'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'meta' },
  { name: 'MistralAI-User', products: ['MistralAI-User'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'mistral' },
  { name: 'DuckAssistBot', products: ['DuckAssistBot'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'duckassist' },
  { name: 'Amzn-User', products: ['Amzn-User'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'amazon' },
  { name: 'Google-Agent', products: ['Google-Agent'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'google-agent' },
  { name: 'Google-GeminiNotebook', products: ['Google-GeminiNotebook'], trafficClass: 'ai', readerKind: 'ai-assistant', source: 'google-agent' },
  { name: 'OAI-SearchBot', products: ['OAI-SearchBot'], trafficClass: 'ai', readerKind: 'ai-search', source: 'openai' },
  { name: 'Claude-SearchBot', products: ['Claude-SearchBot'], trafficClass: 'ai', readerKind: 'ai-search', source: 'anthropic' },
  { name: 'PerplexityBot', products: ['PerplexityBot'], trafficClass: 'ai', readerKind: 'ai-search', source: 'perplexity' },
  { name: 'MistralAI-Index', products: ['MistralAI-Index'], trafficClass: 'ai', readerKind: 'ai-search', source: 'mistral' },
  { name: 'Amzn-SearchBot', products: ['Amzn-SearchBot'], trafficClass: 'ai', readerKind: 'ai-search', source: 'amazon' },
  { name: 'Meta-WebIndexer', products: ['Meta-WebIndexer'], trafficClass: 'ai', readerKind: 'ai-search', source: 'meta' },
  { name: 'GPTBot', products: ['GPTBot'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'openai' },
  { name: 'ClaudeBot', products: ['ClaudeBot'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'anthropic' },
  { name: 'MistralAI-Training', products: ['MistralAI-Training'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'mistral' },
  { name: 'Meta-ExternalAgent', products: ['Meta-ExternalAgent'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'meta' },
  { name: 'Amazonbot', products: ['Amazonbot'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'amazon' },
  { name: 'CCBot', products: ['CCBot'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'legacy-catalogue' },
  { name: 'Google-CloudVertexBot', products: ['Google-CloudVertexBot'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'google-vertex' },
  { name: 'Applebot', products: ['Applebot'], trafficClass: 'ai', readerKind: 'ai-search', source: 'apple' },
  { name: 'Bytespider', products: ['Bytespider'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'legacy-catalogue' },
  { name: 'PetalBot', products: ['PetalBot'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'legacy-catalogue' },
  { name: 'Cohere-AI', products: ['Cohere-AI'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'legacy-catalogue' },
  { name: 'Claude-Web', products: ['Claude-Web'], trafficClass: 'ai', readerKind: 'other-bot', source: 'legacy-catalogue' },
  { name: 'GoogleOther', products: ['GoogleOther', 'GoogleOther-Image', 'GoogleOther-Video'], trafficClass: 'bot', readerKind: 'other-bot', source: 'google' },
  { name: 'Meta-ExternalAds', products: ['Meta-ExternalAds'], trafficClass: 'bot', readerKind: 'other-bot', source: 'meta' },
  { name: 'AhrefsSiteAudit', products: ['AhrefsSiteAudit'], trafficClass: 'bot', readerKind: 'seo-crawler', source: 'ahrefs' },
  { name: 'AhrefsBot', products: ['AhrefsBot'], trafficClass: 'bot', readerKind: 'seo-crawler', source: 'ahrefs' },
  { name: 'OAI-AdsBot', products: ['OAI-AdsBot'], trafficClass: 'bot', readerKind: 'other-bot', source: 'openai' },
  { name: 'Google-Extended', products: ['Google-Extended'], trafficClass: 'bot', readerKind: 'other-bot', source: 'google' },
  { name: 'Applebot-Extended', products: ['Applebot-Extended'], trafficClass: 'bot', readerKind: 'other-bot', source: 'apple' },
  { name: 'Googlebot', products: ['Googlebot', 'Googlebot-Image', 'Googlebot-Video'], trafficClass: 'bot', readerKind: 'search-crawler', source: 'google' },
  { name: 'Bingbot', products: ['Bingbot'], trafficClass: 'bot', readerKind: 'search-crawler', source: 'legacy-catalogue' },
  { name: 'DuckDuckBot', products: ['DuckDuckBot'], trafficClass: 'bot', readerKind: 'search-crawler', source: 'legacy-catalogue' },
  { name: 'YandexBot', products: ['YandexBot'], trafficClass: 'bot', readerKind: 'search-crawler', source: 'legacy-catalogue' },
  { name: 'Baiduspider', products: ['Baiduspider'], trafficClass: 'bot', readerKind: 'search-crawler', source: 'legacy-catalogue' },
  { name: 'FacebookBot', products: ['facebookexternalhit', 'Facebot'], trafficClass: 'bot', readerKind: 'preview-or-feed', source: 'meta' },
  { name: 'LinkedInBot', products: ['LinkedInBot'], trafficClass: 'bot', readerKind: 'preview-or-feed', source: 'legacy-catalogue' },
  { name: 'Slackbot', products: ['Slackbot'], trafficClass: 'bot', readerKind: 'other-bot', source: 'slack' },
  { name: 'Slackbot-LinkExpanding', products: ['Slackbot-LinkExpanding'], trafficClass: 'bot', readerKind: 'preview-or-feed', source: 'slack' },
  { name: 'Slack-ImgProxy', products: ['Slack-ImgProxy'], trafficClass: 'bot', readerKind: 'preview-or-feed', source: 'slack' },
  { name: 'HeadlessChrome', products: ['HeadlessChrome'], trafficClass: 'bot', readerKind: 'headless-browser', source: 'legacy-catalogue' },
  { name: 'Cypress', products: ['Cypress'], trafficClass: 'bot', readerKind: 'headless-browser', source: 'legacy-catalogue' },
  { name: 'Lightpanda', products: ['Lightpanda'], trafficClass: 'bot', readerKind: 'headless-browser', source: 'legacy-catalogue' },
  // New entries are reviewed request declarations, not new verification methods.
  { name: 'AI2Bot', products: ['AI2Bot'], trafficClass: 'ai', readerKind: 'ai-crawler', source: 'ai2' },
  { name: 'SemrushBot', products: ['SemrushBot', 'SemrushBot-BA', 'SemrushBot-SI', 'SemrushBot-SWA', 'SemrushBot-OCOB', 'SemrushBot-FT', 'SemrushBot-ESI'], trafficClass: 'bot', readerKind: 'seo-crawler', source: 'semrush' },
  { name: 'SiteAuditBot', products: ['SiteAuditBot'], trafficClass: 'bot', readerKind: 'seo-crawler', source: 'semrush' },
  { name: 'SplitSignalBot', products: ['SplitSignalBot'], trafficClass: 'bot', readerKind: 'seo-crawler', source: 'semrush' },
  { name: 'RyteBot', products: ['RyteBot'], trafficClass: 'bot', readerKind: 'seo-crawler', source: 'semrush' },
  { name: 'MJ12bot', products: ['MJ12bot'], trafficClass: 'bot', readerKind: 'seo-crawler', source: 'majestic' },
  { name: 'DotBot', products: ['DotBot'], trafficClass: 'bot', readerKind: 'seo-crawler', source: 'moz' },
  { name: 'python-httpx', products: ['python-httpx'], trafficClass: 'bot', readerKind: 'http-client', source: 'httpx' },
  { name: 'axios', products: ['axios'], trafficClass: 'bot', readerKind: 'http-client', source: 'axios' },
  { name: 'node-fetch', products: ['node-fetch'], trafficClass: 'bot', readerKind: 'http-client', source: 'node-fetch' },
  // Checkly's documented API marker. Its comma-delimited browser comment is
  // deliberately not made an exact UA product by this registry.
  { name: 'Checkly', products: ['Checkly'], trafficClass: 'bot', readerKind: 'other-bot', source: 'checkly' },
] as const satisfies readonly ClientDefinitionShape[];

/** Export immutable domain values: JavaScript consumers must not change the
 * role or alias objects shared by the classification lookup maps. */
export const CLIENT_REGISTRY = Object.freeze(CLIENT_DEFINITIONS.map(definition => Object.freeze({
  ...definition, products: Object.freeze(definition.products),
})));

export type ClientDefinition = typeof CLIENT_REGISTRY[number];
export type KnownClientName = ClientDefinition['name'];
export type KnownClientProduct = ClientDefinition['products'][number];

const definitionsByName = new Map<string, ClientDefinition>();
const definitionsByProduct = new Map<string, { definition: ClientDefinition; product: KnownClientProduct }[]>();
const knownNames = new Set<KnownClientName>();
const knownProducts = new Set<KnownClientProduct>();
for (const definition of CLIENT_REGISTRY) {
  definitionsByName.set(definition.name, definition);
  knownNames.add(definition.name);
  for (const product of definition.products) {
    knownProducts.add(product);
    const key = product.toLowerCase();
    const matches = definitionsByProduct.get(key) ?? [];
    matches.push({ definition, product });
    definitionsByProduct.set(key, matches);
  }
}
export const KNOWN_CLIENT_NAMES: ReadonlySet<KnownClientName> = knownNames;
export const KNOWN_CLIENT_PRODUCTS: ReadonlySet<KnownClientProduct> = knownProducts;

export function clientDefinition(name: string): ClientDefinition | null {
  return definitionsByName.get(name) ?? null;
}
export function clientReaderKind(name: string): ReaderKind | null {
  return clientDefinition(name)?.readerKind ?? null;
}
export function clientTrafficClass(name: string): Exclude<TrafficClass, 'browser'> | null {
  return clientDefinition(name)?.trafficClass ?? null;
}

/** Input names come from the shared UA lexer, never a raw-header substring.
 * Collect every matching canonical declaration and alias; order selects none.
 */
export function clientDeclarationsFromProducts(products: ReadonlySet<string>): {
  candidates: KnownClientName[]; matchedProducts: KnownClientProduct[];
} {
  const candidates = new Set<KnownClientName>();
  const matchedProducts = new Set<KnownClientProduct>();
  for (const name of products) {
    for (const match of definitionsByProduct.get(name.toLowerCase()) ?? []) {
      candidates.add(match.definition.name);
      matchedProducts.add(match.product);
    }
  }
  return { candidates: [...candidates].sort(), matchedProducts: [...matchedProducts].sort() };
}

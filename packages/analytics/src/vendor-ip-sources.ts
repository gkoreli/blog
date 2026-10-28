/** Fixed, reviewed public endpoints. No URL derives from a request header.
 * Perplexity .com documentation links redirect to these observed .ai endpoints.
 * Version/extend deliberately; general cloud/ASN membership is not a method.
 */
export const VENDOR_IP_SOURCES = [
  { id: 'ahrefs-crawlers', vendor: 'Ahrefs', declarations: ['AhrefsBot', 'AhrefsSiteAudit'], url: 'https://api.ahrefs.com/v3/public/crawler-ip-ranges', documentation: 'https://ahrefs.com/robot', mediaTypes: ['application/json'] },
  { id: 'google-common', vendor: 'Google', declarations: ['Googlebot'], url: 'https://developers.google.com/static/crawling/ipranges/common-crawlers.json', documentation: 'https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests', mediaTypes: ['application/json'] },
  { id: 'openai-ads', vendor: 'OpenAI', declarations: ['OAI-AdsBot'], url: 'https://openai.com/adsbot.json', documentation: 'https://developers.openai.com/api/docs/bots', mediaTypes: ['application/json'] },
  { id: 'openai-gpt', vendor: 'OpenAI', declarations: ['GPTBot'], url: 'https://openai.com/gptbot.json', documentation: 'https://developers.openai.com/api/docs/bots', mediaTypes: ['application/json'] },
  { id: 'openai-search', vendor: 'OpenAI', declarations: ['OAI-SearchBot'], url: 'https://openai.com/searchbot.json', documentation: 'https://developers.openai.com/api/docs/bots', mediaTypes: ['application/json'] },
  // The live official user feed serves octet-stream, unlike the other OpenAI feeds.
  { id: 'openai-user', vendor: 'OpenAI', declarations: ['ChatGPT-User'], url: 'https://openai.com/chatgpt-user.json', documentation: 'https://developers.openai.com/api/docs/bots', mediaTypes: ['application/json', 'application/octet-stream'] },
  { id: 'perplexity-bot', vendor: 'Perplexity', declarations: ['PerplexityBot'], url: 'https://www.perplexity.ai/perplexitybot.json', documentation: 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers', mediaTypes: ['application/json'] },
  { id: 'perplexity-user', vendor: 'Perplexity', declarations: ['Perplexity-User'], url: 'https://www.perplexity.ai/perplexity-user.json', documentation: 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers', mediaTypes: ['application/json'] },
  // Append new sources to preserve the existing bounded fanout order.
  // These per-client methods do not extend to DuckAssistBot or Gemini Notebook.
  { id: 'duckduckbot', vendor: 'DuckDuckGo', declarations: ['DuckDuckBot'], url: 'https://duckduckgo.com/duckduckbot.json', documentation: 'https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot', mediaTypes: ['application/json'] },
  { id: 'google-agent', vendor: 'Google', declarations: ['Google-Agent'], url: 'https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json', documentation: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers#google-agent', mediaTypes: ['application/json'] },
] as const;
export type VendorIpSource = typeof VENDOR_IP_SOURCES[number];
export type VendorIpSourceId = VendorIpSource['id'];

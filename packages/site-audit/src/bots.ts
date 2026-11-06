import type { BotRuleAssessment } from './contracts.js';

type BotProfile = Pick<BotRuleAssessment, 'token' | 'provider' | 'role' | 'source'>;
const openai = 'https://developers.openai.com/api/docs/bots';
const anthropic = 'https://privacy.claude.com/en/articles/8896518';
const perplexity = 'https://docs.perplexity.ai/guides/bots';
const google = 'https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers';
/** Reviewed policy product tokens. This is not a claim that each product obeys
 * robots.txt on every user-triggered fetch, or that its name authenticates it. */
export const BOT_PROFILES: readonly BotProfile[] = [
  { token: 'GPTBot', provider: 'OpenAI', role: 'training-control', source: openai },
  { token: 'OAI-SearchBot', provider: 'OpenAI', role: 'search', source: openai },
  { token: 'ChatGPT-User', provider: 'OpenAI', role: 'assistant', source: openai },
  { token: 'ClaudeBot', provider: 'Anthropic', role: 'training-control', source: anthropic },
  { token: 'Claude-SearchBot', provider: 'Anthropic', role: 'search', source: anthropic },
  { token: 'Claude-User', provider: 'Anthropic', role: 'assistant', source: anthropic },
  { token: 'PerplexityBot', provider: 'Perplexity', role: 'search', source: perplexity },
  { token: 'Perplexity-User', provider: 'Perplexity', role: 'assistant', source: perplexity },
  { token: 'Googlebot', provider: 'Google', role: 'search', source: google },
  { token: 'Google-Extended', provider: 'Google', role: 'training-control', source: google },
  { token: 'GoogleOther', provider: 'Google', role: 'other', source: google },
  { token: 'bingbot', provider: 'Microsoft', role: 'search', source: 'https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0' },
  { token: 'Applebot', provider: 'Apple', role: 'search', source: 'https://support.apple.com/en-us/119829' },
  { token: 'Applebot-Extended', provider: 'Apple', role: 'training-control', source: 'https://support.apple.com/en-us/119829' },
  { token: 'CCBot', provider: 'Common Crawl', role: 'training-control', source: 'https://commoncrawl.org/ccbot' },
  { token: 'Amazonbot', provider: 'Amazon', role: 'other', source: 'https://developer.amazon.com/amazonbot' },
  { token: 'DuckAssistBot', provider: 'DuckDuckGo', role: 'assistant', source: 'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot/' },
  { token: 'MistralAI-User', provider: 'Mistral AI', role: 'assistant', source: 'https://docs.mistral.ai/robots' },
  { token: 'MistralAI-Index', provider: 'Mistral AI', role: 'search', source: 'https://docs.mistral.ai/robots' },
  { token: 'MistralAI-Training', provider: 'Mistral AI', role: 'training-control', source: 'https://docs.mistral.ai/robots' },
  { token: 'ShapBot', provider: 'Parallel', role: 'search', source: 'https://parallel.ai/parallel-web-systems-bots' },
  { token: 'Shap-User', provider: 'Parallel', role: 'assistant', source: 'https://parallel.ai/parallel-web-systems-bots' },
  { token: 'ExaSearchBot', provider: 'Exa', role: 'search', source: 'https://crawler.exa.ai/' },
  { token: 'ExaUser', provider: 'Exa', role: 'assistant', source: 'https://exauser.crawler.exa.ai/' },
  { token: 'meta-externalagent', provider: 'Meta', role: 'training-control', source: 'https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/' },
  { token: 'meta-externalfetcher', provider: 'Meta', role: 'assistant', source: 'https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/' },
];

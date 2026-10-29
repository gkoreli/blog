import type { DeviceType, TrafficClass } from './contracts.js';

/**
 * Named rule catalogue (initial review 2026-09-03; Meta-ExternalAds added 2026-10-29).
 *
 * These are exact lexical User-Agent product claims, not verified identities.
 * All canonical candidates and matched product aliases are retained; multiple
 * candidates abstain from selecting a name. Reviewed boundaries 2026-10-27.
 * Googlebot Image/Video aliases: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
 * Slack variants: https://api.slack.com/robots. The general Slackbot token
 * does not establish link expansion; its historical role remains reportable. The vendor
 * documentation recorded in research artifact 06 is the source for each current
 * AI rule family:
 *
 * - OpenAI — GPTBot, ChatGPT-User, OAI-SearchBot, OAI-AdsBot (ad validation, not training):
 *   https://developers.openai.com/api/docs/bots
 * - Anthropic — ClaudeBot, Claude-User, Claude-SearchBot:
 *   https://support.claude.com/en/articles/8896518
 * - Perplexity — PerplexityBot, Perplexity-User:
 *   https://docs.perplexity.ai/guides/bots
 * - Meta — Meta-ExternalAgent, Meta-ExternalFetcher, Meta-WebIndexer, FacebookBot:
 *   https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/
 *   Meta-ExternalAds: advertising/business crawling, not an AI training role.
 * - Mistral — MistralAI-User, MistralAI-Index, MistralAI-Training:
 *   https://docs.mistral.ai/robots
 * - Amazon — Amazonbot, Amzn-User, Amzn-SearchBot:
 *   https://developer.amazon.com/amazonbot
 * - Google — Google-Agent, Google-GeminiNotebook, Google-CloudVertexBot:
 *   https://developers.google.com/crawling/docs/crawlers-fetchers/google-agent
 * - Apple — Applebot:
 *   https://support.apple.com/en-us/119829
 * - DuckDuckGo — DuckAssistBot:
 *   https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot/
 * - Exa — ExaSearchBot and ExaUser (added 2026-10-25):
 *   https://crawler.exa.ai/ and https://crawler.exa.ai/exauser
 * - Ahrefs — AhrefsBot and AhrefsSiteAudit (added 2026-10-25):
 *   https://ahrefs.com/robot
 * - Parallel — ShapBot (search indexing), Shap-User (retrieval on behalf of users):
 *   https://parallel.ai/parallel-web-systems-bots (checked 2026-10-29).
 *
 * Google-Extended and Applebot-Extended are robots.txt product tokens that the
 * vendors say are not request User-Agents. A request containing either is stored
 * as a named bot claim, never as the corresponding vendor crawler. CCBot warns
 * that its token is spoofable. Bytespider, Cohere-AI, Claude-Web, GoogleOther,
 * and PetalBot remain literal legacy/undocumented tokens, not vendor attribution.
 * HeadlessChrome, Cypress, and Lightpanda are self-declared automation tokens.
 *
 * OpenClaw's documented Accept ordering (`text/markdown, text/html;q=0.9`) is a
 * useful future tell, but it is deliberately neither classified nor stored here.
 * Source: https://github.com/openclaw/openclaw/blob/main/src/agents/tools/web-fetch.ts
 */

export interface TrafficClassification {
  trafficClass: TrafficClass;
  agentName: string | null;
}

interface AgentRule {
  name: string;
  products: readonly string[];
}

const AI_RULES = [
  { name: 'Shap-User', products: ['Shap-User'] },
  { name: 'ShapBot', products: ['ShapBot'] },
  { name: 'ExaUser', products: ['ExaUser'] },
  { name: 'ExaSearchBot', products: ['ExaSearchBot'] },
  { name: 'ChatGPT-User', products: ['ChatGPT-User'] },
  { name: 'Claude-User', products: ['Claude-User'] },
  { name: 'Perplexity-User', products: ['Perplexity-User'] },
  { name: 'Meta-ExternalFetcher', products: ['Meta-ExternalFetcher'] },
  { name: 'MistralAI-User', products: ['MistralAI-User'] },
  { name: 'DuckAssistBot', products: ['DuckAssistBot'] },
  { name: 'Amzn-User', products: ['Amzn-User'] },
  { name: 'Google-GeminiNotebook', products: ['Google-GeminiNotebook'] },
  { name: 'Google-Agent', products: ['Google-Agent'] },
  { name: 'OAI-SearchBot', products: ['OAI-SearchBot'] },
  { name: 'Claude-SearchBot', products: ['Claude-SearchBot'] },
  { name: 'PerplexityBot', products: ['PerplexityBot'] },
  { name: 'MistralAI-Index', products: ['MistralAI-Index'] },
  { name: 'Amzn-SearchBot', products: ['Amzn-SearchBot'] },
  { name: 'Meta-WebIndexer', products: ['Meta-WebIndexer'] },
  { name: 'Applebot', products: ['Applebot'] },
  { name: 'GPTBot', products: ['GPTBot'] },
  { name: 'ClaudeBot', products: ['ClaudeBot'] },
  { name: 'MistralAI-Training', products: ['MistralAI-Training'] },
  { name: 'Meta-ExternalAgent', products: ['Meta-ExternalAgent'] },
  { name: 'Amazonbot', products: ['Amazonbot'] },
  { name: 'CCBot', products: ['CCBot'] },
  { name: 'Google-CloudVertexBot', products: ['Google-CloudVertexBot'] },
  { name: 'Bytespider', products: ['Bytespider'] },
  { name: 'PetalBot', products: ['PetalBot'] },
  { name: 'Cohere-AI', products: ['Cohere-AI'] },
  { name: 'Claude-Web', products: ['Claude-Web'] },
  { name: 'GoogleOther', products: ['GoogleOther'] },
] as const satisfies readonly AgentRule[];

const BOT_RULES = [
  { name: 'Meta-ExternalAds', products: ['Meta-ExternalAds'] },
  { name: 'AhrefsSiteAudit', products: ['AhrefsSiteAudit'] },
  { name: 'AhrefsBot', products: ['AhrefsBot'] },
  { name: 'OAI-AdsBot', products: ['OAI-AdsBot'] },
  { name: 'Google-Extended', products: ['Google-Extended'] },
  { name: 'Applebot-Extended', products: ['Applebot-Extended'] },
  { name: 'Googlebot', products: ['Googlebot', 'Googlebot-Image', 'Googlebot-Video'] },
  { name: 'Bingbot', products: ['Bingbot'] },
  { name: 'DuckDuckBot', products: ['DuckDuckBot'] },
  { name: 'YandexBot', products: ['YandexBot'] },
  { name: 'Baiduspider', products: ['Baiduspider'] },
  { name: 'FacebookBot', products: ['facebookexternalhit', 'Facebot'] },
  { name: 'LinkedInBot', products: ['LinkedInBot'] },
  { name: 'Slackbot', products: ['Slackbot'] },
  { name: 'Slackbot-LinkExpanding', products: ['Slackbot-LinkExpanding'] },
  { name: 'Slack-ImgProxy', products: ['Slack-ImgProxy'] },
  { name: 'HeadlessChrome', products: ['HeadlessChrome'] },
  { name: 'Cypress', products: ['Cypress'] },
  { name: 'Lightpanda', products: ['Lightpanda'] },
] as const satisfies readonly AgentRule[];

const GENERIC_BOT = /bot\b|spider|crawler|crawl\b|slurp|scrapy|headless|phantom|selenium|wget|curl\/|python-requests|Go-http-client|UptimeRobot|Lighthouse/i;

export const KNOWN_AGENT_NAMES: ReadonlySet<string> = new Set([
  ...AI_RULES.map((rule) => rule.name),
  ...BOT_RULES.map((rule) => rule.name),
]);

export function knownAgentTrafficClass(agentName: string): Exclude<TrafficClass, 'browser'> | null {
  if (AI_RULES.some((rule) => rule.name === agentName)) return 'ai';
  if (BOT_RULES.some((rule) => rule.name === agentName)) return 'bot';
  return null;
}

export type KnownAgentName = typeof AI_RULES[number]['name'] | typeof BOT_RULES[number]['name'];
export type KnownProduct = typeof AI_RULES[number]['products'][number] | typeof BOT_RULES[number]['products'][number];
export const KNOWN_CLIENT_PRODUCTS: ReadonlySet<KnownProduct> = new Set([...AI_RULES, ...BOT_RULES].flatMap(rule => rule.products));

/** Closed catalogue matches, not vendor or human authentication. */
export interface ClientDeclarations {
  status: 'none' | 'single' | 'multiple';
  candidates: KnownAgentName[];
  matchedProducts: KnownProduct[];
  browserFamily: 'chromium' | 'firefox' | 'webkit' | 'unrecognized';
}

export interface TrafficAnalysis extends TrafficClassification {
  declarations: ClientDeclarations;
}

/**
 * RFC 9110 token characters, with explicit comment-compatible separators used
 * by documented crawler UAs. This is lexical identification, not a full UA
 * grammar validator. URLs, name substrings and malformed versions do not match.
 */
export function userAgentProductNames(userAgent: string): Set<string> {
  const pattern = /(?:^|[ \t;(])([!#$%&'*+.^_`|~0-9A-Za-z-]+)(?:\/[!#$%&'*+.^_`|~0-9A-Za-z-]+)?(?=$|[ \t;)])/g;
  return new Set([...userAgent.matchAll(pattern)].flatMap(match => match[1] === undefined ? [] : [match[1].toLowerCase()]));
}

export function analyzeTraffic(userAgent: string): TrafficAnalysis {
  const products = userAgentProductNames(userAgent);
  const matches = [...AI_RULES, ...BOT_RULES].filter(rule => rule.products.some(product => products.has(product.toLowerCase())));
  const declarations: ClientDeclarations = {
    status: matches.length === 0 ? 'none' : matches.length === 1 ? 'single' : 'multiple',
    candidates: matches.map(rule => rule.name).sort(),
    matchedProducts: matches.flatMap(rule => rule.products.filter(product => products.has(product.toLowerCase()))).sort(),
    browserFamily: products.has('chrome') || products.has('chromium') || products.has('crios') ? 'chromium'
      : products.has('firefox') || products.has('fxios') ? 'firefox'
        : products.has('applewebkit') && (products.has('safari') || products.has('mobile')) ? 'webkit' : 'unrecognized',
  };
  const only = declarations.candidates.length === 1 ? declarations.candidates[0] : undefined;
  if (only !== undefined) return { trafficClass: knownAgentTrafficClass(only) ?? 'bot', agentName: only, declarations };
  if (matches.length > 1 || GENERIC_BOT.test(userAgent)) return { trafficClass: 'bot', agentName: null, declarations };
  // The coarse legacy UA column remains compatible; reader_kind carries unknowns.
  return { trafficClass: 'browser', agentName: null, declarations };
}

export function classifyTraffic(userAgent: string): TrafficClassification {
  const { trafficClass, agentName } = analyzeTraffic(userAgent);
  return { trafficClass, agentName };
}

/** Historical compatibility rule only. New form claims use client-form.ts. */
export function classifyDevice(userAgent: string): DeviceType {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))) {
    return 'tablet';
  }
  if (/Mobile|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

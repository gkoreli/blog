import type { DeviceType, TrafficClass } from './contracts.js';

/**
 * Named rule catalogue (reviewed 2026-09-03).
 *
 * These are literal User-Agent token matches, not verified identities. The vendor
 * documentation recorded in research artifact 06 is the source for each current
 * AI rule family:
 *
 * - OpenAI — GPTBot, ChatGPT-User, OAI-SearchBot:
 *   https://developers.openai.com/api/docs/bots
 * - Anthropic — ClaudeBot, Claude-User, Claude-SearchBot:
 *   https://support.claude.com/en/articles/8896518
 * - Perplexity — PerplexityBot, Perplexity-User:
 *   https://docs.perplexity.ai/guides/bots
 * - Meta — Meta-ExternalAgent, Meta-ExternalFetcher, Meta-WebIndexer, FacebookBot:
 *   https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/
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
  pattern: RegExp;
}

const AI_RULES: readonly AgentRule[] = [
  { name: 'ChatGPT-User', pattern: /ChatGPT-User/i },
  { name: 'Claude-User', pattern: /Claude-User/i },
  { name: 'Perplexity-User', pattern: /Perplexity-User/i },
  { name: 'Meta-ExternalFetcher', pattern: /Meta-ExternalFetcher/i },
  { name: 'MistralAI-User', pattern: /MistralAI-User/i },
  { name: 'DuckAssistBot', pattern: /DuckAssistBot/i },
  { name: 'Amzn-User', pattern: /Amzn-User/i },
  { name: 'Google-GeminiNotebook', pattern: /Google-GeminiNotebook/i },
  { name: 'Google-Agent', pattern: /Google-Agent/i },
  { name: 'OAI-SearchBot', pattern: /OAI-SearchBot/i },
  { name: 'Claude-SearchBot', pattern: /Claude-SearchBot/i },
  { name: 'PerplexityBot', pattern: /PerplexityBot/i },
  { name: 'MistralAI-Index', pattern: /MistralAI-Index/i },
  { name: 'Amzn-SearchBot', pattern: /Amzn-SearchBot/i },
  { name: 'Meta-WebIndexer', pattern: /Meta-WebIndexer/i },
  { name: 'Applebot', pattern: /Applebot(?!-Extended)(?:\/|\b)/i },
  { name: 'GPTBot', pattern: /GPTBot/i },
  { name: 'ClaudeBot', pattern: /ClaudeBot/i },
  { name: 'MistralAI-Training', pattern: /MistralAI-Training/i },
  { name: 'Meta-ExternalAgent', pattern: /Meta-ExternalAgent/i },
  { name: 'Amazonbot', pattern: /Amazonbot/i },
  { name: 'CCBot', pattern: /CCBot/i },
  { name: 'Google-CloudVertexBot', pattern: /Google-CloudVertexBot/i },
  { name: 'Bytespider', pattern: /Bytespider/i },
  { name: 'PetalBot', pattern: /PetalBot/i },
  { name: 'Cohere-AI', pattern: /Cohere-AI/i },
  { name: 'Claude-Web', pattern: /Claude-Web/i },
  { name: 'GoogleOther', pattern: /GoogleOther/i },
];

const BOT_RULES: readonly AgentRule[] = [
  { name: 'Google-Extended', pattern: /Google-Extended/i },
  { name: 'Applebot-Extended', pattern: /Applebot-Extended/i },
  { name: 'Googlebot', pattern: /Googlebot/i },
  { name: 'Bingbot', pattern: /bingbot/i },
  { name: 'DuckDuckBot', pattern: /DuckDuckBot/i },
  { name: 'YandexBot', pattern: /YandexBot/i },
  { name: 'Baiduspider', pattern: /Baiduspider/i },
  { name: 'FacebookBot', pattern: /facebookexternalhit|Facebot/i },
  { name: 'LinkedInBot', pattern: /LinkedInBot/i },
  { name: 'Slackbot', pattern: /Slackbot/i },
  { name: 'HeadlessChrome', pattern: /HeadlessChrome\//i },
  { name: 'Cypress', pattern: /Cypress\//i },
  { name: 'Lightpanda', pattern: /Lightpanda\//i },
];

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

function namedMatch(userAgent: string, rules: readonly AgentRule[]): string | null {
  for (const rule of rules) {
    if (rule.pattern.test(userAgent)) return rule.name;
  }
  return null;
}

export function classifyTraffic(userAgent: string): TrafficClassification {
  const aiName = namedMatch(userAgent, AI_RULES);
  if (aiName !== null) return { trafficClass: 'ai', agentName: aiName };

  const botName = namedMatch(userAgent, BOT_RULES);
  if (botName !== null) return { trafficClass: 'bot', agentName: botName };

  if (GENERIC_BOT.test(userAgent)) return { trafficClass: 'bot', agentName: null };
  return { trafficClass: 'browser', agentName: null };
}

export function classifyDevice(userAgent: string): DeviceType {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))) {
    return 'tablet';
  }
  if (/Mobile|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

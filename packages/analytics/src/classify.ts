/** Visitor classification: human, traditional bot, or AI agent */
export const enum VisitorType {
  Human = 0,
  Bot = 1,
  AI = 2,
}

/**
 * AI crawler user-agents — from Cloudflare's official "Block AI Bots" list.
 * Source: https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/
 */
const AI_CRAWLERS = /GPTBot|ClaudeBot|Claude-Web|CCBot|ChatGPT|Amazonbot|Applebot-Extended|Bytespider|TikTokSpider|GoogleOther|Google-CloudVertexBot|Meta-ExternalAgent|DuckAssistBot|PetalBot|PerplexityBot|Cohere-AI/i;

/**
 * Traditional bot patterns — subset of isbot (omrilotan/isbot, 179 patterns).
 * We inline a focused set rather than pulling the full 179-pattern library.
 * Covers: search engines, monitoring, crawlers, headless browsers.
 */
const TRADITIONAL_BOTS = /bot\b|crawl|spider|slurp|mediapartners|headlesschrome|phantomjs|lighthouse|pingdom|uptimerobot|feed|fetch|scan|check|monitor|archive|index|search|wget|curl|httpx|python-|go-http|java\/|libwww|axios|node-fetch/i;

export function classifyVisitor(ua: string | null): VisitorType {
  if (!ua) return VisitorType.Bot;
  if (AI_CRAWLERS.test(ua)) return VisitorType.AI;
  if (TRADITIONAL_BOTS.test(ua)) return VisitorType.Bot;
  return VisitorType.Human;
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

const MOBILE = /Mobile|Android(?!.*Tablet)|iPhone|iPod|Opera Mini|IEMobile/i;
const TABLET = /Tablet|iPad|Android(?!.*Mobile)|Kindle|Silk/i;

export function classifyDevice(ua: string | null): DeviceType {
  if (!ua) return 'desktop';
  if (TABLET.test(ua)) return 'tablet';
  if (MOBILE.test(ua)) return 'mobile';
  return 'desktop';
}

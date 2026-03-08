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

/**
 * Device type classification from User-Agent string.
 *
 * Patterns distilled from isMobile (2.4K⭐, kaimallea/isMobile) and
 * ua-parser-js (10K⭐, faisalman/ua-parser-js) generic fallbacks.
 *
 * Key insight: Android phone vs tablet is determined by the presence of
 * 'Mobile' in the UA — Google's convention. Chrome on Android phones
 * includes 'Mobile', Chrome on Android tablets doesn't.
 *
 * Limitation: iPadOS 13+ reports as Mac (desktop UA). Detecting it
 * requires navigator.maxTouchPoints which is unavailable server-side.
 * iPads on iOS 13+ will be classified as desktop. Acceptable trade-off
 * for a server-side classifier.
 */
const PHONES = /iPhone|iPod|\bAndroid(?:.+)Mobile|Windows Phone|BB10|BlackBerry|Opera Mini|\b(?:CriOS|Chrome)(?:.+)Mobile|Mobile(?:.+)Firefox\b/i;
const TABLETS = /iPad|\bWindows(?:.+)ARM|(?:(?:SD4930UR|Silk(?!.+Mobile)))/i;
const ANDROID_TABLET = /\bAndroid\b/i;

export function classifyDevice(ua: string | null): DeviceType {
  if (!ua) return 'desktop';
  if (PHONES.test(ua)) return 'mobile';
  if (TABLETS.test(ua)) return 'tablet';
  if (ANDROID_TABLET.test(ua) && !/Mobile/i.test(ua)) return 'tablet';
  return 'desktop';
}

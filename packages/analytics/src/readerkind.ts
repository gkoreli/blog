import type { TrafficClass } from './contracts.js';
import { isHostingAsn } from './networks.js';
import type { WebBotAuthResult } from './webbotauth.js';

export const READER_KINDS = [
  'signed-agent',
  'ai-assistant',
  'ai-search',
  'ai-crawler',
  'search-crawler',
  'preview-or-feed',
  'headless-browser',
  'other-bot',
  'cloud-browser',
  'http-client',
  'legacy-browser',
  'browser',
  'unchecked',
] as const;

export type ReaderKind = typeof READER_KINDS[number];

export const ON_DEMAND_FETCHERS = [
  'ChatGPT-User',
  'Claude-User',
  'Perplexity-User',
  'Meta-ExternalFetcher',
  'MistralAI-User',
  'DuckAssistBot',
  'Amzn-User',
  'Google-Agent',
  'Google-GeminiNotebook',
] as const;

export const AI_SEARCH_CRAWLERS = [
  'OAI-SearchBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'MistralAI-Index',
  'Amzn-SearchBot',
  'Meta-WebIndexer',
  'Applebot',
] as const;

export const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'MistralAI-Training',
  'Meta-ExternalAgent',
  'Amazonbot',
  'CCBot',
  'Google-CloudVertexBot',
  'Bytespider',
  'PetalBot',
  'Cohere-AI',
] as const;

export const SEARCH_CRAWLERS = [
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
  'YandexBot',
  'Baiduspider',
] as const;

export const PREVIEW_OR_FEED_AGENTS = [
  'FacebookBot',
  'LinkedInBot',
  'Slackbot',
] as const;

export const HEADLESS_BROWSERS = [
  'HeadlessChrome',
  'Cypress',
  'Lightpanda',
] as const;

const onDemandFetchers: ReadonlySet<string> = new Set(ON_DEMAND_FETCHERS);
const aiSearchCrawlers: ReadonlySet<string> = new Set(AI_SEARCH_CRAWLERS);
const aiCrawlers: ReadonlySet<string> = new Set(AI_CRAWLERS);
const searchCrawlers: ReadonlySet<string> = new Set(SEARCH_CRAWLERS);
const previewOrFeedAgents: ReadonlySet<string> = new Set(PREVIEW_OR_FEED_AGENTS);
const headlessBrowsers: ReadonlySet<string> = new Set(HEADLESS_BROWSERS);

export interface ReaderKindFacts {
  trafficClass: TrafficClass;
  agentName: string | null;
  observationSource: 'beacon' | 'edge';
  asn: number | null;
  secFetchMode: string | null;
  secFetchDest: string | null;
  secFetchSite: string | null;
  secFetchUser: number | null;
  acceptsHtml: number | null;
  hasAcceptLanguage: number | null;
  signature: WebBotAuthResult;
  userAgent: string;
}

export interface ReaderKindResult {
  kind: ReaderKind;
  reason: string;
}

function userAgentHeadlessName(userAgent: string): string | null {
  if (/HeadlessChrome\//i.test(userAgent)) return 'HeadlessChrome';
  if (/Cypress\//i.test(userAgent)) return 'Cypress';
  if (/Lightpanda\//i.test(userAgent)) return 'Lightpanda';
  return null;
}

/**
 * Whether the User-Agent claims an engine version that ships Fetch Metadata on
 * every request: Chromium >= 76 (2019, including Android WebView), Firefox >= 90
 * (2021), WebKit on Safari/iOS >= 16.4 (2023, including WKWebView). Sources are
 * in research artifact 09. A claim at or above these versions with no
 * Sec-Fetch-Mode is a verdict; an older or unreadable claim proves nothing.
 */
export function claimsFetchMetadataBrowser(userAgent: string): boolean {
  const chromium = /\bChrome\/(\d+)/.exec(userAgent);
  if (chromium) return Number(chromium[1]) >= 76;
  const firefox = /\bFirefox\/(\d+)/.exec(userAgent);
  if (firefox) return Number(firefox[1]) >= 90;
  const ios = /\bOS (\d+)_(\d+)/.exec(userAgent);
  if (ios && /\bAppleWebKit\//.test(userAgent)) {
    const major = Number(ios[1]);
    const minor = Number(ios[2]);
    return major > 16 || (major === 16 && minor >= 4);
  }
  const safari = /\bVersion\/(\d+)\.(\d+)[^ ]* (?:Mobile\/\S+ )?Safari\//.exec(userAgent);
  if (safari) {
    const major = Number(safari[1]);
    const minor = Number(safari[2]);
    return major > 16 || (major === 16 && minor >= 4);
  }
  return false;
}

function unsignedReaderKind(facts: ReaderKindFacts): ReaderKindResult {
  const agentName = facts.agentName;
  if (agentName !== null && onDemandFetchers.has(agentName)) {
    return { kind: 'ai-assistant', reason: agentName };
  }
  if (agentName !== null && aiSearchCrawlers.has(agentName)) {
    return { kind: 'ai-search', reason: agentName };
  }
  if (agentName !== null && aiCrawlers.has(agentName)) {
    return { kind: 'ai-crawler', reason: agentName };
  }
  if (agentName !== null && searchCrawlers.has(agentName)) {
    return { kind: 'search-crawler', reason: agentName };
  }
  if (agentName !== null && previewOrFeedAgents.has(agentName)) {
    return { kind: 'preview-or-feed', reason: agentName };
  }

  const headlessName = agentName !== null && headlessBrowsers.has(agentName)
    ? agentName
    : userAgentHeadlessName(facts.userAgent);
  if (headlessName !== null) return { kind: 'headless-browser', reason: headlessName };

  if (facts.trafficClass === 'bot' || facts.trafficClass === 'ai') {
    return { kind: 'other-bot', reason: agentName ?? 'generic-bot' };
  }
  if (facts.observationSource === 'beacon') return { kind: 'browser', reason: 'legacy-beacon' };
  if (facts.hasAcceptLanguage === null) return { kind: 'unchecked', reason: 'evidence-not-recorded' };

  // Hosting network is a verdict on its own (MRC floor, GoatCounter, Plausible
  // cloud, Fathom) and is checked before request shape: in the 72-hour Workers
  // Logs sample of 2026-09-03 the largest single cluster was 374 navigation-shaped
  // "Chrome Mobile 114" hits from Google Cloud, and 64 header-less "iOS 13.2"
  // hits from Tencent Cloud (research artifact 09, section "Site measurement").
  if (isHostingAsn(facts.asn)) return { kind: 'cloud-browser', reason: `hosting-asn:${facts.asn}` };

  const navigationShaped = facts.secFetchMode === 'navigate' && facts.secFetchDest === 'document';
  if (!navigationShaped) {
    if (facts.secFetchMode !== null) return { kind: 'http-client', reason: 'not-navigation-shaped' };
    if (claimsFetchMetadataBrowser(facts.userAgent)) {
      return { kind: 'http-client', reason: 'no-fetch-metadata' };
    }
    return { kind: 'legacy-browser', reason: 'pre-fetch-metadata-ua' };
  }
  return { kind: 'browser', reason: 'navigation-shaped' };
}

export function classifyReaderKind(facts: ReaderKindFacts): ReaderKindResult {
  if (facts.signature.status === 'verified') {
    return { kind: 'signed-agent', reason: facts.signature.agent };
  }
  const result = unsignedReaderKind(facts);
  if (facts.signature.status === 'unverified') return { ...result, reason: facts.signature.reason };
  return result;
}

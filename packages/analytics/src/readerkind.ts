import { fetchMetadataFields } from './fetch-metadata.js';
import type { ReaderKind, TrafficClass, ReferrerState } from './contracts.js';
import { isArchiverAsn, isHostingAsn, networkEvidence } from './networks.js';
import { analyzeTraffic, type ClientDeclarations } from './classify.js';
import type { WebBotAuthResult } from './webbotauth.js';

export { READER_KINDS } from './contracts.js';
export type { ReaderKind } from './contracts.js';

export const ON_DEMAND_FETCHERS = [
  'Shap-User',
  'ExaUser',
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
  'ShapBot',
  'ExaSearchBot',
  'OAI-SearchBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'MistralAI-Index',
  'Amzn-SearchBot',
  'Meta-WebIndexer',
  'Applebot',
] as const;

/** Broad declared AI-related crawling, not a per-request training conclusion. */
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

export const SEO_CRAWLERS = ['AhrefsBot', 'AhrefsSiteAudit'] as const;

export const PREVIEW_OR_FEED_AGENTS = [
  'FacebookBot',
  'LinkedInBot',
  'Slackbot-LinkExpanding',
  'Slack-ImgProxy',
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
const seoCrawlers: ReadonlySet<string> = new Set(SEO_CRAWLERS);
const previewOrFeedAgents: ReadonlySet<string> = new Set(PREVIEW_OR_FEED_AGENTS);
const headlessBrowsers: ReadonlySet<string> = new Set(HEADLESS_BROWSERS);

export interface ReaderKindFacts {
  trafficClass: TrafficClass;
  agentName: string | null;
  observationSource: 'beacon' | 'edge';
  asn: number | null;
  fetchMetadataBits?: number;
  secFetchMode: string | null;
  secFetchDest: string | null;
  secFetchSite: string | null;
  secFetchUser: number | null;
  acceptsHtml: number | null;
  hasAcceptLanguage: number | null;
  signature: WebBotAuthResult;
  userAgent: string;
  declarations?: ClientDeclarations;
  referrerState?: ReferrerState;
}

export interface ReaderKindResult {
  kind: ReaderKind;
  reason: string;
}

/**
 * Whether the User-Agent claims an engine version that ships Fetch Metadata on
 * potentially trustworthy requests under supporting transport/context: Chromium >= 76 (2019, including Android WebView), Firefox >= 90
 * (2021), WebKit on Safari/iOS >= 16.4 (2023, including WKWebView). Sources are
 * in research artifact 09. This is a version claim, not proof of emission or
 * human operation. Missing headers now abstain instead of proving automation.
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

/** The reader kind a named User-Agent rule maps to, for filter validation. */
export function agentReaderKind(agentName: string): ReaderKind {
  if (onDemandFetchers.has(agentName)) return 'ai-assistant';
  if (aiSearchCrawlers.has(agentName)) return 'ai-search';
  if (aiCrawlers.has(agentName)) return 'ai-crawler';
  if (searchCrawlers.has(agentName)) return 'search-crawler';
  if (seoCrawlers.has(agentName)) return 'seo-crawler';
  if (previewOrFeedAgents.has(agentName)) return 'preview-or-feed';
  if (headlessBrowsers.has(agentName)) return 'headless-browser';
  return 'other-bot';
}

function unsignedReaderKind(facts: ReaderKindFacts): ReaderKindResult {
  const agentName = facts.agentName;
  const declarations = facts.declarations ?? analyzeTraffic(facts.userAgent).declarations;
  if (declarations.status === 'multiple') {
    const categories = new Set(declarations.candidates.map(agentReaderKind));
    const onlyCategory = categories.size === 1 ? categories.values().next().value : undefined;
    return onlyCategory === undefined
      ? { kind: 'unresolved', reason: 'multiple-client-declarations' }
      : { kind: onlyCategory, reason: 'multiple-declarations-same-category' };
  }
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
  if (agentName !== null && seoCrawlers.has(agentName)) {
    return { kind: 'seo-crawler', reason: agentName };
  }
  if (agentName !== null && previewOrFeedAgents.has(agentName)) {
    return { kind: 'preview-or-feed', reason: agentName };
  }

  const headlessName = agentName !== null && headlessBrowsers.has(agentName)
    ? agentName
    : declarations.candidates.find(name => headlessBrowsers.has(name)) ?? null;
  if (headlessName !== null) return { kind: 'headless-browser', reason: headlessName };

  if (agentName === null && isArchiverAsn(facts.asn)) {
    return { kind: 'preview-or-feed', reason: `archiver-asn:${facts.asn}` };
  }

  if (facts.trafficClass === 'bot' || facts.trafficClass === 'ai') {
    return { kind: 'other-bot', reason: agentName ?? 'generic-bot' };
  }
  // Beacon rows (before 2026-08-26) ran the site's script in a page: that is
  // stronger browser evidence than any header. Edge rows before 2026-09-03 have
  // the User-Agent verdict and, where migration 0007 could reconstruct it, the
  // network; they are browsers by User-Agent only and say so.
  if (facts.observationSource === 'beacon') return { kind: 'browser', reason: 'beacon-script-ran' };
  if (facts.hasAcceptLanguage === null) return { kind: 'browser', reason: 'user-agent-only' };

  // Hosting network is a verdict on its own (MRC floor, GoatCounter, Plausible
  // cloud, Fathom) and is checked before request shape: in the 72-hour Workers
  // Logs sample of 2026-09-03 the largest single cluster was 374 navigation-shaped
  // "Chrome Mobile 114" hits from Google Cloud, and 64 header-less "iOS 13.2"
  // hits from Tencent Cloud (research artifact 09, section "Site measurement").
  if (isHostingAsn(facts.asn)) return { kind: 'cloud-browser', reason: `hosting-asn:${facts.asn}` };

  if (declarations.browserFamily === 'unrecognized') return { kind: 'unresolved', reason: 'unrecognized-browser-claim' };
  if (facts.fetchMetadataBits !== undefined) {
    const fields = fetchMetadataFields(facts.fetchMetadataBits);
    if (fields === null || fields.states.includes('not-assessed')) return { kind: 'unresolved', reason: 'fetch-metadata-unassessed' };
    if (fields.states.includes('policy-limit')) return { kind: 'unresolved', reason: 'fetch-metadata-policy-limit' };
    if (fields.states.includes('invalid')) return { kind: 'unresolved', reason: 'fetch-metadata-invalid' };
    if (fields.states.includes('unrecognized')) return { kind: 'unresolved', reason: 'fetch-metadata-unrecognized' };
  }
  if (facts.secFetchSite === 'same-origin' && facts.referrerState === 'external') return { kind: 'unresolved', reason: 'request-context-conflict' };
  if (facts.secFetchMode !== null && !['navigate', 'cors', 'no-cors', 'same-origin', 'websocket'].includes(facts.secFetchMode)) return { kind: 'unresolved', reason: 'fetch-metadata-unrecognized' };
  const navigationShaped = facts.secFetchMode === 'navigate' && facts.secFetchDest === 'document'
    && facts.acceptsHtml === 1 && facts.hasAcceptLanguage === 1;
  if (!navigationShaped) {
    if (facts.secFetchMode !== null) return { kind: 'http-client', reason: 'not-navigation-shaped' };
    return { kind: 'unresolved', reason: claimsFetchMetadataBrowser(facts.userAgent) ? 'fetch-metadata-absent' : 'fetch-metadata-support-unknown' };
  }
  if (networkEvidence(facts.asn) === 'missing') return { kind: 'unresolved', reason: 'network-evidence-missing' };
  return { kind: 'browser', reason: 'navigation-shaped-network-unlisted' };
}

export function classifyReaderKind(facts: ReaderKindFacts): ReaderKindResult {
  const result = unsignedReaderKind(facts);
  if (result.reason === 'multiple-client-declarations' || result.reason === 'multiple-declarations-same-category') return result;
  if (facts.signature.status === 'verified') {
    // A declared named role and a verified signing key are independent evidence.
    // Preserve the role; signature_status/signature_agent retain verification.
    // Unrecognized signed clients keep the historical signed-agent fallback.
    if (facts.agentName !== null) return result;
    return { kind: 'signed-agent', reason: facts.signature.agent };
  }
  // Verification failures have their own persisted evidence, not a role suffix.
  return result;
}

/** Filter compatibility spans retained historical mappings without rewriting rows. */
export function agentReaderKinds(agentName: string): readonly ReaderKind[] {
  return agentName === 'Slackbot' ? ['other-bot', 'preview-or-feed'] : [agentReaderKind(agentName)];
}

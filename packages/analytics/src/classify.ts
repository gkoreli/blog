import type { DeviceType, TrafficClass } from './contracts.js';
import { hasConflictingBrowserClaims, hasGenericAutomationProduct, userAgentProducts } from './user-agent-products.js';
import { clientDeclarationsFromProducts, clientTrafficClass, KNOWN_CLIENT_NAMES, KNOWN_CLIENT_PRODUCTS as REGISTRY_CLIENT_PRODUCTS, type KnownClientName, type KnownClientProduct } from './client-registry.js';

/**
 * Current canonical declarations, aliases, coarse classes, roles and reviewed
 * sources live together in client-registry.ts. These are lexical User-Agent
 * claims, never authenticated identities. All matches remain visible; exact
 * aliases and conflicting names never resolve by catalogue order.
 *
 * GoogleOther stays a generic crawler declaration without an AI/search-purpose
 * promise. Google-Extended and Applebot-Extended are robots.txt product tokens,
 * not documented request UAs; their literal bot claims do not identify the
 * corresponding crawler. Bytespider, Cohere-AI, Claude-Web and PetalBot remain
 * literal legacy/undocumented claims, not vendor attribution. HeadlessChrome,
 * Cypress and Lightpanda are self-declared automation tokens.
 *
 * OpenClaw's documented Accept ordering (`text/markdown, text/html;q=0.9`) is a
 * future tell deliberately neither classified nor retained by this parser:
 * https://github.com/openclaw/openclaw/blob/main/src/agents/tools/web-fetch.ts
 */

export interface TrafficClassification {
  trafficClass: TrafficClass;
  agentName: string | null;
}

export const KNOWN_AGENT_NAMES: ReadonlySet<string> = KNOWN_CLIENT_NAMES;
export const KNOWN_CLIENT_PRODUCTS = REGISTRY_CLIENT_PRODUCTS;
export type KnownAgentName = KnownClientName;
export type KnownProduct = KnownClientProduct;

export function knownAgentTrafficClass(agentName: string): Exclude<TrafficClass, 'browser'> | null {
  return clientTrafficClass(agentName);
}

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
 * grammar validator. Recognized absolute-URI spans, embedded name substrings
 * and malformed slash versions do not match; schemeless URI references are
 * outside this scanner's exclusion contract. See userAgentClaimText.
 */
export function userAgentProductNames(userAgent: string): Set<string> {
  return new Set(userAgentProducts(userAgent).map(product => product.name));
}

export function analyzeTraffic(userAgent: string): TrafficAnalysis {
  const lexicalProducts = userAgentProducts(userAgent);
  const products = new Set(lexicalProducts.map(product => product.name));
  const matches = clientDeclarationsFromProducts(products);
  const declarations: ClientDeclarations = {
    status: matches.candidates.length === 0 ? 'none' : matches.candidates.length === 1 ? 'single' : 'multiple',
    candidates: matches.candidates,
    matchedProducts: matches.matchedProducts,
    browserFamily: hasConflictingBrowserClaims(lexicalProducts) ? 'unrecognized'
      : products.has('chrome') || products.has('chromium') || products.has('crios') ? 'chromium'
      : products.has('firefox') || products.has('fxios') ? 'firefox'
        : products.has('applewebkit') && (products.has('safari') || products.has('mobile')) ? 'webkit' : 'unrecognized',
  };
  const only = declarations.candidates.length === 1 ? declarations.candidates[0] : undefined;
  if (only !== undefined) return { trafficClass: knownAgentTrafficClass(only) ?? 'bot', agentName: only, declarations };
  if (matches.candidates.length > 1 || hasGenericAutomationProduct(lexicalProducts)) return { trafficClass: 'bot', agentName: null, declarations };
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

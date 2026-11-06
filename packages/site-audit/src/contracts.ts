import type { TechnicalAssessment } from './product-contracts.js';
export const SITE_AUDIT_VERSION = '2026-11-06.1';

export type ResourceKind = 'page' | 'robots' | 'llms' | 'sitemap' | 'markdown' | 'probe';
export type ResourceOutcome = 'received' | 'blocked-target' | 'dns-error' | 'network-error' | 'timeout' | 'too-large' | 'redirect-limit' | 'budget-exhausted';
export interface ResourceEvidence {
  kind: ResourceKind;
  requestedUrl: string;
  finalUrl: string;
  outcome: ResourceOutcome;
  status: number | null;
  contentType: string | null;
  bytes: number;
  elapsedMs: number;
  redirects: number;
  /** Synthetic declaration, never a request from this provider. */
  probeAgent: string | null;
  /** New captures distinguish absent headers from values omitted by size policy. */
  headersOmitted?: Array<'contentType' | 'robots' | 'link' | 'contentLocation' | 'vary'>;
  headers: { robots: string | null; link: string | null; contentLocation: string | null; vary: string | null };
}
export interface BotRuleAssessment {
  token: string;
  provider: string;
  role: 'training-control' | 'search' | 'assistant' | 'other';
  source: string;
  decision: 'allowed' | 'disallowed' | 'unknown';
  matchedGroups: string[];
  matchedRule: string | null;
  reason: string;
}
export interface Finding {
  id: string;
  severity: 'action' | 'review' | 'info';
  title: string;
  evidence: string;
  recommendation: string;
}
export interface PageEvidence {
  title: string | null;
  description: string | null;
  canonical: string | null;
  language: string | null;
  textCharacters: number;
  /** Bounded normalized source text, not rendered or provider-extracted text. */
  textPreview?: string;
  headingOutline?: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }>;
  headings: number;
  links: number;
  scriptElements: number;
  metaRobots: Array<{ agent: string; value: string }>;
  structuredDataTypes: string[];
  structuredDataBlocks: number;
  invalidStructuredDataBlocks: number;
  alternateLinks: Array<{ type: string; href: string }>;
  parseState: 'parsed' | 'not-html' | 'unavailable';
  /** False for unparsed source or when robots metadata exceeds capture bounds. */
  indexingAssessmentComplete?: boolean;
}
export interface SiteAuditReport {
  version: typeof SITE_AUDIT_VERSION;
  checkedAt: string;
  target: string;
  complete: boolean;
  resources: ResourceEvidence[];
  page: PageEvidence;
  robots: { state: 'parsed' | 'missing' | 'unreachable' | 'unavailable'; groups: number; rules: number; sitemaps: string[]; bots: BotRuleAssessment[] };
  discovery: { llms: 'present' | 'missing' | 'unavailable'; llmsLinks: number; sitemap: 'xml-observed' | 'missing' | 'unavailable' | 'unexpected-content'; markdown: 'negotiated' | 'not-negotiated' | 'unavailable' };
  findings: Finding[];
  limits: string[];
  /** Additive derived product assessment; historical v1 reports may omit it. */
  assessment?: TechnicalAssessment;
}

import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';

/** Supplied demonstration data. No network measurement or historical improvement is claimed. */
export function comparisonExample(): { before: SiteAuditReport; after: SiteAuditReport } {
  const before: SiteAuditReport = {
    version: '2026-11-06.1', checkedAt: '2026-11-06T00:00:00.000Z', target: 'https://example.com/article', complete: true,
    resources: [{ kind: 'page', requestedUrl: 'https://example.com/article', finalUrl: 'https://example.com/article', outcome: 'received', status: 200, contentType: 'text/html', bytes: 1200, elapsedMs: 100, redirects: 0, probeAgent: null, headers: { robots: null, link: null, contentLocation: null, vary: null }, headersOmitted: [] }],
    page: { title: null, description: null, canonical: null, language: 'en', textCharacters: 500, headings: 1, links: 1, scriptElements: 0, metaRobots: [], structuredDataTypes: [], structuredDataBlocks: 0, invalidStructuredDataBlocks: 0, alternateLinks: [], parseState: 'parsed', indexingAssessmentComplete: true },
    robots: { state: 'parsed', groups: 1, rules: 1, sitemaps: [], bots: [] },
    discovery: { llms: 'missing', llmsLinks: 0, sitemap: 'missing', markdown: 'not-negotiated' }, findings: [],
    limits: ['ILLUSTRATIVE EXAMPLE: supplied inputs show how adding a page title changes this rubric. No page was fetched and these values are not measurements of example.com.'],
  };
  const after: SiteAuditReport = { ...before, checkedAt: '2026-11-06T01:00:00.000Z', page: { ...before.page, title: 'Example article' } };
  return { before, after };
}

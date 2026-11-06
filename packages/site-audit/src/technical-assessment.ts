import type { ResourceEvidence, SiteAuditReport } from './contracts.js';
import { TECHNICAL_ASSESSMENT_PROFILE, type TechnicalAssessment, type TechnicalCheck, type TechnicalComponent, type OptionalCapability } from './product-contracts.js';

const received = (resource: ResourceEvidence | undefined) => resource?.outcome === 'received';
const successful = (resource: ResourceEvidence | undefined) => received(resource) && resource?.status !== null && resource?.status !== undefined && resource.status >= 200 && resource.status < 300;
const html = (resource: ResourceEvidence | undefined) => /^text\/html(?:;|$)|^application\/xhtml\+xml(?:;|$)/i.test(resource?.contentType ?? '');
const restriction = (value: string) => value.toLowerCase().split(',').some(part => !part.includes(':') && part.trim().split(/\s+/).some(token => token === 'noindex' || token === 'none'));

/** X-Robots-Tag can carry provider-scoped rules and parameter directives.
 * Once a provider scope occurs, merged header boundaries cannot be recovered;
 * keep the absence of a generic restriction unknown rather than widening a
 * scoped noindex to all agents or asserting that an omitted header was empty. */
function headerRestriction(value: string | null): 'clear' | 'restricted' | 'scoped' {
  if (value === null) return 'clear';
  let scope = false;
  const parameters = new Set(['max-snippet', 'max-image-preview', 'max-video-preview', 'unavailable_after']);
  for (const part of value.split(',')) {
    let token = part.trim().toLowerCase();
    const prefix = /^([a-z][a-z0-9_-]*)\s*:\s*(.*)$/.exec(token);
    if (prefix && prefix[1] !== undefined) {
      if (parameters.has(prefix[1])) continue;
      scope = true; token = prefix[2] ?? '';
    }
    if (!scope && restriction(token)) return 'restricted';
  }
  return scope ? 'scoped' : 'clear';
}
function component(id: TechnicalComponent['id'], title: string, checks: TechnicalCheck[]): TechnicalComponent {
  return { id, title, checks, earned: checks.filter(check => check.state === 'pass').reduce((sum, check) => sum + check.weight, 0),
    unknown: checks.filter(check => check.state === 'unknown').reduce((sum, check) => sum + check.weight, 0), max: checks.reduce((sum, check) => sum + check.weight, 0) };
}
function optional(report: SiteAuditReport, id: OptionalCapability['id'], title: string): OptionalCapability {
  if (id === 'structured-data') {
    const page = report.page;
    return { id, title, state: page.parseState !== 'parsed' ? 'unavailable' : page.structuredDataBlocks === 0 ? 'not-provided' : page.invalidStructuredDataBlocks > 0 ? 'unexpected-content' : 'available',
      evidence: page.parseState !== 'parsed' ? 'The initial HTML could not be inspected.' : `${page.structuredDataBlocks} JSON-LD blocks; ${page.invalidStructuredDataBlocks} did not parse as JSON.`,
      nextStep: page.invalidStructuredDataBlocks > 0 ? 'Repair supplied invalid JSON. Successful JSON parsing is not schema validation.' : 'Publish accurate structured data when it serves your page. Absence does not lower this score.' };
  }
  const resource = report.resources.find(item => item.kind === id);
  const evidence = !resource ? 'No resource result was captured.' : `${resource.outcome}; HTTP ${resource.status ?? 'unavailable'}; Content-Type ${resource.contentType ?? 'unavailable'}.`;
  let state: OptionalCapability['state'] = 'unavailable';
  if (received(resource)) {
    const status = resource?.status;
    if (status === null || status === undefined) state = 'unavailable';
    else if (status < 200 || status >= 300) state = id !== 'markdown' && (status === 404 || status === 410) ? 'not-provided' : 'http-error';
    else if (id === 'markdown') state = report.discovery.markdown === 'negotiated' ? 'available' : html(resource) ? 'not-negotiated' : 'unexpected-content';
    else if (id === 'llms') state = report.discovery.llms === 'present' ? 'available' : 'unexpected-content';
    else state = report.discovery.sitemap === 'xml-observed' ? 'available' : 'unexpected-content';
  }
  const advertisedSitemaps = report.robots.sitemaps.length;
  const nextStep = id === 'markdown'
    ? state === 'not-negotiated' ? 'This URL returned HTML when Markdown was requested. That optional format is not required for the HTML to be readable. Check a declared alternate or add negotiation only if useful.'
      : state === 'available' ? 'Keep the negotiated Markdown consistent with the HTML; this check does not compare their meaning.'
        : 'Compare a direct request with Accept: text/markdown and the ordinary page response. An HTTP or network failure differs from unsupported optional negotiation.'
    : id === 'llms' ? state === 'not-provided' ? 'An llms.txt directory is optional and carries no score penalty. Prioritize useful accessible pages.'
      : state === 'available' ? 'Keep the directory accurate. Presence does not establish ranking, discovery or citation.'
        : 'Inspect the llms.txt response before changing the file. An access denial or network failure does not establish absence.'
      : state === 'available' ? 'Maintain the sitemap with canonical URLs. The checker observes its root element and does not validate every entry.'
        : `Check the sitemap URL you actually publish${advertisedSitemaps ? `; robots.txt advertises ${advertisedSitemaps} candidate(s)` : ''}. This audit requests only /sitemap.xml. Absence at that fixed path is not a sitewide failure.`;
  return { id, title, state, evidence, nextStep };
}

/** Fixed, published engineering rubric. Unknown points form an interval over
 * the same denominator; they are never rescaled into a misleading perfect score. */
export function deriveTechnicalAssessment(report: SiteAuditReport): TechnicalAssessment {
  const pageResource = report.resources.find(resource => resource.kind === 'page');
  const parsed = report.page.parseState === 'parsed';
  const responseKnown = received(pageResource) && pageResource?.status !== null;
  const check = (id: string, title: string, weight: number, state: TechnicalCheck['state'], evidence: string, nextStep: string): TechnicalCheck => ({ id, title, weight, state, evidence, nextStep });
  const headerState = headerRestriction(pageResource?.headers.robots ?? null);
  const positiveRestriction = report.page.metaRobots.some(meta => meta.agent.toLowerCase() === 'robots' && restriction(meta.value)) || headerState === 'restricted';
  const indexingComplete = parsed && report.page.indexingAssessmentComplete === true && pageResource?.headersOmitted !== undefined
    && !pageResource.headersOmitted.includes('robots') && headerState !== 'scoped';
  const components = [
    component('delivery', 'Page delivery', [
      check('page-status', 'Successful page response', 30, !responseKnown ? 'unknown' : successful(pageResource) ? 'pass' : 'fail',
        pageResource ? `${pageResource.outcome}; HTTP ${pageResource.status ?? 'unavailable'}.` : 'No baseline page response was captured.',
        'For a public page, compare a direct fetch and edge logs when this response fails. This checker is not a real provider trial.'),
      check('page-html', 'HTML response type', 10, !successful(pageResource) || pageResource?.headersOmitted?.includes('contentType') ? 'unknown' : html(pageResource) ? 'pass' : 'fail',
        `Content-Type: ${pageResource?.contentType ?? 'unavailable'}.`, 'Serve the intended HTML with its correct media type. Other resource types may be intentional and fall outside this page baseline.'),
    ]),
    component('content', 'Initial HTML source', [
      check('source-text', 'Text in the initial HTML', 20, !parsed ? 'unknown' : report.page.textCharacters > 0 ? 'pass' : 'fail',
        parsed ? `${report.page.textCharacters} source text characters were observed outside excluded elements.` : 'No parsed HTML source was available.',
        'Put useful content in the initial HTML when possible. This count can include navigation and does not establish meaningful answers or rendered visibility.'),
      check('page-title', 'Nonempty page title', 10, !parsed ? 'unknown' : report.page.title?.trim() ? 'pass' : 'fail',
        parsed ? report.page.title === null ? 'No title was extracted.' : `Title: ${report.page.title}` : 'Title could not be assessed.', 'Give the page a descriptive title. This checklist weight is a local heuristic, not a ranking weight.'),
      check('page-heading', 'At least one source heading', 10, !parsed ? 'unknown' : report.page.headings > 0 ? 'pass' : 'fail',
        parsed ? `${report.page.headings} H1–H6 elements were observed.` : 'Headings could not be assessed.', 'Use headings that explain the content. A heading count does not validate hierarchy or make a claim about provider extraction.'),
    ]),
    component('indexing', 'General indexing controls', [
      check('general-indexing', 'No general noindex directive observed', 20, positiveRestriction ? 'fail' : indexingComplete ? 'pass' : 'unknown',
        positiveRestriction ? 'A generic robots meta or unscoped X-Robots-Tag noindex/none directive was observed.' : indexingComplete ? 'The captured general controls contain no noindex/none directive.' : 'The scope or completeness of general indexing controls could not be established.',
        'If public indexing is your goal, review generic noindex/none controls. They may be intentional. Provider-scoped controls, crawl policy, actual indexing and assistant use remain separate.'),
    ]),
  ];
  const checks = components.flatMap(item => item.checks);
  const lower = components.reduce((sum, item) => sum + item.earned, 0);
  const unknown = components.reduce((sum, item) => sum + item.unknown, 0);
  return { profile: TECHNICAL_ASSESSMENT_PROFILE, label: 'Technical access score', score: { lower, upper: lower + unknown, max: 100, coveragePercent: 100 - unknown },
    counts: { passed: checks.filter(item => item.state === 'pass').length, failed: checks.filter(item => item.state === 'fail').length, unknown: checks.filter(item => item.state === 'unknown').length }, components,
    optional: [optional(report, 'llms', 'Optional llms.txt directory'), optional(report, 'sitemap', 'Sitemap at the fixed root path'), optional(report, 'markdown', 'Optional Markdown negotiation'), optional(report, 'structured-data', 'Optional JSON-LD syntax')],
    limits: ['This is a versioned local technical checklist for a public HTML page, not a calibrated AI-readiness, ranking, citation or quality predictor. The displayed weights are product heuristics.',
      'Delivery contributes 40 points, initial HTML source 40 and general indexing controls 20. Intentional generic noindex can lower the index without being a defect.',
      'Unknown points form the displayed lower–upper interval over 100. Coverage counts points with observed pass/fail outcomes; missing evidence never becomes a passed or failed check.',
      'Training/reuse blocks, provider-specific robots decisions and optional Markdown, llms.txt, sitemap, JSON-LD or citation-format absence do not deduct points.',
      'Header omission, metadata capture limits, legacy reports without completeness flags and ambiguous provider-scoped headers keep indexing points unknown unless a generic restriction is positively observed.',
      'This report does not establish actual indexing or the access, selection, citation, training use or answer quality of any AI provider.'] };
}

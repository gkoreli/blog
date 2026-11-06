import { SITE_AUDIT_VERSION, type SiteAuditReport, type BotRuleAssessment, type Finding } from './contracts.js';
import { BOT_PROFILES } from './bots.js';
import { parseRobots, evaluateRobots } from './robots.js';
import { emptyPage, inspectHtml } from './html.js';
import { normalizeTarget } from './target.js';
import { createWorkersTransport, type AuditTransport, type ResourceRequest, type RetrievedResource } from './transport.js';

export type { SiteAuditReport } from './contracts.js';
export { TargetValidationError, normalizeTarget } from './target.js';
export { createWorkersTransport } from './transport.js';
export interface AuditDependencies { transport?: AuditTransport; now?: () => Date }
const received = (resource: RetrievedResource) => resource.evidence.outcome === 'received';
const success = (resource: RetrievedResource) => received(resource) && resource.evidence.status !== null && resource.evidence.status >= 200 && resource.evidence.status < 300;
const missing = (resource: RetrievedResource) => received(resource) && resource.evidence.status !== null && resource.evidence.status >= 400 && resource.evidence.status < 500 && resource.evidence.status !== 429;
const htmlType = (resource: RetrievedResource) => /^text\/html(?:;|$)|^application\/xhtml\+xml(?:;|$)/i.test(resource.evidence.contentType ?? '');

async function retrieveAll(transport: AuditTransport, requests: readonly ResourceRequest[]): Promise<RetrievedResource[]> {
  const resources: RetrievedResource[] = [];
  for (let index = 0; index < requests.length; index += 3) resources.push(...await Promise.all(requests.slice(index, index + 3).map(request => transport.retrieve(request))));
  return resources;
}

/** A bounded observation of one public page and fixed discovery paths. All
 * source-level conclusions retain their transport evidence and limitations. */
export async function analyzeSite(input: string, dependencies: AuditDependencies = {}): Promise<SiteAuditReport> {
  const target = normalizeTarget(input);
  const transport = dependencies.transport ?? createWorkersTransport();
  const checkedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  const pageResource = await transport.retrieve({ kind: 'page', url: target.href, accept: 'text/html,application/xhtml+xml' });
  // Discovery files belong to the final public page origin. If the page failed
  // validation/fetch, keep the original validated origin for independent checks.
  let pageUrl = target;
  try { if (received(pageResource)) pageUrl = normalizeTarget(pageResource.evidence.finalUrl); } catch { /* Keep the validated input. */ }
  const origin = pageUrl.origin;
  const [robotsResource, llmsResource, sitemapResource, markdownResource, ...probes] = await retrieveAll(transport, [
    { kind: 'robots', url: `${origin}/robots.txt`, accept: 'text/plain' },
    { kind: 'llms', url: `${origin}/llms.txt`, accept: 'text/plain,text/markdown' },
    { kind: 'sitemap', url: `${origin}/sitemap.xml`, accept: 'application/xml,text/xml' },
    { kind: 'markdown', url: pageUrl.href, accept: 'text/markdown' },
    ...['ChatGPT-User', 'Claude-User', 'Perplexity-User'].map(probeAgent => ({ kind: 'probe' as const, url: pageUrl.href, accept: 'text/html', probeAgent })),
  ]);
  if (!robotsResource || !llmsResource || !sitemapResource || !markdownResource) throw new Error('Audit resource plan is incomplete');
  const all = [pageResource, robotsResource, llmsResource, sitemapResource, markdownResource, ...probes];
  const page = success(pageResource) && htmlType(pageResource) && pageResource.text !== null ? inspectHtml(pageResource.text, pageUrl)
    : emptyPage(success(pageResource) ? 'not-html' : 'unavailable');
  const robotsUsable = success(robotsResource) && robotsResource.text !== null && !htmlType(robotsResource);
  const document = parseRobots(robotsUsable ? robotsResource.text ?? '' : '');
  const robotsState = robotsUsable && document.complete ? 'parsed' : missing(robotsResource) ? 'missing'
    : received(robotsResource) && (robotsResource.evidence.status ?? 0) >= 500 ? 'unreachable' : 'unavailable';
  const bots: BotRuleAssessment[] = BOT_PROFILES.map(profile => ({ ...profile,
    ...(robotsUsable ? evaluateRobots(document, profile.token, pageUrl.pathname)
      : missing(robotsResource) ? { decision: 'allowed' as const, matchedGroups: [], matchedRule: null, reason: `robots.txt returned HTTP ${robotsResource.evidence.status}; RFC 9309 permits access when the file is unavailable (4xx). This does not establish page access.` }
        : { decision: 'unknown' as const, matchedGroups: [], matchedRule: null, reason: robotsState === 'unreachable' ? 'robots.txt returned a server error; RFC 9309 directs crawlers to assume complete disallow while unreachable.' : 'No complete usable robots.txt response was available.' }),
  }));
  for (const bot of bots) {
    if (bot.token === 'ExaSearchBot' && robotsUsable && !document.groups.some(group => group.agents.some(agent => agent.toLowerCase() === 'exasearchbot'))) {
      bot.decision = 'unknown';
      bot.matchedGroups = [];
      bot.matchedRule = null;
      bot.reason = 'Exa documents an additional major-search-engine fallback when no ExaSearchBot-specific group exists; this generic RFC policy evaluator cannot resolve that vendor policy.';
    }
    if (bot.token === 'Shap-User') bot.reason += ' Parallel describes Shap-User as a visibility identifier rather than a token intended for automated controls; this is only a declared-token policy interpretation.';
  }
  const llmsPresent = success(llmsResource) && !htmlType(llmsResource) && !!llmsResource.text?.trim();
  const sitemapXml = success(sitemapResource) && /<(?:[\w-]+:)?(?:urlset|sitemapindex)\b/i.test(sitemapResource.text ?? '');
  const markdownNegotiated = success(markdownResource) && /^text\/markdown(?:;|$)/i.test(markdownResource.evidence.contentType ?? '');
  const findings: Finding[] = [];
  function finding(id: string, severity: Finding['severity'], title: string, evidence: string, recommendation: string) { findings.push({ id, severity, title, evidence, recommendation }); }
  if (!success(pageResource)) finding('page-response', 'action', 'The page did not return a successful response', `Outcome ${pageResource.evidence.outcome}; HTTP ${pageResource.evidence.status ?? 'unavailable'}.`, 'Inspect the page response and edge/firewall logs for this URL. A failure from this audit is not proof that a real assistant fails.');
  else if (!htmlType(pageResource)) finding('page-media-type', 'review', 'The page response is not HTML', `Content-Type: ${pageResource.evidence.contentType ?? 'not supplied'}.`, 'Confirm this is the intended page representation and serve HTML with its correct Content-Type when appropriate.');
  if (page.parseState === 'parsed') {
    if (page.textCharacters < 200) finding('sparse-html', 'review', 'Little text was observed in the HTML source', `${page.textCharacters} text characters outside scripts, styles, templates, SVG and noscript; ${page.scriptElements} script elements.`, 'Check that the useful answer is in server-delivered HTML. This audit does not execute JavaScript or establish a rendering dependency.');
    if (page.title === null || page.title === '') finding('page-title', 'action', 'No page title was observed', 'No nonempty title element was extracted.', 'Give this page a specific title that describes what a reader or agent can learn or do.');
    if (page.description === null || page.description === '') finding('page-description', 'review', 'No description was observed', 'No nonempty meta description was extracted.', 'Add a concise description of this page when it helps previews and discovery.');
    if (page.canonical === null) finding('canonical', 'review', 'No canonical URL was observed', 'No usable HTTP(S) canonical link was extracted.', 'Declare the preferred page URL when duplicate representations or routes exist.');
    else if (page.canonical !== pageUrl.href) finding('canonical-different', 'review', 'The canonical points to another URL', `Observed canonical: ${page.canonical}.`, 'Confirm that the canonical identifies the intended preferred page; a difference can be intentional.');
    if (page.invalidStructuredDataBlocks) finding('invalid-jsonld', 'review', 'Some JSON-LD did not parse as JSON', `${page.invalidStructuredDataBlocks} of ${page.structuredDataBlocks} observed JSON-LD blocks failed JSON parsing.`, 'Repair the invalid JSON and validate the applicable schema. A parsed JSON object alone does not establish schema validity or citation eligibility.');
    if (page.structuredDataBlocks === 0) finding('structured-data', 'info', 'No JSON-LD blocks were observed', 'This source-level check did not find application/ld+json scripts.', 'Add relevant structured data if it accurately describes this page. It is not a requirement for an assistant to read the HTML.');
  }
  const restrictiveMetadata = [...page.metaRobots.map(rule => `${rule.agent}: ${rule.value}`), pageResource.evidence.headers.robots ?? ''].filter(value => /\b(?:noindex|none|nosnippet|max-snippet\s*:\s*0)\b/i.test(value));
  if (restrictiveMetadata.length) finding('indexing-controls', 'review', 'Indexing or snippet restrictions were observed', restrictiveMetadata.join('; ').slice(0, 2000), 'Check that these controls match your intent. Interpret agent-scoped directives using the relevant provider documentation; crawler access and indexing are separate.');
  const blockedAnswers = bots.filter(bot => bot.decision === 'disallowed' && (bot.role === 'assistant' || bot.role === 'search'));
  if (blockedAnswers.length) finding('robots-answer-bots', 'review', 'Robots rules disallow some search or assistant product tokens on this path', blockedAnswers.map(bot => `${bot.token}: ${bot.matchedRule}`).join('; '), 'If you want these clients to retrieve this path, review their matching group. Preserve intentional training controls. These policy results do not prove a provider visited, obeyed the rule, or cited the page.');
  if (robotsState === 'unreachable' || robotsState === 'unavailable') finding('robots-unavailable', 'action', 'Robots policy could not be assessed completely', `robots.txt: ${robotsResource.evidence.outcome}; HTTP ${robotsResource.evidence.status ?? 'unavailable'}.`, 'Restore a complete robots.txt response and recheck. Server errors can cause compliant crawlers to stop crawling.');
  if (llmsPresent) finding('llms-present', 'info', 'An llms.txt response was observed', `${llmsResource.evidence.bytes} response bytes; links are counted without fetching them.`, 'Keep the directory accurate if you maintain it. Presence does not prove discovery, ranking, use or citation.');
  else finding('llms-optional', 'info', 'No usable llms.txt was observed', `Outcome ${llmsResource.evidence.outcome}; HTTP ${llmsResource.evidence.status ?? 'unavailable'}.`, 'An llms.txt directory is optional. Prioritize accessible useful pages and inspect actual agent use before treating it as an acquisition intervention.');
  if (!sitemapXml) finding('sitemap', 'info', 'No sitemap XML was observed at /sitemap.xml', `Outcome ${sitemapResource.evidence.outcome}; HTTP ${sitemapResource.evidence.status ?? 'unavailable'}. ${document.sitemaps.length} Sitemap directive(s) observed in robots.txt.`, 'Check the sitemap URL you actually publish. This audit checks only the fixed root path and does not crawl arbitrary sitemap links.');
  if (markdownNegotiated) finding('markdown', 'info', 'The page negotiated a Markdown response', `Accept: text/markdown returned ${markdownResource.evidence.contentType}.`, 'Keep the Markdown and HTML content consistent. Successful negotiation does not establish which representation a provider uses.');
  for (const probe of probes) {
    if (probe.evidence.status !== pageResource.evidence.status || probe.evidence.outcome !== pageResource.evidence.outcome) finding(`probe-${probe.evidence.probeAgent}`, 'review', `${probe.evidence.probeAgent} declaration received a different outcome`, `Audit client: ${pageResource.evidence.outcome}, HTTP ${pageResource.evidence.status ?? 'unavailable'}; synthetic declaration: ${probe.evidence.outcome}, HTTP ${probe.evidence.status ?? 'unavailable'}.`, 'Inspect edge rules and logs, then test the real provider. These requests originate from this audit and change only the User-Agent declaration; they do not reproduce provider IPs, signatures or browser behavior.');
  }
  return { version: SITE_AUDIT_VERSION, checkedAt, target: target.href, complete: all.every(received) && bots.every(bot => bot.decision !== 'unknown'), resources: all.map(resource => resource.evidence), page,
    robots: { state: robotsState, groups: document.groups.length, rules: document.groups.reduce((sum, group) => sum + group.rules.length, 0), sitemaps: document.sitemaps, bots },
    discovery: { llms: llmsPresent ? 'present' : missing(llmsResource) ? 'missing' : 'unavailable', llmsLinks: llmsPresent ? [...(llmsResource.text ?? '').matchAll(/\[[^\]\n]*\]\([^\s)]+\)/g)].length : 0,
      sitemap: sitemapXml ? 'xml-observed' : missing(sitemapResource) ? 'missing' : success(sitemapResource) ? 'unexpected-content' : 'unavailable',
      markdown: markdownNegotiated ? 'negotiated' : received(markdownResource) ? 'not-negotiated' : 'unavailable' }, findings,
    limits: [
      'One page and fixed root discovery paths; no site crawl, browser execution, provider login, search-result check or citation trial.',
      'Robots decisions apply to the final page path and declared product token. They are policy interpretations, not access authorization or proof that a provider follows them.',
      'Training-control groups are policy tokens for training or secondary reuse, not evidence that a particular request trains a model. Google-Extended also governs some grounding uses; Applebot-Extended controls secondary reuse, and CCBot builds a general web corpus. Consult each provider source for its exact scope.',
      'The three named User-Agent probes are synthetic requests from this audit. They do not authenticate or reproduce OpenAI, Anthropic or Perplexity infrastructure.',
      'HTML text and metadata are bounded source-level observations. Response header values longer than 2,048 characters are omitted and remain unassessed. These observations do not establish rendered visibility, schema validity, answer quality or what an assistant extracts.',
      'llms.txt, Markdown, sitemap and structured-data presence do not establish ranking, recommendation, training use or citation.',
      'At most 12 target GETs including redirects, three redirects per resource, 512 KiB per response and a 22-second transport deadline. Robots parsing is limited to 10,000 lines/5,000 rules/8,192 characters per line and wildcard comparison to 200,000 steps per token; policy-limit results remain unknown. Partial failures remain visible.',
      'Public HTTPS only. Production safety depends on Cloudflare Workers global_fetch_strictly_public connection-time network filtering, in addition to URL and DNS preflight checks.',
    ] };
}

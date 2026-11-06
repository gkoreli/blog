import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import { additionalReviewFindings } from '../lib/site-audit-presentation.js';
import { deriveTechnicalAssessment } from '@gkoreli/site-audit/product';
import { node, definition, makeTable, safeLink, rawEvidence, disclosure, object } from './tool-dom.js';

/** Remote values become text nodes. Scores are recalculated from the evidence. */
export function renderSiteAudit(report: SiteAuditReport, example = false): HTMLElement {
  const assessment = deriveTechnicalAssessment(report);
  const article = node('section', undefined, 'ai-check-report'); article.setAttribute('aria-label', 'Site access report');
  if (example) article.id = 'example';
  const header = node('header', undefined, 'ai-check-report-header'), identity = node('div');
  identity.append(node('span', example ? 'Example report · saved observation' : 'Your access report', 'ai-check-report-label'),
    node('h2', report.page.title ?? 'Page access report'), node('p', report.target, 'ai-check-target'),
    node('p', `Observed ${report.checkedAt}${example ? ' · No live check performed' : ''}`, 'tool-caption'));
  header.append(identity); article.append(header);
  const overview = node('div', undefined, 'access-overview'), score = node('div', undefined, 'access-score');
  const total = assessment.score.lower === assessment.score.upper ? String(assessment.score.lower) : `${assessment.score.lower}–${assessment.score.upper}`;
  score.dataset['state'] = assessment.counts.failed > 0 ? 'action' : assessment.counts.unknown > 0 ? 'review' : 'pass';
  score.append(node('strong', total), node('span', 'out of 100'));
  score.setAttribute('aria-label', `Technical access score ${total} out of 100`);
  const summary = node('div', undefined, 'access-summary');
  const verdict = assessment.counts.failed > 0 ? 'A few checks need your attention.' : assessment.counts.unknown > 0 ? 'Some evidence is still unavailable.' : 'The core access checks passed.';
  summary.append(node('span', assessment.label, 'ai-check-report-label'), node('h3', verdict),
    node('p', `${assessment.counts.passed} passed · ${assessment.counts.failed} need attention · ${assessment.counts.unknown} unassessed`, 'access-coverage'),
    node('p', `${assessment.score.coveragePercent}% of weighted checks assessed. ${assessment.score.upper > assessment.score.lower ? 'The range includes points with unknown evidence.' : 'Expand the checks below to see how the score adds up.'}`));
  const method = node('a', 'How this score works'); method.href = '#score-method'; summary.append(method); overview.append(score, summary); article.append(overview);
  const components = node('div', undefined, 'access-components');
  for (const component of assessment.components) {
    const item = node('div', undefined, 'access-component');
    item.append(node('h3', component.title), node('strong', component.unknown ? `${component.earned}–${component.earned + component.unknown}` : String(component.earned)), node('small', ` / ${component.max}`),
      node('span', component.checks.some(check => check.state === 'fail') ? 'Needs attention' : component.unknown ? 'Partial evidence' : 'Checks passed', 'access-component-state'));
    components.append(item);
  }
  article.append(components, node('h3', 'Your next steps', 'access-next-heading'));
  const next = assessment.components.flatMap(component => component.checks).filter(check => check.state !== 'pass').sort((a, b) => (a.state === 'fail' ? 0 : 1) - (b.state === 'fail' ? 0 : 1) || b.weight - a.weight);
  if (next.length === 0) article.append(node('p', 'No issue was identified in these scored checks. Review your crawler policies and optional support below for choices specific to your site.', 'ai-check-note'));
  for (const [index, check] of next.slice(0, 3).entries()) {
    const item = node('div', undefined, 'ai-check-finding'); item.dataset['severity'] = check.state === 'fail' ? 'action' : 'review';
    item.append(node('span', `0${index + 1} · ${check.state === 'fail' ? 'Improve' : 'Investigate'} · ${check.weight} points`, 'ai-check-finding-label'), node('h3', check.title), node('p', check.nextStep));
    const evidence = node('details'); evidence.append(node('summary', 'Why this was flagged'), node('p', check.evidence)); item.append(evidence); article.append(item);
  }
  const otherFindings = additionalReviewFindings(report, assessment);
  if (otherFindings.length) {
    article.append(node('h3', 'Other observations to review', 'access-next-heading'), node('p', 'These observations do not deduct score points. They can still matter to your intended clients and publishing policy.', 'tool-caption'));
    for (const finding of otherFindings.slice(0, 3)) {
      const item = node('section', undefined, 'ai-check-finding'); item.dataset['severity'] = finding.severity;
      item.append(node('span', 'Review · no score deduction', 'ai-check-finding-label'), node('h3', finding.title), node('p', finding.evidence), node('p', finding.recommendation)); article.append(item);
    }
  }
  const allFindings = disclosure(`All observations and next checks · ${report.findings.length}`);
  for (const finding of report.findings) {
    const item = node('section'); item.append(node('h4', finding.title), node('p', finding.evidence), node('p', finding.recommendation)); allFindings.body.append(item);
  }
  if (!report.findings.length) allFindings.body.append(node('p', 'No additional observations were recorded.'));
  article.append(allFindings.details);
  for (const component of assessment.components) {
    const group = disclosure(`${component.title} · ${component.checks.length} ${component.checks.length === 1 ? 'check' : 'checks'}`);
    for (const check of component.checks) {
      const row = node('div', undefined, 'access-check-row'); row.dataset['state'] = check.state;
      const description = node('div'); description.append(node('strong', check.title), node('small', ` · ${check.state === 'pass' ? 'Passed' : check.state === 'fail' ? 'Needs attention' : 'Unassessed'}`), node('p', check.evidence));
      if (check.state !== 'pass') description.append(node('p', check.nextStep));
      row.append(node('span', check.state === 'pass' ? '✓' : check.state === 'fail' ? '×' : '?', 'access-check-indicator'), description,
        node('span', check.state === 'unknown' ? `? / ${check.weight}` : `${check.state === 'pass' ? check.weight : 0} / ${check.weight}`, 'access-check-points'));
      group.body.append(row);
    }
    article.append(group.details);
  }
  const optional = disclosure('Optional support · no score deductions');
  const features = node('div', undefined, 'access-optional');
  for (const feature of assessment.optional) {
    const item = node('div', undefined, 'access-optional-item');
    const label = feature.id === 'markdown' && feature.state === 'not-negotiated' ? 'HTML returned; Markdown optional' : feature.state === 'not-provided' ? 'Not offered · optional' : feature.state.replaceAll('-', ' ');
    item.append(node('h4', feature.title), node('span', label, 'access-optional-state'), node('p', feature.evidence), node('p', feature.nextStep)); features.append(item);
  }
  optional.body.append(features); article.append(optional.details);
  const robots = disclosure(`Crawler policy · ${report.robots.bots.length} clients`);
  robots.body.append(node('p', 'Search, assistant and training controls are separate choices. These published policies do not authenticate a provider or verify firewall access.', 'ai-check-note'));
  const policies = makeTable('Declared crawler policies for this path', ['Client and stated role', 'Path policy', 'Matching evidence']);
  for (const bot of report.robots.bots) {
    const row = policies.body.insertRow(), who = row.insertCell(), decision = row.insertCell(), evidence = row.insertCell();
    who.append(safeLink(bot.token, bot.source), node('small', `${bot.provider} · ${bot.role}`)); decision.textContent = bot.decision;
    evidence.append(node('span', bot.matchedRule ?? 'No matching path rule'), node('small', bot.reason), node('small', `Groups: ${bot.matchedGroups.join(', ') || 'none'}`));
  }
  robots.body.append(policies.wrapper); article.append(robots.details);
  const page = disclosure('Page source · text, metadata and links');
  page.body.append(definition([
    ['HTML assessment', report.page.parseState], ['Title', report.page.title ?? 'Not observed'], ['Description', report.page.description ?? 'Not observed'],
    ['Canonical', report.page.canonical ?? 'Not observed'], ['Language', report.page.language ?? 'Not observed'],
    ['Source text', `${report.page.textCharacters.toLocaleString()} characters; scripts were not executed`],
    ['Headings / links / scripts', `${report.page.headings} / ${report.page.links} / ${report.page.scriptElements}`],
    ['Meta indexing controls', report.page.metaRobots.map(item => `${item.agent}: ${item.value}`).join('; ') || 'Not observed'],
    ['Structured data types', report.page.structuredDataTypes.join(', ') || 'No types observed'],
    ['Alternate links', report.page.alternateLinks.map(item => `${item.type}: ${item.href}`).join('\n') || 'Not observed'],
  ]));
  if (report.page.textPreview) page.body.append(node('h4', 'Initial HTML text preview'), node('p', report.page.textPreview), node('p', 'This source-level estimate can include navigation or text hidden by CSS. It is not a rendered-browser comparison.', 'tool-caption'));
  if (report.page.headingOutline?.length) { const outline = node('ul'); for (const heading of report.page.headingOutline) outline.append(node('li', `H${heading.level} · ${heading.text}`)); page.body.append(node('h4', 'Heading outline'), outline); }
  article.append(page.details);
  const delivery = disclosure('HTTP evidence · resources and synthetic probes');
  delivery.body.append(node('p', 'Every row records a request made by this checker. A bot-named probe does not come from that bot’s provider and cannot verify that provider’s firewall treatment.', 'ai-check-note'));
  const resources = makeTable('Bounded HTTP observations', ['Resource', 'Response', 'Delivery evidence']);
  for (const resource of report.resources) {
    const row = resources.body.insertRow(), name = row.insertCell(), outcome = row.insertCell(), facts = row.insertCell();
    name.append(node('strong', resource.probeAgent ? `Synthetic ${resource.probeAgent}` : resource.kind), node('small', resource.requestedUrl));
    if (resource.finalUrl !== resource.requestedUrl) name.append(node('small', `Final: ${resource.finalUrl}`));
    outcome.append(node('span', resource.status === null ? resource.outcome : `${resource.status} · ${resource.outcome}`), node('small', resource.contentType ?? 'Content-Type unavailable'));
    facts.append(node('span', `${resource.bytes.toLocaleString()} bytes · ${resource.elapsedMs} ms · ${resource.redirects} redirects`));
    for (const [label, value] of [['X-Robots-Tag', resource.headers.robots], ['Link', resource.headers.link], ['Content-Location', resource.headers.contentLocation], ['Vary', resource.headers.vary]]) if (value !== null) facts.append(node('small', `${label}: ${value}`));
  }
  delivery.body.append(resources.wrapper); article.append(delivery.details);
  const limits = disclosure('Method, coverage and limits'), list = node('ul', undefined, 'ai-check-limits');
  for (const limit of [...assessment.limits, ...report.limits]) list.append(node('li', limit));
  limits.body.append(node('p', `Scoring ${assessment.profile} · collection ${report.version}`, 'tool-caption'), list); article.append(limits.details, rawEvidence(report)); return article;
}

function at(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) { if (!object(current)) return undefined; current = current[key]; }
  return current;
}
function display(value: unknown): string {
  if (value === null || value === undefined) return 'Unavailable';
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ') || 'None observed';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
export function renderRequestEvidence(value: Record<string, unknown>): HTMLElement {
  const section = node('section'); section.append(node('h3', 'Evidence from this request'));
  section.append(definition([
    ['Request category', display(at(value, 'classification', 'readerKind'))],
    ['Classification reason', display(at(value, 'classification', 'reason'))],
    ['Declared client names', display(at(value, 'evidence', 'declarations', 'candidates'))],
    ['Declaration agreement', display(at(value, 'evidence', 'categoryAgreement'))],
    ['Browser-family claim', display(at(value, 'evidence', 'declarations', 'browserFamily'))],
    ['Navigation-shaped', display(at(value, 'evidence', 'navigationShaped'))],
    ['Activation claim', display(at(value, 'evidence', 'activation'))],
    ['Client-form markers', display(at(value, 'clientForm', 'form'))],
    ['Network list evidence', display(at(value, 'evidence', 'network'))],
    ['Network ASN', display(at(value, 'network', 'asn'))],
    ['Published-IP-feed results', display(at(value, 'network', 'vendorNetwork', 'summary'))],
    ['Local signature outcome', display(at(value, 'signature', 'localOutcome'))],
    ['Verified signer display', display(at(value, 'signature', 'signer'))],
    ['Cloudflare category', display(at(value, 'signature', 'native', 'category', 'value'))],
    ['Cloudflare verified bot', display(at(value, 'signature', 'native', 'verifiedBot'))],
    ['Cloudflare signed agent', display(at(value, 'signature', 'native', 'signedAgent'))],
  ]));
  const limits = at(value, 'limits');
  if (Array.isArray(limits)) { const list = node('ul', undefined, 'ai-check-limits'); for (const limit of limits) if (typeof limit === 'string') list.append(node('li', limit)); section.append(list); }
  section.append(rawEvidence(value, 'Complete request evidence, signature coverage and method versions'));
  return section;
}
function quotaLabel(value: unknown): string | null {
  if (!object(value) || typeof value['limit'] !== 'number' || typeof value['remaining'] !== 'number' || typeof value['resetAt'] !== 'string') return null;
  const parsed = new Date(value['resetAt']);
  const reset = Number.isNaN(parsed.getTime()) ? value['resetAt'] : parsed.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  return `${value['remaining']} of ${value['limit']} checks remaining · resets ${reset}.`;
}
function errorMessage(value: unknown): string {
  if (object(value) && typeof value['error'] === 'string' && value['error'].length <= 1000) return value['error'];
  if (object(value) && object(value['error']) && typeof value['error']['message'] === 'string' && value['error']['message'].length <= 1000) return value['error']['message'];
  return 'The check could not finish. Please try again.';
}

export class SiteAuditCheck extends HTMLElement {
  private abort: AbortController | null = null;
  private downloadUrl: string | null = null;
  private readonly onExample = (event: MouseEvent): void => { if (event.target instanceof Element && event.target.closest('[data-example-check]')) { event.preventDefault(); void this.example(); } };
  private readonly onSubmit = (event: SubmitEvent): void => { event.preventDefault(); void this.check(); };
  connectedCallback(): void { this.addEventListener('submit', this.onSubmit); this.addEventListener('click', this.onExample); if (typeof location !== 'undefined' && location.hash === '#example') void this.example(); }
  disconnectedCallback(): void { this.removeEventListener('submit', this.onSubmit); this.removeEventListener('click', this.onExample); this.abort?.abort(); this.clearDownload(); }
  private clearDownload(): void { if (this.downloadUrl !== null) URL.revokeObjectURL(this.downloadUrl); this.downloadUrl = null; }
  private async example(): Promise<void> {
    const status = this.querySelector('[data-audit-status]'), results = this.querySelector('[data-audit-results]'); if (!(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    status.dataset['state'] = 'loading';
    status.textContent = 'Opening the saved example. No check used…';
    try {
      const response = await fetch('/ai-check-example.json', { headers: { Accept: 'application/json' }, redirect: 'error' });
      const value: unknown = await response.json();
      const report = object(value) && object(value['report']) ? value['report'] : value;
      if (!response.ok || !isSiteAuditReport(report)) throw new Error('Example unavailable');
      document.getElementById('ai-check-server-result')?.replaceChildren(); results.replaceChildren(renderSiteAudit(report, true));
      this.clearDownload(); this.downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
      const download = node('a', 'Download example JSON', 'ai-check-download'); download.href = this.downloadUrl; download.download = 'ai-access-example.json'; results.append(download);
      status.dataset['state'] = 'ready';
      status.textContent = 'Saved example report. No live request to the target and no daily check used.';
      results.scrollIntoView({ block: 'start', behavior: 'auto' });
    } catch { status.dataset['state'] = 'error'; status.textContent = 'The example could not load. No daily check was used.'; }
  }
  private async check(): Promise<void> {
    const form = this.querySelector('form'), input = this.querySelector('input'), button = this.querySelector('button'), status = this.querySelector('[data-audit-status]'), results = this.querySelector('[data-audit-results]');
    if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    if (!form.reportValidity()) return;
    this.abort?.abort(); this.abort = new AbortController();
    button.disabled = true; status.dataset['state'] = 'loading'; status.textContent = 'Checking the page and public discovery files…'; results.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/ai-check', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ url: input.value.trim() }), signal: this.abort.signal, redirect: 'error' });
      const value: unknown = await response.json();
      if (!response.ok) { status.dataset['state'] = 'error'; status.textContent = `${errorMessage(value)} ${object(value) ? quotaLabel(value['quota']) ?? '' : ''}`.trim(); return; }
      if (!object(value) || !isSiteAuditReport(value['report'])) throw new Error('The service returned an incomplete report.');
      document.getElementById('ai-check-server-result')?.replaceChildren();
      results.replaceChildren(renderSiteAudit(value['report']));
      this.clearDownload(); this.downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
      const download = node('a', 'Download JSON report', 'ai-check-download'); download.href = this.downloadUrl; download.download = 'ai-access-report.json'; results.append(download);
      status.dataset['state'] = 'ready'; status.textContent = `${value['report'].complete ? 'Report ready.' : 'Partial report ready; unavailable evidence is labeled below.'} ${quotaLabel(value['quota']) ?? ''}`.trim();
    } catch (error: unknown) {
      if (this.abort.signal.aborted) return;
      status.dataset['state'] = 'error'; status.textContent = error instanceof Error && error.message === 'The service returned an incomplete report.' ? error.message : 'The response could not be read. If the connection was lost after submission, that check may have used one of today’s allowance.';
    } finally { button.disabled = false; results.setAttribute('aria-busy', 'false'); }
  }
}

export class RequestEvidenceCheck extends HTMLElement {
  private readonly onClick = (): void => { void this.inspect(); };
  connectedCallback(): void { const button = this.querySelector('[data-request-check]'); if (button instanceof HTMLButtonElement) { button.hidden = false; button.addEventListener('click', this.onClick); } }
  disconnectedCallback(): void { this.querySelector('[data-request-check]')?.removeEventListener('click', this.onClick); }
  private async inspect(): Promise<void> {
    const button = this.querySelector('[data-request-check]'), status = this.querySelector('[data-request-status]'), results = this.querySelector('[data-request-results]');
    if (!(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    button.disabled = true; status.textContent = 'Inspecting this fetch request…';
    try {
      const response = await fetch('/api/request-check', { headers: { Accept: 'application/json' }, redirect: 'error' });
      const value: unknown = await response.json();
      if (!response.ok) { status.textContent = errorMessage(value); return; }
      if (!object(value) || !object(value['request'])) throw new Error('Request evidence unavailable');
      results.replaceChildren(renderRequestEvidence(value['request']));
      status.textContent = `Request evidence ready. ${quotaLabel(value['quota']) ?? ''}`.trim();
    } catch { status.textContent = 'This request could not be inspected. Try the JSON link below.'; }
    finally { button.disabled = false; }
  }
}

if (!customElements.get('site-audit-check')) customElements.define('site-audit-check', SiteAuditCheck);
if (!customElements.get('request-evidence-check')) customElements.define('request-evidence-check', RequestEvidenceCheck);

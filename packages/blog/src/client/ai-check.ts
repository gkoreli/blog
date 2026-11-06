import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import { additionalReviewFindings, optionalSupportLabel, reportIdentity, assessmentVerdict, reportFacts } from '../lib/site-audit-presentation.js';
import { deriveTechnicalAssessment } from '@gkoreli/site-audit/product';
import { normalizeTarget, TargetValidationError } from '@gkoreli/site-audit/target';
import { failureFeedback, feedbackQuota, type CheckFeedback } from '../lib/check-feedback.js';
import { node, definition, makeTable, safeLink, rawEvidence, disclosure, object } from './tool-dom.js';

/** Remote values become text nodes. Scores are recalculated from the evidence. */
export function renderSiteAudit(report: SiteAuditReport, example = false): HTMLElement {
  const assessment = deriveTechnicalAssessment(report);
  const article = node('section', undefined, 'ai-check-report'); article.setAttribute('aria-label', 'Site access report');
  article.id = 'access-report'; article.tabIndex = -1;
  const reportMeta = reportIdentity(report);
  const header = node('header', undefined, 'ai-check-report-header'), identity = node('div');
  identity.append(node('span', example ? 'Example report · saved observation' : 'Your access report', 'ai-check-report-label'),
    node('h2', reportMeta.host), node('p', report.target, 'ai-check-target'),
    node('p', `Observed ${reportMeta.observed}${example ? ' · No live check performed' : ''}`, 'tool-caption'));
  const actions = node('div', undefined, 'report-actions');
  const compare = node('a', 'Compare reports'); compare.href = '/tools/compare'; actions.append(compare);
  header.append(identity, actions); article.append(header);
  if (example) article.append(node('p', 'Saved example · This is a dated report, not a fresh check. No daily check used.', 'report-example-note'));
  const jump = node('nav', undefined, 'report-navigation'); jump.setAttribute('aria-label', 'Report sections');
  for (const [label, id] of [['Overview', 'report-overview'], ['Next steps', 'report-next'], ['Evidence', 'report-evidence']] as const) { const link = node('a', label); link.href = `#${id}`; jump.append(link); }
  article.append(jump);
  const overview = node('div', undefined, 'access-overview'), score = node('div', undefined, 'access-score');
  const total = assessment.score.lower === assessment.score.upper ? String(assessment.score.lower) : `${assessment.score.lower}–${assessment.score.upper}`;
  score.dataset['range'] = String(assessment.score.lower !== assessment.score.upper);
  score.dataset['state'] = assessment.counts.failed > 0 ? 'action' : assessment.counts.unknown > 0 ? 'review' : 'pass';
  score.style.setProperty('--score-earned', `${assessment.score.lower}%`);
  score.style.setProperty('--score-possible', `${assessment.score.upper}%`);
  const scoreValue = node('div', undefined, 'access-score-value'); scoreValue.append(node('strong', total), node('span', 'out of 100')); score.append(scoreValue);
  overview.id = 'report-overview';
  score.setAttribute('aria-label', `Technical access score ${total} out of 100`);
  const summary = node('div', undefined, 'access-summary');
  const verdict = assessmentVerdict(assessment);
  summary.append(node('span', assessment.label, 'ai-check-report-label'), node('h3', verdict),
    node('p', `${assessment.counts.passed} passed · ${assessment.counts.failed} need attention · ${assessment.counts.unknown} unassessed`, 'access-coverage'),
    node('p', `${assessment.score.lower} earned · ${100 - assessment.score.upper} deducted · ${assessment.score.upper - assessment.score.lower} unknown points`, 'access-points-ledger'),
    node('p', `${assessment.score.coveragePercent}% of weighted checks assessed. ${assessment.score.upper > assessment.score.lower ? 'The range includes points with unknown evidence.' : 'Expand the checks below to see how the score adds up.'}`));
  const method = node('a', 'How this score works'); method.href = '#score-method'; summary.append(method); overview.append(score, summary); article.append(overview);
  const components = node('div', undefined, 'access-components');
  for (const component of assessment.components) {
    const item = node('div', undefined, 'access-component');
    item.append(node('h3', component.title), node('strong', component.unknown ? `${component.earned}–${component.earned + component.unknown}` : String(component.earned)), node('small', ` / ${component.max}`),
      node('span', component.checks.some(check => check.state === 'fail') ? 'Needs attention' : component.unknown ? 'Partial evidence' : 'Checks passed', 'access-component-state'));
    const bar = node('div', undefined, 'access-component-bar'); bar.setAttribute('aria-hidden', 'true');
    bar.style.setProperty('--bar-earned', `${component.earned / component.max * 100}%`);
    bar.style.setProperty('--bar-possible', `${(component.earned + component.unknown) / component.max * 100}%`);
    item.dataset['state'] = component.checks.some(check => check.state === 'fail') ? 'action' : component.unknown ? 'review' : 'pass';
    item.append(bar); components.append(item);
  }
  article.append(components);
  const facts = node('dl', undefined, 'report-facts');
  for (const fact of reportFacts(report)) { const item = node('div'); item.append(node('dt', fact.label), node('dd', fact.value), node('dd', fact.detail, 'report-fact-detail')); facts.append(item); }
  article.append(facts);
  const nextHeading = node('h3', 'Your next steps', 'access-next-heading'); nextHeading.id = 'report-next'; article.append(nextHeading);
  const next = assessment.components.flatMap(component => component.checks).filter(check => check.state !== 'pass').sort((a, b) => (a.state === 'fail' ? 0 : 1) - (b.state === 'fail' ? 0 : 1) || b.weight - a.weight);
  if (next.length === 0) article.append(node('p', 'No issue was identified in these scored checks. Review your crawler policies and optional support below for choices specific to your site.', 'ai-check-note'));
  for (const [index, check] of next.slice(0, 3).entries()) {
    const item = node('div', undefined, 'ai-check-finding'); item.dataset['severity'] = check.state === 'fail' ? 'action' : 'review';
    item.append(node('span', `0${index + 1} · ${check.state === 'fail' ? 'Improve' : 'Investigate'} · ${check.weight} points`, 'ai-check-finding-label'), node('h3', check.title), node('p', check.state === 'unknown' ? check.evidence : check.nextStep));
    const evidence = node('details'); evidence.append(node('summary', check.state === 'unknown' ? 'How to investigate' : 'Why this was flagged'), node('p', check.state === 'unknown' ? check.nextStep : check.evidence)); item.append(evidence); article.append(item);
  }
  const otherFindings = additionalReviewFindings(report, assessment);
  if (otherFindings.length) {
    article.append(node('h3', 'Other observations to review', 'access-next-heading'), node('p', 'These observations do not deduct score points. They can still matter to your intended clients and publishing policy.', 'tool-caption'));
    for (const finding of otherFindings.slice(0, 3)) {
      const item = node('section', undefined, 'ai-check-finding'); item.dataset['severity'] = finding.severity;
      item.append(node('span', 'Review · no score deduction', 'ai-check-finding-label'), node('h3', finding.title), node('p', finding.evidence), node('p', finding.recommendation)); article.append(item);
    }
  }
  const evidenceHeading = node('h3', 'Explore the evidence', 'access-next-heading'); evidenceHeading.id = 'report-evidence'; article.append(evidenceHeading);
  const allFindings = disclosure(`All observations and next checks · ${report.findings.length}`);
  for (const finding of report.findings) {
    const item = node('section'); item.append(node('h4', finding.title), node('p', finding.evidence), node('p', finding.recommendation)); allFindings.body.append(item);
  }
  if (!report.findings.length) allFindings.body.append(node('p', 'No additional observations were recorded.'));
  article.append(allFindings.details);
  for (const component of assessment.components) {
    const group = disclosure(`${component.title} · ${component.checks.length} ${component.checks.length === 1 ? 'check' : 'checks'}`);
    group.details.open = component.checks.some(check => check.state !== 'pass');
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
    const label = optionalSupportLabel(feature);
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
  page.details.classList.add('access-source');
  page.body.append(definition([
    ['HTML assessment', report.page.parseState], ['Title', report.page.title ?? 'Not observed'], ['Description', report.page.description ?? 'Not observed'],
    ['Canonical', report.page.canonical ?? 'Not observed'], ['Language', report.page.language ?? 'Not observed'],
    ['Source text', `${report.page.textCharacters.toLocaleString()} characters; scripts were not executed`],
    ['Headings / links / scripts', `${report.page.headings} / ${report.page.links} / ${report.page.scriptElements}`],
    ['Meta indexing controls', report.page.metaRobots.map(item => `${item.agent}: ${item.value}`).join('; ') || 'Not observed'],
    ['Structured data types', report.page.structuredDataTypes.join(', ') || 'No types observed'],
    ['Alternate links', report.page.alternateLinks.map(item => `${item.type}: ${item.href}`).join('\n') || 'Not observed'],
  ]));
  if (report.page.textPreview) page.body.append(node('h4', 'Initial HTML text preview'), node('p', report.page.textPreview, 'access-source-preview'), node('p', 'This source-level estimate can include navigation or text hidden by CSS. It is not a rendered-browser comparison.', 'tool-caption'));
  if (report.page.headingOutline?.length) { const outline = node('ul', undefined, 'access-heading-outline'); for (const heading of report.page.headingOutline) outline.append(node('li', `H${heading.level} · ${heading.text}`)); page.body.append(node('h4', 'Heading outline'), outline); }
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
  const quota = feedbackQuota(value);
  return quota ? `${quota.remaining} of ${quota.limit} checks remaining` : null;
}
export function showCheckFeedback(status: HTMLElement, feedback: CheckFeedback): void {
  status.dataset['state'] = feedback.tone;
  const card = node('div', undefined, 'tool-feedback'); card.dataset['tone'] = feedback.tone;
  const icon = node('span', undefined, 'tool-feedback-icon'); icon.setAttribute('aria-hidden', 'true');
  const symbol = node('img'); symbol.src = `/icons/${feedback.tone === 'error' ? 'close' : feedback.tone === 'ready' ? 'transparency' : 'clock'}.svg`; symbol.alt = ''; symbol.width = 18; symbol.height = 18; icon.append(symbol);
  const content = node('div'); content.append(node('strong', feedback.title, 'tool-feedback-title'), node('p', feedback.detail, 'tool-feedback-detail'));
  if (feedback.meta) content.append(node('span', feedback.meta, 'tool-feedback-meta'));
  if (feedback.alternatives) {
    const actions = node('div', undefined, 'tool-feedback-actions');
    const example = node('a', 'View example report'); example.href = '/ai-check/example#access-report'; example.setAttribute('data-example-check', '');
    const robots = node('a', 'Try robots playground'); robots.href = '/tools/robots';
    actions.append(example, robots); content.append(actions);
  }
  card.append(icon, content); status.replaceChildren(card);
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
  private readonly onInput = (event: Event): void => { if (event.target instanceof HTMLInputElement) this.clearFieldError(event.target); };
  connectedCallback(): void { this.addEventListener('submit', this.onSubmit); this.addEventListener('click', this.onExample); this.addEventListener('input', this.onInput); if (typeof location !== 'undefined' && location.hash === '#example') void this.example(); }
  disconnectedCallback(): void { this.removeEventListener('submit', this.onSubmit); this.removeEventListener('click', this.onExample); this.removeEventListener('input', this.onInput); this.abort?.abort(); this.abort = null; this.setBusy(false); this.clearDownload(); }
  private clearFieldError(input: HTMLInputElement): void {
    input.removeAttribute('aria-invalid');
    const error = this.querySelector('[data-audit-field-error]');
    if (error instanceof HTMLElement) { error.hidden = true; error.textContent = ''; }
  }
  private setBusy(busy: boolean): void {
    const button = this.querySelector('button'), example = this.querySelector('[data-example-check]');
    if (button) button.disabled = busy;
    if (example instanceof HTMLElement) { if (busy) example.setAttribute('aria-disabled', 'true'); else example.removeAttribute('aria-disabled'); }
    this.querySelector('[data-audit-results]')?.setAttribute('aria-busy', String(busy));
  }
  private begin(): AbortController | null {
    if (this.abort !== null) return null;
    const controller = new AbortController(); this.abort = controller; this.setBusy(true); return controller;
  }
  private finish(controller: AbortController): void {
    if (this.abort !== controller) return;
    this.abort = null; this.setBusy(false);
  }
  private clearDownload(): void { if (this.downloadUrl !== null) URL.revokeObjectURL(this.downloadUrl); this.downloadUrl = null; }
  private async example(): Promise<void> {
    const status = this.querySelector('[data-audit-status]'), results = this.querySelector('[data-audit-results]'); if (!(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    const controller = this.begin(); if (!controller) return;
    showCheckFeedback(status, { tone: 'loading', title: 'Opening example', detail: 'Loading a saved report. No check used.' });
    try {
      const response = await fetch('/ai-check-example.json', { headers: { Accept: 'application/json' }, redirect: 'error', signal: controller.signal });
      const value: unknown = await response.json();
      if (controller.signal.aborted) return;
      const report = object(value) && object(value['report']) ? value['report'] : value;
      if (!response.ok || !isSiteAuditReport(report)) throw new Error('Example unavailable');
      document.getElementById('ai-check-server-result')?.replaceChildren(); results.replaceChildren(renderSiteAudit(report, true));
      this.clearDownload(); this.downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
      const download = node('a', 'Download example JSON', 'ai-check-download'); download.href = this.downloadUrl; download.download = 'ai-access-example.json'; (results.querySelector('.report-actions') ?? results).prepend(download);
      showCheckFeedback(status, { tone: 'ready', title: 'Saved example report.', detail: 'No live request to the target and no daily check used.' });
      const rendered = results.querySelector<HTMLElement>('.ai-check-report'); rendered?.focus({ preventScroll: true });
      results.scrollIntoView({ block: 'start', behavior: 'auto' });
    } catch { if (!controller.signal.aborted) showCheckFeedback(status, { tone: 'error', title: 'Example unavailable', detail: 'The example could not load. No daily check was used.' }); }
    finally { this.finish(controller); }
  }
  private async check(): Promise<void> {
    const form = this.querySelector('form'), input = this.querySelector('input'), button = this.querySelector('button'), status = this.querySelector('[data-audit-status]'), results = this.querySelector('[data-audit-results]');
    if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    if (this.abort !== null) return;
    let target: string;
    try { target = normalizeTarget(input.value.trim()).toString(); }
    catch (error: unknown) {
      const fieldError = this.querySelector('[data-audit-field-error]');
      if (fieldError instanceof HTMLElement) { fieldError.textContent = error instanceof TargetValidationError ? error.message : 'Enter a domain such as reddit.com or a public HTTPS page URL.'; fieldError.hidden = false; }
      input.setAttribute('aria-invalid', 'true'); input.focus(); status.textContent = ''; status.removeAttribute('data-state'); return;
    }
    this.clearFieldError(input); input.value = target;
    const controller = this.begin(); if (!controller) return;
    showCheckFeedback(status, { tone: 'loading', title: 'Checking your page', detail: 'Fetching the page, crawler policies and public discovery files…' });
    try {
      const response = await fetch('/api/ai-check', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ url: target }), signal: controller.signal, redirect: 'error' });
      const value: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) { showCheckFeedback(status, failureFeedback(errorMessage(value), response.status, object(value) ? value['quota'] : null)); return; }
      if (!object(value) || !isSiteAuditReport(value['report'])) throw new Error('The service returned an incomplete report.');
      document.getElementById('ai-check-server-result')?.replaceChildren();
      results.replaceChildren(renderSiteAudit(value['report']));
      this.clearDownload(); this.downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
      const download = node('a', 'Download JSON report', 'ai-check-download'); download.href = this.downloadUrl; download.download = 'ai-access-report.json'; (results.querySelector('.report-actions') ?? results).prepend(download);
      showCheckFeedback(status, { tone: 'ready', title: value['report'].complete ? 'Report ready' : 'Partial report ready', detail: 'Your results and supporting evidence are below.', meta: quotaLabel(value['quota']) ?? '' });
      const rendered = results.querySelector<HTMLElement>('.ai-check-report'); rendered?.focus({ preventScroll: true });
      results.scrollIntoView({ block: 'start', behavior: 'auto' });
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      showCheckFeedback(status, failureFeedback(error instanceof Error && error.message === 'The service returned an incomplete report.' ? error.message : 'The response could not be read. If the connection was lost after submission, that check may have used one of today’s allowance.', 503, null));
    } finally { this.finish(controller); }
  }
}

export class RequestEvidenceCheck extends HTMLElement {
  private readonly onClick = (): void => { void this.inspect(); };
  connectedCallback(): void { const button = this.querySelector('[data-request-check]'); if (button instanceof HTMLButtonElement) { button.hidden = false; button.addEventListener('click', this.onClick); } }
  disconnectedCallback(): void { this.querySelector('[data-request-check]')?.removeEventListener('click', this.onClick); }
  private async inspect(): Promise<void> {
    const button = this.querySelector('[data-request-check]'), status = this.querySelector('[data-request-status]'), results = this.querySelector('[data-request-results]');
    if (!(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    button.disabled = true; showCheckFeedback(status, { tone: 'loading', title: 'Inspecting your request', detail: 'Reading the request evidence received by this service…' });
    try {
      const response = await fetch('/api/request-check', { headers: { Accept: 'application/json' }, redirect: 'error' });
      const value: unknown = await response.json();
      if (!response.ok) { showCheckFeedback(status, failureFeedback(errorMessage(value), response.status, object(value) ? value['quota'] : null)); return; }
      if (!object(value) || !object(value['request'])) throw new Error('Request evidence unavailable');
      results.replaceChildren(renderRequestEvidence(value['request']));
      showCheckFeedback(status, { tone: 'ready', title: 'Request evidence ready', detail: 'Client declarations and verification are shown below.', meta: quotaLabel(value['quota']) ?? '' });
    } catch { showCheckFeedback(status, failureFeedback('This request could not be inspected. Try the JSON link below.', 503, null)); }
    finally { button.disabled = false; }
  }
}

if (!customElements.get('site-audit-check')) customElements.define('site-audit-check', SiteAuditCheck);
if (!customElements.get('request-evidence-check')) customElements.define('request-evidence-check', RequestEvidenceCheck);

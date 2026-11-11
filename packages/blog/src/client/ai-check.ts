import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import { siteAuditReportHtml } from '../lib/site-audit-report.js';
import { normalizeTarget, TargetValidationError } from '@gkoreli/site-audit/target';
import { failureFeedback, feedbackQuota, type CheckFeedback } from '../lib/check-feedback.js';
import { requestContextPresentation } from '../lib/request-context-presentation.js';
import { node, definition, rawEvidence, object } from './tool-dom.js';

/** The common report renderer escapes captured values before parsing its fixed markup. */
export function renderSiteAudit(report: SiteAuditReport, example = false): HTMLElement {
  const container = node('div');
  container.innerHTML = siteAuditReportHtml(report, { example });
  const result = container.firstElementChild;
  if (!(result instanceof HTMLElement)) throw new Error('Report markup did not produce a section.');
  return result;
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
  const section = node('section', undefined, 'request-evidence-report'); section.append(node('h3', 'Evidence from this request'));
  const context = requestContextPresentation(at(value, 'context', 'referrerState'), at(value, 'context', 'fetchSite'), at(value, 'evidence', 'referrerContext'));
  section.append(node('h4', 'Referrer and navigation context'), definition([
    ['Reported source', context.referrer],
    ['Site relationship claim', context.site],
    ['Context check', context.consistency],
    ['Navigation-shaped', display(at(value, 'evidence', 'navigationShaped'))],
    ['Activation claim', display(at(value, 'evidence', 'activation'))],
  ]), node('p', context.meaning, 'ai-check-note'));
  if (context.review !== null) section.append(node('p', context.review, 'ai-check-note'));
  section.append(node('p', 'Navigation and activation headers are request signals. They do not identify a person or authenticate a referring site.', 'ai-check-note'), node('h4', 'Declarations and verification'));
  section.append(definition([
    ['Request category', display(at(value, 'classification', 'readerKind'))],
    ['Classification reason', display(at(value, 'classification', 'reason'))],
    ['Declared client names', display(at(value, 'evidence', 'declarations', 'candidates'))],
    ['Declaration agreement', display(at(value, 'evidence', 'categoryAgreement'))],
    ['Browser-family claim', display(at(value, 'evidence', 'declarations', 'browserFamily'))],
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
      this.clearDownload();
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

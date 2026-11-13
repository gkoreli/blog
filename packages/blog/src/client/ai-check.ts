import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import { siteAuditReportHtml } from '../lib/site-audit-report.js';
import { normalizeTarget, TargetValidationError } from '@gkoreli/site-audit/target';
import { failureFeedback } from '../lib/check-feedback.js';
import { errorMessage, quotaLabel, showCheckFeedback } from './check-feedback.js';
import { node, object } from './tool-dom.js';

/** The common report renderer escapes captured values before parsing its fixed markup. */
export function renderSiteAudit(report: SiteAuditReport, example = false): HTMLElement {
  const container = node('div');
  container.innerHTML = siteAuditReportHtml(report, { example });
  const result = container.firstElementChild;
  if (!(result instanceof HTMLElement)) throw new Error('Report markup did not produce a section.');
  return result;
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

if (!customElements.get('site-audit-check')) customElements.define('site-audit-check', SiteAuditCheck);

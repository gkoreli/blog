import { evaluateRobotsWorkbench, compareSiteReports, deriveTechnicalAssessment, WorkbenchInputError } from '@gkoreli/site-audit/product';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import { reportIdentity } from '../lib/site-audit-presentation.js';
import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { node, definition, makeTable, rawEvidence, object } from './tool-dom.js';

function workbenchStatus(status: Element, message: string, state: 'ready' | 'error' | 'loading'): void {
  status.textContent = message; status.setAttribute('data-state', state);
}

const MAX_REPORT_BYTES = 1_048_576;
export function parseSavedReport(source: string): SiteAuditReport {
  if (new TextEncoder().encode(source).length > MAX_REPORT_BYTES) throw new Error('Each report must be 1 MB or smaller.');
  let value: unknown;
  try { value = JSON.parse(source); } catch { throw new Error('The report is not valid JSON. Choose a downloaded report or paste its complete JSON.'); }
  const report = object(value) && object(value['report']) ? value['report'] : value;
  if (!isSiteAuditReport(report)) throw new Error('This file does not contain a supported, complete access-report structure.');
  return report;
}

export class RobotsWorkbench extends HTMLElement {
  private readonly submit = (event: SubmitEvent): void => { event.preventDefault(); this.evaluate(); };
  private readonly input = (event: Event): void => { if (event.target instanceof HTMLElement) event.target.removeAttribute('aria-invalid'); const status = this.querySelector('[data-workbench-status]'); if (status) { status.textContent = ''; status.removeAttribute('data-state'); } this.querySelector('[data-workbench-result]')?.replaceChildren(); };
  connectedCallback(): void { this.addEventListener('submit', this.submit); this.addEventListener('input', this.input); const button = this.querySelector('button'); if (button instanceof HTMLButtonElement) button.disabled = false; }
  disconnectedCallback(): void { this.removeEventListener('submit', this.submit); this.removeEventListener('input', this.input); }
  private evaluate(): void {
    const source = this.querySelector('textarea[name="robots"]'), token = this.querySelector('input[name="token"]'), path = this.querySelector('input[name="path"]'), status = this.querySelector('[data-workbench-status]'), output = this.querySelector('[data-workbench-result]');
    if (!(source instanceof HTMLTextAreaElement) || !(token instanceof HTMLInputElement) || !(path instanceof HTMLInputElement) || !status || !output) return;
    for (const field of [source, token, path]) field.removeAttribute('aria-invalid');
    try {
      const result = evaluateRobotsWorkbench({ robots: source.value, token: token.value.trim(), path: path.value.trim() });
      const verdict = node('section', undefined, 'workbench-verdict'); verdict.dataset['state'] = result.decision;
      verdict.append(node('span', 'Policy result', 'tool-kicker'), node('h2', `${result.decision === 'allowed' ? 'Allowed' : result.decision === 'disallowed' ? 'Disallowed' : 'Unknown'} for ${token.value.trim()}`), node('p', result.reason),
        definition([['Requested path', path.value.trim()], ['Selected groups', result.matchedGroups.join(', ') || 'No named group'], ['Selected rule', result.matchedRule ?? 'No matching rule'], ['Parsed policy', `${result.groups} groups · ${result.rules} rules`]]));
      const limits = node('ul', undefined, 'ai-check-limits'); for (const limit of result.limits) limits.append(node('li', limit)); verdict.append(limits, rawEvidence(result, 'Full policy evaluation'));
      output.replaceChildren(verdict); workbenchStatus(status, `Evaluated locally. ${result.complete ? 'Policy parsing completed.' : 'Some policy evidence is unavailable; see the limits.'} No daily check used.`, 'ready');
    } catch (error: unknown) { output.replaceChildren(); workbenchStatus(status, error instanceof Error ? error.message : 'The policy could not be evaluated.', 'error'); if (error instanceof WorkbenchInputError) { const field = { robots: source, token, path }[error.field]; field.setAttribute('aria-invalid', 'true'); field.focus(); } }
  }
}

export function renderReportComparison(before: SiteAuditReport, after: SiteAuditReport): HTMLElement {
  const diff = compareSiteReports(before, after), section = node('section');
  section.append(node('h2', diff.comparable ? 'Here is what changed.' : 'Review the comparison conditions.', 'comparison-heading'));
  const context = definition([['Before', `${diff.baselineTarget} · ${reportIdentity(before).observed}`], ['After', `${diff.currentTarget} · ${reportIdentity(after).observed}`]]); section.append(context);
  for (const reason of diff.reasons) section.append(node('p', reason, 'ai-check-note'));
  const summaries = node('div', undefined, 'access-components comparison-score-summary');
  for (const [label, report] of [['Before', before], ['After', after]] as const) {
    const score = deriveTechnicalAssessment(report).score;
    const card = node('div', undefined, 'access-component'); card.append(node('h3', label), node('strong', score.lower === score.upper ? String(score.lower) : `${score.lower}–${score.upper}`), node('small', ' / 100'), node('span', `${score.coveragePercent}% assessed`, 'access-component-state')); summaries.append(card);
  }
  section.append(summaries);
  if (diff.changes.length === 0) section.append(node('p', diff.comparable ? 'No assessed evidence differences were found in these saved reports.' : 'No comparison was made; resolve the conditions above.'));
  else {
    const table = makeTable(`${diff.changes.length} evidence changes`, ['Check or observation', 'Before', 'After', 'Direction']);
    for (const change of diff.changes) {
      const row = table.body.insertRow(); row.insertCell().textContent = change.label; row.insertCell().textContent = change.before; row.insertCell().textContent = change.after; row.insertCell().textContent = change.meaning;
    }
    section.append(table.wrapper);
  }
  const limits = node('ul', undefined, 'ai-check-limits'); for (const limit of diff.limits) limits.append(node('li', limit)); section.append(limits, rawEvidence(diff, 'Complete comparison evidence')); return section;
}

export class ReportComparison extends HTMLElement {
  private readonly reads = { before: 0, after: 0 };
  private readonly loading = new Set<string>();
  private readonly input = (event: Event): void => {
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    const side = event.target.name; if (side !== 'before' && side !== 'after') return;
    this.reads[side]++; this.loading.delete(side); this.syncBusy(); this.clearError(side); this.querySelector('[data-workbench-result]')?.replaceChildren();
    const name = this.querySelector(`[data-file-name="${side}"]`); if (name) name.textContent = event.target.value ? 'JSON entered below' : 'Choose a saved report';
    const fileInput = this.querySelector(`input[data-report-file="${side}"]`); if (fileInput instanceof HTMLInputElement) fileInput.value = ''; fileInput?.closest('.report-file-zone')?.removeAttribute('data-loaded');
    const status = this.querySelector('[data-workbench-status]'); if (status) { status.textContent = ''; status.removeAttribute('data-state'); }
  };
  private clearError(side: 'before' | 'after'): void {
    const error = this.querySelector(`[data-report-error="${side}"]`);
    if (error instanceof HTMLElement) { error.hidden = true; error.textContent = ''; }
    for (const field of this.querySelectorAll(`[name="${side}"], [data-report-file="${side}"]`)) field.removeAttribute('aria-invalid');
  }
  private showError(side: 'before' | 'after', message: string): void {
    const error = this.querySelector(`[data-report-error="${side}"]`);
    if (error instanceof HTMLElement) { error.textContent = message; error.hidden = false; }
  }
  private syncBusy(): void { const button = this.querySelector('button'); if (button) button.disabled = this.loading.size > 0; }
  private readonly submit = (event: SubmitEvent): void => { event.preventDefault(); this.compare(); };
  private readonly change = (event: Event): void => { if (event.target instanceof HTMLInputElement && event.target.type === 'file') void this.loadFile(event.target); };
  connectedCallback(): void { this.addEventListener('submit', this.submit); this.addEventListener('change', this.change); this.addEventListener('input', this.input); const button = this.querySelector('button'); if (button instanceof HTMLButtonElement) button.disabled = false; }
  disconnectedCallback(): void { this.removeEventListener('submit', this.submit); this.removeEventListener('change', this.change); this.removeEventListener('input', this.input); this.reads.before++; this.reads.after++; this.loading.clear(); }
  private async loadFile(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0], name = input.dataset['reportFile'], status = this.querySelector('[data-workbench-status]');
    if (!file || !status || (name !== 'before' && name !== 'after')) return;
    const target = this.querySelector(`textarea[name="${name}"]`); if (!(target instanceof HTMLTextAreaElement)) return;
    const read = ++this.reads[name], fileName = this.querySelector(`[data-file-name="${name}"]`), zone = input.closest('.report-file-zone');
    target.value = ''; this.querySelector('[data-workbench-result]')?.replaceChildren(); this.clearError(name); zone?.removeAttribute('data-loaded');
    if (fileName) fileName.textContent = 'Reading report…';
    this.loading.add(name); this.syncBusy(); workbenchStatus(status, 'Reading your file locally…', 'loading');
    try {
      if (file.size > MAX_REPORT_BYTES) throw new Error('Each report must be 1 MB or smaller.');
      const content = await file.text(); if (this.reads[name] !== read) return;
      parseSavedReport(content); target.value = content;
      if (fileName) fileName.textContent = file.name; zone?.setAttribute('data-loaded', 'true');
      workbenchStatus(status, `${name === 'before' ? 'Before' : 'After'} report loaded locally. Nothing was uploaded.`, 'ready');
    } catch (error: unknown) {
      if (this.reads[name] !== read) return;
      input.value = ''; if (fileName) fileName.textContent = 'Choose a saved report';
      status.textContent = ''; input.setAttribute('aria-invalid', 'true'); this.showError(name, error instanceof Error ? error.message : 'The file could not be read.');
    } finally { if (this.reads[name] === read) { this.loading.delete(name); this.syncBusy(); } }
  }

  private compare(): void {
    const before = this.querySelector('textarea[name="before"]'), after = this.querySelector('textarea[name="after"]'), status = this.querySelector('[data-workbench-status]'), output = this.querySelector('[data-workbench-result]');
    if (!(before instanceof HTMLTextAreaElement) || !(after instanceof HTMLTextAreaElement) || !status || !output) return;
    if (this.loading.size) return;
    let active = before;
    this.clearError('before'); this.clearError('after');
    try {
      if (!before.value.trim()) throw new Error('Choose a before report or paste its JSON.');
      const baseline = parseSavedReport(before.value); active = after;
      if (!after.value.trim()) throw new Error('Choose an after report or paste its JSON.');
      const current = parseSavedReport(after.value);
      output.replaceChildren(renderReportComparison(baseline, current)); workbenchStatus(status, 'Compared locally. No upload or daily check used.', 'ready');
    } catch (error: unknown) {
      status.textContent = ''; const side = active === before ? 'before' : 'after'; this.showError(side, error instanceof Error ? error.message : 'The reports could not be compared.');
      if (!active.value.trim()) { const input = this.querySelector<HTMLInputElement>(`[data-report-file="${side}"]`); input?.setAttribute('aria-invalid', 'true'); input?.focus(); }
      else { active.setAttribute('aria-invalid', 'true'); const details = active.closest('details'); if (details) details.open = true; active.focus(); }
    }
  }
}

if (!customElements.get('robots-workbench')) customElements.define('robots-workbench', RobotsWorkbench);
if (!customElements.get('report-comparison')) customElements.define('report-comparison', ReportComparison);

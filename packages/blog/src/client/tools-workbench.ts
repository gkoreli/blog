import { evaluateRobotsWorkbench, compareSiteReports, deriveTechnicalAssessment } from '@gkoreli/site-audit/product';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { node, definition, makeTable, rawEvidence, object } from './tool-dom.js';

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
  connectedCallback(): void { this.addEventListener('submit', this.submit); const button = this.querySelector('button'); if (button instanceof HTMLButtonElement) button.disabled = false; }
  disconnectedCallback(): void { this.removeEventListener('submit', this.submit); }
  private evaluate(): void {
    const source = this.querySelector('textarea[name="robots"]'), token = this.querySelector('input[name="token"]'), path = this.querySelector('input[name="path"]'), status = this.querySelector('[data-workbench-status]'), output = this.querySelector('[data-workbench-result]');
    if (!(source instanceof HTMLTextAreaElement) || !(token instanceof HTMLInputElement) || !(path instanceof HTMLInputElement) || !status || !output) return;
    try {
      const result = evaluateRobotsWorkbench({ robots: source.value, token: token.value.trim(), path: path.value.trim() });
      const verdict = node('section', undefined, 'workbench-verdict'); verdict.dataset['state'] = result.decision;
      verdict.append(node('span', 'Policy result', 'tool-kicker'), node('h2', `${result.decision === 'allowed' ? 'Allowed' : result.decision === 'disallowed' ? 'Disallowed' : 'Unknown'} for ${token.value.trim()}`), node('p', result.reason),
        definition([['Requested path', path.value.trim()], ['Selected groups', result.matchedGroups.join(', ') || 'No named group'], ['Selected rule', result.matchedRule ?? 'No matching rule'], ['Parsed policy', `${result.groups} groups · ${result.rules} rules`]]));
      const limits = node('ul', undefined, 'ai-check-limits'); for (const limit of result.limits) limits.append(node('li', limit)); verdict.append(limits, rawEvidence(result, 'Full policy evaluation'));
      output.replaceChildren(verdict); status.textContent = `Evaluated locally. ${result.complete ? 'Policy parsing completed.' : 'Some policy evidence is unavailable; see the limits.'} No daily check used.`;
    } catch (error: unknown) { output.replaceChildren(); status.textContent = error instanceof Error ? error.message : 'The policy could not be evaluated.'; }
  }
}

export function renderReportComparison(before: SiteAuditReport, after: SiteAuditReport): HTMLElement {
  const diff = compareSiteReports(before, after), section = node('section');
  section.append(node('h2', diff.comparable ? 'Here is what changed.' : 'Review the comparison conditions.', 'comparison-heading'));
  const context = definition([['Before', `${diff.baselineTarget} · ${diff.baselineAt}`], ['After', `${diff.currentTarget} · ${diff.currentAt}`]]); section.append(context);
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
  private readonly submit = (event: SubmitEvent): void => { event.preventDefault(); this.compare(); };
  private readonly change = (event: Event): void => { if (event.target instanceof HTMLInputElement && event.target.type === 'file') void this.loadFile(event.target); };
  connectedCallback(): void { this.addEventListener('submit', this.submit); this.addEventListener('change', this.change); const button = this.querySelector('button'); if (button instanceof HTMLButtonElement) button.disabled = false; }
  disconnectedCallback(): void { this.removeEventListener('submit', this.submit); this.removeEventListener('change', this.change); }
  private async loadFile(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0], name = input.dataset['reportFile'], status = this.querySelector('[data-workbench-status]');
    if (!file || !status || (name !== 'before' && name !== 'after')) return;
    if (file.size > MAX_REPORT_BYTES) { status.textContent = 'Each report must be 1 MB or smaller.'; input.value = ''; return; }
    const target = this.querySelector(`textarea[name="${name}"]`); if (!(target instanceof HTMLTextAreaElement)) return;
    try { const content = await file.text(); parseSavedReport(content); target.value = content; status.textContent = `${name === 'before' ? 'Before' : 'After'} report loaded locally. Nothing was uploaded.`; }
    catch (error: unknown) { status.textContent = error instanceof Error ? error.message : 'The file could not be read.'; }
  }
  private compare(): void {
    const before = this.querySelector('textarea[name="before"]'), after = this.querySelector('textarea[name="after"]'), status = this.querySelector('[data-workbench-status]'), output = this.querySelector('[data-workbench-result]');
    if (!(before instanceof HTMLTextAreaElement) || !(after instanceof HTMLTextAreaElement) || !status || !output) return;
    try { output.replaceChildren(renderReportComparison(parseSavedReport(before.value), parseSavedReport(after.value))); status.textContent = 'Compared locally. No upload or daily check used.'; }
    catch (error: unknown) { status.textContent = error instanceof Error ? error.message : 'The reports could not be compared.'; }
  }
}

if (!customElements.get('robots-workbench')) customElements.define('robots-workbench', RobotsWorkbench);
if (!customElements.get('report-comparison')) customElements.define('report-comparison', ReportComparison);

import type { SiteAuditReport, Finding } from '@gkoreli/site-audit/contracts';
import type { TechnicalAssessment } from '@gkoreli/site-audit/product';

const SCORED_EQUIVALENTS: Record<string, string> = {
  'page-response': 'page-status', 'page-media-type': 'page-html', 'page-title': 'page-title', 'sparse-html': 'source-text', 'indexing-controls': 'general-indexing',
};
function priority(finding: Finding): number {
  if (finding.id === 'robots-unavailable') return 0;
  if (finding.id === 'robots-answer-bots') return 1;
  if (finding.id.startsWith('probe-')) return 2;
  if (finding.id === 'invalid-jsonld') return 3;
  return finding.severity === 'action' ? 4 : 5;
}
/** Additional observations are valuable even when the deliberately narrow score is 100. */
export function additionalReviewFindings(report: SiteAuditReport, assessment: TechnicalAssessment): Finding[] {
  const scoredIssues = new Set(assessment.components.flatMap(component => component.checks).filter(check => check.state !== 'pass').map(check => check.id));
  return report.findings.filter(finding => finding.severity !== 'info' && !scoredIssues.has(SCORED_EQUIVALENTS[finding.id] ?? ''))
    .sort((left, right) => priority(left) - priority(right));
}

/** Optional formats are capabilities, not access failures. Used by both report renderers. */
export function optionalSupportLabel(capability: TechnicalAssessment['optional'][number]): string {
  if (capability.id === 'markdown' && capability.state === 'not-negotiated') return 'HTML returned; Markdown optional';
  return capability.state === 'not-provided' ? 'Not offered · optional' : capability.state.replaceAll('-', ' ');
}

/** Human-readable report identity; both renderers keep the same observation boundary. */
export function reportIdentity(report: SiteAuditReport): { host: string; observed: string } {
  let host = report.target;
  try { host = new URL(report.target).hostname; } catch { /* Retain the supplied text safely. */ }
  const date = new Date(report.checkedAt);
  const observed = Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  }).format(date) : report.checkedAt;
  return { host, observed };
}

export function assessmentVerdict(assessment: TechnicalAssessment): string {
  if (assessment.score.coveragePercent === 0) return 'This check couldn’t assess the page.';
  return assessment.counts.failed > 0 ? 'Some access checks need attention.'
    : assessment.counts.unknown > 0 ? 'Some evidence is still unavailable.'
    : 'The core access checks passed.';
}

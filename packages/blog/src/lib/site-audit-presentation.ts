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

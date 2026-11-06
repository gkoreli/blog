import type { SiteAuditReport } from './contracts.js';
import { REPORT_DIFF_PROFILE, type ReportChange, type SiteReportDiff, type TechnicalCheckState } from './product-contracts.js';
import { deriveTechnicalAssessment } from './technical-assessment.js';

/** Local comparison of saved bounded evidence. No network, storage or causal
 * attribution; unlike a detector, changed observations do not identify people. */
export function compareSiteReports(baseline: SiteAuditReport, current: SiteAuditReport): SiteReportDiff {
  const reasons: string[] = [];
  function duplicates(report: SiteAuditReport, label: string): string[] {
    const resourceKeys = report.resources.map(resource => `${resource.kind}:${resource.probeAgent?.toLowerCase() ?? ''}`);
    const botKeys = report.robots.bots.map(bot => bot.token.toLowerCase());
    return [...(new Set(resourceKeys).size !== resourceKeys.length ? [`${label} contains duplicate resource kind/probe pairs; their observations are ambiguous.`] : []),
      ...(new Set(botKeys).size !== botKeys.length ? [`${label} contains duplicate robots product tokens; their policy observations are ambiguous.`] : [])];
  }
  const ambiguous = [...duplicates(baseline, 'Baseline report'), ...duplicates(current, 'Current report')];
  if (ambiguous.length > 0) return { profile: REPORT_DIFF_PROFILE, comparable: false, reasons: ambiguous, baselineTarget: baseline.target, currentTarget: current.target,
    baselineAt: baseline.checkedAt, currentAt: current.checkedAt, changes: [],
    limits: ['No comparison was made because duplicate evidence keys prevent a unique pairing. An empty change list here does not mean that the reports are equal.',
      'Remove duplicate evidence or capture a new valid report; do not select an arbitrary first observation.'] };
  if (baseline.target !== current.target) reasons.push('The requested URLs differ; results describe different targets.');
  if (baseline.version !== current.version) reasons.push('Report versions differ; changed collection semantics can explain differences.');
  if (baseline.assessment?.profile !== undefined && current.assessment?.profile !== undefined && baseline.assessment.profile !== current.assessment.profile) reasons.push('Attached technical assessment profiles differ; score changes cannot be compared as the same rubric.');
  const comparable = reasons.length === 0;
  const changes: ReportChange[] = [];
  function add(path: string, label: string, before: string, after: string, meaning: ReportChange['meaning'] = 'changed') {
    if (before !== after) changes.push({ path, label, before, after, meaning: comparable ? meaning : 'changed' });
  }
  const beforeAssessment = deriveTechnicalAssessment(baseline);
  const afterAssessment = deriveTechnicalAssessment(current);
  function direction(before: TechnicalCheckState, after: TechnicalCheckState): ReportChange['meaning'] {
    return before === 'fail' && after === 'pass' ? 'improved' : before === 'pass' && after === 'fail' ? 'regressed' : before === 'unknown' || after === 'unknown' ? 'unknown' : 'changed';
  }
  add('assessment.score', 'Technical score interval under the current rubric', `${beforeAssessment.score.lower}–${beforeAssessment.score.upper}/100`, `${afterAssessment.score.lower}–${afterAssessment.score.upper}/100`);
  add('assessment.coverage', 'Technical score coverage', `${beforeAssessment.score.coveragePercent}%`, `${afterAssessment.score.coveragePercent}%`);
  for (const before of beforeAssessment.components.flatMap(component => component.checks)) {
    const after = afterAssessment.components.flatMap(component => component.checks).find(check => check.id === before.id);
    if (after) add(`checks.${before.id}`, before.title, before.state, after.state, direction(before.state, after.state));
  }
  for (const before of baseline.resources) {
    const after = current.resources.find(resource => resource.kind === before.kind && resource.probeAgent === before.probeAgent);
    const id = `${before.kind}${before.probeAgent ? `:${before.probeAgent}` : ''}`;
    if (!after) { add(`resources.${id}`, `${id} result`, 'captured', 'not captured', 'unknown'); continue; }
    add(`resources.${id}.outcome`, `${id} retrieval`, before.outcome, after.outcome, before.outcome === 'received' ? 'unknown' : after.outcome === 'received' ? 'unknown' : 'changed');
    add(`resources.${id}.status`, `${id} HTTP status`, String(before.status ?? 'unavailable'), String(after.status ?? 'unavailable'));
    add(`resources.${id}.contentType`, `${id} response type`, before.contentType ?? 'unavailable', after.contentType ?? 'unavailable');
    add(`resources.${id}.finalUrl`, `${id} final URL`, before.finalUrl, after.finalUrl);
    add(`resources.${id}.bytes`, `${id} response bytes`, String(before.bytes), String(after.bytes));
    add(`resources.${id}.robots`, `${id} X-Robots-Tag`, before.headers.robots ?? 'not captured', after.headers.robots ?? 'not captured');
  }
  for (const after of current.resources) {
    if (!baseline.resources.some(resource => resource.kind === after.kind && resource.probeAgent === after.probeAgent)) {
      const id = `${after.kind}${after.probeAgent ? `:${after.probeAgent}` : ''}`;
      add(`resources.${id}`, `${id} result`, 'not captured', 'captured', 'unknown');
    }
  }
  for (const key of ['title', 'description', 'canonical', 'language', 'textCharacters', 'headings', 'links', 'scriptElements', 'structuredDataBlocks', 'invalidStructuredDataBlocks'] as const) {
    add(`page.${key}`, `Page ${key}`, String(baseline.page[key] ?? 'not observed'), String(current.page[key] ?? 'not observed'));
  }
  add('page.structuredDataTypes', 'JSON-LD types', baseline.page.structuredDataTypes.join(', ') || 'not observed', current.page.structuredDataTypes.join(', ') || 'not observed');
  add('page.metaRobots', 'Page robots metadata', JSON.stringify(baseline.page.metaRobots), JSON.stringify(current.page.metaRobots));
  add('robots.state', 'Robots retrieval state', baseline.robots.state, current.robots.state);
  for (const before of baseline.robots.bots) {
    const after = current.robots.bots.find(bot => bot.token.toLowerCase() === before.token.toLowerCase());
    if (after) {
      add(`robots.${before.token}.decision`, `${before.token} path policy`, before.decision, after.decision);
      add(`robots.${before.token}.rule`, `${before.token} matched rule`, before.matchedRule ?? 'no rule captured', after.matchedRule ?? 'no rule captured');
    } else add(`robots.${before.token}`, `${before.token} policy result`, `${before.decision}; ${before.matchedRule ?? 'no matched rule'}`, 'not captured', 'unknown');
  }
  for (const after of current.robots.bots) {
    if (!baseline.robots.bots.some(bot => bot.token.toLowerCase() === after.token.toLowerCase())) add(`robots.${after.token}`, `${after.token} policy result`, 'not captured', `${after.decision}; ${after.matchedRule ?? 'no matched rule'}`, 'unknown');
  }
  for (const before of beforeAssessment.optional) {
    const after = afterAssessment.optional.find(item => item.id === before.id);
    if (after) add(`optional.${before.id}`, before.title, before.state, after.state);
  }
  return { profile: REPORT_DIFF_PROFILE, comparable, reasons, baselineTarget: baseline.target, currentTarget: current.target,
    baselineAt: baseline.checkedAt, currentAt: current.checkedAt, changes,
    limits: ['This local comparison uses supplied report observations. Matching targets and versions do not control network location, deployment, bot policy changes or elapsed time.',
      'A changed result does not prove the cause, an intervention effect, real provider access or AI discovery/citation.',
      'Technical check transitions use the currently loaded rubric. Optional feature and robots-policy changes are shown without labeling intentional policy choices as improvements or regressions.',
      'Response byte counts and source-text lengths can vary without a meaningful content change. Equal counts do not prove equivalent content.'] };
}

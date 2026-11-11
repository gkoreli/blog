import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { deriveTechnicalAssessment, type TechnicalCheck, type TechnicalComponent } from '@gkoreli/site-audit/product';
import { additionalReviewFindings, optionalSupportLabel, reportIdentity, assessmentVerdict, reportFacts } from './site-audit-presentation.js';

interface ReportOptions {
  example?: boolean;
  quota?: { remaining: number; limit: number; resetAt: string };
}

/** Only fixed markup is trusted. Every captured value is escaped before interpolation. */
function escape(value: string | number): string {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}
function list(values: readonly string[]): string {
  return `<ul>${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
}
function section(id: string, number: string, title: string, note: string, body: string): string {
  return `<section class="report-section" id="${id}" aria-labelledby="${id}-heading"><header class="report-section-heading"><span class="report-section-number" aria-hidden="true">${number}</span><div><h3 id="${id}-heading">${title}</h3><p>${note}</p></div></header>${body}</section>`;
}

/** Shared by the enhanced report, server response and Design Language example. */
export function reportCheckRowHtml(check: TechnicalCheck): string {
  const state = check.state === 'pass' ? 'Passed' : check.state === 'fail' ? 'Needs attention' : 'Unassessed';
  return `<div class="access-check-row" data-state="${check.state}"><div class="report-check-description"><div class="report-check-title"><strong>${escape(check.title)}</strong><span class="report-check-state">${state}</span></div><p>${escape(check.evidence)}</p>${check.state !== 'pass' ? `<p class="report-check-next"><strong>Next:</strong> ${escape(check.nextStep)}</p>` : ''}</div><span class="access-check-points">${check.state === 'unknown' ? '?' : check.state === 'pass' ? check.weight : 0}<span> / ${check.weight}</span></span></div>`;
}

export function reportCheckSectionHtml(component: TechnicalComponent): string {
  const state = component.checks.some(check => check.state === 'fail') ? 'action' : component.unknown ? 'review' : 'pass';
  return `<section class="report-check-group" data-state="${state}" aria-labelledby="report-${component.id}-heading"><header class="report-check-group-heading"><h4 id="report-${component.id}-heading">${escape(component.title)}</h4><span>${component.earned}${component.unknown ? `–${component.earned + component.unknown}` : ''} <small>/ ${component.max} points</small></span></header><div class="access-component-bar" aria-hidden="true" style="--bar-earned:${component.earned / component.max * 100}%;--bar-possible:${(component.earned + component.unknown) / component.max * 100}%"></div>${component.checks.map(reportCheckRowHtml).join('')}</section>`;
}

/** One complete, script-independent report for both rendering paths. Results remain visible. */
export function siteAuditReportHtml(report: SiteAuditReport, { example = false, quota }: ReportOptions = {}): string {
  const page = report.page;
  const assessment = deriveTechnicalAssessment(report);
  const { lower, upper, coveragePercent } = assessment.score;
  const identity = reportIdentity(report);
  const score = lower === upper ? String(lower) : `${lower}–${upper}`;
  const nextChecks = assessment.components.flatMap(component => component.checks).filter(check => check.state !== 'pass')
    .sort((a, b) => Number(b.state === 'fail') - Number(a.state === 'fail') || b.weight - a.weight);
  const additional = additionalReviewFindings(report, assessment);
  const reviewedIds = new Set(additional.map(finding => finding.id));
  const otherFindings = report.findings.filter(finding => !reviewedIds.has(finding.id));
  const roles = [
    { role: 'search', label: 'Search' }, { role: 'assistant', label: 'Assistant requests' },
    { role: 'training-control', label: 'Training controls' }, { role: 'other', label: 'Other clients' },
  ];
  const policyGroups = roles.map(({ role, label }) => {
    const bots = report.robots.bots.filter(bot => role === 'other' ? !['search', 'assistant', 'training-control'].includes(bot.role) : bot.role === role);
    if (!bots.length) return '';
    return `<section class="report-policy-group"><h4>${label}</h4><ul class="report-policy-list">${bots.map(bot => `<li data-policy="${bot.decision}"><div><strong>${escape(bot.token)}</strong><span>${escape(bot.provider)} · ${escape(bot.role)}</span></div><span class="report-policy-decision">${bot.decision === 'allowed' ? 'Allowed' : bot.decision === 'disallowed' ? 'Disallowed' : 'Unknown'}</span><p>${escape(bot.matchedRule ?? bot.reason)}</p></li>`).join('')}</ul></section>`;
  }).join('');
  const policyTable = `<div class="ai-check-table-wrap" tabindex="0" role="region" aria-label="Crawler policy evidence; scroll horizontally if needed"><table><caption>Matching policy evidence</caption><thead><tr><th scope="col">Client</th><th scope="col">Match and source</th></tr></thead><tbody>${report.robots.bots.map(bot => `<tr><th scope="row">${escape(bot.token)}</th><td>${escape(bot.reason)}<br>Groups: ${escape(bot.matchedGroups.join(', ') || 'none')}<br>Source: ${escape(bot.source)}</td></tr>`).join('')}</tbody></table></div>`;
  const optional = `<div class="access-optional">${assessment.optional.map(capability => `<section class="access-optional-item"><h4>${escape(capability.title)}</h4><span class="access-optional-state">${escape(optionalSupportLabel(capability))}</span><p>${escape(capability.evidence)}</p><p class="report-optional-next">${escape(capability.nextStep)}</p></section>`).join('')}</div>`;
  const pageEvidence = `<dl class="report-page-facts">${[
    ['HTML assessment', page.parseState], ['Page title', page.title ?? 'Unavailable'], ['Description', page.description ?? 'Absent or unavailable'],
    ['Canonical URL', page.canonical ?? 'Absent or unavailable'], ['Language', page.language ?? 'Absent or unavailable'],
    ['Source inventory', `${page.textCharacters.toLocaleString('en-US')} characters · ${page.headings} headings · ${page.links} links · ${page.scriptElements} scripts. Scripts were not executed.`],
    ['Indexing capture', page.indexingAssessmentComplete === undefined ? 'Not recorded by this report version' : page.indexingAssessmentComplete ? 'Complete within the capture policy' : 'Incomplete; some evidence unassessed'],
    ['Indexing directives', page.metaRobots.map(value => `${value.agent}: ${value.value}`).join('; ') || 'None observed'],
    ['Structured data', `${page.structuredDataTypes.join(', ') || 'No types observed'} · ${page.structuredDataBlocks} blocks · ${page.invalidStructuredDataBlocks} invalid JSON blocks`],
    ['Alternate formats', page.alternateLinks.map(value => `${value.type}: ${value.href}`).join('; ') || 'None observed'],
  ].map(([label, value]) => `<div><dt>${escape(label ?? '')}</dt><dd>${escape(value ?? '')}</dd></div>`).join('')}</dl>
${page.textPreview !== undefined ? `<h4>Text observed in the HTML</h4><p class="access-source-preview">${escape(page.textPreview || 'No text observed')}</p><p class="tool-caption">Source text can include navigation or text hidden by CSS. This is not a rendered-browser comparison.</p>` : ''}
${page.headingOutline?.length ? `<h4>Observed heading outline</h4><ul class="access-heading-outline">${page.headingOutline.map(heading => `<li><span>H${heading.level}</span> ${escape(heading.text)}</li>`).join('')}</ul>` : ''}`;
  const requests = !report.resources.length ? '<p class="ai-check-note">No request results were captured.</p>' : `<div class="report-request-list">${report.resources.map(resource => `<div><strong>${escape(resource.probeAgent ? `Synthetic ${resource.probeAgent}` : resource.kind)}</strong><span>${escape(resource.status ?? resource.outcome)}</span><small>${escape(resource.contentType ?? 'Content type unavailable')} · ${resource.bytes.toLocaleString('en-US')} bytes · ${resource.elapsedMs} ms</small></div>`).join('')}</div>`;
  const rawRequests = `<div class="ai-check-table-wrap" tabindex="0" role="region" aria-label="Request evidence; scroll horizontally if needed"><table><caption>Raw HTTP request evidence</caption><thead><tr><th scope="col">Resource / probe</th><th scope="col">Response and headers</th></tr></thead><tbody>${report.resources.map(resource => `<tr><th scope="row">${escape(resource.probeAgent ?? resource.kind)}</th><td>${escape(resource.outcome)} · HTTP ${escape(resource.status ?? 'unavailable')}<br>Requested: ${escape(resource.requestedUrl)}<br>Final: ${escape(resource.finalUrl)}<br>${resource.redirects} redirects${Object.entries(resource.headers).filter(([, value]) => value !== null).map(([name, value]) => `<br>${escape(name)}: ${escape(value ?? '')}`).join('')}${resource.headersOmitted?.length ? `<br>Omitted by header-size policy: ${escape(resource.headersOmitted.join(', '))}` : ''}</td></tr>`).join('')}</tbody></table></div>`;

  return `<section id="access-report" tabindex="-1" aria-labelledby="audit-result-heading" class="ai-check-results ai-check-report">
<header class="ai-check-report-header"><div><span class="ai-check-report-label">${example ? 'Example report · saved observation' : 'Your access report'}</span><h2 id="audit-result-heading">${escape(identity.host)}</h2><p class="ai-check-target">${escape(report.target)}</p><p class="tool-caption">Observed ${escape(identity.observed)}</p></div><div class="report-actions">${example ? '<a class="ai-check-download" href="/ai-check-example.json" download="ai-access-example.json">Download JSON</a>' : ''}<a href="/tools/compare">Compare reports</a></div></header>
${example ? '<p class="report-example-note">Saved example · No live check performed. No daily check used.</p>' : ''}
${quota ? `<p class="ai-check-note">${escape(quota.remaining)} of ${escape(quota.limit)} checks remaining. Resets ${escape(quota.resetAt)}.</p>` : ''}
<section class="access-overview" id="report-overview" aria-label="Technical access score"><div class="access-score" data-range="${lower !== upper}" data-state="${assessment.counts.failed ? 'action' : assessment.counts.unknown ? 'review' : 'pass'}" style="--score-earned:${lower}%;--score-possible:${upper}%"><div class="access-score-value"><strong>${score}</strong><span>out of 100</span></div></div><div class="access-summary"><span class="ai-check-report-label">Technical access score</span><h3>${escape(assessmentVerdict(assessment))}</h3><p class="access-coverage"><span>${assessment.counts.passed} passed</span><span>${assessment.counts.failed} need attention</span><span>${assessment.counts.unknown} unassessed</span></p><p class="report-scope-note">A technical snapshot. Provider access, indexing and citation are not verified.</p></div></section>
<dl class="report-facts">${reportFacts(report).map(fact => `<div><dt>${escape(fact.label)}</dt><dd>${escape(fact.value)}</dd><dd class="report-fact-detail">${escape(fact.detail)}</dd></div>`).join('')}</dl>
<nav class="report-navigation" aria-label="Report sections"><a href="#report-next">Next steps</a><a href="#report-evidence">Checks</a><a href="#report-policies">Crawler policies</a><a href="#report-page">Page details</a><a href="#report-optional">Optional support</a></nav>
<section id="report-next" class="report-next" aria-labelledby="report-next-heading"><h3 id="report-next-heading">${nextChecks.length || additional.length ? 'What to review next' : 'No scored issues found'}</h3>${!nextChecks.length ? '<p class="ai-check-note">The scored checks passed. Review the crawler policies below against the clients you want to allow.</p>' : ''}
${nextChecks.slice(0, 3).map(check => `<section class="ai-check-finding" data-severity="${check.state === 'fail' ? 'action' : 'review'}"><span class="ai-check-finding-label">${check.state === 'fail' ? 'Needs attention' : 'Unassessed'} · ${check.weight} points</span><h4>${escape(check.title)}</h4><p>${escape(check.nextStep)}</p></section>`).join('')}
${additional.map(finding => `<section class="ai-check-finding" data-severity="${escape(finding.severity)}"><span class="ai-check-finding-label">Review · no score deduction</span><h4>${escape(finding.title)}</h4><p>${escape(finding.evidence)}</p><p>${escape(finding.recommendation)}</p></section>`).join('')}</section>
${section('report-evidence', '01', 'Scored checks', 'Every result and its evidence. Unassessed checks keep their points unknown.', assessment.components.map(reportCheckSectionHtml).join(''))}
${section('report-policies', '02', 'Crawler policies', 'Published rules for this path. Search, assistant and training controls are separate choices; these decisions do not change the score.', `<p class="report-policy-capture">robots.txt: ${escape(report.robots.state)} · ${report.robots.groups} groups · ${report.robots.rules} rules</p>${policyGroups || '<p class="ai-check-note">No client policies could be assessed.</p>'}`)}
${section('report-page', '03', 'Page and discovery evidence', 'What was captured in the initial response, without running scripts.', pageEvidence)}
${section('report-optional', '04', 'Optional support', 'Additional publishing capabilities. Missing support does not deduct points.', optional)}
${otherFindings.length ? section('report-observations', '05', 'Recorded observations', 'Additional context collected with this report.', otherFindings.map(finding => `<section class="report-observation"><h4>${escape(finding.title)}</h4><p>${escape(finding.evidence)}</p><p>${escape(finding.recommendation)}</p></section>`).join('')) : ''}
${section('report-requests', otherFindings.length ? '06' : '05', `Requests made by this checker (${report.resources.length})`, 'Every row is a request from this checker. A bot-named probe does not come from that bot’s provider and cannot verify that provider’s firewall treatment.', requests)}
<section class="report-technical" aria-label="Method and raw data"><h3>Method &amp; raw data</h3><p class="access-points-ledger">${lower} earned · ${100 - upper} deducted · ${upper - lower} unknown points. ${coveragePercent}% of weighted checks assessed.</p><p class="tool-caption">A score range includes points with unknown evidence. <a href="#score-method">How this score works</a>.</p><details class="access-evidence"><summary>Method and limits</summary><div class="access-evidence-body"><p>Scoring ${escape(assessment.profile)} · collection ${escape(report.version)}</p>${list(assessment.limits)}${list(report.limits)}</div></details><details class="access-evidence"><summary>Raw policy matches and HTTP headers</summary><div class="access-evidence-body">${policyTable}${report.robots.sitemaps.length ? `<h4>Published sitemap declarations</h4>${list(report.robots.sitemaps)}` : ''}${rawRequests}</div></details><details class="access-evidence"><summary>Full versioned JSON report</summary><div class="access-evidence-body"><pre>${escape(JSON.stringify({ report: { ...report, assessment }, ...(quota ? { quota } : {}) }, null, 2))}</pre></div></details></section>
</section>`;
}

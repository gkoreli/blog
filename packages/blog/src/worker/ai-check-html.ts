import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { deriveTechnicalAssessment } from '@gkoreli/site-audit/product';
import { additionalReviewFindings, optionalSupportLabel } from '../lib/site-audit-presentation.js';
import type { CheckQuota } from './ai-check-quota.js';

function escape(value: string | number): string {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

function list(values: readonly string[]): string {
  return `<ul>${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
}

/** All remote strings are text. Sample reports have no viewer quota to display. */
export function checkResultHtml(report: SiteAuditReport, quota?: CheckQuota): string {
  const page = report.page;
  const assessment = deriveTechnicalAssessment(report);
  const { lower, upper, max, coveragePercent } = assessment.score;
  const nextChecks = assessment.components.flatMap(component => component.checks).filter(check => check.state !== 'pass');
  nextChecks.sort((left, right) => Number(right.state === 'fail') - Number(left.state === 'fail') || right.weight - left.weight);
  const additionalFindings = additionalReviewFindings(report, assessment);
  const displayScore = lower === upper ? String(lower) : `${lower}–${upper}`;
  return `<section aria-labelledby="audit-result-heading" class="ai-check-results ai-check-report">
<header class="ai-check-report-header"><h2 id="audit-result-heading">Check results</h2>
<p class="ai-check-target">${escape(report.target)}</p>
<p class="ai-check-note">Checked ${escape(report.checkedAt)} · ${report.complete ? 'All planned resources received' : 'Partial evidence; inspect unavailable checks below'}.</p></header>
${quota ? `<p class="ai-check-note">${escape(quota.remaining)} of ${escape(quota.limit)} checks remaining. Resets ${escape(quota.resetAt)}.</p>` : ''}
<section class="access-overview" aria-label="Technical access score">
<div class="access-score" data-state="${assessment.counts.failed ? 'action' : assessment.counts.unknown ? 'review' : 'pass'}"><strong>${escape(displayScore)}</strong><span>/ ${escape(max)}</span><span>${escape(assessment.label)}</span></div>
<div class="access-summary"><h3>${lower === upper ? 'All scored conditions assessed' : 'Some scored evidence is unavailable'}</h3>
<p>${escape(lower)} earned · ${escape(max - upper)} lost · ${escape(upper - lower)} unknown points</p>
<p class="access-coverage">${escape(coveragePercent)}% of weighted checks assessed · ${escape(assessment.counts.passed)} passed · ${escape(assessment.counts.failed)} need attention · ${escape(assessment.counts.unknown)} unassessed</p>
<p class="ai-check-note">A declared technical rubric, not a prediction of AI access, ranking or citations. Unknown points stay in the fixed 100-point total.</p><p class="ai-check-note">Method: ${escape(assessment.profile)}</p></div></section>
<div class="access-components">${assessment.components.map(component => `<section class="access-component"><h3>${escape(component.title)}</h3><strong>${escape(component.earned)}${component.unknown ? `–${escape(component.earned + component.unknown)}` : ''}</strong><small> / ${escape(component.max)}</small><p class="access-component-state">${escape(component.unknown)} unknown points</p>
<details class="access-evidence"><summary>Scored checks and weights</summary><div class="access-evidence-body">${component.checks.map(check => `<div class="access-check-row" data-state="${escape(check.state)}"><span class="access-check-indicator" aria-hidden="true">${check.state === 'pass' ? '✓' : check.state === 'fail' ? '!' : '?'}</span><div><strong>${escape(check.title)}</strong> <small>${escape(check.state)}</small><p>${escape(check.evidence)}</p><p>${escape(check.nextStep)}</p><small>Rule: ${escape(check.id)}</small></div><span class="access-check-points">${escape(check.weight)} points</span></div>`).join('')}</div></details></section>`).join('')}</div>
<section aria-labelledby="audit-next-heading"><h3 id="audit-next-heading">What to do next</h3>
${nextChecks.length ? nextChecks.slice(0, 3).map(check => `<section class="ai-check-finding" data-severity="${check.state === 'fail' ? 'action' : 'review'}"><h4>${escape(check.title)}</h4><p>${escape(check.evidence)}</p><p>${escape(check.nextStep)}</p><small>${escape(check.weight)} ${check.state === 'unknown' ? 'unassessed' : 'lost'} points · ${escape(check.id)}</small></section>`).join('') : '<p>No scored access issue was identified. Review optional capabilities and the evidence below for your task.</p>'}</section>
${additionalFindings.length ? `<section><h3>Other observations to review</h3><p class="ai-check-note">These diagnostics do not deduct score points. Interpret crawler policies and optional features according to your intent.</p>${additionalFindings.slice(0,3).map(finding=>`<section class="ai-check-finding" data-severity="${escape(finding.severity)}"><h4>${escape(finding.title)}</h4><p>${escape(finding.evidence)}</p><p>${escape(finding.recommendation)}</p></section>`).join('')}</section>` : ''}
<section><h3>Optional capabilities</h3><p class="ai-check-note">These observations do not change the score. HTML can work without Markdown, llms.txt or structured data.</p>
<div class="access-optional">${assessment.optional.map(capability => `<section class="access-optional-item"><h4>${escape(capability.title)}</h4><p class="access-optional-state">${escape(optionalSupportLabel(capability))}</p><p>${escape(capability.evidence)}</p><p>${escape(capability.nextStep)}</p></section>`).join('')}</div></section>
<details class="access-evidence"><summary>All findings and next checks (${escape(report.findings.length)})</summary><div class="access-evidence-body">${report.findings.map(finding => `<section><h4>${escape(finding.title)} <small>(${escape(finding.severity)})</small></h4><p>${escape(finding.evidence)}</p><p>${escape(finding.recommendation)}</p></section>`).join('')}</div></details>
<details class="access-evidence"><summary>Published crawler policy for this path</summary><div class="access-evidence-body">
<p>Robots state: ${escape(report.robots.state)}. ${escape(report.robots.groups)} groups, ${escape(report.robots.rules)} rules. These are policy evaluations, not proof of provider access.</p>
<div class="ai-check-table-wrap" tabindex="0" role="region" aria-label="Crawler policy evidence; scroll horizontally if needed"><table><thead><tr><th scope="col">Token / provider</th><th scope="col">Role</th><th scope="col">Policy</th><th scope="col">Matching evidence</th></tr></thead><tbody>${report.robots.bots.map(bot => `<tr><th scope="row">${escape(bot.token)}<br>${escape(bot.provider)}</th><td>${escape(bot.role)}</td><td>${escape(bot.decision)}</td><td>${escape(bot.reason)}${bot.matchedRule ? `<br><code>${escape(bot.matchedRule)}</code>` : ''}<br>Groups: ${escape(bot.matchedGroups.join(', ') || 'none')}<br>Source: ${escape(bot.source)}</td></tr>`).join('')}</tbody></table></div>
${report.robots.sitemaps.length ? `<h4>Published sitemap declarations</h4>${list(report.robots.sitemaps)}` : ''}</div></details>
<details class="access-evidence"><summary>Page and discovery evidence</summary><div class="access-evidence-body">
<dl><dt>HTML assessment</dt><dd>${escape(page.parseState)}</dd><dt>HTML title</dt><dd>${escape(page.title ?? 'Unavailable')}</dd><dt>Description</dt><dd>${escape(page.description ?? 'Absent or unavailable')}</dd><dt>Canonical claim</dt><dd>${escape(page.canonical ?? 'Absent or unavailable')}</dd><dt>Language</dt><dd>${escape(page.language ?? 'Absent or unavailable')}</dd>
<dt>Text in received HTML</dt><dd>${escape(page.textCharacters)} characters; ${escape(page.headings)} headings; ${escape(page.links)} links; ${escape(page.scriptElements)} script elements. Scripts were not executed.</dd>
<dt>Indexing assessment capture</dt><dd>${page.indexingAssessmentComplete === undefined ? 'Not recorded by this report version' : page.indexingAssessmentComplete ? 'Complete within the capture policy' : 'Incomplete; some evidence unassessed'}</dd>
<dt>Structured data types</dt><dd>${escape(page.structuredDataTypes.join(', ') || 'None observed')} (${escape(page.structuredDataBlocks)} blocks; ${escape(page.invalidStructuredDataBlocks)} invalid JSON blocks)</dd>
<dt>llms.txt</dt><dd>${escape(report.discovery.llms)} · ${escape(report.discovery.llmsLinks)} links; optional convention</dd><dt>Sitemap</dt><dd>${escape(report.discovery.sitemap)}</dd><dt>Markdown negotiation</dt><dd>${escape(report.discovery.markdown)}; optional representation</dd></dl>
${page.textPreview !== undefined ? `<h4>Text observed in the HTML</h4><p>${escape(page.textPreview || 'No text observed')}</p>` : ''}
${page.headingOutline?.length ? `<h4>Observed heading outline</h4>${list(page.headingOutline.map(heading => `H${heading.level}: ${heading.text}`))}` : ''}
${page.metaRobots.length ? `<h4>Indexing directives</h4>${list(page.metaRobots.map(value => `${value.agent}: ${value.value}`))}` : ''}
${page.alternateLinks.length ? `<h4>Alternate representations</h4>${list(page.alternateLinks.map(value => `${value.type}: ${value.href}`))}` : ''}</div></details>
<details class="access-evidence"><summary>Requests made by this checker (${escape(report.resources.length)})</summary><div class="access-evidence-body">
<p>Declared-UA probes are synthetic requests from this checker, not requests from the named providers.</p>
<div class="ai-check-table-wrap" tabindex="0" role="region" aria-label="Request evidence; scroll horizontally if needed"><table><thead><tr><th scope="col">Resource / probe</th><th scope="col">Outcome</th><th scope="col">HTTP</th><th scope="col">Evidence</th></tr></thead><tbody>${report.resources.map(resource => `<tr><th scope="row">${escape(resource.probeAgent ?? resource.kind)}</th><td>${escape(resource.outcome)}</td><td>${escape(resource.status ?? '—')}</td><td>Requested: ${escape(resource.requestedUrl)}<br>Final: ${escape(resource.finalUrl)}<br>${escape(resource.contentType ?? 'No captured content type')} · ${escape(resource.bytes)} bytes · ${escape(resource.elapsedMs)} ms · ${escape(resource.redirects)} redirects${Object.entries(resource.headers).filter(([, value]) => value !== null).map(([name, value]) => `<br>${escape(name)}: ${escape(value ?? '')}`).join('')}${resource.headersOmitted?.length ? `<br>Omitted by header-size policy: ${escape(resource.headersOmitted.join(', '))}` : ''}</td></tr>`).join('')}</tbody></table></div></div></details>
<details class="access-evidence"><summary>Method and limits</summary><div class="access-evidence-body">${list(assessment.limits)}${list(report.limits)}</div></details>
<details class="access-evidence"><summary>Full versioned JSON report</summary><div class="access-evidence-body"><pre>${escape(JSON.stringify({ report: { ...report, assessment }, ...(quota ? { quota } : {}) }, null, 2))}</pre></div></details>
</section>`;
}

export function checkErrorHtml(message: string): string {
  return `<section role="alert"><h2>Check could not run</h2><p>${escape(message)}</p></section>`;
}

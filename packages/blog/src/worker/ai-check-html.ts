import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import type { CheckQuota } from './ai-check-quota.js';

function escape(value: string | number): string {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

function list(values: readonly string[]): string {
  return `<ul>${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
}

/** All remote strings are text. No upstream markup, scripts or active links. */
export function checkResultHtml(report: SiteAuditReport, quota: CheckQuota): string {
  const page = report.page;
  return `<section aria-labelledby="audit-result-heading" class="ai-check-results">
<h2 id="audit-result-heading">Check results</h2>
<p><strong>${escape(report.target)}</strong><br>Checked ${escape(report.checkedAt)} · ${report.complete ? 'All planned resources received' : 'Partial evidence; inspect unavailable checks below'}.</p>
<p>${quota.remaining} of ${quota.limit} checks remaining. Resets ${escape(quota.resetAt)}.</p>
<h3>What to do next</h3>${report.findings.map(finding => `<section><h4>${escape(finding.title)} <small>(${escape(finding.severity)})</small></h4><p>${escape(finding.evidence)}</p><p>${escape(finding.recommendation)}</p></section>`).join('')}
<h3>Published crawler policy for this path</h3>
<p>Robots state: ${escape(report.robots.state)}. ${report.robots.groups} groups, ${report.robots.rules} rules. These are policy evaluations, not proof of provider access.</p>
<div class="ai-check-table-wrap" tabindex="0" role="region" aria-label="Check evidence table; scroll horizontally if needed"><table><thead><tr><th scope="col">Token</th><th scope="col">Role</th><th scope="col">Policy</th><th scope="col">Reason / rule</th></tr></thead><tbody>${report.robots.bots.map(bot => `<tr><th scope="row">${escape(bot.token)}</th><td>${escape(bot.role)}</td><td>${escape(bot.decision)}</td><td>${escape(bot.reason)}${bot.matchedRule ? `<br><code>${escape(bot.matchedRule)}</code>` : ''}</td></tr>`).join('')}</tbody></table></div>
<h3>Page and discovery evidence</h3>
<dl><dt>HTML title</dt><dd>${escape(page.title ?? 'Unavailable')}</dd><dt>Canonical claim</dt><dd>${escape(page.canonical ?? 'Absent or unavailable')}</dd><dt>Text in received HTML</dt><dd>${page.textCharacters} characters; ${page.headings} headings; ${page.links} links; ${page.scriptElements} script elements. Scripts were not executed.</dd><dt>Structured data types</dt><dd>${escape(page.structuredDataTypes.join(', ') || 'None observed')} (${page.invalidStructuredDataBlocks} invalid JSON blocks)</dd><dt>llms.txt</dt><dd>${escape(report.discovery.llms)} · ${report.discovery.llmsLinks} links; optional convention</dd><dt>Sitemap</dt><dd>${escape(report.discovery.sitemap)}</dd><dt>Markdown negotiation</dt><dd>${escape(report.discovery.markdown)}</dd></dl>
${page.metaRobots.length ? `<h4>Indexing directives</h4>${list(page.metaRobots.map(value => `${value.agent}: ${value.value}`))}` : ''}
${page.alternateLinks.length ? `<h4>Alternate representations</h4>${list(page.alternateLinks.map(value => `${value.type}: ${value.href}`))}` : ''}
<h3>Requests made by this checker</h3>
<p>Declared-UA probes are synthetic requests from this checker, not requests from the named providers.</p>
<div class="ai-check-table-wrap" tabindex="0" role="region" aria-label="Check evidence table; scroll horizontally if needed"><table><thead><tr><th scope="col">Resource / probe</th><th scope="col">Outcome</th><th scope="col">HTTP</th><th scope="col">Evidence</th></tr></thead><tbody>${report.resources.map(resource => `<tr><th scope="row">${escape(resource.probeAgent ?? resource.kind)}</th><td>${escape(resource.outcome)}</td><td>${escape(resource.status ?? '—')}</td><td>${escape(resource.finalUrl)}<br>${escape(resource.contentType ?? 'No content type')} · ${resource.bytes} bytes · ${resource.elapsedMs} ms · ${resource.redirects} redirects${resource.headers.robots ? `<br>X-Robots-Tag: ${escape(resource.headers.robots)}` : ''}</td></tr>`).join('')}</tbody></table></div>
<h3>What this result can establish</h3>${list(report.limits)}
<details><summary>Full versioned JSON report</summary><pre>${escape(JSON.stringify({ report, quota }, null, 2))}</pre></details>
</section>`;
}

export function checkErrorHtml(message: string): string {
  return `<section role="alert"><h2>Check could not run</h2><p>${escape(message)}</p></section>`;
}

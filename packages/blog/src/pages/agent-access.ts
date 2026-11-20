import { html } from '@nisli/core';
import { dropdown } from '@gkoreli/design/dropdown';
import { statsHeader } from '../templates/stats-header.js';
import { sectionNavigation } from '../templates/section-navigation.js';
import { reportContextHeading } from '../templates/report-context.js';

export function agentAccessPage() {
  return html`<article class="stats-page">${statsHeader('agents')}
  <agent-access-report class="agent-access-report" id="stats-agent-access" aria-labelledby="agent-access-heading">
    ${reportContextHeading({ id: 'agent-access-heading', title: 'Agent access', description: 'Which work AI fetchers, search clients, crawlers and historical signed clients access, in which served format. Names and roles describe stored request evidence.', scope: [{ label: 'Window', value: '28 completed days' }, { label: 'Calendar', value: 'UTC reporting days' }, { label: 'Controls in this report', value: 'Article, client and role' }] })}
    ${sectionNavigation('Agent access sections', [{ href: '#agent-access-summary', label: 'Overview' }, { href: '#agent-access-change', label: 'Weekly change' }, { href: '#agent-access-weeks', label: 'Four weeks' }, { href: '#agent-access-articles', label: 'Articles' }, { href: '#agent-access-clients', label: 'Clients' }, { href: '#agent-access-coverage', label: 'Coverage' }, { href: '#agent-access-evidence', label: 'Evidence' }, { href: '#agent-access-history', label: 'History' }], { className: 'agent-access-navigation', currentHref: '#agent-access-summary', hidden: true })}
    <div data-agent-overview id="agent-access-summary"></div>
    <form class="agent-access-form"><fieldset data-agent-controls disabled><legend>Select agent access</legend><div class="agent-access-selects">
      ${dropdown({ id: 'agent-article', name: 'agent-article', label: 'Article and registered evidence',
        options: [{ value: '', label: 'All articles and site resources' }] })}
      ${dropdown({ id: 'agent-client', name: 'agent-client', label: 'Client declaration',
        options: [{ value: '', label: 'All client declarations' }] })}
      <button type="button" data-agent-clear disabled>Clear selections</button></div>
      <fieldset class="agent-access-roles report-filter"><legend>Declared role</legend><div class="report-options"><label class="report-option"><input type="radio" name="agent-role" data-agent-role value="" checked aria-label="All roles"><span>All roles <small data-agent-role-count></small></span></label><label class="report-option"><input type="radio" name="agent-role" data-agent-role value="ai-assistant" aria-label="On-demand fetcher declarations"><span>On-demand <small data-agent-role-count></small></span></label><label class="report-option"><input type="radio" name="agent-role" data-agent-role value="ai-search" aria-label="AI-search declarations"><span>AI search <small data-agent-role-count></small></span></label><label class="report-option"><input type="radio" name="agent-role" data-agent-role value="ai-crawler" aria-label="AI-crawler declarations"><span>AI crawlers <small data-agent-role-count></small></span></label><label class="report-option"><input type="radio" name="agent-role" data-agent-role value="signed-agent" aria-label="Signed clients — historical or unknown role"><span>Signed fallback <small data-agent-role-count></small></span></label></div></fieldset>
      <p class="agent-access-filter-note">Counts beside choices cover the other two selections. Article choices include registered evidence.</p>
    </fieldset></form>
    <p data-agent-status class="agent-access-selection" role="status" aria-live="polite" aria-atomic="true">Loading the completed-day agent access report…</p>
    <button type="button" data-agent-retry hidden>Retry agent access</button>
    <div id="agent-access-change" data-agent-results></div>
    <p class="agent-access-note"><a href="/api/agent-access">Agent access JSON</a> · Current collection covers eligible served pages. Citation and answer-use observations are separate outcomes.</p>
    <noscript><p>Enable JavaScript to select articles and clients, or open the agent access JSON report.</p></noscript>
  </agent-access-report>
</article>`;
}

import { html } from '@nisli/core';
import type { TrafficFilter } from '@gkoreli/analytics/contracts';
import { TRAFFIC_GROUPS, TRAFFIC_LABELS } from '../lib/stats-presentation.js';

const COMPACT_LABELS: Record<TrafficFilter, string> = {
  all: 'All traffic', browser: 'Browser signals', agents: 'Agents',
  crawlers: 'Crawlers', automation: 'Automation', unresolved: 'Unresolved',
};

const PERIODS = [
  { value: '7d', days: '7', label: '7 days' },
  { value: '30d', days: '30', label: '30 days' },
  { value: '90d', days: '90', label: '90 days' },
  { value: 'all', days: '0', label: 'All time' },
] as const;

/** Native single-choice controls; the report owns fetching and URL state. */
export function reportFilters(idPrefix: string) {
  const traffic = ['all', ...TRAFFIC_GROUPS] as const;
  return html`<div class="report-controls" id=${`${idPrefix}-controls`} aria-label="Report filters">
    <fieldset class="report-filter report-filter-traffic" id=${`${idPrefix}-traffic`} aria-describedby=${`${idPrefix}-traffic-help`}>
      <legend>Traffic</legend>
      <div class="report-options">${traffic.map(group => html`<label class="report-option">
        <input type="radio" name=${`${idPrefix}-traffic`} value=${group} data-traffic=${group} checked=${group === 'all'} aria-label=${COMPACT_LABELS[group] === TRAFFIC_LABELS[group] ? COMPACT_LABELS[group] : `${COMPACT_LABELS[group]}: ${TRAFFIC_LABELS[group]}`}>
        <span>${COMPACT_LABELS[group]}</span>
      </label>`)}</div>
      <p class="sr-only" id=${`${idPrefix}-traffic-help`}>Categories describe request signals, not verified people. Agents includes on-demand fetchers, AI search, AI crawlers and historical or unknown-role signed clients. Other crawlers includes search, SEO and preview declarations. Automation includes legacy rules.</p>
    </fieldset>
    <fieldset class="report-filter report-filter-period" data-filter-group="period">
      <legend>Period</legend>
      <div class="report-options">${PERIODS.map(period => html`<label class="report-option">
        <input type="radio" name=${`${idPrefix}-period`} value=${period.value} data-days=${period.days} checked=${period.value === '30d'}>
        <span>${period.label}</span>
      </label>`)}</div>
    </fieldset>
  </div>`;
}

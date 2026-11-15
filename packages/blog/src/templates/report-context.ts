import { html } from '@nisli/core';

export interface ReportScopeFact { readonly label: string; readonly value: string }

export function reportScopeFacts(facts: readonly ReportScopeFact[]) {
  return html`<dl class="report-scope-facts" aria-label="Report scope">${facts.map(fact => html`<div><dt>${fact.label}</dt><dd>${fact.value}</dd></div>`)}</dl>`;
}

/** Report boundaries are part of the interface, alongside the controls they own. */
export function reportContextHeading(context: {
  id: string;
  title: string;
  description: string;
  scope: readonly ReportScopeFact[];
}) {
  return html`<header class="report-context-heading"><h2 id=${context.id}>${context.title}</h2><p>${context.description}</p>${reportScopeFacts(context.scope)}</header>`;
}

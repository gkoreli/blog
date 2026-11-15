import {
  AGENT_ACCESS_KINDS, addAgentAccessMetrics, emptyAgentAccessMetrics, selectAgentAccess,
  type AgentAccessClient, type AgentAccessKind, type AgentAccessMetrics,
  type AgentAccessReport, type AgentAccessResource, type AgentAccessSelection,
} from './agent-access-contract.js';

export const ALL_AGENT_ACCESS: Readonly<AgentAccessSelection> = Object.freeze({ articleId: null, client: null, kind: null });

function accumulate<Key>(groups: Map<Key, AgentAccessMetrics>, key: Key, metrics: AgentAccessMetrics): void {
  const total = groups.get(key) ?? emptyAgentAccessMetrics();
  addAgentAccessMetrics(total, metrics); groups.set(key, total);
}
function counts<Row extends { views: number }>(rows: readonly Row[], key: (row: Row) => string): Row[] {
  const groups = new Map<string, Row>();
  for (const row of rows) {
    const identity = key(row), group = groups.get(identity);
    if (group) group.views += row.views; else groups.set(identity, { ...row });
  }
  return [...groups.values()].sort((a, b) => b.views - a.views || key(a).localeCompare(key(b)));
}

/** Browser-safe read model. Selection, resource ownership, coverage and evidence
 * grouping live here; presentation supplies labels and markup. Facet counts keep
 * the other two selections and ignore their own, so alternatives remain visible.
 * No query, identity inference, evidence reinterpretation or mutation is involved.
 */
export function exploreAgentAccess(report: AgentAccessReport, selection: AgentAccessSelection = ALL_AGENT_ACCESS) {
  const selected = selectAgentAccess(report, selection);
  const owners = new Map<string, string>();
  for (const resource of report.resources) {
    if (resource.role === 'article') owners.set(resource.id, resource.id);
    else if (resource.articleId !== null) owners.set(resource.id, resource.articleId);
  }
  const articleChoices = new Map<string, AgentAccessMetrics>(), clientChoices = new Map<AgentAccessClient, AgentAccessMetrics>();
  const roleChoices = new Map<AgentAccessKind, AgentAccessMetrics>();
  const allResources = emptyAgentAccessMetrics(), allClients = emptyAgentAccessMetrics(), allRoles = emptyAgentAccessMetrics();
  for (const cell of report.cells) {
    const article = cell.resourceId === null ? undefined : owners.get(cell.resourceId);
    const inArticle = selection.articleId === null || article === selection.articleId;
    const inClient = selection.client === null || cell.client === selection.client;
    const inRole = selection.kind === null || cell.kind === selection.kind;
    if (inClient && inRole) {
      addAgentAccessMetrics(allResources, cell.metrics);
      if (article !== undefined) accumulate(articleChoices, article, cell.metrics);
    }
    if (inArticle && inRole) { addAgentAccessMetrics(allClients, cell.metrics); accumulate(clientChoices, cell.client, cell.metrics); }
    if (inArticle && inClient) { addAgentAccessMetrics(allRoles, cell.metrics); accumulate(roleChoices, cell.kind, cell.metrics); }
  }
  const clients = new Set(report.cells.map(cell => cell.client));
  if (selection.client !== null) clients.add(selection.client);
  const articles = selected.byResource.filter(row => row.resource.role === 'article');
  const evidence = selected.byResource.filter(row => row.resource.role === 'evidence');
  const resourceViews = (role: AgentAccessResource['role']) => selected.byResource.filter(row => row.resource.role === role).reduce((total, row) => total + row.metrics.views, 0);
  const attribution = counts(selected.proofs.map(({ basis, profile, publisher, network, networkListed, views }) => ({ basis, profile, publisher, network, networkListed, views })),
    row => JSON.stringify([row.basis, row.profile, row.publisher, row.network, row.networkListed]));
  const measurements = counts(selected.history.map(({ collection, classifier, source, format, metrics }) => ({ collection, classifier, source, format, views: metrics.views })),
    row => JSON.stringify([row.collection, row.classifier, row.source, row.format]));
  return {
    window: { scope: report.scope, accounting: report.accounting, metrics: report.total },
    selection: { ...selection },
    article: report.resources.find(resource => resource.id === selection.articleId) ?? null,
    metrics: selected.total, articles, clients: selected.byClient, roles: selected.byRole, formats: selected.byFormat,
    articlesAccessed: articles.filter(row => row.metrics.views > 0).length,
    markdownEvents: selected.byFormat.find(row => row.format === 'markdown')?.metrics.views ?? 0,
    coverage: { articleEvents: resourceViews('article'), evidenceEvents: resourceViews('evidence'), siteEvents: resourceViews('site'), unregisteredEvents: selected.unregistered.views, evidence },
    attribution, measurements,
    choices: {
      allResources, allClients, allRoles,
      articles: report.resources.filter(resource => resource.role === 'article').map(resource => ({ resource, metrics: articleChoices.get(resource.id) ?? emptyAgentAccessMetrics() })),
      clients: [...clients].map(client => ({ client, metrics: clientChoices.get(client) ?? emptyAgentAccessMetrics() })),
      roles: AGENT_ACCESS_KINDS.map(kind => ({ kind, metrics: roleChoices.get(kind) ?? emptyAgentAccessMetrics() })),
    },
  };
}

export type AgentAccessExploration = ReturnType<typeof exploreAgentAccess>;

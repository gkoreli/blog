import {
  accessDayCount, consistentAgentAccessReport, isAgentAccessClient, isAgentAccessKind,
  type AgentAccessReport, type AgentAccessSelection,
} from '@gkoreli/analytics/agent-access-contract';
import { ALL_AGENT_ACCESS, exploreAgentAccess } from '@gkoreli/analytics/agent-access-explorer';
import { agentAccessViewHtml, agentAccessSelectionLabel, agentClientLabel } from '../lib/agent-access-view.js';

class AgentAccessReportElement extends HTMLElement {
  private report: AgentAccessReport | null = null;
  private selection: AgentAccessSelection = { ...ALL_AGENT_ACCESS };
  private controller: AbortController | undefined;
  private generation = 0;
  private initialized = false;

  connectedCallback(): void {
    if (!this.initialized) {
      this.initialized = true;
      this.addEventListener('change', event => this.handleChange(event));
      this.addEventListener('click', event => this.handleClick(event));
      this.querySelector('form')?.addEventListener('submit', event => event.preventDefault());
    }
    if (this.report) this.render(); else void this.load();
  }
  disconnectedCallback(): void { this.generation++; this.controller?.abort(); }

  private status(message: string, state: 'loading' | 'ready' | 'error'): void {
    const target = this.querySelector<HTMLElement>('[data-agent-status]');
    if (target) { target.textContent = message; target.dataset.state = state; }
    this.setAttribute('aria-busy', String(state === 'loading'));
    const controls = this.querySelector<HTMLFieldSetElement>('[data-agent-controls]');
    if (controls) controls.disabled = state !== 'ready';
    const retry = this.querySelector<HTMLButtonElement>('[data-agent-retry]');
    if (retry) retry.hidden = state !== 'error';
  }
  private async load(restoreFocus = false): Promise<void> {
    const generation = ++this.generation;
    this.controller?.abort(); this.controller = new AbortController();
    this.status('Loading the completed-day agent access report…', 'loading');
    try {
      const response = await fetch('/api/agent-access', { signal: this.controller.signal });
      if (!response.ok) throw new Error('Agent access unavailable');
      const value: unknown = await response.json();
      if (!consistentAgentAccessReport(value)) throw new Error('Agent access report failed its consistency checks');
      if (!this.isConnected || generation !== this.generation) return;
      this.report = value; this.render();
    } catch {
      if (!this.isConnected || generation !== this.generation) return;
      this.status('Agent access is unavailable. A failed or incomplete report is not shown as zero.', 'error');
    }
    // A retry button disappears while loading. Restore its place only if the
    // operator has not moved focus to another control during the request.
    if (restoreFocus && document.activeElement === document.body) {
      this.querySelector<HTMLElement>(this.report ? '[data-agent-article-select]' : '[data-agent-retry]')?.focus();
    }
  }
  private select(changes: Partial<AgentAccessSelection>): void {
    if (!this.report) return;
    const next = { ...this.selection, ...changes };
    if (next.articleId !== null && !this.report.resources.some(resource => resource.role === 'article' && resource.id === next.articleId)) return;
    this.selection = next; this.render();
  }
  private render(): void {
    if (!this.report) return;
    const view = exploreAgentAccess(this.report, this.selection), html = agentAccessViewHtml(view);
    const overview = this.querySelector<HTMLElement>('[data-agent-overview]'), details = this.querySelector<HTMLElement>('[data-agent-results]');
    if (overview) overview.innerHTML = html.overview;
    if (details) details.innerHTML = html.details;
    const articles = this.querySelector<HTMLSelectElement>('[data-agent-article-select]');
    if (articles) {
      articles.replaceChildren(new Option(`All articles and site resources — ${view.choices.allResources.views.toLocaleString()}`, ''));
      for (const row of [...view.choices.articles].sort((a, b) => a.resource.title.localeCompare(b.resource.title))) articles.add(new Option(`${row.resource.title} — ${row.metrics.views.toLocaleString()}`, row.resource.id));
      articles.value = this.selection.articleId ?? '';
    }
    const clients = this.querySelector<HTMLSelectElement>('[data-agent-client-select]');
    if (clients) {
      clients.replaceChildren(new Option(`All client declarations — ${view.choices.allClients.views.toLocaleString()}`, ''));
      for (const row of [...view.choices.clients].sort((a, b) => agentClientLabel(a.client).localeCompare(agentClientLabel(b.client)))) clients.add(new Option(`${agentClientLabel(row.client)} — ${row.metrics.views.toLocaleString()}`, row.client));
      clients.value = this.selection.client ?? '';
    }
    for (const input of this.querySelectorAll<HTMLInputElement>('[data-agent-role]')) {
      input.checked = input.value === (this.selection.kind ?? '');
      const count = input.parentElement?.querySelector<HTMLElement>('[data-agent-role-count]');
      if (count) count.textContent = (input.value === '' ? view.choices.allRoles.views : view.choices.roles.find(row => row.kind === input.value)?.metrics.views ?? 0).toLocaleString();
    }
    const clear = this.querySelector<HTMLButtonElement>('[data-agent-clear]');
    if (clear) clear.disabled = Object.values(this.selection).every(value => value === null);
    const days = accessDayCount(view.metrics.dayMask);
    this.status(`${view.metrics.views.toLocaleString()} recorded page ${view.metrics.views === 1 ? 'event' : 'events'} · ${days} active UTC ${days === 1 ? 'day' : 'days'}. ${agentAccessSelectionLabel(view)}.`, 'ready');
  }
  private handleChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement && target.matches('[data-agent-article-select]')) this.select({ articleId: target.value || null });
    else if (target instanceof HTMLSelectElement && target.matches('[data-agent-client-select]')) {
      if (target.value === '' || isAgentAccessClient(target.value)) this.select({ client: target.value === '' ? null : target.value });
    } else if (target instanceof HTMLInputElement && target.matches('[data-agent-role]')) {
      if (target.value === '' || isAgentAccessKind(target.value)) this.select({ kind: target.value === '' ? null : target.value });
    }
  }
  private handleClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLButtonElement>('button');
    if (!target || !this.contains(target)) return;
    if (target.hasAttribute('data-agent-retry')) { void this.load(true); return; }
    const client = target.dataset.agentClient, articleId = target.dataset.agentArticle;
    if (articleId !== undefined) { this.select({ articleId }); this.querySelector<HTMLSelectElement>('[data-agent-article-select]')?.focus(); }
    else if (client !== undefined && isAgentAccessClient(client)) { this.select({ client }); this.querySelector<HTMLSelectElement>('[data-agent-client-select]')?.focus(); }
    else if (target.hasAttribute('data-agent-clear')) {
      this.select({ ...ALL_AGENT_ACCESS }); this.querySelector<HTMLSelectElement>('[data-agent-article-select]')?.focus();
    }
  }
}

customElements.define('agent-access-report', AgentAccessReportElement);

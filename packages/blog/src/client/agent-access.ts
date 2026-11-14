import {
  consistentAgentAccessReport, isAgentAccessClient, isAgentAccessKind,
  type AgentAccessReport, type AgentAccessSelection,
} from '@gkoreli/analytics/agent-access-contract';
import { agentAccessViewHtml, agentClientLabel } from '../lib/agent-access-view.js';

class AgentAccessReportElement extends HTMLElement {
  private report: AgentAccessReport | null = null;
  private selection: AgentAccessSelection = { articleId: null, client: null, kind: null };
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
    const retry = this.querySelector<HTMLButtonElement>('[data-agent-retry]');
    if (retry) retry.hidden = state !== 'error';
  }
  private async load(): Promise<void> {
    const generation = ++this.generation;
    this.controller?.abort(); this.controller = new AbortController();
    this.status('Loading the completed-day agent access report…', 'loading');
    try {
      const response = await fetch('/api/agent-access', { signal: this.controller.signal });
      if (!response.ok) throw new Error('Agent access unavailable');
      const value: unknown = await response.json();
      if (!consistentAgentAccessReport(value)) throw new Error('Agent access report failed its consistency checks');
      if (!this.isConnected || generation !== this.generation) return;
      this.report = value;
      this.populate(); this.render();
    } catch {
      if (!this.isConnected || generation !== this.generation) return;
      this.status('Agent access is unavailable. A failed or incomplete report is not shown as zero.', 'error');
    }
  }
  private populate(): void {
    if (!this.report) return;
    const articles = this.querySelector<HTMLSelectElement>('[data-agent-article-select]');
    const clients = this.querySelector<HTMLSelectElement>('[data-agent-client-select]');
    if (articles) {
      articles.replaceChildren(new Option('All articles and site resources', ''));
      for (const resource of this.report.resources.filter(resource => resource.role === 'article').sort((a, b) => a.title.localeCompare(b.title))) articles.add(new Option(resource.title, resource.id));
    }
    if (clients) {
      clients.replaceChildren(new Option('All client declarations', ''));
      for (const client of [...new Set(this.report.cells.map(cell => cell.client))].sort((a, b) => agentClientLabel(a).localeCompare(agentClientLabel(b)))) clients.add(new Option(agentClientLabel(client), client));
    }
    const controls = this.querySelector<HTMLFieldSetElement>('[data-agent-controls]');
    if (controls) controls.disabled = false;
  }
  private render(): void {
    if (!this.report) return;
    const target = this.querySelector<HTMLElement>('[data-agent-results]');
    if (target) target.innerHTML = agentAccessViewHtml(this.report, this.selection);
    const articles = this.querySelector<HTMLSelectElement>('[data-agent-article-select]');
    const clients = this.querySelector<HTMLSelectElement>('[data-agent-client-select]');
    if (articles) articles.value = this.selection.articleId ?? '';
    if (clients) clients.value = this.selection.client ?? '';
    this.status('Completed-window report loaded. Article, client and role selections apply within this report.', 'ready');
  }
  private handleChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement) || !this.report) return;
    if (target.matches('[data-agent-article-select]')) {
      if (target.value !== '' && !this.report.resources.some(resource => resource.role === 'article' && resource.id === target.value)) return;
      this.selection = { ...this.selection, articleId: target.value || null };
    } else if (target.matches('[data-agent-client-select]')) {
      if (target.value !== '' && !isAgentAccessClient(target.value)) return;
      this.selection = { ...this.selection, client: target.value === '' ? null : isAgentAccessClient(target.value) ? target.value : null };
    } else return;
    this.render();
  }
  private handleClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLButtonElement>('button');
    if (!target || !this.contains(target)) return;
    if (target.hasAttribute('data-agent-retry')) { void this.load(); return; }
    if (!this.report) return;
    const kind = target.dataset.agentKind, client = target.dataset.agentClient, articleId = target.dataset.agentArticle;
    if (kind !== undefined && isAgentAccessKind(kind)) this.selection = { ...this.selection, kind: this.selection.kind === kind ? null : kind };
    else if (client !== undefined && isAgentAccessClient(client)) this.selection = { ...this.selection, client };
    else if (articleId !== undefined && this.report.resources.some(resource => resource.role === 'article' && resource.id === articleId)) this.selection = { ...this.selection, articleId };
    else if (target.dataset.agentReset === 'kind') this.selection = { ...this.selection, kind: null };
    else if (target.hasAttribute('data-agent-clear')) this.selection = { articleId: null, client: null, kind: null };
    else return;
    this.render();
    if (kind !== undefined && isAgentAccessKind(kind)) this.querySelector<HTMLButtonElement>(`[data-agent-kind="${kind}"]`)?.focus();
    else if (articleId !== undefined) this.querySelector<HTMLSelectElement>('[data-agent-article-select]')?.focus();
    else if (client !== undefined) this.querySelector<HTMLSelectElement>('[data-agent-client-select]')?.focus();
  }
}

customElements.define('agent-access-report', AgentAccessReportElement);

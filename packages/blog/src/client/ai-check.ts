import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className !== undefined) result.className = className;
  return result;
}
function section(title: string): HTMLElement {
  const result = node('section'); result.append(node('h3', title)); return result;
}
function definition(values: Array<[string, string]>): HTMLDListElement {
  const result = node('dl');
  for (const [label, value] of values) result.append(node('dt', label), node('dd', value));
  return result;
}
function makeTable(caption: string, labels: string[]): { wrapper: HTMLElement; body: HTMLTableSectionElement } {
  const wrapper = node('div', undefined, 'ai-check-table-wrap'); wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', `${caption}; scroll horizontally if needed`);
  const table = node('table'); table.append(node('caption', caption));
  const head = table.createTHead().insertRow();
  for (const label of labels) { const th = node('th', label); th.scope = 'col'; head.append(th); }
  const body = table.createTBody(); wrapper.append(table); return { wrapper, body };
}
function safeLink(text: string, href: string): HTMLElement {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.username || url.password) return node('span', text);
    const link = node('a', text); link.href = url.href; link.rel = 'noopener'; link.target = '_blank'; return link;
  } catch { return node('span', text); }
}
function rawEvidence(value: unknown, label = 'Complete JSON evidence'): HTMLDetailsElement {
  const details = node('details'), pre = node('pre'), code = node('code', JSON.stringify(value, null, 2));
  details.append(node('summary', label)); pre.append(code); details.append(pre); return details;
}

/** Renders untrusted target content only through text nodes; target HTML is never mounted. */
export function renderSiteAudit(report: SiteAuditReport): HTMLElement {
  const article = node('section', undefined, 'ai-check-report'); article.setAttribute('aria-label', 'Site access report');
  const header = node('header', undefined, 'ai-check-report-header');
  header.append(node('h2', report.complete ? 'Access report' : 'Partial access report'), node('p', report.target, 'ai-check-target'),
    node('p', `Checked ${report.checkedAt} · method ${report.version}`, 'ai-check-note'));
  article.append(header);
  const metrics = node('div', undefined, 'ai-check-metrics');
  for (const [value, label] of [[String(report.page.textCharacters.toLocaleString()), 'HTML text characters'], [String(report.resources.length), 'Resource checks'], [String(report.robots.bots.length), 'Crawler policies'], [report.discovery.markdown, 'Markdown negotiation']]) {
    const metric = node('div', undefined, 'ai-check-metric'); metric.append(node('strong', value), node('span', label)); metrics.append(metric);
  }
  article.append(metrics);
  const actions = section('What to do next');
  for (const finding of report.findings) {
    const item = node('div', undefined, 'ai-check-finding'); item.dataset['severity'] = finding.severity;
    item.append(node('span', finding.severity === 'action' ? 'Action' : finding.severity === 'review' ? 'Review' : 'Observed', 'ai-check-finding-label'),
      node('h3', finding.title), node('p', finding.evidence), node('p', finding.recommendation)); actions.append(item);
  }
  if (report.findings.length === 0) actions.append(node('p', 'No specific fixes were identified within this check’s scope.'));
  article.append(actions);

  const robots = section('Crawler rules for this path');
  robots.append(node('p', `${report.robots.state} robots.txt · ${report.robots.groups} groups · ${report.robots.rules} rules.`, 'ai-check-note'));
  const policies = makeTable('Declared crawler policies', ['Client and stated role', 'Path policy', 'Matching evidence']);
  for (const bot of report.robots.bots) {
    const row = policies.body.insertRow(), who = row.insertCell(), decision = row.insertCell(), evidence = row.insertCell();
    who.append(safeLink(bot.token, bot.source), node('small', `${bot.provider} · ${bot.role}`));
    decision.textContent = bot.decision;
    evidence.append(node('span', bot.matchedRule ?? 'No matching path rule'), node('small', bot.reason), node('small', `Groups: ${bot.matchedGroups.join(', ') || 'none'}`));
  }
  robots.append(policies.wrapper, node('p', 'These are declared path policies. Robots rules are requests to cooperating crawlers, not authorization or proof of provider access. Search, assistant and training controls are shown separately.', 'ai-check-note'));
  article.append(robots);

  const page = section('What arrived in the page');
  page.append(definition([
    ['HTML assessment', report.page.parseState], ['Title', report.page.title ?? 'Not observed'], ['Description', report.page.description ?? 'Not observed'],
    ['Canonical', report.page.canonical ?? 'Not observed'], ['Language', report.page.language ?? 'Not observed'],
    ['Headings / links / scripts', `${report.page.headings} / ${report.page.links} / ${report.page.scriptElements}`],
    ['Meta indexing controls', report.page.metaRobots.map(item => `${item.agent}: ${item.value}`).join('; ') || 'Not observed'],
    ['Structured data', report.page.structuredDataTypes.join(', ') || 'No types observed'],
    ['JSON-LD blocks', `${report.page.structuredDataBlocks} observed; ${report.page.invalidStructuredDataBlocks} invalid`],
    ['Alternate links', report.page.alternateLinks.map(item => `${item.type}: ${item.href}`).join('\n') || 'Not observed'],
  ]), node('p', 'Text is estimated from the returned HTML. This check does not execute scripts or compare browser-rendered content.', 'ai-check-note'));
  article.append(page);

  const discovery = section('Machine-readable discovery');
  discovery.append(definition([
    ['llms.txt', `${report.discovery.llms} · ${report.discovery.llmsLinks} links observed`],
    ['Sitemap', report.discovery.sitemap], ['Markdown negotiation', report.discovery.markdown],
    ['Robots sitemap declarations', report.robots.sitemaps.join('\n') || 'Not observed'],
  ])); article.append(discovery);

  const delivery = section('Resource and synthetic-probe evidence');
  delivery.append(node('p', 'Every row records a request made by this checker. A bot-named probe does not come from that bot’s provider and cannot verify that provider’s firewall treatment.', 'ai-check-note'));
  const resources = makeTable('Bounded HTTP observations', ['Resource', 'Response', 'Delivery evidence']);
  for (const resource of report.resources) {
    const row = resources.body.insertRow(), name = row.insertCell(), outcome = row.insertCell(), facts = row.insertCell();
    name.append(node('strong', resource.probeAgent ? `Synthetic ${resource.probeAgent}` : resource.kind), node('small', resource.requestedUrl));
    if (resource.finalUrl !== resource.requestedUrl) name.append(node('small', `Final: ${resource.finalUrl}`));
    outcome.append(node('span', resource.status === null ? resource.outcome : `${resource.status} · ${resource.outcome}`), node('small', resource.contentType ?? 'Content-Type unavailable'));
    facts.append(node('span', `${resource.bytes.toLocaleString()} bytes · ${resource.elapsedMs} ms · ${resource.redirects} redirects`));
    for (const [label, value] of [['X-Robots-Tag', resource.headers.robots], ['Link', resource.headers.link], ['Content-Location', resource.headers.contentLocation], ['Vary', resource.headers.vary]]) {
      if (value !== null) facts.append(node('small', `${label}: ${value}`));
    }
  }
  delivery.append(resources.wrapper); article.append(delivery);
  const limits = section('Scope and remaining uncertainty'), list = node('ul', undefined, 'ai-check-limits');
  for (const limit of report.limits) list.append(node('li', limit));
  limits.append(list); article.append(limits, rawEvidence(report)); return article;
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function at(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) { if (!object(current)) return undefined; current = current[key]; }
  return current;
}
function display(value: unknown): string {
  if (value === null || value === undefined) return 'Unavailable';
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ') || 'None observed';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
export function renderRequestEvidence(value: Record<string, unknown>): HTMLElement {
  const section = node('section'); section.append(node('h3', 'Evidence from this request'));
  section.append(definition([
    ['Request category', display(at(value, 'classification', 'readerKind'))],
    ['Classification reason', display(at(value, 'classification', 'reason'))],
    ['Declared client names', display(at(value, 'evidence', 'declarations', 'candidates'))],
    ['Declaration agreement', display(at(value, 'evidence', 'categoryAgreement'))],
    ['Browser-family claim', display(at(value, 'evidence', 'declarations', 'browserFamily'))],
    ['Navigation-shaped', display(at(value, 'evidence', 'navigationShaped'))],
    ['Activation claim', display(at(value, 'evidence', 'activation'))],
    ['Client-form markers', display(at(value, 'clientForm', 'form'))],
    ['Network list evidence', display(at(value, 'evidence', 'network'))],
    ['Network ASN', display(at(value, 'network', 'asn'))],
    ['Published-IP-feed results', display(at(value, 'network', 'vendorNetwork', 'summary'))],
    ['Local signature outcome', display(at(value, 'signature', 'localOutcome'))],
    ['Verified signer display', display(at(value, 'signature', 'signer'))],
    ['Cloudflare category', display(at(value, 'signature', 'native', 'category', 'value'))],
    ['Cloudflare verified bot', display(at(value, 'signature', 'native', 'verifiedBot'))],
    ['Cloudflare signed agent', display(at(value, 'signature', 'native', 'signedAgent'))],
  ]));
  const limits = at(value, 'limits');
  if (Array.isArray(limits)) { const list = node('ul', undefined, 'ai-check-limits'); for (const limit of limits) if (typeof limit === 'string') list.append(node('li', limit)); section.append(list); }
  section.append(rawEvidence(value, 'Complete request evidence, signature coverage and method versions'));
  return section;
}
function quotaLabel(value: unknown): string | null {
  if (!object(value) || typeof value['limit'] !== 'number' || typeof value['remaining'] !== 'number' || typeof value['resetAt'] !== 'string') return null;
  return `${value['remaining']} of ${value['limit']} checks remaining. Resets ${value['resetAt']}.`;
}
function errorMessage(value: unknown): string {
  if (object(value) && typeof value['error'] === 'string' && value['error'].length <= 1000) return value['error'];
  if (object(value) && object(value['error']) && typeof value['error']['message'] === 'string' && value['error']['message'].length <= 1000) return value['error']['message'];
  return 'The check could not finish. Please try again.';
}

export class SiteAuditCheck extends HTMLElement {
  private abort: AbortController | null = null;
  private downloadUrl: string | null = null;
  private readonly onSubmit = (event: SubmitEvent): void => { event.preventDefault(); void this.check(); };
  connectedCallback(): void { this.addEventListener('submit', this.onSubmit); }
  disconnectedCallback(): void { this.removeEventListener('submit', this.onSubmit); this.abort?.abort(); this.clearDownload(); }
  private clearDownload(): void { if (this.downloadUrl !== null) URL.revokeObjectURL(this.downloadUrl); this.downloadUrl = null; }
  private async check(): Promise<void> {
    const form = this.querySelector('form'), input = this.querySelector('input'), button = this.querySelector('button'), status = this.querySelector('[data-audit-status]'), results = this.querySelector('[data-audit-results]');
    if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    if (!form.reportValidity()) return;
    this.abort?.abort(); this.abort = new AbortController(); this.clearDownload();
    document.getElementById('ai-check-server-result')?.replaceChildren();
    button.disabled = true; status.dataset['state'] = 'loading'; status.textContent = 'Checking the page and public discovery files…'; results.replaceChildren(); results.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/ai-check', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ url: input.value.trim() }), signal: this.abort.signal, redirect: 'error' });
      const value: unknown = await response.json();
      if (!response.ok) { status.dataset['state'] = 'error'; status.textContent = `${errorMessage(value)} ${object(value) ? quotaLabel(value['quota']) ?? '' : ''}`.trim(); return; }
      if (!object(value) || !isSiteAuditReport(value['report'])) throw new Error('The service returned an incomplete report.');
      results.replaceChildren(renderSiteAudit(value['report']));
      this.downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
      const download = node('a', 'Download JSON report', 'ai-check-download'); download.href = this.downloadUrl; download.download = 'ai-access-report.json'; results.append(download);
      status.dataset['state'] = 'ready'; status.textContent = `${value['report'].complete ? 'Report ready.' : 'Partial report ready; unavailable evidence is labeled below.'} ${quotaLabel(value['quota']) ?? ''}`.trim();
    } catch (error: unknown) {
      if (this.abort.signal.aborted) return;
      status.dataset['state'] = 'error'; status.textContent = error instanceof Error && error.message === 'The service returned an incomplete report.' ? error.message : 'The response could not be read. If the connection was lost after submission, that check may have used one of today’s allowance.';
    } finally { button.disabled = false; results.setAttribute('aria-busy', 'false'); }
  }
}

export class RequestEvidenceCheck extends HTMLElement {
  private readonly onClick = (): void => { void this.inspect(); };
  connectedCallback(): void { const button = this.querySelector('[data-request-check]'); if (button instanceof HTMLButtonElement) { button.hidden = false; button.addEventListener('click', this.onClick); } }
  disconnectedCallback(): void { this.querySelector('[data-request-check]')?.removeEventListener('click', this.onClick); }
  private async inspect(): Promise<void> {
    const button = this.querySelector('[data-request-check]'), status = this.querySelector('[data-request-status]'), results = this.querySelector('[data-request-results]');
    if (!(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    button.disabled = true; status.textContent = 'Inspecting this fetch request…';
    try {
      const response = await fetch('/api/request-check', { headers: { Accept: 'application/json' }, redirect: 'error' });
      const value: unknown = await response.json();
      if (!response.ok) { status.textContent = errorMessage(value); return; }
      if (!object(value) || !object(value['request'])) throw new Error('Request evidence unavailable');
      results.replaceChildren(renderRequestEvidence(value['request']));
      status.textContent = `Request evidence ready. ${quotaLabel(value['quota']) ?? ''}`.trim();
    } catch { status.textContent = 'This request could not be inspected. Try the JSON link below.'; }
    finally { button.disabled = false; }
  }
}

if (!customElements.get('site-audit-check')) customElements.define('site-audit-check', SiteAuditCheck);
if (!customElements.get('request-evidence-check')) customElements.define('request-evidence-check', RequestEvidenceCheck);

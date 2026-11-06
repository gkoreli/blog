export function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className !== undefined) result.className = className;
  return result;
}
export function definition(values: Array<[string, string]>): HTMLDListElement {
  const result = node('dl');
  for (const [label, value] of values) result.append(node('dt', label), node('dd', value));
  return result;
}
export function makeTable(caption: string, labels: string[]): { wrapper: HTMLElement; body: HTMLTableSectionElement } {
  const wrapper = node('div', undefined, 'ai-check-table-wrap'); wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', `${caption}; scroll horizontally if needed`);
  const table = node('table'); table.append(node('caption', caption));
  const head = table.createTHead().insertRow();
  for (const label of labels) { const th = node('th', label); th.scope = 'col'; head.append(th); }
  const body = table.createTBody(); wrapper.append(table); return { wrapper, body };
}
export function safeLink(text: string, href: string): HTMLElement {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.username || url.password) return node('span', text);
    const link = node('a', text); link.href = url.href; link.rel = 'noopener'; link.target = '_blank'; return link;
  } catch { return node('span', text); }
}
export function rawEvidence(value: unknown, label = 'Complete JSON evidence'): HTMLDetailsElement {
  const details = node('details'), pre = node('pre'), code = node('code', JSON.stringify(value, null, 2));
  details.append(node('summary', label)); pre.append(code); details.append(pre); return details;
}
export function disclosure(title: string): { details: HTMLDetailsElement; body: HTMLElement } {
  const details = node('details', undefined, 'access-evidence'), body = node('div', undefined, 'access-evidence-body');
  details.append(node('summary', title), body); return { details, body };
}
export const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

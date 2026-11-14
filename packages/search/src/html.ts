/** Build-time adapter. The search domain has no DOM, file-system or parser dependency. */
import { createHash } from 'node:crypto';
import { parseFragment, serialize, defaultTreeAdapter, html, type DefaultTreeAdapterMap } from 'parse5';
import { documentUrl, validateDocument, type ArticleDocument, type SourcePassage } from './documents.js';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];
type TextNode = DefaultTreeAdapterMap['textNode'];
const ignored = new Set(['script', 'style', 'svg', 'canvas', 'nav', 'noscript', 'button', 'input', 'select', 'textarea']);
const semantic = new Set(['p', 'pre', 'table', 'li', 'blockquote', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const containers = new Set(['div', 'section', 'article', 'header', 'footer', 'aside', 'body', 'figure']);
const normalize = (text: string): string => text.replace(/\s+/gu, ' ').trim();
const characterCount = (text: string): number => text.replace(/\s/gu, '').length;
const digest = (text: string): string => createHash('sha256').update(text).digest('hex').slice(0, 16);
const attr = (element: Element, name: string): string | undefined => element.attrs.find(item => item.name === name)?.value;

export interface HtmlArticleInput extends Omit<ArticleDocument, 'passages'> {
  /** Already rendered article body; pass neither a page shell nor unpublished source notes. */
  readonly html: string;
  /** Publication policy, applied only to indexing. Source HTML stays readable. */
  readonly omitTags?: readonly string[];
}

export interface PreparedArticle {
  readonly article: ArticleDocument;
  readonly html: string;
  readonly coverage: { readonly indexedCharacters: number; readonly ignoredCharacters: number; readonly headings: number };
}

export function prepareArticle(input: HtmlArticleInput): PreparedArticle {
  const fragment = parseFragment(input.html);
  const root = defaultTreeAdapter.createElement('div', html.NS.HTML, []);
  for (const child of [...fragment.childNodes]) { defaultTreeAdapter.detachNode(child); defaultTreeAdapter.appendChild(root, child); }
  const idCounts = new Map<string, number>();
  const groups: { owner: Element; first: TextNode; parent: Element; text: string }[] = [];
  let ignoredCharacters = 0;
  function inspectIds(node: Node): void {
    if ('tagName' in node) {
      const id = attr(node, 'id'); if (id) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }
    if ('childNodes' in node) for (const child of node.childNodes) inspectIds(child);
  }
  inspectIds(root);
  function walk(node: Node, parents: readonly Element[], omit: boolean): void {
    if ('tagName' in node) {
      const nextOmit = omit || ignored.has(node.tagName) || input.omitTags?.includes(node.tagName) === true || node.attrs.some(item => item.name === 'hidden' || item.name === 'data-search-ignore' || item.name === 'aria-hidden' && item.value === 'true');
      for (const child of node.childNodes) walk(child, [...parents, node], nextOmit);
      return;
    }
    if ('childNodes' in node) { for (const child of node.childNodes) walk(child, parents, omit); return; }
    if (!('value' in node)) return;
    if (omit) { ignoredCharacters += characterCount(node.value); return; }
    const parent = parents.at(-1);
    if (!parent) return;
    const ancestors = [...parents].reverse();
    const owner = ancestors.find(item => semantic.has(item.tagName)) ?? ancestors.find(item => containers.has(item.tagName)) ?? parent;
    const last = groups.at(-1);
    if (last?.owner === owner) {
      const boundary = owner.tagName === 'table' && last.parent !== parent ? ' ' : '';
      last.text += boundary + node.value; last.parent = parent;
    } else groups.push({ owner, first: node, parent, text: node.value });
  }
  walk(root, [], false);
  const useful = groups.filter(group => normalize(group.text));
  const ownerCounts = new Map<Element, number>();
  for (const group of useful) ownerCounts.set(group.owner, (ownerCounts.get(group.owner) ?? 0) + 1);
  const usedIds = new Set(idCounts.keys());
  const headings: string[] = []; const passages: SourcePassage[] = [];
  let headingCount = 0; let indexedCharacters = 0;
  for (const group of useful) {
    const tag = group.owner.tagName;
    const text = tag === 'pre' ? group.text.trim() : normalize(group.text);
    if (/^h[1-6]$/u.test(tag)) {
      const level = Number(tag[1]); headings.length = level; headings[level - 1] = normalize(text); headingCount++; continue;
    }
    const base = 'passage-' + digest(normalize(text));
    let anchor = base; let suffix = 1;
    while (usedIds.has(anchor)) anchor = base + '-' + ++suffix;
    const existing = attr(group.owner, 'id');
    const parent = group.first.parentNode;
    const position = parent?.childNodes.indexOf(group.first) ?? -1;
    const previous = position > 0 ? parent?.childNodes[position - 1] : undefined;
    const markerId = previous && 'tagName' in previous && previous.tagName === 'span' && attr(previous, 'class') === 'search-anchor' ? attr(previous, 'id') : undefined;
    const wholeBlock = ownerCounts.get(group.owner) === 1 && semantic.has(tag);
    if (markerId && idCounts.get(markerId) === 1) anchor = markerId;
    else if (wholeBlock && existing && idCounts.get(existing) === 1) anchor = existing;
    else if (wholeBlock && !existing) group.owner.attrs.push({ name: 'id', value: anchor });
    else {
      const marker = defaultTreeAdapter.createElement('span', html.NS.HTML, [{ name: 'id', value: anchor }, { name: 'class', value: 'search-anchor' }, { name: 'aria-hidden', value: 'true' }]);
      if (!parent) throw new Error('Detached source text');
      defaultTreeAdapter.insertBefore(parent, marker, group.first);
    }
    usedIds.add(anchor); indexedCharacters += characterCount(text);
    const kind = tag === 'p' ? 'paragraph' : tag === 'pre' ? 'code' : tag === 'table' ? 'table' : tag === 'li' ? 'list' : 'text';
    passages.push({ id: input.id + '/' + anchor, anchor, kind, text, headings: headings.filter(Boolean) });
  }
  const article: ArticleDocument = { id: input.id, url: documentUrl(input.url), title: input.title, passages,
    ...(input.section === undefined ? {} : { section: input.section }), ...(input.tags === undefined ? {} : { tags: [...input.tags] }), ...(input.date === undefined ? {} : { date: input.date }) };
  validateDocument(article);
  return { article, html: serialize(root), coverage: { indexedCharacters, ignoredCharacters, headings: headingCount } };
}

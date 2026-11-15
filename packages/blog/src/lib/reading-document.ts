import { parse, parseFragment, serialize, serializeOuter, defaultTreeAdapter, type DefaultTreeAdapterMap } from 'parse5';
import { readingContentsHtml, tableRegionHtml, type ReadingSection } from './reading-display.js';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];
type ChildNode = DefaultTreeAdapterMap['childNode'];

function attribute(element: Element, name: string): string | undefined {
  return element.attrs.find(item => item.name === name)?.value;
}

function text(node: Node): string {
  if ('value' in node) return node.value;
  if ('childNodes' in node) return node.childNodes.map(text).join('');
  return '';
}

function insertAfter(element: Element, sibling: ChildNode): void {
  const parent = element.parentNode;
  if (!parent) throw new Error('Detached article heading');
  const following = parent.childNodes[parent.childNodes.indexOf(element) + 1];
  if (following) defaultTreeAdapter.insertBefore(parent, sibling, following);
  else defaultTreeAdapter.appendChild(parent, sibling);
}

function elementsOf(root: Node, removeGeneratedContents = false): Element[] {
  const elements: Element[] = [];
  function collect(node: Node): void {
    if ('tagName' in node) {
      if (removeGeneratedContents && attribute(node, 'data-reading-outline') === 'inline') {
        defaultTreeAdapter.detachNode(node);
        return;
      }
      elements.push(node);
    }
    if ('childNodes' in node) for (const child of [...node.childNodes]) collect(child);
  }
  collect(root);
  return elements;
}

function uniqueIds(elements: readonly Element[]): Set<string> {
  const ids = new Set<string>();
  for (const element of elements) {
    const id = attribute(element, 'id');
    if (!id) continue;
    if (ids.has(id)) throw new Error(`Repeated element ID: ${id}`);
    ids.add(id);
  }
  return ids;
}

/** Check the final shell as well as its independently prepared article body. */
export function assertUniqueElementIds(source: string): void {
  uniqueIds(elementsOf(parse(source)));
}

/** Publication structure is prepared before search indexing. Existing links,
 * text, tables and IDs remain intact; added navigation is excluded from search. */
export function prepareReadingDocument(source: string): { html: string; outline: readonly ReadingSection[] } {
  const fragment = parseFragment(source);
  const elements = elementsOf(fragment, true), ids = uniqueIds(elements);
  const outline: ReadingSection[] = [];
  let sectionTitle = 'Article comparison';
  let firstTitle: Element | undefined;
  const tableLabels = new Map<Element, string>();
  for (const element of elements) {
    if (element.tagName === 'h1' && !firstTitle) firstTitle = element;
    if (element.tagName === 'h2' || element.tagName === 'h3') {
      const title = text(element).replace(/\s+/gu, ' ').trim();
      if (!title) continue;
      const base = title.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/gu, '') || 'section';
      let id = attribute(element, 'id');
      if (!id) {
        id = base;
        let suffix = 1;
        while (ids.has(id)) id = `${base}-${++suffix}`;
        const existing = element.attrs.find(item => item.name === 'id');
        if (existing) existing.value = id;
        else element.attrs.push({ name: 'id', value: id });
        ids.add(id);
      }
      outline.push({ id, title, level: element.tagName === 'h2' ? 2 : 3 });
      sectionTitle = title;
    }
    if (element.tagName === 'table') tableLabels.set(element, sectionTitle);
  }
  // Assign every heading before serializing tables, including cell headings.
  // Inner tables are prepared first so their content is preserved as well.
  for (const element of [...elements].reverse()) {
    if (element.tagName !== 'table') continue;
    const parent = element.parentNode;
    if (!parent || 'tagName' in parent && attribute(parent, 'class')?.split(/\s+/u).includes('reading-table-scroll')) continue;
    const cells: Element[][] = [];
    function rows(node: Node): void {
      if ('tagName' in node && node.tagName === 'tr') {
        cells.push(node.childNodes.filter((child): child is Element => 'tagName' in child && (child.tagName === 'td' || child.tagName === 'th')));
      } else if ('childNodes' in node) for (const child of node.childNodes) rows(child);
    }
    rows(element);
    const rectangular = cells.length > 0 && cells.every(row => row.length === cells[0]?.length && row.every(cell => !attribute(cell, 'colspan') && !attribute(cell, 'rowspan')));
    const caption = element.childNodes.find((child): child is Element => 'tagName' in child && child.tagName === 'caption');
    const label = caption ? text(caption).trim() : tableLabels.get(element) ?? 'Article comparison';
    const wrapper = parseFragment(tableRegionHtml(label, serializeOuter(element), rectangular)).childNodes[0];
    if (!wrapper) throw new Error('Missing table composition');
    defaultTreeAdapter.insertBefore(parent, wrapper, element);
    defaultTreeAdapter.detachNode(element);
    // Custom comparison wrappers relinquish scrolling to the shared frame.
    if ('tagName' in parent) {
      const classes = attribute(parent, 'class')?.split(/\s+/u) ?? [];
      if (classes.includes('compare-table-scroll')) {
        const entry = parent.attrs.find(item => item.name === 'class');
        if (entry) entry.value = classes.filter(value => value !== 'compare-table-scroll').join(' ');
      }
    }
  }
  const contents = parseFragment(readingContentsHtml(outline, 'inline')).childNodes[0];
  if (contents) {
    if (firstTitle) insertAfter(firstTitle, contents);
    else {
      const first = fragment.childNodes[0];
      if (first) defaultTreeAdapter.insertBefore(fragment, contents, first);
      else defaultTreeAdapter.appendChild(fragment, contents);
    }
  }
  return { html: serialize(fragment), outline };
}

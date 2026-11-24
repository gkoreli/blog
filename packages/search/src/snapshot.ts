import MiniSearch, { type Options } from 'minisearch';
import { validateDocument, type ArticleDocument, type SourcePassage } from './documents.js';
import type { EmbeddingEncoder, SearchBundle } from './contracts.js';
import { tokenize, normalizeWord } from './query.js';
import { compileNumberedCollections, type NumberedCollection } from './numbered-collections.js';

export interface SearchUnit {
  readonly id: string;
  readonly articleId: string;
  readonly title: string;
  readonly heading: string;
  readonly text: string;
  readonly passageIds: readonly string[];
}

export interface SemanticData {
  readonly space: string;
  readonly dimensions: number;
  readonly units: readonly string[];
  readonly sha256: string;
}

export interface Snapshot {
  readonly format: 2;
  readonly id: string;
  readonly articles: readonly ArticleDocument[];
  readonly candidates: readonly SearchUnit[];
  readonly excerpts: readonly SearchUnit[];
  readonly candidateIndex: string;
  readonly excerptIndex: string;
  readonly numberedCollections: readonly NumberedCollection[];
  readonly semantic?: SemanticData;
}

export const lexicalOptions: Options<SearchUnit> = {
  fields: ['title', 'heading', 'text'], idField: 'id', storeFields: [], tokenize,
  processTerm: normalizeWord,
  searchOptions: { boost: { title: 3, heading: 2, text: 1 }, combineWith: 'OR' },
};

export async function digest(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function passageUnit(article: ArticleDocument, passage: SourcePassage): SearchUnit {
  return { id: 'p:' + encodeURIComponent(article.id) + ':' + encodeURIComponent(passage.id), articleId: article.id, title: article.title,
    heading: passage.headings.filter(heading => heading !== article.title).join(' > '), text: passage.text, passageIds: [passage.id] };
}

function candidateUnits(article: ArticleDocument): SearchUnit[] {
  const groups: { heading: string; text: string; passageIds: string[] }[] = [];
  for (const passage of article.passages) {
    const heading = passage.headings.filter(item => item !== article.title).join(' > ');
    const last = groups.at(-1);
    if (last && last.heading === heading && last.text.length + passage.text.length < 1500) { last.text += '\n\n' + passage.text; last.passageIds.push(passage.id); }
    else groups.push({ heading, text: passage.text, passageIds: [passage.id] });
  }
  if (!groups.length) groups.push({ heading: '', text: '', passageIds: [] });
  return groups.map((group, i) => ({ id: 'c:' + encodeURIComponent(article.id) + ':' + i, articleId: article.id, title: article.title, ...group }));
}

export function contextualText(unit: SearchUnit): string {
  return [unit.title, unit.heading].filter(Boolean).join('\n') + '\n\n' + unit.text;
}

export function normalizedVector(values: Float32Array, dimensions: number): Float32Array {
  if (values.length !== dimensions || dimensions < 1 || dimensions > 4096) throw new Error('Embedding dimensions do not match the index.');
  let squared = 0;
  for (const value of values) { if (!Number.isFinite(value)) throw new Error('Embedding contains a non-finite coordinate.'); squared += value * value; }
  if (squared <= 0) throw new Error('Embedding has zero length.');
  const norm = Math.sqrt(squared);
  return Float32Array.from(values, value => value / norm);
}

/** Build once; the query runtime receives text/index bytes and optional separate float32 data. */
export async function buildSearchIndex(documents: readonly ArticleDocument[], options: { readonly encoder?: EmbeddingEncoder; readonly signal?: AbortSignal; readonly numberedCollections?: readonly NumberedCollection[] } = {}): Promise<SearchBundle> {
  const articles = documents.map(article => ({ ...article, ...(article.tags ? { tags: [...article.tags] } : {}), passages: article.passages.map(p => ({ ...p, headings: [...p.headings] })) })).sort((a, b) => a.id.localeCompare(b.id));
  const seen = new Set<string>();
  for (const article of articles) { validateDocument(article); if (seen.has(article.id)) throw new Error('Duplicate article identity.'); seen.add(article.id); }
  const numberedCollections = (options.numberedCollections ?? []).map(({ title, aliases, issues }) => ({
    title, ...(aliases ? { aliases: [...aliases] } : {}),
    issues: issues.map(({ number, articleId }) => ({ number, articleId })).sort((a, b) => a.number - b.number),
  }));
  compileNumberedCollections(numberedCollections, seen);
  const candidates = articles.flatMap(candidateUnits), excerpts = articles.flatMap(article => article.passages.map(passage => passageUnit(article, passage)));
  const candidateIndex = new MiniSearch<SearchUnit>(lexicalOptions), excerptIndex = new MiniSearch<SearchUnit>(lexicalOptions);
  candidateIndex.addAll(candidates); excerptIndex.addAll(excerpts);
  // Units are deterministic projections of articles; do not ship their source text twice more.
  const base = { format: 2 as const, articles, candidateIndex: JSON.stringify(candidateIndex.toJSON()), excerptIndex: JSON.stringify(excerptIndex.toJSON()) };
  let semantic: SemanticData | undefined; let vectors: Uint8Array | undefined;
  if (options.encoder) {
    const encoder = options.encoder; if (!encoder.space.trim()) throw new Error('An embedding space identity is required.');
    const ids: string[] = []; const rows: Float32Array[] = [];
    for (const unit of [...candidates, ...excerpts]) {
      options.signal?.throwIfAborted();
      const encoded = await encoder.encode(contextualText(unit), 'document', options.signal);
      if (!encoded.length) throw new Error('The encoder omitted an indexed unit.');
      for (const values of encoded) { rows.push(normalizedVector(values, encoder.dimensions)); ids.push(unit.id); }
    }
    vectors = new Uint8Array(rows.length * encoder.dimensions * 4); const view = new DataView(vectors.buffer);
    let position = 0; for (const row of rows) for (const value of row) { view.setFloat32(position, value, true); position += 4; }
    semantic = { space: encoder.space, dimensions: encoder.dimensions, units: ids, sha256: await digest(vectors) };
  }
  const positions = new Map([...candidates, ...excerpts].map((unit, index) => [unit.id, index]));
  const payload = { ...base, ...(numberedCollections.length ? { numberedCollections } : {}), ...(semantic ? { semantic: { space: semantic.space, dimensions: semantic.dimensions, sha256: semantic.sha256, rows: semantic.units.map(id => { const position = positions.get(id); if (position === undefined) throw new Error('Unknown encoded unit.'); return position; }) } } : {}) };
  const id = await digest(new TextEncoder().encode(JSON.stringify(payload)));
  return { index: JSON.stringify({ ...payload, id }), ...(vectors ? { vectors } : {}) };
}

function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function strings(value: unknown): value is string[] { return Array.isArray(value) && value.every(item => typeof item === 'string'); }
function string(value: unknown): string { if (typeof value !== 'string') throw new Error('Invalid search index text.'); return value; }

function readPassage(value: unknown): SourcePassage {
  if (!record(value) || !strings(value['headings'])) throw new Error('Invalid search passage.');
  const kind = value['kind']; if (kind !== 'paragraph' && kind !== 'list' && kind !== 'code' && kind !== 'table' && kind !== 'text') throw new Error('Invalid passage kind.');
  return { id: string(value['id']), anchor: string(value['anchor']), text: string(value['text']), headings: value['headings'], kind };
}

function readArticle(value: unknown): ArticleDocument {
  if (!record(value) || !Array.isArray(value['passages'])) throw new Error('Invalid search article.');
  const section = value['section'], date = value['date'], tags = value['tags'];
  if (section !== undefined && typeof section !== 'string' || date !== undefined && typeof date !== 'string' || tags !== undefined && !strings(tags)) throw new Error('Invalid article metadata.');
  const article: ArticleDocument = { id: string(value['id']), url: string(value['url']), title: string(value['title']), passages: value['passages'].map(readPassage), ...(section === undefined ? {} : { section }), ...(date === undefined ? {} : { date }), ...(tags === undefined ? {} : { tags }) };
  validateDocument(article); return article;
}

function readNumberedCollections(value: unknown): NumberedCollection[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Invalid numbered collections.');
  return value.map((item: unknown) => {
    if (!record(item) || !Array.isArray(item['issues'])) throw new Error('Invalid numbered collection.');
    const aliases = item['aliases'];
    if (aliases !== undefined && !strings(aliases)) throw new Error('Invalid numbered collection aliases.');
    const issues = item['issues'].map((issue: unknown) => {
      if (!record(issue) || typeof issue['number'] !== 'number') throw new Error('Invalid issue in a numbered collection.');
      return { number: issue['number'], articleId: string(issue['articleId']) };
    });
    return { title: string(item['title']), ...(aliases ? { aliases } : {}), issues };
  });
}

export async function readSnapshot(serialized: string): Promise<Snapshot> {
  const value: unknown = JSON.parse(serialized);
  if (!record(value) || value['format'] !== 2 || !Array.isArray(value['articles'])) throw new Error('Unsupported search index.');
  const { id, ...payload } = value;
  if (typeof id !== 'string' || !/^[a-f0-9]{64}$/u.test(id) || await digest(new TextEncoder().encode(JSON.stringify(payload))) !== id) throw new Error('Search index integrity check failed.');
  const articles = value['articles'].map(readArticle), candidates = articles.flatMap(candidateUnits), excerpts = articles.flatMap(article => article.passages.map(passage => passageUnit(article, passage)));
  const articleMap = new Map(articles.map(article => [article.id, article])); if (articleMap.size !== articles.length) throw new Error('Duplicate indexed article.');
  const units = new Set<string>();
  for (const unit of [...candidates, ...excerpts]) {
    const article = articleMap.get(unit.articleId);
    if (!article || units.has(unit.id) || unit.passageIds.some(id => !article.passages.some(p => p.id === id))) throw new Error('Search unit refers to unknown source.');
    units.add(unit.id);
  }
  let semantic: SemanticData | undefined;
  if (value['semantic'] !== undefined) {
    const data = value['semantic'];
    if (!record(data) || typeof data['space'] !== 'string' || !data['space'] || typeof data['dimensions'] !== 'number' || !Number.isInteger(data['dimensions']) || data['dimensions'] < 1 || data['dimensions'] > 4096 || !Array.isArray(data['rows']) || typeof data['sha256'] !== 'string' || !/^[a-f0-9]{64}$/u.test(data['sha256'])) throw new Error('Invalid semantic index.');
    const ordered = [...candidates, ...excerpts];
    const rows = data['rows'].map((position: unknown) => { if (typeof position !== 'number' || !Number.isInteger(position) || position < 0) throw new Error('Invalid semantic row.'); const unit = ordered[position]; if (!unit) throw new Error('Unknown semantic unit.'); return unit.id; });
    semantic = { space: data['space'], dimensions: data['dimensions'], units: rows, sha256: data['sha256'] };
    if (new Set(semantic.units).size !== units.size) throw new Error('Semantic data omits indexed source units.');
  }
  return { format: 2, id: string(value['id']), articles, candidates, excerpts, candidateIndex: string(value['candidateIndex']), excerptIndex: string(value['excerptIndex']), numberedCollections: readNumberedCollections(value['numberedCollections']), ...(semantic ? { semantic } : {}) };
}

import MiniSearch from 'minisearch';
import { documentUrl, type ArticleDocument } from './documents.js';
import type { ArticleMatch, EmbeddingEncoder, PassageMatch, SearchEngine, SearchOptions, SearchResponse, TextRange } from './contracts.js';
import { digest, lexicalOptions, normalizedVector, readSnapshot, type SearchUnit } from './snapshot.js';
import { normalizeWord, parseQuery, tokenize } from './query.js';
import { articleRanks, fuse, lexicalRows, policy, type RankedUnit } from './ranking.js';
import { compileNumberedCollections, type NumberedReference } from './numbered-collections.js';

function preview(text: string, terms: readonly string[]): PassageMatch['preview'] {
  const wanted = new Set(terms); const ranges: TextRange[] = [];
  for (const match of text.matchAll(/[\p{L}\p{N}][\p{L}\p{N}_+#.-]*/gu)) {
    if (match.index !== undefined && wanted.has(normalizeWord(match[0].replace(/[.-]+$/gu, '')))) ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  let start = 0;
  if (text.length > 420 && ranges.length) {
    let best = -1;
    for (const range of ranges) {
      const candidate = Math.max(0, range.start - 70);
      const count = ranges.filter(other => other.start >= candidate && other.end <= candidate + 420).length;
      if (count > best) { start = candidate; best = count; }
    }
    const boundary = text.lastIndexOf(' ', start); if (boundary >= start - 40) start = Math.max(0, boundary + 1);
  }
  let end = Math.min(text.length, start + 420);
  if (end < text.length) { const boundary = text.lastIndexOf(' ', end); if (boundary > end - 40) end = boundary; }
  return { text: text.slice(start, end), start, end, matches: ranges.filter(range => range.start >= start && range.end <= end).map(range => ({ start: range.start - start, end: range.end - start })) };
}

function boundedCount(value: number | undefined, fallback: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1 || value > maximum) throw new Error('Invalid search result limit.');
  return value;
}

/** One corpus, two reader intents. Model inference and byte loading are explicit ports. */
export async function createSearch(serialized: string, adapters: { readonly encoder?: EmbeddingEncoder; readonly loadEncoder?: () => Promise<EmbeddingEncoder>; readonly loadVectors?: (signal?: AbortSignal) => Promise<Uint8Array> } = {}): Promise<SearchEngine> {
  const snapshot = await readSnapshot(serialized);
  // TypeScript readonly alone cannot protect source identity from JavaScript callers.
  for (const article of snapshot.articles) {
    for (const passage of article.passages) { Object.freeze(passage.headings); Object.freeze(passage); }
    Object.freeze(article.passages); if (article.tags) Object.freeze(article.tags); Object.freeze(article);
  }
  const articles = new Map(snapshot.articles.map(article => [article.id, article]));
  const resolveReference = compileNumberedCollections(snapshot.numberedCollections, new Set(articles.keys()));
  const candidateUnits = new Map(snapshot.candidates.map(unit => [unit.id, unit]));
  const excerptUnits = new Map(snapshot.excerpts.map(unit => [unit.id, unit]));
  const candidateIndex = MiniSearch.loadJSON<SearchUnit>(snapshot.candidateIndex, lexicalOptions);
  const excerptIndex = MiniSearch.loadJSON<SearchUnit>(snapshot.excerptIndex, lexicalOptions);
  const vocabulary = new Set(snapshot.excerpts.flatMap(unit => tokenize(unit.title + '\n' + unit.heading + '\n' + unit.text)));
  let vectorPromise: Promise<Float32Array> | undefined;
  let encoderPromise: Promise<EmbeddingEncoder> | undefined;
  async function encoder(): Promise<EmbeddingEncoder> {
    if (adapters.encoder) return adapters.encoder;
    if (!adapters.loadEncoder) throw new Error('Related search requires the same embedding space used to build this index.');
    encoderPromise ??= adapters.loadEncoder().catch(error => { encoderPromise = undefined; throw error; });
    return encoderPromise;
  }

  async function vectors(signal?: AbortSignal): Promise<Float32Array> {
    if (vectorPromise) return vectorPromise;
    const metadata = snapshot.semantic; const load = adapters.loadVectors;
    if (!metadata || !load) throw new Error('This index has no related-search vectors.');
    vectorPromise = (async () => {
      const bytes = await load(signal); signal?.throwIfAborted();
      if (bytes.byteLength !== metadata.units.length * metadata.dimensions * 4 || await digest(bytes) !== metadata.sha256) throw new Error('Search vectors do not belong to this index.');
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), result = new Float32Array(bytes.byteLength / 4);
      for (let i = 0; i < result.length; i++) { const value = view.getFloat32(i * 4, true); if (!Number.isFinite(value)) throw new Error('Invalid indexed embedding.'); result[i] = value; }
      for (let offset = 0; offset < result.length; offset += metadata.dimensions) {
        let squared = 0; for (let i = 0; i < metadata.dimensions; i++) { const value = result[offset + i]; if (value === undefined) throw new Error('Incomplete indexed embedding.'); squared += value * value; }
        if (Math.abs(Math.sqrt(squared) - 1) > 0.001) throw new Error('Indexed embeddings must be normalized.');
      }
      return result;
    })().catch(error => { vectorPromise = undefined; throw error; });
    return vectorPromise;
  }

  function articleInScope(article: ArticleDocument, options: SearchOptions): boolean {
    return (options.article === undefined || article.id === options.article)
      && (options.section === undefined || article.section === options.section);
  }

  function inScope(unit: SearchUnit, options: SearchOptions, phrases: readonly string[]): boolean {
    const article = articles.get(unit.articleId);
    if (!article || !articleInScope(article, options)) return false;
    const source = normalizeWord(unit.title + ' ' + unit.heading + ' ' + unit.text).replace(/\s+/gu, ' ');
    return phrases.every(phrase => source.includes(phrase));
  }

  function scoped(rows: readonly RankedUnit[], units: ReadonlyMap<string, SearchUnit>, options: SearchOptions, phrases: readonly string[]): RankedUnit[] {
    return rows.filter(row => { const unit = units.get(row.id); if (!unit) throw new Error('A search rank refers to an unknown unit.'); return inScope(unit, options, phrases); });
  }

  function matches(article: ArticleDocument, rows: readonly RankedUnit[], terms: readonly string[], count: number): { passages: PassageMatch[]; totalPassages: number } {
    const selected = new Set<string>(); const result: PassageMatch[] = [];
    for (const row of rows) {
      const unit = excerptUnits.get(row.id); if (!unit || unit.articleId !== article.id) continue;
      const passageId = unit.passageIds[0]; if (!passageId || selected.has(passageId)) continue;
      const position = article.passages.findIndex(p => p.id === passageId), passage = article.passages[position]; if (!passage) throw new Error('Missing source passage.');
      selected.add(passageId);
      if (result.length >= count) continue;
      result.push({ id: unit.id, passage, url: documentUrl(article.url) + '#' + encodeURIComponent(passage.anchor), preview: preview(passage.text, terms), context: article.passages.slice(Math.max(0, position - 1), position + 2) });
    }
    return { passages: result, totalPassages: selected.size };
  }

  function articleMatch(article: ArticleDocument, rows: readonly RankedUnit[], terms: readonly string[], count: number): ArticleMatch {
    const { passages, ...meta } = article;
    return { article: meta, ...matches(article, rows, terms, count) };
  }

  return {
    id: snapshot.id, articleCount: articles.size, passageCount: snapshot.excerpts.length,
    sections: [...new Set(snapshot.articles.flatMap(article => article.section === undefined ? [] : [article.section]))].sort(),
    relatedSpace: snapshot.semantic?.space ?? null,
    async search(value, options = {}): Promise<SearchResponse> {
      const input = parseQuery(value), mode = options.mode ?? 'words';
      if (mode !== 'words' && mode !== 'related') throw new Error('Unknown search mode.');
      const limit = boundedCount(options.limit, 5, 20), perArticle = boundedCount(options.passagesPerArticle, 3, 20);
      options.signal?.throwIfAborted();
      const locator = resolveReference(input.text);
      const target = locator?.articleId === undefined ? undefined : articles.get(locator.articleId);
      const query = locator ? parseQuery(locator.detail) : input;
      const reference: NumberedReference | undefined = locator && {
        title: locator.title,
        number: locator.number,
        outcome: !target ? 'missing' : articleInScope(target, options) ? 'found' : 'outside-scope',
        passageQuery: query.terms.length > 0,
      };
      const response = (found: readonly ArticleMatch[]): SearchResponse => ({
        indexId: snapshot.id, query: input.text, mode, articles: found,
        missingWords: reference && reference.outcome !== 'found' ? [] : [...new Set(query.terms.filter(term => !vocabulary.has(term)))],
        ...(reference ? { reference } : {}),
      });
      if (reference && reference.outcome !== 'found') return response([]);
      const scope = target ? { ...options, article: target.id } : options;
      if (!query.terms.length) return response(target ? [articleMatch(target, [], [], perArticle)] : []);

      let candidateRows = target ? [] : lexicalRows(candidateIndex, query.lexical, mode === 'words');
      let excerptRows = lexicalRows(excerptIndex, query.lexical, mode === 'words', true);
      if (target) excerptRows = scoped(excerptRows, excerptUnits, scope, query.phrases);
      let fusedArticles: RankedUnit[] | undefined;
      if (mode === 'related') {
        const metadata = snapshot.semantic, model = await encoder();
        if (!metadata || model.space !== metadata.space || model.dimensions !== metadata.dimensions) throw new Error('Related search requires the same embedding space used to build this index.');
        const [data, encoded] = await Promise.all([vectors(options.signal), model.encode(query.text, 'query', options.signal)]);
        options.signal?.throwIfAborted(); if (encoded.length !== 1 || !encoded[0]) throw new Error('A query must produce one embedding.');
        const vector = normalizedVector(encoded[0], metadata.dimensions), scores = new Map<string, number>();
        for (const [row, id] of metadata.units.entries()) {
          if (target && excerptUnits.get(id)?.articleId !== target.id) continue;
          let score = 0;
          for (let i = 0; i < metadata.dimensions; i++) { const left = vector[i], right = data[row * metadata.dimensions + i]; if (left === undefined || right === undefined) throw new Error('Incomplete search vector.'); score += left * right; }
          scores.set(id, Math.max(scores.get(id) ?? -Infinity, score));
        }
        const dense = [...scores].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
        const denseCandidates = dense.filter(row => candidateUnits.has(row.id));
        if (!target && policy.articleFusion) fusedArticles = fuse(articleRanks(scoped(denseCandidates, candidateUnits, scope, query.phrases), candidateUnits), articleRanks(scoped(candidateRows, candidateUnits, scope, query.phrases), candidateUnits));
        candidateRows = fuse(denseCandidates, candidateRows);
        excerptRows = fuse(dense.filter(row => excerptUnits.has(row.id)), excerptRows);
      }
      excerptRows = scoped(excerptRows, excerptUnits, scope, query.phrases);
      if (target) return response([articleMatch(target, excerptRows, query.terms, perArticle)]);
      candidateRows = scoped(candidateRows, candidateUnits, scope, query.phrases);
      const selected = new Set<string>(), result: ArticleMatch[] = [];
      const ids = fusedArticles ? fusedArticles.map(row => row.id) : candidateRows.map(row => candidateUnits.get(row.id)?.articleId);
      for (const id of ids) {
        if (!id || selected.has(id)) continue;
        const article = articles.get(id); if (!article || options.section !== undefined && options.section !== article.section) continue;
        selected.add(id);
        result.push(articleMatch(article, excerptRows, query.terms, perArticle));
        if (result.length >= limit) break;
      }
      return response(result);
    },
  };
}

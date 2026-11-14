import { createSearcher } from '../passage-search/retrieval.mjs';
import { tokenizeBm25 } from '../passage-search/vendor/bm25.ts';

export function createReaderIndex(units, vectors) {
  const searcher = createSearcher(units, vectors);
  const byId = new Map(units.map(unit => [unit.id, unit]));
  const vocabulary = new Set(units.flatMap(unit => tokenizeBm25(unit.searchText)));
  function group(rows, articleLimit = 5, matchesPerArticle = 3) {
    const articles = new Map();
    for (const row of rows) {
      const unit = byId.get(row.id); if (!unit) throw new Error('Unknown result ID');
      if (!articles.has(unit.article)) {
        if (articles.size >= articleLimit) continue;
        articles.set(unit.article, { article: unit.article, title: unit.title, score: row.score, matches: [] });
      }
      const target = articles.get(unit.article);
      if (target.matches.length < matchesPerArticle && !target.matches.some(match => match.sourceBlocks[0] === unit.sourceBlocks[0])) {
        target.matches.push({ ...unit, score: row.score });
      }
    }
    return [...articles.values()];
  }
  const metadata = row => {
    const unit = byId.get(row.id);
    return { id: row.id, article: unit.article, score: row.score, heading: unit.heading, url: unit.url, sourceBlocks: unit.sourceBlocks };
  };
  return { rankings: searcher.rankings, group, metadata, missingTerms: query => [...new Set(tokenizeBm25(query).filter(term => !vocabulary.has(term)))] };
}

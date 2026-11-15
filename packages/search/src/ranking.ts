import type MiniSearch from 'minisearch';
import type { SearchUnit } from './snapshot.js';

export interface RankedUnit { readonly id: string; readonly score: number }

// Internal retrieval policy. Research variants change this constant in isolated builds;
// callers choose a reader intent rather than tuning corpus-specific ranking knobs.
export const policy = { passageBody: true, articleFusion: true, coverageRecovery: true };

export function fuse(first: readonly RankedUnit[], second: readonly RankedUnit[]): RankedUnit[] {
  const scores = new Map<string, number>();
  for (const list of [first, second]) for (const [rank, row] of list.entries()) scores.set(row.id, (scores.get(row.id) ?? 0) + 1 / (61 + rank));
  return [...scores].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
}

/** Article ranks are distinct before fusion, so repeated packed units cannot vote twice. */
export function articleRanks(rows: readonly RankedUnit[], units: ReadonlyMap<string, SearchUnit>): RankedUnit[] {
  const seen = new Set<string>(), result: RankedUnit[] = [];
  for (const row of rows) {
    const id = units.get(row.id)?.articleId;
    if (id && !seen.has(id)) { seen.add(id); result.push({ id, score: row.score }); }
  }
  return result;
}

export function lexicalRows(index: MiniSearch<SearchUnit>, text: string, recovery: boolean, passage = false): RankedUnit[] {
  const fields = passage && policy.passageBody ? ['heading', 'text'] : ['title', 'heading', 'text'];
  const exact = index.search(text, { fields });
  if (!recovery) return exact;
  const expanded = index.search(text, {
    fields, fuzzy: term => term.length >= 5 && term.length <= 40 ? 0.2 : false, maxFuzzy: 1,
    prefix: (term, position, terms) => position === terms.length - 1 && term.length >= 3 && term.length <= 64,
  });
  const found = new Map(exact.map(row => [String(row.id), { row, exact: true }]));
  for (const row of expanded) {
    const previous = found.get(String(row.id));
    if (!previous || policy.coverageRecovery && row.queryTerms.length > previous.row.queryTerms.length) found.set(String(row.id), { row, exact: false });
  }
  if (!policy.coverageRecovery) return [...found.values()].map(item => item.row);
  return [...found.values()].sort((a, b) => b.row.queryTerms.length - a.row.queryTerms.length || Number(b.exact) - Number(a.exact) || b.row.score - a.row.score).map(item => item.row);
}

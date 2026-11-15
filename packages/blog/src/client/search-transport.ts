import type { SearchResponse } from '@gkoreli/search';

export type SearchCommand = { readonly id: number; readonly query: string; readonly mode: 'words' | 'related'; readonly section: string; readonly article: string; readonly passagesPerArticle: number };
export type SearchEvent = { readonly id: number; readonly type: 'result'; readonly result: SearchResponse; readonly milliseconds: number }
  | { readonly id: number; readonly type: 'status'; readonly message: string }
  | { readonly id: number; readonly type: 'error'; readonly message: string };

export function readCommand(value: unknown): SearchCommand {
  if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'number' || !Number.isSafeInteger(value.id) || !('query' in value) || typeof value.query !== 'string' || !('mode' in value) || value.mode !== 'words' && value.mode !== 'related' || !('section' in value) || typeof value.section !== 'string' || !('article' in value) || typeof value.article !== 'string') throw new Error('Invalid search command.');
  const passages = 'passagesPerArticle' in value ? value.passagesPerArticle : 3;
  if (typeof passages !== 'number' || !Number.isInteger(passages) || passages < 1 || passages > 20) throw new Error('Invalid passage budget.');
  return { id: value.id, query: value.query, mode: value.mode, section: value.section, article: value.article, passagesPerArticle: passages };
}

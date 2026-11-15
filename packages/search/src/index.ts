export type { ArticleDocument, SourcePassage } from './documents.js';
export type { EmbeddingEncoder, ManagedEncoder, SearchBundle, SearchOptions, SearchResponse, SearchEngine, ArticleMatch, PassageMatch, TextRange } from './contracts.js';
export { buildSearchIndex } from './snapshot.js';
export { createSearch } from './search.js';

import type { ArticleDocument, SourcePassage } from './documents.js';

/** The adapter owns tokenization, prefixes, model loading and long-document splitting. */
export interface EmbeddingEncoder {
  readonly space: string;
  readonly dimensions: number;
  encode(text: string, purpose: 'query' | 'document', signal?: AbortSignal): Promise<readonly Float32Array[]>;
}

/** The adapter owns its model resources; close waits for work already submitted. */
export interface ManagedEncoder extends EmbeddingEncoder { close(): Promise<void> }

export interface SearchBundle {
  readonly index: string;
  readonly vectors?: Uint8Array;
}

export interface SearchOptions {
  readonly mode?: 'words' | 'related';
  readonly article?: string;
  readonly section?: string;
  readonly limit?: number;
  readonly passagesPerArticle?: number;
  readonly signal?: AbortSignal;
}

export interface TextRange { readonly start: number; readonly end: number }

export interface PassageMatch {
  readonly id: string;
  readonly passage: SourcePassage;
  readonly url: string;
  readonly preview: { readonly text: string; readonly start: number; readonly end: number; readonly matches: readonly TextRange[] };
  /** Source order, including the selected passage. Context is not an additional ranked hit. */
  readonly context: readonly SourcePassage[];
}

export interface ArticleMatch {
  readonly article: Omit<ArticleDocument, 'passages'>;
  readonly passages: readonly PassageMatch[];
  /** Ranked source passages available under the current query and scope. */
  readonly totalPassages: number;
}

export interface SearchResponse {
  readonly indexId: string;
  readonly query: string;
  readonly mode: 'words' | 'related';
  readonly articles: readonly ArticleMatch[];
  readonly missingWords: readonly string[];
}

export interface SearchEngine {
  readonly id: string;
  readonly articleCount: number;
  readonly passageCount: number;
  readonly sections: readonly string[];
  readonly relatedSpace: string | null;
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;
}

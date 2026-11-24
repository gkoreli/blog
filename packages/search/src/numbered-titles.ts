import type { ArticleDocument } from './documents.js';
import { normalizeWord } from './query.js';

const issueTitle = /^([^:#]+)\s+#([0-9]+)(?:\s*:|$)/u;
const issueQuery = /^([^:#"\n]+)\s+#?([0-9]+)$/u;

function issueKey(series: string, number: string): string {
  const name = normalizeWord(series).trim().replace(/\s+/gu, ' ');
  return `${name} #${number.replace(/^0+(?=[0-9])/u, '')}`;
}

/** Resolve a short issue reference from published titles, including old snapshots. */
export function numberedTitleLookup(articles: readonly ArticleDocument[]): (query: string) => ArticleDocument | undefined {
  const titles = new Map<string, ArticleDocument | null>();
  const shortTitles = new Map<string, ArticleDocument | null>();

  function add(index: Map<string, ArticleDocument | null>, key: string, article: ArticleDocument): void {
    index.set(key, index.has(key) ? null : article);
  }

  for (const article of articles) {
    const [, series, number] = issueTitle.exec(article.title) ?? [];
    if (!series || !number) continue;
    add(titles, issueKey(series, number), article);
    const firstWord = series.trim().split(/\s+/u)[0];
    if (firstWord && firstWord !== series.trim()) add(shortTitles, issueKey(firstWord, number), article);
  }

  return query => {
    const [, series, number] = issueQuery.exec(query) ?? [];
    if (!series || !number) return undefined;
    const key = issueKey(series, number);
    return (titles.has(key) ? titles.get(key) : shortTitles.get(key)) ?? undefined;
  };
}

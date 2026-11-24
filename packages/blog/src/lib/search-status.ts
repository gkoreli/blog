import type { SearchResponse } from '@gkoreli/search';

export function issueSearchStatus(result: SearchResponse): string | undefined {
  const reference = result.reference;
  if (!reference) return undefined;
  const issue = `${reference.title} #${reference.number}`;
  if (reference.outcome === 'missing') return `No published issue matches ${issue}.`;
  if (reference.outcome === 'outside-scope') return `${issue} is outside the current filters.`;
  if (!reference.passageQuery) return `Found ${issue}.`;
  const count = result.articles[0]?.passages.length ?? 0;
  return count ? `${count} ${count === 1 ? 'passage' : 'passages'} shown in ${issue}.` : `Found ${issue}. No passages matched those words.`;
}

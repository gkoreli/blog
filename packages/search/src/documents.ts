/** A publication document owns its passages. Presentation and inference stay outside it. */
export interface ArticleDocument {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly section?: string;
  readonly tags?: readonly string[];
  readonly date?: string;
  readonly passages: readonly SourcePassage[];
}

export interface SourcePassage {
  readonly id: string;
  readonly text: string;
  readonly headings: readonly string[];
  readonly anchor: string;
  readonly kind: 'paragraph' | 'list' | 'code' | 'table' | 'text';
}

export function documentUrl(value: string): string {
  if (/^[\u0000-\u0020]|[\u0000-\u001f\u007f]/u.test(value)) throw new Error('Document URL contains control characters');
  if (value.startsWith('/') && !value.startsWith('//')) {
    const parsed = new URL(value, 'https://publication.invalid');
    if (parsed.origin !== 'https://publication.invalid' || parsed.search || parsed.hash) throw new Error('Document URL must identify an article');
    return parsed.pathname;
  }
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('Document URL must be HTTPS without credentials, query or fragment');
  return parsed.href;
}

export function validateDocument(article: ArticleDocument): void {
  if (!article.id.trim() || !article.title.trim()) throw new Error('An article needs an identity and title');
  documentUrl(article.url);
  const ids = new Set<string>(); const anchors = new Set<string>();
  for (const passage of article.passages) {
    if (!passage.id || !passage.anchor || !passage.text.trim()) throw new Error('A passage needs an identity, text and anchor');
    if (ids.has(passage.id) || anchors.has(passage.anchor)) throw new Error('Passage identities and anchors must be unique within an article');
    ids.add(passage.id); anchors.add(passage.anchor);
  }
}

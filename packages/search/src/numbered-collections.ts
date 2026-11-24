import { normalizeWord } from './query.js';

/** An edition number belongs to a publication-defined collection. Article titles may change. */
export interface NumberedCollection {
  readonly title: string;
  readonly aliases?: readonly string[];
  readonly issues: readonly { readonly number: number; readonly articleId: string }[];
}

export interface NumberedReference {
  readonly title: string;
  readonly number: string;
  readonly outcome: 'found' | 'missing' | 'outside-scope';
  readonly passageQuery: boolean;
}

function normalizeName(value: string): string {
  return normalizeWord(value).trim().replace(/\s+/gu, ' ');
}

export function compileNumberedCollections(collections: readonly NumberedCollection[], articles: ReadonlySet<string>) {
  const names = new Map<string, { title: string; issues: ReadonlyMap<string, string> }>();
  for (const { title, aliases, issues } of collections) {
    const catalogue = new Map<string, string>();
    for (const issue of issues) {
      if (!Number.isSafeInteger(issue.number) || issue.number < 1 || !articles.has(issue.articleId)) throw new Error('Invalid issue in a numbered collection.');
      const number = String(issue.number);
      if (catalogue.has(number)) throw new Error('Duplicate issue number in a numbered collection.');
      catalogue.set(number, issue.articleId);
    }
    const collection = { title, issues: catalogue };
    for (const name of [title, ...aliases ?? []]) {
      const key = normalizeName(name);
      if (!key || /[#"\n:]/u.test(key)) throw new Error('Invalid numbered collection name.');
      if (names.has(key)) throw new Error('Duplicate numbered collection name.');
      names.set(key, collection);
    }
  }

  return (query: string) => {
    // Rightmost match with a known prefix wins when a declared name itself contains a number.
    let reference: { title: string; number: string; articleId: string | undefined; detail: string } | undefined;
    for (const match of query.matchAll(/(?: #?|#)([0-9]+)(?=[: ]|$)/gu)) {
      const collection = names.get(normalizeName(query.slice(0, match.index)));
      const digits = match[1];
      if (!collection || !digits) continue;
      const number = digits.replace(/^0+(?=[0-9])/u, '');
      const detail = query.slice(match.index + match[0].length).replace(/^:/u, '').trim();
      reference = { title: collection.title, number, articleId: collection.issues.get(number), detail };
    }
    return reference;
  };
}

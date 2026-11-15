import type { PostMeta } from '../lib/frontmatter.js';
import { CONTENT_LICENSE } from '../lib/license.js';
import { isCalendarDate } from '@gkoreli/time';

const SITE = 'https://gkoreli.com';
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface CitationDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
}

function citationDate(date: string): CitationDate {
  if (!isCalendarDate(date)) throw new Error(`Invalid citation date: ${date}`);

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const monthName = MONTHS[month - 1];
  if (!monthName || day < 1 || day > 31) throw new Error(`Invalid citation date: ${date}`);

  return { year, month, day, monthName };
}

function canonicalUrl(meta: PostMeta): string {
  return `${SITE}/${meta.slug}`;
}

function bibtexKey(meta: PostMeta, year: number): string {
  const firstTitleWord = meta.title.match(/[A-Za-z0-9]+/)?.[0]?.toLowerCase() ?? 'post';
  return `koreli${year}${firstTitleWord}`;
}

export function cslJson(meta: PostMeta): string {
  const { year, month, day } = citationDate(meta.date);
  const url = canonicalUrl(meta);
  return `${JSON.stringify({
    id: url,
    type: 'post-weblog',
    title: meta.title,
    author: [{ family: 'Koreli', given: 'Goga' }],
    'container-title': 'gkoreli.com',
    issued: { 'date-parts': [[year, month, day]] },
    URL: url,
    language: 'en',
    note: CONTENT_LICENSE.name,
  }, null, 2)}\n`;
}

export function bibtex(meta: PostMeta): string {
  const { year, monthName } = citationDate(meta.date);
  return `@misc{${bibtexKey(meta, year)},
  author={Koreli, Goga},
  title={${meta.title}},
  year={${year}},
  month={${monthName}},
  howpublished={gkoreli.com},
  url={${canonicalUrl(meta)}},
  note={${CONTENT_LICENSE.name}}
}`;
}

export function citationMarkdown(meta: PostMeta): string {
  const { year, monthName } = citationDate(meta.date);
  return `\n\n## Cite this\n\n\`\`\`bibtex\n${bibtex(meta)}\n\`\`\`\n\nKoreli, Goga. (${monthName} ${year}). "${meta.title}". gkoreli.com. ${canonicalUrl(meta)}\n`;
}

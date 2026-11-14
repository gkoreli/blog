import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { buildSearchIndex, type ArticleDocument } from '@gkoreli/search';
import { prepareArticle, type PreparedArticle } from '@gkoreli/search/html';
import { prepareE5Assets } from '@gkoreli/search/e5-assets';
import { createLocalE5 } from '@gkoreli/search/e5-node';
import { E5_SPACE } from '@gkoreli/search/e5';
import type { PostMeta } from '../lib/frontmatter.js';

export function searchableArticle(meta: PostMeta, html: string): PreparedArticle {
  return prepareArticle({ id: meta.slug, url: `/${meta.slug}`, title: meta.title, section: meta.section, date: meta.date, tags: meta.tags, html,
    // This published article contains an author source note in a blockquote. Do not redistribute it in the search index.
    ...(meta.slug === 'how-i-separate-readers-from-bots-without-javascript' ? { omitTags: ['blockquote'] } : {}),
  });
}

export async function writeSearchIndex(destination: string, articles: readonly ArticleDocument[], coverage: readonly { id: string; indexedCharacters: number; ignoredCharacters: number; headings: number }[]): Promise<void> {
  const started = performance.now();
  const cache = process.env['BLOG_SEARCH_CACHE'] ?? join(tmpdir(), 'gkoreli-search-v1');
  const model = await prepareE5Assets(cache, destination);
  let cached = 0, computed = 0;
  const encoder = await createLocalE5(model.directory, {
    async get(key) {
      try { const bytes = await readFile(join(cache, 'vectors', key)); if (bytes.length !== 384 * 4) throw new Error('Invalid embedding cache.'); cached++; return Float32Array.from({ length: 384 }, (_, i) => bytes.readFloatLE(i * 4)); }
      catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined; throw error; }
    },
    async put(key, vector) { const path = join(cache, 'vectors', key), bytes = Buffer.alloc(vector.length * 4); vector.forEach((value, i) => bytes.writeFloatLE(value, i * 4)); await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes); computed++; if (computed % 250 === 0) console.log(`Search: embedded ${computed} new units (${cached} cached).`); },
  });
  const bundle = await buildSearchIndex(articles, { encoder });
  if (!bundle.vectors) throw new Error('Related-search indexing produced no vectors.');
  const hash = createHash('sha256').update(bundle.index).digest('hex').slice(0, 20), base = `/search-assets/${hash}`;
  await mkdir(join(destination, base), { recursive: true });
  await writeFile(join(destination, base, 'index.json'), bundle.index);
  await writeFile(join(destination, base, 'vectors.f32'), bundle.vectors);
  const manifest = { format: 1, index: `${base}/index.json`, vectors: `${base}/vectors.f32`, space: E5_SPACE, model: model.files, notice: model.notice.url, relatedDownloadBytes: model.browserBytes + bundle.vectors.length,
    articles: articles.length, passages: articles.reduce((sum, article) => sum + article.passages.length, 0), indexBytes: Buffer.byteLength(bundle.index), vectorBytes: bundle.vectors.length };
  await writeFile(join(destination, 'search-manifest.json'), JSON.stringify(manifest));
  await writeFile(join(cache, `build-${hash}.json`), JSON.stringify({ ...manifest, computed, cached, milliseconds: performance.now() - started, coverage }, null, 2));
  console.log(`Search: ${manifest.articles} articles, ${manifest.passages} passages; ${manifest.indexBytes} index bytes, ${manifest.vectorBytes} vector bytes; ${computed} new / ${cached} cached embeddings.`);
}

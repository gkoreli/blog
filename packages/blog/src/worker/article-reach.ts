import { z } from 'zod';
import { queryArticleReach } from '@gkoreli/analytics/article-reach';
import { ARTICLE_REACH_VERSION, validReachCatalogue, type ReachArticle } from '@gkoreli/analytics/article-reach-contract';
import { createStatsHandler, type StatsCacheStore } from '@gkoreli/analytics/reporting';
import { parseTimeZone } from '@gkoreli/time';

interface ArticleAssets { fetch(request: Request): Promise<Response> }
interface ReachEnvironment { DB: D1Database; ASSETS: ArticleAssets }
const indexSchema = z.array(z.object({ url: z.string(), title: z.string(), date: z.string() })).min(1).max(256);
const catalogues = new WeakMap<ArticleAssets, { expiresAt: number; promise: Promise<ReachArticle[]> }>();

/** Local asset binding only. Missing/invalid metadata must not turn into an empty ranking. */
async function articleCatalogue(assets: ArticleAssets): Promise<ReachArticle[]> {
  const cached = catalogues.get(assets);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  const entry = { expiresAt: Date.now() + 300_000, promise: Promise.resolve().then(async () => {
    const response = await assets.fetch(new Request('https://gkoreli.com/posts.json'));
    if (!response.ok) throw new Error('Article catalogue unavailable');
    const value: unknown = await response.json();
    const catalogue = indexSchema.parse(value).map(post => ({ path: post.url, title: post.title, publishedOn: post.date }));
    if (!validReachCatalogue(catalogue)) throw new Error('Article catalogue invalid');
    return catalogue;
  }) };
  catalogues.set(assets, entry);
  try { return await entry.promise; }
  catch (error) { if (catalogues.get(assets) === entry) catalogues.delete(assets); throw error; }
}

export function createArticleReachHandler(cache: StatsCacheStore, now: () => number = Date.now) {
  const cached = createStatsHandler(cache, async (request, env: ReachEnvironment) => {
    const catalogue = await articleCatalogue(env.ASSETS);
    const report = await queryArticleReach(env.DB, catalogue, { now: new Date(now()), timeZone: new URL(request.url).searchParams.get('timeZone') ?? 'UTC', onCalculation: event => console.info('article-reach-calculation', event) });
    return Response.json(report);
  }, { now, reportVersion: 'article-reach-' + ARTICLE_REACH_VERSION, onOutcome: event => console.info('article-reach-cache', event) });
  return (request: Request, env: ReachEnvironment): Promise<Response> => {
    // Only the named calendar is selectable; paths, sources and periods stay fixed.
    const url = new URL(request.url);
    const zone = parseTimeZone(url.searchParams.get('timeZone') ?? 'UTC');
    if (zone === null || url.searchParams.getAll('timeZone').length > 1) return Promise.resolve(Response.json({ error: 'timeZone must be one supported IANA timezone' }, { status: 400 }));
    const selection = new URL('/api/readership', request.url); selection.searchParams.set('timeZone', zone);
    const canonical = new Request(selection, { method: request.method });
    return cached(canonical, env);
  };
}

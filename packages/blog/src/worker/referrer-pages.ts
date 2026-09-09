import { z } from 'zod';

// Public non-post routes rendered by build.ts. Article and prompt routes come
// from the published posts.json asset, never from the incoming Referer value.
const fixedPaths = [
  '/', '/about', '/engineering', '/essays', '/oss-radar', '/privacy', '/license',
  '/stats', '/design-language', '/animations-lab',
];
const publicPath = z.string().regex(/^\/[a-z0-9-]+(?:\/prompts)?$/);
const indexSchema = z.array(z.object({ url: publicPath, prompts: publicPath.optional() }));

export function publicPathsFromIndex(value: unknown): ReadonlySet<string> {
  const posts = indexSchema.parse(value);
  return new Set([...fixedPaths, ...posts.flatMap(post => post.prompts ? [post.url, post.prompts] : [post.url])]);
}

interface CachedPaths {
  expiresAt: number;
  promise: Promise<ReadonlySet<string>>;
}
interface PublicPageAssets {
  fetch(request: Request): Promise<Response>;
}
const cache = new WeakMap<PublicPageAssets, CachedPaths>();

/** Uses the local static-asset binding; failure never prevents the page observation. */
export async function publicPagePaths(assets: PublicPageAssets): Promise<ReadonlySet<string>> {
  const existing = cache.get(assets);
  if (existing && existing.expiresAt > Date.now()) return existing.promise;
  const entry: CachedPaths = {
    expiresAt: Date.now() + 300_000,
    promise: Promise.resolve().then(() => assets.fetch(new Request('https://gkoreli.com/posts.json')))
      .then(async response => {
        if (!response.ok) throw new Error('Public page index unavailable');
        return publicPathsFromIndex(await response.json());
      }).catch(() => {
        entry.expiresAt = Date.now() + 60_000;
        console.warn('Analytics public page index unavailable; unknown internal source paths omitted for one minute.');
        return new Set(fixedPaths);
      }),
  };
  cache.set(assets, entry);
  return entry.promise;
}

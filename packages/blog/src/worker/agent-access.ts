import { z } from 'zod';
import { createAgentAccessReportHandler } from '@gkoreli/analytics/agent-access';
import { validAgentAccessCatalogue, type AgentAccessResource } from '@gkoreli/analytics/agent-access-contract';
import type { StatsCacheStore } from '@gkoreli/analytics/reporting';

interface AgentAssets { fetch(request: Request): Promise<Response> }
interface AgentEnvironment { DB: D1Database; ASSETS: AgentAssets }
const indexSchema = z.array(z.object({ url: z.string().regex(/^\/[a-z0-9-]+$/), title: z.string().min(1).max(256) })).min(1).max(256);
const sitePages = [
  ['home', '/', 'Homepage'], ['about', '/about', 'About'], ['engineering', '/engineering', 'Engineering'],
  ['essays', '/essays', 'Essays'], ['oss-radar', '/oss-radar', 'OSS Radar'], ['tools', '/tools', 'Tools'],
  ['privacy', '/privacy', 'Privacy'], ['license', '/license', 'License'],
  ['design-language', '/design-language', 'Design Language'], ['animations-lab', '/animations-lab', 'Animations Lab'],
] as const;

/** Current public resources only. Retired prompt pages are not revived or linked;
 * unmatched historical paths remain an unnamed aggregate in the package report.
 */
export function agentResourcesFromIndex(value: unknown): AgentAccessResource[] {
  const posts = indexSchema.parse(value);
  const resources: AgentAccessResource[] = posts.map(post => ({ id: 'article:' + post.url.slice(1), path: post.url, title: post.title, role: 'article', articleId: null, collection: 'page' }));
  for (const [id, path, title] of sitePages) resources.push({ id: 'site:' + id, path, title, role: 'site', articleId: null, collection: 'page' });
  // A declared coverage gap, never an invented zero for download activity.
  const bunArticle = resources.find(resource => resource.path === '/oss-radar-08-bun-aot');
  if (bunArticle) resources.push({ id: 'evidence:bun-aot-download', path: '/downloads/bun-aot-check-0.1.0.zip', title: 'Bun AOT check download', role: 'evidence', articleId: bunArticle.id, collection: 'not-collected' });
  if (!validAgentAccessCatalogue(resources)) throw new Error('Invalid public agent access catalogue');
  return resources;
}

const catalogues = new WeakMap<AgentAssets, { expiresAt: number; promise: Promise<AgentAccessResource[]> }>();
async function catalogue(assets: AgentAssets): Promise<AgentAccessResource[]> {
  const cached = catalogues.get(assets);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  const promise = Promise.resolve().then(async () => {
    const response = await assets.fetch(new Request('https://gkoreli.com/posts.json'));
    if (!response.ok) throw new Error('Public article catalogue unavailable');
    const value: unknown = await response.json();
    return agentResourcesFromIndex(value);
  });
  const entry = { expiresAt: Date.now() + 300_000, promise };
  catalogues.set(assets, entry);
  try { return await promise; }
  catch (error) { if (catalogues.get(assets) === entry) catalogues.delete(assets); throw error; }
}

export function createBlogAgentAccessHandler(cache: StatsCacheStore, now: () => number = Date.now) {
  return createAgentAccessReportHandler<AgentEnvironment>(cache, {
    catalogue: env => catalogue(env.ASSETS), now, admission: null,
    onCalculation: event => console.info('agent-access-calculation', event),
    onOutcome: event => console.info('agent-access-cache', event),
  });
}

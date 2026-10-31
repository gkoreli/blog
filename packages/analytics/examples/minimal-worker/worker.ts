import { handleOwner, handleStats, observePageResponse, type Env } from '../../src/index.js';

const paths: ReadonlySet<string> = new Set(['/', '/notes']);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/api/owner') return handleOwner(request, env);
    if (path === '/api/stats') {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
      try { return await handleStats(request, env); }
      catch { return Response.json({ error: 'Report unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (!paths.has(path) && path !== '/notes.md') return new Response('Not Found', { status: 404 });
    const markdown = path === '/notes.md' || request.headers.get('Accept') === 'text/markdown';
    const body = markdown ? '# Example notes\n\nA page served by a minimal Worker.\n'
      : '<!doctype html><html lang="en"><meta charset="utf-8"><title>Analytics example</title><h1>Example notes</h1><p>A page served by a minimal Worker.</p><a href="/notes">Notes</a></html>';
    const response = new Response(request.method === 'HEAD' ? null : body, {
      headers: { 'Content-Type': markdown ? 'text/markdown; charset=utf-8' : 'text/html; charset=utf-8' },
    });
    observePageResponse(request, response, markdown ? 'markdown' : 'html', env, ctx, {
      publicPagePaths: async () => paths,
    });
    return response;
  },
} satisfies ExportedHandler<Env>;

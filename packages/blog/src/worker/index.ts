import { handleEvent, handleStats, type Env } from '@gkoreli/analytics';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Expose ctx for waitUntil in analytics lib
    (globalThis as Record<string, unknown>).ctx = ctx;

    const url = new URL(request.url);

    if (url.pathname === '/api/event' && request.method === 'POST') {
      return handleEvent(request, env);
    }

    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleStats(request, env);
    }

    // All other /api/* routes: 404
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

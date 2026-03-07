import { handleEvent, handleStats, type Env } from '@gkoreli/analytics';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/event' && request.method === 'POST') {
      return handleEvent(request, env, ctx);
    }

    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleStats(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

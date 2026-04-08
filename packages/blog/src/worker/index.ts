import { handleEvent, handleStats, type Env as AnalyticsEnv } from '@gkoreli/analytics';
import {
  handleSubscribe,
  handleConfirm,
  handleUnsubscribe,
  type NewsletterEnv,
} from '@gkoreli/newsletter';

/** Merged Worker env — both packages share the same DB binding. */
type Env = AnalyticsEnv & NewsletterEnv;

/** Extract the final path segment after /api/confirm/ or /api/unsubscribe/ */
function trailingSegment(pathname: string, prefix: string): string {
  return pathname.slice(prefix.length);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, method } = url;

    // ── Analytics ──────────────────────────────────────────────────────────
    if (pathname === '/api/event' && method === 'POST') {
      return handleEvent(request, env, ctx);
    }

    if (pathname === '/api/stats' && method === 'GET') {
      return handleStats(request, env);
    }

    // ── Newsletter ─────────────────────────────────────────────────────────
    if (pathname === '/api/subscribe' && method === 'POST') {
      return handleSubscribe(request, env, ctx);
    }

    if (pathname.startsWith('/api/confirm/') && method === 'GET') {
      const token = trailingSegment(pathname, '/api/confirm/');
      return handleConfirm(request, env, token);
    }

    if (pathname.startsWith('/api/unsubscribe/') && method === 'GET') {
      const token = trailingSegment(pathname, '/api/unsubscribe/');
      return handleUnsubscribe(request, env, token);
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

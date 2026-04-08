import { handleEvent, handleStats, type Env as AnalyticsEnv } from '@gkoreli/analytics';
import {
  handleSubscribe,
  handleConfirm,
  handleUnsubscribe,
  handleResendWebhook,
  handleScheduled,
  allowedOrigin,
  corsPreflightResponse,
  type NewsletterEnv,
} from '@gkoreli/newsletter';

/** Merged Worker env — both packages share the same DB binding. */
type Env = AnalyticsEnv & NewsletterEnv;

function trailingSegment(pathname: string, prefix: string): string {
  return pathname.slice(prefix.length);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname, method } = new URL(request.url);

    // ── Analytics ──────────────────────────────────────────────────────────
    if (pathname === '/api/event' && method === 'POST') {
      return handleEvent(request, env, ctx);
    }
    if (pathname === '/api/stats' && method === 'GET') {
      return handleStats(request, env);
    }

    // ── Newsletter: subscribe ──────────────────────────────────────────────
    if (pathname === '/api/subscribe' && method === 'OPTIONS') {
      return corsPreflightResponse(allowedOrigin(request));
    }
    if (pathname === '/api/subscribe' && method === 'POST') {
      return handleSubscribe(request, env, ctx);
    }

    // ── Newsletter: confirm / unsubscribe ──────────────────────────────────
    if (pathname.startsWith('/api/confirm/') && method === 'GET') {
      return handleConfirm(request, env, trailingSegment(pathname, '/api/confirm/'));
    }
    if (pathname.startsWith('/api/unsubscribe/') && method === 'GET') {
      return handleUnsubscribe(request, env, trailingSegment(pathname, '/api/unsubscribe/'));
    }

    // ── Newsletter: Resend delivery webhook ────────────────────────────────
    if (pathname === '/api/webhooks/resend' && method === 'POST') {
      return handleResendWebhook(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },

  /** Nightly cron: purge expired pending + old inactive rows. */
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await handleScheduled(event, env);
  },
} satisfies ExportedHandler<Env>;

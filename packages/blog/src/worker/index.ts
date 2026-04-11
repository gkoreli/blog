import { handleEvent, handleStats, type Env as AnalyticsEnv } from '@gkoreli/analytics';
import {
  handleClientError,
  purgeOldClientErrors,
  type ClientObservabilityEnv,
} from '@gkoreli/client-observability/server';
import {
  handleSubscribe,
  handleConfirm,
  handleUnsubscribe,
  handleResendConfirmation,
  handleResendConfirmationPreflight,
  handleSend,
  handleResendWebhook,
  handleScheduled,
  allowedOrigin,
  corsPreflightResponse,
  type NewsletterEnv,
} from '@gkoreli/newsletter';

/** Merged Worker env — both packages share the same DB binding. */
type Env = AnalyticsEnv & NewsletterEnv & ClientObservabilityEnv;

function trailingSegment(pathname: string, prefix: string): string {
  return pathname.slice(prefix.length);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    const { method } = request;

    // ── Analytics ──────────────────────────────────────────────────────────
    if (pathname === '/api/event' && method === 'POST') {
      return handleEvent(request, env, ctx);
    }
    if (pathname === '/api/stats' && method === 'GET') {
      return handleStats(request, env);
    }
    if (pathname === '/api/client-error' && method === 'POST') {
      return handleClientError(request, env, ctx);
    }

    // ── Newsletter: subscribe ──────────────────────────────────────────────
    if (pathname === '/api/subscribe' && method === 'OPTIONS') {
      return corsPreflightResponse(allowedOrigin(request));
    }
    if (pathname === '/api/subscribe' && method === 'POST') {
      return handleSubscribe(request, env, ctx);
    }

    // ── Newsletter: resend confirmation ────────────────────────────────────
    if (pathname === '/api/resend-confirmation' && method === 'OPTIONS') {
      return handleResendConfirmationPreflight(request);
    }
    if (pathname === '/api/resend-confirmation' && method === 'POST') {
      return handleResendConfirmation(request, env, ctx);
    }

    // ── Newsletter: confirm / unsubscribe ──────────────────────────────────
    if (pathname.startsWith('/api/confirm/') && method === 'GET') {
      return handleConfirm(request, env, trailingSegment(pathname, '/api/confirm/'));
    }
    // GET: manual click from email footer
    // POST: RFC 8058 one-click unsubscribe (Gmail "Unsubscribe" button)
    if (pathname.startsWith('/api/unsubscribe/') && (method === 'GET' || method === 'POST')) {
      return handleUnsubscribe(request, env, trailingSegment(pathname, '/api/unsubscribe/'));
    }

    // ── Newsletter: admin send ─────────────────────────────────────────────
    if (pathname === '/api/send' && method === 'POST') {
      return handleSend(request, env);
    }

    // ── Newsletter: Resend delivery webhook ────────────────────────────────
    if (pathname === '/api/webhooks/resend' && method === 'POST') {
      return handleResendWebhook(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },

  /** Nightly cron: purge expired pending + old inactive rows. */
  async scheduled(controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    await Promise.all([
      handleScheduled(controller, env),
      purgeOldClientErrors(env.DB).then(count =>
        console.log(`[client:error:cron] Purged ${count} old client errors.`),
      ).catch(err =>
        console.error('[client:error:cron] Cleanup failed:', err),
      ),
    ]);
  },
} satisfies ExportedHandler<Env>;

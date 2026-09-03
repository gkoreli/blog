import {
  handleStats,
  observePageResponse,
  type Env as AnalyticsEnv,
  type Representation,
} from '@gkoreli/analytics';
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
import { typedLinkHeaderValue } from '../lib/typed-links.js';
import { negotiateRepresentation, type NegotiatedRepresentation } from './negotiate.js';

/** Merged bindings for the packages composed by this Worker. */
type Env = AnalyticsEnv & NewsletterEnv & ClientObservabilityEnv & { ASSETS: Fetcher };

function trailingSegment(pathname: string, prefix: string): string {
  return pathname.slice(prefix.length);
}

interface ServedResponse {
  response: Response;
  representation: Representation | null;
}

function contentTypeIs(response: Response, mediaType: string): boolean {
  const contentType = response.headers.get('Content-Type');
  return contentType !== null && contentType.toLowerCase().startsWith(mediaType);
}

function pagePath(pathname: string): string | null {
  if (pathname === '/') return null;
  const normalized = pathname.replace(/\/+$/, '');
  const lastSegment = normalized.split('/').at(-1) ?? '';
  return lastSegment.includes('.') ? null : normalized;
}

function representationPath(pathname: string, representation: NegotiatedRepresentation): string | null {
  const path = pagePath(pathname);
  if (path === null || representation === 'html') return null;
  if (representation === 'markdown') return `${path}.md`;
  if (representation === 'csl-json') return `${path}.csl.json`;
  return `${path}.bib`;
}

function assetRequest(request: Request, pathname: string, method = request.method): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return new Request(url, { method, headers: request.headers });
}

async function assetExists(request: Request, env: Env, pathname: string): Promise<boolean> {
  return (await env.ASSETS.fetch(assetRequest(request, pathname, 'HEAD'))).ok;
}

function addVaryAccept(headers: Headers): void {
  const values = headers.get('Vary')?.split(',').map(value => value.trim()).filter(Boolean) ?? [];
  if (!values.some(value => value.toLowerCase() === 'accept')) values.push('Accept');
  headers.set('Vary', values.join(', '));
}

function withPageHeaders(
  response: Response,
  pathname: string,
  options: { hasMarkdown: boolean; isPost: boolean; contentLocation?: string },
): Response {
  const headers = new Headers(response.headers);
  const normalizedPagePath = pagePath(pathname);
  const postSlug = options.isPost && normalizedPagePath
    ? normalizedPagePath.slice(1)
    : undefined;
  headers.set('Link', typedLinkHeaderValue({
    ...(options.hasMarkdown && normalizedPagePath ? { markdownPath: `${normalizedPagePath}.md` } : {}),
    ...(postSlug ? { postSlug } : {}),
  }));
  if (options.hasMarkdown) addVaryAccept(headers);
  if (options.contentLocation) headers.set('Content-Location', options.contentLocation);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function negotiatedAsset(
  request: Request,
  env: Env,
  pathname: string,
  representation: Exclude<NegotiatedRepresentation, 'html'>,
): Promise<ServedResponse | null> {
  const normalizedPagePath = pagePath(pathname);
  if (normalizedPagePath === null) return null;
  const assetPath = representationPath(pathname, representation);
  if (assetPath === null) return null;

  const asset = await env.ASSETS.fetch(assetRequest(request, assetPath));
  if (!asset.ok) return null;

  const headers = new Headers(asset.headers);
  let analyticsRepresentation: Representation | null = null;
  if (representation === 'markdown') {
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    analyticsRepresentation = 'markdown';
  } else if (representation === 'csl-json') {
    headers.set('Content-Type', 'application/vnd.citationstyles.csl+json');
  } else {
    headers.set('Content-Type', 'application/x-bibtex; charset=utf-8');
  }

  const typedResponse = new Response(asset.body, {
    status: asset.status,
    statusText: asset.statusText,
    headers,
  });
  const isPost = representation !== 'markdown'
    || await assetExists(request, env, `${normalizedPagePath}.csl.json`);
  return {
    response: withPageHeaders(typedResponse, pathname, {
      hasMarkdown: true,
      isPost,
      ...(representation === 'markdown' ? { contentLocation: assetPath } : {}),
    }),
    representation: analyticsRepresentation,
  };
}

async function serveContent(request: Request, env: Env): Promise<ServedResponse> {
  const { pathname } = new URL(request.url);
  const canNegotiate = request.method === 'GET' || request.method === 'HEAD';
  const negotiated = canNegotiate
    ? negotiateRepresentation(request.headers.get('Accept'))
    : 'html';

  if (negotiated !== 'html') {
    const represented = await negotiatedAsset(request, env, pathname, negotiated);
    if (represented) return represented;
  }

  const response = await env.ASSETS.fetch(request);
  if (response.ok && contentTypeIs(response, 'text/html')) {
    const path = pagePath(pathname);
    if (path === null) {
      return {
        response: withPageHeaders(response, pathname, { hasMarkdown: false, isPost: false }),
        representation: 'html',
      };
    }
    const [hasMarkdown, isPost] = await Promise.all([
      assetExists(request, env, `${path}.md`),
      assetExists(request, env, `${path}.csl.json`),
    ]);
    return {
      response: withPageHeaders(response, pathname, { hasMarkdown, isPost }),
      representation: 'html',
    };
  }

  if (response.ok && pathname.endsWith('.md') && contentTypeIs(response, 'text/markdown')) {
    const originalPagePath = pathname.slice(0, -'.md'.length);
    const isPost = await assetExists(request, env, `${originalPagePath}.csl.json`);
    return {
      response: withPageHeaders(response, originalPagePath, { hasMarkdown: true, isPost }),
      representation: null,
    };
  }

  return { response, representation: null };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    const { method } = request;

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

    const { response, representation } = await serveContent(request, env);
    if (representation !== null) {
      observePageResponse(request, response, representation, env, ctx);
    }
    return response;
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

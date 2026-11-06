import { analyzeSite } from '@gkoreli/site-audit';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import { normalizeTarget, TargetValidationError } from '@gkoreli/site-audit/target';
import { assessRequest, trustedEdgeAddress } from '@gkoreli/analytics/request-assessment';
import { admitCheck, d1QuotaStore, quotaCallerKey, type CheckQuota } from './ai-check-quota.js';
import { checkErrorHtml, checkResultHtml } from './ai-check-html.js';
import { aiCheckSchema } from './ai-check-schema.js';

export interface AiCheckEnv {
  DB: D1Database;
  ANALYTICS_HASH_KEY: string;
  AI_CHECK_RATE_LIMITER: RateLimit;
  AI_CHECK_GLOBAL_LIMITER: RateLimit;
  ASSETS: Fetcher;
}

export interface AiCheckDependencies {
  audit?: typeof analyzeSite;
  requestAssessment?: typeof assessRequest;
  now?: () => Date;
}

const MAX_BODY_BYTES = 4096;

class InputError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

async function readInput(request: Request, htmlForm: boolean): Promise<string> {
  const type = request.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase();
  if (type !== (htmlForm ? 'application/x-www-form-urlencoded' : 'application/json')) throw new InputError('Use the documented request content type.', 415);
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw new InputError('Request body is too large.', 413);
  if (!request.body) throw new InputError('Supply a URL to check.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { reject(new InputError('Request body timed out.', 408)); void reader.cancel().catch(() => {}); }, 3000);
  });
  try {
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_BODY_BYTES) throw new InputError('Request body is too large.', 413);
      chunks.push(part.value);
    }
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(body); }
  catch { throw new InputError('Request must use UTF-8.'); }
  if (htmlForm) {
    const fields = new URLSearchParams(text);
    if (fields.getAll('url').length !== 1 || [...fields.keys()].some(key => key !== 'url')) throw new InputError('Supply one URL field.');
    return fields.get('url') ?? '';
  }
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new InputError('Request must contain valid JSON.'); }
  if (typeof data !== 'object' || data === null || Array.isArray(data) || !('url' in data) || typeof data.url !== 'string' || Object.keys(data).length !== 1) throw new InputError('Supply one JSON field: {"url":"https://example.com/page"}.');
  return data.url;
}

function headers(quota?: CheckQuota): Headers {
  const result = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Link': '</api/ai-check/schema>; rel="describedby"; type="application/json"' });
  if (quota) {
    result.set('X-RateLimit-Limit', String(quota.limit));
    result.set('X-RateLimit-Remaining', String(quota.remaining));
    result.set('X-RateLimit-Reset', String(Math.floor(Date.parse(quota.resetAt) / 1000)));
  }
  return result;
}

function json(value: unknown, status = 200, quota?: CheckQuota): Response {
  return Response.json(value, { status, headers: headers(quota) });
}

interface HtmlFormState { value: string; error?: string; }

async function htmlResponse(request: Request, env: AiCheckEnv, result: string, status: number, quota?: CheckQuota, formState?: HtmlFormState): Promise<Response> {
  const shell = await env.ASSETS.fetch(new Request(new URL('/ai-check', request.url), { headers: { Accept: 'text/html' } }));
  if (!shell.ok) return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>AI site check</title><main><a href="/ai-check">Try another check</a>${result || (formState?.error ? checkErrorHtml(formState.error) : '')}</main></html>`, { status, headers: { ...Object.fromEntries(headers(quota)), 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
  const body = await shell.text();
  const marker = '<div id="ai-check-server-result"></div>';
  const resultFocus = request.method === 'POST' && result ? ' tabindex="-1" autofocus' : '';
  const rendered = body.includes(marker) ? body.replace(marker, `<div id="ai-check-server-result"${resultFocus}>${result}</div>`) : body.replace('</main>', `${result}</main>`);
  const responseHeaders = headers(quota);
  for (const name of ['Content-Security-Policy', 'Permissions-Policy', 'Referrer-Policy']) {
    const value = shell.headers.get(name);
    if (value !== null) responseHeaders.set(name, value);
  }
  responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
  responseHeaders.set('X-Robots-Tag', 'noindex');
  const response = new Response(rendered, { status, headers: responseHeaders });
  if (!formState) return response;
  return new HTMLRewriter()
    .on('#ai-check-url', { element(element) {
      element.setAttribute('value', formState.value);
      if (formState.error) { element.setAttribute('aria-invalid', 'true'); element.setAttribute('autofocus', ''); }
    } })
    .on('#ai-check-url-error', { element(element) {
      if (formState.error) { element.removeAttribute('hidden'); element.setInnerContent(formState.error); }
    } })
    .transform(response);
}

/** HTTP adapter. The audit engine never sees bindings, caller identity or quota state. */
export async function handleAiCheck(request: Request, env: AiCheckEnv, dependencies: AiCheckDependencies = {}): Promise<Response> {
  const path = new URL(request.url).pathname;
  const htmlForm = path === '/ai-check';
  if (path === '/ai-check/example') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const response = json({ error: 'Use GET or HEAD for the saved example.' }, 405);
      response.headers.set('Allow', 'GET, HEAD');
      return response;
    }
    const asset = await env.ASSETS.fetch(new Request(new URL('/ai-check-example.json', request.url)));
    let value: unknown;
    try { value = await asset.json(); } catch { return json({ error: 'The saved example is unavailable.' }, 503); }
    const report = typeof value === 'object' && value !== null && 'report' in value ? value.report : value;
    if (!asset.ok || !isSiteAuditReport(report)) return json({ error: 'The saved example is unavailable.' }, 503);
    const result = checkResultHtml(report, undefined, true);
    const response = await htmlResponse(request, env, result, 200);
    return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
  }
  if (path === '/api/ai-check/schema') {
    if (request.method !== 'GET') {
      const response = json({ error: 'Use GET for the API schema.' }, 405);
      response.headers.set('Allow', 'GET');
      return response;
    }
    return json(aiCheckSchema);
  }
  const ownRequest = path === '/api/request-check';
  const expectedMethod = ownRequest ? 'GET' : 'POST';
  if (request.method !== expectedMethod) {
    const response = json({ error: `Use ${expectedMethod}.`, schema: '/api/ai-check/schema' }, 405);
    response.headers.set('Allow', expectedMethod);
    return response;
  }
  let formState: HtmlFormState | undefined;
  const failure = (message: string, status: number, quota?: CheckQuota, fieldError = false) => htmlForm
    ? htmlResponse(request, env, fieldError ? '' : checkErrorHtml(message, status, quota), status, quota, formState ? { ...formState, ...(fieldError ? { error: message } : {}) } : undefined)
    : Promise.resolve(json({ error: message, ...(quota ? { quota } : {}) }, status, quota));
  const origin = request.headers.get('Origin');
  if (origin !== null && origin !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return failure('Run browser checks from this site. Server API clients may omit Origin.', 403);
  let target = '';
  try {
    if (!ownRequest) {
      const submitted = await readInput(request, htmlForm);
      if (htmlForm) formState = { value: submitted };
      target = normalizeTarget(htmlForm ? submitted.trim() : submitted).toString();
      if (htmlForm) formState = { value: target };
    }
    else if ((request.headers.get('User-Agent')?.length ?? 0) > 8192) throw new InputError('User-Agent exceeds the request-assessment limit.', 413);
  } catch (error: unknown) {
    return failure(error instanceof TargetValidationError || error instanceof InputError ? error.message : 'Could not read the request.', error instanceof InputError ? error.status : 400, undefined, error instanceof TargetValidationError);
  }
  const ip = trustedEdgeAddress(request);
  if (!ip || !env.ANALYTICS_HASH_KEY || !env.AI_CHECK_RATE_LIMITER || !env.AI_CHECK_GLOBAL_LIMITER) return failure('The checker is temporarily unavailable. Try again later.', 503);
  const now = dependencies.now?.() ?? new Date();
  let quota: CheckQuota | undefined;
  try {
    const callerKey = await quotaCallerKey(env.ANALYTICS_HASH_KEY, ip, now.toISOString().slice(0, 10));
    const [caller, shared] = await Promise.all([
      env.AI_CHECK_RATE_LIMITER.limit({ key: callerKey }),
      env.AI_CHECK_GLOBAL_LIMITER.limit({ key: 'ai-check-route' }),
    ]);
    if (!caller.success || !shared.success) {
      const response = await failure('Checks are arriving too quickly. Try again in a minute.', 429);
      response.headers.set('Retry-After', '60');
      return response;
    }
    const admission = await admitCheck(d1QuotaStore(env.DB), callerKey, now);
    quota = admission.quota;
    if (!admission.allowed) {
      const response = await failure('Your ten daily checks have been used. Try again after the UTC reset.', 429, quota);
      response.headers.set('Retry-After', String(Math.max(1, Math.ceil((Date.parse(quota.resetAt) - now.getTime()) / 1000))));
      return response;
    }
    if (ownRequest) return json({ request: await (dependencies.requestAssessment ?? assessRequest)(request), quota }, 200, quota);
    const report = await (dependencies.audit ?? analyzeSite)(target);
    return htmlForm ? htmlResponse(request, env, checkResultHtml(report, quota), 200, quota, formState) : json({ report, quota }, 200, quota);
  } catch {
    // Never serialize the target, body, raw address, upstream text or DB error.
    return failure('The checker could not finish. Try again later. An admitted check may have used one allowance.', 503, quota);
  }
}

import type { Env } from './db.js';
import { hasCurrentOwnerMark } from './owner.js';

export const NATIVE_CAPTURE_PREFIX = '/api/analytics-native-capture';
export const NATIVE_CAPTURE_HEADER = 'x-gk-native-bot-candidate';
export const NATIVE_CAPTURE_PROFILE = 'native-bot-capture-v1';
const CONDITIONS = [
  'direct', 'spoof-single', 'spoof-duplicate', 'rule-disabled', 'rule-absent',
  'rule-expired', 'later-overwrite', 'workers-dev', 'same-zone-relay',
  'cross-zone-relay', 'provider-positive',
] as const;
type Condition = typeof CONDITIONS[number];
type BooleanState = 'true' | 'false' | 'unavailable' | 'unrecognized';
export interface NativeBotCaptureInputs {
  candidate: 'missing' | 'literal-true' | 'literal-false' | 'other';
  candidateTrust: 'untrusted-header';
  nativeSource: 'request.cf';
  native: { verifiedBot: BooleanState; signedAgent: BooleanState };
}
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const WINDOW_MS = 15 * 60_000;
const GUARD_DEADLINE_MS = 500;
interface Control { id: string; condition: Condition }
interface Config { issuedAt: number; expiresAt: number; origins: string[]; controls: Control[] }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function activeAt(config: Config, now: Date): boolean {
  return Number.isFinite(now.getTime()) && now.getTime() >= config.issuedAt && now.getTime() < config.expiresAt;
}

function configuration(raw: string | undefined, now: Date): Config | null {
  if (!raw || raw.length > 8192) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!record(value) || !Number.isSafeInteger(value.issuedAt) || typeof value.issuedAt !== 'number'
    || !Number.isSafeInteger(value.expiresAt) || typeof value.expiresAt !== 'number'
    || value.expiresAt <= value.issuedAt || value.expiresAt - value.issuedAt > WINDOW_MS
    || !Array.isArray(value.origins) || value.origins.length < 1 || value.origins.length > 4
    || !Array.isArray(value.controls) || value.controls.length < 1 || value.controls.length > 32) return null;
  const origins: string[] = [];
  for (const origin of value.origins) {
    if (typeof origin !== 'string' || origin.length > 260 || origins.includes(origin)) return null;
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:' || url.origin !== origin) return null;
    } catch { return null; }
    origins.push(origin);
  }
  const controls: Control[] = [];
  for (const item of value.controls) {
    if (!record(item) || typeof item.id !== 'string' || !UUID.test(item.id) || controls.some(control => control.id === item.id)) return null;
    const condition = CONDITIONS.find(candidate => candidate === item.condition);
    if (!condition) return null;
    controls.push({ id: item.id, condition });
  }
  const config = { issuedAt: value.issuedAt, expiresAt: value.expiresAt, origins, controls };
  return activeAt(config, now) ? config : null;
}

function booleanState(value: unknown): BooleanState {
  return value === true ? 'true' : value === false ? 'false'
    : value === undefined || value === null ? 'unavailable' : 'unrecognized';
}

/** Header shape only. No normalisation or provenance inference from its contents. */
export function nativeBotCaptureInputs(request: Request): NativeBotCaptureInputs {
  const header = request.headers.get(NATIVE_CAPTURE_HEADER);
  const cf: unknown = request.cf;
  const management = record(cf) ? cf.botManagement : undefined;
  // A malformed container is distinct from a missing product/field.
  const unavailable = (cf === undefined || cf === null || record(cf)) && (management === undefined || management === null);
  return {
    candidate: header === null ? 'missing' : header === 'true' ? 'literal-true' : header === 'false' ? 'literal-false' : 'other',
    candidateTrust: 'untrusted-header' as const,
    nativeSource: 'request.cf' as const,
    native: {
      verifiedBot: record(management) ? booleanState(management.verifiedBot) : unavailable ? 'unavailable' : 'unrecognized',
      signedAgent: record(management) ? booleanState(management.signedAgent) : unavailable ? 'unavailable' : 'unrecognized',
    },
  };
}

function response(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      ...(status === 405 ? { Allow: 'GET' } : {}),
    },
  });
}

/** No collector, observation writes, raw-header logging or native trust promotion. */
export async function handleNativeBotCapture(request: Request, env: Env, clock = () => new Date()): Promise<Response> {
  const url = new URL(request.url);
  const started = clock();
  const config = configuration(env.ANALYTICS_NATIVE_CAPTURE, started);
  if (!config || !config.origins.includes(url.origin) || url.search !== '') return response({}, 404);
  const match = /^\/api\/analytics-native-capture\/([^/]+)$/.exec(url.pathname);
  const control = config.controls.find(item => item.id === match?.[1]);
  if (!control) return response({}, 404);
  if (request.method !== 'GET') return response({}, 405);
  const origin = request.headers.get('Origin');
  if (origin !== null && origin !== url.origin) return response({}, 403);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const marked = await Promise.race([
      hasCurrentOwnerMark(request, env, started),
      new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), GUARD_DEADLINE_MS); }),
    ]);
    const completed = clock();
    // A midnight boundary changes the owner profile; require a fresh guarded request.
    if (!activeAt(config, completed) || completed.getTime() < started.getTime()
      || started.toISOString().slice(0, 10) !== completed.toISOString().slice(0, 10)) return response({}, 404);
    if (marked === null) return response({}, 503);
    if (!marked) return response({}, 403);
    const capture = {
      profile: NATIVE_CAPTURE_PROFILE, responseId: crypto.randomUUID(), controlId: control.id,
      plannedCondition: control.condition, observedAt: completed.toISOString(),
      ...nativeBotCaptureInputs(request),
    };
    console.info('analytics.native_bot_capture', capture);
    return response(capture, 200);
  } catch {
    return response({}, 503);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

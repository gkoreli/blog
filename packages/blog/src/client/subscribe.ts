import { captureSubscriptionError, captureSubscriptionResponse, type ClientLogger, type SubscriptionPhase, type SubscriptionOperationEvidence, type SubscriptionDiagnosticContext } from '@gkoreli/client-observability/client';

/** Minimal Turnstile API surface we use */
interface Turnstile {
  render(
    container: string | HTMLElement,
    options: {
      sitekey: string;
      execution?: 'render' | 'execute';
      appearance?: 'always' | 'execute' | 'interaction-only';
      theme?: 'auto' | 'light' | 'dark';
      action?: string;
      size?: 'normal' | 'compact' | 'flexible';
      retry?: 'auto' | 'never';
      'refresh-expired'?: 'auto' | 'manual' | 'never';
      'refresh-timeout'?: 'auto' | 'manual' | 'never';
      'response-field'?: boolean;
      callback?: (token: string) => void;
      'error-callback'?: (errorCode: string) => boolean | void;
      'expired-callback'?: () => void;
      'timeout-callback'?: () => void;
      'unsupported-callback'?: () => void;
      'before-interactive-callback'?: () => void;
      'after-interactive-callback'?: () => void;
    }
  ): string;
  execute(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

interface SubscribeOptions {
  logger: ClientLogger;
}

const ATTRIBUTION_PARAMS = ['utm_source', 'utm_campaign'] as const;
const VERIFICATION_TIMEOUT_MS = 30_000;
const INTERACTIVE_TIMEOUT_MS = 120_000;
const REQUEST_TIMEOUT_MS = 35_000;

interface Attempt {
  id: string;
  startedAt: number;
  retries: number;
  interactive: boolean;
  email: string;
  operation: SubscriptionOperationEvidence;
  phase: 'verifying' | 'sending';
  timer: number | null;
  controller: AbortController | null;
}

/**
 * Preserve only the small amount of acquisition context needed to learn which
 * launch channel converts. Full referrer URLs and arbitrary query parameters
 * are deliberately excluded.
 */
function subscriptionSource(): string {
  const source = new URL(location.pathname, location.origin);
  const current = new URLSearchParams(location.search);

  for (const key of ATTRIBUTION_PARAMS) {
    const value = current.get(key)?.trim();
    if (value) source.searchParams.set(key, value.slice(0, 80));
  }

  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin !== location.origin) {
        source.searchParams.set('ref', referrer.hostname.replace(/^www\./, '').slice(0, 100));
      }
    } catch {
      // Invalid referrers are ignored. Attribution must never block signup.
    }
  }

  return `${source.pathname}${source.search}`;
}

export function initSubscribeForm({ logger }: SubscribeOptions): void {
  const formEl = document.getElementById('sub-form');
  if (!(formEl instanceof HTMLFormElement)) return;

  // Init guard — prevents double-listener if initSubscribeForm is called more than once
  if (formEl.dataset['subscribeInit'] === 'true') return;
  const rawInput = formEl.elements.namedItem('email');
  const rawBtn = formEl.querySelector('.subscribe-btn');
  const rawMsg = formEl.querySelector('.subscribe-msg');
  const slot = formEl.querySelector('.turnstile-slot');

  if (!(rawInput instanceof HTMLInputElement)
    || !(rawBtn instanceof HTMLButtonElement)
    || !(rawMsg instanceof HTMLElement)) return;
  formEl.dataset['subscribeInit'] = 'true';

  // Capture non-nullable references. TypeScript narrows these at the assignment point
  // but doesn't carry narrowing across async/closure boundaries, so we rebind explicitly.
  const form = formEl;           // HTMLFormElement (non-null past guard)
  const emailInput = rawInput;   // HTMLInputElement (narrowed by instanceof)
  const btn = rawBtn;            // HTMLButtonElement (non-null past guard)
  const msg = rawMsg;            // HTMLElement (non-null past guard)

  let widget: { id: string | null; api: Turnstile } | null = null;
  let active: Attempt | null = null;
  let widgetState: SubscriptionDiagnosticContext['widget'] = 'unknown';

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (active) return;
    if (!emailInput.checkValidity()) { emailInput.reportValidity(); return; }

    const attempt: Attempt = {
      id: crypto.randomUUID(), startedAt: performance.now(), retries: 0, interactive: false,
      email: emailInput.value.trim(), phase: 'verifying', timer: null, controller: null,
      operation: { state: 'not-started' },
    };
    active = attempt;
    btn.disabled = true;
    form.setAttribute('aria-busy', 'true');
    msg.textContent = 'Verifying…';

    // Retry initialization here when the external script arrived after our module.
    if (!initWidget(true) || !widget || widget.id === null
      || active !== attempt || attempt.phase !== 'verifying') return;
    if (attempt.timer === null) attempt.timer = window.setTimeout(() => {
      if (active === attempt) {
        fail('subscribe_widget_deadline', 'Verification took too long. Please try again.');
      }
    }, VERIFICATION_TIMEOUT_MS);

    try {
      if (!attempt.interactive) widgetState = 'verifying';
      widget.api.execute(widget.id);
    } catch {
      if (active === attempt) {
        fail('subscribe_widget_execute_exception', 'Verification could not start. Please try again.');
      }
    }
  });

  btn.disabled = false;
  initWidget(false);

  function initWidget(reportMissing: boolean): boolean {
    if (widget) return true;
    const sitekey = form.dataset['turnstileSitekey']?.trim();
    if (!sitekey || !(slot instanceof HTMLElement)) {
      if (reportMissing) {
        fail('subscribe_widget_configuration_missing', 'Subscriptions are temporarily unavailable. Please try again later.');
      }
      return false;
    }
    const api = window.turnstile;
    if (!api) {
      if (reportMissing) {
        fail('subscribe_widget_unavailable', 'Verification has not loaded. Please wait a moment and try again.');
      }
      return false;
    }

    const current: { id: string | null; api: Turnstile } = { id: null, api };
    widget = current;
    widgetState = 'rendering';
    try {
      const id = api.render(slot, {
        sitekey, execution: 'execute', appearance: 'interaction-only', size: 'compact', theme: 'auto', action: 'subscribe',
        retry: 'auto', 'refresh-expired': 'manual', 'refresh-timeout': 'manual', 'response-field': false,
        callback(token) {
          if (widget === current && active?.phase === 'verifying') void doSubmit(active, token);
        },
        'error-callback'(errorCode) {
          if (widget !== current) return true;
          // Let Turnstile retry one documented transient failure within our deadline.
          // Configuration errors and repeated failures still recover to a usable form.
          const retryable = /^(300|600)[0-9]{3}$/.test(errorCode)
            || errorCode === '200500' || errorCode === '110600' || errorCode === '110620';
          if (active?.phase === 'verifying' && active.retries === 0 && retryable) {
            active.retries++;
            report('subscribe_widget_error', undefined, active.phase, { errorCode }, active.operation,
              diagnosticContext(active, 'automatic-retry'));
            msg.textContent = 'Verification interrupted. Retrying…';
          } else {
            fail('subscribe_widget_error', 'Verification failed. Please try again.', undefined, { errorCode });
          }
          return true;
        },
        'before-interactive-callback'() {
          if (widget !== current || active?.phase !== 'verifying' || active.interactive) return;
          const attempt = active;
          attempt.interactive = true;
          widgetState = 'interactive';
          clearDeadline(attempt);
          attempt.timer = window.setTimeout(() => {
            if (active === attempt) fail('subscribe_widget_deadline', 'Verification took too long. Please try again.');
          }, INTERACTIVE_TIMEOUT_MS);
          msg.textContent = 'Complete the verification below to subscribe.';
        },
        'after-interactive-callback'() {
          if (widget === current && active?.phase === 'verifying') {
            widgetState = 'verifying';
            msg.textContent = 'Verifying…';
          }
        },
        'expired-callback'() {
          if (widget !== current) return;
          if (active) {
            fail('subscribe_widget_expired', active.phase === 'sending'
              ? 'Verification expired. Check for a confirmation email before trying again.'
              : 'Verification expired. Please try again.');
          } else {
            removeWidget();
          }
        },
        'timeout-callback'() {
          if (widget === current) fail('subscribe_widget_timeout', 'Verification timed out. Please try again.');
        },
        'unsupported-callback'() {
          if (widget === current) fail('subscribe_widget_unsupported', 'Verification does not support this browser. Please try another browser.');
        },
      });
      current.id = id;
      // A callback can fail synchronously inside render, before its ID is returned.
      if (widget !== current) {
        api.remove(id);
        return false;
      }
      if (widgetState === 'rendering') widgetState = 'ready';
      return true;
    } catch {
      if (widget === current) {
        fail('subscribe_widget_render_exception', 'Verification could not load. Please try again.');
      }
      return false;
    }
  }

  async function doSubmit(attempt: Attempt, token: string): Promise<void> {
    if (!token.trim()) {
      fail('subscribe_widget_empty_token', 'Verification failed. Please try again.');
      return;
    }
    // Consume this callback before fetch so duplicate callbacks cannot send twice.
    attempt.phase = 'sending';
    widgetState = 'token-received';
    clearDeadline(attempt);
    // The token has been handed off. Late widget events must not abort a mail request.
    removeWidget(attempt);
    const controller = new AbortController();
    attempt.controller = controller;
    attempt.timer = window.setTimeout(() => {
      if (active === attempt) {
        fail('subscribe_request_timeout', 'The request took too long. Check for a confirmation email before trying again.');
      }
    }, REQUEST_TIMEOUT_MS);
    msg.textContent = 'Submitting…';

    try {
      // No response yet does not mean the server never received or committed it.
      attempt.operation = { state: 'response-unavailable' };
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-subscription-attempt-id': attempt.id },
        body: JSON.stringify({ email: attempt.email, turnstile: token, source: subscriptionSource() }),
        signal: controller.signal,
      });
      if (active !== attempt) return;
      attempt.operation = captureSubscriptionResponse(res.headers.get('x-request-id'), res.redirected);
      if (res.status === 202) {
        clearDeadline(attempt);
        active = null;
        removeWidget(attempt);
        form.removeAttribute('aria-busy');
        btn.disabled = false;
        msg.textContent = 'Request received. If confirmation is needed, check your inbox and spam folder. No email? You can try again in ten minutes.';
        return;
      }
      const message = res.status === 429
        ? 'Too many requests. Please wait a few minutes and try again.'
        : res.status === 503
          ? res.headers.get('retry-after') === '600'
            ? 'Subscriptions are temporarily unavailable. Check your inbox before retrying in ten minutes.'
            : 'Subscriptions are temporarily unavailable. Please try again later.'
          : res.status === 400
            ? 'We could not verify this request. Please try again.'
            : 'We could not complete the request. Please try again.';
      fail('subscribe_api_rejected', message, res.status);
    } catch {
      if (active === attempt) {
        fail('subscribe_network_error', 'Connection failed. Check for a confirmation email before trying again.');
      }
    }
  }

  function diagnosticContext(attempt: Attempt | null, recovery: SubscriptionDiagnosticContext['recovery']): SubscriptionDiagnosticContext {
    return {
      attemptId: attempt?.id ?? null,
      elapsedMs: attempt ? Math.min(300_000, Math.max(0, Math.floor(performance.now() - attempt.startedAt))) : null,
      online: typeof navigator.onLine === 'boolean' ? navigator.onLine ? 'online' : 'offline' : 'unknown',
      visibility: document.visibilityState === 'visible' || document.visibilityState === 'hidden' ? document.visibilityState : 'unknown',
      widget: widgetState, script: window.turnstile ? 'available' : 'unavailable', recovery,
    };
  }

  function report(stage: string, status?: number, phase: SubscriptionPhase = active?.phase ?? 'idle', provider?: { errorCode: unknown }, operation: SubscriptionOperationEvidence = active?.operation ?? { state: 'not-started' }, context = diagnosticContext(active, active ? 'manual-retry' : 'no-attempt')): void {
    try {
      logger.report({
        type: 'interaction_error', component: 'subscribe_form', message: stage, status,
        subscriptionEvidence: captureSubscriptionError(phase, provider, operation, context),
      });
    } catch {
      // Reporting must not break the form's recovery path.
    }
  }

  function clearDeadline(attempt: Attempt): void {
    if (attempt.timer !== null) window.clearTimeout(attempt.timer);
    attempt.timer = null;
  }

  function removeWidget(attempt: Attempt | null = active): void {
    const previous = widget;
    widget = null; // Ignore callbacks from a removed or failed challenge.
    widgetState = 'removed';
    if (previous && previous.id !== null) {
      try {
        previous.api.remove(previous.id);
      } catch {
        report('subscribe_widget_remove_exception', undefined, attempt?.phase ?? 'idle', undefined, attempt?.operation ?? { state: 'not-started' });
        if (slot instanceof HTMLElement) slot.replaceChildren();
      }
    } else if (previous && slot instanceof HTMLElement) {
      slot.replaceChildren();
    }
  }

  function fail(stage: string, text: string, status?: number, provider?: { errorCode: unknown }): void {
    const attempt = active;
    const phase = attempt?.phase ?? 'idle';
    const context = diagnosticContext(attempt, attempt ? 'manual-retry' : 'no-attempt');
    active = null;
    if (attempt) {
      clearDeadline(attempt);
      attempt.controller?.abort();
    }
    removeWidget(attempt);
    // An idle provider failure is useful evidence, not a failed subscription.
    if (attempt) msg.textContent = text;
    form.removeAttribute('aria-busy');
    btn.disabled = false;
    report(stage, status, phase, provider, attempt?.operation ?? { state: 'not-started' }, context);
  }
}

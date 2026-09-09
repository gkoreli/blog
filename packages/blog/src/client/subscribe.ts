import type { ClientLogger } from '@gkoreli/client-observability/client';

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
      retry?: 'auto' | 'never';
      'refresh-expired'?: 'auto' | 'manual' | 'never';
      'refresh-timeout'?: 'auto' | 'manual' | 'never';
      'response-field'?: boolean;
      callback?: (token: string) => void;
      'error-callback'?: (errorCode: string) => boolean | void;
      'expired-callback'?: () => void;
      'timeout-callback'?: () => void;
      'unsupported-callback'?: () => void;
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
const REQUEST_TIMEOUT_MS = 35_000;

interface Attempt {
  email: string;
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

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (active) return;
    if (!emailInput.checkValidity()) { emailInput.reportValidity(); return; }

    const attempt: Attempt = {
      email: emailInput.value.trim(), phase: 'verifying', timer: null, controller: null,
    };
    active = attempt;
    btn.disabled = true;
    form.setAttribute('aria-busy', 'true');
    msg.textContent = 'Verifying…';

    // Retry initialization here when the external script arrived after our module.
    if (!initWidget(true) || !widget || widget.id === null
      || active !== attempt || attempt.phase !== 'verifying') return;
    attempt.timer = window.setTimeout(() => {
      if (active === attempt) {
        fail('subscribe_widget_deadline', 'Verification took too long. Please try again.');
      }
    }, VERIFICATION_TIMEOUT_MS);

    try {
      widget.api.execute(widget.id);
    } catch {
      if (active === attempt) {
        fail('subscribe_widget_execute_exception', 'Verification could not start. Please try again.');
      }
    }
  });

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
    try {
      const id = api.render(slot, {
        sitekey, execution: 'execute', appearance: 'execute', theme: 'auto', action: 'subscribe',
        retry: 'never', 'refresh-expired': 'manual', 'refresh-timeout': 'manual', 'response-field': false,
        callback(token) {
          if (widget === current && active?.phase === 'verifying') void doSubmit(active, token);
        },
        'error-callback'() {
          if (widget === current) fail('subscribe_widget_error', 'Verification failed. Please try again.');
          return true;
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
    clearDeadline(attempt);
    const controller = new AbortController();
    attempt.controller = controller;
    attempt.timer = window.setTimeout(() => {
      if (active === attempt) {
        fail('subscribe_request_timeout', 'The request took too long. Check for a confirmation email before trying again.');
      }
    }, REQUEST_TIMEOUT_MS);
    msg.textContent = 'Submitting…';

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: attempt.email, turnstile: token, source: subscriptionSource() }),
        signal: controller.signal,
      });
      if (active !== attempt) return;
      if (res.status === 202) {
        clearDeadline(attempt);
        active = null;
        removeWidget();
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

  function report(stage: string, status?: number): void {
    try {
      logger.report({
        type: 'interaction_error', component: 'subscribe_form', message: stage, status,
      });
    } catch {
      // Reporting must not break the form's recovery path.
    }
  }

  function clearDeadline(attempt: Attempt): void {
    if (attempt.timer !== null) window.clearTimeout(attempt.timer);
    attempt.timer = null;
  }

  function removeWidget(): void {
    const previous = widget;
    widget = null; // Ignore callbacks from a removed or failed challenge.
    if (previous && previous.id !== null) {
      try {
        previous.api.remove(previous.id);
      } catch {
        report('subscribe_widget_remove_exception');
        if (slot instanceof HTMLElement) slot.replaceChildren();
      }
    } else if (previous && slot instanceof HTMLElement) {
      slot.replaceChildren();
    }
  }

  function fail(stage: string, text: string, status?: number): void {
    const attempt = active;
    active = null;
    if (attempt) {
      clearDeadline(attempt);
      attempt.controller?.abort();
    }
    removeWidget();
    msg.textContent = text;
    form.removeAttribute('aria-busy');
    btn.disabled = false;
    report(stage, status);
  }
}

import { captureSubscriptionError, captureSubscriptionResponse, type ClientLogger, type SubscriptionPhase, type SubscriptionOperationEvidence, type SubscriptionDiagnosticContext } from '@gkoreli/client-observability/client';
import { SubscriptionAttempt, verificationToken, type RequestObservation } from './subscription-attempt.js';
import { readTurnstileApi, observeTurnstileLoad, type TurnstileApi } from './turnstile-adapter.js';
import { readAcceptedResponse, rejectedRequestMessage, discard } from './subscription-response.js';
import { serializeSubscriptionRequest } from './subscription-request.js';

interface SubscribeOptions { logger: ClientLogger; }
interface WidgetLease { api: TurnstileApi; id: string | undefined; retired: boolean; }
interface AttemptResources {
  attempt: SubscriptionAttempt;
  email: string;
  source: string;
  widget: WidgetLease | undefined;
  widgetState: SubscriptionDiagnosticContext['widget'];
  operation: SubscriptionOperationEvidence;
  timer: number | undefined;
  stopLoading: (() => void) | undefined;
  controller: AbortController | undefined;
  responseStatus: number | undefined;
}

const initializedForms = new WeakSet<HTMLFormElement>();
const ATTRIBUTION_PARAMS = ['utm_source', 'utm_campaign'] as const;
const ACCEPTED_MESSAGE = 'Request accepted. New subscriptions need email confirmation—check your inbox and spam folder. Already subscribed? You’re all set. No confirmation email? You can try again in ten minutes.';
const UNCONFIRMED_MESSAGE = 'We could not confirm the request. Check your inbox before trying again in ten minutes.';

/** Optional attribution cannot consume the request budget or prevent a subscription. */
function subscriptionSource(): string {
  try {
    const source = new URL(location.pathname.slice(0, 200), location.origin);
    const current = new URLSearchParams(location.search);
    for (const key of ATTRIBUTION_PARAMS) {
      const value = current.get(key)?.trim();
      if (value) {
        source.searchParams.set(key, value.slice(0, 80));
        if (source.pathname.length + source.search.length > 600) source.searchParams.delete(key);
      }
    }
    if (document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        if (referrer.origin !== location.origin) {
          source.searchParams.set('ref', referrer.hostname.replace(/^www\./, '').slice(0, 100));
          if (source.pathname.length + source.search.length > 600) source.searchParams.delete('ref');
        }
      } catch { /* Attribution is optional. */ }
    }
    return `${source.pathname}${source.search}`;
  } catch { return ''; }
}

/** Every form owns its own attempts; the DOM marker is evidence, not the init lock. */
export function initSubscribeForm({ logger }: SubscribeOptions): void {
  for (const candidate of document.querySelectorAll('form.subscribe-form, form#sub-form')) {
    if (!(candidate instanceof HTMLFormElement) || initializedForms.has(candidate)) continue;
    const input = candidate.elements.namedItem('email');
    const button = candidate.querySelector('.subscribe-btn');
    const message = candidate.querySelector('.subscribe-msg');
    const slot = candidate.querySelector('.turnstile-slot');
    if (!(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement) || !(message instanceof HTMLElement)) continue;
    initializedForms.add(candidate);
    candidate.dataset['subscribeInit'] = 'true';
    installForm(candidate, input, button, message, slot instanceof HTMLElement ? slot : null, logger);
  }
}

function installForm(form: HTMLFormElement, input: HTMLInputElement, button: HTMLButtonElement, message: HTMLElement, slot: HTMLElement | null, logger: ClientLogger): void {
  let current: AttemptResources | undefined;
  const now = () => performance.now();

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (current) return;
    if (!input.checkValidity()) { input.reportValidity(); return; }
    const resource: AttemptResources = {
      attempt: new SubscriptionAttempt(crypto.randomUUID(), now()), email: input.value.trim(), source: subscriptionSource(),
      widget: undefined, widgetState: 'waiting-api', operation: { state: 'not-started' },
      timer: undefined, stopLoading: undefined, controller: undefined, responseStatus: undefined,
    };
    current = resource;
    showPending('Verifying…');
    scheduleDeadline(resource);
    prepareWidget(resource);
  });
  button.disabled = false;

  function owns(resource: AttemptResources): boolean { return current === resource; }
  function verifying(resource: AttemptResources): boolean {
    if (!owns(resource) || resource.attempt.state.phase !== 'verifying') return false;
    if (resource.attempt.expired(now())) { expire(resource); return false; }
    return true;
  }
  function liveWidget(resource: AttemptResources, widget: WidgetLease): boolean {
    return owns(resource) && resource.widget === widget && !widget.retired;
  }
  function showPending(text: string): void {
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    form.dataset['subscribeStatus'] = 'pending';
    message.textContent = text;
  }
  function showFinished(status: 'success' | 'error', text: string): void {
    button.disabled = false;
    form.removeAttribute('aria-busy');
    form.dataset['subscribeStatus'] = status;
    message.textContent = text;
  }
  function stopWaiting(resource: AttemptResources): void {
    resource.stopLoading?.(); resource.stopLoading = undefined;
  }
  function clearDeadline(resource: AttemptResources): void {
    if (resource.timer !== undefined) window.clearTimeout(resource.timer);
    resource.timer = undefined;
  }
  function scheduleDeadline(resource: AttemptResources): void {
    clearDeadline(resource);
    const state = resource.attempt.state;
    if (!owns(resource) || state.phase === 'settled') return;
    resource.timer = window.setTimeout(() => {
      resource.timer = undefined;
      if (!owns(resource)) return;
      if (resource.attempt.expired(now())) expire(resource);
      else scheduleDeadline(resource);
    }, Math.max(0, Math.ceil(state.deadlineAt - now())));
  }
  function expire(resource: AttemptResources): void {
    if (!owns(resource)) return;
    if (resource.attempt.state.phase === 'verifying') {
      failVerification(resource, 'subscribe_widget_deadline', 'Verification took too long. Please try again.');
    } else if (resource.attempt.state.phase === 'sending') {
      finishRequest(resource, 'response-unavailable', 'subscribe_request_timeout',
        'The request took too long. Check for a confirmation email before trying again.');
    }
  }

  function prepareWidget(resource: AttemptResources): void {
    if (!verifying(resource) || resource.attempt.state.phase !== 'verifying' || resource.attempt.state.step !== 'waiting-api') return;
    const sitekey = form.dataset['turnstileSitekey']?.trim();
    if (!sitekey || !slot) {
      failVerification(resource, 'subscribe_widget_configuration_missing', 'Subscriptions are temporarily unavailable. Please try again later.');
      return;
    }
    const api = readTurnstileApi();
    if (!api) {
      resource.widgetState = 'waiting-api';
      if (window.gkTurnstileScriptState === 'loading') {
        if (!resource.stopLoading) resource.stopLoading = observeTurnstileLoad(() => prepareWidget(resource));
      } else failVerification(resource, 'subscribe_widget_unavailable', 'Verification has not loaded. Please refresh the page and try again.');
      return;
    }
    stopWaiting(resource);
    if (!resource.attempt.startRendering(now())) return;
    const widget: WidgetLease = { api, id: undefined, retired: false };
    resource.widget = widget; resource.widgetState = 'rendering';
    try {
      const id = api.render(slot, {
        sitekey, execution: 'execute', appearance: 'interaction-only', size: 'compact', theme: 'auto', action: 'subscribe',
        retry: 'never', 'refresh-expired': 'manual', 'refresh-timeout': 'manual', 'response-field': false,
        callback(token) {
          if (!liveWidget(resource, widget) || !verifying(resource)) return;
          const parsed = verificationToken(token);
          if (!parsed.ok) {
            failVerification(resource, parsed.reason === 'empty' ? 'subscribe_widget_empty_token' : 'subscribe_widget_invalid_token',
              'Verification failed. Please try again.');
            return;
          }
          const body = serializeSubscriptionRequest(resource.email, parsed.token, resource.source);
          if (body === undefined) {
            failVerification(resource, 'subscribe_request_too_large', 'Verification could not complete. Please try again.');
          } else if (resource.attempt.handoff(now())) void send(resource, body);
          else if (resource.attempt.expired(now())) expire(resource);
          else failVerification(resource, 'subscribe_widget_unexpected_token', 'Verification could not complete. Please try again.');
        },
        'error-callback'(code) {
          if (!liveWidget(resource, widget) || !verifying(resource)) return true;
          const evidence = diagnosticContext(resource, 'automatic-retry');
          if (resource.attempt.recover(code, now())) {
            showPending('Verification interrupted. Retrying…');
            retireWidget(resource, widget);
            report(resource, 'subscribe_widget_error', 'verifying', undefined, { errorCode: code }, evidence);
            prepareWidget(resource);
          } else failVerification(resource, 'subscribe_widget_error', 'Verification failed. Please try again.', { errorCode: code });
          return true; // Application owns recovery and logging; provider retry is disabled.
        },
        'before-interactive-callback'() {
          if (!liveWidget(resource, widget) || !verifying(resource) || !resource.attempt.beforeInteraction(now())) return;
          resource.widgetState = 'interactive';
          showPending('Complete the verification below to subscribe.');
          scheduleDeadline(resource);
        },
        'after-interactive-callback'() {
          if (!liveWidget(resource, widget) || !verifying(resource) || !resource.attempt.afterInteraction(now())) return;
          resource.widgetState = 'verifying'; showPending('Verifying…');
        },
        'expired-callback'() {
          if (liveWidget(resource, widget) && verifying(resource)) failVerification(resource, 'subscribe_widget_expired', 'Verification expired. Please try again.');
        },
        'timeout-callback'() {
          if (liveWidget(resource, widget) && verifying(resource)) failVerification(resource, 'subscribe_widget_timeout', 'Verification timed out. Please try again.');
        },
        'unsupported-callback'() {
          if (liveWidget(resource, widget) && verifying(resource)) failVerification(resource, 'subscribe_widget_unsupported', 'Verification does not support this browser. Please try another browser.');
        },
      });
      if (typeof id !== 'string' || !id.trim()) {
        if (liveWidget(resource, widget) && verifying(resource)) failVerification(resource, 'subscribe_widget_render_exception', 'Verification could not load. Please try again.');
        return;
      }
      widget.id = id;
      if (widget.retired || !liveWidget(resource, widget)) { removeProviderWidget(resource, widget); return; }
      if (!verifying(resource) || !resource.attempt.rendered(now())) return;
      resource.widgetState = 'ready';
      if (!resource.attempt.startExecution(now())) return;
      resource.widgetState = 'verifying';
      try { api.execute(id); }
      catch {
        // A reentrant callback may already have handed off or replaced this widget.
        if (liveWidget(resource, widget) && verifying(resource)) failVerification(resource, 'subscribe_widget_execute_exception', 'Verification could not start. Please try again.');
      }
    } catch {
      if (liveWidget(resource, widget) && verifying(resource)) failVerification(resource, 'subscribe_widget_render_exception', 'Verification could not load. Please try again.');
    }
  }

  function retireWidget(resource: AttemptResources, widget = resource.widget): void {
    if (!widget || widget.retired) return;
    widget.retired = true;
    if (resource.widget === widget) resource.widget = undefined;
    resource.widgetState = 'removed';
    removeProviderWidget(resource, widget);
  }
  function removeProviderWidget(resource: AttemptResources, widget: WidgetLease): void {
    // A late render return can be cleaned up after its replacement already exists.
    // Only the slot's current lease may use a whole-container fallback.
    const mayClearSlot = () => (!current || owns(resource)) && (!resource.widget || resource.widget === widget);
    try {
      if (widget.id !== undefined) widget.api.remove(widget.id);
      else if (mayClearSlot() && slot) slot.replaceChildren();
    } catch {
      if (mayClearSlot() && slot) slot.replaceChildren();
      report(resource, 'subscribe_widget_remove_exception', resource.attempt.state.phase === 'sending' ? 'sending' : 'verifying');
    }
  }
  function failVerification(resource: AttemptResources, stage: string, text: string, provider?: { errorCode: unknown }): void {
    if (!owns(resource)) return;
    const evidence = diagnosticContext(resource, 'manual-retry');
    if (!resource.attempt.failVerification()) return;
    current = undefined; clearDeadline(resource); stopWaiting(resource);
    showFinished('error', text);
    retireWidget(resource);
    report(resource, stage, 'verifying', undefined, provider, evidence);
  }

  async function send(resource: AttemptResources, body: string): Promise<void> {
    resource.widgetState = 'token-received';
    resource.controller = new AbortController();
    scheduleDeadline(resource);
    showPending('Submitting…');
    retireWidget(resource);
    if (!owns(resource)) return;
    if (resource.attempt.expired(now())) { expire(resource); return; }
    try {
      resource.operation = { state: 'response-unavailable' };
      const response = await fetch('/api/subscribe', {
        method: 'POST', redirect: 'error',
        headers: { 'content-type': 'application/json', 'x-subscription-attempt-id': resource.attempt.id },
        body,
        signal: resource.controller.signal,
      });
      if (!owns(resource)) { discard(response); return; }
      resource.responseStatus = response.status;
      resource.operation = captureSubscriptionResponse(response.headers.get('x-request-id'), response.redirected);
      if (resource.attempt.expired(now())) { discard(response); expire(resource); return; }
      if (response.status === 202 && !response.redirected) {
        const body = await readAcceptedResponse(response, resource.controller.signal);
        if (!owns(resource)) return;
        if (resource.attempt.expired(now())) { expire(resource); return; }
        if (body.confirmed) finishRequest(resource, 'accepted-response');
        else finishRequest(resource, 'response-unavailable', 'subscribe_response_' + body.reason, UNCONFIRMED_MESSAGE);
      } else if (response.redirected || (response.status >= 200 && response.status < 300)) {
        discard(response);
        finishRequest(resource, 'response-unavailable', 'subscribe_response_unexpected_status', UNCONFIRMED_MESSAGE);
      } else {
        discard(response);
        finishRequest(resource, 'rejected-response', 'subscribe_api_rejected', rejectedRequestMessage(response.status, response.headers.get('retry-after')));
      }
    } catch {
      if (owns(resource)) finishRequest(resource, 'response-unavailable', 'subscribe_network_error', 'Connection failed. Check for a confirmation email before trying again.');
    }
  }
  function finishRequest(resource: AttemptResources, observation: RequestObservation, stage?: string, text = ''): void {
    if (!owns(resource)) return;
    const evidence = diagnosticContext(resource, 'manual-retry');
    if (!resource.attempt.settleRequest(observation, now())) {
      if (resource.attempt.expired(now())) expire(resource);
      return;
    }
    current = undefined; clearDeadline(resource); stopWaiting(resource);
    showFinished(observation === 'accepted-response' ? 'success' : 'error', observation === 'accepted-response' ? ACCEPTED_MESSAGE : text);
    if (observation !== 'accepted-response') resource.controller?.abort();
    retireWidget(resource);
    if (stage) report(resource, stage, 'sending', resource.responseStatus, undefined, evidence);
  }
  function diagnosticContext(resource: AttemptResources, recovery: SubscriptionDiagnosticContext['recovery']): SubscriptionDiagnosticContext {
    return {
      attemptId: resource.attempt.id,
      elapsedMs: Math.min(300_000, Math.max(0, Math.floor(now() - resource.attempt.startedAt))),
      online: typeof navigator.onLine === 'boolean' ? navigator.onLine ? 'online' : 'offline' : 'unknown',
      visibility: document.visibilityState === 'visible' || document.visibilityState === 'hidden' ? document.visibilityState : 'unknown',
      widget: resource.widgetState, script: readTurnstileApi() ? 'available' : 'unavailable', recovery,
    };
  }
  function report(resource: AttemptResources, stage: string, phase: SubscriptionPhase, status?: number, provider?: { errorCode: unknown }, context = diagnosticContext(resource, 'manual-retry')): void {
    try {
      logger.report({ type: 'interaction_error', component: 'subscribe_form', message: stage, status,
        subscriptionEvidence: captureSubscriptionError(phase, provider, resource.operation, context) });
    } catch { /* Diagnostics cannot interrupt recovery or a newer attempt. */ }
  }
}

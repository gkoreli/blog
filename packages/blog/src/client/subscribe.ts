/** Minimal Turnstile API surface we use */
interface Turnstile {
  render(
    container: string | HTMLElement,
    options: {
      sitekey: string;
      execution?: 'render' | 'execute';
      appearance?: 'always' | 'execute' | 'interaction-only';
      theme?: 'auto' | 'light' | 'dark';
      callback?: (token: string) => void;
      'error-callback'?: (errorCode: string) => boolean | void;
      'expired-callback'?: () => void;
    }
  ): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

function initSubscribeForm(): void {
  const formEl = document.getElementById('sub-form') as HTMLFormElement | null;
  if (!formEl) return;

  // Init guard — prevents double-listener if initSubscribeForm is called more than once
  if (formEl.dataset['subscribeInit'] === 'true') return;
  formEl.dataset['subscribeInit'] = 'true';

  const rawInput = formEl.elements.namedItem('email');
  const rawBtn = formEl.querySelector<HTMLButtonElement>('.subscribe-btn');
  const rawMsg = formEl.querySelector<HTMLElement>('.subscribe-msg');
  const slot = formEl.querySelector<HTMLElement>('.turnstile-slot');

  if (!(rawInput instanceof HTMLInputElement) || !rawBtn || !rawMsg) return;

  // Capture non-nullable references. TypeScript narrows these at the assignment point
  // but doesn't carry narrowing across async/closure boundaries, so we rebind explicitly.
  const form = formEl;           // HTMLFormElement (non-null past guard)
  const emailInput = rawInput;   // HTMLInputElement (narrowed by instanceof)
  const btn = rawBtn;            // HTMLButtonElement (non-null past guard)
  const msg = rawMsg;            // HTMLElement (non-null past guard)

  const sitekey = form.dataset['turnstileSitekey'];
  let widgetId: string | null = null;
  let submitting = false;

  if (sitekey && slot && window.turnstile) {
    widgetId = window.turnstile.render(slot, {
      sitekey,
      execution: 'execute',
      appearance: 'execute',
      theme: 'auto',
      callback(token) { void doSubmit(token); },
      'error-callback'() { setError('Verification failed. Retry once, or allow bot protection for this site.'); return true; },
      'expired-callback'() { if (widgetId) window.turnstile?.reset(widgetId); },
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (submitting) return;
    if (!emailInput.checkValidity()) { emailInput.reportValidity(); return; }

    submitting = true;
    btn.disabled = true;
    msg.textContent = '';

    if (widgetId && window.turnstile) {
      window.turnstile.execute(widgetId);
    } else {
      // Turnstile unavailable — best-effort fallback; server rate-limiting still applies
      void doSubmit('');
    }
  });

  async function doSubmit(token: string): Promise<void> {
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim(), turnstile: token, source: location.pathname }),
      });
      if (res.status === 202 || res.ok) {
        form.innerHTML = '<p class="subscribe-done">Check your inbox \u2014 confirmation link on the way.</p>';
        return;
      }
      const data = await res.json().catch((): { error?: string } => ({})) as { error?: string };
      setError(data.error ?? 'Something went wrong. Try again.');
    } catch {
      setError('Network error. Try again.');
    }
  }

  function setError(text: string): void {
    msg.textContent = text;
    if (widgetId) window.turnstile?.reset(widgetId);
    submitting = false;
    btn.disabled = false;
  }
}

// The Turnstile script uses `defer` and appears in <head>; our module is in <body>.
// Deferred scripts execute in document order after parsing, so window.turnstile
// is guaranteed to be defined by the time this module runs.
initSubscribeForm();

/** Only the native provider surface the adapter consumes; runtime values are checked. */
export interface TurnstileApi {
  ready?(callback: () => void): void;
  render(container: HTMLElement, options: TurnstileOptions): unknown;
  execute(widgetId: string): void;
  remove(widgetId: string): void;
}

export interface TurnstileOptions {
  sitekey: string;
  execution: 'execute';
  appearance: 'interaction-only';
  theme: 'auto';
  action: 'subscribe';
  size: 'compact';
  retry: 'never';
  'refresh-expired': 'manual';
  'refresh-timeout': 'manual';
  'response-field': false;
  callback(token: unknown): void;
  'error-callback'(code: unknown): boolean;
  'expired-callback'(): void;
  'timeout-callback'(): void;
  'unsupported-callback'(): void;
  'before-interactive-callback'(): void;
  'after-interactive-callback'(): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    gkTurnstileScriptState?: 'loading' | 'ready' | 'failed';
  }
}

export function readTurnstileApi(): TurnstileApi | undefined {
  try {
    const api = window.turnstile;
    return api && typeof api.render === 'function' && typeof api.execute === 'function' && typeof api.remove === 'function'
      ? api : undefined;
  } catch {
    return undefined;
  }
}

/** Subscribe only while an active attempt waits, then remove both listeners. */
export function observeTurnstileLoad(listener: () => void): () => void {
  window.addEventListener('gk-turnstile-ready', listener);
  window.addEventListener('gk-turnstile-load-failed', listener);
  return () => {
    window.removeEventListener('gk-turnstile-ready', listener);
    window.removeEventListener('gk-turnstile-load-failed', listener);
  };
}

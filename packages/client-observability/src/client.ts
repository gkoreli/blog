import { browserContext, defaultRedact } from './redact.js';
import { FetchTransport } from './transport.js';
import type { ClientErrorInput, ClientLogger, ClientLoggerConfig } from './types.js';

export { captureSubscriptionError, captureSubscriptionResponse } from './subscription-evidence.js';
export type { SubscriptionErrorEvidence, SubscriptionPhase, SubscriptionOperationEvidence, SubscriptionDiagnosticContext, TurnstileErrorEvidence } from './subscription-evidence.js';

function reasonMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  return 'Unhandled promise rejection';
}

function reasonStack(reason: unknown): string | undefined {
  return reason instanceof Error ? reason.stack : undefined;
}

export function createClientLogger(config: ClientLoggerConfig): ClientLogger {
  return {
    report(input: ClientErrorInput): void {
      const context = config.context();
      const event = config.redact(input, context);
      if (!event || !config.sample(event)) return;
      void config.transport.send(event).catch(() => {
        // Observability must never create a new user-visible failure.
        console.warn('[client:diagnostic-delivery]', { outcome: 'unconfirmed' });
      });
    },
  };
}

export function createDefaultClientLogger(options: { buildId?: string | undefined } = {}): ClientLogger {
  const buildId = options.buildId;
  let sent = 0;
  const repeats = new Map<string, number>();
  return createClientLogger({
    // keepalive supports page exit; a visible-page report can observe the storage acknowledgment.
    transport: new FetchTransport(),
    context: () => ({ ...browserContext(), buildId }),
    redact: defaultRedact,
    sample: event => {
      const signature = JSON.stringify([event.type, event.component, event.message, event.status]);
      const count = repeats.get(signature) ?? 0;
      if (sent >= 20 || count >= 3) return false;
      sent++;
      repeats.set(signature, count + 1);
      return true;
    },
  });
}

export function initClientErrorReporting(logger: ClientLogger): void {
  window.addEventListener('error', event => {
    logger.report({
      type: 'window_error',
      message: event.message || 'Window error',
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error instanceof Error ? event.error.stack : undefined,
    });
  });

  window.addEventListener('unhandledrejection', event => {
    logger.report({
      type: 'unhandled_rejection',
      message: reasonMessage(event.reason),
      stack: reasonStack(event.reason),
    });
  });
}

export type {
  ClientContext,
  ClientErrorEvent,
  ClientErrorInput,
  ClientErrorType,
  ClientLogger,
  ClientLoggerConfig,
  ClientLogTransport,
  ClientLogReceipt,
} from './types.js';

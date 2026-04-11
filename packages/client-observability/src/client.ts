import { browserContext, defaultRedact } from './redact.js';
import { BeaconTransport } from './transport.js';
import type { ClientErrorInput, ClientLogger, ClientLoggerConfig } from './types.js';

function keepAll(): boolean {
  return true;
}

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
      });
    },
  };
}

export function createDefaultClientLogger(): ClientLogger {
  return createClientLogger({
    transport: new BeaconTransport(),
    context: browserContext,
    redact: defaultRedact,
    sample: keepAll,
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
} from './types.js';

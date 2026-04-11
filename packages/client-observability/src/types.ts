export type ClientErrorType = 'window_error' | 'unhandled_rejection' | 'interaction_error';

export interface ClientContext {
  path: string;
  referrer?: string | undefined;
  userAgent?: string | undefined;
  buildId?: string | undefined;
  occurredAt: string;
}

export interface ClientErrorInput {
  type: ClientErrorType;
  message: string;
  component?: string | undefined;
  status?: number | undefined;
  source?: string | undefined;
  line?: number | undefined;
  column?: number | undefined;
  stack?: string | undefined;
}

export interface ClientErrorEvent extends ClientContext, ClientErrorInput {}

export interface ClientLogTransport {
  send(event: ClientErrorEvent): Promise<void>;
}

export interface ClientLogger {
  report(event: ClientErrorInput): void;
}

export interface ClientLoggerConfig {
  transport: ClientLogTransport;
  context: () => ClientContext;
  redact: (event: ClientErrorInput, context: ClientContext) => ClientErrorEvent | null;
  sample: (event: ClientErrorEvent) => boolean;
}

export interface ServerClientErrorEvent extends ClientErrorEvent {
  id: string;
  ray: string | null;
  country: string | null;
  colo: string | null;
  asOrganization: string | null;
}

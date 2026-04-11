import type { ClientErrorEvent, ClientLogTransport } from './types.js';

const DEFAULT_ENDPOINT = '/api/client-error';

export class FetchTransport implements ClientLogTransport {
  constructor(private readonly endpoint = DEFAULT_ENDPOINT) {}

  async send(event: ClientErrorEvent): Promise<void> {
    await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(event),
    });
  }
}

export class BeaconTransport implements ClientLogTransport {
  constructor(private readonly endpoint = DEFAULT_ENDPOINT) {}

  async send(event: ClientErrorEvent): Promise<void> {
    const body = JSON.stringify(event);
    if (navigator.sendBeacon?.(this.endpoint, new Blob([body], { type: 'application/json' }))) {
      return;
    }
    await new FetchTransport(this.endpoint).send(event);
  }
}

export class NoopTransport implements ClientLogTransport {
  async send(_event: ClientErrorEvent): Promise<void> {}
}

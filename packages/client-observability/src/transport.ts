import type { ClientErrorEvent, ClientLogReceipt, ClientLogTransport } from './types.js';

const DEFAULT_ENDPOINT = '/api/client-error';

export class FetchTransport implements ClientLogTransport {
  constructor(private readonly endpoint = DEFAULT_ENDPOINT) {}

  async send(event: ClientErrorEvent): Promise<ClientLogReceipt> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      redirect: 'error',
      body: JSON.stringify(event),
    });
    // Other 2xx responses do not satisfy this endpoint's storage-acknowledgment contract.
    if (response.status !== 204) throw new Error('client_error_report_unconfirmed');
    return { state: 'server-acknowledged' };
  }
}

export class BeaconTransport implements ClientLogTransport {
  constructor(private readonly endpoint = DEFAULT_ENDPOINT) {}

  async send(event: ClientErrorEvent): Promise<ClientLogReceipt> {
    const body = JSON.stringify(event);
    if (navigator.sendBeacon?.(this.endpoint, new Blob([body], { type: 'application/json' }))) {
      return { state: 'browser-queued' };
    }
    return new FetchTransport(this.endpoint).send(event);
  }
}

export class NoopTransport implements ClientLogTransport {
  async send(_event: ClientErrorEvent): Promise<ClientLogReceipt> {
    return { state: 'disabled' };
  }
}

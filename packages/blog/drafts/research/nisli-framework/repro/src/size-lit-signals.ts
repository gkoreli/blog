import { LitElement, html } from 'lit';
import { SignalWatcher, signal, watch } from '@lit-labs/signals';
class Counter extends SignalWatcher(LitElement) {
  count = signal(0);
  protected createRenderRoot() { return this; }
  protected render() { return html`<button @click=${() => this.count.set(this.count.get() + 1)}>Count: ${watch(this.count)}</button>`; }
}
customElements.define('size-counter', Counter);
document.body.append(document.createElement('size-counter'));

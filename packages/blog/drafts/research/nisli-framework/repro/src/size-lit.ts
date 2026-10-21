import { LitElement, html } from 'lit';
class Counter extends LitElement {
  static properties = { count: { state: true } };
  declare count: number;
  constructor() { super(); this.count = 0; }
  protected createRenderRoot() { return this; }
  protected render() { return html`<button @click=${() => this.count++}>Count: ${this.count}</button>`; }
}
customElements.define('size-counter', Counter);
document.body.append(document.createElement('size-counter'));

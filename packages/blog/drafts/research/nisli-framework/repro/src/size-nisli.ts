import { component, html, signal } from '@nisli/core';
component('size-counter', () => {
  const count = signal(0);
  return html`<button @click=${() => count.value++}>Count: ${count}</button>`;
});
document.body.append(document.createElement('size-counter'));

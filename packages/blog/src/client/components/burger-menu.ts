import { component, html, signal, computed, effect } from '@nisli/core';
import { utilityIconStyle } from '../../templates/utility-icon.js';

const open = signal(false);

component('nisli-burger-menu', () => {
  const toggle = () => { open.value = !open.value; };
  const close = () => { open.value = false; };

  const iconStyle = computed(() => utilityIconStyle(open.value ? 'close' : 'menu'));
  const expanded = computed(() => String(open.value));

  effect(() => {
    const isOpen = open.value;
    document.body.classList.toggle('menu-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    return undefined;
  });

  return html`
    <button @click=${toggle} class="burger-btn" aria-label="Menu" aria-expanded=${expanded}>
      <span class="ui-icon" aria-hidden="true" style=${iconStyle}></span>
    </button>
  `;
});

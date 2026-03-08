import { component, html, signal, computed, effect } from '@nisli/core';

const open = signal(false);

component('nisli-burger-menu', () => {
  const toggle = () => { open.value = !open.value; };
  const close = () => { open.value = false; };

  const iconSrc = computed(() => open.value ? '/icons/close.svg' : '/icons/menu.svg');
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
  });

  return html`
    <button @click=${toggle} class="burger-btn" aria-label="Menu" aria-expanded=${expanded}>
      <img src=${iconSrc} width="20" height="20" alt="">
    </button>
  `;
});

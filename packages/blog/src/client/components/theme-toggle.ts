import { component, html, signal, effect, computed } from '@nisli/core';

const isDark = signal(false);

function initTheme() {
  const stored = localStorage.getItem('theme');
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  isDark.value = stored ? stored === 'dark' : prefersDark;
}

component('nisli-theme-toggle', () => {
  initTheme();

  effect(() => {
    const dark = isDark.value;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  });

  const label = computed(() => isDark.value ? '☀️ Light' : '🌙 Dark');
  const toggle = () => { isDark.value = !isDark.value; };

  return html`
    <button @click=${toggle}>${label}</button>
  `;
});

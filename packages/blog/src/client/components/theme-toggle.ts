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

  const lightActive = computed(() => isDark.value ? '' : 'active');
  const darkActive = computed(() => isDark.value ? 'active' : '');
  const setLight = () => { isDark.value = false; };
  const setDark = () => { isDark.value = true; };

  return html`
    <div class="theme-toggle">
      <button @click=${setLight} class=${lightActive} aria-label="Light mode" title="Light mode">
        <img src="/icons/sun.svg" width="16" height="16" alt="">
      </button>
      <button @click=${setDark} class=${darkActive} aria-label="Dark mode" title="Dark mode">
        <img src="/icons/moon.svg" width="16" height="16" alt="">
      </button>
    </div>
  `;
});

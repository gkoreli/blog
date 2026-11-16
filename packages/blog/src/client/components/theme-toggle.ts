import { component, html, signal, effect, computed } from '@nisli/core';
import { utilityIconStyle } from '../../templates/utility-icon.js';

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

  const action = computed(() => isDark.value ? 'Switch to light mode' : 'Switch to dark mode');
  const iconStyle = computed(() => utilityIconStyle(isDark.value ? 'sun' : 'moon'));
  const toggle = () => { isDark.value = !isDark.value; };

  return html`
    <div class="theme-toggle">
      <button type="button" @click=${toggle} class="icon-control" aria-label=${action}>
        <span class="ui-icon" aria-hidden="true" style=${iconStyle}></span>
      </button>
    </div>
  `;
});

import { html } from '@nisli/core';

export function toolNavigation(current: 'overview' | 'check' | 'request' | 'robots' | 'compare') {
  const links = [
    { id: 'overview', href: '/tools', label: 'Overview' },
    { id: 'check', href: '/ai-check', label: 'Page check' },
    { id: 'request', href: '/tools/request-inspector', label: 'Requests' },
    { id: 'robots', href: '/tools/robots', label: 'Robots' },
    { id: 'compare', href: '/tools/compare', label: 'Compare' },
  ];
  return html`<nav class="tool-navigation" aria-label="Tools">${links.map(link => current === link.id
    ? html`<a href=${link.href} aria-current="page">${link.label}</a>`
    : html`<a href=${link.href}>${link.label}</a>`)}</nav>`;
}

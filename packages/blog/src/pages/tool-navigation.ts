import { sectionNavigation } from '../templates/section-navigation.js';

export function toolNavigation(current: 'overview' | 'check' | 'request' | 'robots' | 'compare') {
  const links = [
    { id: 'overview', href: '/tools', label: 'Overview' },
    { id: 'check', href: '/ai-check', label: 'Page check' },
    { id: 'request', href: '/tools/request-inspector', label: 'Requests' },
    { id: 'robots', href: '/tools/robots', label: 'Robots' },
    { id: 'compare', href: '/tools/compare', label: 'Compare' },
  ];
  return sectionNavigation('Tools', links, { className: 'tool-navigation', currentHref: links.find(link => link.id === current)?.href ?? '/tools', currentKind: 'page' });
}

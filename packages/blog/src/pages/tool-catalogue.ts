import type { NavigationChoice } from '../templates/navigation-choice.js';

export const toolCatalogue: readonly NavigationChoice[] = [
  { id: 'page', href: '/ai-check', label: 'Page check', summary: 'Check access, HTML and page structure.', meta: '10 shared checks / day', drawing: 'page' },
  { id: 'robots', href: '/tools/robots', label: 'Robots playground', summary: 'Find the rule for a crawler and path.', meta: 'Local · unlimited', drawing: 'robots' },
  { id: 'compare', href: '/tools/compare', label: 'Report comparison', summary: 'See what changed between two reports.', meta: 'Local · no uploads', drawing: 'compare' },
  { id: 'request', href: '/tools/request-inspector', label: 'Request inspector', summary: 'Explain your request’s context and claims.', meta: '10 shared checks / day', drawing: 'request' },
];

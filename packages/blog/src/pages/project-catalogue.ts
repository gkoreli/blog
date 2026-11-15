import type { NavigationChoice } from '../templates/navigation-choice.js';

/** Published project descriptions, presented through the shared destination pattern. */
export function projectCatalogue(): readonly NavigationChoice[] {
  return [
    { id: 'ghx', href: 'https://github.com/gkoreli/ghx', label: 'ghx', drawing: 'code-map', meta: 'Code reconnaissance', summary: 'Auditable code reconnaissance for AI agents. A specialized sidecar explores GitHub and returns schema-validated claims, evidence, commands, and uncertainty instead of a transcript.' },
    { id: 'backlog', href: 'https://github.com/gkoreli/backlog-mcp', label: 'backlog-mcp', drawing: 'memory', meta: 'Context & memory', summary: 'Local-first context, memory, and work history for AI agents. Agents orient, recall decisions, attach artifacts, and search their own history while humans retain plain markdown they can read and diff.' },
    { id: 'nisli', href: 'https://www.npmjs.com/package/@nisli/core', label: '@nisli/core', drawing: 'reactivity', meta: 'Reactive interfaces', summary: "A zero-dependency reactive web component framework. Born from building backlog-mcp's web viewer, with fine-grained signals, light-DOM templates, dependency injection, routing, and static generation." },
    { id: 'publication', href: 'https://github.com/gkoreli/blog', label: 'gkoreli.com', drawing: 'publication', meta: 'Engineering publication', summary: 'This publication. Built with @nisli/core and deployed on Cloudflare Workers. The source is public.' },
  ];
}

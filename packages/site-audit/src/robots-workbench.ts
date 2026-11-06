import { parseRobots, evaluateRobots } from './robots.js';
import { ROBOTS_WORKBENCH_PROFILE, type RobotsWorkbenchInput, type RobotsWorkbenchResult } from './product-contracts.js';

export class WorkbenchInputError extends Error {
  constructor() { super('Use robots text up to 512 KiB, a product token of 1–128 letters/hyphens/underscores and a path up to 2,048 characters starting with /.'); this.name = 'WorkbenchInputError'; }
}
/** Entirely local: no fetch, identity, persistence or quota admission. */
export function evaluateRobotsWorkbench(input: RobotsWorkbenchInput): RobotsWorkbenchResult {
  if (new TextEncoder().encode(input.robots).byteLength > 524_288 || !/^[a-z_-]{1,128}$/i.test(input.token)
    || input.path.length > 2048 || !input.path.startsWith('/') || /[\u0000-\u0020\u007f#]/.test(input.path)) throw new WorkbenchInputError();
  const document = parseRobots(input.robots);
  const result = evaluateRobots(document, input.token, input.path);
  return { profile: ROBOTS_WORKBENCH_PROFILE, ...result, groups: document.groups.length,
    rules: document.groups.reduce((sum, group) => sum + group.rules.length, 0), complete: document.complete && result.decision !== 'unknown',
    limits: ['Local interpretation of supplied policy text and path only. No page was fetched and no provider was authenticated.',
      'A User-Agent product token, robots permission, indexing intent and actual provider behavior are different facts.',
      'Generic group/path rules apply; vendor-specific exceptions such as Exa fallback are outside this workbench.',
      'Parser and wildcard work budgets are the same as the site checker. Exceeded limits return unknown, never a partial policy verdict.'] };
}

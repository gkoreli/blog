import { READER_GROUPS, isReaderKind, readerGroupOf, type StatsQuery, type TrafficFilter } from './contracts.js';
import { KNOWN_AGENT_NAMES } from './classify.js';
import { agentReaderKinds } from './readerkind.js';
import { parseStatsRange } from './dates.js';

function parseTrafficFilter(value: string | null): TrafficFilter | null {
  switch (value) {
    case 'browser':
    case 'agents':
    case 'crawlers':
    case 'automation':
    case 'unresolved':
    case 'all':
      return value;
    default:
      return null;
  }
}

export function parseStatsQuery(params: URLSearchParams): StatsQuery | string {
  const rangeValue = params.get('range');
  const trafficValue = params.get('traffic');
  const rawAgent = params.get('agent');
  const rawKind = params.get('kind');
  const agent = rawAgent === null ? undefined : rawAgent;
  const range = rangeValue === null ? '30d' : parseStatsRange(rangeValue);
  if (range === null) return 'range must be 7d, 30d, 90d, or all';
  if (agent !== undefined && !KNOWN_AGENT_NAMES.has(agent)) {
    return 'agent must be a known matched User-Agent rule name';
  }
  if (rawKind !== null && !isReaderKind(rawKind)) {
    return 'kind must be one of the reader kinds';
  }
  const kind = rawKind === null ? undefined : rawKind;
  const traffic = trafficValue === null
    ? 'all'
    : parseTrafficFilter(trafficValue);
  if (traffic === null) return 'traffic must be browser, agents, crawlers, automation, unresolved, or all';
  if (agent !== undefined && kind !== undefined && kind !== 'signed-agent' && kind !== 'unresolved' && !agentReaderKinds(agent).includes(kind)) {
    return `agent ${agent} cannot be combined with kind=${kind}`;
  }
  if (kind !== undefined && traffic !== 'all' && !READER_GROUPS[traffic].includes(kind)) {
    return `kind ${kind} cannot be combined with traffic=${traffic}`;
  }
  // Historical named/signed rows retain their original fallback classification.
  if (agent !== undefined && traffic !== 'all' && traffic !== 'agents' && traffic !== 'unresolved' && !agentReaderKinds(agent).some(kind => readerGroupOf(kind) === traffic)) {
    return `agent ${agent} cannot be combined with traffic=${traffic}`;
  }

  const rawPath = params.get('path');
  const path = rawPath === null || rawPath.length === 0 ? undefined : rawPath;
  const query: StatsQuery = { range, traffic };
  if (path !== undefined) query.path = path;
  if (agent !== undefined) query.agent = agent;
  if (kind !== undefined) query.kind = kind;
  return query;
}

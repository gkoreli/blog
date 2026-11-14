import type { ReaderKind } from './contracts.js';

/** Reporting scope, independent of proof and of the original classifier.
 * Signed history retains its unknown-role fallback; it is not an AI-purpose claim.
 */
export const AGENT_ACCESS_KINDS = ['ai-assistant', 'ai-search', 'ai-crawler', 'signed-agent'] as const satisfies readonly ReaderKind[];
export type AgentAccessKind = typeof AGENT_ACCESS_KINDS[number];

export const AGENT_ROLE_LABELS: Record<AgentAccessKind, string> = {
  'ai-assistant': 'On-demand fetcher declarations',
  'ai-search': 'AI-search declarations',
  'ai-crawler': 'AI-crawler declarations',
  'signed-agent': 'Signed clients — historical or unknown role',
};

export function isAgentAccessKind(value: unknown): value is AgentAccessKind {
  return AGENT_ACCESS_KINDS.some(kind => value === kind);
}

import { READER_GROUPS, type TrafficFilter } from './contracts.js';
import { unresolvedKindSql } from './reporting-kind.js';

export interface PartitionPredicate {
  sql: string;
  values: readonly unknown[];
}

function kindList(kinds: readonly string[]): string {
  return kinds.map((kind) => `'${kind}'`).join(', ');
}

/**
 * Public filters partition rows by reader_kind, which ingestion assigns from the
 * request evidence (readerkind.ts) and migrations 0006 and 0007 assigned to history
 * with the historical mapping. New unresolved evidence has its own group.
 * Unresolved also includes missing/unrecognized stored classifications. No row
 * is rewritten; the groups remain a disjoint reporting partition of All.
 */
export function partitionPredicate(traffic: TrafficFilter): PartitionPredicate {
  if (traffic === 'all') return { sql: '', values: [] };
  if (traffic === 'unresolved') return { sql: unresolvedKindSql(), values: [] };
  return { sql: `reader_kind IN (${kindList(READER_GROUPS[traffic])})`, values: [] };
}

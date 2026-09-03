import type { TrafficFilter } from './contracts.js';
import { HOSTING_ASNS } from './networks.js';

export interface PartitionPredicate {
  sql: string;
  values: readonly unknown[];
}

function hostingAsnList(): string {
  const values: number[] = [];
  for (const asn of HOSTING_ASNS) {
    if (!Number.isFinite(asn) || !Number.isInteger(asn)) {
      throw new Error(`Hosting ASN must be a finite integer: ${asn}`);
    }
    values.push(asn);
  }
  if (values.length === 0) throw new Error('Hosting ASN list must not be empty');
  return values.join(', ');
}

export function partitionPredicate(traffic: TrafficFilter): PartitionPredicate {
  // Three ways into Browsers (ADR-0016.2, amended 2026-09-03):
  //   1. legacy beacon rows, which executed JavaScript in a browser;
  //   2. edge rows recorded before evidence collection began (has_accept_language is
  //      NULL only for those rows; ingestion always writes 0 or 1), kept so the public
  //      series stays continuous and the boundary is disclosed rather than hidden;
  //   3. edge rows with evidence that is navigation-shaped and not from a hosting ASN.
  // Browser-like is therefore "checked and failed", never "not yet checked".
  // Pre-evidence edge rows whose network was reconstructed by migration 0007 as a
  // hosting provider leave Browsers too: the network verdict does not depend on
  // request headers.
  const browser = `((observation_source = 'beacon' AND traffic_class = 'browser') OR (traffic_class = 'browser' AND has_accept_language IS NULL AND (asn IS NULL OR asn NOT IN (${hostingAsnList()}))) OR (traffic_class = 'browser' AND sec_fetch_mode = 'navigate' AND sec_fetch_dest = 'document' AND accepts_html = 1 AND has_accept_language = 1 AND (asn IS NULL OR asn NOT IN (${hostingAsnList()}))))`;

  switch (traffic) {
    case 'browser':
      return { sql: browser, values: [] };
    case 'browserlike':
      // COALESCE guards the NULL that a partially-NULL evidence row can produce before negation.
      return { sql: `traffic_class = 'browser' AND NOT COALESCE(${browser}, 0)`, values: [] };
    case 'bot':
      return { sql: "traffic_class = 'bot'", values: [] };
    case 'ai':
      return { sql: "traffic_class = 'ai'", values: [] };
    case 'all':
      return { sql: '', values: [] };
  }
}

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
  const browser = `((observation_source = 'beacon' AND traffic_class = 'browser') OR (traffic_class = 'browser' AND sec_fetch_mode = 'navigate' AND sec_fetch_dest = 'document' AND accepts_html = 1 AND has_accept_language = 1 AND (asn IS NULL OR asn NOT IN (${hostingAsnList()}))))`;

  switch (traffic) {
    case 'browser':
      return { sql: browser, values: [] };
    case 'browserlike':
      // COALESCE turns the all-NULL pre-evidence edge shape into false before negation.
      return { sql: `traffic_class = 'browser' AND NOT COALESCE(${browser}, 0)`, values: [] };
    case 'bot':
      return { sql: "traffic_class = 'bot'", values: [] };
    case 'ai':
      return { sql: "traffic_class = 'ai'", values: [] };
    case 'all':
      return { sql: '', values: [] };
  }
}

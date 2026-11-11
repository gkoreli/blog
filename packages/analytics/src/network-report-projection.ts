import { vendorNetworkStateSql } from './vendor-network-summary.js';

/** SHA-256 of the exact reporting interpretation. A changed rule requires a
 * new fingerprint and bounded rebuild; stale facts always fall back to source.
 */
export const NETWORK_REPORT_RULE_SHA256 = 'b4ab204d451563e9d6ae5f5cad57990542c5a245dd1a47c780a0b3cfeda85fd7';

/** Fixed scopes only; the application supplies bound IDs, never SQL. */
export function networkReportProjectionSql(scope: 'observation' | 'range'): string {
  return `INSERT INTO page_observation_network_facts(observation_id, rule_sha256, network_state)
    SELECT id, '${NETWORK_REPORT_RULE_SHA256}', ${vendorNetworkStateSql()}
    FROM page_observations
    WHERE vendor_ip_evidence IS NOT NULL AND ${scope === 'observation' ? 'id = ?' : 'id > ? AND id <= ?'}
      AND NOT EXISTS (SELECT 1 FROM page_observation_network_facts AS current
        WHERE current.observation_id = page_observations.id AND current.rule_sha256 = '${NETWORK_REPORT_RULE_SHA256}')
    ON CONFLICT(observation_id) DO UPDATE SET rule_sha256 = excluded.rule_sha256, network_state = excluded.network_state`;
}

/** Project only an acknowledged observation. A failed projection must never
 * undo or replay source persistence; reporting can interpret the source itself.
 */
export async function projectNetworkObservation(db: D1Database, observationId: string): Promise<void> {
  const result = await db.prepare(networkReportProjectionSql('observation')).bind(observationId).run();
  if (result.success !== true) throw new Error('Network report projection unavailable');
}

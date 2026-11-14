import { AGENT_ACCESS_KINDS, type AgentAccessResource } from './agent-access-contract.js';
import { CLIENT_REGISTRY } from './client-registry.js';
import { referralAssessmentCtes, referralRulesJson } from './referral-sql.js';
import type { ReferralPolicy } from './referral-policy.js';
import { REPORT_PROJECTION_RULE_SHA256 } from './report-projection.js';
import { PUBLIC_SIGNERS } from './signers.js';
import { NETWORK_REPORT_FACTS } from './report-fact-expressions.js';
import { signatureBasisSql } from './signature-basis.js';
import { verifierProfileSql } from './verifier-profile.js';
import { vendorNetworkStateSql } from './vendor-network-summary.js';

const fields = ['section', 'resourceId', 'kind', 'client', 'format', 'collection', 'classifier', 'source', 'basis', 'profile', 'publisher', 'network', 'networkListed', 'views', 'w0', 'w1', 'w2', 'w3', 'dayMask', 'unrecognizedTimeViews', 'windowViews', 'ownerExcludedViews', 'referralExcludedViews', 'includedViews', 'otherViews', 'projectionComplete'] as const;
type Column = typeof fields[number];
const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
const cohort = AGENT_ACCESS_KINDS.map(quote).join(',');
const dimensions = { resourceId: 'resource_id', kind: 'reader_kind', client: 'public_client', format: 'public_format' };
const metricProjection = {
  views: 'COUNT(*)', w0: 'COALESCE(SUM(day_index BETWEEN 0 AND 6),0)', w1: 'COALESCE(SUM(day_index BETWEEN 7 AND 13),0)',
  w2: 'COALESCE(SUM(day_index BETWEEN 14 AND 20),0)', w3: 'COALESCE(SUM(day_index BETWEEN 21 AND 27),0)',
  dayMask: 'COALESCE(SUM(DISTINCT CASE WHEN day_index>=0 THEN (1 << day_index) ELSE 0 END),0)',
  unrecognizedTimeViews: 'COALESCE(SUM(day_index<0),0)',
};
function select(section: string, values: Partial<Record<Column, string>>, from: string): string {
  return `SELECT ${fields.map(field => `${field === 'section' ? quote(section) : values[field] ?? 'NULL'} AS ${field}`).join(',')} FROM ${from}`;
}
// Stamps are public provenance categories; arbitrary stored text never reaches JSON.
function stamp(column: 'collection_version' | 'classifier_version'): string {
  return `CASE WHEN ${column} IS NULL THEN NULL WHEN typeof(${column})='text' AND length(${column}) BETWEEN 12 AND 17
    AND substr(${column},11,1)='.' AND substr(${column},12) NOT GLOB '*[^0-9]*'
    AND CAST(CAST(substr(${column},12) AS INTEGER) AS TEXT)=substr(${column},12)
    AND strftime('%Y-%m-%d',substr(${column},1,10),'+0 days')=substr(${column},1,10)
    AND substr(${column},1,10) GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN ${column} ELSE 'unrecognized' END`;
}

/** A read-only, single-window aggregate. Bound catalogue/name arrays avoid the
 * native 100-parameter limit; flat result columns avoid JSON's 32-argument limit.
 */
export function buildAgentAccessQueryPlan(
  resources: AgentAccessResource[], start: string, endExclusive: string, policy: ReferralPolicy, source = false,
): Array<{ sql: string; values: string[] }> {
  const networkIndex = (key: keyof typeof NETWORK_REPORT_FACTS) => Object.keys(NETWORK_REPORT_FACTS).indexOf(key);
  const net = (key: keyof typeof NETWORK_REPORT_FACTS) => `json_extract(report_network,'$[${networkIndex(key)}]')`;
  // Interpret only the evidence this report uses. Avoid evaluating unrelated
  // verification/cache diagnostics or constructing a wide JSON function call.
  const facts = source ? `WITH network AS MATERIALIZED (
      SELECT id,signature_agent,signature_status,signature_evidence,vendor_ip_evidence,${vendorNetworkStateSql()} AS network_state
      FROM page_observations WHERE id IN (SELECT id FROM agent_rows)
    ) SELECT id AS observation_id,signature_agent,signature_status,${signatureBasisSql()} AS report_signature_basis,
      ${verifierProfileSql()} AS report_verifier_profile,network_state AS access_network,
      CASE WHEN network_state='recognized' AND json_extract(vendor_ip_evidence,'$.summary.listed')=1 THEN 1 ELSE 0 END AS access_network_listed FROM network`
    : `SELECT observation_id,signature_agent,signature_status,report_signature_basis,report_verifier_profile,
      CASE WHEN ${net('notRecordedViews')}=1 THEN 'not-recorded' WHEN ${net('recognizedViews')}=1 THEN 'recognized' ELSE 'unrecognized' END AS access_network,
      CASE WHEN ${net('recognizedViews')}=1 AND ${net('listedViews')}=1 THEN 1 ELSE 0 END AS access_network_listed
      FROM page_observation_report_facts WHERE observation_id IN (SELECT id FROM agent_rows) AND rule_sha256='${REPORT_PROJECTION_RULE_SHA256}'`;
  const publisher = `CASE WHEN signature_status='verified' THEN CASE signature_agent ${PUBLIC_SIGNERS.map(({ origin, name }) => `WHEN ${quote(origin)} THEN ${quote(name)}`).join(' ')} ELSE 'Other' END ELSE 'not-recorded' END`;
  const proof = { ...dimensions, basis: 'report_signature_basis', profile: 'report_verifier_profile', publisher: 'public_publisher', network: 'public_network', networkListed: 'network_listed', views: 'COUNT(*)' };
  const history = { ...dimensions, collection: 'public_collection', classifier: 'public_classifier', source: 'public_source', ...metricProjection };
  const census = select('census', {
    windowViews: '(SELECT COUNT(*) FROM window_rows)', ownerExcludedViews: '(SELECT COUNT(*) FROM window_rows)-(SELECT COUNT(*) FROM selected)',
    referralExcludedViews: '(SELECT COUNT(*) FROM assessed WHERE referral_excluded=1)', includedViews: '(SELECT COUNT(*) FROM included)',
    otherViews: `(SELECT COUNT(*) FROM included WHERE reader_kind IS NULL OR reader_kind NOT IN (${cohort}))`,
    projectionComplete: source ? '1' : `(SELECT COUNT(*) FROM agent_rows)=(SELECT COUNT(*) FROM page_observation_report_facts WHERE observation_id IN (SELECT id FROM agent_rows) AND rule_sha256='${REPORT_PROJECTION_RULE_SHA256}')`,
  }, '(SELECT 1)');
  const coreRows = [
    census,
    select('total', metricProjection, 'facts'),
    select('role', { kind: 'reader_kind', ...metricProjection }, 'facts GROUP BY reader_kind'),
    select('resource', { resourceId: 'resource_id', ...metricProjection }, 'facts GROUP BY resource_id'),
    select('cell', { ...dimensions, ...metricProjection }, 'facts GROUP BY resource_id,reader_kind,public_client,public_format'),
  ];
  const historyRow = select('history', history, 'facts GROUP BY resource_id,reader_kind,public_client,public_format,public_collection,public_classifier,public_source');
  const proofRow = select('proof', proof, 'proof_facts GROUP BY resource_id,reader_kind,public_client,public_format,report_signature_basis,report_verifier_profile,public_publisher,public_network,network_listed');
  const base = (agentOnly: boolean) => `WITH RECURSIVE
      names AS MATERIALIZED (SELECT value AS name FROM json_each(?5)),
      window_rows AS MATERIALIZED (
        SELECT id,path,daily_client_id,is_owner,referrer_host,reader_kind,agent_name,representation,observed_at,collection_version,classifier_version,observation_source
        FROM page_observations WHERE observed_at>=?1 AND observed_at<?2${agentOnly ? ` AND reader_kind IN (${cohort})` : ''}
      ),
      selected AS MATERIALIZED (
        SELECT * FROM window_rows WHERE is_owner=0 AND NOT EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=window_rows.daily_client_id)
      ),
      ${referralAssessmentCtes("SELECT DISTINCT referrer_host AS original,lower(rtrim(referrer_host,'.')) AS normalized FROM selected WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253", 3)},
      assessed AS MATERIALIZED (SELECT *,COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0) AS referral_excluded FROM selected),
      included AS MATERIALIZED (SELECT * FROM assessed WHERE referral_excluded=0),
      agent_rows AS MATERIALIZED (SELECT * FROM included WHERE reader_kind IN (${cohort})),
      facts AS MATERIALIZED (
        SELECT CASE WHEN json_extract(?4,'$.'||json_quote(i.path)||'[1]') IS i.path
          THEN json_extract(?4,'$.'||json_quote(i.path)||'[0]') END AS resource_id,i.reader_kind,
          CASE WHEN i.agent_name IS NULL THEN 'not-recorded' WHEN i.agent_name IN (SELECT name FROM names) THEN i.agent_name ELSE 'unrecognized' END AS public_client,
          CASE WHEN i.representation IS NULL THEN 'not-recorded' WHEN i.representation IN ('html','markdown') THEN i.representation ELSE 'unrecognized' END AS public_format,
          ${stamp('collection_version')} AS public_collection,${stamp('classifier_version')} AS public_classifier,
          CASE WHEN observation_source IS NULL THEN 'not-recorded' WHEN observation_source IN ('edge','beacon') THEN observation_source ELSE 'unrecognized' END AS public_source,
          CASE WHEN strftime('%Y-%m-%d %H:%M:%S',i.observed_at) IS i.observed_at AND substr(i.observed_at,12,2) BETWEEN '00' AND '23'
            THEN CAST(julianday(substr(i.observed_at,1,10))-julianday(substr(?1,1,10)) AS INTEGER) ELSE -1 END AS day_index,
          i.id
        FROM agent_rows AS i
      )`;
  // A bound map avoids scanning every catalogue row for every observation. Check
  // the full stored path again: JSON path parsing must never create an alias
  // (notably for malformed historical text containing a NUL).
  const resourceMap = Object.fromEntries(resources.map(resource => [resource.path, [resource.id, resource.path]]));
  const values = [start + ' 00:00:00', endExclusive + ' 00:00:00', referralRulesJson(policy), JSON.stringify(resourceMap), JSON.stringify(CLIENT_REGISTRY.map(client => client.name))];
  // The native D1 engine counts expanded CTE/compound terms. Keep independent
  // census/cells, history and evidence grains in one transactional batch, instead
  // of repeating the full evidence tree for every report section.
  return [
    { sql: base(false) + '\n' + coreRows.join('\nUNION ALL\n'), values },
    { sql: base(true) + '\n' + historyRow, values },
    { sql: base(true) + `, interpreted AS MATERIALIZED (${facts}), proof_facts AS MATERIALIZED (
      SELECT f.*,report_signature_basis,report_verifier_profile,${publisher} AS public_publisher,
        access_network AS public_network,access_network_listed AS network_listed
      FROM facts AS f JOIN interpreted AS p ON p.observation_id=f.id
    ) ` + proofRow, values },
  ];
}

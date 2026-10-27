/** Deliberately incomplete synthetic history; never production reader labels. */
export function unreportedKindFixtures() {
  const rows = [
    { kind: 'browser', reason: 'navigation-shaped-network-unlisted', client: 1 },
    { kind: 'browser', reason: null, client: 2 },
    { kind: 'ai-assistant', reason: 'ExaUser', client: 3, agent: 'ExaUser' },
    { kind: 'signed-agent', reason: 'https://crawler.exa.ai', client: 4 },
    { kind: 'signed-agent', reason: null, client: 5 },
    { kind: 'unresolved', reason: 'fetch-metadata-absent', client: 6 },
    { kind: null, reason: null, client: 7 },
    { kind: 'private-kind@example.invalid', reason: 'private-reason@example.invalid', client: 8 },
    { kind: 'another-private-kind', reason: 'another-private-reason', client: 8 },
    { kind: null, reason: null, client: 9, agent: 'ExaSearchBot' },
    { kind: null, reason: null, client: 10, at: '2026-10-01 01:00:00' },
    { kind: null, reason: null, client: 11, owner: 1 },
    { kind: null, reason: null, client: 12, referrer: 'traffic2cash.xyz' },
    { kind: null, reason: null, client: 13, path: '/other' },
    { kind: null, reason: null, client: 14, at: '2026-10-28 01:00:00' },
  ];
  return rows.map(row => ({ path: row.path ?? '/audit', client: row.client.toString(16).padStart(32, '0'), traffic: row.agent ? 'ai' : 'browser',
    owner: row.owner ?? 0, kind: row.kind, reason: row.reason, at: row.at ?? '2026-10-27 01:00:00', agent: row.agent ?? null, referrer: row.referrer ?? null }));
}
export const INSERT_UNREPORTED_FIXTURE = `INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,agent_name,referrer_host)
  VALUES(?,?,?,'desktop',?,?,?,?,?,?)`;
export function unreportedFixtureValues(row) { return [row.path,row.client,row.traffic,row.owner,row.kind,row.reason,row.at,row.agent,row.referrer]; }

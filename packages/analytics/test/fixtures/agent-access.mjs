import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { verificationEvidence } from '../../.test-dist/signature-evidence.js';
import { reportProjectionSql } from '../../.test-dist/report-projection.js';

export const ACCESS_NOW = new Date('2026-11-14T12:34:56.000Z');
export const ACCESS_CATALOGUE = [
  { id: 'article-a', path: '/article-a', title: 'Article A', role: 'article', articleId: null, collection: 'page' },
  { id: 'article-b', path: '/article-b', title: 'Article B', role: 'article', articleId: null, collection: 'page' },
  { id: 'article-zero', path: '/article-zero', title: 'No retained events', role: 'article', articleId: null, collection: 'page' },
  { id: 'evidence-a', path: '/reference-a', title: 'Reference A', role: 'evidence', articleId: 'article-a', collection: 'page' },
  { id: 'archive-a', path: '/downloads/a.zip', title: 'Download A', role: 'evidence', articleId: 'article-a', collection: 'not-collected' },
  { id: 'home', path: '/', title: 'Home', role: 'site', articleId: null, collection: 'page' },
];
export function accessRows() {
  const current = verificationEvidence(new Request('https://fixture.example/article-a'), { status: 'absent' });
  const base = {
    path: '/article-a', daily_client_id: 'fixture-client', traffic_class: 'ai', device_type: 'desktop', is_owner: 0,
    reader_kind: 'ai-assistant', reader_reason: 'fixture', agent_name: 'ChatGPT-User', representation: 'html',
    observed_at: '2026-10-17 00:00:00', observation_source: 'edge', collection_version: '2026-11-13.1', classifier_version: '2026-11-06.1',
    signature_evidence: JSON.stringify(current), signature_status: null, signature_agent: null, referrer_host: null,
  };
  const rows = [];
  const row = extra => { rows.push({ ...base, daily_client_id: (rows.length + 1).toString(16).padStart(32, '0'), ...extra }); };
  const names = ['ChatGPT-User', 'OAI-SearchBot', 'GPTBot', 'AhrefsBot'];
  for (const [index, kind] of ['ai-assistant', 'ai-search', 'ai-crawler', 'signed-agent'].entries()) {
    for (const offset of [0, 6, 7, 13, 14, 20, 21, 27]) {
      const day = new Date(Date.parse('2026-10-17') + offset * 86400000).toISOString().slice(0, 10);
      row({ reader_kind: kind, agent_name: names[index], representation: offset % 2 ? 'markdown' : 'html', observed_at: `${day} 12:00:00` });
    }
  }
  row({ path: '/reference-a', agent_name: 'ExaUser', representation: 'markdown' });
  row({ path: '/article-b', reader_kind: 'ai-search', agent_name: 'ExaSearchBot', observed_at: '2026-11-01 00:00:00' });
  row({ path: '/', reader_kind: 'ai-crawler', agent_name: 'ClaudeBot' });
  row({ path: '/unregistered-private-canary', reader_kind: 'signed-agent', agent_name: null, signature_evidence: null, signature_status: 'verified', signature_agent: 'https://private-canary.example' });
  row({ reader_kind: 'ai-search', agent_name: 'private-canary-name', representation: null, collection_version: 'private-canary-stamp', classifier_version: null, observed_at: '2026-11-01 24:00:00' });
  row({ agent_name: null, representation: null, collection_version: null, classifier_version: null, observation_source: 'beacon', signature_evidence: null });
  row({ signature_evidence: JSON.stringify({ ...current, verifierProfile: '2026-10-31.3' }) });
  row({ is_owner: 1 }); row({ daily_client_id: 'f'.repeat(32) });
  row({ referrer_host: 'traffic2cash.xyz' });
  row({ reader_kind: 'browser', agent_name: null }); row({ reader_kind: 'search-crawler', agent_name: 'Googlebot' });
  row({ reader_kind: 'future-private-canary-kind', agent_name: null }); row({ reader_kind: null, agent_name: null });
  row({ observed_at: '2026-10-16 23:59:59' }); row({ observed_at: '2026-11-14 00:00:00' });
  return rows;
}
export function accessFixture(repeat = 1) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../schema.sql', import.meta.url), 'utf8'));
  const rows = Array.from({ length: repeat }, () => accessRows()).flat();
  for (const row of rows) {
    const columns = Object.keys(row);
    sqlite.prepare(`INSERT INTO page_observations(${columns.join(',')})VALUES(${columns.map(() => '?').join(',')})`).run(...Object.values(row));
  }
  sqlite.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'2026-10-17')").run('f'.repeat(32));
  const queries = [];
  const db = {
    prepare(sql) { return { bind(...values) { return { sql, values }; } }; },
    async batch(statements) {
      return statements.map(statement => {
        queries.push(statement);
        return { success: true, results: sqlite.prepare(statement.sql).all(...statement.values) };
      });
    },
  };
  return { sqlite, db, rows, queries, project() { sqlite.prepare(reportProjectionSql('range')).run(0, Number.MAX_SAFE_INTEGER); } };
}

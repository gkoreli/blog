import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildQueries, compareDay, d1Schema, daysBetween, parseRum, rumQuery } from './analytics-evidence.models.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const help = `Read-only analytics evidence capture for gkoreli.com / blog-analytics.

pnpm -C packages/blog exec tsx scripts/analytics-evidence.ts \\
  --start YYYY-MM-DD --end YYYY-MM-DD --account-id <Cloudflare account ID> --out <new directory>

End is exclusive. Only complete UTC days, maximum 31 per run.
Credentials: CLOUDFLARE_API_TOKEN, otherwise Wrangler's existing default OAuth config.
Account ID may also come from CLOUDFLARE_ACCOUNT_ID. No credential is written to output.
Use --d1-only to explicitly skip RUM (no cross-source ratios).
Outputs are private research evidence; review paths/hostnames before publishing.
`;

function command(executable: string, args: string[]): string {
  try {
    return execFileSync(executable, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000, maxBuffer: 32 * 1024 * 1024 });
  } catch {
    // Child errors can contain environment/config details; don't serialize them.
    throw new Error(`${executable} read failed. Check local authentication, schema, and CLI availability.`);
  }
}

function token(): string {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  const locations = [
    join(homedir(), 'Library/Preferences/.wrangler/config/default.toml'),
    join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), '.wrangler/config/default.toml'),
    join(homedir(), '.wrangler/config/default.toml'),
  ];
  for (const location of locations) {
    try {
      const match = /^oauth_token\s*=\s*"([^"\r\n]+)"/m.exec(readFileSync(location, 'utf8'));
      if (match?.[1]) return match[1];
    } catch { /* Try the next supported default config location. */ }
  }
  throw new Error('RUM credentials unavailable. Set CLOUDFLARE_API_TOKEN or log in with Wrangler.');
}

async function main() {
  const { values } = parseArgs({ options: {
    start: { type: 'string' }, end: { type: 'string' }, out: { type: 'string' },
    'account-id': { type: 'string' }, 'd1-only': { type: 'boolean', default: false }, help: { type: 'boolean' },
  }, strict: true });
  if (values.help) { console.log(help); return; }
  if (!values.start || !values.end || !values.out) throw new Error(help);
  const days = daysBetween(values.start, values.end);
  const accountId = values['account-id'] ?? process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!values['d1-only'] && (!accountId || !/^[a-f0-9]{32}$/.test(accountId))) throw new Error('Supply --account-id or CLOUDFLARE_ACCOUNT_ID for RUM.');
  const out = resolve(values.out);
  // Exclusive directory creation prevents overwriting earlier evidence.
  mkdirSync(out, { mode: 0o700 });
  const startedAt = new Date().toISOString();
  const hashes: Record<string, string> = {};
  const failures: string[] = [];
  const write = (name: string, contents: string) => {
    writeFileSync(join(out, name), contents, { flag: 'wx', mode: 0o600 });
    hashes[name] = createHash('sha256').update(contents).digest('hex');
  };
  const json = (name: string, value: unknown) => write(name, JSON.stringify(value, null, 2) + '\n');
  const queries = buildQueries(values.start, values.end);
  write('queries.sql', queries.map(q => `-- ${q.name}\n${q.sql};`).join('\n\n') + '\n');
  let d1: ReturnType<typeof d1Schema.parse> | undefined;
  try {
    const captureStartedAt = new Date().toISOString();
    const raw: unknown = JSON.parse(command('pnpm', ['exec', 'wrangler', 'd1', 'execute', 'blog-analytics', '--remote', '--json', '--command', queries.map(q => q.sql + ';').join('\n')]));
    d1 = d1Schema.parse(raw);
    if (d1.length !== queries.length) throw new Error('D1 result count differs from the query count.');
    json('d1.json', { captureStartedAt, capturedAt: new Date().toISOString(), results: d1.map((result, i) => ({ name: queries[i]!.name, ...result })) });
  } catch { failures.push('D1 capture failed validation or execution; counts unavailable. No unvalidated result is used.'); d1 = undefined; }
  let gitCommit: string | null = null;
  try { gitCommit = command('git', ['rev-parse', 'HEAD']).trim(); } catch { failures.push('Git revision unavailable.'); }
  try {
    const deployments: unknown = JSON.parse(command('pnpm', ['exec', 'wrangler', 'deployments', 'list', '--json']));
    json('deployments.json', { capturedAt: new Date().toISOString(), deployments });
  } catch { failures.push('Worker deployment history unavailable; do not infer deployed version from Git.'); }
  const sourceHashes = Object.fromEntries(['analytics-evidence.ts', 'analytics-evidence.models.ts'].map(name => [name, createHash('sha256').update(readFileSync(join(root, 'packages/blog/scripts', name))).digest('hex')]));
  const comparisons: Array<ReturnType<typeof compareDay> & { botsExcluded: boolean }> = [];
  let auth: string | undefined;
  if (!values['d1-only']) {
    try { auth = token(); } catch { failures.push('RUM credentials unavailable; RUM counts are missing, not zero.'); }
  }
  if (auth && accountId) {
    for (const day of days) {
      for (const botsExcluded of [true, false]) {
        const query = rumQuery(accountId, day, botsExcluded);
        const name = `rum-${day}-${botsExcluded ? 'bots-excluded' : 'all'}.json`;
        const captureStartedAt = new Date().toISOString();
        try {
          const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST', headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }), signal: AbortSignal.timeout(30_000),
          });
          if (!response.ok) throw new Error('RUM HTTP request failed.');
          const raw: unknown = await response.json();
          const groups = parseRum(raw, day);
          json(name, { query, captureStartedAt, capturedAt: new Date().toISOString(), groups });
          if (d1) {
            const daily = d1[queries.findIndex(q => q.name === 'daily')]!.results;
            const paths = d1[queries.findIndex(q => q.name === 'paths')]!.results;
            comparisons.push({ ...compareDay(day, daily, paths, groups), botsExcluded });
          }
        } catch {
          const failure = `RUM ${day} ${botsExcluded ? 'bots-excluded' : 'all'} failed execution, schema, date, or group-limit validation; no count inferred.`;
          failures.push(failure);
          if (!hashes[name]) json(name, { query, captureStartedAt, capturedAt: new Date().toISOString(), error: failure });
        }
      }
    }
  }
  json('comparison.json', comparisons);
  const complete = d1 !== undefined && failures.length === 0
    && (values['d1-only'] || comparisons.length === days.length * 2);
  const comparable = complete && !values['d1-only'] && comparisons.every(c => c.ratio !== null);
  const lines = [
    '# Analytics evidence snapshot', '',
    `Window: ${values.start} inclusive to ${values.end} exclusive, UTC. Captured ${startedAt}.`, '',
    `Capture: ${values['d1-only'] ? 'D1 only (explicitly requested)' : complete ? 'complete' : 'incomplete'}. Cross-source comparison: ${comparable ? 'available with the limitations below' : 'requires review or missing data'}.`, '',
    '| UTC day | RUM filter | D1 Browser HTML | RUM loads | Excluded dashboard/API loads | D1 / RUM |',
    '|---|---|---:|---:|---:|---:|',
    ...comparisons.map(c => `| ${c.day} | ${c.botsExcluded ? 'Bots excluded' : 'All'} | ${c.d1BrowserHtml} | ${c.rumLoads} | ${c.excludedRumLoads} | ${c.ratio === null ? 'withheld' : c.ratio.toFixed(2)} |`), '',
  ];
  if (comparable) {
    const selected = comparisons.filter(c => c.botsExcluded);
    const browser = selected.reduce((n, c) => n + c.d1BrowserHtml, 0);
    const rum = selected.reduce((n, c) => n + c.rumLoads, 0);
    lines.push(`Whole-window comparison, bots excluded: **${browser} Browser HTML events / ${rum} RUM loads = ${(browser / rum).toFixed(2)}×**. This is disagreement between instruments, not a bot fraction.`, '');
  }
  lines.push('## Checks and limitations', '',
    '- D1 queries are fixed SELECT statements. Every accepted result reports zero rows written.',
    '- Owner exclusion applies to every audience query, but an empty/incomplete owner-marking table cannot establish external readership.',
    '- Daily/path totals reconcile per day or the ratio is withheld. Sources are captured sequentially, not in one transaction; late data and historical reclassification can change repeated captures.',
    '- RUM paths absent from all HTML paths in the D1 window need eligibility review; they are not silently discarded. Path overlap alone does not establish matching request eligibility.',
    '- Ratios are withheld for sampled results, zero denominators, unmatched paths, or failed reconciliation. Missing/error data is never converted to zero.',
    '- Different owner filters, prefetch behavior, lifecycle events, browser caching, script blocking, and delivery loss remain possible differences. Daily clients are not visits or people.',
    '- Signatures identify verifier outcomes; they do not establish user intent. Cluster and burst aggregates are investigative clues, not new classifications.',
    '- D1 has no host column: this capture assumes blog-analytics is the dedicated gkoreli.com database. RUM is explicitly host-filtered.',
    '- Deployment history and Git revision are separate evidence. Script hashes identify the extractor even with uncommitted changes.',
    '- This export omits IPs, raw UAs and daily identifiers. It still contains potentially identifying small aggregates, paths, signer/referrer names and deployment metadata. Keep it private until reviewed.',
    '- SHA-256 values commit to local files, not independent authenticity of the source. The manifest does not hash itself.', '',
    ...failures.map(f => `- Missing evidence: ${f}`),
    ...comparisons.flatMap(c => c.warnings.map(w => `- ${c.day} (${c.botsExcluded ? 'bots excluded' : 'all'}): ${w}`)), '',
    '## Sources', '',
    '- [Cloudflare Web Analytics: sampling, retention and collection limits](https://developers.cloudflare.com/web-analytics/faq/)',
    '- [Cloudflare GraphQL sampling](https://developers.cloudflare.com/analytics/graphql-api/sampling/)',
    '- Project plan: packages/blog/drafts/research/readers-vs-bots/14-evidence-backed-implementation-plan.md', '',
  );
  write('report.md', lines.join('\n'));
  json('manifest.json', { formatVersion: 1, startedAt, completedAt: new Date().toISOString(), window: { start: values.start, endExclusive: values.end, timeZone: 'UTC' }, database: 'blog-analytics', rumHost: 'gkoreli.com', mode: values['d1-only'] ? 'd1-only' : 'd1-and-rum', gitCommit, sourceHashes, complete, comparable, failures, files: { ...hashes } });
  console.log(`Evidence saved to ${out}/report.md`);
  if (failures.length) process.exitCode = 1;
}

main().catch(() => { console.error('Evidence capture stopped. Check arguments (--help), complete UTC dates, and a new writable output directory. Existing evidence was not overwritten.'); process.exitCode = 1; });

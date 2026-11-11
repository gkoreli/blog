/** Explicit, resumable ID-bounded projection rebuild through Wrangler's query
 * path. Raw CLI receipts must be directed to private storage outside Git.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { reportProjectionSql, REPORT_PROJECTION_RULE_SHA256 } from '../.test-dist/report-projection.js';
const args = process.argv.slice(2);
function option(name, fallback) {
  const value = args.find(a => a.startsWith(name + '='))?.slice(name.length + 1);
  if (value === undefined && fallback === undefined) throw new Error(`Required: ${name}=VALUE`);
  return value ?? fallback;
}
function integer(value, minimum, maximum) {
  const n = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(n) || n < minimum || n > maximum) throw new Error('Invalid bounded integer option');
  return n;
}
const remote = args.includes('--remote'), local = args.includes('--local');
if (remote === local) throw new Error('Choose exactly one of --remote or --local');
const after = integer(option('--after','0'),0,Number.MAX_SAFE_INTEGER);
const through = integer(option('--through'),after,Number.MAX_SAFE_INTEGER);
const chunk = integer(option('--chunk','1000'),1,1000);
const database = option('--database');
const receipts = option('--receipts-dir');
if (!isAbsolute(receipts)) throw new Error('Use an absolute private receipts directory');
mkdirSync(receipts,{recursive:true,mode:0o700});
const config = option('--config');
const maxReads = integer(option('--max-reads','5000000'),1,Number.MAX_SAFE_INTEGER);
const maxWrites = integer(option('--max-writes','50000'),1,Number.MAX_SAFE_INTEGER);
let reads = 0, writes = 0, cursor = after;
while (cursor < through) {
  const end = Math.min(cursor + chunk, through);
  let parameter = 0;
  const range = [cursor,end];
  const sql = reportProjectionSql('range').replaceAll('?',() => String(range[parameter++]));
  if (parameter !== 2) throw new Error('Unexpected projection parameter layout');
  const env = { ...process.env, WRANGLER_LOG_PATH: resolve(receipts,`wrangler-${cursor}-${end}.log`) };
  const result = spawnSync('pnpm',['exec','wrangler','d1','execute',database,remote?'--remote':'--local',
    '--config',config,'--json','--command='+sql],{encoding:'utf8',env,maxBuffer:5*1024*1024});
  writeFileSync(resolve(receipts,`${cursor}-${end}.json`),result.stdout??'',{mode:0o600});
  writeFileSync(resolve(receipts,`${cursor}-${end}.stderr`),result.stderr??'',{mode:0o600});
  if (result.status !== 0) throw new Error(`Projection failed for (${cursor},${end}]; inspect private receipts before resuming`);
  const data = JSON.parse(result.stdout);
  if (!Array.isArray(data) || data.length !== 1 || data[0]?.success !== true) throw new Error('Unacknowledged projection batch');
  const meta = data[0].meta;
  if (!Number.isSafeInteger(meta?.rows_read) || meta.rows_read < 0 || !Number.isSafeInteger(meta.rows_written) || meta.rows_written < 0) throw new Error('Projection cost is unknown; stop before another batch');
  reads += meta.rows_read; writes += meta.rows_written;
  const receipt = { after:cursor,through:end,ruleSha256:REPORT_PROJECTION_RULE_SHA256,
    reads:meta.rows_read,writes:meta.rows_written,changes:meta.changes,sqlMs:meta.timings?.sql_duration_ms??meta.duration,
    cumulativeReads:reads,cumulativeWrites:writes };
  writeFileSync(resolve(receipts,'progress.jsonl'),JSON.stringify(receipt)+'\n',{flag:'a',mode:0o600});
  console.log(JSON.stringify(receipt));
  cursor = end;
  if (meta.rows_read > 200000 || reads > maxReads || writes > maxWrites) throw new Error(`Projection review ceiling exceeded after ${cursor}; stop before another batch`);
}
console.log(JSON.stringify({complete:true,after,through,cursor,reads,writes,ruleSha256:REPORT_PROJECTION_RULE_SHA256}));

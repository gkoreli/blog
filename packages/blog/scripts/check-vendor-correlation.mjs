import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PUBLIC_SIGNERS } from '../../analytics/.test-dist/signers.js';

export const vendorCohort = {
  sql: `SELECT observed_at,path,collection_version,classifier_version,reader_kind,agent_name,
      signature_status,signature_agent,signature_evidence,classification_evidence,vendor_ip_evidence
    FROM page_observations
    WHERE observed_at >= ? AND observed_at < ? AND signature_status='verified'
      AND signature_agent IN (?,?) AND signature_evidence IS NOT NULL
    ORDER BY observed_at,id`,
  values: ['2026-10-27 00:00:00','2026-10-27 21:49:00',
    PUBLIC_SIGNERS.find(row=>row.name==='Exa').origin,
    PUBLIC_SIGNERS.find(row=>row.name==='Ahrefs').origin],
};

export function decodeVendorRows(result) {
  const fields=['observed_at','path','collection_version','classifier_version','reader_kind','agent_name',
    'signature_status','signature_agent','signature_evidence','classification_evidence','vendor_ip_evidence'];
  for(const row of result.results) {
    assert.deepEqual(Object.keys(row).sort(),fields.toSorted());
    assert.ok(typeof row.observed_at==='string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.observed_at));
    assert.ok(row.observed_at>=vendorCohort.values[0]&&row.observed_at<vendorCohort.values[1]);
    assert.ok(typeof row.path==='string'&&row.path.startsWith('/'));
    assert.equal(row.signature_status,'verified');
    assert.ok(vendorCohort.values.slice(2).includes(row.signature_agent));
    assert.ok(row.signature_evidence!==null);
    for(const key of ['signature_evidence','classification_evidence','vendor_ip_evidence']) if(row[key]!==null) JSON.parse(row[key]);
  }
  return result.results;
}

async function main() {
  const [output,privatePlan]=process.argv.slice(2);
  assert.ok(output&&privatePlan&&![output,privatePlan].some(existsSync));
  const req=createRequire(resolve('package.json'));
  const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
  const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("fixture only")}}',compatibilityDate:'2026-03-06',d1Databases:{DB:'vendor-correlation',ACK:'returning-probe'}});
  try {
    const db=await mf.getD1Database('DB'),ack=await mf.getD1Database('ACK');
    const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
    await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
    const fixtures=[
      ...Array.from({length:4},()=>({at:'2026-10-27 21:25:50',origin:vendorCohort.values[2],status:'verified',evidence:'{}'})),
      ...Array.from({length:2},()=>({at:'2026-10-27 20:16:44',origin:vendorCohort.values[2],status:'verified',evidence:'{}'})),
      {at:'2026-10-27 17:08:54',origin:vendorCohort.values[3],status:'verified',evidence:'{}'},
      {at:'2026-10-27 21:49:00',origin:vendorCohort.values[2],status:'verified',evidence:'{}'},
      {at:'2026-10-26 23:59:59',origin:vendorCohort.values[2],status:'verified',evidence:'{}'},
      {at:'2026-10-27 20:00:00',origin:vendorCohort.values[3],status:'unverified',evidence:'{}'},
      {at:'2026-10-27 20:00:00',origin:vendorCohort.values[2],status:'verified',evidence:null},
      {at:'2026-10-27 20:00:00',origin:'https://private-origin.example.invalid',status:'verified',evidence:'{}'},
    ];
    for(const [i,row]of fixtures.entries()) await db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,
      observed_at,signature_agent,signature_status,signature_evidence) VALUES('/fixture',?,'bot','desktop',0,?,?,?,?)`)
      .bind((i+1).toString(16).padStart(32,'0'),row.at,row.origin,row.status,row.evidence).run();
    const result=await db.prepare(vendorCohort.sql).bind(...vendorCohort.values).all();
    assert.equal(decodeVendorRows(result).length,7);
    assert.equal(result.results.filter(row=>row.signature_agent===vendorCohort.values[3]).length,1);
    assert.equal(decodeVendorRows(await db.prepare(vendorCohort.sql).bind('2027-01-01 00:00:00','2027-01-02 00:00:00',...vendorCohort.values.slice(2)).all()).length,0);
    for(const change of [row=>({...row,unexpected:'private'}),row=>({...row,signature_agent:'https://private-origin.example.invalid'}),row=>({...row,observed_at:'2026-10-27 21:49:00'})]) {
      assert.throws(()=>decodeVendorRows({results:[change(result.results[0])]}));
    }
    // Native capability probe only; not yet a change to the production collector.
    await ack.prepare('CREATE TABLE receipts(id INTEGER PRIMARY KEY AUTOINCREMENT,value TEXT NOT NULL)').run();
    const run=await ack.prepare("INSERT INTO receipts(value) VALUES('run') RETURNING CAST(id AS TEXT) AS row_ref").run();
    const all=await ack.prepare("INSERT INTO receipts(value) VALUES('all') RETURNING CAST(id AS TEXT) AS row_ref").all();
    await ack.prepare("INSERT INTO receipts(id,value) VALUES(9007199254740993,'high')").run();
    const high=await ack.prepare("INSERT INTO receipts(value) VALUES('high-next') RETURNING CAST(id AS TEXT) AS row_ref").run();
    const highOdd=await ack.prepare("INSERT INTO receipts(value) VALUES('high-odd') RETURNING CAST(id AS TEXT) AS row_ref").run();
    assert.equal(run.results[0].row_ref,'1');assert.equal(all.results[0].row_ref,'2');assert.equal(high.results[0].row_ref,'9007199254740994');
    assert.equal(run.meta.changes,1);assert.equal(all.meta.changes,1);assert.equal(high.meta.changes,1);
    assert.equal(highOdd.results[0].row_ref,'9007199254740995');assert.equal(highOdd.meta.changes,1);
    assert.equal(Number.isSafeInteger(highOdd.meta.last_row_id),false);
    assert.notEqual(String(highOdd.meta.last_row_id),highOdd.results[0].row_ref);
    const evidence={checkedAt:new Date().toISOString(),method:'Native local D1 query-boundary and RETURNING capability controls; no production calls or real vendor authentication.',
      querySha256:createHash('sha256').update(vendorCohort.sql).digest('hex'),fixtures:{rows:12,selected:7,ahrefs:1,rowsRead:result.meta.rows_read,rowsWritten:result.meta.rows_written},
      checks:{timeAndOriginBoundaries:true,legacyNullEvidenceOmitted:true,malformedRowsReject:true,emptyCohort:true},
      returning:{runReturnsTextReference:true,allReturnsTextReference:true,oneRowAcknowledgements:true,beyondSafeIntegerReturnedExactly:true,unsafeNumericMetadataDiffersFromExactReturnedText:true},
      productionReadCeiling:5000,limits:['Private query output contains exact paths/times for correlation and must not be committed.','A time/path cohort is not an exact invocation-to-row join.','RETURNING controls do not establish production behavior.']};
    writeFileSync(output,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
    writeFileSync(privatePlan,JSON.stringify({...vendorCohort,readCeiling:5000,sourceCutoff:'2026-10-27 21:49:00',sqlSha256:evidence.querySha256},null,2)+'\n',{flag:'wx',mode:0o600});
    console.log(JSON.stringify(evidence));
  } finally {await mf.dispose();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();

import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,unlinkSync,realpathSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {networkAssignmentCases} from '../../analytics/test/fixtures/network-assignment.mjs';
import {assessStoredNetworkAssignment,networkAssignmentJsonStateSql} from '../../analytics/.test-dist/vendor-declaration-assessment.js';
import * as delta from './evidence-delta.mjs';

const [output,gitRepository]=process.argv.slice(2);assert.ok(output&&gitRepository);
const root=realpathSync(fileURLToPath(new URL('../../../',import.meta.url)));
const baseline='733a56901aacab0331e8d9d08c3b1cb2975ff537';
const hash=value=>createHash('sha256').update(value).digest('hex');
const save=(name,value)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});
const cases=networkAssignmentCases(),sqlite=new DatabaseSync(':memory:');
const guardSql=`SELECT ${networkAssignmentJsonStateSql('classification_evidence')} AS c,${networkAssignmentJsonStateSql('vendor_ip_evidence')} AS n FROM (SELECT ? AS classification_evidence,? AS vendor_ip_evidence)`;
const node=cases.map(row=>{
 const raw=sqlite.prepare(guardSql).get(row.classificationJson,row.networkJson),guard={c:raw.c,n:raw.n};
 const assessment=assessStoredNetworkAssignment({...row,classificationJsonState:guard.c,networkJsonState:guard.n});
 assert.equal(assessment.state,row.state,row.id);assert.deepEqual(assessment.reasons,row.reasons,row.id);return{id:row.id,guard,assessment};
});
const nodeSqliteVersion=sqlite.prepare('SELECT sqlite_version() AS version').get().version;sqlite.close();
const require=createRequire(join(root,'packages/blog/package.json'));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const script=`import {assessStoredNetworkAssignment,networkAssignmentJsonStateSql} from '${root}/packages/analytics/src/vendor-declaration-assessment.ts';
const sql=\`SELECT \${networkAssignmentJsonStateSql('classification_evidence')} AS c,\${networkAssignmentJsonStateSql('vendor_ip_evidence')} AS n FROM (SELECT ? AS classification_evidence,? AS vendor_ip_evidence)\`;
export default {async fetch(request,env){const cases=await request.json(),rows=[];for(const row of cases){try{const guard=await env.DB.prepare(sql).bind(row.classificationJson,row.networkJson).first();rows.push({id:row.id,guard,assessment:assessStoredNetworkAssignment({...row,classificationJsonState:guard.c,networkJsonState:guard.n})});}catch(error){return Response.json({case:row.id,error:String(error.message)},{status:500});}}return Response.json({rows,sqlite:{version:null,state:'not-exposed'}});}};`;
const bundle=await build({stdin:{contents:script,resolveDir:root},bundle:true,format:'esm',platform:'browser',write:false,target:'es2022'});
const matrix=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'network-assignment'}});
let nativeVersion;
try{
 const response=await matrix.dispatchFetch('https://offline.invalid/',{method:'POST',body:JSON.stringify(cases)});const body=await response.text();if(response.status!==200)save('native-matrix-error.json',{status:response.status,body});assert.equal(response.status,200);const native=JSON.parse(body);assert.deepEqual(native.rows,node);nativeVersion=native.sqlite.version;save('native-matrix-results.json',native.rows);
}finally{await matrix.dispose();}
save('node-matrix-results.json',node);
assert.ok(!JSON.stringify(node).includes('private-canary'));

// Exercise the actual existing analyzer, including owner/referral exclusions.
const byId=id=>structuredClone(cases.find(row=>row.id===id));
const items=[byId('gpt-correct'),byId('gpt-wrong-source'),byId('gpt-wrong-source'),byId('gpt-wrong-source'),byId('gpt-wrong-source'),byId('missing-classification'),byId('escaped-duplicate-source-key'),byId('invalid-network-json'),byId('gpt-correct'),byId('old-google-unmapped')];
const badCache=JSON.parse(items[8].networkJson);badCache.checks[0].cache={private:'private-canary'};items[8].networkJson=JSON.stringify(badCache);
const rows=items.map((item,i)=>{
 const base={id:String(i+1),path:'/private-canary-path',observed_at:'2026-10-31 09:00:00',traffic_class:'ai',device_type:'desktop',agent_name:i===9?null:'GPTBot',reader_kind:i===9?'unresolved':'ai-crawler',reader_reason:'fixture',observation_source:'edge',collection_version:'2026-10-30.1',classifier_version:item.storedClassifier,representation:'html',classification_evidence:item.classificationJson,vendor_ip_evidence:item.networkJson,is_owner:i===2?1:0,owner_client:i===3?1:0,referrer_host:i===4?'traffic2cash.xyz':null};
 return Object.fromEntries(delta.EXPORT_FIELDS.map(f=>[f,base[f]??null]));
});
const baselinePath=join(dirname(fileURLToPath(import.meta.url)),'.network-assignment-baseline-'+randomUUID()+'.mjs');
writeFileSync(baselinePath,execFileSync('git',['-C',gitRepository,'show',baseline+':packages/blog/scripts/evidence-delta.mjs']),{flag:'wx'});
const analysis=await delta.nativeDatabase();
let result;
try{
 const prior=await import(pathToFileURL(baselinePath));
 assert.deepEqual([delta.PLAN,delta.EXPORT_FIELDS,delta.TEXT_FIELDS,delta.PREFLIGHT_SQL,delta.EXPORT_SQL],[prior.PLAN,prior.EXPORT_FIELDS,prior.TEXT_FIELDS,prior.PREFLIGHT_SQL,prior.EXPORT_SQL]);
 const parseable=rows.filter(row=>row.id!=='8');await delta.loadRows(analysis.db,parseable);
 const pre=delta.validatePreflight(await analysis.db.prepare(delta.PREFLIGHT_SQL).bind('0').first(),'0');
 const exported=delta.validateExport((await analysis.db.prepare(delta.EXPORT_SQL).bind('0',pre.upperId).all()).results,pre,'0');
 const before=await prior.analyze(analysis.db,exported,'0',pre.upperId),comparable=await delta.analyze(analysis.db,exported,'0',pre.upperId);
 const {networkAssignments:comparableAssignments,localMeters,...current}=comparable;
 current.assessments=current.assessments.map(({networkAssignment,...facts})=>facts);
 const {localMeters:oldMeters,...old}=before;assert.deepEqual(current,old);
 await delta.loadRows(analysis.db,rows.filter(row=>row.id==='8'));
 const extendedPre=delta.validatePreflight(await analysis.db.prepare(delta.PREFLIGHT_SQL).bind('0').first(),'0');
 const extended=delta.validateExport((await analysis.db.prepare(delta.EXPORT_SQL).bind('0',extendedPre.upperId).all()).results,extendedPre,'0');
 result=await delta.analyze(analysis.db,extended,'0',extendedPre.upperId);const {networkAssignments}=result;
 assert.deepEqual(networkAssignments.raw.states,{consistent:3,contradictory:4,'not-assessed':3});
 assert.deepEqual(networkAssignments.included.states,{consistent:3,contradictory:1,'not-assessed':3});
 assert.equal(result.assessments[1].network_state,'recognized');assert.equal(result.assessments[1].networkAssignment.state,'contradictory');
 assert.equal(result.assessments[8].network_state,'unrecognized');assert.equal(result.assessments[8].networkAssignment.state,'consistent');
 const {assessments,...publicResult}=result;assert.ok(!JSON.stringify(publicResult).includes('private-canary'));
 let mismatchControls=0;
 for(const field of ['classification_evidence','vendor_ip_evidence','classifier_version']){const changed=structuredClone(extended);changed[0][field]='private-canary';await assert.rejects(delta.analyze(analysis.db,changed,'0',extendedPre.upperId),error=>error.message==='Local assignment fields differ from supplied rowset');mismatchControls++;}
 save('analyzer-results.json',publicResult);save('analyzer-private-assessments.json',assessments);save('analyzer-fixture.json',extended);
 save('analyzer-comparison.json',{baseline,priorFieldsIdenticalForParseableRows:parseable.length,productionExportAndPlanIdentical:true,mismatchControls,rawRows:networkAssignments.raw.rows,includedRows:networkAssignments.included.rows,baselineLocalMeters:oldMeters,newLocalMeters:localMeters,extendedLocalMeters:result.localMeters,malformedRowRetained:true});
}finally{await analysis.mf.dispose();unlinkSync(baselinePath);}

// The new analysis module is not reachable from the collection entry point.
const entry=join(root,'packages/analytics/src/index.ts');
const options={entryPoints:[entry],absWorkingDir:root,bundle:true,format:'esm',platform:'browser',write:false,target:'es2022',metafile:true};
const after=await build(options);
const before=await build({...options,plugins:[{name:'pinned-collector-source',setup(plugin){plugin.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/},args=>({contents:execFileSync('git',['-C',gitRepository,'show',baseline+':'+args.path.slice(root.length+1)],{encoding:'utf8'}),loader:'ts',resolveDir:dirname(args.path)}));}}]});
assert.deepEqual(after.outputFiles[0].contents,before.outputFiles[0].contents);assert.ok(!Object.keys(after.metafile.inputs).some(path=>path.includes('vendor-declaration-')));
const receipt={checkedAt:new Date().toISOString(),baseline,node:process.version,nodeSqliteVersion,nativeSqliteVersion:nativeVersion,nativeSqliteVersionState:'not-exposed',fixtureCases:cases.length,exactNodeWorkerdD1Agreement:true,matrixBundleSha256:hash(bundle.outputFiles[0].contents),analyzerRawRows:result.networkAssignments.raw.rows,analyzerIncludedRows:result.networkAssignments.included.rows,priorAnalyzerFieldsIdenticalForParseableRows:9,malformedRowRetained:true,productionExportAndPlanIdentical:true,guardBindingMismatchControls:3,collectorEntryBundleIdentical:true,collectorEntryBundleSha256:hash(after.outputFiles[0].contents),productionRequests:0,productionSqlStatements:0,newHumanLabels:0};
save('network-assignment-checks.json',receipt);console.log(JSON.stringify(receipt));

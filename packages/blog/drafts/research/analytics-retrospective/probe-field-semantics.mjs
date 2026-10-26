import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseReferrer } from '../../../../analytics/.test-dist/referrals.js';
import { extractRequestMetadata } from '../../../../analytics/.test-dist/metadata.js';
import { recordPageObservation } from '../../../../analytics/.test-dist/db.js';

// Run pnpm -C packages/analytics test before this probe to compile the current sources.
// Pure supplied-input cases and a capture-only persistence stub; no network or D1.
const publicPaths = new Set(['/', '/engineering', '/article']);
const target = new URL('https://gkoreli.com/article');
const cases = [
  ['missing', null, 'absent', null],
  ['empty', '', 'absent', null],
  ['external-full', 'https://source.example/post?q=fixture#fragment', 'external', null],
  ['external-origin-only', 'https://source.example/', 'external', null],
  ['internal-full', 'https://gkoreli.com/engineering?q=fixture#fragment', 'internal', '/engineering'],
  ['internal-origin-only', 'https://gkoreli.com/', 'internal', '/'],
  ['hostname-alias-different-origin', 'http://www.gkoreli.com:8080/engineering', 'internal', '/engineering'],
  ['unrecognized-internal-path', 'https://gkoreli.com/unregistered', 'internal', null],
  ['relative-reference', '/engineering', 'unusable', null],
  ['about-blank', 'about:blank', 'unusable', null],
  ['malformed', 'not a valid absolute URL', 'unusable', null],
];
const referrers = cases.map(([name,raw,state,path]) => {
  const result = parseReferrer(raw,target.hostname,publicPaths);
  assert.equal(result.referrerState,state); assert.equal(result.internalReferrerPath,path);
  return {name,supplied:raw,result,browserSameOrigin:raw?.startsWith('http') ? new URL(raw).origin === target.origin : null};
});
const networks = [];
for (const [name,cf,expected] of [
  ['provider-shaped-fixture',{asn:64512,asOrganization:'Fixture ASN owner',country:'US'},64512],
  ['no-cf',undefined,null],
  ['nonfinite-asn',{asn:Infinity},null],
  ['finite-negative-not-rejected',{asn:-1},-1],
  ['finite-fraction-not-rejected',{asn:1.5},1.5],
]) {
  const request = new Request(target,{headers:{'CF-IPCountry':'ZZ'}});
  if(cf!==undefined) Object.defineProperty(request,'cf',{value:cf});
  const metadata=extractRequestMetadata(request,undefined,publicPaths);
  assert.equal(metadata.asn,expected);
  let captured;
  const db={prepare(sql){return {bind(...values){captured={sql,values};return {async run(){return {success:true};}};}};}};
  await recordPageObservation(db,{...metadata,dailyClientId:'0'.repeat(32),trafficClass:'browser',agentName:null,deviceType:'desktop',representation:'html',signatureAgent:null,signatureStatus:null,readerKind:'browser',readerReason:'fixture',observedAt:'2026-10-26 00:00:00'});
  const columns = captured.sql.slice(captured.sql.indexOf('(')+1,captured.sql.indexOf(')')).split(',').map(s=>s.trim());
  const sourceMarker=captured.values[columns.indexOf('asn_source')];
  assert.equal(sourceMarker,metadata.asn===null ? null : 'request');
  networks.push({name,extracted:{asn:metadata.asn,asOrg:metadata.asOrg,country:metadata.country},sourceMarker});
}
const paths=['src/referrals.ts','src/metadata.ts','src/db.ts'];
const sourceHashes=Object.fromEntries(paths.map(path=>[path,createHash('sha256').update(readFileSync(new URL('../../../../analytics/'+path,import.meta.url))).digest('hex')]));
console.log(JSON.stringify({capturedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtime:process.version,sourceHashes,networkCalls:0,productionObservations:0,databaseCalls:0,referrers,networks,limits:['Constructed inputs establish local parser/marker behavior, not frequency or validity of production values.','Native cf metadata is simulated; negative/fractional ASN fixtures are validation boundary tests, not observed provider outputs.','No real browser navigation, native ASN verification or release-to-date audit is performed.']},null,2));

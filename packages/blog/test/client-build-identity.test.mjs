import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
import {clientDefines} from '../src/pipeline/client-mode.ts';
import {ROOT} from '../src/lib/paths.ts';
import {parseClientErrorPayload} from '../../client-observability/src/schema.ts';
const uuid='12345678-1234-4234-8234-123456789abc',commit='a'.repeat(40);
const environment={WORKERS_CI:'1',WORKERS_CI_BUILD_UUID:uuid,WORKERS_CI_COMMIT_SHA:commit};
const expected='cf:'+uuid+':'+commit;

test('client identity requires complete bounded Workers metadata and is absent for development/manual builds',()=>{
 assert.equal(expected.length,80);
 assert.equal(clientDefines(true,environment).__GK_CLIENT_BUILD_ID__,JSON.stringify(expected));
 assert.equal(clientDefines(true,{...environment,WORKERS_CI_BUILD_UUID:uuid.toUpperCase(),WORKERS_CI_COMMIT_SHA:commit.toUpperCase()}).__GK_CLIENT_BUILD_ID__,JSON.stringify(expected));
 for(const production of [false,true])assert.equal(clientDefines(production,{}).__GK_CLIENT_BUILD_ID__,'undefined');
 assert.equal(clientDefines(false,environment).__GK_CLIENT_BUILD_ID__,'undefined');
 for(const patch of [{WORKERS_CI_BUILD_UUID:undefined},{WORKERS_CI_COMMIT_SHA:undefined},{WORKERS_CI_BUILD_UUID:uuid+'\n'},{WORKERS_CI_COMMIT_SHA:commit+'\n'},{WORKERS_CI_BUILD_UUID:'private-arbitrary-text'},{WORKERS_CI_COMMIT_SHA:'g'.repeat(40)},{WORKERS_CI_BUILD_UUID:uuid+' '},{WORKERS_CI_COMMIT_SHA:'short'}]){
  assert.throws(()=>clientDefines(true,{...environment,...patch}),error=>error.message==='Workers client build metadata is missing or invalid');
 }
});

async function compiledReport(env){
 const output=await build({stdin:{contents:'import {clientBuildId} from "./src/client/build-identity.ts"; import {createDefaultClientLogger,initClientErrorReporting} from "@gkoreli/client-observability/client"; initClientErrorReporting(createDefaultClientLogger({buildId:clientBuildId()}));',resolveDir:ROOT},bundle:true,platform:'browser',format:'iife',target:'es2024',write:false,minify:true,define:clientDefines(true,env)});
 const listeners=new Map(),blobs=[];
 const location={pathname:'/owner',origin:'https://fixture.invalid'};
 runInNewContext(output.outputFiles[0].text,{Blob,Date,location,document:{referrer:''},navigator:{userAgent:'FixtureBrowser/1',sendBeacon(_url,blob){blobs.push(blob);return true}},window:{addEventListener(name,callback){listeners.set(name,callback)}}});
 listeners.get('error')({message:'client_build_fixture',filename:'https://fixture.invalid/main.js',lineno:1,colno:1});
 assert.equal(blobs.length,1);const event=JSON.parse(await blobs[0].text());return{event,code:output.outputFiles[0].text};
}

test('compiled default logger carries the complete client-build identity through redaction and server parsing',async()=>{
 const {event,code}=await compiledReport(environment);assert.equal(event.buildId,expected);assert.equal(parseClientErrorPayload(event).buildId,expected);
 assert.ok(code.includes(expected));assert.ok(!code.includes('WORKERS_CI_COMMIT_SHA'));
 const unknown=await compiledReport({});assert.equal(Object.hasOwn(unknown.event,'buildId'),false);assert.equal(parseClientErrorPayload(unknown.event).buildId,undefined);
 const other=await compiledReport({...environment,WORKERS_CI_BUILD_UUID:'22345678-1234-4234-8234-123456789abc'});
 assert.notEqual(other.event.buildId,event.buildId);assert.equal(event.buildId,expected,'another build cannot rewrite an already-produced client report');
});

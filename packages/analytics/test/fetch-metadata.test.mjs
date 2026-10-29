import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFetchMetadataField as parse, extractFetchMetadata, fetchMetadataFields, parseMetadataItem } from '../.test-dist/fetch-metadata.js';
import { extractRequestMetadata } from '../.test-dist/metadata.js';
import { classifyReaderKind } from '../.test-dist/readerkind.js';
import { classificationEvidence } from '../.test-dist/classification-evidence.js';
import { analyzeTraffic, KNOWN_CLIENT_PRODUCTS } from '../.test-dist/classify.js';
const chrome='Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36';
function inspect(changes={}, ua=chrome) {
 const request=new Request('https://publication.example/article',{headers:{'User-Agent':ua,'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document','Sec-Fetch-Site':'none',Accept:'text/html','Accept-Language':'en',...changes}});
 Object.defineProperty(request,'cf',{value:{asn:64512}});
 const m=extractRequestMetadata(request),a=analyzeTraffic(ua),facts={...m,...a,observationSource:'edge',signature:{status:'absent'}};
 return {m,reader:classifyReaderKind(facts),evidence:classificationEvidence(facts,a.declarations)};
}
test('exact case, type, whole-field parsing and valid extensions are separate facts',()=>{
 for(const value of ['navigate',' navigate ','navigate;x','navigate; x=1','navigate;x=token;y=?0','navigate;x="private-canary"','navigate;x=1.125','navigate;x=:YQ:','navigate;x=@1;y=?0','navigate;x=%"%c3%a9"','navigate;x=1;x=2']) {
  const result=parse(value,'mode');assert.equal(result.state,'valid',value);assert.equal(result.value,'navigate');
 }
 for(const value of ['Navigate','NAVIGATE','future-mode']) assert.deepEqual(parse(value,'mode'),{state:'unrecognized',value:null,parameters:false});
 for(const value of ['', '"navigate"','?1','navigate, navigate','navigate;x=','navigate;x=1 trailing','navigate;x=1.1234','navigate;x=@1.2','navigate;x=%"%ff"','navigate;x=%"%C3"','navigate;x="bad\\q"','navigate;x=1 ;y=2','navigate;X','\u00a0navigate','navigate\u00a0','navigate\t']) assert.equal(parse(value,'mode').state,'invalid',JSON.stringify(value));
 assert.deepEqual(parse('?1;x=?0','user'),{state:'valid',value:true,parameters:true});
 assert.deepEqual(parse('?0','user'),{state:'valid',value:false,parameters:false});
 assert.equal(parse('true','user').state,'invalid');assert.equal(parse(null,'user').state,'absent');
 assert.equal(parse('a'.repeat(32769),'mode').state,'policy-limit');
 for(const value of ['navigate;x="'+'a'.repeat(1024)+'"','navigate;x='+ 'a'.repeat(512),'navigate;'+ 'a'.repeat(64), 'navigate'+Array.from({length:256},(_,i)=>';p'+i).join(''), 'navigate;x=:'+btoa('a'.repeat(16384))+':']) assert.equal(parse(value,'mode').state,'valid');
});
test('malformed optional fields and unknown enums abstain without proving automation',()=>{
 assert.equal(inspect().reader.kind,'browser');
 for(const [name,value,reason]of [['Mode','NAVIGATE','unrecognized'],['Dest','DOCUMENT','unrecognized'],['Site','Same-Origin','unrecognized'],['Site','"none"','invalid'],['User','garbage','invalid'],['Mode','navigate, navigate','invalid'],['Mode','a'.repeat(32769),'policy-limit']]) {
  const result=inspect({['Sec-Fetch-'+name]:value});assert.deepEqual(result.reader,{kind:'unresolved',reason:'fetch-metadata-'+reason});
 }
 for(const value of ['navigate;x=1','navigate;x=@1;y=?0','navigate;x=%"%c3%a9"']) assert.equal(inspect({'Sec-Fetch-Mode':value}).reader.kind,'browser');
 const invalid=inspect({'Sec-Fetch-User':'private-canary'});assert.equal(invalid.m.secFetchUser,null);assert.equal(invalid.evidence.activation,'invalid');assert.equal(JSON.stringify(invalid.evidence).includes('private-canary'),false);
 assert.equal(inspect({'Sec-Fetch-User':'?1;extension'}).evidence.activation,'true-claim');
 assert.equal(inspect({'Sec-Fetch-User':'?0'}).reader.kind,'browser');
 assert.equal(inspect({'Sec-Fetch-User':'invalid'},'ExaSearchBot/1.0').reader.kind,'ai-search');
});
test('duplicate field lines reject rather than choose first or last; original Request stays intact',()=>{
 const h=new Headers([['Sec-Fetch-Mode','navigate'],['Sec-Fetch-Mode','navigate']]);
 assert.equal(extractFetchMetadata(h).secFetchMode,null);assert.equal(fetchMetadataFields(extractFetchMetadata(h).fetchMetadataBits).states[0],'invalid');
 assert.equal(h.get('Sec-Fetch-Mode'),'navigate, navigate');
});
test('closed bit encoding preserves states and parameters under the existing JSON budget',()=>{
 assert.deepEqual(fetchMetadataFields(0),{states:Array(4).fill('not-assessed'),parameters:Array(4).fill(false)});
 for(const bits of [-1,1.5,65536,7,null,4096]) assert.equal(fetchMetadataFields(bits),null);
 const e=inspect({'Sec-Fetch-Mode':'navigate;x="private-canary"'},[...KNOWN_CLIENT_PRODUCTS].join(' ')).evidence;
 assert.equal(e.version,'2026-10-29.2');assert.ok(Buffer.byteLength(JSON.stringify(e))<=2048);assert.equal(JSON.stringify(e).includes('private-canary'),false);
 for(const suffix of [';x=999999999999999',';x=-999999999999999',';x=999999999999.999',';x=@999999999999999',';x="a\\\\b"']) assert.doesNotThrow(()=>parseMetadataItem('navigate'+suffix));
});

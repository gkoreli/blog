import assert from 'node:assert/strict';
import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const[input,output]=process.argv.slice(2);assert.ok(output);
const bytes=readFileSync(input),hash=b=>createHash('sha256').update(b).digest('hex');
const accepted=JSON.parse(readFileSync(new URL('./latest-signed-production.json',import.meta.url)));assert.equal(hash(bytes),accepted.inputCommitments.headers);
const rows=JSON.parse(bytes);assert.equal(rows.length,409);
const counts={records:0,methods:{},queryUrls:0,duplicateDecodedQueryNames:0,markerShapedUrls:0,fetchUrlUnchanged:0,sourceMessageMatches:0,metadataMessageMatches:0,pathFieldAbsent:0,searchFieldAbsent:0};
for(const row of rows){
 assert.equal(row.$metadata.type,'cf-worker-event');const request=row.$workers.event.request;
 assert.equal(typeof request.url,'string');assert.equal(typeof request.method,'string');
 const target=new URL(request.url),context=new Request(request.url,{method:request.method});counts.records++;
 counts.methods[request.method]=(counts.methods[request.method]??0)+1;
 counts.queryUrls+=target.search!=='';counts.duplicateDecodedQueryNames+=[...target.searchParams.keys()].length!==new Set(target.searchParams.keys()).size;
 counts.markerShapedUrls+=/(?:^|[^a-z0-9+_-])REDACTED(?=$|[^a-z0-9+_-])/i.test(request.url);
 counts.fetchUrlUnchanged+=context.url===request.url;counts.sourceMessageMatches+=row.source.message===request.method+' '+request.url;
 counts.metadataMessageMatches+=row.$metadata.message===row.source.message;counts.pathFieldAbsent+=!Object.hasOwn(request,'path');counts.searchFieldAbsent+=!Object.hasOwn(request,'search');
}
writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),sourceSha256:hash(bytes),scriptSha256:hash(readFileSync(new URL(import.meta.url))),counts,
 originalWireCompletenessProven:false,messageCopiesIndependent:false,newProductionRequests:0,d1Statements:0,
 limits:['Matching URL/message copies are correlated retained representations.','Absent path/search objects are unavailable, not contradictory empty fields.','No marker shape does not rule out omission or transformation.']},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify(counts));

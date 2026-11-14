import { readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { lexicalQuery } from './lexical-query.mjs';

if(process.argv.length!==6)throw new Error('Usage: node evaluate-native-pagefind.mjs /native-index-root development-or-validation /cases /fresh-output');
const [directory,split,caseFile,output]=process.argv.slice(2);assert(['development','validation'].includes(split));
const root=resolve(directory),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=JSON.parse(readFileSync(caseFile,'utf8')).cases.filter(row=>row.split===split);
writeFileSync(output+'.started.json',JSON.stringify({startedAt:new Date().toISOString(),split,cases:cases.length},null,2)+'\n',{flag:'wx'});
globalThis.fetch=async input=>{const url=new URL(typeof input==='string'?input:input.url??input.href);if(url.protocol!=='file:')throw Error('Network prohibited');const path=resolve(fileURLToPath(url));if(!path.startsWith(root+sep))throw Error('Read outside index');const bytes=await readFile(path);return new Response(bytes,{headers:{'Content-Type':path.endsWith('.pagefind')?'application/wasm':'application/octet-stream'}});};
const pagefind=await import(pathToFileURL(join(root,'index/pagefind.js')));await pagefind.options({baseUrl:'/'});const results=[];
for(const query of cases){const conditions={};for(const [variant,text]of [['raw',query.query],['prepared',lexicalQuery(query.query)]]){const start=performance.now();const response=await pagefind.search(text);const rows=await Promise.all(response.results.map(async row=>{const data=await row.data();return{article:new URL(data.url,'https://gkoreli.com').pathname.replace(/^\/|\/$/g,''),score:typeof row.score==='number'?row.score:null,title:data.meta.title??null,sections:(data.sub_results??[]).slice(0,3).map(section=>({url:section.url,title:section.title,excerptSha256:sha(section.plain_excerpt??section.excerpt??'')}))};}));const rank=rows.findIndex(row=>row.article===query.article);conditions[variant]={searchText:text,totalMs:performance.now()-start,returned:rows.length,articles:rows.slice(0,10),fullRankingDigest:sha(JSON.stringify(rows)),knownArticleAt1:rank===0,knownArticleAt3:rank>=0&&rank<3,knownArticleRank:rank<0?null:rank+1,knownBlockMetric:null};}results.push({id:query.id,article:query.article,form:query.form,conditions});}
writeFileSync(output,JSON.stringify({completedAt:new Date().toISOString(),split,caseSha256:sha(readFileSync(caseFile)),indexReceiptSha256:sha(readFileSync(join(root,'receipt.json'))),boundary:'Native whole-page Pagefind: article outcome and section/snippet identities. No invented equivalence to three source-block excerpts.',results},null,2)+'\n',{flag:'wx'});console.log({completed:results.length,split});

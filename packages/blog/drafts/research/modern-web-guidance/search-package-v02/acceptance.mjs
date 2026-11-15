import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const [siteArg,packageArg,modelArg,outputArg]=process.argv.slice(2);
if(!outputArg)throw Error('Usage: acceptance.mjs /built-site /search-package /model /fresh-output.json');
const site=resolve(siteArg),root=resolve(packageArg),output=resolve(outputArg),hash=x=>createHash('sha256').update(x).digest('hex');
if(existsSync(output))throw Error('Refusing to overwrite acceptance.');
const manifest=JSON.parse(readFileSync(join(site,'search-manifest.json'))),serialized=readFileSync(join(site,manifest.index),'utf8'),corpus=JSON.parse(serialized);
const old=JSON.parse(readFileSync(new URL('../search-package/cases.json',import.meta.url))).cases,labels=JSON.parse(readFileSync(new URL('../search-package/production-labels.json',import.meta.url))).cases;
const cases=[...old.map(c=>({...c,targets:labels.find(l=>l.id===c.id)?.targets.flatMap(t=>t.passages)??[]})),...JSON.parse(readFileSync(new URL('./confirmation.json',import.meta.url))).cases.map(c=>({...c,targets:c.targets.map(t=>t.id)}))];
const passages=new Map(corpus.articles.flatMap(a=>a.passages.map(p=>[p.id,p])));
for(const c of cases)for(const id of c.targets)if(!passages.has(id))throw Error('Missing selected passage '+id);
const {parse}=createRequire(join(root,'package.json'))('parse5');let verifiedAnchors=0;
for(const a of corpus.articles){
 const tree=parse(readFileSync(join(site,a.url,'index.html'),'utf8')),ids=new Map();
 function visit(node){for(const attr of node.attrs??[])if(attr.name==='id')ids.set(attr.value,(ids.get(attr.value)??0)+1);for(const child of node.childNodes??[])visit(child);}
 visit(tree);for(const p of a.passages){if(ids.get(p.anchor)!==1)throw Error('Broken/duplicate destination '+p.id);verifiedAnchors++;}
}
const {createSearch}=await import(pathToFileURL(join(root,'dist/index.js'))),{createLocalE5}=await import(pathToFileURL(join(root,'dist/e5-node.js')));
const encoder=await createLocalE5(resolve(modelArg)),search=await createSearch(serialized,{encoder,loadVectors:async()=>readFileSync(join(site,manifest.vectors))}),rows=[];
try{for(const c of cases){const conditions={};for(const mode of ['words','related']){const result=await search.search(c.query,{mode}),rank=result.articles.findIndex(a=>a.article.id===c.article);conditions[mode]={articleAt3:rank>=0&&rank<3,joint:rank>=0&&rank<3&&result.articles[rank].passages.some(p=>c.targets.includes(p.passage.id)),articles:result.articles.map(a=>({id:a.article.id,passages:a.passages.map(p=>p.passage.id)}))};}rows.push({id:c.id,positive:!!c.article,conditions});}}finally{await encoder.close();}
const summary={};for(const group of ['S','V']){const selected=rows.filter(r=>group==='V'?r.id.startsWith('V'):!r.id.startsWith('V')),positive=selected.filter(r=>r.positive);summary[group]=Object.fromEntries(['words','related'].map(m=>[m,{articleAt3:positive.filter(r=>r.conditions[m].articleAt3).length,joint:positive.filter(r=>r.conditions[m].joint).length,negativesReturningArticles:selected.filter(r=>!r.positive&&r.conditions[m].articles.length).length}]));}
const receipt={completedAt:new Date().toISOString(),boundary:'Actual integrated build, including expanded source-note omissions. Node CPU acceptance of already-observed source-aware cases, not a fresh relevance experiment.',indexSha256:hash(serialized),indexId:corpus.id,articles:corpus.articles.length,passages:passages.size,vectorRows:corpus.semantic.rows.length,indexBytes:manifest.indexBytes,vectorBytes:manifest.vectorBytes,relatedDownloadBytes:manifest.relatedDownloadBytes,verifiedAnchors,summary,rows};writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log({...receipt,rows:rows.length});

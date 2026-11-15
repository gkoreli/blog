import { readFileSync, writeFileSync, mkdirSync, cpSync, symlinkSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [rawArg,packageArg,modelArg,phase] = process.argv.slice(2);
if(!['development','confirmation'].includes(phase)) throw Error('Usage: evaluate.mjs /private/raw /package /model development|confirmation');
const raw=resolve(rawArg),root=resolve(packageArg),local=new URL('./',import.meta.url);
const hash=text=>createHash('sha256').update(text).digest('hex');
const serialized=readFileSync(join(raw,'index-start.json'),'utf8'),vectors=readFileSync(join(raw,'vectors-start.f32'));
const freeze=JSON.parse(readFileSync(new URL('input-freeze.json',local)));
if(hash(serialized)!==freeze.indexSha256) throw Error('Corpus changed.');
const development=JSON.parse(readFileSync(new URL('../search-package/cases.json',local))).cases;
const labels=JSON.parse(readFileSync(new URL('../search-package/production-labels.json',local))).cases;
const confirmation=JSON.parse(readFileSync(new URL('confirmation.json',local))).cases;
const cases=phase==='development'?development.map(row=>({...row,targets:labels.find(item=>item.id===row.id)?.targets.flatMap(target=>target.passages)??[]})):confirmation.map(row=>({...row,targets:row.targets.map(p=>p.id)}));
const variants=[
 {id:'v01',changes:0},
 {id:'body',passageBody:true,articleFusion:false,coverageRecovery:false,changes:1},
 {id:'article',passageBody:false,articleFusion:true,coverageRecovery:false,changes:1},
 {id:'coverage',passageBody:false,articleFusion:false,coverageRecovery:true,changes:1},
 {id:'combined',passageBody:true,articleFusion:true,coverageRecovery:true,changes:3},
];
const choicePath=new URL('selection.json',local),output=new URL(`results-${phase}.json`,local);
if(existsSync(output)||existsSync(new URL(`attempt-${phase}.json`,local))) throw Error('Refusing to overwrite an attempt.');
const choice=phase==='confirmation'?JSON.parse(readFileSync(choicePath)):null;
const selected=phase==='confirmation'?variants.filter(v=>v.id==='v01'||v.id===choice.selected):variants;
writeFileSync(new URL(`attempt-${phase}.json`,local),JSON.stringify({startedAt:new Date().toISOString(),indexSha256:hash(serialized),confirmationSha256:hash(readFileSync(new URL('confirmation.json',local))),packageSearchSha256:hash(readFileSync(join(root,'dist/search.js'))),rankingSha256:hash(readFileSync(join(root,'dist/ranking.js'))),variants:selected},null,2)+'\n',{flag:'wx'});
const {createLocalE5}=await import(pathToFileURL(join(root,'dist/e5-node.js'))),encoder=await createLocalE5(resolve(modelArg));
const results=[];
try {
 for(const variant of selected){
  let entry=join(raw,'v01/dist/index.js');
  if(variant.id!=='v01'){
   const dir=join(raw,'variants',phase+'-'+variant.id);mkdirSync(dir,{recursive:true});cpSync(join(root,'dist'),join(dir,'dist'),{recursive:true});symlinkSync(join(root,'node_modules'),join(dir,'node_modules'));
   const ranking=join(dir,'dist/ranking.js');let source=readFileSync(ranking,'utf8');source=source.replace(/export const policy = .*?;/u,`export const policy = ${JSON.stringify({passageBody:variant.passageBody,articleFusion:variant.articleFusion,coverageRecovery:variant.coverageRecovery})};`);writeFileSync(ranking,source);entry=join(dir,'dist/index.js');
  }
  const {createSearch}=await import(pathToFileURL(entry));const engine=await createSearch(serialized,{encoder,loadVectors:async()=>vectors});const rows=[];
  for(const item of cases){
   const conditions={};
   for(const mode of ['words','related']){
    const began=performance.now(),response=await engine.search(item.query,{mode});const rank=response.articles.findIndex(a=>a.article.id===item.article);
    conditions[mode]={milliseconds:performance.now()-began,articleAt3:rank>=0&&rank<3,joint:rank>=0&&rank<3&&response.articles[rank].passages.some(p=>item.targets.includes(p.passage.id)),articles:response.articles.map(a=>({id:a.article.id,passages:a.passages.map(p=>p.passage.id)}))};
   }
   rows.push({id:item.id,positive:!!item.article,conditions});
  }
  const positives=rows.filter(r=>r.positive);const summary=Object.fromEntries(['words','related'].map(mode=>[mode,{articleAt3:positives.filter(r=>r.conditions[mode].articleAt3).length,joint:positives.filter(r=>r.conditions[mode].joint).length,negativesReturningArticles:rows.filter(r=>!r.positive&&r.conditions[mode].articles.length).length}]));
  results.push({variant:variant.id,changes:variant.changes,summary,rows});console.log(variant.id,summary);
 }
} finally {await encoder.close();}
writeFileSync(output,JSON.stringify({completedAt:new Date().toISOString(),phase,boundary:'Same current public corpus and float32 vectors; Node CPU E5. Source-aware selected judgments, not reader accuracy.',indexSha256:hash(serialized),results},null,2)+'\n',{flag:'wx'});
if(phase==='development'){
 const order=[...results].sort((a,b)=>(b.summary.words.joint+b.summary.related.joint)-(a.summary.words.joint+a.summary.related.joint)||(b.summary.words.articleAt3+b.summary.related.articleAt3)-(a.summary.words.articleAt3+a.summary.related.articleAt3)||a.changes-b.changes);
 writeFileSync(choicePath,JSON.stringify({selectedAt:new Date().toISOString(),selected:order[0].variant,rule:'Maximize summed joint hits, then summed article hits, then fewer policy changes on known development cases only.',developmentSha256:hash(readFileSync(output)),order:order.map(r=>r.variant)},null,2)+'\n',{flag:'wx'});
}

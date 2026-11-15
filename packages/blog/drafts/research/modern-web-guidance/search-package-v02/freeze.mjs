import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const raw = readFileSync(process.argv[2] ?? ''), corpus = JSON.parse(raw);
const specifications = [
 ['V01','cloudflare-turnstile-signup-failures','passage-b9c4d5c5b14060d6',['Turnstile single fresh widget recovery timeout','Where did I limit a failed verification widget to one automatic replacement under the original deadline?']],
 ['V02','filter-referrer-spam-without-deleting-analytics-history','passage-9bb32fdc9d82d29c',['referrer report shared assessment D1 row reads','Find the paragraph where calculating a traffic policy once reduced database work but could leave reports an hour old.']],
 ['V03','why-worktree-setup-is-slow-on-macos','passage-09d2bd9989d66239',['Linux build changed cached dependencies independent copies','Where did reusing installed files break the following package install, and copying them avoid the problem?']],
 ['V04','prompt-cache-context-edits','passage-f2fa5155480549d3',['Sonnet append instruction 7870 cached tokens','Find the measured case where adding an instruction at the end preserved cached work while editing the beginning lost it.']],
 ['V05','how-ghx-was-born','passage-51ad3efe4255bce2',['ghx GraphQL aliases batch five file reads','Which tool read several remote source files in one network round trip?']],
 ['V06','topologies-of-thoughts','passage-e74e558f4dd88051',['knowledge graph articulated relationship edge label','Where is the distinction between a binary connection between notes and explaining what their relationship actually is?']],
 ['V07','first-party-analytics-for-a-personal-blog','passage-54ecb253d7c4a6c4',['beacon POST Referer navigation source','Why did the analytics client have to send the original navigation source instead of using the event request header?']],
 ['V08','you-dont-need-codemap','passage-2a4cfca4fbcf3bcc',['ghx remote reconnaissance before local indexing','Which explanation puts remote repository exploration before the decision to clone and map the whole codebase?']],
 ['V09','bring-your-own-ai-agent','passage-2ee223e671627c07',['Brave BYOM AgentPort model versus agent','Where did I explain why bringing a model endpoint does not bring along agent memory, files and approval rules?']],
 ['V10','my-evals-say-it-works-i-dont-use-it','passage-7c4bbda87e3b4009',['eval capability habit setup tax','Find the paragraph saying a passing evaluation did not remove installation friction or make the product a habit.']],
];
const hash = text => createHash('sha256').update(text).digest('hex');
const cases = specifications.flatMap(([id,article,anchor,queries]) => {
 const doc=corpus.articles.find(row=>row.id===article), passage=doc?.passages.find(row=>row.anchor===anchor);
 if(!passage) throw Error('Missing frozen source: '+id);
 return queries.map((query,i)=>({id:id+(i?'-question':'-topic'),article,query,targets:[{id:passage.id,sha256:hash(passage.text)}]}));
});
for(const [i,query] of ['replacing a bicycle hydraulic brake hose','calculating inheritance tax in Portugal','identifying a poisonous wild mushroom','restoring a damaged vinyl record'].entries()) cases.push({id:'VN'+(i+1),article:null,query,targets:[]});
const destination=new URL('./confirmation.json',import.meta.url);
if(existsSync(destination)) throw Error('Refusing to overwrite frozen confirmation cases.');
writeFileSync(destination,JSON.stringify({boundary:'Agent-authored source-aware confirmation; prior corpus knowledge, incomplete labels, paired forms. Frozen before v0.2 ranking execution.',indexSha256:hash(raw),indexId:corpus.id,cases},null,2)+'\n',{flag:'wx'});
writeFileSync(new URL('./input-freeze.json',import.meta.url),JSON.stringify({frozenAt:new Date().toISOString(),indexSha256:hash(raw),confirmationSha256:hash(readFileSync(destination)),protocolSha256:hash(readFileSync(new URL('./protocol.md',import.meta.url))),sourceCommit:'369871d9',baselineVersion:'0.1.0'},null,2)+'\n',{flag:'wx'});
console.log({cases:cases.length,indexSha256:hash(raw)});

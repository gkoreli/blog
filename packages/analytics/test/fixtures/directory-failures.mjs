export const DIRECTORY_FAILURE_CASES = [
  {name:'valid',reason:null},
  {name:'http-status',reason:'dir-http-status'},
  {name:'redirect',reason:'dir-http-status'},
  {name:'media-type',reason:'dir-media-type'},
  {name:'declared-body-limit',reason:'dir-body-limit'},
  {name:'streamed-body-limit',reason:'dir-body-limit'},
  {name:'body-missing',reason:'dir-body-missing'},
  {name:'body-read-failed',reason:'dir-body-read-failed'},
  {name:'json-invalid',reason:'dir-json-invalid'},
  {name:'shape-invalid',reason:'dir-shape-invalid'},
  {name:'key-limit',reason:'dir-key-limit'},
  {name:'fetch-failed',reason:'dir-fetch-failed'},
  {name:'empty-keys',reason:'key-not-found'},
];

/** Actual Response/ReadableStream controls; no network or production keys. */
export function directoryFailureResponse(name, keys) {
  const headers={'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'no-store'};
  if(name==='fetch-failed')throw Error('directory-private-canary');
  if(name==='http-status')return new Response(null,{status:503});
  if(name==='redirect')return new Response(null,{status:307,headers:{Location:'https://directory-private-canary.example'}});
  if(name==='media-type')return Response.json({keys});
  if(name==='declared-body-limit')return new Response('{}',{headers:{...headers,'Content-Length':'65537'}});
  if(name==='streamed-body-limit')return new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(65537));controller.close();}}),{headers});
  if(name==='body-missing')return new Response(null,{headers});
  if(name==='body-read-failed')return new Response(new ReadableStream({start(controller){controller.error(Error('directory-private-canary'));}}),{headers});
  if(name==='json-invalid')return new Response('directory-private-canary',{headers});
  if(name==='shape-invalid')return Response.json({keys:'directory-private-canary'},{headers});
  if(name==='key-limit')return Response.json({keys:Array.from({length:129},()=>keys[0])},{headers});
  return Response.json({keys:name==='empty-keys'?[]:keys},{headers});
}

export async function directoryFailureMatrix(fixture, api, baseline=false) {
  const trial=fixture.cases.find(row=>row.form==='dictionary'&&row.scenario==='valid');
  const keys=Object.values(fixture.directories)[0].keys,rows=[];
  for(const item of DIRECTORY_FAILURE_CASES) {
    const paths=[];
    for(const mode of ['default','selected','audit']) {
      let fetches=0;
      const request=new Request(trial.url,{headers:trial.headers});
      const options={now:fixture.now,includeEvidence:true,cache:api.cache(),fetcher:(url,init)=>{
        if(init.redirect!=='manual')throw Error('Unexpected redirect policy');
        fetches++;return directoryFailureResponse(item.name,keys);
      }};
      const result=await(mode==='default'?api.verify(request,options):mode==='selected'?api.selected(request,'one',options):api.audit(request,options));
      const reason=baseline&&item.reason?.startsWith('dir-')?'directory-unavailable':item.reason;
      paths.push(mode==='audit'?{mode,assessment:result.assessment,verified:result.verifiedCandidates,unavailable:result.unavailableCandidates,fetches}
        :{mode,status:result.status,reason:result.reason??null,outcome:api.outcome(result),fetches});
      const path=paths.at(-1);
      if(mode==='audit') {
        if(path.verified!==(reason===null?1:0)||path.unavailable!==(reason===null?0:1))throw Error(item.name+'/audit mismatch');
      } else if(path.status!==(reason===null?'verified':'unverified')||path.reason!==reason||path.outcome!==(reason===null?'verified':'unavailable'))throw Error(item.name+'/'+mode+' mismatch');
      if(fetches!==1)throw Error('Unexpected fetch count');
    }
    rows.push({name:item.name,paths});
  }
  return rows;
}

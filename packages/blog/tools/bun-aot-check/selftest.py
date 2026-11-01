#!/usr/bin/env python3
"""Integration gates: real compiled server, strict JSON types, hot corruption, crash."""
import argparse,json,subprocess,sys,socket,select
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--bun',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True);tool=Path(__file__).parent.resolve();receipts=[]
def invoke(name,config,binary=None,entry=None,code=0,port=None):
 cases=a.out/(name+'-cases.json');cases.write_text(json.dumps(config))
 cmd=[sys.executable,str(tool/'compare.py'),'--project',str(entry.parent if entry else tool),'--cases',str(cases),'--out',str(a.out/name),'--runs','1','--seconds','1','--warmup','0','--startup-timeout','10']
 if entry:cmd+=['--entry',str(entry),'--bun',str(a.bun.resolve())]
 else:cmd+=['--binary','test='+str(binary)]
 if port is not None:cmd+=['--port',str(port)]
 r=subprocess.run(cmd,capture_output=True,text=True);(a.out/(name+'.log')).write_text(r.stdout+r.stderr);assert r.returncode==code,(name,r.returncode,r.stdout,r.stderr)
 summary=json.loads((a.out/name/'summary.json').read_text());receipts.append({'name':name,'exit':r.returncode,'complete':summary['complete'],'accepted_runs':[g['accepted_runs'] for g in summary['groups']],'errors':[g['errors'] for g in summary['groups']]});return summary
normal=json.loads((tool/'example-cases.json').read_text());good=invoke('build-and-run',normal,entry=tool/'example-server.ts')
assert good['complete'] and all(g['accepted_runs']==1 and g['first_checked_launch_ms']>0 for g in good['groups'])
binary=a.out/'build-and-run/private/jit'
wrong={'ready':normal['ready'],'cases':[{'name':'json-type','method':'POST','path':'/echo','json':{'value':True},'expected_json':{'value':1}}]}
r=invoke('boolean-is-not-number',wrong,binary=binary,code=1);assert not r['complete'] and r['groups'][0]['accepted_runs']==0 and 'JSON differs' in r['groups'][0]['errors'][0]
for name,source in [('hot-wrong-body','let n=0; Bun.serve({port:Number(process.env.PORT),fetch(r){ if(new URL(r.url).pathname==="/health") return Response.json({status:"ok"}); return new Response(++n<=3?"good":"bad"); }});'),('startup-crash','throw new Error("deliberate startup test");')]:
 entry=a.out/(name+'.ts');entry.write_text(source);target=a.out/(name+'-binary');c=subprocess.run([str(a.bun.resolve()),'build',str(entry),'--compile','--outfile',str(target)],capture_output=True);assert c.returncode==0
 config={'ready':normal['ready'],'cases':[{'name':'value','path':'/value','expected_text':'good'}]}
 r=invoke(name,config,binary=target,code=1);assert not r['complete'] and r['groups'][0]['accepted_runs']==0
 if name=='hot-wrong-body':assert 'HTTP load failed' in r['groups'][0]['errors'][0]
 else:assert 'exited at startup' in r['groups'][0]['errors'][0]
with socket.socket() as occupied:
 occupied.bind(('127.0.0.1',0));occupied.listen()
 r=invoke('occupied-port',normal,binary=binary,code=1,port=occupied.getsockname()[1])
 assert 'address already in use' in r['groups'][0]['errors'][0].lower()
 assert not select.select([occupied],[],[],0)[0], 'Tool attempted to load the occupied port'
bad_entry=a.out/'invalid-source.ts';bad_entry.write_text('export const value = ;\n')
r=invoke('compiler-failure',normal,entry=bad_entry,code=1);assert not r['complete'] and all(g['build_status']=='build_failed' for g in r['groups'])
typed=a.out/'invalid-type.ts';typed.write_text('const value: number = "text"; Bun.serve({port:Number(process.env.PORT),fetch(){return Response.json({value});}});')
typed_case={'ready':{'path':'/','expected_json':{'value':'text'}},'cases':[{'name':'value','path':'/','expected_json':{'value':'text'}}]}
r=invoke('native-type-error',typed_case,entry=typed,code=1);groups={g['mode']:g for g in r['groups']}
assert groups['jit']['accepted_runs']==1 and groups['bytecode']['accepted_runs']==1 and groups['aot']['build_status']=='build_failed'
(a.out/'acceptance.json').write_text(json.dumps(receipts,indent=2)+'\n');print('Passed',len(receipts),'integration gates')

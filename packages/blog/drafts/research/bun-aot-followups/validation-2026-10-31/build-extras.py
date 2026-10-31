#!/usr/bin/env python3
"""Build verification-only cases and the bytecode control, after main load ends."""
import argparse, hashlib, json, os, shutil, subprocess, time
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--root',type=Path,required=True)
p.add_argument('--bytecode-only',action='store_true')
p.add_argument('--record',default='builds.json')
a=p.parse_args();root=a.root.resolve();here=Path(__file__).resolve().parent
bun=root/'compiler/bun-darwin-aarch64/bun';validator=root/'validator';out=root/'extras';out.mkdir(exist_ok=True)
for name in ['deep-cases.mjs','deep-check.mjs']:shutil.copy2(here/'validator'/name,validator/name)
records=[]
def build(name,project,entry,flags,target):
    command=[str(bun),'build',entry,'--compile',*flags,'--outfile',str(target)]
    started=time.perf_counter();r=subprocess.run(command,cwd=project,capture_output=True,timeout=180)
    (out/(name+'.build.log')).write_bytes(r.stdout+r.stderr)
    row=dict(name=name,flags=flags,exit=r.returncode,seconds=time.perf_counter()-started)
    if r.returncode==0:row.update(bytes=target.stat().st_size,sha256=hashlib.sha256(target.read_bytes()).hexdigest())
    else:row['error_tail']=(r.stdout+r.stderr).decode(errors='replace')[-2000:]
    records.append(row);(out/a.record).write_text(json.dumps(records,indent=2)+'\n')
    print(name,r.returncode,row.get('bytes'),flush=True)
    return r.returncode==0

api=root/'sources/api/apps/elysia-api'
bytecode_ok=build('api-wired-bytecode',api,'wired-entry.ts',['--bytecode','--format=esm'],api/'builds/api-wired-bytecode')
if a.bytecode_only:raise SystemExit(0 if bytecode_ok else 1)
compat=root/'compat-commonjs';shutil.copytree(here/'compat-commonjs',compat,dirs_exist_ok=True)
compat_results=[]
for mode,flags in [('jit',[]),('native',['--aot'])]:
    name='commonjs-'+mode;target=out/name
    success=build(name,compat,'main.mjs',flags,target)
    row=dict(mode=mode,build_success=success)
    if success:
        r=subprocess.run([str(target)],cwd=compat,capture_output=True,timeout=15)
        (out/(name+'.run.log')).write_bytes(r.stdout+r.stderr)
        row.update(exit=r.returncode,stdout=r.stdout.decode(errors='replace'),expected_output=r.returncode==0 and r.stdout==b'42\n')
    compat_results.append(row)
(out/'commonjs-results.json').write_text(json.dumps(compat_results,indent=2)+'\n')
for fixture in ['runtime','standalone']:
    for mode,flags in [('jit',[]),('native',['--aot'])]:
        name=f'deep-{fixture}-{mode}'
        build(name,validator,'deep-check.mjs',[*flags,'--define','USE_STANDALONE='+('true' if fixture=='standalone' else 'false')],out/name)

parity=[]
env={**os.environ,'ATA_NO_NATIVE':'1'};env.pop('ENGINE',None)
for fixture,mode,extra in [('runtime','jit',{}),('runtime','native',{}),('standalone','jit',{}),('standalone','native',{}),('runtime','jit',{'ENGINE':'interpreter'}),('runtime','native',{'ENGINE':'auto'})]:
    name=f'deep-{fixture}-{mode}';label=name+('-'+extra['ENGINE'] if extra else '')
    if not any(r['name']==name and r['exit']==0 for r in records):
        parity.append(dict(mode=label,error='build failed'));continue
    r=subprocess.run([str(out/name)],cwd=validator,env={**env,**extra},capture_output=True,timeout=30)
    (out/(label+'.stderr.log')).write_bytes(r.stderr)
    try:rows=json.loads(r.stdout)
    except ValueError:
        parity.append(dict(mode=label,exit=r.returncode,error=r.stdout.decode(errors='replace')[:500]));continue
    parity.append(dict(mode=label,exit=r.returncode,cases=rows))
(out/'deep-parity.json').write_text(json.dumps(parity,indent=2)+'\n')
reference=next(r['cases'] for r in parity if r['mode']=='deep-runtime-jit')
summary=[]
for group in parity:
    if 'cases' not in group:summary.append(group);continue
    differences=[]
    for expected,actual in zip(reference,group['cases'],strict=True):
        assert (expected['kind'],expected['name'])==(actual['kind'],actual['name'])
        fields=[]
        if actual['actual']!=actual['expected']:fields.append('verdict-versus-label')
        if actual['input']!=expected['input']:fields.append('mutated-input-versus-runtime-jit')
        if actual['result']!=expected['result']:fields.append('serialized-result-versus-runtime-jit')
        if fields:differences.append(dict(kind=actual['kind'],case=actual['name'],fields=fields))
    summary.append(dict(mode=group['mode'],exit=group['exit'],cases=len(group['cases']),wrong_verdicts=sum(r['actual']!=r['expected'] for r in group['cases']),differences=differences))
(out/'deep-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print('Deep summary',[(r['mode'],r.get('wrong_verdicts'),len(r.get('differences',[]))) for r in summary],flush=True)

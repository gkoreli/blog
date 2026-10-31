#!/usr/bin/env python3
"""Compare public result values/mutations first, then consume returned data/errors."""
import argparse, hashlib, json, os, re, statistics, subprocess, time
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--bun',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--runs',type=int,default=12)
a=p.parse_args();assert a.runs%4==0
bun=a.bun.resolve();out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
env={**os.environ,'ATA_NO_NATIVE':'1','LC_ALL':'C'};env.pop('ENGINE',None)
builds=[];modes=[];parity=[];reference=None
for fixture,adapted in [('runtime',False),('adapted',True)]:
    for mode,flags in [('jit',[]),('aot',['--aot'])]:
        name=f'{fixture}-{mode}';modes.append(name)
        for entry,suffix in [('contract-entry.mjs',''),('contract-check.mjs','-check')]:
            target=out/(name+suffix);cmd=[str(bun),'build',entry,'--compile',*flags,'--define','USE_ADAPTED='+str(adapted).lower(),'--outfile',str(target)]
            r=subprocess.run(cmd,env=env,capture_output=True,timeout=180);(out/(target.name+'.build.log')).write_bytes(r.stdout+r.stderr)
            builds.append(dict(name=target.name,exit=r.returncode,bytes=target.stat().st_size if r.returncode==0 else None,sha256=hashlib.sha256(target.read_bytes()).hexdigest() if r.returncode==0 else None));assert r.returncode==0,r.stderr.decode()
            (out/'builds.json').write_text(json.dumps(builds,indent=2)+'\n')
        r=subprocess.run([str(out/(name+'-check'))],env=env,capture_output=True,timeout=30)
        rows=json.loads(r.stdout);parity.append(dict(mode=name,exit=r.returncode,cases=rows));(out/'parity.json').write_text(json.dumps(parity,indent=2)+'\n');assert r.returncode==0
        if reference is None:reference=rows
        differences=[dict(kind=left['kind'],case=left['name'],reference=left,candidate=right) for left,right in zip(reference,rows,strict=True) if left!=right]
        parity[-1]['differences']=differences
        (out/'parity.json').write_text(json.dumps(parity,indent=2)+'\n')
        # The defaults schema was excluded from timing in the frozen plan.
        # Preserve its error-order difference; require full values/mutations
        # to match on every selected case of the two actual timed schemas.
        assert all(d['kind']=='defaults' for d in differences),(name,'timed-schema result/mutation contract differs')
(out/'parity.json').write_text(json.dumps(parity,indent=2)+'\n')
(out/'builds.json').write_text(json.dumps(builds,indent=2)+'\n')

def expected(count,schema,mixed):
    path='/id' if schema=='simple' else '/items/0/quantity'
    # Independent oracle for the exact varying ID/error-path checksum.
    accepted=0;checksum=0
    for i in range(count):
        if mixed and i%4==0:checksum+=1+len(path)
        else:accepted+=1;checksum+=(i%256)+1
    return dict(accepted=accepted,checksum=checksum)
oracles={(schema,mixed,count):expected(count,schema,mixed) for schema in ['simple','nested'] for mixed in [False,True] for count in [200000,1000000]}
rows=[]
def run(name,schema,mixed):
    start=time.perf_counter_ns()
    r=subprocess.run(['/usr/bin/time','-l',str(out/name)],env={**env,'SCHEMA':schema,'TRAFFIC':'mixed' if mixed else 'valid','ITERATIONS':'1000000','WARMUP':'200000'},capture_output=True,timeout=45)
    elapsed=(time.perf_counter_ns()-start)/1e6
    assert r.returncode==0,r.stderr.decode();payload=json.loads(r.stdout)
    oracle=oracles[(schema,mixed,1000000)];assert all(payload[k]==v for k,v in oracle.items())
    assert payload['warm']==oracles[(schema,mixed,200000)]
    stderr=r.stderr.decode()
    def metric(label):
        match=re.search(r'(\d+)\s+'+re.escape(label),stderr);assert match;return int(match[1])
    return dict(mode=name,schema=schema,traffic='mixed' if mixed else 'valid',elapsed_ms=elapsed,peak_physical_bytes=metric('peak memory footprint'),peak_rss_bytes=metric('maximum resident set size'),**payload)
for schema in ['simple','nested']:
    for mixed in [False,True]:
        for mode in modes:
            for _ in range(2):run(mode,schema,mixed)
        for block in range(a.runs):
            order=modes[block%4:]+modes[:block%4]
            if (block//4)%2:order=list(reversed(order))
            for position,mode in enumerate(order):rows.append(dict(block=block,position=position,**run(mode,schema,mixed)))
            (out/'observations.json').write_text(json.dumps(rows,indent=2)+'\n')
            print(schema,'mixed' if mixed else 'valid',block+1,flush=True)
summary=[]
for schema in ['simple','nested']:
    for traffic in ['valid','mixed']:
        for mode in modes:
            group=[r for r in rows if r['mode']==mode and r['schema']==schema and r['traffic']==traffic]
            summary.append(dict(schema=schema,traffic=traffic,mode=mode,n=len(group),metrics={k:dict(median=statistics.median(r[k] for r in group),min=min(r[k] for r in group),max=max(r[k] for r in group)) for k in ['hot_ms','elapsed_ms','peak_physical_bytes','peak_rss_bytes']}))
result=dict(method='One million checks, 256 varying inputs, 200000 warmups per fresh process; consume returned data.id and invalid error paths. Check 133 hand-labeled cases first; require full serialized results/mutations/reference identity to match on all 103 cases of the two timed schemas. Defaults are untimed and retain one recorded error-order difference. Four modes balanced/reversed over 12 blocks; warm filesystem.',builds=builds,source_sha256={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in Path.cwd().glob('*.mjs')},summary=summary)
(out/'results.json').write_text(json.dumps(result,indent=2)+'\n');print('DONE',len(rows),flush=True)

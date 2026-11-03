from pathlib import Path
import hashlib, json, re, statistics, subprocess
root=Path(__file__).resolve().parent
sample=root/'dvbsubtest_filter.ts'
names=['upstream','prior','scalar','wide','rle-variant','combined','final']
verification={}
for mode in (-2,-1,0,1):
    outputs={}
    for name in names:
        dest=root/f'output-{name}-{mode}.bin'
        subprocess.run([str(root/f'decode-{name}'),str(sample),'1',str(mode),str(dest)],capture_output=True,text=True,check=True)
        outputs[name]=dest.read_bytes()
    assert len({hashlib.sha256(v).digest() for v in outputs.values()})==1,mode
    verification[str(mode)]={'identical':True,'bytes':len(outputs['upstream'])}
(root/'decoder-verification.json').write_text(json.dumps(verification,indent=2)+'\n')
results={}
for mode in (-1,1):
    passes=1000 if mode==-1 else 100
    samples={name:[] for name in names}
    for round in range(7):
        order=names[round%len(names):]+names[:round%len(names)]
        for name in order:
            p=subprocess.run([str(root/f'decode-{name}'),str(sample),str(passes),str(mode)],capture_output=True,text=True,check=True)
            seconds=float(re.search(r'cpu_s=([0-9.]+)',p.stdout)[1]);samples[name].append(seconds)
    results[str(mode)]={'passes':passes,'rounds':7,'cpu_seconds':samples,'medians':{name:statistics.median(v) for name,v in samples.items()}}
    print(json.dumps({str(mode):results[str(mode)]}),flush=True)
(root/'whole-decode.json').write_text(json.dumps(results,indent=2)+'\n')

from pathlib import Path
import hashlib, json, subprocess, statistics, re
root=Path(__file__).resolve().parent
names=['upstream','prior','scalar','wide','rle-variant','combined','final']
verification={}
for mode in (-2,-1,0,1):
    outputs={}
    for name in names:
        dest=root/f'corpus-{name}-{mode}.bin'
        p=subprocess.run([str(root/f'packets-{name}'),str(root/'corpus.dvbpackets'),'1',str(mode),str(dest)],capture_output=True,text=True,check=True)
        outputs[name]=hashlib.sha256(dest.read_bytes()).hexdigest()
    assert len(set(outputs.values()))==1,(mode,outputs)
    verification[str(mode)]={'identical':True,'hashes':outputs}
(root/'corpus-verification.json').write_text(json.dumps(verification,indent=2)+'\n')
print('All generated-packet outputs match',flush=True)
results={}
for mode in (-1,0,1):
    samples={name:[] for name in names}
    for round in range(5):
        for name in names[round%len(names):]+names[:round%len(names)]:
            p=subprocess.run([str(root/f'packets-{name}'),str(root/'corpus.dvbpackets'),'10',str(mode)],capture_output=True,text=True,check=True)
            samples[name].append(float(re.search(r'cpu_s=([0-9.]+)',p.stdout)[1]))
    results[str(mode)]={'passes':10,'rounds':5,'cpu_seconds':samples,'medians':{name:statistics.median(v) for name,v in samples.items()}}
    print(json.dumps({str(mode):results[str(mode)]}),flush=True)
(root/'corpus-bench.json').write_text(json.dumps(results,indent=2)+'\n')

"""Repeated rotating-order whole-decoder CPU benchmarks; run without proof jobs."""
import argparse,hashlib,json,platform,re,statistics,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--baseline',type=Path,required=True);p.add_argument('--decoder-out',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--default-long',action='store_true');a=p.parse_args()
b=a.baseline.resolve();d=a.decoder_out.resolve();out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
names=['upstream','optimization','hardened'];results=[]
for fixture,program,inputfile,modes,rounds in [('real','decode','dvbsubtest_filter.ts',[-1,1],7),('generated','packets','corpus.dvbpackets',[-1,0,1],5)]:
    for mode in modes:
        if a.default_long and (fixture!='real' or mode!=-1):continue
        if a.default_long:rounds=9
        passes=(1000 if mode==-1 else 100) if fixture=='real' else 10
        if a.default_long:passes=10000
        programs={'upstream':b/(program+'-upstream'),'optimization':b/(program+'-final'),'hardened':d/(program+'-normal')}
        samples={n:[] for n in names}
        for round in range(rounds):
            order=names[round%3:]+names[:round%3]
            for name in order:
                proc=subprocess.run([str(programs[name]),str(b/inputfile),str(passes),str(mode)],capture_output=True,text=True,check=True)
                samples[name].append(float(re.search(r'cpu_s=([0-9.]+)',proc.stdout)[1]))
        medians={n:statistics.median(v) for n,v in samples.items()}
        record={'fixture':fixture,'mode':mode,'passes':passes,'rounds':rounds,'cpu_seconds':samples,'medians':medians,'upstream_over_hardened':medians['upstream']/medians['hardened'],
                'input_sha256':hashlib.sha256((b/inputfile).read_bytes()).hexdigest(),'executable_sha256':{n:hashlib.sha256(path.read_bytes()).hexdigest() for n,path in programs.items()}}
        results.append(record);print(fixture,mode,medians,flush=True)
receipt={'platform':platform.platform(),'machine':platform.machine(),'compiler':subprocess.check_output(['clang','--version'],text=True),'method':'process CPU time; repeated complete decodes; rotating execution order; median; one host; no universal speed claim','results':results}
(out/'benchmarks.json').write_text(json.dumps(receipt,indent=2)+'\n')

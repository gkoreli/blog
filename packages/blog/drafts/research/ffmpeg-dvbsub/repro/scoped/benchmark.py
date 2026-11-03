"""Final comparisons with fixed source wrappers, rotating order and raw CPU samples."""
import argparse,hashlib,json,platform,re,statistics,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--baseline',type=Path,required=True);p.add_argument('--decoder',type=Path,required=True);p.add_argument('--previous',type=Path,required=True);a=p.parse_args()
b=a.baseline.resolve();d=a.decoder.resolve();previous=a.previous.resolve();out=a.out.resolve();out.mkdir(exist_ok=True,parents=True);results=[]
names=['upstream','previous','scoped']
for fixture,prog,inputfile,modes,rounds in [('real','decode','dvbsubtest_filter.ts',[1,-1],9),('generated','packets','corpus.dvbpackets',[1,-1,0],9)]:
 programs={'upstream':b/(prog+'-upstream'),'previous':previous/(prog+'-normal'),'scoped':d/(prog+'-palette')}
 for mode in modes:
  passes=(200 if mode==1 else 3000) if fixture=='real' else 20
  samples={n:[] for n in names}
  for turn in range(rounds):
   order=names[turn%3:]+names[:turn%3]
   for name in order:
    proc=subprocess.run([str(programs[name]),str(b/inputfile),str(passes),str(mode)],capture_output=True,text=True,check=True)
    samples[name].append(float(re.search(r'cpu_s=([0-9.]+)',proc.stdout)[1]))
  medians={n:statistics.median(v) for n,v in samples.items()}
  record={'fixture':fixture,'mode':mode,'passes':passes,'rounds':rounds,'cpu_seconds':samples,'medians':medians,'upstream_over_scoped':medians['upstream']/medians['scoped'],'previous_over_scoped':medians['previous']/medians['scoped'],'input_sha256':hashlib.sha256((b/inputfile).read_bytes()).hexdigest(),'executable_sha256':{n:hashlib.sha256(x.read_bytes()).hexdigest() for n,x in programs.items()}}
  results.append(record);print(fixture,mode,medians,flush=True)
receipt={'platform':platform.platform(),'compiler':subprocess.check_output(['clang','--version'],text=True),'method':'process CPU; complete decodes; nine rotating rounds (balanced positions); same -O3 wrapper compilation; no proof/build jobs during measurements','results':results}
(out/'benchmarks.json').write_text(json.dumps(receipt,indent=2)+'\n')

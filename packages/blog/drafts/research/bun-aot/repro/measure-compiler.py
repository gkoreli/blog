import hashlib,json,pathlib,platform,re,statistics,subprocess,time
root=pathlib.Path(__file__).resolve().parent
rows=[]
for repeat in range(6):
 modes=['jit','aot'] if repeat%2==0 else ['aot','jit']
 for mode in modes:
  cmd=['/usr/bin/time','-l',str(root/f'tsc-{mode}'),'-p',str(root/'effect-tsconfig.json'),'--pretty','false','--extendedDiagnostics']
  p=subprocess.run(cmd,capture_output=True,text=True)
  (root/f'compiler-{repeat}-{mode}.stdout').write_text(p.stdout)
  (root/f'compiler-{repeat}-{mode}.stderr').write_text(p.stderr)
  if p.returncode:raise RuntimeError((mode,p.returncode,p.stdout,p.stderr))
  timed=re.search(r'([\d.]+) real\s+([\d.]+) user\s+([\d.]+) sys',p.stderr)
  metric=lambda key:int(re.search(r'(\d+)\s+'+key,p.stderr).group(1))
  diag={k:v.strip() for k,v in re.findall(r'^([^:\n]+):\s+([^\n]+)$',p.stdout,re.M)}
  row=dict(mode=mode,repeat=repeat,warmup=repeat==0,real_s=float(timed[1]),user_s=float(timed[2]),system_s=float(timed[3]),peak_rss_bytes=metric('maximum resident set size'),peak_footprint_bytes=metric('peak memory footprint'),diagnostics=diag)
  rows.append(row)
  (root/'compiler-results.json').write_text(json.dumps(dict(platform=platform.platform(),command_input=str(root/'effect-tsconfig.json'),rows=rows),indent=2))
  print(mode,repeat,row['real_s'],row['peak_rss_bytes'],row['peak_footprint_bytes'],diag.get('Files'),diag.get('Lines of TypeScript'),flush=True)
print('DONE',flush=True)

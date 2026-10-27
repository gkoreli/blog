import hashlib,json,os,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parent
bun=root/'bun-darwin-aarch64/bun'
env=dict(os.environ,BUN_ENABLE_CRASH_REPORTING='0',DO_NOT_TRACK='1')
rows=[]

def case(label,source,mode,flags,args=(),extra=()):
 out=root/f'check-{label}-{mode}'
 command=[str(bun),'build','--compile',*flags,source,*extra,'--outfile',str(out)]
 build=subprocess.run(command,cwd=root,env=env,capture_output=True,text=True)
 run=subprocess.run([str(out),*args],cwd=root,env=env,capture_output=True,text=True) if build.returncode==0 else None
 diagnostic='the file was bound without BindOptions::runtime' if 'the file was bound without BindOptions::runtime' in build.stderr else None
 row=dict(case=label,mode=mode,build_exit=build.returncode,known_diagnostic=diagnostic,run=None if run is None else dict(exit=run.returncode,stdout=run.stdout,stderr_summary='ERR_MODULE_NOT_FOUND' if 'ERR_MODULE_NOT_FOUND' in run.stderr or 'Cannot find module' in run.stderr else None))
 rows.append(row)
 print(json.dumps(row),flush=True)
 return row
for source in ['semantics','builtin-mutation','dynamic-folder']:
 for mode,flags in [('jit',[]),('aot',['--aot'])]:case(source,source+'.ts',mode,flags)
case('late-embedded','late-host.ts','aot',['--aot'],['./plugins/alpha.ts'],['plugins/alpha.ts'])
case('late-default','late-host.ts','aot',['--aot'],[str(root/'plugins/alpha.ts')])
case('late-disk','late-host.ts','aot',['--aot','--aot-allow-code-from-disk'],[str(root/'plugins/alpha.ts')])
for mode,flags in [('jit',[]),('aot',['--aot']),('aot-trim',['--aot','--trim'])]:case('commonjs','commonjs-case/main.mjs',mode,flags)
(root/'manual-results.json').write_text(json.dumps(rows,indent=2))

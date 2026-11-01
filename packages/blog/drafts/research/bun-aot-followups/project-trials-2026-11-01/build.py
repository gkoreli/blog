#!/usr/bin/env python3
"""Parameterized reproduction of the accepted variants; executed argv is in results."""
import argparse,hashlib,json,os,subprocess,time
from pathlib import Path
PINS={'keryx':'d119595bec716ae99b4eca740964343e47f57eee','next-bun-compile':'43ab16c93774f23923654d337e6e2d9c205e4fe4'}
CONSOLE=['assert','debug','dir','dirxml','error','group','groupCollapsed','groupEnd','info','log','table','trace','warn']

def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--project',choices=['keryx','next'],required=True);a=p.parse_args();lab=a.lab.resolve();assert not a.out.exists(),'use a fresh build output';a.out.mkdir(parents=True)
 bun=lab/'compiler/bun-darwin-aarch64/bun';root=lab/('keryx' if a.project=='keryx' else 'next-bun-compile');pin=PINS[root.name];assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==pin
 env={**os.environ,'PATH':str(bun.parent)+os.pathsep+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'};rows=[]
 def run(name,argv,cwd):
  start=time.monotonic()
  with (a.out/(name+'.log')).open('wb') as log:r=subprocess.run(argv,cwd=cwd,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=240)
  row={'name':name,'argv':argv,'exit':r.returncode,'seconds':time.monotonic()-start};rows.append(row);(a.out/'builds.json').write_text(json.dumps(rows,indent=2));assert r.returncode==0,('build failed',name)
  f=a.out/name
  if f.exists():row.update(bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest())
  (a.out/'builds.json').write_text(json.dumps(rows,indent=2))
 if a.project=='keryx':
  file=root/'packages/keryx/util/oauthTemplates.ts';source=file.read_text();original='const frameworkTemplatesDir = import.meta.dir + "/../templates";';normalized='const frameworkTemplatesDir = path.join(import.meta.dir, "..", "templates");'
  if original in source:file.write_text('import path from "node:path";\n'+source.replace(original,normalized))
  else:assert normalized in source and 'import path from "node:path";' in source
  entries=['example/backend/keryx.ts']
  for folder in ['packages/keryx/initializers','packages/keryx/servers','packages/keryx/actions','example/backend/actions','example/backend/config','example/backend/schema','example/backend/initializers','example/backend/channels']:
   entries+=sorted(str(f.relative_to(root)) for f in (root/folder).rglob('*.ts'))
  assets=[]
  for folder in ['packages/keryx/lua','packages/keryx/templates','example/backend/assets','example/backend/mcpApp']:
   if (root/folder).exists():assets+=['--asset',folder]
  run('native',[str(bun),'build',*entries,'--compile','--format=esm','--root','.',*assets,'--aot','--outfile',str(a.out/'native')],root)
 else:
  app=root/'examples/sharp';fixture=Path(__file__).with_name('fixture')
  for rel in ['app/api/study/route.ts','public/study-asset.txt']:
   f=app/rel;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes((fixture/rel).read_bytes())
  run('adapter',[str(bun),'run','build'],root)
  link=root/'node_modules/next-bun-compile'
  if not link.exists():link.symlink_to('..')
  run('next-build',[str(bun),'run','build'],app)
  entry=app/'.next/nbc-standalone/examples/sharp/study-entry.js';entry.write_text('// Explicit console mutation declarations for the disk-loaded Next runtime.\n'+''.join(f'console.{m} = console.{m};\n' for m in CONSOLE)+'require("./server-entry.js");\n')
  # Obtain the flags from the pinned adapter itself, rather than copying a stale list.
  generator=a.out/'commands.ts';generator.write_text('import { buildCompileArgs } from '+json.dumps(str(root/'src/compile.ts'))+';\nconsole.log(JSON.stringify(buildCompileArgs('+json.dumps(str(entry))+', "OUTPUT")));\n')
  base=json.loads(subprocess.check_output([str(bun),str(generator)],cwd=app,env=env,text=True))
  for mode,flags in [('jit',[]),('native-disk',['--aot','--aot-allow-code-from-disk'])]:
   argv=[str(a.out/mode) if arg=='OUTPUT' else arg for arg in base];run(mode,[str(bun),*argv,*flags],app)
 print(a.out/'builds.json')
if __name__=='__main__':main()

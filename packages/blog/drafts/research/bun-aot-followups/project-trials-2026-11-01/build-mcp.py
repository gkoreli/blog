#!/usr/bin/env python3
"""Prebuild the existing MCP UI and compile a separate native variant, restoring inputs."""
import argparse,json,os,subprocess,hashlib
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();assert not a.out.exists();a.out.mkdir(parents=True);root=a.lab/'keryx';app=root/'example/backend';file=app/'actions/mcp.ts';generated=app/'study-mcp-status.ts';assert not generated.exists();original=file.read_bytes();bun=a.lab/'compiler/bun-darwin-aarch64/bun';env={**os.environ,'NODE_ENV':'production','PATH':str(bun.parent)+os.pathsep+os.environ['PATH'],'MCP_SERVER_ENABLED':'false','LOG_LEVEL':'fatal'}
 try:
  with (a.out/'prebuild.log').open('wb') as log:r=subprocess.run([str(bun),str(Path(__file__).with_name('prebuild-mcp.ts').resolve()),str(a.lab)],cwd=app,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=60)
  assert r.returncode==0,'MCP UI prebuild failed'
  s=original.decode();old='client: new URL("../mcpApp/status.ts", import.meta.url),';assert s.count(old)==1
  file.write_text('import studyStatusHtml from "../study-mcp-status";\n'+s.replace(old,'html: studyStatusHtml,'))
  patch=subprocess.check_output(['git','diff','--','example/backend/actions/mcp.ts'],cwd=root);(a.out/'ui-declaration.patch').write_bytes(patch)
  # Reuse the exact accepted normalized native command, changing only the output.
  command=json.loads((a.lab/'keryx-normalized/builds.json').read_text())[0]['argv'];command[command.index('--outfile')+1]=str(a.out/'native')
  with (a.out/'build.log').open('wb') as log:r=subprocess.run(command,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=180)
  assert r.returncode==0,'Native build failed'
  html=(a.lab/'prebuilt-mcp-status.html').read_bytes();(a.out/'build.json').write_text(json.dumps({'argv':command,'exit':r.returncode,'bytes':(a.out/'native').stat().st_size,'sha256':hashlib.sha256((a.out/'native').read_bytes()).hexdigest(),'html_bytes':len(html),'html_sha256':hashlib.sha256(html).hexdigest(),'ui_patch_sha256':hashlib.sha256(patch).hexdigest(),'generated_source_sha256':hashlib.sha256(generated.read_bytes()).hexdigest()},indent=2));print('Native prebuilt-MCP variant built',flush=True)
 finally:
  file.write_bytes(original)
  if generated.exists():generated.unlink()
if __name__=='__main__':main()

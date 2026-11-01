#!/usr/bin/env python3
"""Publish selected reproducible data; operational logs stay in the private lab."""
import argparse,datetime,gzip,hashlib,json,platform,re,subprocess
from pathlib import Path

def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);a=p.parse_args();lab=a.lab.resolve();here=Path(__file__).resolve().parent;out=here/'results';out.mkdir(exist_ok=True);files=[]
 def save(name,data,compressed=False):
  b=data if isinstance(data,bytes) else (json.dumps(data,indent=2)+'\n').encode();stored=gzip.compress(b,mtime=0) if compressed else b;f=out/(name+'.gz' if compressed else name);f.write_bytes(stored);files.append({'path':f.name,'bytes':len(stored),'sha256':sha(stored),'uncompressed_bytes':len(b),'uncompressed_sha256':sha(b)})
 for batch in ['keryx-verify-v1','next-verify-v1','keryx-startup','next-startup','keryx-load','next-load','next-dynamic','keryx-extra','keryx-extra-v2','keryx-cookie','keryx-external','keryx-long','timer-short','timer-long-fixed']:
  save(batch+'.json',(lab/batch/'observations.json').read_bytes(),compressed=True)
 save('summary.json',(lab/'accepted-complete/summary.json').read_bytes())
 build_inputs={}
 for group in ['keryx-builds','keryx-wired','keryx-normalized','next-builds','next-final']:
  build_inputs[group]=json.loads((lab/group/'builds.json').read_text())
 for row in build_inputs['keryx-normalized']:
  row['original_builder_source_changes_field']=row.get('source_changes')
  row['source_changes']=['packages/keryx/util/oauthTemplates.ts: normalize template path; see keryx-template-normalization.patch']
  row['metadata_correction']='The reused packaging helper still emitted an empty source_changes field after the separately recorded patch. Corrected during audit; commands and numerical results are unchanged.'
 build_inputs['next-console']=json.loads((lab/'next-builds/console-variant.json').read_text());save('builds.json',build_inputs)
 preflights={}
 for name in ['keryx-builds','keryx-wired','keryx-normalized']:
  preflights[name]=json.loads((lab/name/'preflight.json').read_text())
 for name in ['next-preflight','next-preflight-console']:preflights[name]=json.loads((lab/name/'results.json').read_text())
 save('compatibility-probes.json',preflights)
 save('timer-contracts.json',(lab/'keryx-timer-fixed/contracts.json').read_bytes())
 save('timer-build.json',(lab/'keryx-timer-fixed/build.json').read_bytes())
 save('mcp-prebuild.json',(lab/'keryx-prebuilt/build.json').read_bytes())
 save('native-mcp-proof.json',(lab/'native-mcp-proof/result.json').read_bytes())
 save('next-package-proof.json',(lab/'next-package-proof/result.json').read_bytes())
 save('next-reproduced-proof.json',(lab/'next-reproduced-proof/result.json').read_bytes())
 save('reproduced-builds.json',{name:json.loads((lab/(name+'-reproduced')/'builds.json').read_text()) for name in ['keryx','next']})
 save('session-profile.json',(lab/'session-profile.json').read_bytes())
 save('varsafe-availability.json',(lab/'varsafe-availability.json').read_bytes())
 roots={'keryx':lab/'keryx','next-bun-compile':lab/'next-bun-compile'}
 inputs={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'compiler_source':'3f3a9ff87cdccf3d32d7ec6b648c664eddaae840','compiler_revision':subprocess.check_output([str(lab/'compiler/bun-darwin-aarch64/bun'),'--revision'],text=True).strip(),'compiler_sha256':sha((lab/'compiler/bun-darwin-aarch64/bun').read_bytes()),'compiler_archive_sha256':sha((lab/'compiler/bun.zip').read_bytes()),'official_asset_id':697873698,'host':{'system':platform.platform(),'machine':platform.machine(),'cpu_count':__import__('os').cpu_count(),'hardware':'Mac17,2 / Apple M5 / 24 GiB / 10 CPUs','power':'AC observed during setup; not a continuous trace'},'repositories':{},'documents':{}}
 for name,root in roots.items():
  inputs['repositories'][name]={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'lock_sha256':sha((root/'bun.lock').read_bytes()),'tracked_patch_sha256':sha(subprocess.check_output(['git','diff','--'],cwd=root))}
  save(name+'-bun.lock',(root/'bun.lock').read_bytes())
 for f in (lab/'docs').glob('*.mdx'):inputs['documents'][f.name]={'sha256':sha(f.read_bytes()),'url':'https://github.com/oven-sh/bun/blob/'+inputs['compiler_source']+'/docs/compiler/'+f.name}
 selected=[('zod-parse',lab/'keryx/node_modules/.bun/zod@4.3.6/node_modules/zod/v4/core/parse.js'),('zod-schemas',lab/'keryx/node_modules/.bun/zod@4.3.6/node_modules/zod/v4/core/schemas.js'),('next-console-wrapper',lab/'next-preflight/native-disk/examples/sharp/.next/node_modules/next/dist/server/node-environment-extensions/console-dim.external.js')]
 inputs['dependency_sources']={name:{'sha256':sha(path.read_bytes()),'relative_path':str(path.relative_to(lab))} for name,path in selected}
 save('inputs.json',inputs)
 diagnostics=[]
 for folder,names in [('keryx-builds',['jit-help.log','native-help.log']),('keryx-wired',['jit-help.log','native-greeting-valid.log']),('next-preflight',['native.log','native-disk.log']),('next-preflight-console',['native-disk-console.log'])]:
  for name in names:
   f=lab/folder/name;lines=f.read_text(errors='replace').splitlines();selected=[line[:600] for line in lines if any(w in line for w in ['ENOENT:','Cannot load','Cannot assign','Failed to install','path:'])]
   diagnostics.append({'case':folder+'/'+name,'full_private_log_sha256':sha(f.read_bytes()),'selected_diagnostics':selected})
 save('diagnostics.json',diagnostics)
 inputs['redis']={'version':'8.0.3','archive_sha256':sha((lab/'redis-8.0.3.tar.gz').read_bytes()),'server_sha256':sha((lab/'redis-8.0.3/src/redis-server').read_bytes()),'archive_url':'https://download.redis.io/releases/redis-8.0.3.tar.gz','checksum_source':'https://github.com/redis/redis-hashes/blob/master/README'}
 save('conditions.json',{'redis':inputs['redis'],'measured_keryx_sources':json.loads((lab/'measured-keryx-inputs.json').read_text()),'original_next_entry_sha256':sha((lab/'next-initial-entry.js').read_bytes())})
 codes={str(f.relative_to(here)):sha(f.read_bytes()) for f in [*here.glob('*.py'),*here.glob('*.ts'),*here.glob('*.patch'),*here.glob('fixture/**/*')] if f.is_file()} ;save('manifest.json',{'files':files.copy(),'sources':codes,'note':'Full numeric samples are losslessly compressed; raw compiler/app logs, binaries and mail remain outside Git. Our controlled tests are not independent maintainer adoption.'})
 print('Saved',len(files),'evidence files')
if __name__=='__main__':main()

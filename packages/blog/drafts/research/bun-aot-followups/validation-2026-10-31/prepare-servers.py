#!/usr/bin/env python3
"""Prepare wrappers around pinned upstream sources; no upstream app edits."""
import argparse, hashlib, json, os, shutil, subprocess, time
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--root',type=Path,required=True)
p.add_argument('--only-api',action='store_true')
args=p.parse_args();root=args.root.resolve();here=Path(__file__).resolve().parent
bun=root/'compiler/bun-darwin-aarch64/bun'
framework=root/'framework'; upstream=root/'sources/frameworks'
shutil.copytree(upstream/'src',framework/'src',dirs_exist_ok=True)
if not (framework/'public').exists(): (framework/'public').symlink_to(upstream/'public',target_is_directory=True)
(framework/'elysia-entry.ts').write_text('import { app } from "./src/bun/elysia";\napp.listen(Number(process.env.PORT || 30591));\n')
(framework/'hono-entry.ts').write_text('import app from "./src/bun/hono";\nBun.serve({fetch: app.fetch, port: Number(process.env.PORT || 30591)});\n')
api=root/'sources/api/apps/elysia-api'
shutil.copy2(here/'wire-typebox.ts',api/'wire-typebox.ts')
(api/'wired-entry.ts').write_text('import "./wire-typebox";\nimport "./src/index";\n')
env={**os.environ,'NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55439/bench_saas','DB_DRIVER':'bunsql'}
rows=[]
for project, fixtures in [(framework,[('elysia','elysia-entry.ts','src/bun/elysia.ts'),('hono','hono-entry.ts',None)]),(api,[('api','src/index.ts','src/app.ts')])]:
    if args.only_api and project==framework:continue
    shutil.copy2(here/'build-plugin.mjs',project/'build-plugin.mjs')
    (project/'builds').mkdir(exist_ok=True)
    for name,entry,app in fixtures:
        variants=[('api-wired','wired-entry.ts')] if name=='api' else [(name,entry)]
        if app:
            cmd=[str(bun),'build-plugin.mjs',entry,app,'plugin-output']
            result=subprocess.run(cmd,cwd=project,env=env,capture_output=True,timeout=120)
            (project/'builds'/f'{name}-plugin.log').write_bytes(result.stdout+result.stderr)
            rows.append(dict(name=f'{name}-plugin-generation',exit=result.returncode))
            if result.returncode==0: variants.append((name+'-plugin','plugin-output/index.js'))
        for variant,source in variants:
            for mode,flags in [('jit',[]),('native',['--aot'])]:
                target=project/'builds'/f'{variant}-{mode}'
                cmd=[str(bun),'build',source,'--compile',*flags,'--outfile',str(target)]
                start=time.perf_counter();result=subprocess.run(cmd,cwd=project,env=env,capture_output=True,timeout=180)
                (project/'builds'/f'{target.name}.log').write_bytes(result.stdout+result.stderr)
                row=dict(name=target.name,project=str(project.relative_to(root)),source=source,flags=flags,exit=result.returncode,build_seconds=time.perf_counter()-start)
                if result.returncode==0:row.update(bytes=target.stat().st_size,sha256=hashlib.sha256(target.read_bytes()).hexdigest())
                else:row['error_tail']=(result.stdout+result.stderr).decode(errors='replace')[-2500:]
                rows.append(row);(root/'server-builds.json').write_text(json.dumps(rows,indent=2)+'\n')
                print(row['name'],row['exit'],row.get('bytes'),flush=True)
print('DONE',flush=True)

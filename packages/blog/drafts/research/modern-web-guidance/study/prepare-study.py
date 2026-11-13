"""Prepare immutable fixture bases, offline guidance and the randomized 54-run plan."""
import hashlib
import json
import os
from pathlib import Path
import random
import re
import shutil
import subprocess
import sys

study = Path(__file__).resolve().parent
runtime = Path(sys.argv[1]).resolve()
package = Path(sys.argv[2]).resolve()
runtime.mkdir(parents=True, exist_ok=True)
tasks = json.loads((study / 'tasks.json').read_text())

def git(folder, *args):
    return subprocess.check_output(['git', '-C', str(folder), *args], text=True).strip()

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

payload = runtime / 'guidance-package'
if not payload.exists():
    shutil.copytree(package, payload)
guide_root = payload / 'skills/modern-web-guidance'
package_hasher = hashlib.sha256()
package_files = sorted(path for path in payload.rglob('*') if path.is_file())
for path in package_files:
    package_hasher.update(path.relative_to(payload).as_posix().encode() + b'\0')
    package_hasher.update(path.read_bytes())
node = subprocess.check_output(['node', '-p', 'process.execPath'], text=True).strip()
codex = shutil.which('codex')
env = {**os.environ, 'DISABLE_TELEMETRY': '1', 'ENABLE_FILE_LOGGING': 'false'}
bases = {}
for task in tasks:
    base = runtime / 'bases' / task['id']
    if not base.exists():
        shutil.copytree(study / 'fixtures' / task['id'], base)
        git(base, 'init', '-q', '-b', 'main')
        git(base, 'config', 'user.name', 'Goga Koreli')
        git(base, 'config', 'user.email', 'gogakoreli@icloud.com')
        git(base, 'add', '.')
        git(base, 'commit', '-q', '-m', 'Freeze owned interface fixture')
    bases[task['id']] = {'path': str(base), 'commit': git(base, 'rev-parse', 'HEAD')}
    target = study / 'supplied-guides' / (task['id'] + '.txt')
    target.parent.mkdir(exist_ok=True)
    if not target.exists():
        output = subprocess.check_output([node, str(guide_root / 'modern-web.mjs'), 'retrieve', ','.join(task['guides'])], cwd=base, env=env)
        target.write_bytes(output)
    # Large guide responses contain a temporary-file pointer instead of text.
    response = target.read_text()
    pointer = re.search(r'saved to (/\S+\.md)', response)
    if pointer:
        target.write_bytes(Path(pointer.group(1)).read_bytes())
    if not target.read_text().lstrip().startswith('--- Guide for '):
        raise SystemExit(f'Incomplete supplied guide for {task["id"]}')

# Calls to npx/pnpx are intercepted locally so the upstream SKILL.md can remain
# byte-identical while @latest resolves to the one pinned offline package.
bin_dir = runtime / 'bin'
bin_dir.mkdir(exist_ok=True)
shim = bin_dir / 'mwg-runner.py'
shim.write_text('''#!/usr/bin/env python3
import json, os, pathlib, subprocess, sys, time
args=sys.argv[1:]
name=pathlib.Path(sys.argv[0]).name
if name in ['npx','pnpx']:
    args=[a for a in args if a not in ['-y','--yes','--offline']]
    if not args or not args[0].startswith('modern-web-guidance'):
        sys.exit('Only the pinned offline modern-web-guidance package is available in this fixture.')
    args=args[1:]
if os.environ.get('STUDY_MWG_AVAILABLE')!='1':
    sys.exit('Modern Web Guidance is not installed in this fixture.')
with open(os.environ['STUDY_LOOKUP_LOG'],'a') as log:
    log.write(json.dumps({'at':time.time(),'args':args})+'\\n')
env={**os.environ,'DISABLE_TELEMETRY':'1','ENABLE_FILE_LOGGING':'false'}
sys.exit(subprocess.call([os.environ['STUDY_NODE'],os.environ['STUDY_MWG_CLI'],*args],env=env))
''')
shim.chmod(0o755)
for name in ['npx', 'pnpx', 'modern-web-guidance']:
    dest = bin_dir / name
    if not dest.exists(): dest.symlink_to(shim.name)

rows = []
for task in tasks:
    for condition in ['baseline', 'skill', 'supplied']:
        for repetition in range(1, 4):
            key = f"{task['id']}:{condition}:{repetition}"
            opaque = hashlib.sha256(('mwg54-v1:' + key).encode()).hexdigest()[:12]
            rows.append({'artifact': opaque, 'task': task['id'], 'condition': condition, 'repetition': repetition})
random.Random(20261113).shuffle(rows)
for index, row in enumerate(rows): row['order'] = index + 1
plan = {
    'schemaVersion': 1, 'seed': 20261113, 'runCount': 54,
    'model': 'gpt-6.1-sol', 'reasoningEffort': 'medium',
    'timeoutSeconds': 300, 'maximumConcurrentWorkers': 3,
    'node': node, 'codex': codex, 'bases': bases,
    'nodeVersion': subprocess.check_output([node, '--version'], text=True).strip(),
    'cliVersion': subprocess.check_output([codex, '--version'], text=True, stderr=subprocess.DEVNULL).strip(),
    'packageVersion': json.loads((package / 'package.json').read_text())['version'],
    'packageSnapshotSha256': package_hasher.hexdigest(),
    'packageFileCount': len(package_files),
    'skillSha256': digest(guide_root / 'SKILL.md'),
    'cliSha256': digest(guide_root / 'modern-web.mjs'),
    'trials': rows,
}
plan_path = runtime / 'plan.json'
if plan_path.exists() and json.loads(plan_path.read_text()) != plan:
    raise SystemExit('Existing plan differs: refusing replacement.')
plan_path.write_text(json.dumps(plan, indent=2) + '\n')
public_plan = {key: value for key, value in plan.items() if key not in ['node', 'codex', 'bases']}
public_plan['fixtureCommits'] = {key: value['commit'] for key, value in bases.items()}
(study / 'plan.json').write_text(json.dumps(public_plan, indent=2) + '\n')
print(json.dumps({'prepared': len(rows), 'packageVersion': plan['packageVersion'], 'plan': str(plan_path)}))

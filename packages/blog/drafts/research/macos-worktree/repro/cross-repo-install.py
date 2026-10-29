"""Measure a frozen install in a disposable, fresh public-source workspace."""
import argparse
import datetime
import hashlib
import json
import os
import pathlib
import platform
import shlex
import subprocess
import time

PINS = {
    'vite': ('cce559ab158cc6b177d0911a0bea73436b48faff', '12.15.0'),
    'kit': ('f22e6210a51bc0e43bd52882be12d759eff5a2c6', '12.14.0'),
    'next': ('7fd2d0a69534e26cfa10c7c11acc7c8450bf7cd5', '12.9.1'),
}
p = argparse.ArgumentParser()
p.add_argument('--project', choices=PINS, required=True)
p.add_argument('--repo', required=True)
p.add_argument('--store', required=True)
p.add_argument('--node', required=True)
p.add_argument('--cli', required=True)
p.add_argument('--out', required=True)
p.add_argument('--label', required=True)
p.add_argument('--browsers', required=True)
p.add_argument('--variant', choices=['default', 'workers4', 'shared'], required=True)
p.add_argument('--seed', action='store_true')
args = p.parse_args()
repo = pathlib.Path(args.repo).resolve()
node = pathlib.Path(args.node).resolve()
cli = pathlib.Path(args.cli).resolve()
store = pathlib.Path(args.store).resolve()
out = pathlib.Path(args.out).resolve()
out.mkdir(parents=True, exist_ok=True)
if out.is_relative_to(repo) or store.is_relative_to(repo):
    raise RuntimeError('Keep evidence and store outside the checkout')
# Pin nested lifecycle invocations too. The npm package's native-binary
# installer may have been skipped while obtaining research tools; its placeholder
# is not directly executable by every shell emulator. This launcher uses the
# exact same Node + CLI as the timed top-level command.
shim = out / ('tool-' + args.project)
shim.mkdir(exist_ok=True)
launcher = shim / 'pnpm'
launcher.write_text('#!/bin/sh\nexec ' + shlex.quote(str(node)) + ' ' + shlex.quote(str(cli)) + ' "$@"\n')
launcher.chmod(0o755)
env = dict(os.environ)
env['PATH'] = os.pathsep.join([str(shim), str(node.parent), env.get('PATH', '')])
env.update({'CI': 'true', 'NEXT_TELEMETRY_DISABLED': '1', 'ASTRO_TELEMETRY_DISABLED': '1',
            'npm_config_manage_package_manager_versions': 'false',
            'PLAYWRIGHT_BROWSERS_PATH': args.browsers})
env.pop('RAYON_NUM_THREADS', None)
if args.variant == 'workers4':
    env['RAYON_NUM_THREADS'] = '4'
if not args.seed:
    env['npm_config_offline'] = 'true'

def read(command):
    return subprocess.check_output(command, cwd=repo, env=env, text=True).strip()

if read(['git', 'status', '--porcelain', '--untracked-files=no']):
    raise RuntimeError('Tracked source is already modified')
expected_commit, expected_pnpm = PINS[args.project]
# Linux uses a Git snapshot made from the pinned git-archive bytes. Full input
# hashes below must match the original Mac checkout before samples are accepted.
head = read(['git', 'rev-parse', 'HEAD'])
if platform.system() == 'Darwin' and head != expected_commit:
    raise RuntimeError('Wrong public source revision')
manager = read([str(node), str(cli), '--version'])
if manager != expected_pnpm:
    raise RuntimeError('Unexpected package-manager handoff')
runtime = json.loads(read([str(node), '-e', 'const os=require("node:os");console.log(JSON.stringify({version:process.version,execPath:process.execPath,availableParallelism:os.availableParallelism(),memoryBytes:os.totalmem(),arch:os.arch()}))']))
if runtime['version'] != 'v26.12.1':
    raise RuntimeError('Unexpected install runtime')

def inputs():
    result = {}
    for raw in subprocess.check_output(['git', 'ls-files', '--stage', '-z'], cwd=repo).split(b'\0'):
        if not raw:
            continue
        metadata, filename = raw.split(b'\t', 1)
        mode, object_id, _ = metadata.split()
        name = os.fsdecode(filename)
        path = repo / name
        result[name] = ('gitlink:' + object_id.decode() if mode == b'160000' else
                        'symlink:' + os.readlink(path) if path.is_symlink() else
                        hashlib.sha256(path.read_bytes()).hexdigest())
    return result

before = inputs()
input_hash = hashlib.sha256(json.dumps(before, sort_keys=True).encode()).hexdigest()
command = [str(node), str(cli), 'install', '--frozen-lockfile', '--store-dir', str(store),
           '--reporter', 'append-only', '--yes',
           '--config.virtualStoreType=' + ('global' if args.variant == 'shared' else 'local')]
if not args.seed:
    command.append('--offline')
log = out / (args.label + '-install.log')
if log.exists():
    raise RuntimeError('Refusing to overwrite a trial log')
start = time.perf_counter()
with log.open('w') as f:
    process = subprocess.Popen(command, cwd=repo, env=env, stdin=subprocess.DEVNULL,
                               stdout=f, stderr=subprocess.STDOUT)
    _, status, usage = os.wait4(process.pid, 0)
    process.returncode = os.waitstatus_to_exitcode(status)
seconds = time.perf_counter() - start
unchanged = before == inputs() and not read(['git', 'status', '--porcelain', '--untracked-files=no'])
text = log.read_text()
# Ask the package manager for actual workspace membership, including negated
# fixture patterns. Do not treat every tracked package.json as a workspace.
projects = json.loads(read([str(node), str(cli), 'list', '-r', '--depth', '-1', '--json'])) if process.returncode == 0 else []
inventory = []
missing = []
for project in sorted(projects, key=lambda x: x['path']):
    directory = pathlib.Path(project['path'])
    manifest = json.loads((directory / 'package.json').read_text(encoding='utf-8-sig'))
    for name in sorted({**manifest.get('dependencies', {}), **manifest.get('devDependencies', {})}):
        installed = directory / 'node_modules' / name / 'package.json'
        if not installed.is_file():
            missing.append({'project': str(directory.relative_to(repo)), 'requested': name})
            continue
        package = json.loads(installed.read_text(encoding="utf-8-sig"))
        inventory.append({'project': str(directory.relative_to(repo)), 'requested': name,
                          'installed': package.get('name'), 'version': package.get('version')})
(out / (args.label + '-inventory.json')).write_text(json.dumps(inventory, indent=2) + '\n')
record = {'project': args.project, 'sourceCommit': expected_commit, 'snapshotGitHead': head,
          'platform': platform.system(), 'label': args.label, 'variant': args.variant,
          'checkedAtUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'pnpm': manager, 'node': runtime, 'seedOnly': args.seed, 'ci': True,
          'rayonThreadsEnvironment': env.get('RAYON_NUM_THREADS'),
          'npmOfflineEnvironment': env.get('npm_config_offline'),
          'installSeconds': seconds, 'installExitCode': process.returncode,
          'userCpuSeconds': usage.ru_utime, 'systemCpuSeconds': usage.ru_stime,
          'inputManifestSha256': input_hash, 'trackedInputsUnchanged': unchanged,
          'workspaceCount': len(projects), 'directDependencyCount': len(inventory),
          'inventorySha256': hashlib.sha256(json.dumps(inventory, sort_keys=True).encode()).hexdigest(),
          'missingDirectDependencies': missing,
          'completion': next((line for line in reversed(text.splitlines()) if 'Done in' in line), None),
          'interactivePromptObserved': 'Proceed?' in text, 'command': command}
(out / (args.label + '.json')).write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record), flush=True)
if process.returncode or not unchanged or missing or not record['completion'] or record['interactivePromptObserved']:
    raise RuntimeError('Failed install or input/inventory gate; preserve and exclude from successful medians')

"""Measure only disposable clones of either pinned public install workload."""
import argparse
import datetime
import hashlib
import json
import os
import pathlib
import platform
import resource
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument('--workload', choices=['frameworks', 't3'], default='frameworks')
parser.add_argument('--repo', required=True)
parser.add_argument('--store', required=True)
parser.add_argument('--node', required=True)
parser.add_argument('--cli', required=True)
parser.add_argument('--out', required=True)
parser.add_argument('--label', required=True)
parser.add_argument('--runs', type=int, default=1)
parser.add_argument('--ignore-scripts', action='store_true')
parser.add_argument('--shared', action='store_true')
parser.add_argument('--import-method', choices=['auto', 'hardlink', 'copy', 'clone'], default='auto')
parser.add_argument('--seed', action='store_true')
parser.add_argument('--allow-clean-disposable-clone', action='store_true', required=True)
args = parser.parse_args()
BASELINE = {'frameworks': '535aef76843fe52d6336604111708d884110a0e5',
            't3': '125b61954dbba5822a8108c8ca47a4846b4b4328'}[args.workload]
expected_node = {'frameworks': 'v24.14.1', 't3': 'v26.12.1'}[args.workload]
repo = pathlib.Path(args.repo).resolve()
store = pathlib.Path(args.store).resolve()
node = pathlib.Path(args.node).resolve()
cli = pathlib.Path(args.cli).resolve()
out = pathlib.Path(args.out).resolve()
out.mkdir(parents=True, exist_ok=True)
if out.is_relative_to(repo) or store.is_relative_to(repo):
    raise RuntimeError('Logs and store must be outside the disposable checkout')
env = dict(os.environ)
env['PATH'] = str(node.parent) + os.pathsep + env.get('PATH', '')
env.update({'CHECKPOINT_DISABLE': '1', 'PRISMA_HIDE_UPDATE_MESSAGE': '1',
            'NUXT_TELEMETRY_DISABLED': '1', 'ASTRO_TELEMETRY_DISABLED': '1',
            'NEXT_TELEMETRY_DISABLED': '1', 'NO_UPDATE_NOTIFIER': '1',
            'npm_config_update_notifier': 'false', 'CI': 'true'})
env['npm_config_manage_package_manager_versions'] = 'false'

def read_command(command):
    return subprocess.check_output(command, cwd=repo, env=env, text=True).strip()

if read_command(['git', 'rev-parse', 'HEAD']) != BASELINE:
    raise RuntimeError('The full workload must use the pinned source commit')
if read_command(['git', 'status', '--porcelain', '--untracked-files=no']):
    raise RuntimeError('Refusing cleanup of a checkout with changed tracked inputs')
runtime = json.loads(read_command([str(node), '-e',
    'const os=require("node:os"); console.log(JSON.stringify({version:process.version,'
    'execPath:process.execPath,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,'
    'memoryBytes:os.totalmem(),arch:os.arch()}))']))
if runtime['version'] != expected_node:
    raise RuntimeError(f'Expected Node {expected_node} inside the workload, got {runtime}')
pnpm = read_command([str(node), str(cli), '--version'])
expected_pnpm = json.loads((cli.parent.parent / 'package.json').read_text())['version']
if pnpm != expected_pnpm:
    raise RuntimeError(f'Package-manager handoff: requested {expected_pnpm}, got {pnpm}')
major = int(pnpm.split('.')[0])
if pnpm not in ['10.2.1', '12.14.0']:
    raise RuntimeError(f'Unexpected package manager {pnpm}')
if args.workload == 't3' and pnpm != '12.14.0':
    raise RuntimeError('The actual T3 workload requires its pinned pnpm 12.14.0')
if args.shared and major < 12:
    raise RuntimeError('This shared-store control requires the tested pnpm 12 release')

tracked = subprocess.check_output(['git', 'ls-files', '--stage', '-z'], cwd=repo).split(b'\0')
def fingerprint(path):
    if path.is_symlink():
        return 'symlink:' + os.readlink(path)
    return hashlib.sha256(path.read_bytes()).hexdigest()

inputs = {}
for entry in tracked:
    if not entry:
        continue
    metadata, raw_name = entry.split(b'\t', 1)
    mode, object_id, stage = metadata.split()
    name = os.fsdecode(raw_name)
    inputs[name] = ('gitlink:' + object_id.decode() if mode == b'160000'
                    else fingerprint(repo / name))
input_hash = hashlib.sha256(json.dumps(inputs, sort_keys=True).encode()).hexdigest()
command = [str(node), str(cli), 'install', '--frozen-lockfile',
           '--store-dir', str(store), '--reporter', 'append-only']
if not args.seed:
    command.append('--offline')
if args.ignore_scripts:
    command.append('--ignore-scripts')
if major >= 12:
    # pnpm 12 moved these settings out of .npmrc. Keep the old workload's
    # independent project trees and peer policy, and prevent version handoff.
    if args.workload == 'frameworks':
        command += ['--config.sharedWorkspaceLockfile=false', '--config.autoInstallPeers=false']
    command += [f'--config.enableGlobalVirtualStore={str(args.shared).lower()}', '--yes']
command += [f'--package-import-method={args.import_method}']

def emit(record):
    with (out / 'runs.jsonl').open('a') as f:
        f.write(json.dumps(record) + '\n')
    print(json.dumps(record), flush=True)

def timed(command, name):
    log = out / f'{name}.log'
    if log.exists():
        raise RuntimeError(f'Refusing to overwrite {log}')
    start = time.perf_counter()
    with log.open('w') as f:
        process = subprocess.Popen(command, cwd=repo, env=env, stdin=subprocess.DEVNULL,
                                   stdout=f, stderr=subprocess.STDOUT)
        pid, status, usage = os.wait4(process.pid, 0)
        process.returncode = os.waitstatus_to_exitcode(status)
    return {'seconds': time.perf_counter() - start, 'code': process.returncode,
            'userSeconds': usage.ru_utime, 'systemSeconds': usage.ru_stime,
            'maxRssRaw': usage.ru_maxrss, 'maxRssUnit': 'bytes' if platform.system() == 'Darwin' else 'KiB',
            'log': log.name}

for index in range(args.runs):
    label = f'{args.label}-{index}'
    stages = {}
    if not args.seed:
        for stage, cmd in [('cleanIgnored', ['git', 'clean', '-Xfd']),
                           ('cleanUntracked', ['git', 'clean', '-fd'])]:
            stages[stage] = timed(cmd, f'{label}-{stage}')
            if stages[stage]['code']:
                emit({'label': label, 'stageFailure': stage, 'stages': stages})
                raise RuntimeError('Clean failed')
    stages['install'] = timed(command, f'{label}-install')
    unchanged = not read_command(['git', 'status', '--porcelain', '--untracked-files=no']) and all(
        value.startswith('gitlink:') or
        (((repo / name).is_file() or (repo / name).is_symlink()) and fingerprint(repo / name) == value)
        for name, value in inputs.items())
    log_text = (out / stages['install']['log']).read_text()
    inventory = []
    missing = []
    if args.workload == 'frameworks':
        manifests = sorted((repo / 'frameworks').glob('*/package.json'))
    else:
        patterns = ['package.json', 'apps/*/package.json', 'evals/package.json',
                    'infra/*/package.json', 'oxlint-plugin-t3code/package.json',
                    'packages/*/package.json', 'scripts/package.json']
        manifests = sorted(p for pattern in patterns for p in repo.glob(pattern))
    for manifest in manifests:
        project = json.loads(manifest.read_text())
        deps = {**project.get('dependencies', {}), **project.get('devDependencies', {})}
        for name in sorted(deps):
            installed = manifest.parent / 'node_modules' / name / 'package.json'
            if not installed.is_file():
                missing.append({'project': str(manifest.parent.relative_to(repo)), 'package': name})
                continue
            package = json.loads(installed.read_text())
            inventory.append({'project': str(manifest.parent.relative_to(repo)), 'requested': name,
                              'installed': package.get('name'), 'version': package.get('version')})
    inventory_path = out / f'{label}-inventory.json'
    inventory_path.write_text(json.dumps(inventory, indent=2) + '\n')
    if args.workload == 't3' and not args.ignore_scripts and stages['install']['code'] == 0:
        # Exercise two native dependencies; inventory alone cannot prove a
        # scripts-enabled install produced loadable native bindings.
        smoke = '''const {createRequire}=require('node:module');
const marketing=createRequire(process.cwd()+'/apps/marketing/package.json');
const server=createRequire(process.cwd()+'/apps/server/package.json');
if(typeof server('node-pty').spawn!=='function') throw Error('node-pty binding');
marketing('sharp')({create:{width:2,height:2,channels:4,background:'#ff0000'}})
.png().toBuffer().then(b=>{if(b.length<8||b.toString('hex',0,8)!=='89504e470d0a1a0a')
throw Error('PNG encoding');console.log(JSON.stringify({nodePty:true,sharpPngBytes:b.length}));})
.catch(e=>{console.error(e);process.exitCode=1;});'''
        stages['nativeSmoke'] = timed([str(node), '--input-type=commonjs', '-e', smoke],
                                      f'{label}-nativeSmoke')
    record = {'label': label, 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'baseline': BASELINE, 'workload': args.workload,
              'inputManifestSha256': input_hash, 'pnpm': pnpm, 'command': command,
              'node': runtime, 'platform': platform.platform(), 'git': read_command(['git', '--version']),
              'seedOnly': args.seed, 'ignoreScripts': args.ignore_scripts,
              'pnpmWorkersEnvironment': env.get('PNPM_WORKERS'),
              'shared': args.shared, 'importMethod': args.import_method,
              'stages': stages, 'trackedInputsUnchanged': unchanged,
              'directDependencyCount': len(inventory), 'missingDirectDependencies': missing,
              'inventorySha256': hashlib.sha256(json.dumps(inventory, sort_keys=True).encode()).hexdigest(),
              'interactivePromptObserved': 'Proceed?' in log_text,
              'completedMessage': next((line for line in reversed(log_text.splitlines()) if 'Done in' in line), None)}
    emit(record)
    if not unchanged or stages['install']['code'] or missing or record['interactivePromptObserved'] or stages.get('nativeSmoke', {}).get('code', 0):
        raise RuntimeError('Install failed or changed frozen inputs; preserve logs and exclude from successful medians')
    if not args.seed and record['completedMessage'] is None:
        raise RuntimeError('No install completion message; a zero exit code is insufficient')

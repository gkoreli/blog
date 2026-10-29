"""Validate a read-only T3 shared-store snapshot. Linux mount preparation is separate."""
import argparse
import datetime
import errno
import hashlib
import json
import os
import pathlib
import shlex
import subprocess
import time

p = argparse.ArgumentParser()
for name in ('source', 'store', 'patch', 'node', 'cli', 'worktrees', 'out'):
    p.add_argument('--' + name, required=True)
p.add_argument('--runs', type=int, default=5)
p.add_argument('--allow-create-disposable-worktrees', action='store_true', required=True)
a = p.parse_args()
source, store, patch, node, cli, worktrees, out = [pathlib.Path(getattr(a, n)).resolve()
    for n in ('source', 'store', 'patch', 'node', 'cli', 'worktrees', 'out')]
if a.runs < 5:
    raise RuntimeError('At least five fresh paths are required')
if not os.statvfs(store).f_flag & os.ST_RDONLY:
    raise RuntimeError('The store must actually be on a read-only mount')
if subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip() != '125b61954dbba5822a8108c8ca47a4846b4b4328':
    raise RuntimeError('Wrong upstream source revision')
if out.exists() or worktrees.exists():
    raise RuntimeError('Use new evidence and worktree directories')
out.mkdir(parents=True)
worktrees.mkdir(parents=True)
shim = out / 'bin'
shim.mkdir()
launcher = shim / 'pnpm'
launcher.write_text('#!/bin/sh\nexec ' + shlex.quote(str(node)) + ' ' + shlex.quote(str(cli)) + ' "$@"\n')
launcher.chmod(0o755)
env = dict(os.environ)
env['PATH'] = os.pathsep.join([str(shim), str(node.parent), env.get('PATH', '')])
env.update({'CI': 'true', 'npm_config_manage_package_manager_versions': 'false', 'npm_config_offline': 'true'})
env.pop('RAYON_NUM_THREADS', None)

def run(command, cwd, label):
    log = out / (label + '.log')
    with log.open('w') as f:
        code = subprocess.run(command, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                              stdout=f, stderr=subprocess.STDOUT).returncode
    return code, log

def tracked_hash(repo):
    entries = {}
    for raw in subprocess.check_output(['git', 'ls-files', '--stage', '-z'], cwd=repo).split(b'\0'):
        if not raw:
            continue
        metadata, filename = raw.split(b'\t', 1)
        mode, object_id, _ = metadata.split()
        name = os.fsdecode(filename)
        path = repo / name
        entries[name] = ('gitlink:' + object_id.decode() if mode == b'160000' else
                         'symlink:' + os.readlink(path) if path.is_symlink() else
                         hashlib.sha256(path.read_bytes()).hexdigest())
    return hashlib.sha256(json.dumps(entries, sort_keys=True).encode()).hexdigest()

index = store / 'v11/index.db'
index_before = hashlib.sha256(index.read_bytes()).hexdigest()
records = []
for number in range(a.runs):
    repo = worktrees / f'trial-{number}'
    subprocess.run(['git', '-C', str(source), 'worktree', 'add', '--detach', str(repo), 'HEAD'],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    subprocess.run(['git', 'apply', str(patch)], cwd=repo, check=True)
    before = tracked_hash(repo)
    command = [str(node), str(cli), 'install', '--frozen-store', '--offline', '--frozen-lockfile',
               '--config.virtualStoreType=global', '--store-dir', str(store), '--yes']
    start = time.perf_counter()
    code, log = run(command, repo, f'{number}-install')
    seconds = time.perf_counter() - start
    after = tracked_hash(repo)
    if code or before != after or 'Done in' not in log.read_text():
        raise RuntimeError(f'Read-only install failed; preserve {log}')
    package = (repo / 'apps/web/node_modules/lucide-react/package.json').resolve()
    if not package.is_relative_to(store):
        raise RuntimeError('A registry dependency escaped the read-only view')
    original = package.read_bytes()
    blocked = False
    error_number = None
    try:
        with package.open('ab') as f:
            f.write(b'\n')
    except OSError as error:
        error_number = error.errno
        blocked = error.errno in (errno.EROFS, errno.EACCES, errno.EPERM)
    if not blocked or package.read_bytes() != original:
        raise RuntimeError('The shared package was writable')
    check, check_log = run([str(repo / 'node_modules/.bin/tsc'), '--noEmit', '--pretty', 'false'],
                           repo / 'apps/web', f'{number}-typecheck')
    if check:
        raise RuntimeError(f'Normal typecheck failed: {check_log}')
    record = {'trial': number, 'installSeconds': seconds, 'installExitCode': code,
              'typecheckExitCode': check, 'inputManifestSha256': before,
              'trackedInputsUnchanged': before == after, 'writeBlocked': blocked,
              'writeErrno': error_number, 'dependencyResolvedInsideReadonlyView': True,
              'checkedAtUtc': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    records.append(record)
    (out / 'trials.json').write_text(json.dumps(records, indent=2) + '\n')
    print(json.dumps(record), flush=True)
    if number == 0:
        for label, args in [('unit', ['exec', 'vp', 'test', 'run', '--project', 'unit', '--maxWorkers=2']),
                            ('build', ['run', 'build'])]:
            code, log = run([str(node), str(cli), '--config.virtualStoreType=global', '--config.frozenStore=true', '--config.storeDir=' + str(store), *args],
                            repo / 'apps/web', label)
            (out / (label + '-result.json')).write_text(json.dumps({'exitCode': code, 'log': log.name}) + '\n')
            if code:
                raise RuntimeError(f'Read-only project check failed: {log}')
if hashlib.sha256(index.read_bytes()).hexdigest() != index_before:
    raise RuntimeError('Frozen store index changed')
(out / 'store-integrity.json').write_text(json.dumps({'indexSha256Before': index_before,
    'indexSha256After': hashlib.sha256(index.read_bytes()).hexdigest(),
    'readonlyMount': True, 'sourcePatchSha256': hashlib.sha256(patch.read_bytes()).hexdigest()}, indent=2) + '\n')

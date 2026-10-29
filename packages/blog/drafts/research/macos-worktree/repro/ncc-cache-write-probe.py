"""Reduce ncc's runtime store mutation; keep every store/project disposable."""
import argparse
import hashlib
import json
import os
import pathlib
import subprocess
import tarfile

p = argparse.ArgumentParser()
for name in ('root', 'node', 'cli', 'tarball'):
    p.add_argument('--' + name, required=True)
p.add_argument('--mode', choices=['hardlink-default', 'clone-or-copy', 'readonly-global', 'private-view-global'], required=True)
p.add_argument('--readonly-store')
a = p.parse_args()
root, node, cli, tarball = [pathlib.Path(getattr(a, x)).resolve() for x in ('root', 'node', 'cli', 'tarball')]
root.mkdir(parents=True, exist_ok=False)
store = pathlib.Path(a.readonly_store).resolve() if a.readonly_store else root / 'store'
if a.mode == 'readonly-global' and not os.statvfs(store).f_flag & os.ST_RDONLY:
    raise RuntimeError('A real read-only mount is required')
env = dict(os.environ)
env['PATH'] = str(node.parent) + os.pathsep + env.get('PATH', '')
env.update({'CI': 'true', 'npm_config_manage_package_manager_versions': 'false'})
config = ['--config.virtualStoreType=' + ('global' if a.mode in ('readonly-global', 'private-view-global') else 'local')]
if a.mode == 'clone-or-copy':
    config += ['--package-import-method=clone-or-copy']
if a.mode == 'readonly-global':
    config += ['--frozen-store']
manifest = json.dumps({'private': True, 'dependencies': {'@vercel/ncc': '0.38.4'}}, indent=2) + '\n'
first = root / 'first'
first.mkdir()
(first / 'package.json').write_text(manifest)
command = [str(node), str(cli), 'install', '--store-dir', str(store), *config]
# A read-only probe receives the exact lock from the pre-seeded fixture.
lock_source = pathlib.Path(os.environ['NCC_PROBE_LOCK']) if a.mode in ('readonly-global', 'private-view-global') else None
if lock_source:
    (first / 'pnpm-lock.yaml').write_bytes(lock_source.read_bytes())
    command += ['--offline', '--frozen-lockfile']
with (root / 'first-install.log').open('w') as f:
    code = subprocess.run(command, cwd=first, env=env, stdout=f, stderr=subprocess.STDOUT).returncode
if code:
    raise RuntimeError('First install failed')
package = (first / 'node_modules/@vercel/ncc').resolve()
with tarfile.open(tarball) as archive:
    original_files = {str(pathlib.PurePosixPath(x.name).relative_to('package')): archive.extractfile(x).read()
                      for x in archive if x.isfile()}
# Keep package execution and artifact output out of node_modules.
(first / 'entry.js').write_text('process.stdout.write("42")\n')
program = '''const fs=require('node:fs');require('@vercel/ncc')(require('node:path').resolve('entry.js'),{sourceMap:false,minify:false}).then(r=>fs.writeFileSync('compiled.js',r.code)).catch(e=>{console.error(e);process.exitCode=1});'''
with (root / 'compile.log').open('w') as f:
    compile_code = subprocess.run([str(node), '-e', program], cwd=first, env=env,
                                  stdout=f, stderr=subprocess.STDOUT).returncode
if compile_code:
    raise RuntimeError('ncc compilation failed')
output = subprocess.check_output([str(node), 'compiled.js'], cwd=first, env=env, text=True)
if output != '42':
    raise RuntimeError('Compiled output is incorrect')
changes = []
for name, original in original_files.items():
    file = package / name
    digest = hashlib.sha512(original).hexdigest()
    candidates = [store / 'v11/files' / digest[:2] / (digest[2:] + suffix) for suffix in ('', '-exec')]
    cas = next((x for x in candidates if x.exists()), None)
    if file.read_bytes() != original:
        changes.append({'file': name, 'installedChanged': True, 'casChanged': cas.read_bytes() != original if cas else None,
                        'sharesCasInode': cas.stat().st_ino == file.stat().st_ino if cas else None})
blocked = None
if a.mode == 'readonly-global':
    file = package / 'dist/ncc/index.js.cache'
    before = file.read_bytes()
    try:
        with file.open('ab') as f:
            f.write(b'\n')
    except OSError:
        blocked = file.read_bytes() == before
    if blocked is not True:
        raise RuntimeError('Read-only package write succeeded')
second = root / 'second'
second.mkdir()
(second / 'package.json').write_text(manifest)
(second / 'pnpm-lock.yaml').write_bytes((first / 'pnpm-lock.yaml').read_bytes())
with (root / 'second-install.log').open('w') as f:
    second_code = subprocess.run([str(node), str(cli), 'install', '--store-dir', str(store), *config,
                                  '--offline', '--frozen-lockfile'], cwd=second, env=env,
                                 stdout=f, stderr=subprocess.STDOUT).returncode
record = {'mode': a.mode, 'nccVersion': '0.38.4', 'nodeVersion': subprocess.check_output([str(node), '--version'], text=True).strip(),
          'compiledOutput': output, 'changedPackagedFiles': changes,
          'readOnlyWriteBlocked': blocked, 'secondOfflineInstallExitCode': second_code,
          'secondOfflineInstallHasMissingTarball': 'ERR_PNPM_NO_OFFLINE_TARBALL' in (root / 'second-install.log').read_text(),
          'tarballSha256': hashlib.sha256(tarball.read_bytes()).hexdigest()}
(root / 'result.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record), flush=True)
if a.mode == 'hardlink-default':
    if not changes or not any(x['casChanged'] for x in changes) or second_code == 0:
        raise RuntimeError('Expected hardlink corruption control was not reproduced')
else:
    if second_code or any(x['casChanged'] for x in changes):
        raise RuntimeError('Independent/read-only control failed')

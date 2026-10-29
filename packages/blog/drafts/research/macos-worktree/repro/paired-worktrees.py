"""Counterbalanced fresh-worktree installs; use only disposable public-source clones."""
import argparse
import datetime
import json
import os
import pathlib
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument('--config', required=True)
parser.add_argument('--allow-create-disposable-worktrees', action='store_true', required=True)
args = parser.parse_args()
config = json.loads(pathlib.Path(args.config).read_text())
if config['pairs'] < 5:
    raise RuntimeError('This validation protocol requires at least five pairs')
commit = '125b61954dbba5822a8108c8ca47a4846b4b4328'
root = pathlib.Path(config['controllerResults'])
root.mkdir(parents=True, exist_ok=False)
env = dict(os.environ)
env['LIMA_HOME'] = config['limaHome']
env.pop('RAYON_NUM_THREADS', None)
variants = ['default', 'workers4', 'shared']
schedule = []
for pair in range(config['pairs']):
    rotation = pair % len(variants)
    order = variants[rotation:] + variants[:rotation]
    for index, variant in enumerate(order):
        platforms = ['macos', 'linux'] if (pair + index) % 2 == 0 else ['linux', 'macos']
        for platform in platforms:
            schedule.append({'pair': pair, 'variant': variant, 'platform': platform,
                             'id': f'p{pair}-{variant}-{platform}'})
(root / 'schedule.json').write_text(json.dumps(schedule, indent=2) + '\n')

def command_for(platform, command):
    if platform == 'macos':
        return command
    return ['limactl', 'shell', config['limaMachine'], '--', *command]

def run(platform, command, log):
    with log.open('w') as output:
        result = subprocess.run(command_for(platform, command), env=env,
                                stdin=subprocess.DEVNULL, stdout=output,
                                stderr=subprocess.STDOUT)
    if result.returncode:
        raise RuntimeError(f'{platform} command failed ({result.returncode}); see {log}')
    return log.read_text()

# Executed unchanged on either platform. This compiler check is outside the
# install timer. Shared mode repairs only React declaration lookup; it does
# not weaken strictness or alter application source.
validation_code = r'''
import pathlib,json,subprocess,os,sys
request=json.loads(sys.argv[1]); repo=pathlib.Path(request['repo']); out=pathlib.Path(request['out'])
node=pathlib.Path(request['node']); env=dict(os.environ);env['PATH']=str(node.parent)+os.pathsep+env['PATH']
out.mkdir(parents=True,exist_ok=True); app=repo/'apps/web'
command=[str(repo/'node_modules/.bin/tsc'),'--noEmit','--pretty','false']
if request['shared']:
    config={'extends':str(app/'tsconfig.json'),'compilerOptions':{'paths':{
        '~/*':[str(app/'src/*')], 'react':[str(app/'node_modules/@types/react/index.d.ts')],
        'react/*':[str(app/'node_modules/@types/react/*')]},
        'tsBuildInfoFile':str(out/(request['id']+'.tsbuildinfo'))}}
    config_path=out/(request['id']+'-types.json');config_path.write_text(json.dumps(config,indent=2)+'\n')
    command=['--project',str(config_path),'--pretty','false']
    command=[str(repo/'node_modules/.bin/tsc'),*command]
log=out/(request['id']+'-web-typecheck.log')
with log.open('w') as f:
    result=subprocess.run(command,cwd=app,env=env,stdin=subprocess.DEVNULL,stdout=f,stderr=subprocess.STDOUT)
changed=subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=repo,text=True)
print(json.dumps({'exitCode':result.returncode,'typeErrors':log.read_text().count('error TS'),
    'trackedInputsStillClean':not changed,'targetedReactTypesMapping':request['shared']}))
if result.returncode or changed:sys.exit(1)
'''

for ordinal, case in enumerate(schedule):
    platform = case['platform']
    options = config[platform]
    worktree = str(pathlib.PurePosixPath(options['worktreeRoot']) / case['id'])
    run(platform, ['git', '-C', options['source'], 'worktree', 'add', '--detach', worktree, commit],
        root / (case['id'] + '-checkout.log'))
    # Declared settling interval after checkout, excluded from the install timer.
    time.sleep(config['settleSeconds'])
    command = ['python3', config['runner'], '--workload', 't3', '--repo', worktree,
               '--store', options['store'], '--node', options['node'], '--cli', options['cli'],
               '--out', options['results'], '--label', case['id'], '--allow-clean-disposable-clone']
    if case['variant'] == 'workers4':
        command += ['--rayon-threads', '4']
    if case['variant'] == 'shared':
        command.append('--shared')
    output = run(platform, command, root / (case['id'] + '-driver.log'))
    records = [json.loads(line) for line in output.splitlines() if line.startswith('{')]
    if len(records) != 1:
        raise RuntimeError('Expected exactly one validated install record')
    record = records[0]
    if record['inputManifestSha256'] != '6a783b3d0ab74cef7cd8766849155b8f86ffb00e243572469679ce0ff794962d':
        raise RuntimeError('Unexpected full input hash')
    if record['directDependencyCount'] != 599 or record['stages']['nativeSmoke']['code']:
        raise RuntimeError('Dependency or native validation failed')
    expected_workers = '4' if case['variant'] == 'workers4' else None
    if record['rayonThreadsEnvironment'] != expected_workers:
        raise RuntimeError('Unexpected worker control')
    request = {'id': case['id'], 'repo': worktree, 'out': options['results'],
               'node': options['node'], 'shared': case['variant'] == 'shared'}
    validation = json.loads(run(platform, ['python3', '-c', validation_code, json.dumps(request)],
                                    root / (case['id'] + '-validation.log')).strip())
    row = {**case, 'ordinal': ordinal,
           'checkedAtUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'installRecord': record, 'webTypecheck': validation}
    with (root / 'trials.jsonl').open('a') as f:
        f.write(json.dumps(row) + '\n')
    print(json.dumps({'case': case['id'], 'ordinal': ordinal,
                      'installSeconds': record['stages']['install']['seconds'],
                      'nativeCheck': record['stages']['nativeSmoke']['code'],
                      'webTypecheck': validation['exitCode']}), flush=True)

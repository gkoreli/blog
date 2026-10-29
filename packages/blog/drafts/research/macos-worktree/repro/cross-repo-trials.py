"""Sequential, ordered fresh-worktree trials on a Mac and a Lima Linux guest."""
import argparse
import json
import os
import pathlib
import subprocess
import time

p = argparse.ArgumentParser()
p.add_argument('--config', required=True)
p.add_argument('--allow-create-disposable-worktrees', action='store_true', required=True)
a = p.parse_args()
c = json.loads(pathlib.Path(a.config).read_text())
if c['pairs'] < 5:
    raise RuntimeError('At least five pairs are required')
out = pathlib.Path(c['results'])
out.mkdir(parents=True, exist_ok=False)
env = dict(os.environ)
env['LIMA_HOME'] = c['limaHome']
variants = ['default', 'workers4', 'shared']
projects = ['vite', 'kit', 'next']
schedule = []
for pair in range(c['pairs']):
    ordered_projects = projects[pair % 3:] + projects[:pair % 3]
    for project_index, project in enumerate(ordered_projects):
        rotation = (pair + project_index) % 3
        for variant_index, variant in enumerate(variants[rotation:] + variants[:rotation]):
            platforms = ['macos', 'linux'] if (pair + project_index + variant_index) % 2 == 0 else ['linux', 'macos']
            for platform in platforms:
                schedule.append({'pair': pair, 'project': project, 'variant': variant,
                                 'platform': platform, 'id': f'p{pair}-{project}-{variant}-{platform}'})
(out / 'schedule.json').write_text(json.dumps(schedule, indent=2) + '\n')

def run(platform, command, logfile):
    if platform == 'linux':
        command = ['limactl', 'shell', c['limaMachine'], '--', *command]
    with logfile.open('w') as f:
        result = subprocess.run(command, env=env, stdin=subprocess.DEVNULL,
                                stdout=f, stderr=subprocess.STDOUT)
    return result.returncode, logfile.read_text()

reference_hashes = {}
completed = set()
if c.get('resumeFrom'):
    previous = pathlib.Path(c['resumeFrom'])
    rows = [json.loads(line) for line in (previous / 'trials.jsonl').read_text().splitlines()]
    for row in rows:
        if row['driverExitCode'] == 0:
            record = row['record']
            reference_hashes[row['project']] = (record['inputManifestSha256'], record['inventorySha256'], record['directDependencyCount'])
            completed.add(row['id'])
            with (out / 'trials.jsonl').open('a') as f:
                f.write(json.dumps({**row, 'retainedFromEarlierController': True}) + '\n')
        else:
            with (out / 'earlier-failed-attempts.jsonl').open('a') as f:
                f.write(json.dumps(row) + '\n')
    (out / 'continuation.json').write_text(json.dumps({'retainedSuccessfulCases': sorted(completed), 'reason': c['resumeReason']}, indent=2) + '\n')

def trial(case, seed=False):
    platform = case['platform']
    options = c[platform]
    source = options['sources'][case['project']]
    path = str(pathlib.PurePosixPath(options['worktrees']) / case['id'])
    code, _ = run(platform, ['git', '-C', source, 'worktree', 'add', '--detach', path, 'HEAD'],
                  out / (case['id'] + '-checkout.log'))
    if code:
        raise RuntimeError('Checkout failed: ' + case['id'])
    time.sleep(c['settleSeconds'])
    command = ['python3', c['runner'], '--project', case['project'], '--repo', path,
               '--store', options['store'], '--node', options['node'],
               '--cli', options['cli'][case['project']], '--out', options['results'],
               '--label', case['id'], '--browsers', options['browsers'], '--variant', case['variant']]
    if seed:
        command.append('--seed')
    code, output = run(platform, command, out / (case['id'] + '-driver.log'))
    records = [json.loads(line) for line in output.splitlines() if line.startswith('{')]
    record = records[0] if len(records) == 1 else None
    row = {**case, 'seedOnly': seed, 'driverExitCode': code, 'record': record}
    with (out / ('warmups.jsonl' if seed else 'trials.jsonl')).open('a') as f:
        f.write(json.dumps(row) + '\n')
    if code or record is None:
        raise RuntimeError('Preserved failing trial: ' + case['id'])
    current = (record['inputManifestSha256'], record['inventorySha256'], record['directDependencyCount'])
    if case['project'] not in reference_hashes:
        reference_hashes[case['project']] = current
    if current != reference_hashes[case['project']]:
        raise RuntimeError('Source or requested inventory changed: ' + case['id'])
    print(json.dumps({'case': case['id'], 'seedOnly': seed,
                      'seconds': record['installSeconds'], 'dependencies': record['directDependencyCount']}), flush=True)
    # Only this controller's newly created path, after evidence is saved.
    code, _ = run(platform, ['git', '-C', source, 'worktree', 'remove', '--force', path],
                  out / (case['id'] + '-cleanup.log'))
    if code:
        raise RuntimeError('Temporary worktree cleanup failed')

if not c.get('resumeFrom'):
    for project in projects:
        for platform in ['macos', 'linux']:
            for variant in ['default', 'shared']:
                trial({'project': project, 'platform': platform, 'variant': variant,
                       'id': f'warm-{project}-{variant}-{platform}'}, seed=True)
# Optional preparation barrier: no accepted trial starts while other diagnostics
# or project checks are still running on either system.
if c.get('startSignal'):
    print(json.dumps({'status': 'warmups-complete-waiting-for-start-signal'}), flush=True)
    while not pathlib.Path(c['startSignal']).is_file():
        time.sleep(1)
for ordinal, case in enumerate(schedule):
    if case['id'] not in completed:
        trial({**case, 'ordinal': ordinal})

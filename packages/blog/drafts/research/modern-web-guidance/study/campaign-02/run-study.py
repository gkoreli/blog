"""Run the preregistered 54 fresh Codex sessions; keep raw logs outside Git."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import threading
import time

campaign = Path(__file__).resolve().parent
study = campaign.parent
runtime = Path(sys.argv[1]).resolve()
plan = json.loads((runtime / 'plan.json').read_text())
tasks = {row['id']: row for row in json.loads((study / 'tasks.json').read_text())}
calibration = json.loads((study / 'calibration.json').read_text())
if not calibration['accepted']:
    raise SystemExit('Calibration has not passed. No measured worker was started.')
assert json.loads((study / 'calibration-v2.json').read_text())['accepted']
assert json.loads((study / 'calibration-v3.json').read_text())['accepted']
manifest = json.loads((campaign / 'frozen-inputs.json').read_text())
for name, expected in manifest['files'].items():
    if hashlib.sha256((study / name).read_bytes()).hexdigest() != expected:
        raise SystemExit(f'Frozen input changed: {name}')
if plan['runCount'] != 54 or len(plan['trials']) != 54:
    raise SystemExit('The plan must have exactly 54 trials.')

lock = threading.Lock()
worktree_lock = threading.Lock()
state = {row['artifact']: {**row, 'status': 'queued'} for row in plan['trials']}
state_path = runtime / 'state.json'
results_dir = campaign / 'run-results'
artifacts_dir = campaign / 'artifacts'
results_dir.mkdir(exist_ok=True); artifacts_dir.mkdir(exist_ok=True)

def save_state():
    with lock:
        temp = state_path.with_suffix('.tmp')
        temp.write_text(json.dumps({'updatedAt': time.time(), 'trials': list(state.values())}, indent=2) + '\n')
        temp.replace(state_path)

def git(folder, *args):
    return subprocess.check_output(['git', '-C', str(folder), *args], text=True).strip()

def parse_events(path):
    usage = {'input_tokens': 0, 'cached_input_tokens': 0, 'cache_write_input_tokens': 0, 'output_tokens': 0, 'reasoning_output_tokens': 0}
    commands = []; errors = []; turns = 0
    for line in path.read_text(errors='replace').splitlines():
        try: event = json.loads(line)
        except ValueError: continue
        if event.get('type') == 'turn.completed':
            turns += 1
            for key in usage: usage[key] += event.get('usage', {}).get(key, 0)
        if event.get('type') in ['error', 'turn.failed']: errors.append(event.get('message', event.get('error', {})))
        item = event.get('item', {})
        if event.get('type') == 'item.completed' and item.get('type') == 'command_execution':
            commands.append({'command': item.get('command', ''), 'exitCode': item.get('exit_code')})
    return usage, commands, errors, turns

def run(row):
    artifact = row['artifact']; task = tasks[row['task']]
    raw = runtime / 'raw' / artifact; raw.mkdir(parents=True, exist_ok=True)
    output = results_dir / (artifact + '.json')
    if output.exists():
        existing = json.loads(output.read_text()); state[artifact].update(status='complete', resumedExistingResult=True)
        save_state(); return existing
    marker = raw / 'started.json'
    if marker.exists():
        raise RuntimeError(f'{artifact} has an earlier start without a result; inspect before resuming, never rerun silently.')
    workspace = runtime / 'worktrees' / artifact
    home = runtime / 'homes' / artifact
    home.mkdir(parents=True, exist_ok=True)
    auth = Path.home() / '.codex/auth.json'
    if auth.exists(): (home / 'auth.json').symlink_to(auth)
    cache = Path.home() / '.codex/models_cache.json'
    if cache.exists(): shutil.copyfile(cache, home / 'models_cache.json')
    with worktree_lock:
        workspace.parent.mkdir(exist_ok=True)
        git(Path(plan['bases'][row['task']]['path']), 'worktree', 'add', '-q', '-b', 'codex/mwg-' + artifact, str(workspace), plan['bases'][row['task']]['commit'])
    if row['condition'] == 'skill':
        skills = workspace / '.agents/skills'; skills.mkdir(parents=True)
        (skills / 'modern-web-guidance').symlink_to(runtime / 'guidance-package/skills/modern-web-guidance', target_is_directory=True)
    text = task['brief'] + '\n\nImplement the task in index.html, app.js and style.css. Keep the integration callbacks stable. Read this project\'s AGENTS.md. Work only in this project, do not inspect neighboring folders, and do not commit. Do not install packages or use external network services. Run useful available checks and finish with a short summary of the result and verification limits.\n'
    if row['condition'] == 'supplied':
        text += '\nImplementation reference supplied for this task (adapt it to the requested behavior and browser policy):\n\n' + (study / 'supplied-guides' / (row['task'] + '.txt')).read_text()
    prompt = raw / 'input.txt'; prompt.write_text(text)
    events = raw / 'events.jsonl'; stderr = raw / 'stderr.txt'; report = raw / 'report.md'; lookup = raw / 'lookups.jsonl'
    env = {**os.environ, 'CODEX_HOME': str(home), 'DISABLE_TELEMETRY': '1', 'ENABLE_FILE_LOGGING': 'false',
           'STUDY_NODE': plan['node'], 'STUDY_LOOKUP_LOG': str(lookup), 'STUDY_MWG_AVAILABLE': '1' if row['condition'] == 'skill' else '0',
           'PATH': str(runtime / 'bin') + os.pathsep + str(Path(plan['node']).parent) + os.pathsep + os.environ['PATH']}
    env['ZDOTDIR'] = str(runtime / 'shell-startup')
    if row['condition'] == 'skill': env['STUDY_MWG_CLI'] = str(runtime / 'guidance-package/skills/modern-web-guidance/modern-web.mjs')
    cmd = [plan['codex'], 'exec', '--ignore-user-config', '--ephemeral', '--json', '--disable', 'shell_snapshot', '-C', str(workspace),
           '--model', plan['model'], '--config', f'model_reasoning_effort="{plan["reasoningEffort"]}"',
           '--config', 'approval_policy="never"', '--config', 'agents.max_depth=1', '--config', 'web_search="disabled"', '--config', 'shell_environment_policy.inherit="all"', '--config', 'shell_environment_policy.set.ZDOTDIR=' + json.dumps(str(runtime / 'shell-startup')),
           '--sandbox', 'workspace-write', '-o', str(report), '-']
    started = time.time(); marker.write_text(json.dumps({'at': started, 'workspace': str(workspace), 'model': plan['model']}) + '\n')
    state[artifact].update(status='running', startedAt=started, workspace=str(workspace), log=str(events), report=str(report))
    save_state(); print(json.dumps({'started': artifact, 'order': row['order']}), flush=True)
    timed_out = False
    with prompt.open('rb') as input_file, events.open('wb') as event_file, stderr.open('wb') as error_file:
        process = subprocess.Popen(cmd, stdin=input_file, stdout=event_file, stderr=error_file, env=env, cwd=workspace, start_new_session=True)
        (raw / 'worker.pid').write_text(str(process.pid) + '\n')
        try: code = process.wait(timeout=plan['timeoutSeconds'])
        except subprocess.TimeoutExpired:
            timed_out = True; os.killpg(process.pid, signal.SIGTERM)
            try: code = process.wait(timeout=3)
            except subprocess.TimeoutExpired: os.killpg(process.pid, signal.SIGKILL); code = process.wait()
    (raw / 'worker.exit').write_text(str(code) + '\n')
    finished = time.time()
    usage, commands, errors, turns = parse_events(events)
    lookups = [json.loads(line) for line in lookup.read_text().splitlines()] if lookup.exists() else []
    artifact_dir = artifacts_dir / artifact; artifact_dir.mkdir(exist_ok=True)
    for filename in ['index.html', 'app.js', 'style.css']:
        if (workspace / filename).exists(): shutil.copyfile(workspace / filename, artifact_dir / filename)
    diff = subprocess.check_output(['git', '-C', str(workspace), 'diff', '--', 'index.html', 'app.js', 'style.css'], text=True)
    (artifact_dir / 'change.diff').write_text(diff)
    modified = git(workspace, 'diff', '--name-only').splitlines()
    state[artifact].update(status='grading', finishedAt=finished); save_state()
    grade_output = raw / 'browser-grade.json'
    grade_process = subprocess.run([plan['node'], str(study / 'grade-v3.mjs'), row['task'], str(artifact_dir), str(grade_output)], env=os.environ, capture_output=True, text=True, timeout=120)
    if grade_process.returncode == 0:
        graded = json.loads(grade_output.read_text())
    else:
        graded = {'task': row['task'], 'checkCount': None, 'passed': None, 'results': [], 'infrastructureError': grade_process.stderr[-1500:]}
    result = {**row, 'model': plan['model'], 'reasoningEffort': plan['reasoningEffort'],
              'startedAt': started, 'finishedAt': finished, 'durationSeconds': finished - started,
              'exitCode': code, 'timedOut': timed_out, 'completedTurns': turns,
              'workerCompleted': code == 0 and not timed_out and turns > 0 and report.exists(),
              'usage': usage, 'commandCount': len(commands), 'failedCommandCount': sum(c['exitCode'] not in [0, None] for c in commands),
              'skillFileReadObserved': any('SKILL.md' in c['command'] and 'modern-web-guidance' in c['command'] for c in commands),
              'lookups': lookups, 'workerErrorCount': len(errors),
              'modifiedTrackedFiles': modified, 'extraTrackedChanges': [name for name in modified if name not in ['index.html', 'app.js', 'style.css']],
              'patchAddedLines': sum(line.startswith('+') and not line.startswith('+++') for line in diff.splitlines()),
              'patchRemovedLines': sum(line.startswith('-') and not line.startswith('---') for line in diff.splitlines()),
              'artifactSha256': {name: hashlib.sha256((artifact_dir / name).read_bytes()).hexdigest() for name in ['index.html', 'app.js', 'style.css'] if (artifact_dir / name).exists()},
              'browserGrade': graded}
    result['taskPassed'] = bool(result['workerCompleted'] and graded['checkCount'] and graded['passed'] == graded['checkCount'])
    output.write_text(json.dumps(result, indent=2) + '\n')
    state[artifact].update(status='complete', taskPassed=result['taskPassed'], checksPassed=graded['passed'], checkCount=graded['checkCount'], durationSeconds=result['durationSeconds'])
    save_state(); print(json.dumps({'completed': artifact, 'taskPassed': result['taskPassed'], 'checks': [graded['passed'], graded['checkCount']], 'durationSeconds': round(result['durationSeconds'],1)}), flush=True)
    return result

save_state()
with concurrent.futures.ThreadPoolExecutor(max_workers=plan['maximumConcurrentWorkers']) as pool:
    futures = [pool.submit(run, row) for row in plan['trials']]
    for future in concurrent.futures.as_completed(futures): future.result()
print(json.dumps({'finished': len(list(results_dir.glob('*.json'))), 'expected': 54}), flush=True)

"""Run an isolated instance against owned loopback pages; no real logins."""
import functools
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time

if len(sys.argv) not in [5, 6]:
    raise SystemExit("Usage: python3 agweb-profiles.py /cli /fresh-root /fresh-fixtures /fresh-receipt.json [release-v0.2.0]")
cli, root, fixtures, output = map(lambda p: Path(p).resolve(), sys.argv[1:5])
build_mode = sys.argv[5] if len(sys.argv) == 6 else 'source-test-build'
assert build_mode in ['release-v0.2.0', 'source-test-build']
assert cli.is_file() and not root.exists() and not fixtures.exists() and not output.exists()
root.mkdir()
fixtures.mkdir()
(fixtures / 'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Radar synthetic storage</title><p>Owned cookie and storage fixture.</p>\n')
(fixtures / 'blocklist.txt').write_text('! Empty owned research list\n')
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(fixtures)))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
origin = f'http://127.0.0.1:{server.server_port}'
env = {key: value for key, value in os.environ.items() if key in [
    'HOME', 'PATH', 'TMPDIR', 'LANG', 'LC_ALL', 'LC_CTYPE', '__CF_USER_TEXT_ENCODING', 'USER', 'LOGNAME']}
env.update(AGWEB_ROOT=str(root), AGWEB_HOME=str(fixtures / 'home'),
    AGWEB_DOWNLOAD_DIR=str(fixtures / 'downloads'), AGWEB_CLI_LINK=str(fixtures / 'bin/agweb'),
    AGWEB_ADBLOCK_LISTS=origin + '/blocklist.txt', AGWEB_INSTANT='1')
commands = []
def call(*args):
    result = subprocess.run([str(cli), *args], env=env, cwd=fixtures,
        capture_output=True, text=True, timeout=50)
    commands.append({'args': list(args), 'exitCode': result.returncode,
        'stdout': result.stdout, 'stderr': result.stderr})
    (fixtures / 'commands.json').write_text(json.dumps(commands, indent=2) + '\n')
    if result.returncode:
        raise RuntimeError(f'CLI failed: {args}: {result.stdout} {result.stderr}')
    return result.stdout.strip()
def state(workspace):
    value = call('-w', workspace, '--raw', 'eval',
        'JSON.stringify({cookie:document.cookie,local:localStorage.getItem("radar")})')
    return json.loads(value)
def put(workspace, value):
    call('-w', workspace, '--raw', 'eval',
        '() => { document.cookie="radar=' + value + '; path=/"; localStorage.setItem("radar","' + value + '"); return true }')

try:
    for workspace in ['private-a', 'private-b']:
        call('-w', workspace, 'open', origin + '/index.html')
    put('private-a', 'private-fixture')
    private_a, private_b = state('private-a'), state('private-b')
    assert private_a == {'cookie': 'radar=private-fixture', 'local': 'private-fixture'}
    assert private_b == {'cookie': '', 'local': None}
    for workspace in ['shared-a', 'shared-b']:
        call('-w', workspace, 'open', origin + '/index.html', '-p', 'radar-shared-fixture')
    put('shared-a', 'shared-fixture')
    shared_a = state('shared-a')
    for _ in range(20):
        shared_b = state('shared-b')
        if shared_b == shared_a:
            break
        time.sleep(0.1)
    assert shared_a == {'cookie': 'radar=shared-fixture', 'local': 'shared-fixture'}
    assert shared_b == shared_a
    call('-w', 'other-profile', 'open', origin + '/index.html', '-p', 'radar-other-fixture')
    other = state('other-profile')
    assert other == {'cookie': '', 'local': None}
    receipt = {
        'sourceCommit': 'a52c8b66e16499ec2781c7fea3c4a37983a7002c',
        'build': build_mode,
        'os': subprocess.check_output(['sw_vers', '-productVersion'], text=True).strip(),
        'architecture': subprocess.check_output(['uname', '-m'], text=True).strip(),
        'versionReply': call('version'),
        'cases': {'unnamedWriter': private_a, 'otherUnnamed': private_b,
            'namedWriter': shared_a, 'sameNamedProfile': shared_b, 'differentNamedProfile': other},
        'rootMode': 'unique nondefault AGWEB_ROOT; new synthetic profile names',
        'pageOrigin': 'loopback HTTP at one ephemeral origin',
        'adblockList': 'owned loopback list',
        'realAccountUsed': False, 'publicPageOpened': False,
        'cliOrSkillInstalled': False, 'modelServiceCalls': 0,
        'scope': 'One running macOS WebKit app: cookie/localStorage isolation and sharing across five synthetic workspaces; no focus/memory/token benchmark, restart persistence or complete browser isolation audit.',
    }
    with output.open('x') as destination:
        destination.write(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'unnamedIsolated': True, 'sameNamedShared': True, 'differentNamedIsolated': True}))
finally:
    try:
        call('quit')
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)

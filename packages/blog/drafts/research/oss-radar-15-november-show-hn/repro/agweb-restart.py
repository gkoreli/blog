"""One owned form interaction and actual WebKit profile persistence; no real accounts."""
import functools
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time

cli, root, fixtures, output = map(lambda p: Path(p).resolve(), sys.argv[1:5])
release = sys.argv[5] if len(sys.argv) > 5 else '0.2.0'
assert release in ['0.2.0','0.3.0']
assert cli.is_file() and not root.exists() and not fixtures.exists() and not output.exists()
root.mkdir(); fixtures.mkdir()
(fixtures / 'index.html').write_text('''<!doctype html><meta charset="utf-8"><title>Owned Radar form</title>
<form id="entry"><label>Name <input id="name"></label><button id="save">Save</button></form><p id="result"></p>
<script>document.querySelector('#entry').onsubmit=e=>{e.preventDefault();document.querySelector('#result').textContent='Saved '+document.querySelector('#name').value}</script>''')
(fixtures / 'blocklist.txt').write_text('! Owned empty research list\n')
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(fixtures)))
thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
origin = f'http://127.0.0.1:{server.server_port}'
env = {k: v for k, v in os.environ.items() if k in ['HOME','PATH','TMPDIR','LANG','LC_ALL','LC_CTYPE','__CF_USER_TEXT_ENCODING','USER','LOGNAME']}
env.update(AGWEB_ROOT=str(root), AGWEB_HOME=str(fixtures/'home'), AGWEB_DOWNLOAD_DIR=str(fixtures/'downloads'), AGWEB_CLI_LINK=str(fixtures/'bin/agweb'), AGWEB_ADBLOCK_LISTS=origin+'/blocklist.txt', AGWEB_INSTANT='1')
commands = []
def call(*args):
    r = subprocess.run([str(cli), *args], env=env, cwd=fixtures, capture_output=True, text=True, timeout=45)
    commands.append({'args':list(args),'exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr})
    (fixtures/'commands.json').write_text(json.dumps(commands,indent=2)+'\n')
    if r.returncode: raise RuntimeError(f'{args}: {r.stdout} {r.stderr}')
    return r.stdout.strip()
def read(workspace):
    return json.loads(call('-w', workspace, '--raw', 'eval', 'JSON.stringify({cookie:document.cookie,local:localStorage.getItem("radar")})'))
def put(workspace, text):
    call('-w', workspace, '--raw', 'eval', '() => { document.cookie="radar='+text+'; path=/; max-age=3600"; localStorage.setItem("radar","'+text+'"); return true }')
def quit_owned():
    call('quit')
    for _ in range(100):
        if not (root/'agweb.sock').exists(): return
        time.sleep(0.05)
    raise RuntimeError('Owned app socket remained after quit')
try:
    call('-w','named','open',origin+'/index.html','-p','radar-restart-fixture')
    snapshot=call('-w','named','snapshot')
    call('-w','named','fill','#name','Ada')
    action=call('-w','named','click','#save')
    form=call('-w','named','--raw','eval','document.querySelector("#result").textContent')
    assert form == 'Saved Ada', form
    covered = None
    if release == '0.3.0':
        call('-w','named','--raw','eval','() => { const c=document.createElement("div"); c.id="cover"; c.style.cssText="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.1)";document.body.append(c);return true }')
        r=subprocess.run([str(cli),'-w','named','click','#save'],env=env,cwd=fixtures,capture_output=True,text=True,timeout=45)
        covered={'exitCode':r.returncode,'reply':r.stdout+r.stderr}
        assert r.returncode != 0 and 'cover' in covered['reply'].lower(), covered
        call('-w','named','--raw','eval','document.querySelector("#cover").remove()')
    put('named','persist')
    call('-w','unnamed','open',origin+'/index.html')
    put('unnamed','temporary')
    before={'named':read('named'),'unnamed':read('unnamed')}
    assert before['named']=={'cookie':'radar=persist','local':'persist'}
    assert before['unnamed']=={'cookie':'radar=temporary','local':'temporary'}
    time.sleep(1)
    quit_owned()
    call('-w','named-after','open',origin+'/index.html','-p','radar-restart-fixture')
    call('-w','unnamed-after','open',origin+'/index.html')
    after={'named':read('named-after'),'unnamed':read('unnamed-after')}
    assert after['named']==before['named']
    assert after['unnamed']=={'cookie':'','local':None}
    result={'release':release,'source':'a52c8b66e16499ec2781c7fea3c4a37983a7002c' if release=='0.2.0' else '1d97f056b8727f7278cb4da4d11c1af22cda2ec9','formResult':form,'snapshotContainsInput':'Name' in snapshot,'actionReplyContainsSaved':'Saved Ada' in action,'coveredButton':covered,'beforeRestart':before,'afterRestart':after,'settleBeforeQuitSeconds':1,'sameOrigin':True,'versionReply':call('version'),'scope':'One form and one loopback origin, named versus unnamed cookie/localStorage across application restart, and a current-release covered-button control. No real login, focus or efficiency result.'}
    output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
finally:
    try: quit_owned()
    finally: server.shutdown(); server.server_close(); thread.join(timeout=5)

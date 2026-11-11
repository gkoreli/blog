"""Run unmodified Coldframe handlers on a loopback-only, OS-selected HTTP port.

Usage: python3 coldframe.py /pinned/coldframe/checkout /temporary/trial/directory
The main() wildcard bind is replaced by constructing its real server/handler directly.
"""
import importlib.util
import json
import os
from pathlib import Path
import sys
import threading
import urllib.request
import xml.etree.ElementTree as ET

checkout, output = map(Path, sys.argv[1:])
output.mkdir(parents=True, exist_ok=True)
os.environ.update(PERSONA='danfoss', LOG_PATH=str(output/'events.jsonl'))
spec = importlib.util.spec_from_file_location('coldframe_fixture', checkout/'honeypot.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
server = module.DecoyHTTPServer(('127.0.0.1', 0), module.DecoyHTTP)
worker = threading.Thread(target=server.serve_forever, daemon=True)
worker.start()
address = f'http://127.0.0.1:{server.server_address[1]}/html/xml.cgi'
def call(xml, token=None):
    headers = {} if token is None else {'AKSM-Auth': token}
    with urllib.request.urlopen(urllib.request.Request(address, data=xml.encode(), headers=headers), timeout=5) as response:
        body = response.read().decode()
    return body, ET.fromstring(body)
try:
    _, denied = call('<cmd action="getauth" user="nobody" password="wrong"/>')
    assert denied.find('.//session_token') is None
    _, login = call('<cmd action="getauth" user="Supervisor" password="12345"/>')
    token = login.find('.//session_token').text
    before, _ = call('<cmd action="read_devices"/>', token)
    call('<cmd action="start_defrost" node="2"/>', token)
    after, _ = call('<cmd action="read_devices"/>', token)
    events = [json.loads(line) for line in (output/'events.jsonl').read_text().splitlines()]
    controls = [e for e in events if e['event']=='control']
    assert any(e.get('node')=='2' and e.get('defrost') is True for e in controls)
    assert 'node="2" name="Frozen 2"' in after and 'defrost="1"' in after
    result = {'serverBoundTo':'127.0.0.1','wrongLoginDenied':True,'defaultLoginGranted':bool(token),
        'fakeStateChanged':before!=after,'loggedControl':bool(controls),
        'controlEvent':{k:v for k,v in controls[0].items() if k not in ['ts','src_port']},
        'scope':'Real HTTP/XML handlers and logging; no real equipment, public listener or attacker attraction test'}
    (output/'results.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
finally:
    server.shutdown();server.server_close();worker.join(timeout=5)

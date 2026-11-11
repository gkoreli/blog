"""Check tmux's status callback using a dedicated server; never loads user config.

Usage: python3 tmux-status.py /temporary/trial/directory
This checks the mechanism continuum uses, not a whole reboot/restore.
"""
import fcntl
import json
import os
from pathlib import Path
import pty
import struct
import subprocess
import sys
import termios
import time

root=Path(sys.argv[1]).resolve();root.mkdir(parents=True,exist_ok=True)
socket=root/'tmux.sock';ticks=root/'ticks.txt'
base=['tmux','-S',str(socket)]
env=dict(os.environ,TERM='xterm-256color')
def command(*args):return subprocess.run([*base,*args],env=env,check=True,capture_output=True,text=True)
def count():return len(ticks.read_text().splitlines()) if ticks.exists() else 0
client=None
master=slave=None
try:
    command('-f','/dev/null','new-session','-d','-s','radar','sleep 40')
    command('set-option','-g','status-interval','1')
    command('set-option','-g','status-right',f'#(date +%s >> {ticks})')
    time.sleep(5)
    detached=count()
    master,slave=pty.openpty()
    fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,100,0,0))
    client=subprocess.Popen([*base,'attach-session','-t','radar'],stdin=slave,stdout=slave,stderr=slave,env=env)
    time.sleep(5)
    attached=count()-detached
    result={'tmuxVersion':command('-V').stdout.strip(),'detachedSeconds':5,'detachedCallbacks':detached,
        'attachedSeconds':5,'attachedCallbacks':attached,'dedicatedSocket':True,
        'scope':'Live status callback only; no continuum plugin installation, real agent or reboot'}
    (root/'results.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
finally:
    subprocess.run([*base,'kill-server'],env=env,capture_output=True)
    if client is not None:
        try:client.wait(timeout=5)
        except subprocess.TimeoutExpired:client.terminate();client.wait(timeout=5)
    for fd in [master,slave]:
        if fd is not None:os.close(fd)

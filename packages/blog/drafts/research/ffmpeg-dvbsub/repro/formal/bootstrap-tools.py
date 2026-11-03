"""Fetch pinned verification tools into a disposable macOS ARM64 directory."""
import argparse,hashlib,json,platform,subprocess,tarfile,urllib.request
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);a=p.parse_args()
if platform.system()!='Darwin' or platform.machine()!='arm64':raise SystemExit('This lock targets macOS ARM64. Supply native CBMC/Z3/Java for other hosts.')
r=Path(__file__).resolve().parent;out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
lock=json.loads((r/'tool-lock.json').read_text())
for name in ['cbmc','java','tlc','z3']:
    item=lock[name];filename=item['url'].rsplit('/',1)[-1]
    if name=='cbmc':filename='cbmc.tar.gz'
    if name=='tlc':filename='tla2tools.jar'
    target=out/filename
    if not target.exists():
        headers={}
        if name=='cbmc':
            token=json.load(urllib.request.urlopen('https://ghcr.io/token?service=ghcr.io&scope=repository:homebrew/core/cbmc:pull'))['token']
            headers['Authorization']='Bearer '+token
        target.write_bytes(urllib.request.urlopen(urllib.request.Request(item['url'],headers=headers)).read())
    assert hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256'],name
    if name in ['cbmc','java']:
        dest=out/name
        if not dest.exists():
            with tarfile.open(target) as archive:archive.extractall(dest,filter='data')
    if name=='z3' and not (out/'z3-package').exists():
        subprocess.run(['python3','-m','pip','install','--no-deps','--target',str(out/'z3-package'),str(target)],check=True)
    print('Verified',name,item['version'],flush=True)

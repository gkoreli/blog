"""Check every patch increment and the exact final source without touching a checkout."""
from pathlib import Path
import difflib,hashlib,json,subprocess,tempfile
r=Path(__file__).resolve().parent;base=r.parent/'baseline'
patches=[base/'01-palette-boundaries.patch',base/'02-native-rle-fill.patch',base/'03-palette-output-copy.patch',r/'04-output-errors.patch',r/'05-short-headers.patch']
with tempfile.TemporaryDirectory() as d:
    d=Path(d);(d/'libavcodec').mkdir();source=d/'libavcodec/dvbsubdec.c';source.write_bytes((base/'upstream.c').read_bytes())
    for patch in patches:
        subprocess.run(['git','apply','--check',str(patch)],cwd=d,check=True)
        subprocess.run(['git','apply',str(patch)],cwd=d,check=True)
    assert source.read_bytes()==(r/'hardened.c').read_bytes()
    check=subprocess.run(['git','diff','--no-index','--check',str(base/'upstream.c'),str(source)],capture_output=True,text=True)
    assert check.returncode in (0,1) and not check.stdout and not check.stderr, check
patch=''.join(difflib.unified_diff((base/'upstream.c').read_text().splitlines(True),(r/'hardened.c').read_text().splitlines(True),fromfile='a/libavcodec/dvbsubdec.c',tofile='b/libavcodec/dvbsubdec.c'))
(r/'candidate-hardened.patch').write_text(patch)
print('PASS five sequential patches reproduce hardened.c exactly; whitespace checks pass')
print('hardened.c SHA-256:',hashlib.sha256((r/'hardened.c').read_bytes()).hexdigest())

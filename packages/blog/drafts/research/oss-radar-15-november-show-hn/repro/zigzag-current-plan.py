"""Inspect current multi-object exports through pyembroidery, independent of ZigZag's reader."""
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
from pyembroidery import EmbPattern, STITCH, JUMP, TRIM, COLOR_CHANGE, END, COMMAND_MASK

cli, root, output = map(lambda x: Path(x).resolve(), sys.argv[1:])
root.mkdir(exist_ok=False)
svg = root / 'curved-mark.svg'
svg.write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="60mm" height="30mm" viewBox="0 0 60 30">
<path fill="#213e70" fill-rule="evenodd" d="M8 15 C8 2 29 2 29 15 C29 28 8 28 8 15 Z M13 15 C13 23 24 23 24 15 C24 7 13 7 13 15 Z"/>
<path fill="#287b42" d="M35 15 C34 5 47 3 52 6 C48 14 44 18 35 15 Z"/>
<path fill="#287b42" d="M35 18 C43 14 53 20 54 26 C43 28 37 26 35 18 Z"/>
</svg>''')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
cases = []
for name, settings in [('default', []), ('melco-default', ['--machine','melco-summit']), ('melco-min06', ['--machine','melco-summit','--min-stitch','0.6'])]:
    pes, exp, preview = [root / (name + suffix) for suffix in ['.pes','.exp','.png']]
    cmd = [str(cli),'convert',str(svg),'--out',str(pes),'--out',str(exp),'--out',str(preview),'--hoop','100x100','--objects',*settings]
    r = subprocess.run(cmd,capture_output=True,text=True,timeout=90)
    (root/(name+'.log')).write_text(r.stdout+r.stderr)
    r.check_returncode()
    files = []
    for path in [pes,exp]:
        pattern = EmbPattern(str(path))
        previous = (0,0)
        lengths, zero, counts = [],0,{}
        for x,y,command in pattern.stitches:
            command &= COMMAND_MASK
            counts[str(command)] = counts.get(str(command),0)+1
            if command == STITCH:
                mm = math.hypot(x-previous[0],y-previous[1])/10
                if mm > 1e-9: lengths.append(mm)
                else: zero += 1
            previous = (x,y)
        assert lengths
        files.append({'format':path.suffix[1:],'sha256':sha(path),'nonzeroSewingMoves':len(lengths),'zeroSewingMoves':zero,'under04mm':sum(x<0.4-1e-9 for x in lengths),'under06mm':sum(x<0.6-1e-9 for x in lengths),'minNonzeroMm':min(lengths),'maxMm':max(lengths),'commands':counts,'boundsTenthMm':list(pattern.bounds())})
    cases.append({'case':name,'settings':settings,'exitCode':r.returncode,'files':files,'previewSha256':sha(preview)})
oversized = root / 'over-hoop.exp'
r = subprocess.run([str(cli),'convert',str(svg),'--out',str(oversized),'--hoop','10x10','--machine','melco-summit','--min-stitch','0.6'],capture_output=True,text=True,timeout=90)
(root/'over-hoop.log').write_text(r.stdout+r.stderr)
assert r.returncode == 0 and oversized.exists() and 'error: Design is' in r.stdout+r.stderr
result={'release':'0.1.5','source':'429a028054145fc3e541525bb05b57596fa49d22','version':subprocess.check_output([str(cli),'--version'],text=True).strip(),'input':'Authored curved ring with a hole and two separate leaves, two thread colors; 60x30mm SVG','inputSha256':sha(svg),'reader':'pyembroidery 1.5.1, units 0.1mm; counts exclude jumps/trims/color commands and separate zero-length stitches','cases':cases,'overHoopControl':{'hoopMm':[10,10],'exitCode':r.returncode,'constraintErrorPrinted':True,'fileWritten':True,'sha256':sha(oversized)},'scope':'Core CLI, current planner, PES/EXP serialization and independent reread; no shop artwork/checker, GUI, machine, thread/fabric or sew-out result.'}
output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))

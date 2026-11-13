from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys

campaign = Path(__file__).resolve().parent
study = campaign.parent
runtime = Path(sys.argv[1]).resolve()
assert not list((runtime / 'raw').glob('*/started.json'))
assert json.loads((campaign / 'execution-preflight.json').read_text())['accepted']
assert json.loads((study / 'calibration-v2.json').read_text())['accepted']
assert json.loads((study / 'calibration-v3.json').read_text())['accepted']
files = [study / 'tasks.json', study / 'grade-v3.mjs', study / 'calibration.json', study / 'calibration-v2.json', study / 'calibration-v3.json']
for folder in ['fixtures', 'controls/reference', 'supplied-guides']:
    files += [p for p in (study / folder).rglob('*') if p.is_file()]
files += [p for p in campaign.iterdir() if p.is_file() and p.suffix in ['.py', '.md', '.json'] and p.name != 'frozen-inputs.json']
hashes = {p.relative_to(study).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))}
manifest = {'campaign': 2, 'frozenAt': datetime.now(timezone.utc).isoformat(), 'files': hashes, 'fileCount': len(hashes), 'compositeSha256': hashlib.sha256(json.dumps(hashes,sort_keys=True,separators=(',',':')).encode()).hexdigest()}
target = campaign / 'frozen-inputs.json'
assert not target.exists(), 'Refuse to replace a freeze.'
target.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({k:manifest[k] for k in ['campaign','frozenAt','fileCount','compositeSha256']}))

"""Freeze checked inputs exactly once before any measured session."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parent
runtime = Path(sys.argv[1]).resolve()
if list((runtime / 'raw').glob('*/started.json')):
    raise SystemExit('Measured trials already started; use an explicit amendment, not a new freeze.')
calibration = json.loads((root / 'calibration.json').read_text())
assert calibration['accepted'] and len(calibration['results']) == 6
for row in calibration['results']:
    assert row['positive']['passed'] == row['positive']['checkCount']
    assert row['negative']['passed'] < row['negative']['checkCount']
assert next(row for row in calibration['results'] if row['task'] == 'T02')['starter']['passed'] == 14
assert next(row for row in calibration['results'] if row['task'] == 'T01')['positive']['checkCount'] == 18
files = [root / name for name in ['tasks.json', 'make-fixtures.mjs', 'grade.mjs', 'calibrate.mjs', 'calibration-initial.json', 'calibration.json', 'prepare-study.py', 'run-study.py', 'analyze.py', 'freeze-study.py', 'protocol.md', 'plan.json']]
for folder in ['fixtures', 'controls/reference', 'supplied-guides']:
    files.extend(path for path in (root / folder).rglob('*') if path.is_file())
hashes = {path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(files)}
manifest = {'frozenAt': datetime.now(timezone.utc).isoformat(),
    'sourceRepositoryCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
    'fileCount': len(hashes), 'files': hashes,
    'compositeSha256': hashlib.sha256(json.dumps(hashes, sort_keys=True, separators=(',', ':')).encode()).hexdigest()}
target = root / 'frozen-inputs.json'
if target.exists(): raise SystemExit('Freeze already exists; refusing replacement.')
target.write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({key: manifest[key] for key in ['frozenAt', 'fileCount', 'compositeSha256']}))

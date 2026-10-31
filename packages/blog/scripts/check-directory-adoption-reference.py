"""Run the pinned RFC comparison with the exact adoption input and record its hash."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

source, manifest, input_path, output = sys.argv[1:]
raw = Path(input_path).read_bytes()
data = json.loads(raw)
trials = [{key: trial[key] for key in ('name', 'now', 'context')} for trial in data['cases']]
wrapper = Path(__file__).resolve().parent.parent / 'drafts/research/analytics-retrospective/probe-directory-reference.py'
completed = subprocess.run([sys.executable, str(wrapper), source, manifest],
    input=json.dumps({'trials': trials}).encode(), capture_output=True, check=True)
result = json.loads(completed.stdout)
result['inputSha256'] = hashlib.sha256(raw).hexdigest()
with Path(output).open('x') as stream:
    json.dump(result, stream, indent=2)
    stream.write('\n')
print(json.dumps({'referenceCalls': result['referenceCalls'], 'sourceFilesRechecked': result['sourceFilesRechecked']}))

"""Verify frozen inputs, planned denominators, row consistency and code hashes."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

study = Path(__file__).resolve().parent
repo_root = Path(subprocess.check_output(['git','rev-parse','--show-toplevel'],cwd=study,text=True).strip())
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
for manifest_path in [study/'frozen-inputs.json', study/'campaign-02/frozen-inputs.json']:
    manifest = json.loads(manifest_path.read_text())
    for name, expected in manifest['files'].items():
        assert digest(study/name) == expected, ('Frozen input changed', name)

seen = set(); campaigns = []
expected_counts = {'T01':18, 'T02':14, 'T03':16, 'T04':16, 'T05':16, 'T06':16}
for root in [study, study/'campaign-02']:
    plan = json.loads((root/'plan.json').read_text())
    rows = [json.loads((root/'run-results'/(item['artifact']+'.json')).read_text()) for item in plan['trials']]
    assert len(rows) == 54 and len(list((root/'run-results').glob('*.json'))) == 54
    assert len({r['artifact'] for r in rows}) == 54
    for task in expected_counts:
        for condition in ['baseline','skill','supplied']:
            assert sum(r['task']==task and r['condition']==condition for r in rows) == 3
    for row in rows:
        assert row['artifact'] not in seen; seen.add(row['artifact'])
        g = row['browserGrade']
        assert g['checkCount'] == expected_counts[row['task']] == len(g['results'])
        assert g['passed'] == sum(item['passed'] for item in g['results'])
        assert row['taskPassed'] == bool(row['workerCompleted'] and g['passed']==g['checkCount'])
        assert abs(row['durationSeconds']-(row['finishedAt']-row['startedAt'])) < .001
        for file, expected in row['artifactSha256'].items():
            path = root/'artifacts'/row['artifact']/file
            assert digest(path) == expected, ('Artifact changed', str(path))
            if '--staged' in sys.argv:
                relative = path.relative_to(repo_root).as_posix()
                blob = subprocess.check_output(['git','show',':'+relative],cwd=repo_root)
                assert hashlib.sha256(blob).hexdigest()==expected, ('Staged bytes differ',relative)
    campaigns.append({'path':root.relative_to(study).as_posix(),'attempts':len(rows),'completed':sum(r['workerCompleted'] for r in rows),'timeouts':sum(r['timedOut'] for r in rows),'checks':sum(r['browserGrade']['checkCount'] for r in rows)})
assert len(seen)==108
receipt={'accepted':True,'frozenManifestsVerified':2,'uniqueGenerationAttempts':108,'campaigns':campaigns,'artifactFilesHashed':len(seen)*3,'limit':'Integrity verification, not independent validation of every grader assumption.'}
(study/'verification.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))

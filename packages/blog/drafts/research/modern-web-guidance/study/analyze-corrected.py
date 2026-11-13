"""Apply the frozen analysis unchanged to separately preserved corrected grades."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parent
plan = json.loads((root / 'plan.json').read_text())
changed = []
with tempfile.TemporaryDirectory(prefix='mwg-corrected-analysis-') as scratch:
    temp = Path(scratch)
    (temp / 'run-results').mkdir()
    shutil.copyfile(root / 'analyze.py', temp / 'analyze.py')
    shutil.copyfile(root / 'plan.json', temp / 'plan.json')
    for trial in plan['trials']:
        row = json.loads((root / 'run-results' / (trial['artifact'] + '.json')).read_text())
        if row['task'] in ['T01', 'T06']:
            grade_dir = 'regraded-dialog' if row['task'] == 'T01' else 'regraded'
            corrected = json.loads((root / grade_dir / (trial['artifact'] + '.json')).read_text())
            old = row['taskPassed']
            row['browserGrade'] = corrected
            row['taskPassed'] = bool(row['workerCompleted'] and corrected['passed'] == corrected['checkCount'])
            if row['taskPassed'] != old:
                changed.append({'artifact': row['artifact'], 'condition': row['condition'], 'originalTaskPassed': old, 'correctedTaskPassed': row['taskPassed']})
        (temp / 'run-results' / (trial['artifact'] + '.json')).write_text(json.dumps(row) + '\n')
    subprocess.run(['python3', str(temp / 'analyze.py')], check=True, capture_output=True, text=True)
    result = json.loads((temp / 'summary.json').read_text())
    result['gradingVersion'] = 'v3 for every T01 artifact; v2 for every T06 artifact; v1 unchanged for other tasks'
    result['amendments'] = ['amendment-01-reveal-grading.md', 'amendment-02-dialog-settling.md']
    result['changedTaskSuccesses'] = changed
    (root / 'summary-corrected.json').write_text(json.dumps(result, indent=2) + '\n')
    shutil.copyfile(temp / 'runs.csv', root / 'runs-corrected.csv')
print(json.dumps(result, indent=2))

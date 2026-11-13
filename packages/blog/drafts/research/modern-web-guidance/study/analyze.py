"""Aggregate every scheduled attempt, with paired resampling over six tasks."""
import csv
import json
from pathlib import Path
import random
import statistics

root = Path(__file__).resolve().parent
plan = json.loads((root / 'plan.json').read_text())
rows = [json.loads((root / 'run-results' / (trial['artifact'] + '.json')).read_text()) for trial in plan['trials']]
assert len(rows) == 54 and len({row['artifact'] for row in rows}) == 54
conditions = ['baseline', 'skill', 'supplied']
task_ids = sorted({row['task'] for row in rows})
summary = {}
for condition in conditions:
    sample = [row for row in rows if row['condition'] == condition]
    assert len(sample) == 18
    summary[condition] = {
        'attempts': len(sample), 'workersCompleted': sum(row['workerCompleted'] for row in sample),
        'tasksPassed': sum(row['taskPassed'] for row in sample), 'timeouts': sum(row['timedOut'] for row in sample),
        'gradingInfrastructureFailures': sum(row['browserGrade']['checkCount'] is None for row in sample),
        'checksPassed': sum(row['browserGrade']['passed'] or 0 for row in sample),
        'checksGraded': sum(row['browserGrade']['checkCount'] or 0 for row in sample),
        'meanRunCheckFraction': statistics.mean((row['browserGrade']['passed'] or 0) / row['browserGrade']['checkCount'] if row['browserGrade']['checkCount'] else 0 for row in sample),
        'medianDurationSeconds': statistics.median(row['durationSeconds'] for row in sample),
        'uncachedInputTokens': sum(max(0, row['usage']['input_tokens'] - row['usage']['cached_input_tokens']) for row in sample),
        'outputTokens': sum(row['usage']['output_tokens'] for row in sample),
        'skillReadObserved': sum(row['skillFileReadObserved'] for row in sample),
        'searchObserved': sum(any(call['args'] and call['args'][0] == 'search' for call in row['lookups']) for row in sample),
        'retrievalObserved': sum(any(call['args'] and call['args'][0] == 'retrieve' for call in row['lookups']) for row in sample),
        'medianAddedLines': statistics.median(row['patchAddedLines'] for row in sample),
    }
by_task = {}
for task in task_ids:
    by_task[task] = {}
    for condition in conditions:
        sample = [row for row in rows if row['task'] == task and row['condition'] == condition]
        assert len(sample) == 3
        by_task[task][condition] = {'passed': sum(row['taskPassed'] for row in sample), 'attempts': 3,
            'meanCheckFraction': statistics.mean((row['browserGrade']['passed'] or 0) / row['browserGrade']['checkCount'] if row['browserGrade']['checkCount'] else 0 for row in sample)}

comparisons = {}
for condition in ['skill', 'supplied']:
    deltas = [by_task[task][condition]['passed'] / 3 - by_task[task]['baseline']['passed'] / 3 for task in task_ids]
    rng = random.Random(20261113)
    draws = sorted(statistics.mean(rng.choices(deltas, k=len(deltas))) for _ in range(10000))
    comparisons[condition + '-baseline'] = {'taskSuccessDifferencePp': statistics.mean(deltas) * 100,
        'taskClusterBootstrap95Pp': [draws[249] * 100, draws[9749] * 100],
        'clusters': len(task_ids), 'resamples': 10000,
        'limit': 'Descriptive task-cluster resampling across six purposively selected fixtures; not a population guarantee or independent human review.'}
result = {'planned': 54, 'observed': len(rows), 'conditions': summary, 'byTask': by_task, 'comparisons': comparisons}
(root / 'summary.json').write_text(json.dumps(result, indent=2) + '\n')
with (root / 'runs.csv').open('w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['artifact', 'task', 'condition', 'repetition', 'worker_completed', 'task_passed', 'timed_out', 'checks_passed', 'checks_graded', 'seconds', 'uncached_input_tokens', 'output_tokens', 'search_calls', 'retrieve_calls'])
    for row in rows:
        writer.writerow([row['artifact'], row['task'], row['condition'], row['repetition'], row['workerCompleted'], row['taskPassed'], row['timedOut'], row['browserGrade']['passed'], row['browserGrade']['checkCount'], round(row['durationSeconds'],3), max(0,row['usage']['input_tokens']-row['usage']['cached_input_tokens']), row['usage']['output_tokens'], sum(call['args'][0]=='search' for call in row['lookups'] if call['args']),sum(call['args'][0]=='retrieve' for call in row['lookups'] if call['args'])])
print(json.dumps(result, indent=2))

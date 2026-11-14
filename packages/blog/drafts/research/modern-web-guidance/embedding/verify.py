"""Check frozen study files, normalized result receipts, denominators and full ranking rows."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
hash_bytes = lambda value: hashlib.sha256(value).hexdigest()
manifest = json.loads((root / 'frozen-inputs.json').read_text())
for name, expected in manifest['files'].items():
    if not name.startswith('source:'):
        assert hash_bytes((root / name).read_bytes()) == expected, name

results = root / 'results'
rows = json.loads((results / 'quality.json').read_text())
runs = [json.loads((results / f'replicate-{i:02d}.json').read_text()) for i in [1, 2, 3]]
assert len(rows) == 604 and len({row['qid'] for row in rows}) == 604
answerable = [row for row in rows if row['dataset'] == 'agent-test' and row['scope'] == 'in_domain' and row['grade2Guides']]
oos = [row for row in rows if row['dataset'] == 'oos']
assert len(answerable) == 504 and len(oos) == 90
assert not any(row['absentGrade2Guides'] for row in answerable)
for run in runs:
    assert run['sourceCommit'] == manifest['sourceCommit']
    assert run['configSha256'] == manifest['files']['cases.json']
    assert run['quality']['perQuerySha256'] == hash_bytes((results / 'quality.json').read_bytes())
    assert run['reproduction']['maxCoordinateDifference'] == 0
    assert run['reproduction']['vectorsCompared'] == 628
    assert run['reproduction']['cliRankingCallsMatched'] == len(run['timing']['cliCalls']) == 12
    assert len(run['timing']['short']['batchMeanMicroseconds']) == 30
    for method, summary in run['quality']['summaries'].items():
        assert summary['grade2HitAt10'] == sum(any(item in row['grade2Guides'] for item in row['rankings'][method]) for row in answerable)
        assert summary['oosAdmitted'] == sum(bool(row['rankings'][method]) for row in oos)
        assert summary['returnedCandidates'] == sum(len(row['rankings'][method]) for row in answerable)
        assert summary['unjudgedReturned'] == sum(item not in row['judgedGuideIds'] for row in answerable for item in row['rankings'][method])
        assert summary['answerableDenominator'] == len(answerable)
        assert summary['oosDenominator'] == len(oos)
        for row in rows:
            assert len(row['rankings'][method]) <= 10
            assert len(set(row['rankings'][method])) == len(row['rankings'][method])
receipt = json.loads((results / 'package-receipt.json').read_text())
assert len(receipt['files']) == receipt['regularFilesVerifiedAgainstInstalled'] == 280
assert sum(item['bytes'] for item in receipt['files']) == receipt['regularFileBytes']
print(json.dumps({'accepted': True, 'frozenLocalFilesVerified': len(manifest['files']) - 1, 'processReceipts': len(runs), 'publicRankingRows': len(rows), 'coordinateComparisonsPerProcess': 628 * 256, 'matchedCliCalls': 36, 'archiveFileReceipts': len(receipt['files']), 'boundary': 'Saved-evidence integrity, not independent relabeling or validation of every evaluation assumption.'}))

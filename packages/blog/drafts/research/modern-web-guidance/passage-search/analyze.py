"""Summarize the fixed comparison; raw source text and full rank lists stay local."""
import hashlib
import json
import math
import random
import statistics
import struct
import sys
from pathlib import Path

root = Path(__file__).resolve().parent
runtime = Path(sys.argv[1])
destination = root / 'results'
destination.mkdir(exist_ok=True)
digest = lambda data: hashlib.sha256(data).hexdigest()
load = lambda path: json.loads(path.read_text())
save = lambda name, value: (destination / name).write_text(json.dumps(value, indent=2) + '\n')
freeze = load(root / 'input-freeze.json')
for name, expected in freeze['files'].items():
    assert digest((root / name).read_bytes()) == expected['sha256'], name
assert digest((runtime / 'corpus-v2.json').read_bytes()) == freeze['corpusSha256']
assert digest((runtime / 'passages.json').read_bytes()) == freeze['passageFileSha256']
questions = load(root / 'queries.json')['queries']
build = load(runtime / 'index-01/index-receipt.json')
raw_vectors = (runtime / 'index-01/document-vectors.f32').read_bytes()
assert digest(raw_vectors) == build['vectorSha256']
assert len(raw_vectors) == 866 * 384 * 4
vectors = struct.unpack('<' + 'f' * (len(raw_vectors) // 4), raw_vectors)
norms = [math.sqrt(sum(v * v for v in vectors[i:i+384])) for i in range(0, len(vectors), 384)]
assert all(abs(norm - 1) < 1e-4 for norm in norms)
methods = ['keyword', 'semantic', 'hybrid']
metrics = ['knownAnswerAt1', 'knownAnswerAt3', 'knownAnswerAt5', 'knownAnswerAt10', 'reciprocalRankThrough10', 'targetArticleAmongTop3Passages']
runs = []
all_timings = []
for number in range(1, 4):
    path = runtime / f'evaluation-{number:02}.json'
    run = load(path)
    assert run['passageFileSha256'] == freeze['passageFileSha256']
    assert run['vectorFileSha256'] == build['vectorSha256']
    assert run['queryFileSha256'] == freeze['files']['queries.json']['sha256']
    assert len(run['results']) == 44
    assert {r['id'] for r in run['results']} == {q['id'] for q in questions}
    for result in run['results']:
        question = next(q for q in questions if q['id'] == result['id'])
        assert result['knownPassages'] == question['knownPassages']
        for method in methods:
            ranks = result['fullRankings'][method]
            assert len(ranks) == len(set(ranks))
            assert [r['id'] for r in result['methods'][method]['returned']] == ranks[:10]
            rank = next((i + 1 for i, value in enumerate(ranks[:10]) if value in result['knownPassages']), None)
            assert result['methods'][method]['targetRankThrough10'] == rank
            for k in [1, 3, 5, 10]:
                assert result['methods'][method][f'knownAnswerAt{k}'] == (rank is not None and rank <= k)
    # Reconstruct the frozen LCG shuffle to remove only the first query from warm timing.
    order = [q['id'] for q in questions]
    state = run['seed']
    for i in range(len(order)-1, 0, -1):
        state = (1664525 * state + 1013904223) & 0xffffffff
        j = int((state / 2**32) * (i+1))
        order[i], order[j] = order[j], order[i]
    for result in run['results']:
        if result['id'] != order[0]:
            timing = result['timing']
            all_timings.append({**timing, 'semanticQueryTotalMs': timing['queryEncodingMs'] + timing['denseScanMs'], 'hybridQueryTotalMs': sum(timing.values())})
    ranking_digest = digest(json.dumps([(r['id'], r['fullRankings']) for r in run['results']], sort_keys=True).encode())
    summaries = {}
    for stratum in ['all-answerable', 'short', 'question']:
        cases = [r for r in run['results'] if r['article'] and (stratum == 'all-answerable' or r['stratum'] == stratum)]
        summaries[stratum] = {'n': len(cases), **{method: {metric: sum(r['methods'][method][metric] for r in cases) for metric in metrics} for method in methods}}
    normalized = {key: value for key, value in run.items() if key != 'results'}
    normalized.update({'rawReceiptSha256': digest(path.read_bytes()), 'fullRankingDigest': ranking_digest, 'firstQuery': order[0], 'metrics': summaries,
        'results': [{key: value for key, value in row.items() if key != 'fullRankings'} for row in run['results']]})
    save(f'run-{number:02}.json', normalized)
    runs.append(normalized)

primary = [row for row in runs[0]['results'] if row['article']]
comparisons = {}
for candidate in ['semantic', 'hybrid']:
    wins = [r['id'] for r in primary if r['methods'][candidate]['knownAnswerAt3'] and not r['methods']['keyword']['knownAnswerAt3']]
    losses = [r['id'] for r in primary if not r['methods'][candidate]['knownAnswerAt3'] and r['methods']['keyword']['knownAnswerAt3']]
    clusters = []
    for article in sorted({r['article'] for r in primary}):
        rows = [r for r in primary if r['article'] == article]
        assert len(rows) == 2
        clusters.append(sum(int(r['methods'][candidate]['knownAnswerAt3']) - int(r['methods']['keyword']['knownAnswerAt3']) for r in rows) / 2)
    rng = random.Random(202611140)
    samples = sorted(statistics.mean(rng.choices(clusters, k=18)) for _ in range(10000))
    comparisons[candidate + '-vs-keyword'] = {'wins': wins, 'losses': losses, 'ties': 36-len(wins)-len(losses), 'difference': statistics.mean(clusters), 'descriptiveClusterBootstrap95': [samples[249], samples[9749]], 'clusters': 18, 'resamples': 10000, 'seed': 202611140}

def timing_summary(values):
    ordered = sorted(values)
    return {'n': len(values), 'medianMs': statistics.median(values), 'p95NearestRankMs': ordered[math.ceil(.95 * len(values))-1], 'minMs': ordered[0], 'maxMs': ordered[-1]}

negative = [r for r in runs[0]['results'] if r['article'] is None]
summary = {'inputFreezeCommit': 'ebdc9f38', 'primaryProcess': 1, 'model': freeze['model'], 'build': build,
    'modelAssetBytes': sum(row['bytes'] for row in freeze['modelFiles'].values()),
    'vectorNormRange': [min(norms), max(norms)], 'counts': freeze['counts'],
    'metrics': runs[0]['metrics'], 'perProcessMetrics': [r['metrics']['all-answerable'] for r in runs],
    'fullRankingDigests': [r['fullRankingDigest'] for r in runs], 'identicalFullRankingsAcrossProcesses': len({r['fullRankingDigest'] for r in runs}) == 1,
    'comparisonsAt3': comparisons, 'warmTimings': {key: timing_summary([r[key] for r in all_timings]) for key in all_timings[0]},
    'modelInitMs': [r['modelInitMs'] for r in runs], 'searchIndexInitMs': [r['searchIndexInitMs'] for r in runs],
    'expectedNoAnswer': {'n': 8, 'returnedNonempty': {method: sum(bool(r['methods'][method]['returned']) for r in negative) for method in methods}, 'topScoreRanges': {method: [min(r['methods'][method]['returned'][0]['score'] for r in negative if r['methods'][method]['returned']), max(r['methods'][method]['returned'][0]['score'] for r in negative if r['methods'][method]['returned'])] for method in methods}},
    'limitations': ['Source-aware agent-authored queries and incomplete known-answer labels, not visitor logs or independent human judgments.', 'Only 36 distinct answerable questions in 18 source-article groups; process repetition is not a larger relevance sample.', 'This local E5 transformer experiment is separate from MWG; no matching Gemini article index was generated.', 'No calibrated no-answer threshold; returned scores are not relevance probabilities.', 'CPU timings include uncontrolled concurrent machine load and exclude model download and browser/network overhead.']}
save('summary.json', summary)
print(json.dumps({key: summary[key] for key in ['counts', 'metrics', 'comparisonsAt3', 'warmTimings', 'modelAssetBytes', 'modelInitMs', 'expectedNoAnswer', 'identicalFullRankingsAcrossProcesses']}, indent=2))
print('\nKnown-answer passage rank through ten (— = no labeled passage):')
for row in primary:
    ranks = ' / '.join(str(row['methods'][m]['targetRankThrough10'] or '—') for m in methods)
    print(row['id'], ranks, row['query'])

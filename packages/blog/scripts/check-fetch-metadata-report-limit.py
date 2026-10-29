"""Check captured synthetic report SQL at the documented 32-argument limit."""
import datetime
import hashlib
import json
from pathlib import Path
import sqlite3
import sys

input_path, native_path, output_path = map(Path, sys.argv[1:4])
data = input_path.read_bytes()
fixture = json.loads(data)
native = json.loads(native_path.read_bytes())
assert hashlib.sha256(data).hexdigest() == native['inputSha256']
results = []
for trial in fixture['trials']:
    db = sqlite3.connect(':memory:', cached_statements=0)
    try:
        db.row_factory = sqlite3.Row
        db.executescript(fixture['schema'])
        if not trial['label'].startswith('empty-'):
            for row in fixture['inputs']:
                columns = ','.join(row)
                slots = ','.join('?' for _ in row)
                db.execute(f'INSERT INTO page_observations({columns})VALUES({slots})', list(row.values()))
        initial_limit = db.getlimit(sqlite3.SQLITE_LIMIT_FUNCTION_ARG)
        db.setlimit(sqlite3.SQLITE_LIMIT_FUNCTION_ARG, 32)
        assert db.getlimit(sqlite3.SQLITE_LIMIT_FUNCTION_ARG) == 32
        actual = [dict(row) for row in db.execute(trial['candidateSql'], trial['values'])]
        assert actual == trial['expectedRows'], trial['label']
        results.append({'label': trial['label'], 'functionArguments': 32, 'rawOutputMatchesNative': True})
    finally:
        db.close()
receipt = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'sqliteVersion': sqlite3.sqlite_version, 'pythonVersion': sys.version.split()[0],
           'statementCacheDisabled': True, 'initialFunctionArgumentLimit': initial_limit,
           'comparisons': len(results), 'results': results,
           'inputSha256': hashlib.sha256(data).hexdigest(),
           'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           'productionQueries': 0, 'humanLabels': 0,
           'limits': ['Configured SQLite contract model, not live D1 enforcement or cost.']}
with output_path.open('x') as stream:
    json.dump(receipt, stream, indent=2)
    stream.write('\n')
output_path.chmod(0o600)
print(json.dumps({'comparisons': len(results), 'functionArguments': 32, 'rawOutputMatchesNative': True}))

"""Exercise captured native report statements with SQLite's function cap set to 32.

This models the documented D1 contract, not production enforcement or D1 cost.
All input rows are synthetic fixtures produced by check-report-json-contract.mjs.
"""
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
assert hashlib.sha256(data).hexdigest() == native["inputSha256"]
results = []
for trial in fixture["trials"]:
    db = sqlite3.connect(":memory:", cached_statements=0)
    try:
        db.row_factory = sqlite3.Row
        db.executescript(fixture["schema"])
        if trial["fixtureRows"]:
            db.executemany(fixture["insertSql"], fixture["inserts"])
        initial_limit = db.getlimit(sqlite3.SQLITE_LIMIT_FUNCTION_ARG)
        db.setlimit(sqlite3.SQLITE_LIMIT_FUNCTION_ARG, 32)
        assert db.getlimit(sqlite3.SQLITE_LIMIT_FUNCTION_ARG) == 32
        # Reparse every statement: cached_statements=0 prevents prior preparation
        # under a higher limit from invalidating this control.
        try:
            db.execute(trial["baselineSql"], trial["values"]).fetchall()
        except sqlite3.OperationalError as error:
            assert "too many arguments on function json_object" in str(error)
        else:
            raise AssertionError("Baseline unexpectedly passed the 32-argument cap")
        actual = [dict(row) for row in db.execute(trial["candidateSql"], trial["values"])]
        assert actual == trial["expectedRows"], trial["label"]
        db.setlimit(sqlite3.SQLITE_LIMIT_FUNCTION_ARG, initial_limit)
        before = [dict(row) for row in db.execute(trial["baselineSql"], trial["values"])]
        assert before == actual
        results.append({"label": trial["label"], "enforcedFunctionArguments": 32,
                        "baselineRejectedAt32": True, "candidateMatchesNativeAt32": True,
                        "baselineMatchesWhenLimitRestored": True})
    finally:
        db.close()

receipt = {"checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
           "sqliteVersion": sqlite3.sqlite_version, "pythonVersion": sys.version.split()[0],
           "statementCacheDisabled": True, "initialFunctionArgumentLimit": initial_limit,
           "comparisons": len(results), "results": results,
           "inputSha256": hashlib.sha256(data).hexdigest(),
           "nativeReceiptSha256": hashlib.sha256(native_path.read_bytes()).hexdigest(),
           "scriptSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           "productionQueries": 0, "humanLabels": 0,
           "limits": ["Configured SQLite contract model; not a reproduction of current D1 enforcement.",
                      "No production cost or latency claim."]}
with output_path.open("x") as stream:
    json.dump(receipt, stream, indent=2)
    stream.write("\n")
output_path.chmod(0o600)
print(json.dumps({"comparisons": len(results), "enforcedFunctionArguments": 32,
                  "baselineRejectedAt32": True, "candidateMatchesNativeAt32": True}))

"""Run a reversible column type migration through the released pgroll CLI.

Usage: python3 type_rollback_trial.py PGROLL_BINARY FRESH_OUTPUT
Use a disposable Linux guest with initdb, pg_ctl, and psql on PATH.
"""
from hashlib import file_digest
import json
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlencode


def main():
    binary, output = (Path(arg).resolve() for arg in sys.argv[1:])
    output.mkdir(mode=0o700)
    sockets = output / "socket"
    sockets.mkdir(mode=0o700)
    cluster = output / "database"
    user = "radar_fixture"
    url = "postgresql:///" + "postgres?" + urlencode({
        "host": str(sockets), "user": user, "dbname": "postgres", "sslmode": "disable",
    })
    records = {}
    report = {"observations": records, "passed": False}
    with binary.open("rb") as executable:
        report["binary_sha256"] = file_digest(executable, "sha256").hexdigest()

    def execute(*args):
        proc = subprocess.run(args, cwd=output, text=True, timeout=40, capture_output=True)
        if proc.returncode:
            raise RuntimeError(f"{Path(args[0]).name} exited {proc.returncode}: {proc.stderr.strip()}")
        return proc.stdout.strip()

    def migrate(*args):
        return execute(str(binary), "--postgres-url", url, *args)

    def sql(statement):
        text = execute("psql", "-XAt", "-v", "ON_ERROR_STOP=1", "-h", str(sockets),
                       "-U", user, "-d", "postgres", "-c", statement)
        return text.splitlines() if text else []

    def rows(schema):
        return sql(f"select id, pg_typeof(quantity), quantity from {schema}.inventory order by id")

    def exists(schema):
        return sql(f"select exists(select 1 from pg_namespace where nspname='{schema}')") == ["t"]

    def save(name, operation):
        path = output / f"{name}.json"
        path.write_text(json.dumps({"operations": [operation]}, indent=2))
        return str(path)

    report["postgresql"] = execute("psql", "--version")
    report["pgroll"] = execute(str(binary), "--version")
    execute("initdb", "-D", str(cluster), "-U", user, "--auth=trust", "--no-locale")
    execute("pg_ctl", "-D", str(cluster), "-l", str(output / "postgres.log"),
            "-o", f"-h '' -k {sockets}", "-w", "start")
    try:
        migrate("init")
        original = save("v1", {"create_table": {"name": "inventory", "columns": [
            {"name": "id", "type": "integer", "pk": True},
            {"name": "quantity", "type": "text", "nullable": False},
        ]}})
        migrate("start", original)
        migrate("complete")
        sql("set search_path to public_v1; insert into inventory values (1, '007')")
        assert rows("public_v1") == ["1|text|007"]
        records["before"] = rows("public_v1")

        change = {"alter_column": {"table": "inventory", "column": "quantity", "type": "integer",
                                    "up": "quantity::integer", "down": "quantity::text"}}
        migrate("start", save("v2", change))
        assert rows("public_v1") == ["1|text|007"]
        assert rows("public_v2") == ["1|integer|7"]
        records["after_backfill"] = {"old": rows("public_v1"), "new": rows("public_v2")}

        try:
            sql("insert into public_v2.inventory values (3, 11)")
        except RuntimeError as error:
            assert "violates not-null constraint" in str(error), error
            records["qualified_insert_with_default_search_path"] = "old column's NOT NULL check rejected the write"
        else:
            raise AssertionError("qualified view alone unexpectedly routed the typed write")
        sql("set search_path to public_v1; insert into inventory values (2, '009')")
        sql("set search_path to public_v2; insert into inventory values (3, 11)")
        sql("set search_path to public_v2; update inventory set quantity = 8 where id = 1")
        sql("set search_path to public_v2; update inventory set quantity = 7 where id = 1")
        old_now = ["1|text|7", "2|text|009", "3|text|11"]
        new_now = ["1|integer|7", "2|integer|9", "3|integer|11"]
        assert rows("public_v1") == old_now
        assert rows("public_v2") == new_now
        records["after_writes"] = {"old": rows("public_v1"), "new": rows("public_v2")}

        migrate("rollback")
        assert not exists("public_v2")
        assert rows("public_v1") == old_now
        records["after_rollback"] = {"old": rows("public_v1"), "new_schema_exists": False}

        migrate("start", save("v2_final", change))
        migrate("complete")
        assert not exists("public_v1")
        assert rows("public_v2_final") == new_now
        records["after_complete"] = {"new": rows("public_v2_final"), "old_schema_exists": False}
        report["passed"] = True
    finally:
        execute("pg_ctl", "-D", str(cluster), "-w", "stop", "-m", "fast")
        receipt = json.dumps(report, indent=2) + "\n"
        (output / "results.json").write_text(receipt)
        print(receipt, end="")


if __name__ == "__main__":
    main()

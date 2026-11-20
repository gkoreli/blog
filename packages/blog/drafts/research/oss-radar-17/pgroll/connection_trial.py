"""Compare schema selection on one reused PostgreSQL connection in pgroll.

Use: python3 pgroll_connection_trial.py PGROLL_BINARY FRESH_OUTPUT
Run as an unprivileged guest user with initdb, pg_ctl and psql on PATH.
"""

from hashlib import file_digest
import json
from pathlib import Path
import shlex
import subprocess
import sys
from urllib.parse import urlencode


SESSION = r"""
SET search_path TO public_v1;
INSERT INTO inventory VALUES (1, '007');
SELECT 'configured-old', current_setting('search_path'), pg_typeof(quantity), quantity, pg_backend_pid() FROM inventory;
\! START_CHANGE
BEGIN;
SET LOCAL search_path TO public_v2;
INSERT INTO inventory VALUES (2, 11);
SELECT 'new-transaction', current_setting('search_path'), pg_typeof(quantity), quantity, pg_backend_pid() FROM inventory WHERE id = 2;
COMMIT;
SELECT 'after-commit', current_setting('search_path'), pg_typeof(quantity), quantity, pg_backend_pid() FROM inventory WHERE id = 2;
BEGIN;
SET LOCAL search_path TO public_v2;
INSERT INTO inventory VALUES (3, 13);
ROLLBACK;
SELECT 'after-transaction-rollback', current_setting('search_path'), count(*), pg_backend_pid() FROM inventory WHERE id = 3;

SET search_path TO public_v2, public;
SELECT 'multi-schema-read', current_setting('search_path'), current_schema(), pg_typeof(quantity), quantity, pg_backend_pid() FROM inventory WHERE id = 2;
\set ON_ERROR_STOP off
INSERT INTO inventory VALUES (4, 17);
\echo multi-schema-write :SQLSTATE
\set ON_ERROR_STOP on
SET search_path TO public_v2;
BEGIN;
INSERT INTO inventory VALUES (4, 17);
COMMIT;
SELECT 'session-after-commit', current_setting('search_path'), pg_typeof(quantity), quantity, pg_backend_pid() FROM inventory WHERE id = 4;

\! ROLLBACK_CHANGE
SELECT 'stale-session', current_setting('search_path'), coalesce(current_schema(), '(none)'), pg_backend_pid();
\set ON_ERROR_STOP off
SELECT id FROM inventory;
\echo stale-session-read :SQLSTATE
\set ON_ERROR_STOP on
SET search_path TO public_v1;
SELECT 'after-reselecting-old', id, pg_typeof(quantity), quantity, pg_backend_pid() FROM inventory ORDER BY id;
"""


def main():
    binary, output = (Path(arg).resolve() for arg in sys.argv[1:])
    output.mkdir(mode=0o700)
    sockets = output / 'socket'
    sockets.mkdir(mode=0o700)
    cluster = output / 'database'
    user = 'radar_fixture'
    url = 'postgresql:///postgres?' + urlencode({'host': str(sockets), 'user': user,
                                                'dbname': 'postgres', 'sslmode': 'disable'})
    pgroll = [str(binary), '--postgres-url', url]

    def run(*argv, input=None):
        process = subprocess.run(argv, cwd=output, input=input, capture_output=True,
                                 text=True, timeout=50)
        if process.returncode:
            raise RuntimeError(f'{argv[0]} exited {process.returncode}: {process.stderr[:2200]}')
        return process

    def migration_file(name, operation):
        path = output / f'{name}.json'
        path.write_text(json.dumps({'operations': [operation]}))
        return str(path)

    with binary.open('rb') as executable:
        sha = file_digest(executable, 'sha256').hexdigest()
    report = {'binary_sha256': sha, 'pgroll': run(str(binary), '--version').stdout.strip(),
              'postgresql': run('psql', '--version').stdout.strip()}
    run('initdb', '-D', str(cluster), '-U', user, '--auth=trust', '--no-locale', '--encoding=UTF8')
    run('pg_ctl', '-D', str(cluster), '-l', str(output / 'postgres.log'), '-o',
        f"-h '' -k {shlex.quote(str(sockets))}", '-w', 'start')
    try:
        run(*pgroll, 'init')
        first = migration_file('v1', {'create_table': {'name': 'inventory', 'columns': [
            {'name': 'id', 'type': 'integer', 'pk': True},
            {'name': 'quantity', 'type': 'text', 'nullable': False},
        ]}})
        run(*pgroll, 'start', first)
        run(*pgroll, 'complete')
        change = migration_file('v2', {'alter_column': {
            'table': 'inventory', 'column': 'quantity', 'type': 'integer',
            'up': 'quantity::integer', 'down': 'quantity::text',
        }})
        # The Alpine psql launcher exports PGSYSCONFDIR. The released pgroll
        # uses lib/pq, which rejects that setting even with a complete URL.
        nested_pgroll = ['env', '-i', 'PATH=/usr/bin:/bin', *pgroll]
        session = SESSION.replace('START_CHANGE', shlex.join([*nested_pgroll, 'start', change]))
        session = session.replace('ROLLBACK_CHANGE', shlex.join([*nested_pgroll, 'rollback']))
        connection = run('psql', '-XqAt', '-F', '\t', '-v', 'ON_ERROR_STOP=1', '-h', str(sockets),
                         '-U', user, '-d', 'postgres', input=session)
        (output / 'session.log').write_text(connection.stdout + connection.stderr)
        events = {}
        pids = set()
        statuses = {}
        for line in connection.stdout.splitlines():
            fields = line.split('\t')
            if len(fields) > 1 and fields[-1].isdigit():
                events.setdefault(fields[0], []).append(fields[1:-1])
                pids.add(fields[-1])
            if line.startswith(('multi-schema-write ', 'stale-session-read ')):
                label, status = line.split()
                statuses[label] = status

        assert len(pids) == 1, pids
        assert events['configured-old'] == [['public_v1', 'text', '007']]
        assert events['new-transaction'] == [['public_v2', 'integer', '11']]
        assert events['after-commit'] == [['public_v1', 'text', '11']]
        assert events['after-transaction-rollback'] == [['public_v1', '0']]
        assert events['multi-schema-read'] == [['public_v2, public', 'public_v2', 'integer', '11']]
        assert events['session-after-commit'] == [['public_v2', 'integer', '17']]
        assert events['stale-session'] == [['public_v2', '(none)']]
        assert events['after-reselecting-old'] == [['1', 'text', '007'], ['2', 'text', '11'], ['4', 'text', '17']]
        assert statuses == {'multi-schema-write': '23502', 'stale-session-read': '42P01'}, statuses
        report.update({'backend_count': len(pids), 'events': events, 'sqlstate': statuses})
    finally:
        run('pg_ctl', '-D', str(cluster), '-w', 'stop', '-m', 'fast')
    (output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()

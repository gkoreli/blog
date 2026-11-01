#!/usr/bin/env python3
"""Compute the expected contract independently of the JS database/framework."""
import json
import argparse
import sqlite3
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--database', type=Path, required=True)
args = parser.parse_args()
if args.database.exists():
    parser.error('Use a new database path to preserve earlier inputs')
with sqlite3.connect(args.database) as db:
    db.executescript('''
      CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT, bio TEXT);
      CREATE TABLE orders(id INTEGER PRIMARY KEY, user_id INTEGER, cents INTEGER);
      CREATE INDEX orders_user ON orders(user_id);
      CREATE TABLE settings(user_id INTEGER PRIMARY KEY, theme TEXT);
    ''')
    for id in range(1, 1001):
        db.execute('INSERT INTO users VALUES (?, ?, ?)', (id, f'user-{id}', 'x' * 1800))
        db.execute('INSERT INTO settings VALUES (?, ?)', (id, 'light' if id % 2 else 'dark'))
        for j in range(8):
            db.execute('INSERT INTO orders VALUES (?, ?, ?)', (id * 10 + j, id, 100 + j * 17))
    assert db.execute('SELECT COUNT(*) FROM orders').fetchone()[0] == 8000

value = {
    'user': {'id': 42, 'name': 'user-42', 'bio': 'x' * 1800},
    'orders': [{'id': 420 + j, 'cents': 100 + j * 17} for j in range(8)],
    'summary': {'count': 8, 'cents': sum(100 + j * 17 for j in range(8))},
    'settings': {'theme': 'dark'}, 'padding': 'p' * 100,
}
headers = {'Authorization': 'Bearer local-test-token'}
cases = {
    'ready': {'name': 'health', 'path': '/health', 'expected_json': {'ready': True}},
    'cases': [
        {'name': 'dashboard', 'path': '/dashboard/42', 'headers': headers, 'expected_json': value},
        {'name': 'unauthorized', 'path': '/dashboard/42', 'expected_status': 401,
         'expected_json': {'error': 'unauthorized'}, 'measure': False},
        {'name': 'invalid', 'path': '/dashboard/no', 'headers': headers, 'expected_status': 400,
         'expected_json': {'error': 'invalid-id'}, 'measure': False},
        {'name': 'missing', 'path': '/dashboard/1001', 'headers': headers, 'expected_status': 404,
         'expected_json': {'error': 'missing-user'}, 'measure': False},
    ],
}
Path(__file__).with_name('cases.json').write_text(json.dumps(cases, indent=2) + '\n')
print('expected response bytes:', len(json.dumps(value, separators=(',', ':')).encode()))

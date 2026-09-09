"""Controlled HTTP requests, excluded from public analytics. No mail is sent.

The bootstrap request carries a unique subdomain of an already excluded referral
suffix. Its stored daily ID is enrolled in owner_clients without exporting the
ID, then reused for the actual cases. This needs existing Cloudflare D1 access;
it does not retrieve, change, or require the site's ADMIN_SECRET.
"""
import argparse
import datetime
import http.client
import json
from pathlib import Path
import re
import time
import urllib.request
import uuid

ARTICLE = '/how-i-separate-readers-from-bots-without-javascript'
NEXT = '/filter-referrer-spam-without-deleting-analytics-history'
BOOTSTRAP = '/design-language'
UA = 'curl/8.19.0 gkoreli-referrer-acceptance'
MARK_SQL = """INSERT INTO owner_clients (daily_client_id, utc_date)
SELECT MIN(daily_client_id), date(MIN(observed_at)) FROM page_observations
WHERE path = ? AND referrer_host = ? AND observed_at >= ? AND observed_at < ?
HAVING COUNT(*) = 1 AND COUNT(DISTINCT daily_client_id) = 1
ON CONFLICT(daily_client_id) DO NOTHING"""
RESULT_SQL = """SELECT path, referrer_state, internal_referrer_path,
CASE WHEN path = ? THEN 'bootstrap-excluded' ELSE referrer_host END AS referrer_host,
reader_kind, COUNT(*) AS observations,
SUM(CASE WHEN is_owner = 0 AND NOT EXISTS (
  SELECT 1 FROM owner_clients o WHERE o.daily_client_id = p.daily_client_id
) THEN 1 ELSE 0 END) AS public_eligible
FROM page_observations p
WHERE observed_at >= ? AND observed_at < ? AND daily_client_id IN (
  SELECT daily_client_id FROM page_observations
  WHERE path = ? AND referrer_host = ? AND observed_at >= ? AND observed_at < ?
)
GROUP BY path, referrer_state, internal_referrer_path, referrer_host, reader_kind
ORDER BY path, referrer_state, internal_referrer_path"""
CASES = [
    ('external', ARTICLE, 'https://news.ycombinator.com/item?id=synthetic#test'),
    ('internal-article', NEXT, 'https://gkoreli.com' + ARTICLE + '?synthetic=1#test'),
    ('internal-fixed-page', ARTICLE, 'https://gkoreli.com/engineering?synthetic=1'),
    ('internal-unrecognized', ARTICLE, 'https://gkoreli.com/api/confirm/synthetic-only?token=synthetic'),
    ('absent', ARTICLE, None),
    ('unusable', ARTICLE, 'not-a-url'),
    ('same-page', ARTICLE, 'https://gkoreli.com' + ARTICLE),
    ('internal-article-repeated', NEXT, 'https://gkoreli.com' + ARTICLE),
]


def verify_capture(rows):
    assert sum(row['observations'] for row in rows) == len(CASES) + 1, 'Missing or additional test observations'
    assert sum(row['public_eligible'] for row in rows) == 0, 'Test observation was not owner-excluded'
    assert all(row['reader_kind'] == 'other-bot' for row in rows), 'Unexpected test classification'
    expected = {
        (BOOTSTRAP, 'external', None, 'bootstrap-excluded'): 1,
        (NEXT, 'internal', ARTICLE, None): 2,
        (ARTICLE, 'external', None, 'news.ycombinator.com'): 1,
        (ARTICLE, 'internal', '/engineering', None): 1,
        (ARTICLE, 'internal', None, None): 1,
        (ARTICLE, 'absent', None, None): 1,
        (ARTICLE, 'unusable', None, None): 1,
        (ARTICLE, 'internal', ARTICLE, None): 1,
    }
    actual = {(row['path'], row['referrer_state'], row['internal_referrer_path'], row['referrer_host']): row['observations'] for row in rows}
    assert actual == expected, 'Captured referrer evidence differs from the declared cases'


def now():
    return datetime.datetime.now(datetime.timezone.utc)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--account')
    parser.add_argument('--database')
    parser.add_argument('--capture-dir', type=Path)
    args = parser.parse_args()
    if not args.execute:
        print('Plan: one excluded bootstrap, one owner mark, eight scripted HTML requests, one grouped verification. Does not test human readership or browser header behavior.')
        return
    if not all([args.account, args.database, args.capture_dir]):
        parser.error('--execute requires --account, --database and --capture-dir')

    capture = args.capture_dir
    capture.mkdir(parents=True, mode=0o700, exist_ok=True)
    config = Path.home() / 'Library/Preferences/.wrangler/config/default.toml'
    match = re.search(r'^oauth_token\s*=\s*"([^"]+)"', config.read_text(), re.M)
    if match is None:
        raise RuntimeError('Existing Wrangler OAuth credential unavailable')
    token = match.group(1)
    endpoint = f'https://api.cloudflare.com/client/v4/accounts/{args.account}/d1/database/{args.database}/query'
    receipt = {'startedAt': now().isoformat(), 'operator': 'scripted HTTP client', 'requests': [], 'queries': []}

    def save():
        path = capture / 'controlled-referrer-capture.json'
        path.write_text(json.dumps(receipt, indent=2) + '\n')
        path.chmod(0o600)

    def query(label, sql, params):
        request = urllib.request.Request(endpoint, data=json.dumps({'sql': sql, 'params': params}).encode(),
            headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.load(response)
        if not payload.get('success') or not payload['result'][0].get('success'):
            raise RuntimeError('D1 acceptance statement failed')
        result = payload['result'][0]
        receipt['queries'].append({'label': label, 'sql': sql, 'meta': result['meta'], 'results': result['results']})
        save()
        return result

    connection = http.client.HTTPSConnection('gkoreli.com', timeout=30)

    def get(label, path, referrer):
        headers = {'User-Agent': UA, 'Accept': 'text/html'}
        if referrer is not None:
            headers['Referer'] = referrer
        connection.request('GET', path, headers=headers)
        response = connection.getresponse()
        response.read()
        receipt['requests'].append({'case': label, 'path': path, 'referrer': referrer,
            'status': response.status, 'contentType': response.getheader('Content-Type'),
            'ray': response.getheader('CF-Ray')})
        save()
        if response.status != 200:
            raise RuntimeError('Test page was not served successfully; remaining requests stopped')

    # The reviewed policy must still exclude this suffix before this script runs.
    host = 'gkoreli-test-' + uuid.uuid4().hex + '.0-0.fr'
    start = now().strftime('%Y-%m-%d %H:%M:%S')
    end = (now() + datetime.timedelta(minutes=5)).strftime('%Y-%m-%d %H:%M:%S')
    get('bootstrap-excluded', BOOTSTRAP, 'https://' + host + '/')
    mark_params = [BOOTSTRAP, host, start, end]
    for attempt in range(3):
        time.sleep(0.5)
        mark = query('owner-mark', MARK_SQL, mark_params)
        if mark['meta']['changes'] == 1:
            break
    else:
        raise RuntimeError('Unique bootstrap observation not marked; remaining requests stopped')
    for label, path, referrer in CASES:
        get(label, path, referrer)
    time.sleep(1)
    result = query('capture-verification', RESULT_SQL, [BOOTSTRAP, start, end, *mark_params])
    receipt['finishedAt'] = now().isoformat()
    save()
    rows = result['results']
    verify_capture(rows)
    print(json.dumps({'requests': len(CASES) + 1, 'publicEligible': 0, 'groups': rows}, indent=2))
    connection.close()


if __name__ == '__main__':
    main()

import json, subprocess, sys, re, urllib.request, datetime as dt
tok = re.search(r'^oauth_token\s*=\s*"([^"]+)"', open(__import__('os').path.expanduser('~/Library/Preferences/.wrangler/config/default.toml')).read(), re.M).group(1)
ZONE = 'b7268aa0a168505171117690e2921f2a'
def gql(q):
    req = urllib.request.Request('https://api.cloudflare.com/client/v4/graphql', data=json.dumps({'query': q}).encode(), headers={'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))
days = ['2026-08-26','2026-08-27','2026-08-28','2026-08-29','2026-08-30','2026-08-31','2026-09-01','2026-09-02','2026-09-03']
rows = []; errs = {}
for d in days:
    nxt = (dt.date.fromisoformat(d) + dt.timedelta(days=1)).isoformat()
    q = '{ viewer { zones(filter:{zoneTag:"%s"}) { g: httpRequestsAdaptiveGroups(limit:10000, filter:{datetime_geq:"%sT00:00:00Z", datetime_lt:"%sT00:00:00Z", requestSource:"eyeball", edgeResponseContentTypeName:"html", edgeResponseStatus:200, clientRequestHTTPMethodName:"GET"}) { count avg { sampleInterval } dimensions { clientIP clientRequestPath userAgent clientCountryName datetimeHour clientDeviceType } } } } }' % (ZONE, d, nxt)
    r = gql(q)
    if r.get('errors'):
        errs[d] = r['errors'][0]['message'][:140]; continue
    for x in r['data']['viewer']['zones'][0]['g']:
        dm = x['dimensions']
        rows.append({'n': x['count'], 'si': x['avg']['sampleInterval'], 'ip': dm['clientIP'], 'path': dm['clientRequestPath'], 'ua': dm['userAgent'], 'country': dm['clientCountryName'], 'hour': dm['datetimeHour'], 'device': dm['clientDeviceType']})
json.dump({'pulled_at': dt.datetime.utcnow().isoformat() + 'Z', 'errors': errs, 'rows': rows}, open(sys.argv[1], 'w'))
print('errors', errs); print('groups', len(rows), 'requests', sum(r['n'] for r in rows), 'distinct ips', len({r['ip'] for r in rows}))

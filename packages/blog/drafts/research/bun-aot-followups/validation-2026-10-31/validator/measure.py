#!/usr/bin/env python3
"""Run from a prepared validator project; keep executables/raw logs outside Git."""
import argparse, hashlib, json, os, re, statistics, subprocess, time
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--bun', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
parser.add_argument('--runs', type=int, default=12)
args = parser.parse_args()
bun, out, project = args.bun.resolve(), args.out.resolve(), Path.cwd()
out.mkdir(parents=True, exist_ok=True)
assert args.runs % 6 == 0
env = {**os.environ, 'ATA_NO_NATIVE': '1', 'LC_ALL': 'C'}
env.pop('ENGINE', None)
subprocess.run([str(bun), 'generate.mjs'], env=env, check=True)
builds = []
for fixture in ['runtime', 'standalone']:
    for mode, flags in [('jit', []), ('aot', ['--aot']), ('aot-trim', ['--aot', '--trim'])]:
        target = out / f'{fixture}-{mode}'
        cmd = [str(bun), 'build', f'{fixture}-entry.mjs', '--compile', *flags, '--outfile', str(target)]
        start = time.perf_counter()
        result = subprocess.run(cmd, env=env, capture_output=True, timeout=180)
        (out / f'{target.name}.build.log').write_bytes(result.stdout + result.stderr)
        row = dict(name=target.name, flags=flags, exit=result.returncode, seconds=time.perf_counter()-start)
        if result.returncode == 0:
            row.update(bytes=target.stat().st_size, sha256=hashlib.sha256(target.read_bytes()).hexdigest())
        builds.append(row)
(out / 'builds.json').write_text(json.dumps(builds, indent=2)+'\n')
assert all(b['exit'] == 0 for b in builds), 'Inspect preserved build logs'

modes = [
    ('runtime-jit', 'runtime-jit', {}), ('runtime-aot', 'runtime-aot', {}),
    ('runtime-aot-forced-codegen', 'runtime-aot', {'ENGINE': 'auto'}),
    ('runtime-jit-interpreter', 'runtime-jit', {'ENGINE': 'interpreter'}),
    ('standalone-jit', 'standalone-jit', {}), ('standalone-aot', 'standalone-aot', {}),
]
parity = []
for schema in ['simple', 'nested', 'defaults']:
    reference = None
    for name, binary, extra in modes + [('standalone-aot-trim', 'standalone-aot-trim', {}), ('runtime-aot-trim', 'runtime-aot-trim', {})]:
        result = subprocess.run([str(out/binary), '--verify'], env={**env, **extra, 'SCHEMA': schema}, capture_output=True, timeout=20, check=True)
        payload = json.loads(result.stdout)
        expected = ([True, False, False, False, False, True, False, False] if schema == 'defaults' else [True, False, False, False, False, False, False, True]) + [i % 4 != 0 for i in range(32)]
        assert [v['valid'] for v in payload['outputs']] == expected, (schema, name)
        if reference is None: reference = payload['outputs']
        parity.append(dict(schema=schema, mode=name, engine=payload['engine'], outputs=payload['outputs'], matches_runtime_jit=payload['outputs'] == reference))
(out/'parity.json').write_text(json.dumps(parity, indent=2)+'\n')
assert all(p['matches_runtime_jit'] for p in parity if p['schema'] != 'defaults'), 'Non-default schema behavior differs'

def measure(name, binary, extra, schema, traffic, iterations, warmup):
    cmd = ['/usr/bin/time', '-l', str(out/binary)]
    start = time.perf_counter_ns()
    result = subprocess.run(cmd, env={**env, **extra, 'SCHEMA': schema, 'TRAFFIC': traffic, 'ITERATIONS': str(iterations), 'WARMUP': str(warmup)}, capture_output=True, timeout=45)
    elapsed = (time.perf_counter_ns()-start)/1e6
    assert result.returncode == 0, result.stderr.decode()
    payload = json.loads(result.stdout)
    stderr = result.stderr.decode()
    def metric(label):
        match = re.search(r'(\d+)\s+'+re.escape(label), stderr)
        assert match, stderr
        return int(match[1])
    return dict(mode=name, schema=schema, traffic=traffic, elapsed_ms=elapsed, **payload,
                peak_rss_bytes=metric('maximum resident set size'), peak_physical_bytes=metric('peak memory footprint'))

rows = []
for schema, traffic, iterations, warmup in [('simple','cold',0,0), ('simple','valid',2000000,200000), ('simple','mixed',2000000,200000), ('nested','valid',1000000,200000), ('nested','mixed',1000000,200000)]:
    for name, binary, extra in modes:
        for _ in range(2): measure(name,binary,extra,schema,traffic,iterations,warmup)
    for block in range(args.runs):
        order = modes[block % 6:] + modes[:block % 6]
        if (block // 6) % 2: order = list(reversed(order))
        for position, (name,binary,extra) in enumerate(order):
            row = measure(name,binary,extra,schema,traffic,iterations,warmup)
            rows.append(dict(block=block, position=position, **row))
        (out/'observations.json').write_text(json.dumps(rows,indent=2)+'\n')
        print(schema,traffic,block+1,flush=True)
summary = []
for schema, traffic in dict.fromkeys((r['schema'],r['traffic']) for r in rows):
    for name,_,_ in modes:
        group = [r for r in rows if r['schema']==schema and r['traffic']==traffic and r['mode']==name]
        metrics = {key:{'median':statistics.median(r[key] for r in group),'min':min(r[key] for r in group),'max':max(r[key] for r in group)} for key in ['elapsed_ms','hot_ms','first_ms','peak_rss_bytes','peak_physical_bytes']}
        summary.append(dict(schema=schema,traffic=traffic,mode=name,engine=group[0]['engine'],n=len(group),metrics=metrics))
result = dict(bun_revision=subprocess.check_output([str(bun),'--revision'],text=True).strip(), bun_sha256=hashlib.sha256(bun.read_bytes()).hexdigest(), method='Two warmup processes; balanced rotating/reversed six-mode order; warm filesystem; fresh process per observation. hot_ms excludes imports, constructor and warmup; elapsed_ms includes process startup, warmup and exit. time -l reports whole-process lifetime peaks. Native addon disabled.', builds=builds, summary=summary)
(out/'results.json').write_text(json.dumps(result,indent=2)+'\n')
print('DONE',len(rows),flush=True)

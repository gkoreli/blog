#!/usr/bin/env python3
"""Record public inputs/host conditions; run while performance trials are idle."""
import argparse, ctypes, hashlib, json, platform, re, resource, subprocess, time
from datetime import datetime, timezone
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--root',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args();root=a.root.resolve();here=Path(__file__).resolve().parent
assert platform.system()=='Darwin','macOS measurements only'

def text(command):
    r=subprocess.run(command,capture_output=True,text=True)
    return r.stdout.strip() if r.returncode==0 else None
def digest(path):
    return dict(bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())

class Timebase(ctypes.Structure):_fields_=[('numer',ctypes.c_uint32),('denom',ctypes.c_uint32)]
info=Timebase();ctypes.CDLL('/usr/lib/libSystem.B.dylib').mach_timebase_info(ctypes.byref(info))
lib=ctypes.CDLL('/usr/lib/libproc.dylib')
lib.proc_pid_rusage.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_void_p]
lib.proc_pid_rusage.restype=ctypes.c_int
import os
def raw_cpu():
    buffer=ctypes.create_string_buffer(4096)
    assert lib.proc_pid_rusage(os.getpid(),4,buffer)==0
    values=(ctypes.c_uint64*35).from_buffer(buffer,16)
    return values[0]+values[1]
raw0=raw_cpu();r0=resource.getrusage(resource.RUSAGE_SELF);cpu0=r0.ru_utime+r0.ru_stime
stop=time.process_time()+.15
checksum=0
while time.process_time()<stop:
    for value in range(1000):checksum+=value*value
r1=resource.getrusage(resource.RUSAGE_SELF);cpu1=r1.ru_utime+r1.ru_stime;raw1=raw_cpu()
ratio=(cpu1-cpu0)*1e9/(raw1-raw0)
mach_ratio=info.numer/info.denom
use_mach=abs(ratio-mach_ratio)<abs(ratio-1) if mach_ratio!=1 else False
selected=mach_ratio if use_mach else 1
assert abs(ratio/selected-1)<.1,('Unknown CPU-counter scale',ratio,mach_ratio)
clock=dict(unit='mach_absolute_ticks' if use_mach else 'nanoseconds',numer=info.numer if use_mach else 1,denom=info.denom if use_mach else 1,mach_timebase_numer=info.numer,mach_timebase_denom=info.denom,calibration=dict(raw_delta=raw1-raw0,bsd_cpu_seconds=cpu1-cpu0,observed_nanoseconds_per_raw_unit=ratio,checksum=checksum))

bun=root/'compiler/bun-darwin-aarch64/bun'
power=text(['pmset','-g','batt']) or ''
thermal=subprocess.run(['pmset','-g','therm'],capture_output=True,text=True)
thermal_text=thermal.stdout+thermal.stderr
level=re.search(r'(\d+)%',power)
data=dict(captured_at=datetime.now(timezone.utc).isoformat(),compiler=dict(revision=text([str(bun),'--revision']),commit='da867c60bf0bcbf9d6d36994f8ca0efa42075115',zip_sha256=digest(root/'compiler/bun.zip')['sha256'],binary_sha256=digest(bun)['sha256'],asset_id=687869686),platform=platform.platform(),cpu=text(['sysctl','-n','machdep.cpu.brand_string']),model=text(['sysctl','-n','hw.model']),logical_cpus=text(['sysctl','-n','hw.ncpu']),memory_bytes=text(['sysctl','-n','hw.memsize']),power=dict(ac_attached="'AC Power'" in power,battery_percent=int(level[1]) if level else None),thermal_telemetry=dict(available=thermal.returncode==0 and 'Error' not in thermal_text,note='No inference about absence of throttling from unavailable telemetry'),rusage_cpu_clock=clock,sources=dict(ata='8cfedd9e33af092eba91cc615fb7ca98ddc99cb0',frameworks='f654bcd175165bce2e3c83b65eaecd8e34294ffd',api='d58f3d10daa53f8e6c7b085fc3b2b2d9c38b8056'),files={},dependencies={},study_sources={})
for name in ['sources/ata.tar.gz','sources/frameworks.tar.gz','sources/api.tar.gz','sources/postgresql-17.10.tar.bz2','http-load']:
    data['files'][name]=digest(root/name)
for folder in ['validator','framework','sources/api/apps/elysia-api']:
    base=root/folder;deps={}
    for path in [*(base/'node_modules').glob('*/package.json'),*(base/'node_modules').glob('@*/*/package.json')]:
        try:j=json.loads(path.read_text());deps[j['name']]=j['version']
        except (ValueError,KeyError):continue
    data['dependencies'][folder]=deps
    for filename in ['package.json','bun.lock']:data['files'][folder+'/'+filename]=digest(base/filename)
for folder in [here,here/'validator',here/'compat-commonjs',here/'runners']:
    for path in folder.iterdir():
        if path.is_file() and (path.suffix in ['.py','.mjs','.ts','.c','.sh'] or path.name in ['package.json','bun.lock']):data['study_sources'][str(path.relative_to(here))]=digest(path)
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(data,indent=2)+'\n')
print('Saved inputs; CPU counter conversion',clock['numer'],clock['denom'],'ns per raw unit')

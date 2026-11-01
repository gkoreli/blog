#!/usr/bin/env python3
"""Create a deterministic source-only download; include the license, no results."""
import argparse,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);a=p.parse_args();root=Path(__file__).parent
names=['compare.py','http-load.c','README.md','LICENSE','example-server.ts','example-cases.json','selftest.py','package.py']
a.out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(a.out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name in names:
  info=zipfile.ZipInfo('bun-aot-check/'+name,date_time=(2026,10,31,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,(root/name).read_bytes())
print(a.out, a.out.stat().st_size, 'bytes')

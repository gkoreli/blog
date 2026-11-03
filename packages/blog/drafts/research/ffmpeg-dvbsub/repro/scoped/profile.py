"""Profile the little-endian real-fixture dump written by baseline/decode.c."""
import argparse,collections,hashlib,json,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--dump',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();data=a.dump.read_bytes();pos=0;rectangles=uniform=rows=flat=0;dims=collections.Counter()
while pos<len(data):
 w,h=struct.unpack_from('<II',data,pos);pos+=8;assert w>0 and h>0 and pos+w*h+1024<=len(data)
 pixels=data[pos:pos+w*h];pos+=w*h+1024;rectangles+=1;uniform+=len(set(pixels))==1;dims[f'{w}x{h}']+=1
 for y in range(1,h-1):
  row=pixels[y*w:(y+1)*w];above=pixels[(y-1)*w:y*w];below=pixels[(y+1)*w:(y+2)*w]
  rows+=1;flat+=w>2 and len(set(row))==1 and row[1:-1]==above[1:-1]==below[1:-1]
assert pos==len(data)
receipt={'dump_sha256':hashlib.sha256(data).hexdigest(),'rectangles':rectangles,'uniform_rectangles':uniform,'interior_rows':rows,'fully_uniform_neighbourhood_rows':flat,'dimensions':dict(dims)}
a.out.write_text(json.dumps(receipt,indent=2)+'\n');print(receipt)

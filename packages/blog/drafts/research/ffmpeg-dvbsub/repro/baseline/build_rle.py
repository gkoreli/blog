from pathlib import Path
import re
root=Path(__file__).resolve().parent
src=(root/'upstream.c').read_text()
begin=src.index('static int dvbsub_read_2bit_string(')
end=src.index('static void compute_default_clut(')
body=src[begin:end]
pattern=r'(?P<indent> +)while \(run_length-- > 0 && pixels_read < dbuf_len\) \{\n +\*destbuf\+\+ = bits;\n +pixels_read\+\+;\n +\}'
def replacement(m):
    indent=m['indent']
    return indent+'dvbsub_fill_run(&destbuf, &pixels_read, dbuf_len,\n'+indent+'                run_length, bits);'
body,n=re.subn(pattern,replacement,body)
assert n==10,n
helper=(root/'rle.c').read_text()
(root/'rle-variant.c').write_text(src[:begin]+helper+'\n'+body+src[end:])
header='''#include "config.h"
#include "libavcodec/avcodec.h"
#include "libavcodec/get_bits.h"
#include "libavcodec/bytestream.h"
#include "libavutil/log.h"
#include "libavutil/mem.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
'''
old=src[begin:end]
new=helper+'\n'+body
for bits in (2,4,8):
    old=old.replace(f'dvbsub_read_{bits}bit_string',f'original_{bits}bit')
    new=new.replace(f'dvbsub_read_{bits}bit_string',f'candidate_{bits}bit')
(root/'rle-functions.h').write_text(header+old+new)

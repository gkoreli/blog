"""Extract checked functions from the pinned candidate; explicit library shims."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
source=(root/'hardened.c').read_text()
baseline=(root.parent/'baseline/final.c').read_text()
def extract(name):
    pos=source.index(name+'(')
    start=source.rfind('static ',0,pos)
    brace=source.index('{',pos);depth=1;end=brace+1
    while depth:
        depth+=(source[end]=='{')-(source[end]=='}');end+=1
    return source[start:end]+'\n'
parts={n:extract(n) for n in ['dvbsub_fill_run','dvbsub_interior_block','dvbsub_count_boundary_pixel','dvbsub_count_color_boundaries','dvbsub_order_colors']}
notice='/* FFmpeg-derived: LGPL-2.1-or-later; see ../COPYING.LGPLv2.1. */\n'
(root/'extracted.h').write_text(notice+'\n'.join(parts.values()))
for name,part in parts.items():
    assert part in baseline, name
(root/'reduced.h').write_text(notice+'\n'.join(parts.values()).replace('[256]','[3]').replace('< 256','< 3'))
(root/'source-hashes.json').write_text(json.dumps({'candidate_sha256':hashlib.sha256(source.encode()).hexdigest(),'functions':{n:hashlib.sha256(s.encode()).hexdigest() for n,s in parts.items()}},indent=2)+'\n')

# Bind the copy slice to the exact source statements (only local variable renamed).
for statement in ['memcpy(rect->data[1], clut_table, rect->nb_colors * sizeof(*clut_table));',
                  'memcpy(rect->data[1], region->computed_clut, sizeof(region->computed_clut));']:
    assert statement in source and statement in baseline

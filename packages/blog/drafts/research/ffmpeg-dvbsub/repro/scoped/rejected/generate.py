"""Generate the smaller palette-only candidate from the pinned upstream source."""
import argparse,difflib,hashlib,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;base=root.parents[1]/'baseline';out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
old=(base/'upstream.c').read_text();source=old
source=source.replace('    int clut_count2[257][256];','    /** Colour adjacency rows, with outside edges in the last column. */\n    int clut_count2[256][257];')
source=source.replace('int (*counttab2)[256]','int (*counttab2)[257]')
source=source.replace('    memset(ctx->clut_count2, 0 , sizeof(ctx->clut_count2));','''    /* A uniform bitmap selects one colour and writes a zero palette entry. */
    if (w > 0 && h > 0 && stride == w &&
        !memcmp(rect->data[0], rect->data[0] + 1, (size_t)w * h - 1)) {
        AV_WN32(clut + 4 * rect->data[0][0], 0);
        return;
    }''')
needle='            counttab[v-1] += !!((v!=vl) + (v!=vr) + (v!=vt) + (v!=vb));'
replace='''            if (y && y + 1 < h && x && w - x > 16 &&
                !((x - 1) & 15)) {
                const uint8_t *p = &V(x,y);
                /* The shifted comparison proves both horizontal neighbours. */
                if (!memcmp(p - 1, p, 17) &&
                    !memcmp(p, p - stride, 16) &&
                    !memcmp(p, p + stride, 16)) {
                    x += 15;
                    continue;
                }
            }
            /* Interior pixels only add diagonal counts, cleared below. */
            if (!((v != vl) | (v != vr) | (v != vt) | (v != vb)))
                continue;
            if (!counttab[v - 1]++)
                memset(counttab2[v - 1], 0, sizeof(counttab2[v - 1]));'''
assert source.count(needle)==1;source=source.replace(needle,replace)
for n in ['vl','vr','vt','vb']:source=source.replace('counttab2['+n+'][v-1] ++;',f'counttab2[v - 1][{n} ? {n} - 1 : 256]++;')
source=source.replace('counttab2[i+1][i] = 0;','counttab2[i][i] = 0;\n        scoretab[i] = counttab[i] ? counttab2[i][256] : 0;')
source=source.replace('    memcpy(scoretab, counttab2[0], sizeof(scoretab));\n','').replace('counttab2[bestv+1][x]','counttab2[bestv][x]')
# Every decoder path outside this private array and compute function stays exact.
start=old.index('static void compute_default_clut(');end=old.index('\n\nstatic int save_subtitle_set(',start)
new_start=source.index('static void compute_default_clut(');new_end=source.index('\n\nstatic int save_subtitle_set(',new_start)
assert old[end:]==source[new_end:]
assert old[:start].replace('    int clut_count2[257][256];','    /** Colour adjacency rows, with outside edges in the last column. */\n    int clut_count2[256][257];')==source[:new_start]
assert 257*256==256*257
(out/'candidate.c').write_text(source)
patch=''.join(difflib.unified_diff(old.splitlines(True),source.splitlines(True),fromfile='a/libavcodec/dvbsubdec.c',tofile='b/libavcodec/dvbsubdec.c'))
(out/'candidate.patch').write_text(patch)
receipt={'upstream_sha256':hashlib.sha256(old.encode()).hexdigest(),'candidate_sha256':hashlib.sha256(source.encode()).hexdigest(),'patch_sha256':hashlib.sha256(patch.encode()).hexdigest(),'outside_compute_and_private_array_unchanged':True,'scratch_bytes_before':257*256*4,'scratch_bytes_after':256*257*4,'insertions':sum(x.startswith('+') and not x.startswith('+++') for x in patch.splitlines()),'deletions':sum(x.startswith('-') and not x.startswith('---') for x in patch.splitlines())}
(out/'source.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt),flush=True)

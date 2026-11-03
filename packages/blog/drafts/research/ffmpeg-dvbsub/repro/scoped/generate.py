"""Generate one palette-only optimization without changing scratch or score layout."""
import argparse,difflib,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;base=root.parent/'baseline';out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
old=(base/'upstream.c').read_text();source=old
needle='    memset(ctx->clut_count2, 0 , sizeof(ctx->clut_count2));'
fast='''    /* A uniform bitmap selects one colour and writes a zero palette entry. */
    if (w > 0 && h > 0 && stride == w &&
        !memcmp(rect->data[0], rect->data[0] + 1, (size_t)w * h - 1)) {
        AV_WN32(clut + 4 * rect->data[0][0], 0);
        return;
    }

'''
assert source.count(needle)==1;source=source.replace(needle,fast+needle)
needle='            counttab[v-1] += !!((v!=vl) + (v!=vr) + (v!=vt) + (v!=vb));'
replacement='''            /* Interior pixels only add diagonal counts, cleared below. */
            if (!((v != vl) | (v != vr) | (v != vt) | (v != vb))) {
                if (w - x > 16 && !((x - 1) & 15) &&
                    !memcmp(&V(x-1,y), &V(x,y), 17) &&
                    !memcmp(&V(x,y), &V(x,y-1), 16) &&
                    !memcmp(&V(x,y), &V(x,y+1), 16))
                    x += 15;
                continue;
            }
            counttab[v-1]++;'''
assert source.count(needle)==1;source=source.replace(needle,replacement)
start=old.index('static void compute_default_clut(');end=old.index('\n\nstatic int save_subtitle_set(',start)
nstart=source.index('static void compute_default_clut(');nend=source.index('\n\nstatic int save_subtitle_set(',nstart)
assert old[:start]==source[:nstart] and old[end:]==source[nend:]
score_start='    for (i = 0; i<256; i++) {\n        counttab2[i+1][i] = 0;'
assert old[old.index(score_start):end]==source[source.index(score_start):nend]
(out/'candidate.c').write_text(source)
patch=''.join(difflib.unified_diff(old.splitlines(True),source.splitlines(True),fromfile='a/libavcodec/dvbsubdec.c',tofile='b/libavcodec/dvbsubdec.c'));(out/'candidate.patch').write_text(patch)
receipt={'upstream_sha256':hashlib.sha256(old.encode()).hexdigest(),'candidate_sha256':hashlib.sha256(source.encode()).hexdigest(),'patch_sha256':hashlib.sha256(patch.encode()).hexdigest(),'outside_compute_unchanged':True,'scratch_and_score_code_unchanged':True,'insertions':sum(x.startswith('+') and not x.startswith('+++') for x in patch.splitlines()),'deletions':sum(x.startswith('-') and not x.startswith('---') for x in patch.splitlines())}
(out/'source.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt),flush=True)

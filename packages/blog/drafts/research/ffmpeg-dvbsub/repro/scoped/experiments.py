"""Recreate screening variants; these exploratory timings are not acceptance benchmarks."""
import argparse,difflib,hashlib,json,re,statistics,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--baseline',type=Path,required=True);p.add_argument('--repo',type=Path,required=True);p.add_argument('--generate-only',action='store_true');p.add_argument('--stage',choices=['initial','transpose','sparse','division'],required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;b=a.baseline.resolve();repo=a.repo.resolve();out=a.out.resolve();out.mkdir(exist_ok=True,parents=True);up=(root.parent/'baseline/upstream.c').read_text();boundary=(root.parent/'baseline/prior-candidate.c').read_text()
fast='''    /* A uniform bitmap selects one colour and writes a zero palette entry. */
    if (w > 0 && h > 0 && stride == w &&
        !memcmp(rect->data[0], rect->data[0] + 1, (size_t)w * h - 1)) {
        AV_WN32(clut + 4 * rect->data[0][0], 0);
        return;
    }

'''
uniform=boundary.replace('    memset(ctx->clut_count2, 0 , sizeof(ctx->clut_count2));',fast+'    memset(ctx->clut_count2, 0 , sizeof(ctx->clut_count2));')
def rows(s):
 return s.replace('    for (y = 0; y<h; y++) {\n        for (x = 0; x<w; x++) {','''    for (y = 0; y<h; y++) {
        int step = 1;
        /* Uniform interiors contribute only diagonal counts, cleared below. */
        if (w > 2 && y && y + 1 < h &&
            !memcmp(&V(0,y), &V(1,y), w - 1) &&
            !memcmp(&V(1,y), &V(1,y-1), w - 2) &&
            !memcmp(&V(1,y), &V(1,y+1), w - 2))
            step = w - 1;
        for (x = 0; x<w; x += step) {''')
def active(s):
 s=s.replace('    int count, i, x, y;','    uint8_t colors[256];\n    int nb_colors = 0, k;\n    int count, i, x, y;').replace('        counttab2[i+1][i] = 0;','        counttab2[i+1][i] = 0;\n        if (counttab[i])\n            colors[nb_colors++] = i;')
 s=s.replace('        for (x = 0; x < 256; x++) {\n            int scorev = scoretab[x];','        for (k = 0; k < nb_colors; k++) {\n            int scorev;\n            x = colors[k];\n            scorev = scoretab[x];')
 return s.replace('        for (x = 0; x < 256; x++)\n            scoretab[x] += counttab2[bestv+1][x];','        for (k = 0; k < nb_colors; k++) {\n            x = colors[k];\n            scoretab[x] += counttab2[bestv+1][x];\n        }')
def block(n,bounded):
 s=uniform.replace('    for (y = 0; y<h; y++) {','    for (y = 0; y<h; y++) {\n        int misses = 0;' if bounded else '    for (y = 0; y<h; y++) {')
 skip=f'''            if (y && y + 1 < h && x && w - x > {n} &&
                !((x - 1) & {n-1}){ ' && misses < 2' if bounded else ''}) {{
                const uint8_t *p = &V(x,y);
                if (!memcmp(p - 1, p, {n+1}) &&
                    !memcmp(p, p - stride, {n}) &&
                    !memcmp(p, p + stride, {n})) {{
                    x += {n-1};
                    continue;
                }}
{ '                misses++;' if bounded else ''}
            }}
'''
 return s.replace('        for (x = 0; x<w; x++) {\n','        for (x = 0; x<w; x++) {\n'+skip)
def transpose(s):
 s=s.replace('    int clut_count2[257][256];','    /* Colour adjacency rows, with outside edges in the last column. */\n    int clut_count2[256][257];').replace('int (*counttab2)[256]','int (*counttab2)[257]')
 for n in ['vl','vr','vt','vb']:s=s.replace('counttab2['+n+'][v-1] ++;',f'counttab2[v-1][{n} ? {n}-1 : 256] ++;')
 return s.replace('counttab2[i+1][i] = 0;','counttab2[i][i] = 0;\n        scoretab[i] = counttab2[i][256];').replace('    memcpy(scoretab, counttab2[0], sizeof(scoretab));\n','').replace('counttab2[bestv+1][x]','counttab2[bestv][x]')
def sparse(s):return s.replace('    memset(ctx->clut_count2, 0 , sizeof(ctx->clut_count2));\n','').replace('            counttab[v-1]++;','            if (!counttab[v-1]++)\n                memset(counttab2[v-1], 0, sizeof(counttab2[v-1]));').replace('scoretab[i] = counttab2[i][256];','scoretab[i] = counttab[i] ? counttab2[i][256] : 0;')
v={'boundary':boundary,'uniform':uniform,'rows':rows(boundary),'combo':rows(uniform),'active':active(rows(uniform))}
for n in [16,32,64]:v[f'block{n}']=block(n,True)
v['block32-unbounded']=block(32,False)
v['trans']=transpose(boundary);v['trans-uniform']=transpose(uniform)
for n in [16,32,64,128]:v[f'trans-block{n}']=transpose(block(n,False))
for name in ['trans-uniform','trans-block16','trans-block32','trans-block64']:v[name.replace('trans','sparse')]=sparse(v[name])
v['block16-unbounded']=block(16,False)
for name in ['block16-unbounded','sparse-block16','sparse-block32']:v[name+'-prune']=v[name].replace('            if (scorev) {','            if (scorev && 1024LL * scorev >= (bestscore + 1LL) * counttab[x]) {')
stages={'initial':['boundary','uniform','rows','combo','active','block16','block32','block64','block32-unbounded'],'transpose':['trans','trans-uniform','trans-block16','trans-block32','trans-block64','trans-block128'],'sparse':['sparse-uniform','sparse-block16','sparse-block32','sparse-block64'],'division':['sparse-block16','sparse-block16-prune','sparse-block32-prune','block16-unbounded','block16-unbounded-prune']}
names=['upstream','previous',*stages[a.stage]];v['upstream']=up;v['previous']=(root.parent/'formal/hardened.c').read_text();original=(repo/'libavcodec/dvbsubdec.c').read_bytes()
for name in names:
 (out/(name+'.c')).write_text(v[name])
(out/'variant-hashes.json').write_text(json.dumps({n:hashlib.sha256(v[n].encode()).hexdigest() for n in names},indent=2)+'\n')
if a.generate_only:raise SystemExit(0)
try:
 for name in names:
  s=v[name];(out/(name+'.c')).write_text(s);(repo/'libavcodec/dvbsubdec.c').write_text(s)
  for f in ['libavcodec/dvbsubdec.o','libavcodec/libavcodec.a']:(repo/f).unlink(missing_ok=True)
  with (out/('build-'+name+'.log')).open('w') as log:subprocess.run(['make','-j4','libavcodec/libavcodec.a'],cwd=repo,stdout=log,stderr=subprocess.STDOUT,check=True)
  for program,inputfile in [('decode','decode.c'),('packets','packet-test.c')]:
   libs=[repo/'libavcodec/libavcodec.a',repo/'libavutil/libavutil.a']
   if program=='decode':libs.insert(0,repo/'libavformat/libavformat.a')
   subprocess.run(['clang','-O3','-I',str(repo),str(b/inputfile),*[str(x) for x in libs],'-lm','-lpthread','-o',str(out/(program+'-'+name))],check=True)
finally:(repo/'libavcodec/dvbsubdec.c').write_bytes(original)
results=[]
for fixture,prog,inputfile in [('real','decode','dvbsubtest_filter.ts'),('generated','packets','corpus.dvbpackets')]:
 for mode in [-2,-1,0,1]:
  digests=set()
  for name in names:
   target=out/f'{fixture}-{name}-{mode}.bin';subprocess.run([str(out/(prog+'-'+name)),str(b/inputfile),'1',str(mode),str(target)],capture_output=True,check=True);digests.add(hashlib.sha256(target.read_bytes()).hexdigest())
  assert len(digests)==1
 for mode in ([1,-1] if fixture=='real' else [1,-1,0]):
  passes=(100 if mode==1 else 1000) if fixture=='real' else 10;samples={n:[] for n in names}
  for turn in range(3):
   for name in names[turn:]+names[:turn]:
    q=subprocess.run([str(out/(prog+'-'+name)),str(b/inputfile),str(passes),str(mode)],capture_output=True,text=True,check=True);samples[name].append(float(re.search(r'cpu_s=([0-9.]+)',q.stdout)[1]))
  record={'fixture':fixture,'mode':mode,'passes':passes,'rounds':3,'cpu_seconds':samples,'medians':{n:statistics.median(x) for n,x in samples.items()}};results.append(record);print(record['fixture'],mode,record['medians'],flush=True)
(out/'screen.json').write_text(json.dumps(results,indent=2)+'\n')
(out/'variant-hashes.json').write_text(json.dumps({n:hashlib.sha256(v[n].encode()).hexdigest() for n in names},indent=2)+'\n')

from pathlib import Path
root=Path(__file__).resolve().parent
header=(root/'harness-header.h').read_text()
header+='\n#include "libavutil/intreadwrite.h"\n'
parts=[]
for name,path,start in [('original',root/'original.c','static void compute_default_clut('),('current',root/'upstream.c','static void compute_default_clut('),('prior',root/'prior.c','static void compute_default_clut('),('scalar',root/'scalar.c','static av_always_inline void dvbsub_count_boundary_pixel('),('wide',root/'wide.c','/* All five loads')]:
    src=path.read_text(); body=src[src.index(start):src.index('\n\nstatic int save_subtitle_set(')]
    for fn in ('dvbsub_count_color_boundaries','dvbsub_order_colors','dvbsub_interior_block','dvbsub_count_boundary_pixel'):
        body=body.replace(fn,fn+'_'+name)
    body=body.replace('static void compute_default_clut(',f'static __attribute__((noinline)) void {name}(')
    parts.append(body)
(root/'functions.h').write_text(header+'\n'.join(parts))
h=(root/'harness-v1.c').read_text()
h=h.replace('original, current, skip_interior, prune_division, combined, boundary_only','original, current, prior, scalar, wide')
h=h.replace('"original", "current", "skip", "prune", "combined", "boundary"','"original", "current", "prior", "scalar", "wide"')
h=h.replace('j < 6','j < 5').replace('f<6','f<5').replace('double results[6][7]','double results[5][7]')
h=h.replace('memcmp(a.clut_count2, b.clut_count2, sizeof(a.clut_count2))','(j < 3 && memcmp(a.clut_count2, b.clut_count2, sizeof(a.clut_count2)))')
h=h.replace('    const int selected[3]={0,1,5};','    const int selected[4]={1,2,3,4};').replace('k<3','k<4').replace('selected[(k+round)%3]','selected[(k+round)%4]')
h=h.replace('original_us,current_us,boundary_us','upstream_us,prior_us,scalar_us,wide_us')
h=h.replace('    cases++;','''    uint8_t present[256]={0};
    for(int y=0;y<h;y++) for(int x=0;x<w;x++) present[data[y*stride+x]]=1;
    for(int j=3;j<5;j++) {
        fns[j](&b,out,&r,w,h);
        for(int color=0;color<256;color++) if(present[color])
            for(int neighbour=0;neighbour<256;neighbour++)
                if(b.clut_count2[color][neighbour]!=a.clut_count2[neighbour+1][color]) {
                    fprintf(stderr,"Adjacency mismatch case=%" PRIu64 " variant=%s\\n",cases,names[j]);exit(1);
                }
    }
    cases++;''')
h=h.replace('for(int i=0;i<5000;i++)','for(int i=0;i<1000;i++)')
h=h.replace('if (j == 1) continue;','if (j == 1 || (j == 0 && getenv("SKIP_ORIGINAL"))) continue;')
h=h.replace('    printf("PASS %" PRIu64', '''    for(int w=1;w<=40;w++) for(int h=1;h<=7;h++) for(int pad=0;pad<2;pad++) {
        int stride=w+pad*13;
        uint8_t *exact=malloc((size_t)stride*h);
        for(int mode=0;mode<5;mode++) {
            fill(exact,w,h,stride,4,mode);
            verify(exact,w,h,stride);
            verify(exact+(h-1)*stride,w,h,-stride);
        }
        free(exact);
    }
    printf("PASS %" PRIu64''')
(root/'harness.c').write_text(h)

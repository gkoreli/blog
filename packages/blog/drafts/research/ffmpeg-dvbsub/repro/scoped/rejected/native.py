"""Differential palette tests, including poisoned scratch and unusual strides."""
from pathlib import Path
import argparse,subprocess
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--repo',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;base=root.parents[1]/'baseline';out=a.out.resolve();repo=a.repo.resolve();out.mkdir(exist_ok=True,parents=True)
subprocess.run(['python3',str(root/'generate.py'),'--out',str(out)],check=True)
def body(path,name,member):
 s=path.read_text();start=s.index('static void compute_default_clut(');end=s.index('\n\nstatic int save_subtitle_set(',start)
 return s[start:end].replace('compute_default_clut(',name+'(').replace('ctx->clut_count2','ctx->'+member)
header=(base/'harness-header.h').read_text().replace('typedef struct { int clut_count2[257][256]; } DVBSubContext;','typedef union { int old[257][256]; int fresh[256][257]; } DVBSubContext;')
(out/'functions.h').write_text('/* FFmpeg-derived: LGPL-2.1-or-later; see repository reproduction license. */\n'+header+body(base/'upstream.c','current','old')+'\n'+body(out/'candidate.c','candidate','fresh'))
h=(base/'harness-v1.c').read_text();start=h.index('static void verify(');end=h.index('static int compare_double',start)
verify=r'''static void verify(uint8_t *data, int w, int h, int stride) {
    static DVBSubContext a,b;
    uint8_t ref[1024],out[1024],present[256]={0};
    AVSubtitleRect r={.linesize={stride},.data={data}};
    if(!(cases&63))memset(&b,0x5a,sizeof(b));
    for(int i=0;i<1024;i++)ref[i]=out[i]=(i*17+cases)&255;
    current(&a,ref,&r,w,h);candidate(&b,out,&r,w,h);
    if(memcmp(ref,out,1024)){fprintf(stderr,"FAIL palette case=%" PRIu64 " w=%d h=%d stride=%d\n",cases,w,h,stride);exit(1);}
    int uniform=stride==w;
    for(int y=0;y<h;y++)for(int x=0;x<w;x++) {
        present[data[y*stride+x]]=1;
        if(data[y*stride+x]!=data[0])uniform=0;
    }
    if(!uniform)for(int c=0;c<256;c++)if(present[c]) {
        if(b.fresh[c][256]!=a.old[0][c])exit(2);
        for(int n=0;n<256;n++)if(b.fresh[c][n]!=a.old[n+1][c])exit(3);
    }
    cases++;
}
'''
h=h[:start]+verify+h[end:];h=h.replace('static Fn fns[] = {original, current, skip_interior, prune_division, combined, boundary_only};','static Fn fns[] = {current,current,candidate,current,current,candidate};')
h=h.replace('for(int i=0;i<5000;i++)','for(int i=0;i<1000;i++)')
needle='    printf("PASS %" PRIu64'
extra='''    for(int w=1;w<=70;w++)for(int h=1;h<=7;h++)for(int pad=0;pad<2;pad++) {
        int stride=w+pad*13;uint8_t *exact=malloc((size_t)stride*h);
        for(int mode=0;mode<5;mode++) {
            fill(exact,w,h,stride,4,mode);verify(exact,w,h,stride);verify(exact+(h-1)*stride,w,h,-stride);
        }
        free(exact);
    }
    for(int c=0;c<256;c++)for(int w=1;w<=65;w++) {
        int h=3;memset(d,c,w*h);verify(d,w,h,w);
        d[w*h-1]^=1;verify(d,w,h,w); /* next call must initialize newly touched rows */
    }
'''
assert needle in h;h=h.replace(needle,extra+needle).replace('bitmap cases, palettes and normalized adjacency tables','bitmap cases, palettes and active adjacency rows (except uniform fast returns)')
(out/'native.c').write_text(h)
for sanitized in [False,True]:
 suffix='-san' if sanitized else '';flags=['-fsanitize=address,undefined','-fno-omit-frame-pointer'] if sanitized else []
 subprocess.run(['clang','-O2',*flags,str(out/'native.c'),'-o',str(out/('native'+suffix))],check=True)
 proc=subprocess.run([str(out/('native'+suffix))],capture_output=True,text=True,check=True,env={**__import__('os').environ,'UBSAN_OPTIONS':'halt_on_error=1:print_stacktrace=1','ASAN_OPTIONS':'abort_on_error=1'})
 (out/('native'+suffix+'.log')).write_text(proc.stdout+proc.stderr);print(proc.stdout,flush=True)

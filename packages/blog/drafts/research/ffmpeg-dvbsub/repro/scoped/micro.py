"""Measure function behavior across input patterns, separately from decoder timing."""
from pathlib import Path
import argparse,subprocess
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);a=p.parse_args();out=a.out.resolve();root=Path(__file__).resolve().parent
# native.py must have generated these exact helpers first.
s=(out/'functions.h').read_text().replace('int fresh[257][256];','int fresh[257][256]; int clut_adjacency[256][256];')
prior=(root.parent/'formal/hardened.c').read_text();start=prior.index('/* All five loads');end=prior.index('\n\nstatic int save_subtitle_set(',start)
prior=prior[start:end].replace('static void compute_default_clut(','static void previous_impl(')
s+='\n'+prior+'\nstatic void previous(DVBSubContext *c,uint8_t *p,AVSubtitleRect *r,int w,int h){previous_impl(c,p,r,w,h);}\n'
(out/'micro-functions.h').write_text(s)
h=(out/'native.c').read_text().replace('#include "functions.h"','#include "micro-functions.h"')
h=h.replace('static Fn fns[] = {current,current,candidate,current,current,candidate};','static Fn fns[] = {current,previous,candidate};')
h=h.replace('static const char *names[] = {"original", "current", "skip", "prune", "combined", "boundary"};','static const char *names[] = {"upstream","previous","scoped"};')
h=h.replace('double results[6][7]','double results[3][7]').replace('f<6','f<3').replace('const int selected[3]={0,1,5};','const int selected[3]={0,1,2};').replace('i<24','i<8').replace(')/24*1e6',')/8*1e6').replace('original_us,current_us,boundary_us','upstream_us,previous_us,scoped_us')
# FFmpeg already supplies a portable native-read helper for the previous candidate.
(out/'micro.c').write_text('#include "libavutil/intreadwrite.h"\n'+h)
p=argparse.ArgumentParser(add_help=False)
repo=out/'ffmpeg-include'
if not repo.exists():raise SystemExit('Create ffmpeg-include symlink to the pinned checkout before running')
subprocess.run(['clang','-O3','-I',str(repo),str(out/'micro.c'),'-o',str(out/'micro')],check=True)
proc=subprocess.run([str(out/'micro'),'bench'],capture_output=True,text=True,check=True);(out/'micro.csv').write_text(proc.stdout);print(proc.stdout,flush=True)

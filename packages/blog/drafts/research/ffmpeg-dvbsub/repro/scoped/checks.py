"""Machine-check local predicates, small complete calls, and loop coverage."""
import argparse,hashlib,json,os,re,signal,subprocess,time,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--tools',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;out=a.out.resolve();out.mkdir(exist_ok=True,parents=True);tools=a.tools.resolve()
subprocess.run(['python3',str(root/'generate.py'),'--out',str(out)],check=True)
source=(out/'candidate.c').read_text();old=(root.parent/'baseline/upstream.c').read_text()
actual='!memcmp(&V(x-1,y), &V(x,y), 17) &&\n                    !memcmp(&V(x,y), &V(x,y-1), 16) &&\n                    !memcmp(&V(x,y), &V(x,y+1), 16)';assert actual in source
condition=actual.replace('&V(x-1,y)','p - 1').replace('&V(x,y-1)','p - stride').replace('&V(x,y+1)','p + stride').replace('&V(x,y)','p')
common='''#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <assert.h>
extern int nondet_int(void);
extern uint8_t nondet_byte(void);
extern _Bool nondet_bool(void);
#ifndef COVER
#define __CPROVER_cover(x) ((void)0)
#endif
'''
(out/'predicate.c').write_text(common+'''static int predicate(const uint8_t *p,ptrdiff_t stride) { return '''+condition+'''; }
int main(void) {
 uint8_t data[54];for(int i=0;i<54;i++)data[i]=nondet_byte();
 int stride=nondet_bool()?18:-18;const uint8_t *p=data+19;int scalar=1;
 for(int i=0;i<16;i++)if(p[i]!=p[i-1]||p[i]!=p[i+1]||p[i]!=p[i-stride]||p[i]!=p[i+stride])scalar=0;
 assert(predicate(p,stride)==scalar);__CPROVER_cover(1);
}
''')
(out/'bounds.c').write_text(common+'''int main(void) {
 int w=nondet_int(),h=nondet_int(),x=nondet_int(),y=nondet_int();
 __CPROVER_assume(w>0&&h>0&&w<=1310720&&h<=1310720&&(long long)w*h<=1310720);
 size_t length=(size_t)w*h-1;assert(length<1310720 && length+1==(size_t)w*h);
 __CPROVER_assume(y>=0&&y<h&&x>=0&&x<w);
 int v=(int)nondet_byte()+1;
 int vl=x?(int)nondet_byte()+1:0,vr=x+1<w?(int)nondet_byte()+1:0;
 int vt=y?(int)nondet_byte()+1:0,vb=y+1<h?(int)nondet_byte()+1:0;
 __CPROVER_assume(v==vl&&v==vr&&v==vt&&v==vb);
 assert(x>0&&x+1<w&&y>0&&y+1<h);
 __CPROVER_assume(w-x>16);
 assert(x-1>=0&&x+16<w&&y-1>=0&&y+1<h&&x+16<=w);
 __CPROVER_cover(1);
}
''')
def body(s,name,member):
 start=s.index('static void compute_default_clut(');end=s.index('\n\nstatic int save_subtitle_set(',start)
 return s[start:end].replace('DVBSubContext *ctx',('RefContext' if name=='reference' else 'NewContext')+' *ctx').replace('compute_default_clut(',name+'(').replace('ctx->clut_count2','ctx->'+member).replace('257','3').replace('256','2')
header='''#define FFMAX(a,b) ((a)>(b)?(a):(b))
#define RGBA(r,g,b,a) (((unsigned)(a)<<24)|((r)<<16)|((g)<<8)|(b))
#define AV_WN32(p,v) do {uint32_t q=(v);memcpy((p),&q,4);}while(0)
typedef struct {int old[3][2];} RefContext;
typedef struct {int fresh[3][2];} NewContext;
typedef struct {int linesize[4];uint8_t *data[4];} AVSubtitleRect;
'''
functions=common+header+body(old,'reference','old')+'\n'+body(source,'candidate','fresh')
(out/'calls.c').write_text(functions+'''
int main(void) {
 RefContext a;NewContext b;__CPROVER_havoc_object(&a);__CPROVER_havoc_object(&b);
 uint8_t c[8],d[8];__CPROVER_havoc_object(c);memcpy(d,c,8);
 for(int call=0;call<2;call++) {
  uint8_t pixels[2];for(int i=0;i<2;i++)pixels[i]=((call ? PATTERN1 : PATTERN0) >> i)&1;
  int stride=nondet_bool()?2:-2;AVSubtitleRect r={.linesize={stride},.data={pixels}};
  reference(&a,c,&r,2,1);candidate(&b,d,&r,2,1);
  for(int k=0;k<8;k++)assert(c[k]==d[k]);
 }
 __CPROVER_cover(1);
}
''')
cbmc=next(tools.glob('cbmc/**/bin/cbmc'));java=next(tools.glob('java/**/bin/java'));env=dict(os.environ);env['PATH']=str(tools/'z3-package/bin')+os.pathsep+env['PATH'];records=[]
def run(name,cmd,expected=0,timeout=180):
 start=time.monotonic();path=out/(name+'.log')
 with path.open('w') as f:
  p=subprocess.Popen([str(x) for x in cmd],env=env,cwd=out,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
  try:code=p.wait(timeout=timeout)
  except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGTERM);p.wait();code='timeout'
 log=path.read_text();record={'name':name,'command':[str(x).replace(str(out),'<out>').replace(str(tools),'<tools>').replace(str(root),'<sources>') for x in cmd],'exit_code':code,'expected':expected,'accepted':code==expected,'seconds':round(time.monotonic()-start,3),'log_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'summary':[x for x in log.splitlines() if re.search('VERIFICATION|\\*\\* .*failed|FAILURE|SATISFIED|No error has been found|states generated|is violated',x)]}
 records.append(record);(out/'checks.json').write_text(json.dumps(records,indent=2)+'\n');print(name,code,record['seconds'],flush=True)
 assert code==expected,(name,code);return log
for name,unwind in [('predicate',55),('bounds',2)]:
 solver=['--z3'] if name=='calls' else []
 cmd=[cbmc,out/(name+'.c'),*solver,'--unwind',str(unwind),'--unwinding-assertions','--bounds-check','--pointer-check','--signed-overflow-check','--conversion-check']
 assert 'VERIFICATION SUCCESSFUL' in run(name,cmd)
 log=run('reachable-'+name,[cbmc,out/(name+'.c'),*solver,'-DCOVER','--unwind',str(unwind),'--cover','cover']);assert 'SATISFIED' in log and 'FAILED' not in log
for p0 in range(4):
 for p1 in range(4):
  options=[f'-DPATTERN0={p0}',f'-DPATTERN1={p1}']
  cmd=[cbmc,out/'calls.c',*options,'--unwind','20','--unwinding-assertions','--bounds-check','--pointer-check','--signed-overflow-check','--conversion-check']
  assert 'VERIFICATION SUCCESSFUL' in run(f'calls-{p0}-{p1}',cmd)
  log=run(f'reachable-calls-{p0}-{p1}',[cbmc,out/'calls.c',*options,'-DCOVER','--unwind','20','--cover','cover']);assert 'SATISFIED' in log and 'FAILED' not in log
path=out/'predicate.c';saved=path.read_text();path.write_text(saved.replace('!memcmp(p, p - stride, 16) &&','1 &&'))
try:
 log=run('missing-upper-neighbour',[cbmc,path,'--unwind','55','--unwinding-assertions','--bounds-check','--pointer-check','--trace'],10);assert re.search('main.assertion.*FAILURE',log)
finally:path.write_text(saved)
path=out/'predicate.c';saved=path.read_text()
try:
 path.write_text(saved.replace('p - 1, p, 17','p - 1, p, 16'))
 log=run('missing-right-endpoint',[cbmc,path,'--unwind','55','--unwinding-assertions','--bounds-check','--pointer-check','--trace'],10);assert re.search('main.assertion.*FAILURE',log)
finally:path.write_text(saved)
shutil.copy(root/'LoopCoverage.tla',out/'LoopCoverage.tla')
for width in [1,2,17,18,19,32,33,34,64,65]:
 cfg=out/f'coverage-{width}.cfg';cfg.write_text(f'SPECIFICATION Spec\nCONSTANTS Width = {width}\n Broken = FALSE\nINVARIANTS TypeOK Prefix\n')
 log=run(f'coverage-{width}',[java,'-XX:+UseParallelGC','-cp',tools/'tla2tools.jar','tlc2.TLC','-workers','1','-seed','20261103','-fp','1','-metadir',out/f'states-{width}','-config',cfg,out/'LoopCoverage.tla'],0,60);assert 'No error has been found' in log
cfg=out/'coverage-broken.cfg';cfg.write_text('SPECIFICATION Spec\nCONSTANTS Width = 18\n Broken = TRUE\nINVARIANTS TypeOK Prefix\n')
log=run('coverage-broken',[java,'-XX:+UseParallelGC','-cp',tools/'tla2tools.jar','tlc2.TLC','-workers','1','-seed','20261103','-fp','1','-metadir',out/'states-broken','-config',cfg,out/'LoopCoverage.tla'],12,60);assert 'is violated' in log
(out/'checked-source-hashes.json').write_text(json.dumps({p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.glob('*.c')},indent=2)+'\n')
print('PASS local obligations, reachable calls, mutation and loop-coverage models')

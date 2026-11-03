#include "common.h"
int main(void) {
 int d=nondet_int(),p=nondet_int(),run=nondet_int();
 __CPROVER_assume(d>=0 && d<=1310720 && p>=0 && p<=d && run>=0 && run<=284);
 int n=FFMIN(run,d-p);
 assert(n>=0 && n<=run && p+n<=d);
 int b=nondet_int(),o=nondet_int(),s=nondet_int(),a=nondet_int();
 __CPROVER_assume(b>0 && b<=1310720 && o>=0 && s>=0 && a>=0);
 __CPROVER_assume(o<=4*b && s<=4*b-o && a<=4*b-o-s);
 int old=o+s,updated=old+a;
 assert(updated==o+(s+a));
 int score=1024LL*updated/b;
 assert(score>=0 && score<=4096);
 /* One induction step, including the exact strict tie comparison. */
 int best=nondet_int(); __CPROVER_assume(best>=0 && best<=4096);
 assert((score>best)==((1024LL*(o+s+a)/b)>best));
 __CPROVER_cover(1);
}

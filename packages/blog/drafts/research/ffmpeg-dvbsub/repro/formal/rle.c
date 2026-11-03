#include "common.h"
int main(void) {
 uint8_t a[16],b[16];
 int d=nondet_int(),p=nondet_int(),run=nondet_int(),color=nondet_int();
 __CPROVER_assume(d>=0 && d<=16 && p>=0 && p<=d && run>=0 && run<=284 && color>=0 && color<=255);
 for(int i=0;i<16;i++) a[i]=b[i]=nondet_byte();
 uint8_t *ap=a+p,*bp=b+p; int pa=p,pb=p,rr=run;
 while(rr-- >0 && pa<d) { *ap++=color;pa++; }
 dvbsub_fill_run(&bp,&pb,d,run,color);
 assert(pa==pb); assert(ap-a==bp-b);
 for(int i=0;i<16;i++) assert(a[i]==b[i]);
 __CPROVER_cover(1);
}

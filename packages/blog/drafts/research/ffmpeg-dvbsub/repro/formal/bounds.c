#include "common.h"
int main(void) {
 int w=nondet_int(),x=nondet_int(),h=nondet_int(),y=nondet_int();
 __CPROVER_assume(w>=10 && w<=1310720 && h>=3 && h<=1310720);
 __CPROVER_assume(x>=1 && x<w && w-x>8 && y>=1 && y<h-1);
 assert(x-1>=0 && x+8<w && x+7<w && y-1>=0 && y+1<h);
 assert(x+8>x && x+8<=w);
 __CPROVER_cover(1);
}

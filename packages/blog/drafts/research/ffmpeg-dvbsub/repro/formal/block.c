#include "common.h"
int main(void) {
 uint8_t data[30];
 for(int i=0;i<30;i++) data[i]=nondet_byte();
 int stride=nondet_bool()?10:-10;
 const uint8_t *row=data+11;
 int scalar=1;
 for(int i=0;i<8;i++)
  if(row[i]!=row[i-1] || row[i]!=row[i+1] || row[i]!=row[i-stride] || row[i]!=row[i+stride]) scalar=0;
 assert(dvbsub_interior_block(row,stride)==scalar);
 __CPROVER_cover(1);
}

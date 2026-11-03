#include "small-common.h"
int main(void) {
 uint8_t pixels[4]; int b[3]={0},o[3]={0},rb[3]={0},ro[3]={0},a[3][3]={0};
 DVBSubContext ctx; AVSubtitleRect rect={0};
 for(int i=0;i<4;i++) {pixels[i]=nondet_byte();__CPROVER_assume(pixels[i]<3);}
 rect.linesize[0]=2;rect.data[0]=pixels;
 dvbsub_count_color_boundaries(&ctx,&rect,2,2,b,o);
 for(int y=0;y<2;y++) for(int x=0;x<2;x++) {
  int c=pixels[2*y+x],ns[4]={x?pixels[2*y+x-1]:-1,x<1?pixels[2*y+x+1]:-1,y?pixels[2*y+x-2]:-1,y<1?pixels[2*y+x+2]:-1};
  int boundary=0;
  for(int k=0;k<4;k++) {int d=ns[k];if(d!=c)boundary=1;if(d<0)ro[c]++;else if(d!=c)a[c][d]++;}
  rb[c]+=boundary;
 }
 for(int c=0;c<3;c++) {
  assert(b[c]==rb[c] && o[c]==ro[c]);
  for(int d=0;d<3;d++) if(c!=d && b[c])assert(ctx.clut_adjacency[c][d]==a[c][d]);
  assert((b[c]>0)==(ro[c]+a[c][0]+a[c][1]+a[c][2]>0));
  for(int d=0;d<3;d++)assert(a[c][d]==a[d][c]);
 }
 __CPROVER_cover(1);
}

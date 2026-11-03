#include "small-common.h"
int main(void) {
 DVBSubContext ctx;int b[3],outside[3],scores[3],selected[3]={0}; uint8_t actual[3],expected[3];
 for(int c=0;c<3;c++) { b[c]=nondet_byte()&3;outside[c]=nondet_byte()&7;__CPROVER_assume(b[c]>=0&&b[c]<=9&&outside[c]>=0&&outside[c]<=36);scores[c]=outside[c]; }
 for(int c=0;c<3;c++)for(int d=c;d<3;d++) {int a=nondet_byte()&7;__CPROVER_assume(a>=0&&a<=36);ctx.clut_adjacency[c][d]=ctx.clut_adjacency[d][c]=c==d?0:a;}
 for(int c=0;c<3;c++) {int total=outside[c];for(int d=0;d<3;d++)total+=ctx.clut_adjacency[c][d];__CPROVER_assume(total<=4*b[c]);}
 int n=0;
 for(int rank=0;rank<3;rank++) {
  int best=0,winner=-1;
  for(int c=0;c<3;c++) {
   if(selected[c])continue;int s=outside[c];
   for(int d=0;d<3;d++)s+=selected[d]*ctx.clut_adjacency[d][c];
   if(s) {int score=1024LL*s/b[c];if(score>best){best=score;winner=c;}}
  }
  if(!best)break;selected[winner]=1;expected[n++]=winner;
 }
 int m=dvbsub_order_colors(&ctx,b,scores,actual);assert(n==m);
 for(int i=0;i<n;i++)assert(actual[i]==expected[i]);
 __CPROVER_cover(1);
}

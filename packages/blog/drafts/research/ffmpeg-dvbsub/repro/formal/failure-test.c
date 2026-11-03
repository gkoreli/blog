/* LGPL-2.1-or-later, consistent with the included FFmpeg decoder. */
#include "config.h"
#include "libavcodec/avcodec.h"
#include "libavutil/mem.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
static int fail_at, calls;
static int fail(const char *fn) { return !strcmp(fn,"save_subtitle_set") && ++calls==fail_at; }
static void *test_calloc(size_t n,size_t s,const char *fn){return fail(fn)?NULL:av_calloc(n,s);}
static void *test_mallocz(size_t n,const char *fn){return fail(fn)?NULL:av_mallocz(n);}
static void *test_memdup(const void *p,size_t n,const char *fn){return fail(fn)?NULL:av_memdup(p,n);}
#define av_calloc(n,s) test_calloc(n,s,__func__)
#define av_mallocz(n) test_mallocz(n,__func__)
#define av_memdup(p,n) test_memdup(p,n,__func__)
#ifndef DECODER_SOURCE
#define DECODER_SOURCE "hardened.c"
#endif
#include DECODER_SOURCE
#undef av_calloc
#undef av_mallocz
#undef av_memdup
static void setup(AVCodecContext *avctx,DVBSubContext *ctx,DVBSubRegion *reg,DVBSubRegionDisplay *disp,uint8_t *pixels,int edt){
 memset(ctx,0,sizeof(*ctx));memset(reg,0,sizeof(*reg));memset(disp,0,sizeof(*disp));
 avctx->priv_data=ctx;ctx->region_list=reg;ctx->display_list=disp;ctx->compute_edt=edt;
 ctx->version=-1;ctx->composition_id=ctx->ancillary_id=-1;ctx->prev_start=0;ctx->time_out=7;
 ctx->compute_clut=0;reg->dirty=1;reg->width=2;reg->height=1;reg->depth=2;reg->pbuf=pixels;reg->buf_size=2;
}
int main(int argc,char **argv){
 if(argc!=2)return 2;
 FILE *f=fopen(argv[1],"rb");if(!f)return 3;uint32_t size;if(fread(&size,4,1,f)!=1)return 4;
 uint8_t *packet=av_mallocz(size+AV_INPUT_BUFFER_PADDING_SIZE);if(fread(packet,size,1,f)!=1)return 5;fclose(f);
 /* Strip end-of-display segments to exercise the emulated call too. */
 int used=0;for(unsigned p=0;p+6<=size&&packet[p]==0x0f;){int n=6+AV_RB16(packet+p+4);if(p+n>size)return 6;if(packet[p+1]!=0x80){memmove(packet+used,packet+p,n);used+=n;}p+=n;}
 int failures=0,checked=0;
 for(int route=0;route<3;route++)for(int point=1;point<=4;point++){
  AVCodecContext *avctx=avcodec_alloc_context3(NULL);DVBSubContext *ctx=av_mallocz(sizeof(*ctx));
  DVBSubRegion *reg=av_mallocz(sizeof(*reg));DVBSubRegionDisplay *disp=av_mallocz(sizeof(*disp));
  uint8_t *pixels=av_mallocz(2);pixels[1]=1;
  setup(avctx,ctx,reg,disp,pixels,route==1);AVSubtitle sub={.pts=1000};int got=0,ret;
  uint8_t end[]={0x0f,0x80,0,0,0,0,0xff};uint8_t page[]={0x0f,0x10,0,0,0,2,5,0,0xff};
  fail_at=point;calls=0;
  if(route<2){AVPacket pkt={.data=route?page:end,.size=route?sizeof(page):sizeof(end)};ret=dvbsub_decode(avctx,&sub,&got,&pkt);}
  else {
   /* Use real generated page/region/object parsing; no stack-owned region list. */
   delete_regions(ctx);av_free(ctx->display_list);ctx->display_list=NULL;
   AVPacket pkt={.data=packet,.size=used};ret=dvbsub_decode(avctx,&sub,&got,&pkt);
  }
  int ok=ret==AVERROR(ENOMEM)&&got==0&&sub.num_rects==0&&sub.rects==NULL;
  if(route==1)ok=ok&&ctx->version==-1&&ctx->time_out==7&&ctx->prev_start==0;
  checked++;if(!ok){failures++;printf("FAIL route=%d allocation=%d ret=%d got=%d rects=%u version=%d\n",route,point,ret,got,sub.num_rects,ctx->version);}
  avsubtitle_free(&sub);
  fail_at=0;calls=0;got=0;
  AVPacket retry={.data=route==0?end:route==1?page:packet,.size=route==0?sizeof(end):route==1?sizeof(page):used};
  ret=dvbsub_decode(avctx,&sub,&got,&retry);checked++;
  if(ret<0||!got||sub.num_rects!=1){failures++;printf("FAIL retry route=%d allocation=%d ret=%d got=%d rects=%u\n",route,point,ret,got,sub.num_rects);}
  avsubtitle_free(&sub);
  delete_regions(ctx);delete_objects(ctx);delete_cluts(ctx);while(ctx->display_list){DVBSubRegionDisplay *d=ctx->display_list;ctx->display_list=d->next;av_free(d);}
  av_free(ctx);avctx->priv_data=NULL;avcodec_free_context(&avctx);
 }
 /* A parser failure must reach the outer decoder status. */
 AVCodecContext *avctx=avcodec_alloc_context3(NULL);DVBSubContext *ctx=av_mallocz(sizeof(*ctx));avctx->priv_data=ctx;ctx->composition_id=ctx->ancillary_id=-1;
 uint8_t bad[]={0x0f,0x11,0,0,0,0,0xff};AVPacket pkt={.data=bad,.size=sizeof(bad)};AVSubtitle sub={0};int got=0;
 fail_at=0;calls=0;int ret=dvbsub_decode(avctx,&sub,&got,&pkt);checked++;if(ret>=0){failures++;printf("FAIL swallowed parser error ret=%d\n",ret);}
 /* Page parsing consumes two header bytes; a one-byte payload must be rejected. */
 uint8_t short_page[2]={5,0};ctx->version=-1;ret=dvbsub_parse_page_segment(avctx,short_page,1,&sub,&got);checked++;if(ret!=AVERROR_INVALIDDATA){failures++;printf("FAIL short page ret=%d\n",ret);}
 ret=dvbsub_parse_clut_segment(avctx,short_page,1);checked++;if(ret!=AVERROR_INVALIDDATA){failures++;printf("FAIL short CLUT ret=%d\n",ret);}
 delete_cluts(ctx);av_free(ctx);avctx->priv_data=NULL;avcodec_free_context(&avctx);av_free(packet);
 printf("%s %d native failure-path checks; failures=%d\n",failures?"FAIL":"PASS",checked,failures);
 return failures?1:0;
}

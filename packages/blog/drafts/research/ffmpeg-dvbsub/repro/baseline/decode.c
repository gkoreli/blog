#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "libavcodec/avcodec.h"
#include "libavformat/avformat.h"
#include "libavutil/opt.h"
static double cpu_now(void) { struct timespec t; clock_gettime(CLOCK_PROCESS_CPUTIME_ID,&t); return t.tv_sec+t.tv_nsec*1e-9; }
int main(int argc,char **argv) {
    if(argc<4) return 2;
    int passes=atoi(argv[2]), mode=atoi(argv[3]);
    FILE *out=argc>4?fopen(argv[4],"wb"):NULL;
    if(argc>4&&!out) return 2;
    unsigned long long count=0, pixels=0;
    av_log_set_level(AV_LOG_ERROR);
    double start=cpu_now();
    for(int pass=0;pass<passes;pass++) {
        AVFormatContext *fmt=NULL;
        if(avformat_open_input(&fmt,argv[1],NULL,NULL)<0) return 3;
        if(avformat_find_stream_info(fmt,NULL)<0) return 4;
        const AVCodec *codec=NULL;
        int index=av_find_best_stream(fmt,AVMEDIA_TYPE_SUBTITLE,-1,-1,&codec,0);
        if(index<0) return 5;
        AVCodecContext *ctx=avcodec_alloc_context3(codec);
        if(!ctx || avcodec_parameters_to_context(ctx,fmt->streams[index]->codecpar)<0) return 6;
        ctx->pkt_timebase=fmt->streams[index]->time_base;
        if(av_opt_set_int(ctx,"compute_clut",mode,AV_OPT_SEARCH_CHILDREN)<0 || avcodec_open2(ctx,codec,NULL)<0) return 7;
        AVPacket *pkt=av_packet_alloc();
        if(!pkt) return 8;
        while(av_read_frame(fmt,pkt)>=0) {
            if(pkt->stream_index==index) {
                AVSubtitle sub={0}; int got=0;
                if(avcodec_decode_subtitle2(ctx,&sub,&got,pkt)<0) return 9;
                if(got) for(unsigned i=0;i<sub.num_rects;i++) {
                    AVSubtitleRect *r=sub.rects[i];
                    if(r->type!=SUBTITLE_BITMAP) return 10;
                    count++; pixels+=(unsigned long long)r->w*r->h;
                    if(out&&pass==0) {
                        uint32_t dims[2]={(uint32_t)r->w,(uint32_t)r->h};
                        fwrite(dims,sizeof(dims),1,out);
                        for(int y=0;y<r->h;y++) fwrite(r->data[0]+y*r->linesize[0],r->w,1,out);
                        fwrite(r->data[1],1024,1,out);
                    }
                }
                avsubtitle_free(&sub);
            }
            av_packet_unref(pkt);
        }
        av_packet_free(&pkt); avcodec_free_context(&ctx); avformat_close_input(&fmt);
    }
    if(out && fclose(out)) return 11;
    printf("passes=%d mode=%d cpu_s=%.6f rectangles=%llu pixels=%llu\n",passes,mode,cpu_now()-start,count,pixels);
    return 0;
}

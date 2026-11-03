#include "libavcodec/avcodec.h"
#include "libavutil/mem.h"
#include "libavutil/opt.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
static uint32_t state=0x5a307bcc;
static uint32_t next(void){state^=state<<13;state^=state>>17;state^=state<<5;return state;}
static double cpu_now(void){struct timespec t;clock_gettime(CLOCK_PROCESS_CPUTIME_ID,&t);return t.tv_sec+t.tv_nsec*1e-9;}
static void write_packet(FILE *out,uint8_t *data,int size,int remove_clut,int non_mod){
    uint8_t filtered[262144];int used=0;
    for(int p=0;p<size;){
        if(size-p<6||data[p]!=0x0f){memcpy(filtered+used,data+p,size-p);used+=size-p;break;}
        int len=6+((data[p+4]<<8)|data[p+5]);
        if(len>size-p)exit(10);
        if(!(remove_clut&&data[p+1]==0x12)){
            memcpy(filtered+used,data+p,len);
            if(non_mod&&data[p+1]==0x13&&len>=9)filtered[used+8]|=2;
            used+=len;
        }
        p+=len;
    }
    uint32_t length=used;fwrite(&length,4,1,out);fwrite(filtered,used,1,out);
}
static int generate(const char *path){
    FILE *out=fopen(path,"wb");if(!out)return 2;
    uint8_t *packet=av_malloc(262144);int count=0;
    for(int depth=2;depth<=8;depth*=2)for(int dims=0;dims<4;dims++)for(int pattern=0;pattern<4;pattern++){
        int w=dims==0?40:dims==1?100:dims==2?320:720;
        int h=dims==0?12:dims==1?50:dims==2?80:576;
        if(dims==3&&pattern==0)continue;
        int colors=1<<depth;
        AVCodecContext *ctx=avcodec_alloc_context3(avcodec_find_encoder(AV_CODEC_ID_DVB_SUBTITLE));
        if(!ctx)return 3;ctx->width=w;ctx->height=h;ctx->time_base=(AVRational){1,1000};
        if(av_opt_set_int(ctx,"min_bpp",depth,AV_OPT_SEARCH_CHILDREN)<0||avcodec_open2(ctx,NULL,NULL)<0)return 4;
        AVSubtitleRect r={0},*rects[]={&r};AVSubtitle sub={.num_rects=1,.rects=rects};
        r.w=w;r.h=h;r.type=SUBTITLE_BITMAP;r.nb_colors=colors;r.linesize[0]=w;
        r.data[0]=av_malloc((size_t)w*h);r.data[1]=av_mallocz(1024);
        if(!r.data[0]||!r.data[1]||!packet)return 5;
        for(int c=0;c<colors;c++){uint32_t rgba=c?0xff000000U|(c*0x09131dU&0xffffff):0;memcpy(r.data[1]+4*c,&rgba,4);}
        for(int y=0;y<h;y++)for(int x=0;x<w;x++){
            int c=pattern==0?next()%colors:pattern==1?0:pattern==2?((x/16+y/8)%colors):(y>h*4/5&&y%18<12&&x%12<7?1+(x/12+y/18)%(colors-1):0);
            r.data[0][y*w+x]=c;
        }
        int length=avcodec_encode_subtitle(ctx,packet,262144,&sub);if(length<=0)return 6;
        if(length>60000){av_freep(&r.data[0]);av_freep(&r.data[1]);avcodec_free_context(&ctx);continue;}
        for(int missing=0;missing<2;missing++)for(int non_mod=0;non_mod<2;non_mod++){
            write_packet(out,packet,length,missing,non_mod);count++;
        }
        av_freep(&r.data[0]);av_freep(&r.data[1]);avcodec_free_context(&ctx);
    }
    av_free(packet);fclose(out);printf("generated %d DVB packets\n",count);return 0;
}
int main(int argc,char **argv){
    av_log_set_level(AV_LOG_QUIET);
    if(argc==3&&!strcmp(argv[1],"generate"))return generate(argv[2]);
    if(argc<4)return 2;
    int passes=atoi(argv[2]),mode=atoi(argv[3]);
    FILE *dump=argc>4?fopen(argv[4],"wb"):NULL;
    if(argc>4&&!dump)return 3;
    unsigned long count=0,pixels=0;double start=cpu_now();
    for(int pass=0;pass<passes;pass++){
        FILE *in=fopen(argv[1],"rb");if(!in)return 4;
        uint32_t length;
        while(fread(&length,4,1,in)==1){
            AVCodecContext *ctx=avcodec_alloc_context3(avcodec_find_decoder(AV_CODEC_ID_DVB_SUBTITLE));
            if(!ctx||av_opt_set_int(ctx,"compute_clut",mode,AV_OPT_SEARCH_CHILDREN)<0||avcodec_open2(ctx,NULL,NULL)<0)return 5;
            AVPacket *pkt=av_packet_alloc();if(!pkt||av_new_packet(pkt,length)<0)return 6;
            if(fread(pkt->data,length,1,in)!=1)return 7;
            AVSubtitle sub={0};int got=0,ret=avcodec_decode_subtitle2(ctx,&sub,&got,pkt);
            if(ret<0)return 8;
            if(dump&&pass==0){int fields[]={got,ret,(int)sub.num_rects,(int)sub.start_display_time,(int)sub.end_display_time};fwrite(fields,sizeof(fields),1,dump);}
            if(got)for(unsigned i=0;i<sub.num_rects;i++){
                AVSubtitleRect *r=sub.rects[i];count++;pixels+=r->w*r->h;
                if(dump&&pass==0){
                    int fields[]={r->x,r->y,r->w,r->h,r->type,r->nb_colors,r->flags};fwrite(fields,sizeof(fields),1,dump);
                    for(int y=0;y<r->h;y++)fwrite(r->data[0]+y*r->linesize[0],r->w,1,dump);
                    fwrite(r->data[1],1024,1,dump);
                }
            }
            avsubtitle_free(&sub);av_packet_free(&pkt);avcodec_free_context(&ctx);
        }
        fclose(in);
    }
    if(dump)fclose(dump);
    printf("passes=%d mode=%d cpu_s=%.6f rectangles=%lu pixels=%lu\n",passes,mode,cpu_now()-start,count,pixels);
    return 0;
}

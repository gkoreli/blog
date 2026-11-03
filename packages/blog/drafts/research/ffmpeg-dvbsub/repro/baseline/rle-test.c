#include "rle-functions.h"
typedef int (*Reader)(AVCodecContext *,uint8_t *,int,const uint8_t **,int,int,uint8_t *,int);
static Reader original[]={original_2bit,original_4bit,original_8bit};
static Reader candidate[]={candidate_2bit,candidate_4bit,candidate_8bit};
static uint32_t state=0xf3a78924;
static uint32_t next(void) {state^=state<<13;state^=state>>17;state^=state<<5;return state;}
static unsigned long cases;
static void verify(int reader,const uint8_t *input,int input_size,int limit,int x,int non_mod,uint8_t *map) {
    uint8_t ref[640],out[640];
    memset(ref,0xa5,sizeof(ref));memcpy(out,ref,sizeof(ref));
    const uint8_t *p=input,*q=input;
    int a=original[reader](NULL,ref+32,limit,&p,input_size,non_mod,map,x);
    int b=candidate[reader](NULL,out+32,limit,&q,input_size,non_mod,map,x);
    if(a!=b||p-input!=q-input||memcmp(ref,out,sizeof(ref))) {
        fprintf(stderr,"FAIL reader=%d case=%lu length=%d limit=%d x=%d non_mod=%d\n",reader,cases,input_size,limit,x,non_mod);exit(1);
    }
    cases++;
}
int main(void) {
    av_log_set_level(AV_LOG_QUIET);
    uint8_t input[64+AV_INPUT_BUFFER_PADDING_SIZE]={0},map[256];
    for(int i=0;i<256;i++)map[i]=(i*37+91)&255;
    for(int reader=0;reader<3;reader++) {
        for(unsigned bits=0;bits<65536;bits++) {
            input[0]=bits>>8;input[1]=bits;
            for(int non_mod=0;non_mod<2;non_mod++) {
                int limit=1+bits%400,x=(bits/400)%(limit+1);
                verify(reader,input,2,limit,x,non_mod,NULL);
                verify(reader,input,2,limit,x,non_mod,map);
            }
        }
        for(int i=0;i<30000;i++) {
            int n=next()%65;memset(input,0,sizeof(input));
            for(int j=0;j<n;j++)input[j]=next();
            int limit=1+next()%400,x=next()%(limit+1);
            verify(reader,input,n,limit,x,next()%2,next()%2?map:NULL);
        }
    }
    printf("PASS %lu RLE cases: decoded bytes, clipping, pixel count, and input consumption\n",cases);
    return 0;
}

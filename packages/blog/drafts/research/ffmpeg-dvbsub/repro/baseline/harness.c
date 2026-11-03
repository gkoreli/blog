#include "functions.h"
typedef void (*Fn)(DVBSubContext *, uint8_t *, AVSubtitleRect *, int, int);
static Fn fns[] = {original, current, prior, scalar, wide};
static const char *names[] = {"original", "current", "prior", "scalar", "wide"};
static uint32_t rng = 0x576a032;
static uint32_t random32(void) { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return rng; }
static uint64_t cases;
static volatile uint64_t checksum;
static double now(void) { struct timespec t; clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &t); return t.tv_sec + t.tv_nsec * 1e-9; }
static void verify(uint8_t *data, int w, int h, int stride) {
    static DVBSubContext a, b;
    uint8_t ref[1024], out[1024];
    AVSubtitleRect r = {.linesize = {stride}, .data = {data}};
    for (int i = 0; i < 1024; i++) ref[i] = (i * 17 + cases) & 255;
    current(&a, ref, &r, w, h);
    for (int j = 0; j < 5; j++) {
        if (j == 1 || (j == 0 && getenv("SKIP_ORIGINAL"))) continue;
        for (int i = 0; i < 1024; i++) out[i] = (i * 17 + cases) & 255;
        fns[j](&b, out, &r, w, h);
        if (memcmp(ref, out, sizeof(ref)) || (j < 3 && memcmp(a.clut_count2, b.clut_count2, sizeof(a.clut_count2)))) {
            fprintf(stderr, "FAIL case=%" PRIu64 " fn=%s w=%d h=%d stride=%d seed=%u\n", cases, names[j], w, h, stride, rng); exit(1);
        }
    }
    uint8_t present[256]={0};
    for(int y=0;y<h;y++) for(int x=0;x<w;x++) present[data[y*stride+x]]=1;
    for(int j=3;j<5;j++) {
        fns[j](&b,out,&r,w,h);
        for(int color=0;color<256;color++) if(present[color])
            for(int neighbour=0;neighbour<256;neighbour++)
                if(b.clut_count2[color][neighbour]!=a.clut_count2[neighbour+1][color]) {
                    fprintf(stderr,"Adjacency mismatch case=%" PRIu64 " variant=%s\n",cases,names[j]);exit(1);
                }
    }
    cases++;
}
static int compare_double(const void *a, const void *b) { double x=*(const double*)a, y=*(const double*)b; return (x>y)-(x<y); }
static void fill(uint8_t *d, int w, int h, int stride, int colors, int mode) {
    (void)w;
    for (int y=0; y<h; y++) for (int x=0; x<stride; x++) {
        int v;
        switch(mode) {
        case 0: v = random32() % colors; break;
        case 1: v = 0; break;
        case 2: v = y > h * 4 / 5 && (y % 18) < 12 && (x % 12) < 7 ? 1 + ((x/12+y/18) % (colors-1)) : 0; break;
        case 3: v = ((x+y) & 1) ? colors-1 : 0; break;
        default: v = ((x/16)+(y/16))%colors; break;
        }
        d[y*stride+x] = v;
    }
}
static void bench(int w, int h, int colors, int mode, const char *pattern) {
    static DVBSubContext ctx;
    uint8_t *data=malloc((size_t)w*h), out[1024]={0};
    AVSubtitleRect r={.linesize={w}, .data={data}};
    fill(data,w,h,w,colors,mode);
    verify(data,w,h,w);
    double results[5][7];
    for(int f=0; f<5; f++) fns[f](&ctx,out,&r,w,h);
    const int selected[4]={1,2,3,4};
    for(int round=0; round<7; round++) for(int k=0; k<4; k++) {
        int f=selected[(k+round)%4];
        double start=now();
        for(int i=0;i<24;i++) { fns[f](&ctx,out,&r,w,h); checksum+=out[(i*4)%1024]; }
        results[f][round]=(now()-start)/24*1e6;
    }
    printf("%dx%d,%d,%s",w,h,colors,pattern);
    for(int k=0; k<4; k++) { int f=selected[k]; qsort(results[f],7,sizeof(double),compare_double); printf(",%.3f", results[f][3]); }
    puts(""); fflush(stdout); free(data);
}
int main(int argc, char **argv) {
    if(argc>1 && !strcmp(argv[1],"bench")) {
        puts("size,colors,pattern,upstream_us,prior_us,scalar_us,wide_us");
        for(int size=0;size<3;size++) {
            int w=size==0?100:size==1?720:1280, h=size==0?50:size==1?576:720;
            for(int c=4;c<=256;c*=4) bench(w,h,c,0,"random");
            bench(w,h,4,1,"uniform"); bench(w,h,4,2,"textlike");
            bench(w,h,4,3,"checker"); bench(w,h,4,4,"blocks");
        }
        return 0;
    }
    if(argc>1 && !strcmp(argv[1],"edgebench")) {
        puts("size,colors,pattern,upstream_us,prior_us,scalar_us,wide_us");
        for(int i=0;i<5;i++) {bench(720,576,16,0,"random");bench(100,50,4,3,"checker");}
        return 0;
    }
    uint8_t *d=malloc(1310720+65536);
    for(int colors=2;colors<=3;colors++) {
        for(int pixels=1;pixels<=9;pixels++) {
            uint64_t count=1; for(int p=0;p<pixels;p++) count*=colors;
            for(uint64_t n=0;n<count;n++) {
                uint64_t v=n; for(int p=0;p<pixels;p++) {d[p]=v%colors;v/=colors;}
                verify(d,pixels,1,pixels);
                if(pixels==4||pixels==6||pixels==9) verify(d,pixels==4?2:3,pixels/(pixels==4?2:3),pixels==4?2:3);
            }
        }
    }
    for(int i=0;i<1000;i++) {
        int w=1+random32()%64,h=1+random32()%64,stride=w+random32()%17, colors=1+random32()%256;
        int mode=colors==1?1:random32()%5;
        fill(d,w,h,stride,colors,mode); verify(d,w,h,stride);
        uint8_t map[256]; for(int j=0;j<256;j++) map[j]=j;
        for(int j=255;j>0;j--) {int k=random32()%(j+1); uint8_t t=map[j];map[j]=map[k];map[k]=t;}
        for(int y=0;y<h;y++) for(int x=0;x<w;x++) d[y*stride+x]=map[d[y*stride+x]];
        verify(d,w,h,stride);
    }
    for(int i=0;i<48;i++) {
        int w=1+random32()%1280,h=1+random32()%720,stride=w+random32()%17, colors=2+random32()%255;
        fill(d,w,h,stride,colors,i%5); verify(d,w,h,stride);
    }
    for(int w=1;w<=40;w++) for(int h=1;h<=7;h++) for(int pad=0;pad<2;pad++) {
        int stride=w+pad*13;
        uint8_t *exact=malloc((size_t)stride*h);
        for(int mode=0;mode<5;mode++) {
            fill(exact,w,h,stride,4,mode);
            verify(exact,w,h,stride);
            verify(exact+(h-1)*stride,w,h,-stride);
        }
        free(exact);
    }
    printf("PASS %" PRIu64 " bitmap cases, palettes and normalized adjacency tables; seed=%u\n", cases,rng);
    free(d); return 0;
}

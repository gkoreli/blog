#include <stdint.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <inttypes.h>
#define FFMAX(a,b) ((a) > (b) ? (a) : (b))
#define RGBA(r,g,b,a) (((unsigned)(a) << 24) | ((r) << 16) | ((g) << 8) | (b))
#define AV_WN32(p,v) do { uint32_t q = (v); memcpy((p), &q, sizeof(q)); } while(0)
typedef struct { int clut_count2[257][256]; } DVBSubContext;
typedef struct { int linesize[4]; uint8_t *data[4]; } AVSubtitleRect;

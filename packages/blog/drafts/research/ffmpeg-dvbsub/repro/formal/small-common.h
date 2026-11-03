#ifndef CHECK_REACHABILITY
#define __CPROVER_cover(condition) ((void)0)
#endif
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <assert.h>
#include <limits.h>
#define av_always_inline inline
#define FFMIN(a,b) ((a)<(b)?(a):(b))
/* Trusted library boundary: FFmpeg AV_RN64 unaligned native read semantics. */
static uint64_t read64(const uint8_t *p) { uint64_t v; memcpy(&v,p,8); return v; }
#define AV_RN64(p) read64(p)
typedef struct { int clut_adjacency[3][3]; } DVBSubContext;
typedef struct { int linesize[4]; uint8_t *data[4]; } AVSubtitleRect;
extern int nondet_int(void);
extern unsigned char nondet_byte(void);
extern _Bool nondet_bool(void);
#include "reduced.h"

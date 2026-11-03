/* Source-level slices of the three unchanged memcpy statements. */
#include "common.h"
typedef struct { uint8_t *data[2]; int nb_colors; } CopyRect;
typedef struct { uint8_t computed_clut[1024]; } CopyRegion;
int main(void) {
 uint32_t table[256]; CopyRegion region;
 uint8_t old[1024]={0},new[1024]={0};
 __CPROVER_havoc_object(table);__CPROVER_havoc_object(&region);
 int n=nondet_int();__CPROVER_assume(n==4 || n==16 || n==256);
 int k=nondet_int();__CPROVER_assume(k>=0 && k<1024);
 int computed=nondet_bool();const uint32_t *clut_table=table;
 CopyRect before={.data={NULL,old},.nb_colors=n},after={.data={NULL,new},.nb_colors=n};
 CopyRect *rect=&before;CopyRegion *reg=&region;
 memcpy(rect->data[1], clut_table, rect->nb_colors * sizeof(*clut_table));
 if(computed)memcpy(rect->data[1], reg->computed_clut, sizeof(reg->computed_clut));
 rect=&after;
 if(computed)memcpy(rect->data[1], reg->computed_clut, sizeof(reg->computed_clut));
 else memcpy(rect->data[1], clut_table, rect->nb_colors * sizeof(*clut_table));
 assert(old[k]==new[k]);
 __CPROVER_cover(1);
}

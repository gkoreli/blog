#include <stddef.h>
#include <string.h>
int native16(const unsigned char *p, ptrdiff_t stride) {
    return !memcmp(p-1,p,17) && !memcmp(p,p-stride,16) && !memcmp(p,p+stride,16);
}

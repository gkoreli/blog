/* Clip a decoded run once, then use the native byte-fill operation. */
static av_always_inline void dvbsub_fill_run(uint8_t **destbuf, int *pixels_read,
                                           int dbuf_len, int run_length, int color)
{
    int length = FFMIN(run_length, dbuf_len - *pixels_read);

    if (length <= 0)
        return;
    memset(*destbuf, color, length);
    *destbuf += length;
    *pixels_read += length;
}

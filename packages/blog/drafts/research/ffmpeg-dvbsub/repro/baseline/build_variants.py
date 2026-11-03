from pathlib import Path
root=Path(__file__).resolve().parent
upstream=(root/'upstream.c').read_text().rstrip('\n')+'\n'
start=upstream.index('static void compute_default_clut(')
end=upstream.index('\n\nstatic int save_subtitle_set(',start)
scalar=(root/'palette.c').read_text()
body=scalar
wide_helper='''/* All five loads stay within their rows; equality is endian-independent. */
static av_always_inline int dvbsub_interior_block(const uint8_t *row,
                                                 ptrdiff_t stride)
{
    uint64_t pixels = AV_RN64(row);
    return !((pixels ^ AV_RN64(row - 1)) |
             (pixels ^ AV_RN64(row + 1)) |
             (pixels ^ AV_RN64(row - stride)) |
             (pixels ^ AV_RN64(row + stride)));
}

'''
scan_start=body.index('        for (int x = 0; x < w; x++)')
scan_end=body.index('\n    }\n}',scan_start)
wide_scan='''        int x = 0;
        if (above && below && w > 9) {
            int misses = 0;
            dvbsub_count_boundary_pixel(ctx, row, above, below, x++, w,
                                        boundary_count, scores);
            while (w - x > 8 && misses < 2) {
                if (dvbsub_interior_block(row + x, stride)) {
                    x += 8;
                    continue;
                }
                misses++;
                int end = x + 8;
                for (; x < end; x++)
                    dvbsub_count_boundary_pixel(ctx, row, above, below, x, w,
                                                boundary_count, scores);
            }
        }
        for (; x < w; x++)
            dvbsub_count_boundary_pixel(ctx, row, above, below, x, w,
                                        boundary_count, scores);'''
body=body[:scan_start]+wide_scan+body[scan_end:]
variants={'upstream':upstream,'prior':(root/'prior-candidate.c').read_text(),
          'scalar':upstream[:start]+scalar+upstream[end:],
          'wide':upstream[:start]+wide_helper+body+upstream[end:]}
for name,source in variants.items():
    (root/f'{name}.c').write_text(source)

static av_always_inline void dvbsub_count_boundary_pixel(
    DVBSubContext *ctx, const uint8_t *row, const uint8_t *above,
    const uint8_t *below, int x, int w, int boundary_count[256], int scores[256])
{
    int color = row[x];
    int neighbours[4] = {
        x ? row[x - 1] : -1,
        x + 1 < w ? row[x + 1] : -1,
        above ? above[x] : -1,
        below ? below[x] : -1,
    };

    if (!((color != neighbours[0]) | (color != neighbours[1]) |
          (color != neighbours[2]) | (color != neighbours[3])))
        return;

    /* Only rows belonging to boundary colours will be read. */
    if (!boundary_count[color]++)
        memset(ctx->clut_count2[color], 0, sizeof(ctx->clut_count2[color]));

    for (int i = 0; i < 4; i++) {
        if (neighbours[i] < 0)
            scores[color]++;
        else
            ctx->clut_count2[color][neighbours[i]]++;
    }
}

/* Count only boundaries: interior pixels do not affect palette ordering. */
static void dvbsub_count_color_boundaries(DVBSubContext *ctx,
                                        const AVSubtitleRect *rect, int w, int h,
                                        int boundary_count[256], int scores[256])
{
    ptrdiff_t stride = rect->linesize[0];

    for (int y = 0; y < h; y++) {
        const uint8_t *row = rect->data[0] + y * stride;
        const uint8_t *above = y ? row - stride : NULL;
        const uint8_t *below = y + 1 < h ? row + stride : NULL;

        for (int x = 0; x < w; x++)
            dvbsub_count_boundary_pixel(ctx, row, above, below, x, w,
                                        boundary_count, scores);
    }
}

/* Preserve ascending colour-index tie breaking and integer score rounding. */
static int dvbsub_order_colors(DVBSubContext *ctx, const int boundary_count[256],
                              int scores[256], uint8_t order[256])
{
    uint8_t colors[256];
    uint8_t selected[256] = {0};
    int nb_colors = 0;
    int nb_selected = 0;

    for (int color = 0; color < 256; color++)
        if (boundary_count[color]) {
            ctx->clut_count2[color][color] = 0;
            colors[nb_colors++] = color;
        }

    for (int rank = 0; rank < nb_colors; rank++) {
        int best_color = -1;
        int best_score = 0;

        for (int i = 0; i < nb_colors; i++) {
            int color = colors[i];
            int score;

            if (selected[color] || !scores[color])
                continue;
            score = 1024LL * scores[color] / boundary_count[color];
            if (score > best_score) {
                best_score = score;
                best_color = color;
            }
        }
        if (best_color < 0)
            break;

        selected[best_color] = 1;
        order[nb_selected++] = best_color;
        for (int i = 0; i < nb_colors; i++) {
            int color = colors[i];
            scores[color] += ctx->clut_count2[best_color][color];
        }
    }
    return nb_selected;
}

static void compute_default_clut(DVBSubContext *ctx, uint8_t *clut,
                                 AVSubtitleRect *rect, int w, int h)
{
    int boundary_count[256] = {0};
    int scores[256] = {0};
    uint8_t order[256];
    int nb_colors, scale;

    dvbsub_count_color_boundaries(ctx, rect, w, h, boundary_count, scores);
    nb_colors = dvbsub_order_colors(ctx, boundary_count, scores, order);

    scale = FFMAX(nb_colors - 1, 1);
    for (int rank = nb_colors - 1; rank >= 0; rank--) {
        int value = rank * 255 / scale;
        AV_WN32(clut + 4 * order[rank], RGBA(value / 2, value, value / 2, value));
    }
}

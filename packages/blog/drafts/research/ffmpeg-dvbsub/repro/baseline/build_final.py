from pathlib import Path
root=Path(__file__).resolve().parent
source=(root/'combined.c').read_text()
source=source.replace('    int clut_count2[257][256];','    int clut_count2[256][256];')
source=source.replace('                                 AVSubtitleRect *rect, int w, int h)','                                 const AVSubtitleRect *rect, int w, int h)')
old='            memcpy(rect->data[1], clut_table, (1 << region->depth) * sizeof(*clut_table));\n'
assert source.count(old)==1
source=source.replace(old,'')
old='''                memcpy(rect->data[1], region->computed_clut, sizeof(region->computed_clut));
            }'''
assert source.count(old)==1
source=source.replace(old,'''                memcpy(rect->data[1], region->computed_clut, sizeof(region->computed_clut));
            } else {
                memcpy(rect->data[1], clut_table, rect->nb_colors * sizeof(*clut_table));
            }''')
source=source.replace('clut_count2','clut_adjacency')
source=source.replace('            int misses = 0;','''            /* Noisy rows fall back after two failed block probes. */
            int misses = 0;''')
(root/'final.c').write_text(source.rstrip('\n')+'\n')

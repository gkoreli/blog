# Shot list: preamble capture for X (revision 2)

Source: the built article page, `OssRadarHero` with `canvasMode: 'split'` and `canvasSeed: 6`, captured deterministically: one page load per frame with `data-seed=6` and `data-t=<ms>` set on `nisli-neural-canvas` before it mounts, CSS animations seeked to the same time. Canvas 1200×1200, 40 fps, dark theme. MP4 master plus GIF fallback.

The visual is abstract by design: a sparse constellation behind the glass card. Five links are twins, a blue strand and a rust strand leaving the same node. When the pulse passes they separate by a few pixels, hold, and settle back with a hairline gap left. Nothing in the frame is labelled; the title supplies the words.

| Time | State | Reader learns | Motion | Hold |
|---:|---|---|---|---:|
| 0.0 s | Card with title "interp-engine, Neuronpedia's New Interpretability Engine, Tested on a Mac"; constellation at rest; twins read as single links | the subject | card entrance (CSS) | 300 ms |
| 0.3–2.4 s | pulse travels left to right; nodes brighten in its wake | there is a current through the field | pulse | — |
| 2.5–3.1 s | twins separate at the pulse: blue and rust strands part, far-end nodes glow | one line was two | ease-in 600 ms, hold 120 ms | — |
| 3.1–4.5 s | strands ease back; a hairline gap remains | they do not fully rejoin | ease-out 1,400 ms | — |
| 4.5–6.4 s | field at rest with residual gaps; title readable | the takeaway holds | none | 1,900 ms |
| 6.4 s | cross-fade to frame 0 over 400 ms | | loop seam | |

Poster frame: 0.0 s shows the title and the field, so the post works with autoplay off.

Quality gates: no clipped title lines; no scrollbars or cursor; the rust strands must survive H.264 at phone width as a visible warm tint even if the separation itself is too small to read there; muted comprehension.

Alt text: "A dark constellation of dots and thin lines behind a card titled 'interp-engine, Neuronpedia's New Interpretability Engine, Tested on a Mac'. A pulse crosses the field; a few links briefly split into a blue strand and an orange strand from the same point, then settle back with a small gap."

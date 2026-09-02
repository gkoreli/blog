# Shot list: preamble capture for X

Source: the built article page, `AddressBoardHero`, captured deterministically by seeking `document.getAnimations()` after `document.fonts.ready`. Canvas 1200×1200, 40 fps, MP4 master plus GIF fallback. Capture the figure region (the board plus the title block above it), not the whole viewport, so the hook strings stay legible after X recompression.

| Time | State | Reader learns | Motion | Hold |
|---:|---|---|---|---:|
| 0.00 s | Title, kicker, block outline, taps dim | the subject: same hook name, different tensor | none | 250 ms |
| 0.30–2.60 s | taps light in forward order; ledger rows tick | where hooks sit on a forward pass; every point has one translation | spine pulse, staggered rows | — |
| 2.90 s | `blocks.4.hook_mlp_out` leader lands on raw `mlp_out`, glyph ≠, caption "same name, different tensor" | the trap | leader draw | 1,200 ms |
| 4.10 s | leader swings to `mlp_out_post`, glyph ✓, caption "residual contribution" | the fix | leader swing | — |
| 5.00 s | legend "34 points · one name each · checked against TransformerLens and nnsight" | the scope | fade | 1,000 ms |
| 6.00 s | end; loop seam back to 0.00 s | | cross-fade over 400 ms | |

Total: about 6.4 s per loop. Poster frame: 0.00 s must show the title and the block outline so the post works with autoplay off.

Quality gates: no clipped hook strings; no scrollbars or cursor; check the ≠ glyph and the warm caption survive H.264 at phone width; muted comprehension (no sound).

Alt text: "Animated diagram of one Gemma-2 decoder block. Named hook points light up along the residual stream; a ledger shows each TransformerLens hook name. The name hook_mlp_out first attaches to the raw MLP output and is marked as a different tensor, then moves to the post-norm output and is checked."

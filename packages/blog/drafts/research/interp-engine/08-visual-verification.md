# Visual verification: OSS Radar #06

Judged by the editor from deterministic Playwright captures of the built page (`dist/oss-radar-06-interp-engine/`), dark theme, fonts loaded, animations seeked by `currentTime`. Screenshots lived in the session scratchpad and were not committed.

## Preamble (AddressBoardHero)

Desktop 1280×900, frames at 0 ms, 2,600 ms, 3,400 ms, 5,500 ms, and reduced motion:

- Pills, kicker, two-line title with the italic accent on "Tensor", subtitle, byline, and the research-artifacts link fit above the board in the first frame.
- The board reads as one Gemma-2 block: a vertical residual spine with three spine taps, two branches drawn as norm → sublayer → post norm → add, and nine named taps in monospace. Leader lines join each translated tap to its row in the "TransformerLens says" ledger. No hook string wraps.
- At 3,400 ms the argument row shows `blocks.4.hook_mlp_out` with the ≠ glyph, the warm caption "same name, different tensor", and a leader to the raw `mlp_out.4` tap. At 5,500 ms the leader has moved to `mlp_out_post.4`, the glyph is ✓, the caption reads "residual contribution", and the legend "34 points · one name each · checked against TransformerLens and nnsight" is visible.
- Reduced motion renders the final state with every tap lit and the single line `hook_mlp_out → mlp_out_post`.
- Restraint check: two accent colours (section accent and link colour), the mismatch state in the warm accent, no glow, no particles; the `::before` radial treatment matches the Bun hero.

Mobile 390×844 and 320 wide, same frames:

- First implementation (percentage-positioned diagram) collided: `mlp_out_post.4` sat on the MLP box and translations ran into the attention box. Rejected.
- Second implementation switches below 720 px to normal-flow rows: spine taps on a vertical line, branches indented, each norm, sublayer, post-norm and add step on its own row, translations under their tap labels, argument states stacked. No overlaps at 390 or 320; the board is taller than one phone viewport and scrolls, which is acceptable for a preamble.

## Article body

Element captures at 1280 and 390:

- Standfirst and stat row (34 / 35 / 6.9×) render with the labels wrapping cleanly at both widths.
- Gemma point map table: seven rows, four columns, highlighted `mlp_out` and `mlp_out_post` rows; scrolls horizontally on mobile inside its container.
- Benchmark table: five rows, four engine columns, highlighted eight-request row.
- Parity table: trimmed from seven to five columns after the first capture showed the last column clipped at desktop width; now fits at 1280 and scrolls on mobile.
- Throughput table: three rows, three engine columns.
- Callout, pull quote, section break and the Sources grid render in the shared styles with no empty cells.

Body word count from the rendered page, excluding Sources: 2,722. readTime 14 min (200 wpm, rounded up).

## X clip

Captured 256 frames at 40 fps over 6.4 s from the built page at 1200×1200 in the dark theme, plus 16 blended seam frames back to frame 0. Encoded with the launch skill's script: H.264 MP4, 1200×1200, 40 fps, 6.8 s, yuv420p, 307 KB; GIF fallback 900×900, 16.7 fps, 805 KB. Frame checks at 3.3 s and 6.5 s: title, board, ≠ caption and the resolved ✓ are legible at full size; at phone width the title and the mismatch beat read and the hook strings do not, as expected for this canvas.

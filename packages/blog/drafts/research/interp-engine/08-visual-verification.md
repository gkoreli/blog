# Visual verification: OSS Radar #06

Judged by the editor from deterministic Playwright captures of the built page (`dist/oss-radar-06-interp-engine/`), dark theme, fonts loaded, animations seeked by `currentTime`. Screenshots lived in the session scratchpad and were not committed.

## Preamble, revision 1 (AddressBoardHero, rejected)

A labelled block schematic with a TransformerLens ledger was implemented, verified at desktop and mobile, and rejected by the owner on 2026-09-01 as too literal for this publication's register ("more abstract, like the other posts"). Component removed. The desktop capture had read cleanly; the first mobile capture overlapped and was fixed before rejection. Kept here as the record of what was tried.

## Preamble, revision 2 (OssRadarHero + split canvas)

Judged from deterministic captures at 1280×900 (dark and light) and 390×844, using `data-seed=6` and `data-t` at 0, 2,900 and 4,500 ms, plus reduced motion:

- The shell is the same glass card, pills, kicker, title, subtitle and byline as issues #03 and #04; the issue #04 page was captured before and after the change and is unchanged.
- Title renders in three lines with the accent on "Tested on a Mac". Long, and it fits inside the card at 1280 and wraps cleanly at 390.
- At rest the field reads as the `flow` constellation. At the pulse peak five twin links show a blue and a rust strand parting by a few pixels with the far-end node glowing in the strand colour; two of the five sit in the visible margins on desktop. After the pulse the strands settle with a hairline gap. Nothing in the canvas is text or a box.
- Reduced motion shows the static residual frame. Two captures at the same seed and time were byte-identical.
- Restraint: no new colours beyond the theme's blue and rust accents; the effect is easy to miss unless the pulse is passing, which is the intended register.

## Article body

Element captures at 1280 and 390:

- Standfirst and stat row (34 / 35 / 6.9×) render with the labels wrapping cleanly at both widths.
- Gemma point map table: seven rows, four columns, highlighted `mlp_out` and `mlp_out_post` rows; scrolls horizontally on mobile inside its container.
- Benchmark table: five rows, four engine columns, highlighted eight-request row.
- Parity table: trimmed from seven to five columns after the first capture showed the last column clipped at desktop width; now fits at 1280 and scrolls on mobile.
- Throughput table: three rows, three engine columns.
- Callout, pull quote, section break and the Sources grid render in the shared styles with no empty cells.

Body word count from the rendered page, excluding Sources, after the opening restructure and fact-check pass: 3,349. readTime 17 min (200 wpm, rounded up).

## X clip

Revision 2 clip: 256 frames at 40 fps over 6.4 s from the built page at 1200×1200, one page load per frame with the seek attributes, plus 16 blended seam frames back to frame 0. Encoded with the launch skill's script to H.264 MP4 (1200×1200, 40 fps, yuv420p) and a GIF fallback (900×900). Frame checks at the pulse peak and at rest: title legible at full size; the rust strands survive as a warm tint at phone width.

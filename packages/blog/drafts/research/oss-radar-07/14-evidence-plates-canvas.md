# Evidence plates: the #07 background

**First design, preserved as history.** This describes the scene at `d68ae35`. The author's phone and motion feedback led to the [depth and motion revision](15-mobile-depth-and-motion-review.md); consult that record for the current design and acceptance.

Prepared September 9 UTC / September 8 PDT, 2026. Goga requested a delegated, entirely new canvas concept; his exact request is prompt eleven. The subagent `radar07_canvas` designed and implemented the scene. The parent task selected it for the candidate and reviewed the render.

## Concept

Three translucent document plates carry the same small pattern of source marks. Over an 18-second cycle they separate, hold, and return toward alignment. The source pattern remains visible on each plate. Short warm rules suggest an answer; green marks at opposing corners suggest its supporting evidence. Printer-style registration marks provide a fixed reference for the moving sheets.

This is a new scene for this publication, distinct from the existing network flow and split-link backgrounds. It does not claim to be a globally unprecedented visual technique. The scene is an illustration of retention, not a diagram of Promptfoo's actual storage or execution architecture.

The title remains on the existing quiet glass panel. Most detail sits outside that panel. On narrow screens the sheets extend into the corners while their identifying marks remain visible above and below the text. Light and dark themes use the blog's existing background, text, link, and warm accent colors.

## Implementation

- [Scene](../../../src/client/animations/evidence.ts): Canvas 2D geometry derived from time, size, and seed, with three plates and nine seeded marks per group.
- [Mount](../../../src/client/components/neural-canvas.ts): opt-in `mode="evidence"`; existing mode branches retain their behavior.
- [Article candidate](../../oss-radar-07-promptfoo.ts): selects `evidence` with seed `7`. It remains outside `posts/`.

The scene uses the existing animation runner for DPR sizing, resize, visibility suspension, deterministic capture time, and cleanup. Reduced motion selects a stationary frame at 8100 ms. The scene observes theme changes and disconnects that observer on disposal. No dependencies, image assets, Pixi migration, or production article were added.

## Review

The subagent reported passing contract checks for repeated seed/time, exact cycle-boundary equality at 0 and 18 seconds, different marks for different seeds, finite geometry at 320/390/1163 widths across five times, and observer disposal. These were focused smoke checks, not measurements of reader response or a device-wide performance benchmark.

The parent built the candidate in the existing isolated preview checkout at `/private/tmp/blog-radar07-preview` and ran the blog's type check. Desktop at 1163 pixels and mobile at 390 pixels were inspected with the actual shared hero styles. The animation's mobile stage has no horizontal page overflow. Both themes keep the title and source marks legible. A simulated reduced-motion media preference selected a stationary image, and a theme change redrew that image.

The live browser check confirmed changing canvas draw counts and image hashes, stable draw counts and image while hidden, resumed drawing when shown, and no further drawing after the component was removed. The instrumented scene reported no page errors. The integrated article also rendered `mode="evidence"` without page overflow at the available 472-pixel panel width.

Temporary review fixtures live in the isolated preview output, with their generator at `/private/tmp/radar07-canvas-qa.py`; they are not publication code. They expose canvas draw counts and image hashes so live movement, visibility suspension, and cleanup can be checked without confusing the review tool's own animation-frame requests with scene drawing. No reader study or live model experiment was run as part of this visual change.

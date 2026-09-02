# interp-engine preamble animation design (revision 2)

## Decision

Revision 1 (an `AddressBoardHero` block schematic with labelled taps and a ledger) was implemented, verified, and rejected by the owner on 2026-09-01: "more abstract, like the other posts." It is removed.

Revision 2 uses the shared OSS Radar shell, `OssRadarHero` (glass card, issue and date pills, kicker, title, subtitle, byline, "scroll to read"), exactly as issues #03 and #04 do, with a new `nisli-neural-canvas` mode named `split` behind it. The mode lives beside `flow` and `threshold` in `packages/blog/src/client/animations/neural.ts` and is selected with `canvasMode: 'split'`. No labels, no boxes, no text in the canvas. The article body carries every fact; the canvas carries one feeling: two paths that leave one point together and quietly stop being the same path.

## What the motion says

One name, two tensors. In the constellation, most links between nodes are single strands. A few are **twins**: two strands that leave the same node and arrive near, not at, the same place, one in the blue accent and one in the rust accent. At rest they lie almost on top of each other and read as one link. When the pulse that already lives in `flow` passes over a twin, the two strands separate by a small angle, hold apart for a moment, and settle back. The far ends never merge again completely; a faint gap stays. That is the whole argument: from a distance it is one line, up close it was always two.

Nothing else is added. No scan lines, no checkmarks, no particles beyond what `flow` draws.

## Composition rules

- Base: the `flow` mode's sparse network (about 30 to 40 nodes, links between near neighbours, a soft left-to-right pulse every few seconds). Reuse its node placement, link building, theme reading (`getTheme()`), pulse timing, and drawing weights. Do not fork a second copy of those helpers; extract or parameterise if needed, with `flow` and `threshold` unchanged in behaviour.
- Twins: choose 4 to 6 links whose length is in the middle of the range and whose far node is not shared with another twin. Each twin has a base strand (blue) and a shadow strand (rust) with the same origin. The shadow's far endpoint is offset from the base's far endpoint by a small vector perpendicular to the link, amplitude 0 at rest rising to about 10 to 14 px at the pulse peak on desktop (scale with `min(w, h)`), easing in over about 600 ms and easing out over about 1,400 ms; a residual offset of about 2 px remains after the first pulse and does not grow.
- Colour: strands use the theme's `blue` and `rust` at the alpha the existing links use, with the pulse raising alpha the same way `flow` does. Nodes at a twin's far end take a brief glow in the strand colour at the pulse peak. Every other node and link keeps `flow`'s muted treatment. No third accent.
- Density and calm: the lab's own bar is "atmosphere, not screensaver noise." The twins must be noticeable only when the pulse passes and easy to miss otherwise. If the effect reads at a glance as a diagram, it is too strong.
- The glass card covers the centre; twins should be placed with at least one in the visible margins on desktop and at least one likely visible on mobile (the card is narrower there).
- Theme: light and dark both, via the same theme tokens; the mode must re-read the theme when it changes like `flow` does.
- Reduced motion: draw one static frame with the twins at their residual 2 px separation and no pulse.
- Performance: no more work per frame than `flow` plus a handful of extra line segments.

## Deterministic capture for the X clip

The clip captures the hero, so the canvas must be seekable. Add an optional `data-seed` attribute on `nisli-neural-canvas` (passed through `OssRadarHero` as an optional `canvasSeed` prop) that, when present, seeds the node placement with a small deterministic PRNG instead of `Math.random`, and an optional `data-t` attribute that, when present, renders the frame for that time in milliseconds and stops (no rAF loop). Both default to absent and change nothing for readers. This keeps frame capture exact without wall-clock timing. If the runner's structure makes `data-t` awkward, expose a `window.__gkoreliCanvasSeek(ms)` hook on the element instead and document it in the component comment.

## Post wiring

`packages/blog/posts/022-oss-radar-06-interp-engine.ts` `preamble()` returns `OssRadarHero({ issueNum: 'Issue #06', date: 'September 2026', tags: 'open-source · interpretability · inference · steering', title: html\`<h1>Same Hook Name, Different <em>Tensor</em></h1>\`, subtitle: 'Two tensors shared one name. interp-engine names them apart and checks the names.', author: 'Goga Koreli', readTime: '15 min read', canvasMode: 'split', canvasSeed: 6 })`. The `OssRadarHero` props need `canvasSeed?: number` added.

Remove `AddressBoardHero` entirely: the component directory, its CSS import in `src/styles/components.css`, and its export in `src/components/index.ts`.

## Verification

- `pnpm typecheck`, `pnpm -C packages/blog build`, `git diff --check`.
- Playwright screenshots at 1280×900 and 390×844 in dark and light themes at t = 0, at a pulse peak, and after the pulse; plus reduced motion. Confirm: the card, pills, title and byline match issue #04's shell; twins are visible in the margins; nothing in the canvas is text or a box.
- Frame-capture check: with `data-seed` and `data-t`, two captures at the same t are pixel-identical.

# Bun 1.4 immersive article visual verification

Research artifact for TASK-0096 / FLDR-0006.

## Preview baseline

- Article: `packages/blog/posts/021-oss-radar-05-bun-1-4.ts`
- Preamble: `BunFusionHero`
- Local route: `http://localhost:3000/oss-radar-05-bun-1-4`
- Check date: 2026-08-26 America/Los_Angeles
- Build at first visual pass: 21 posts, successful
- Browser console at first visual pass: no warnings or errors

## Semantic and static checks

- Exactly one rendered `h1`: “Bun 1.4 Made the Runtime the Dependency.”
- The preamble `figure` has a single explanatory accessible name rather than exposing fifteen decorative rows as unrelated images.
- All fifteen package-job mappings are present in the server-rendered HTML and visible DOM.
- The complete Zig-to-Rust core statement is present in the server-rendered HTML.
- The built `.md` endpoint has one H1, the lede, headings, tables, verdict, source claims, source rationales, and links. The CSS-only preamble is intentionally omitted from the Markdown body because the title and article carry its thesis.
- The preamble has no custom-element registration and needs no client JavaScript. Its complete static state is emitted by the TypeScript SSG path.
- `prefers-reduced-motion: reduce` disables every preamble animation, hides the transient zipper, and explicitly restores the package strike lines, seam locks, funnel, and Rust-core end state.

## Responsive and theme checks

### Default desktop viewport, light theme

- The issue/date pills, kicker, two-line title, subtitle, byline, and top of the dependency ledger fit in the initial frame.
- Text and border contrast are legible; the dependency ledger remains subordinate to the title.
- The initial-frame screenshot showed the zipper sequence as a struck package ledger converging on Bun-native surfaces.

### 390 × 844 viewport, light theme

- Document width: 390 px client and 390 px scroll; no horizontal page overflow.
- Article width: 354 px client and 354 px internal scroll width.
- Preamble width: 390 px; total preamble height about 1,170 px because all fifteen mappings remain readable rather than being hidden on mobile.
- Title wraps to three deliberate lines; kicker, byline, package names, and Bun surfaces remain readable.
- The narrow layout retains all fifteen rows and the one-binary core instead of replacing the argument with a decorative crop.

### 390 × 844 viewport, dark theme

- Signal rust, Bun-surface green/blue, neutral type, seams, and nested core remain distinct.
- Computed pill colors were `rgb(192, 90, 46)` and `rgb(154, 149, 137)`, both visible at opacity 1.
- The nested binary and Rust label stay legible against the dark surface.

## Content rendering checks

- The five-row dependency-boundary table renders as a semantic table.
- The Bun.Terminal trace renders as an ordered, labelled four-step flow.
- Both evidence-boundary tables, pull quotes, migration gates, Sources block, internal series link, feedback link, and afterword render.
- The rendered article body before Sources contains 1,661 whitespace-delimited words. At the publication's existing read-time convention, the nine-minute label is appropriate.

## Final footprint freeze check

The final build includes the frozen research footprint in two places:

- The preamble shows `47 min · 4 sessions · 9 artifacts · 58.6M measured tokens` as a compact anchor. It stays on one readable line at the default desktop width and within the 390 px mobile frame.
- The full `#research-footprint` section shows the four headline values, planning envelope, exact input/output/cache/reasoning breakdown, measurement timestamps, zero-prompt OSS Radar rule, methodology, and private-log limitation.
- The compact anchor moves to the full disclosure on the same page.
- Evidence-directory and manifest links are distinct and labelled.
- The dark-theme footprint card and muted limitation copy remain legible.
- The final 390 × 844 screenshot retained the title, footprint line, and ledger without visual horizontal clipping.
- The final browser console remained free of warnings and errors.

Final verification commands:

```console
pnpm -C packages/blog typecheck
pnpm -C packages/blog build
git diff --check
```

Typecheck and production build passed. `git diff --check` is rerun after every final artifact edit and must remain green at release handoff.

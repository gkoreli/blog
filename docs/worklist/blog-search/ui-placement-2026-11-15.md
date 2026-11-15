# Compact search placement

November 15, 2026. A bounded presentation follow-up to completed [search v0.2](v0.2.md) and the [publication reading layout](../site-design-system/README.md). Retrieval policies and frozen research results are unchanged.

## Change and acceptance

The full-width bordered search link looked like a form field among the left navigation links. Returning keyboard focus to it emphasized that large frame. Replace it with the shared search glyph and a compact 44px target, retaining visible keyboard focus.

- Wide editorial pages put the icon in the right gutter, above article contents where an outline exists. One sticky container owns both controls and outline scrolling.
- Narrow desktop pages and dense reports use an icon beside the Contents label. Mobile uses the existing header position. There is one visible launcher at each layout breakpoint, including 768px.
- Every placement uses the same native `/search` link, accessible name, platform-specific shortcut tooltip and existing dialog enhancement. Cmd/Ctrl+K, Escape/query retention and focus return continue to work. The right rail precedes article links in DOM/keyboard order; the focus ring stays inside its compact target.

## Checks and delivery

Local implementation and final visual review are complete. Workspace typechecks passed in a freshly installed isolated checkout; the shared checkout had stale dependency links for an already-declared parser dependency. The first focused test command used the wrong working directory and could not load tsx; the corrected package-scoped run passed three existing reading/design checks. Markdown validation passed and the isolated production build rendered all 46 posts.

Own-browser checks exercised the real click/search/Escape flow at 1280px, Tab from the theme control to search, light/dark rendering, mobile keyboard activation, and article outline navigation kept the shared right rail at 32px after scrolling. CSS viewport fixtures at 390, 768, 769, 1199, 1200 and 1440px, plus report layouts at 390/1280px, showed one visible 44px launcher, no search row inside the left link list, and no document overflow. These are layout fixtures, not physical-device performance tests. An iframe automation click had a coordinate/outer-scroll limitation; pointer interaction was verified on the ordinary page instead.

Pending: scoped source push, automatic activation and fresh live acceptance. Raw screenshots and operational logs remain outside Git. The supplied feedback is summarized here; its source message and attachment are not copied into public evidence.

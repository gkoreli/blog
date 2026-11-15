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

Source `a48959c2be3c9cb0e4b4fad00e5ace1e0ac9a603` was pushed directly to main. Automatic build `5977a0a6-de5c-44ac-a50f-da9f3a5afaa1` succeeded and activated Worker `176526d1-5222-4ca7-82b5-30ca00d0d634` at 100% on November 15 at 15:47:25 UTC.

The [acceptance receipt](ui-placement-2026-11-15.json) separates local checks from current public HTML/CSS and the live browser flow. The deployed stylesheet exactly matched the locally reviewed stylesheet. Live markup removed the left navigation search row and placed the right utility before the article in DOM order. At 1280px the actual browser showed one 44px right-side launcher; click and Cmd+K opened search, a word query returned five articles, and Escape returned focus to the compact icon. The wide 1440px fixture showed the icon above article contents with the article still centered. No retrieval-quality or physical-device claim is added.

Accepted correction is complete. Raw screenshots and operational logs remain outside Git; the live screenshot is hashed in the receipt. Concurrent Radar research changes and other sessions' servers were preserved. Subsequent evidence-only bookkeeping is separate from this functional activation.

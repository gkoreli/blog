# Inline invitation: interaction study

November 10, 2026. The owner prefers the inline direction and flagged its small click target. This follows the [two smaller refinements](README.md#smaller-refinements); it is local design work, not production acceptance or a reader-use experiment.

## Finding

The previous inline card looked like one interactive surface, but only its bottom link row responded. Making the layout compact had left the title, illustration and padding inert. A larger button alone would preserve that mismatch.

Baseline `7e6cc96c`, inspected in the local in-app browser at a **549 CSS px viewport**: card **513.1 × 120.3 CSS px**, native link row **380.9 × 44.0 CSS px**. A 3 × 3 interior sample at x = 10/50/90% and y = 15/50/85% found the native link at **2 of 9 points**. This is a hit-test sample, not an area percentage or a usability outcome. The [preserved markup](previous-inline.html) and [isolated styles](previous-inline.css) reproduce that component without inheriting its replacement's interaction rules.

## Source study

| First-party source | Relevant guidance | Decision here |
| --- | --- | --- |
| [W3C target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) and [enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced) | WCAG 2.2 AA uses a 24 × 24 CSS px minimum with exceptions; the enhanced AAA criterion uses 44 × 44 with exceptions. | The old row already had 44px height. Minimum size does not resolve the inert surface that visually belongs to it. |
| [Scottish Government navigation cards](https://designsystem.gov.scot/components/card#navigation-card) | When a card has one destination, use a navigation card with a full-surface link. Keep other interactive controls out of it. Hover and focus signal the navigation. | This invitation has one destination, `/tools`, so its artwork, text and padding should share the same target. |
| [NHS card component](https://service-manual.nhs.uk/design-system/components/card/) | Keep cards short and scannable; avoid making all their contents the link label. | Retain a concise native link rather than enclosing all the prose in its accessible name. |
| [Heydon Pickering: Cards](https://inclusive-components.design/cards/) | A positioned link pseudo-element can cover a card without JavaScript. Focus and hover should reflect the same surface. Covering prose makes text selection harder. | Use one ordinary link with a CSS cover and a full-card keyboard outline. Accept the selection tradeoff for this short navigation teaser; don't generalize it to article bodies or cards with multiple actions. |

## Refinement

- Keep the inline proportions and the existing small illustration.
- Extend the native link across the complete card. Keep one tab stop and the short name “Open the workbench.”
- Make the link label a little larger and visibly underlined. Give the arrow a quiet outline so the action is easier to recognize before hover.
- Apply hover, focus and pressed feedback to the whole surface. Put the keyboard outline around the complete hit area.
- Use HTML and CSS for navigation, including keyboard activation, modifier-click and the normal link menu. No container click handler, nested links or `role="button"`.
- Preserve reduced motion and both themes; keep the example in Design Language aligned with the homepage.

## Verification

Fresh checks used the actual built homepage component in the local in-app browser. The first reload retained an older stylesheet: computed layout was still block-based and the new link cover was absent. That failed 3-of-9 check was a mixed-version preview, not acceptance of the new code. Preview pages now include the built stylesheet's content revision (`271a46c9508b` in this pass). The current review is at `/_design/homepage/current-inline/`; theme overrides are preview-only and do not save a reader preference.

The browser's existing 110% zoom was preserved. Temporary viewport overrides were adjusted to the effective CSS width and reset afterward.

| Effective viewport, CSS px | Card, CSS px | Interior link hits | Links in card | Horizontal overflow |
| --- | --- | --- | --- | --- |
| 320 | 284.0 × 137.5 | 9/9 | 1 | None |
| 393 | 357.6 × 139.0 | 9/9 | 1 | None |
| 549 | 513.1 × 120.3 | 9/9 | 1 | None |
| 1280 | 728.0 × 120.3 | 9/9 | 1 | None |

At the same 549px viewport the card retains the prior **120.3px height**, while all nine sampled points now reach the native link. Three points just outside its boundary do not. Actual clicks on the illustration and outer padding both navigate to `/tools`. Keyboard Tab from the featured article reaches the one card link, shows an outline around the complete target, and Enter opens `/tools`. The accessibility tree retains the short name “Open the workbench.” The dark theme also passed the nine-point check; its focus state was captured as a private session image.

The in-chat sandbox wrapper was checked independently: refined target **9/9**, preserved prior target **2/9** at the same sample positions. The carousel changes between the actual component and its historical snapshot. Workspace typecheck, referral-policy verification and an isolated 44-post production build passed. These are local functional and layout checks, not a human usability study, cross-browser certification or evidence of production activation.

The owner prefers inline as the current direction. The overall design remains in review; the next bounded step is feedback on the enlarged target and its visual affordance.

**November 11 selection:** the owner chose Refined inline as the version to keep. The [design study](README.md#selected-version--november-11) tracks delivery of this accepted component separately from the preceding local checks.

**November 11 delivered:** [fresh production acceptance](../../drafts/research/ai-site-audit/2026-11-11-homepage-invitation-acceptance.json) verifies the served component, matching stylesheet and live pointer/keyboard behavior after source `3134918f` deployed. The selected interaction is now the publication baseline; the earlier alternatives remain historical review artifacts.

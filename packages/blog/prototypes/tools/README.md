# Tools page design studies — November 11, 2026

Current status: Compact tiles is selected and implemented through the shared production component, with decorative navigation arrows removed. The [implementation record](#selected-implementation--november-11) supersedes the pending decisions in the earlier study rounds below.

The owner requested prototypes for `/tools` after selecting the refined inline homepage invitation. These studies explore the tools directory, retaining that direction’s compact illustrations, quiet surfaces, and full-surface native links. The existing tool implementations, scoring and allowance policies are unchanged.

| Direction | Main interaction | Tradeoff |
| --- | --- | --- |
| Workbench | Enter a page URL immediately; three illustrated rows lead deeper | Fastest entry to a page check; other tasks follow the form |
| Tool library | Four illustrated tool destinations, with a saved report below | Makes the whole kit visible; checking a page needs navigation |
| Task chooser | Choose a question and reveal its tool, explanation and action | Less simultaneous information; adds a choice before entry |

Tool library was the proposed starting point for the first review. The owner subsequently selected that direction and requested smaller cards, further study and iteration; see [compact refinements](#compact-refinements--november-11). All four destinations remain available without JavaScript. The task chooser renders all its sections before enhancement, then shows one selected section. Each destination tile has one concise native link expanded over the full surface; forms and secondary actions are separate.

## Reproduce

Branch: `codex/tools-page-prototypes-20261111`, based on `b2d6e9b7`.

Worktree: `/private/tmp/gkoreli-tools-prototypes-20261111`.

Build the publication in this isolated worktree, then generate the study routes:

```sh
pnpm install --offline --frozen-lockfile
pnpm -C packages/blog build
node packages/blog/prototypes/tools/build.mjs
python3 -m http.server 4178 --bind 127.0.0.1 --directory packages/blog/dist
```

Open `http://127.0.0.1:4178/_design/tools/`. The local comparison supports desktop 1280px and phone 393px/320px widths, light/dark appearance, and opening each page in the real publication shell. The generator versions its styles to avoid stale cached previews. These routes are produced only by the explicit study generator; the normal publication build excludes them.

`render-inline.mjs <absolute-output-path>` creates the in-chat comparison from the same markup, styles and behavior. Its presentation controls change appearance, preview width and corner radius without changing publication preferences.

## Prototype boundaries

Forms normalize a domain or HTTPS URL and give local feedback. They never request the target or consume an allowance. They link to the existing live checker for actual use. This lightweight preview validation is not a replacement for the checker’s full target policy. No new audit result, score or request measurement is depicted. Without scripts, the form navigates to the checker using GET, not an audit-admitting POST.

The labels preserve the current service model: page checks and request inspection share ten checks per network address per UTC day; robots and comparison run locally. Existing saved-report links use no allowance. Illustrations describe documents, rule branches, before/after evidence and request fields; their marks are not measured outcomes.

## Local acceptance

- Isolated publication build: 45 posts; referral-policy verification passed. No public Turnstile configuration was copied into this checkout.
- Generator and inline fragment rendered successfully; JavaScript syntax checks passed.
- Actual generated pages inspected at 1280px and 393px in light appearance, and all three at 320px in dark appearance. The 320px review exposed a footer selector incorrectly affecting arrow spans; it was corrected and all three returned no horizontal overflow.
- Library’s first tile: one link, nine of nine sampled interior hit positions; keyboard focus outlines the full tile. Clicking a robots illustration opened the actual local robots route.
- Task selection changes the visible panel and native destination; the local form and in-chat click/Enter paths normalize the entered URL and display the no-request preview state. No remote audit was run.
- In-chat comparison uses the same product typography, all three directions and native carousel controls. Phone/desktop and appearance controls are presentation-only.

These are local design and interaction observations, not owner selection, production activation or reader-use evidence. Source is retained on the design branch; no main integration or deployment is part of this prototype request.

The first-round comparison is retained for history. The broader [tools exploration](../../drafts/research/ai-site-audit/02-tools-product-exploration.md) retains the implementation and production evidence for the current tools.

## Compact refinements — November 11

The owner likes Tool library and finds its cards too large. The [design-language study](design-language-study.md) records the heuristic review, primary references, two smaller versions and measured comparison with the frozen first-round library. It also specifies a proposed family of compact choices, illustrated rows and single-destination invitations. The accepted homepage invitation remains unchanged.

The lab now opens Compact tiles and also offers Illustrated rows, the working Navigation patterns sheet and the previous round. The in-chat refinement comparison is generated with:

```sh
node packages/blog/prototypes/tools/render-inline.mjs /absolute/path/compact-tool-library.html --compact
```

All execution stays in the existing tools; the new designs contain native links and no simulated forms. Compact tiles is the proposed refinement, not an accepted final design. Production code and the publication build pipeline remain unchanged. Next bounded action: choose between compact tiles and illustrated rows, refine if needed, then promote the selected component and its Design Language example together.

Refinement acceptance: all three library versions were measured in the actual generated shell at 1280px, 393px and 320px, with no horizontal overflow. The new description text is 14px, including on phones. Each of the four compact tiles at 393px and each of the four illustrated rows at 320px had one link and nine of nine sampled interior hits. Keyboard Tab showed a 2px full-surface outline; Enter opened the real local robots route. The in-chat comparison was inspected at phone and desktop sizes with its named variant picker, native destinations, thumbnail drawings and 16px initial padding. It has presentation controls for appearance, width, padding and illustrations. These checks do not admit hosted audits.

## Selected implementation — November 11

Compact tiles is the selected directory layout. Its single-destination behavior now comes from [navigation-choice.ts](../../src/templates/navigation-choice.ts) and [navigation-choice.css](../../src/styles/navigation-choice.css); the directory and Design Language share those components and the real [tool catalogue](../../src/pages/tool-catalogue.ts). The earlier arrow glyphs were removed. Underlined titles, restrained hover/active states and a full-surface focus outline communicate navigation.

Design Language includes compact choices, illustrated rows and the existing homepage invitation, plus the utility icon family. Utility glyphs now use a 24-unit grid, consistent 1.5-unit round strokes and one inherited color. The menu and theme controls use the same assets and helper as the reference page. Technical drawings and brand marks retain their distinct roles. The homepage invitation and tool entry actions also drop decorative arrows.

The directory navigates to the existing tools rather than submitting an audit from its overview. The checker keeps its native script-free POST form, and saved reports remain available without allowance. Quota, scoring and request behavior are unchanged.

Local checks: workspace typecheck, 34 Markdown validations, 442 blog tests, referral-policy verification, private-prompt guard and an isolated 45-post publication build passed. The checkout had no Turnstile build configuration. Browser checks cover native targets and keyboard activation, menu/Escape behavior, theme glyphs, mobile and desktop layouts, and both Design Language sections. Source delivery and current production acceptance are recorded separately in the tools worklist.

Published as `41aeceb3` through successful Cloudflare build `47f0957e-84c2-44d6-a1f4-76010c54ada0`. The [fresh production receipt](../../drafts/research/ai-site-audit/2026-11-11-compact-tools-acceptance.json) verifies served identity and assets, actual native pointer/keyboard destinations, shared Design Language patterns and the menu/icon changes. The selected implementation is delivered. The earlier prototype routes remain unpublished; broader reader outcomes remain unmeasured.

# Homepage tools design study

November 10, 2026 · Base `693efd2e` · Local review on `design/homepage-tools-prototypes-20261110`.

**Selected November 11:** the owner chose **Refined inline** as the current homepage version. It keeps the compact illustrated layout, one native link covering the whole card, and matching keyboard focus. This closes the requested design iteration; delivery and fresh production verification are recorded separately below.

The tools strip on the homepage reads like an aside: two rules enclose a sentence and a link, the destination is generic, and the arrow can render as an emoji on iOS. Keep the featured story and the article stream. Give the tools their own visual shape, with illustrations that show what the tools do.

| Direction | What a reader can do | Tradeoff |
| --- | --- | --- |
| Field kit | Open the workbench from one illustrated invitation. | Strongest editorial fit. Individual tools are one more step away. |
| Tool shelf | Go directly to the access check, robots playground, or report comparison. | Best direct discovery. Three destinations need more visual attention. |
| Interactive lens | Switch between illustrated task previews, then open a tool. | Most expressive. Adds a choice and takes more vertical space. |

The owner selected **Field kit**, presented as “One clear invitation,” on November 10. It is now implemented in the actual [homepage component](../../src/pages/home-tools-invitation.ts) in this worktree. The same component appears in the [Design Language page](../../src/pages/design-language.ts) as an illustrated invitation pattern. The other two concepts remain available for comparison.

## Run locally

From the dedicated worktree, using the repo's pinned Node and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm -C packages/blog build
node packages/blog/prototypes/homepage/build.mjs
python3 -m http.server 4177 --bind 127.0.0.1 --directory packages/blog/dist
```

Open [the updated homepage preview](http://127.0.0.1:4177/_design/homepage/current-inline/) or [the comparison lab](http://127.0.0.1:4177/_design/homepage/). Use the lab's width and theme controls, or open an individual prototype. Its Field kit entry now uses the actual homepage component; the other variants replace exactly one tools section. Preview pages version the built stylesheet URL to prevent stale CSS from contaminating review. The lab files are generated separately after the normal site build and stay out of the regular publication routes and sitemap. The local static server can serve tool pages and their browser-only workflows; it doesn't run Worker endpoints. Diagrams illustrate tasks without claiming measured results.

For the compact in-chat comparison, run `node packages/blog/prototypes/homepage/render-inline.mjs <fragment-path>` after building the blog. It uses the same component markup and CSS with the featured and first stream entries as context.

## Review checkpoint

The initial isolated 44-post build, workspace typecheck, and 33 Markdown validations passed. Chrome review exercised the lab's dark/light palette, 393px and 320px mobile widths, 1280px desktop mode and variant picker, click and arrow-key navigation in the lens, and the in-chat comparison in its sandbox wrapper. All three destinations in the lens are ordinary links in initial HTML; with scripts disabled the previews remain visible as a list.

The first integration retained the design's drawing, copy and single destination. Its scoped CSS owns the homepage treatment instead of the checker stylesheet. Supporting text has stronger contrast, focus shares the action's hover treatment, and reduced motion preserves a still illustration. The shared example has its own heading ID. No production deployment or new access check is part of this design review.

### Smaller refinements

The owner liked the direction but asked for a smaller component and further iteration before treating it as final. The [refinement lab](http://127.0.0.1:4177/_design/homepage/refinements/) compares two proportions: Compact invitation keeps a separate action row; Inline invitation moves the smaller illustration to the left and brings the action below the copy. Both remove the repeated kicker, mark and capability list, and use “From notes to tools” with a short task description. At that checkpoint Compact was the worktree review baseline; neither refinement was recorded as final. The interaction study below supersedes that baseline.

Generate the two-version in-chat comparison with `node packages/blog/prototypes/homepage/render-inline.mjs <fragment-path> --refinements`. The isolated 44-post build, full workspace typecheck and initial 33-post validation pass. Local review checked both new proportions in light and dark and exercised the lab at 320px. The gap before the stream is also reduced so the smaller component brings the writing higher. Next: owner feedback on size, hierarchy and placement, then another bounded refinement or requested delivery.

### Interaction study

The owner prefers Inline invitation and requested a study of the small click target. The [interaction study](interaction-study.md) records the primary sources, measured prior target, selected approach and verification. The worktree homepage now follows the inline direction with one link covering the full surface. The earlier two layouts use preserved markup and styles so their historical interaction remains inspectable. Generate the before/after preview with `node packages/blog/prototypes/homepage/render-inline.mjs <fragment-path> --interaction-study`. This remains a design review, with no production activation.

### Selected version — November 11

The owner selected the refined version after reviewing the full-card target. The accepted component was integrated with `main` at `161d62d2` in an isolated release checkout. Fresh workspace typecheck, 33 Markdown validations, referral-policy verification and a 44-post production build passed. The built homepage and Design Language page contain the component, and the normal publication output contains no prototype routes. The original alternatives and interaction study remain inspectable here.

Delivered to main as `3134918f610b4f7acda4deeef56ce0aa19bca09f`. Cloudflare build `60b619b8-40e8-4f87-9650-12cb0a55f8e3` completed successfully. [Fresh acceptance](../../drafts/research/ai-site-audit/2026-11-11-homepage-invitation-acceptance.json) associates the served homepage, tools directory and Design Language example with that client build. The served stylesheet is byte-identical to the checked build; the arrow is served, Markdown discovery remains available and the prototype route returns 404. The public browser verifies all nine sampled interior positions, an actual artwork click, full-card keyboard focus and Enter navigation to `/tools` at a 550px viewport. No scan or form submission was made.

The requested selection and release are complete. Reader use and further design work remain future observations, not pending requirements for this delivery.

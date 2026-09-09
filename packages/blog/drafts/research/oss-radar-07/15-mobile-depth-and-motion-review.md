# Mobile depth and motion revision

September 9 UTC / September 8 PDT, 2026. Follows [the first canvas design](14-evidence-plates-canvas.md), committed at `d68ae35`. Goga reviewed the actual preview and found the phone composition weak and the movement too slow to register as animation. He asked for richer depth, a more three-dimensional appearance, and faster or more responsive motion. His exact feedback is prompt twelve.

## What the feedback changed

The first review established that the canvas fit the viewport, retained readable text, and handled its lifecycle. Those checks did not establish that the visual composition was compelling or that a reader would notice the movement. The 18-second separation cycle and large, mostly concealed flat sheets did not meet the author's intent.

The animation subagent owns the revised projected geometry and motion. The parent owns the evidence-mode hero composition and rendered acceptance. The retained idea is a repeated source signature across records. The presentation changes to compact stacks with perspective, thickness, cast shadows, and a much shorter separation/registration cycle.

On phones, the title panel has side margins, reduced padding, smaller spacing, and clear space above and below. The issue/date labels have opaque theme backgrounds so moving source marks cannot show through their text. Its height follows the content so short screens can scroll without clipping the title or byline. Those rules apply only to the evidence scene. The other Radar backgrounds retain their existing composition.

The visual is illustrative. Projected three-dimensional coordinates rendered with Canvas 2D do not introduce a WebGL renderer or a claim about Promptfoo's physical or logical architecture.

## Acceptance criteria

- Visible depth and motion shortly after the hero appears; no long initial hold.
- A separate phone composition with substantial exposed geometry above and below the title.
- Readable title, subtitle, source marks, and research link in both themes at 320/390-pixel widths.
- Repeatable seed/time capture and an intentional static reduced-motion frame.
- Bounded geometry, correct face/stack drawing order, and no new dependencies.
- Existing type/build checks, real browser review, and confirmation that visibility suspension and cleanup still work.

The article remains an unpublished candidate. This change does not run or complete the separate real-answer capture experiment.

## Implemented revision

Two three-card stacks use projected coordinates for their faces, printed marks, thickness, and edges. Cards draw from far to near. Continuous tilt and a damped closing movement make the depth visible. The nominal cycle is six seconds at the shared runner's ideal 60 fps, replacing eighteen seconds; reduced motion selects the 1800 ms composition. Timing follows the shared runner's frame counter, so this is not a measured six-second guarantee on a slow device.

The phone composition places stack centers at 32% width / 12% height and 70% width / 88% height. The title panel leaves 18 pixels on each side. At 390×844, its measured height fell from the provisional 416 pixels to 367 pixels after typography and spacing changes; its title is 26.52 pixels and subtitle 15.84 pixels. At 320×568, the hero is 740 pixels high, the panel is about 419 pixels high, and the title is 26.1 pixels. The short viewport scrolls normally. Both widths had document width equal to viewport width.

This revision makes the autonomous movement quicker. It does not add pointer or touch controls.

## Verification method

The isolated preview checkout contains this candidate temporarily as post 026. The working repository still keeps the candidate in `drafts/`. The production build completed for 26 posts, and both client and worker type checks passed.

The animation subagent ran an inline Node/tsx smoke check against the module with mocked theme access and a Canvas2D operation recorder. Widths were 320, 390, 619, 620, 1163, and 1920; ticks were 0, 30, 60, 108, 180, 240, 330, 360, and 720. It reported finite geometry, valid opacity, repeated operations for a fixed seed/size/time, different signatures for seeds 7 and 8, exact equality at ticks 0 and 360, and observer cleanup. Maximum sampled path-vertex displacement over the first 60 ideal ticks was 30.5 pixels at 390×844 and 39.2 pixels at 1163×900. The temporary inline check was not retained; these results describe a smoke check, not a reproducible benchmark or device frame-rate measurement.

The parent reviewed the actual production bundle in browser fixtures with fixed iframe dimensions. The fixture uses the real hero markup, production stylesheet, and canvas bundle; its extra controls and drawing counters are local review instrumentation. Its reduced-motion case mocks the JavaScript media query before mounting the component; it does not emulate the operating system's CSS media preference. The evidence-specific CSS rule disabling entrance effects under reduced motion was inspected separately.

## Browser results

- The 390-pixel light and dark compositions show substantial card geometry above and below the compact title panel. The 320-pixel composition preserves the same hierarchy in both themes; the dark check used a 568-pixel viewport and the light check exposed the full 740-pixel hero. The desktop composition places the stacks on opposite sides of the panel.
- Live drawing counts and image hashes changed between observations. The browser reported no page errors in the reviewed fixtures.
- After explicitly verifying that the hero was hidden, drawing count stayed at 2767 and the canvas hash remained unchanged across observations. Showing it resumed drawing. Removing the component left zero canvas hosts, and its draw count stayed at 4228. An earlier visibility sample did not verify the hidden state and was discarded.
- The mocked reduced-motion case at 390×844 stayed at 216 draws with an unchanged hash across observations. Theme switching redrew the selected composition in light colors, then remained static at 324 draws with an unchanged hash. Those draw counts include the shared runner's seek simulation and initial resize, not continuous reduced-motion animation.

The review establishes layout, visible motion, deterministic geometry, and lifecycle behavior in the desktop browser. It is not a physical-phone performance measurement or a substitute for the author's judgment of the visual. Goga's initial design rejection remains in the record even though the earlier technical checks passed.

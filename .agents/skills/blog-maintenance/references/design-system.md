# Design System

Use [shared tokens](../../../../packages/design/tokens.css), [layout CSS](../../../../packages/blog/src/styles/layout.css), and the [page shell](../../../../packages/blog/src/templates/page.ts). Decision rationale is in [ADR-0007](../../../../docs/adr/0007-navigation-and-layout.md), [ADR-0009](../../../../docs/adr/0009-layout-system.md), and [ADR-0013.1](../../../../docs/adr/0013.1-publication-visual-layer.md).

## Layout

- Keep sidebar navigation visible on articles and other pages using the shared shell. Pass `currentSection` so articles highlight their section.
- Use the centered grid `1fr minmax(0, var(--content-max)) 1fr`. The sidebar sizes to content and aligns right inside `.sidebar-wrapper`; the opposite column balances it.
- The sticky sidebar uses section spacing. Preserve its header, navigation, follow links, and social controls.
- At 768px the shell becomes one column with a mobile header and burger menu. Components may have additional breakpoints. Prefer intrinsic sizing where possible.
- The burger menu must support Escape, scroll locking, and `aria-expanded`.
- The homepage shows a featured article followed by a chronological stream. `/about` holds the biography, projects, and contact links.
- Preserve the sidebar tagline: “Where excitement ends, depth begins.”

## Typography and color

- Use Lora with a Georgia fallback for body text. Use monospace for code and compact UI metadata. Keep body line height at least 1.7 and headings tighter.
- Use the same typography in both themes. Honor saved theme preference, then system preference; light is the base CSS palette.
- Light background: `#faf8f5`; dark background: `#1a1a1a`. Light-theme text: `#2d2a24`; muted text: `#7a7568`. Preserve readable contrast when changing colors.
- Link accent: `#1a6b4e` in light mode and `#6ec9a8` in dark mode.
- Brand gradient: `#1a6b4e` → `#6ec9a8` at 60% → `#93c5fd` at 100%. Reserve the sky-blue color for the gradient; use named section tokens for other accents.
- Section accents are warm gold for Essays, blueprint blue for Engineering, and rust for OSS Radar.

## Code and controls

- Highlight code at build time with Shiki's `github-light` and `github-dark` themes and `defaultColor: false`. CSS selects the inline theme variables from `data-theme`; do not add client-side highlighting or re-render code to switch themes.
- Give code blocks enough width and padding to read comfortably within the content column.
- Use SVG icons from `public/icons/`, not emoji. Social buttons are 28×28px. The two-button theme control uses an active sliding thumb; [theme-toggle.css](../../../../packages/blog/src/styles/theme-toggle.css) defines its treatment.
- Use the sparkle separator between appropriate publication areas. Tags render as `#hashtags`, with the gradient on the hash, rather than badges.
- Add motion only when it helps comprehension. Preserve readable content before interactive components load.

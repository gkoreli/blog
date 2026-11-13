# Design System

Use [shared tokens](../../../../packages/design/tokens.css), [layout CSS](../../../../packages/blog/src/styles/layout.css), and the [page shell](../../../../packages/blog/src/templates/page.ts). Decision rationale is in [ADR-0007](../../../../docs/adr/0007-navigation-and-layout.md), [ADR-0009](../../../../docs/adr/0009-layout-system.md), and [ADR-0013.1](../../../../docs/adr/0013.1-publication-visual-layer.md).

## Layout

- Keep sidebar navigation visible on articles and other pages using the shared shell. Pass `currentSection` so articles highlight their section.
- Use the centered grid `1fr minmax(0, var(--content-max)) 1fr`. The sidebar sizes to content and aligns right inside `.sidebar-wrapper`; the opposite column balances it.
- The sticky sidebar uses section spacing. Preserve its header, navigation, follow links, and social controls.
- Keep project links on About, with Design Language and Animations Lab under its site-exploration section. Preserve the Nisli footer credit. [ADR-0018](../../../../docs/adr/0018-nisli-ssg-and-publication-navigation.md) records the placement decision.
- At 768px the shell becomes one column with a mobile header and burger menu. Components may have additional breakpoints. Prefer intrinsic sizing where possible.
- The burger menu must support Escape, scroll locking, and `aria-expanded`.
- The homepage shows a featured article followed by a chronological stream. `/about` holds the biography, projects, and contact links.
- Preserve the sidebar tagline: “Where excitement ends, depth begins.”

## Typography and color

- Tool interfaces use the publication’s Lora for editorial text and monospace for controls, numbers and metadata. Scope sizing and spacing to `.tool-app`; do not inherit article spacing through `.post-content`. Prefer typographic hierarchy, open rows and neutral horizontal rules over nested cards. Do not add colored left-border callouts. Quota exhaustion is a neutral state with a reset time and useful next actions.
- Use Lora with a Georgia fallback for article body text. Use monospace for code and compact UI metadata. Keep body line height at least 1.7 and headings tighter.
- Use the same typography in both themes. Honor saved theme preference, then system preference; light is the base CSS palette.
- Light background: `#faf8f5`; dark background: `#1a1a1a`. Light-theme text: `#2d2a24`; muted text: `#7a7568`. Preserve readable contrast when changing colors.
- Link accent: `#1a6b4e` in light mode and `#6ec9a8` in dark mode.
- Brand gradient: `#1a6b4e` → `#6ec9a8` at 60% → `#93c5fd` at 100%. Reserve the sky-blue color for the gradient; use named section tokens for other accents.
- Section accents are warm gold for Essays, blueprint blue for Engineering, and rust for OSS Radar.

## Code and controls

- Highlight code at build time with Shiki's `github-light` and `github-dark` themes and `defaultColor: false`. CSS selects the inline theme variables from `data-theme`; do not add client-side highlighting or re-render code to switch themes.
- Give code blocks enough width and padding to read comfortably within the content column.
- Use SVG icons from `public/icons/`, not emoji. Social buttons are 28×28px. The two-button theme control uses an active sliding thumb; [theme-toggle.css](../../../../packages/blog/src/styles/theme-toggle.css) defines its treatment.
- Utility icons use the shared [template](../../../../packages/blog/src/templates/utility-icon.ts): a 24-unit grid, 1.5-unit round strokes and inherited single color. Use 16px beside text or 20px in controls, with an accessible name on the control. Keep gradients for identity marks; keep technical illustrations separate from utility glyphs.
- Use the sparkle separator between appropriate publication areas. Tags render as `#hashtags`, with the gradient on the hash, rather than badges.
- Add motion only when it helps comprehension. Preserve readable content before interactive components load.

## Interactive navigation

- A single-destination invitation or navigation choice uses one native link with a concise name. Its hit area includes the artwork and padding, with one tab stop and visible focus across the surface. Preserve native keyboard activation.
- Keep forms and secondary controls outside that link’s overlay. Use a separate interactive region when a surface contains multiple actual actions.
- Use the shared [navigation choice template](../../../../packages/blog/src/templates/navigation-choice.ts) and [styles](../../../../packages/blog/src/styles/navigation-choice.css) for compact tiles or illustrated rows. Use the illustrated homepage invitation for one featured destination. Design Language renders the same components as their callers.
- Linked headings and full-surface states provide the navigation cue. Do not append decorative direction arrows or add a second action to a single-destination choice. Use icons only when they convey an action or object.
- The [compact navigation study](../../../../packages/blog/prototypes/tools/design-language-study.md#accepted-implementation--november-11) records the selection, rationale and earlier alternatives. Compact tiles, readable 14px descriptions, 12px metadata, 16px tile padding and 10px corners are the accepted tools-directory pattern.

## Reports and results

- Keep check results, their evidence and actionable next steps visible while scrolling. Use section headings and native jump links for longer reports. Reserve disclosures for method explanations and raw data, rather than hiding passed, failed, optional or unassessed results.
- Group related checks with a compact points summary. State each outcome in words; color is a secondary cue. Keep unknown points separate from failed points and preserve the observation date and scope near the overview.
- The enhanced and server-rendered access reports use the same escaped [report template](../../../../packages/blog/src/lib/site-audit-report.ts). Design Language renders its check-group component with explicitly illustrative inputs.

## Analytical reports

- Put the principal metrics and trend chart before detailed evidence. Use visible, named sections and native jump links for longer reports. Keep report results in the page; disclosures can hold alternate chart data or operational method details.
- Keep the metric label, number and definition together. Daily clients are per-day identifiers, not people; request categories describe signals and declared roles. Put the selected scope, UTC period, partial-bucket boundary and calculation time near the data they qualify.
- Use the shared [data-display templates](../../../../packages/blog/src/lib/data-display.ts) and [styles](../../../../packages/blog/src/styles/data-display.css) for metric tiles and comparison rows. Rows print their value; the bar compares against the largest visible row. Keep filter links and Open actions distinct, with a visible focus outline and at least 44px targets.
- Label filters explicitly. A native select suits one choice among long category names; a compact pressed-button group suits a few time ranges. Distinguish chart series with line style as well as color, retain an accessible data table, and show missing evidence without treating it as zero or false.
- Lead each detail section with its results. Put coverage counts in a labeled definition list using the shared data-facts renderer; preserve zero values and state whether facts overlap. Follow with a visible [reading note](../../../../packages/blog/src/templates/data-note.ts), in short paragraphs at a readable size. Do not scatter dense method text between a heading and its data or squeeze long paths into narrow comparison columns. Organize long methodology into named, directly linked topics without removing its evidence boundaries.

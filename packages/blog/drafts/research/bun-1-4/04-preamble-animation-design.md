# Bun 1.4 preamble animation design

## Decision

The Bun issue uses an exclusive static component named `BunFusionHero`. It renders the article heading and a CSS-only **dependency zipper**: fifteen package-job mappings close row by row into one Bun binary, then a separate aperture inside that binary changes from Zig to Rust.

This is the article's opening argument in visual form:

> Bun 1.4 makes the runtime the dependency boundary. More application jobs move behind Bun-specific APIs at the same time that Bun moves more of its own lifetime discipline into Rust's compiler feedback.

The animation does not decorate that claim. It carries evidence that would otherwise require introductory prose: every named package-to-surface mapping remains readable before, during, and after motion.

Implementation:

- `packages/blog/src/components/bun-fusion-hero/bun-fusion-hero.ts`
- `packages/blog/src/components/bun-fusion-hero/bun-fusion-hero.css`
- exported as `BunFusionHero` through `packages/blog/src/components/index.ts`
- consumed by the TypeScript post through `packages/blog/src/templates/components.ts`
- no client component, custom-element registration, runtime script, or added dependency

## Source model and claim boundaries

The mapping data comes from Bun's official 1.4 release post, published August 20, 2026: [Bun 1.4 — “What's new”](https://bun.com/blog/bun-v1.4#whats-new). The post displays these fifteen dependencies beside the following built-in surfaces and says each surface ships in the Bun binary:

| Package job | Bun surface shown in the release |
|---|---|
| `sharp` | `Bun.Image` |
| `puppeteer` | `Bun.WebView` |
| `marked` | `Bun.markdown` |
| `node-cron` | `Bun.cron` |
| `node-pty` | `Bun.Terminal` |
| `concurrently` | `bun run --parallel` |
| `npm-run-all` | `bun run --parallel` |
| `serve-static` | `Bun.serve routes` |
| `json5` | `Bun.JSON5` |
| `fast-xml-parser` | `Bun.XML` |
| `tar` | `Bun.Archive` |
| `string-width` | `Bun.stringWidth` |
| `slice-ansi` | `Bun.sliceAnsi` |
| `cli-truncate` | `Bun.sliceAnsi` |
| `wrap-ansi` | `Bun.wrapAnsi` |

The component calls these **package jobs**, not drop-in package replacements. The release proves that Bun owns the named work through the displayed surface; it does not prove complete API or behavior equivalence with every package. “One binary” is also bounded: it describes where these Bun surfaces ship, not the absence of operating-system facilities, codecs, browsers, native libraries, or other external requirements. For that reason the final legend reads **“fifteen named job mappings · one runtime-owned boundary”**, not “one runtime-owned surface” or “zero dependencies.”

The internal Zig-to-Rust plane is sourced separately. Bun's release identifies 1.4 as the first Rust release, and Jarred Sumner's [Bun is now written in Rust](https://bun.com/blog/bun-in-rust) explains the goal of turning more use-after-free, double-free, and missed-cleanup failures into compiler feedback. The component therefore says **“more lifetime checks at compile time.”** It does not say Rust made Bun memory-safe: Bun retains `unsafe` code, FFI, JavaScriptCore, and other C/C++ dependencies.

The two planes stay visually separate on purpose:

1. The outer ledger shows application package jobs converging into Bun-owned API surfaces.
2. The inner aperture shows Bun's own implementation changing from Zig to Rust.

This avoids suggesting that the fifteen package jobs were rewritten in Rust or that the Rust migration caused those APIs to exist.

## Motion system

The sequence is a one-shot zipper rather than an ambient loop:

1. All fifteen rows start readable as `package → Bun surface` pairs.
2. A small Bun zipper head travels down the center seam.
3. Each row locks in sequence: the package name receives a strike, the seam teeth close, and the Bun surface receives a short signal pulse.
4. Five lines funnel the closed ledger into the Bun 1.4 binary.
5. Inside the binary, `Zig → Rust` completes as a second, later transition.
6. The component rests in a complete final state instead of replaying indefinitely.

All timing values are presentation timing. The only quantitative content is source-backed: fifteen named mappings and one binary boundary. No benchmark, download, memory, size, or adoption measurement appears in the preamble.

## Static, accessible, and responsive behavior

### No JavaScript and static HTML

`BunFusionHero` is produced with `staticHtml` at build time. The mapping array creates all fifteen visible rows in the generated HTML. CSS adds sequencing but never supplies the evidence. With client JavaScript disabled, the full heading, mapping ledger, binary, and core change remain present.

No hydration was added because the component has no input, replay, or state that benefits from a client lifecycle. The one-shot CSS sequence is progressive enhancement.

### Reduced motion

The `prefers-reduced-motion: reduce` rule removes every animation in the hero, including pseudo-element animation. It then sets the meaningful final state explicitly:

- package strike lines and seam lines are complete;
- zipper teeth are closed;
- the moving zipper head is absent;
- convergence lines remain visible but still;
- Zig is de-emphasized and Rust remains readable;
- the scroll prompt no longer breathes.

The reduced-motion result preserves the argument rather than replacing it with an empty frame.

### Narrow screens

The ledger remains a single ordered mapping instead of becoming a horizontally scrolling diagram. Below 640 px, the package/seam/API grid reallocates more width to Bun's longer surface names, reduces type and gaps, widens the convergence area, and keeps the binary within `86vw`. A second adjustment below 380 px narrows the seam and further reduces label spacing. Package and API labels use constrained, non-wrapping code cells so a row cannot force page-level horizontal overflow.

### Themes

The component derives background, text, border, API, and Rust signals from the publication tokens. Light mode receives a quieter ledger shadow; dark mode receives a higher-contrast inset and Rust-colored falloff. No fixed light-only text or panel color is used for primary content.

### Accessibility contract

The visualization has one `role="img"` and one complete `aria-label`. The animated machine below that label is `aria-hidden="true"`, preventing fifteen decorative animation rows from becoming repetitive screen-reader output. The visible title, subtitle, and byline sit outside that hidden visualization and remain normal document content.

## Verification record

| Check | Result | Evidence or limit |
|---|---|---|
| TypeScript | Passed | `pnpm -C packages/blog typecheck` completed with no diagnostics. |
| Production build | Passed | `pnpm -C packages/blog build` completed successfully after component integration. The build regenerated the component CSS manifest and included `bun-fusion-hero.css`. |
| Light theme | Passed | Manual rendered inspection reported correct contrast and readable mapping/binary layers. |
| Dark theme | Passed | Manual rendered inspection reported correct contrast and separation of ledger, convergence lines, binary, and Rust core. |
| Narrow/mobile layout | Passed | Manual rendered inspection reported no clipping or page-level horizontal overflow and retained readable mapping pairs. Exact viewport dimensions were not recorded, so this result is qualitative rather than a breakpoint measurement. |
| Motion/static model | Passed by code inspection | The evidence is HTML, no client registration exists, animations are one-shot, and every animated state has a visible resting state. |
| Reduced motion | Passed by code inspection | The media query disables all hero animations and supplies explicit final transforms/opacity. No separate reduced-motion screenshot was retained. |
| Accessible naming | Passed by code inspection | One visualization role and label; animated descendants hidden; title and byline remain outside the hidden subtree. |
| Dependency budget | Passed | The component imports only `@nisli/core/static`, already used by the publication; no package or client bundle dependency was added. |

## Reuse boundary

The component API accepts issue metadata, title, subtitle, author, and read time so the article owns its editorial text. The fifteen mappings and the two-plane zipper are intentionally internal. Reusing this component for another release would require the same product claim and evidence shape; changing labels alone would turn a source-backed visualization into a generic hero.

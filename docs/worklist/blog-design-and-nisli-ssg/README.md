# Blog navigation and Nisli SSG

Started October 20, 2026 (America/Los_Angeles).

## Scope

Upgrade the blog to the latest published Nisli core and proper SSG. Start the localhost dev server. Focus the design work on the homepage and article browsing. The owner approved removing Studio from the sidebar, retaining project links on About and the Nisli footer credit, and linking Design Language and Animations Lab from About. Further homepage composition changes remain design work to discuss.

## Implementation

- `@nisli/core` 0.47.4 → 0.56.0; add `@nisli/ssg` 0.4.0. Registry dist-tags verified live.
- Replace the removed static-template API throughout active sources, TypeScript posts, and the saved article preview. Use normal templates, public SSG rendering/output, explicit trusted Markdown sinks, and validated TypeScript modules.
- Preserve complete documents around SSG body snapshots, including canonical/OG metadata, JSON-LD, CSS, scripts, and client islands. Keep publication policy in the blog.
- Remove Studio and its unused styles. Keep the existing featured article and chronological homepage stream. Add the site-exploration links to About.
- Architecture and limitations: [ADR-0018](../../adr/0018-nisli-ssg-and-publication-navigation.md).

## Verification and delivery

Local implementation and verification complete. Used Node 24.14.1 and pnpm 9.15.4. Production builds ran in an isolated checkout, keeping the main dev server's output separate. Unrelated Nisli article research remains in the main working copy and outside this change.

- All workspace typechecks passed; all 18 Markdown posts validated; production build passed for 29 total posts.
- All 103 blog tests passed, including new full-document, escaping, Markdown/prompt, and TypeScript-module regressions in [ssg.test.ts](../../../packages/blog/test/ssg.test.ts).
- Compared 57 HTML documents with the preceding development output using Python's HTML parser: head metadata, normalized article text, and article link sequences match. Production-only OG cache-version suffixes were normalized. All 29 Markdown twins, 29 CSL-JSON files, and 29 BibTeX files match byte for byte. Feed, sitemap, robots, llms.txt, and llms-full.txt also match byte for byte; The only posts.json change is an explicit `featured: false` on five TypeScript posts that previously omitted the flag, matching the validated schema default.
- Browser checks: desktop at 1280px in light and dark themes; About links; an immersive article with its preamble and ten scroll-reveal elements; mobile at 571px with menu open/close, Escape, aria-expanded, and scroll locking. No contained component errors or horizontal overflow in the inspected pages. No console warnings/errors in the immersive article check.
- The main dev server is running at `http://localhost:3000/` with the upgraded dependencies. Its final rebuild found 29 posts. Existing services on other ports were preserved.
- Changed guidance, decision, and worklist documents passed local-link and scoped whitespace checks. Instruction changes were compared with their previous versions.

## Delivery and next action

The source changes follow the repository's scoped commit-and-push workflow on main. Local verification is not evidence of deployment activation or current production behavior; those remain unverified.

The next bounded design action is to review the homepage's featured-story hierarchy and chronological stream with the owner, now that project and experiment links have a quieter location. No additional homepage composition or search interface was introduced during this migration.

## October 20 follow-up: bundle attribution and native TypeScript

The owner asked why gzip grew and requested the latest native TypeScript. The registry's current stable native release is `typescript` 7.0.2, using the regular `tsc` command; `@typescript/native-preview` has an older release. [Microsoft's TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) documents the package transition.

All five workspace compiler dependencies now use `^7.0.2`. Existing commands are unchanged. Added an empty ambient stylesheet-module declaration for esbuild's side-effect CSS imports, which the newer compiler checks; no strictness setting was relaxed.

Three workspace typecheck runs per compiler, with build-info files removed before each run, gave medians of 2.172 seconds on 5.9.3 and 0.775 seconds on 7.0.2: approximately 2.8× faster locally. The source snapshot was ebca917 plus the client-mode fix; the native run also included the stylesheet declaration. This measures the typecheck command, not page loading or the esbuild/SSG production pipeline.

The browser-bundle increase came from core's component, template, signal, and audit code. The SSG package is not in the browser bundle. Found and fixed production mode falling through to Nisli's development default: both bundlers now use the shared `import.meta.env` definition. A real bundled-template test verifies development emits N102 for a misspelled event while production does not. Runtime gating still retains the audit code: main.js gzip changed from 11,252 to 11,261 bytes after the flag fix, using gzip level 9. No size reduction is claimed. [Derived measurements](compiler-and-bundle-check.json) preserve conditions and samples.

Checks passed: all workspace typechecks; 104 blog tests; 53 analytics tests, including test-code emission by the native compiler; 18 Markdown posts validated; 29 posts built in the isolated production build. Analytics initially failed a September fixture tested against today's rolling window. The same assertion failed under 5.9.3; its filter-only API call now explicitly selects all time. Production analytics behavior was not changed.

Remaining: production activation and live acceptance are unverified. The next design action remains the homepage review above; further reduction of Nisli's common runtime and statically removable diagnostics is separate work.

## October 20 follow-up: upstream production-diagnostics reproduction

The owner requested a clean upstream issue with evidence. The [standalone reproduction](nisli-production-diagnostics-repro/README.md) uses pinned published packages, contains no blog or SSG imports, and preserves executable checks and derived results. All five cases passed diagnostic and counter-interaction assertions in browser-like VM contexts with esbuild 0.27.3 and current 0.28.2. Both bundlers emitted byte-identical corresponding bundles. A real browser independently confirmed all five cases with 0.27.3 and no process global.

Confirmed a production-detection compatibility defect: Nisli reads `globalThis.process?.env?.NODE_ENV`, which esbuild's ordinary `process.env.NODE_ENV` replacement does not match. Minified browser builds emit development-only N102 even with the ordinary production definition. Providing the `import.meta.env` object or calling `setDevMode(false)` silences the audit, but retains approximately 2.8 KB of minified, uncompressed template-audit code. The latter is a related removal/design gap; the published README promises silence, and the zero-production-weight ADRs are marked Proposed. The evidence does not classify all runtime growth as a defect or claim recoverable gzip savings.

Filed [Nisli #3](https://github.com/gkoreli/nisli/issues/3) with source links and the runnable fixture pinned to blog commit `4e7bc14`. No upstream fix or deployment acceptance is claimed. The fixture does not touch the main development server's output. A future upstream fix can be checked against this matrix before changing the blog workaround; the next publication-design action remains the homepage review.

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

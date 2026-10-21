# ADR-0018: Nisli SSG and publication navigation

## Status

Accepted — 2026-10-20; amended for core 0.57.0 the same day. Supersedes the rendering API in [ADR-0002](0002-nisli-static.md).

## Decision

Use `@nisli/core` 0.57.0 and `@nisli/ssg` 0.4.0, the published versions verified on October 20, 2026. The initial migration used core 0.56.0; the follow-up adopts 0.57.0's removable production diagnostics. Templates use ordinary `html` and `TemplateResult` from core. The removed `@nisli/core/static` entry point and string-valued `StaticResult` are no longer part of the blog.

The framework owns template snapshots and generic output through its public `buildStaticSite`, `cleanOutDir`, `copyPublicAssets`, `writeRoute`, and `writeRoot` APIs. The blog keeps post discovery, Markdown conversion, frontmatter, prompts, feeds, citations, metadata, OG images, HTML validation, and bundle selection.

Published SSG 0.4.0 mounts templates in a temporary DOM host and serializes body fragments. Passing a full document through that renderer drops the doctype and document elements. The blog's [SSG integration](../../packages/blog/src/lib/ssg.ts) therefore assembles an escaped head and the rendered body into a complete document in `onPage`, then writes it through `writeRoute`. It uses public package exports only. Metadata interpolation in the head is explicitly escaped; existing caller-owned JSON-LD and link markup remain HTML.

TypeScript articles export template factories. Their modules and metadata are validated at build time. A separate snapshot in a temporary directory supplies the Markdown twin; final pages receive fresh templates. Temporary snapshot files are removed in `finally`. Browser components remain unregistered during generation, leaving readable custom-element content for progressive enhancement. SSG disables the browser registration audit in its build process.

Trusted, rendered Markdown uses `html:inner` with `raw()`. Ordinary text, prompts, and attributes use normal bindings. Attribute fragments and `raw()` values interpolated as children belonged to the old string renderer and must not be carried into DOM templates.

Browser builds explicitly define standard `process.env.NODE_ENV` through the shared client-mode helper: `"production"` or `"development"`. Core 0.57.0 exposes statically removable guards around optional diagnostics and bookkeeping. This replaces the earlier `import.meta.env` workaround, which only silenced core 0.56.0's audits. Production artifacts cannot restore removed diagnostics through `setDevMode(true)`. The executable regression test verifies development reporting and production silence/code removal. The [release check](../worklist/blog-design-and-nisli-ssg/core-0.57.0-check.json) records the standalone/browser proof and actual bundle reduction; production activation remains separate.

The sidebar contains publication navigation and follow controls. Project links live on About, alongside links to Design Language and Animations Lab. Keep the Nisli footer credit. The owner approved this placement during the design session; the experiments and routes remain available.

## Consequences and evidence

- The SSG dependency's DOM implementation is build tooling, excluded from browser and Worker entry points.
- Full-document assembly is a local integration boundary until a published SSG API supports complete documents directly.
- The standalone `validate` command still checks Markdown; the build also validates TypeScript exports.
- [The worklist](../worklist/blog-design-and-nisli-ssg/README.md) records local checks and output comparisons. Deployment activation and production acceptance require separate evidence.

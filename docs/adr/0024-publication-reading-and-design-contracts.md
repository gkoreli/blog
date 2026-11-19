# ADR-0024: Publication reading and design contracts

Accepted — November 15, 2026 UTC. Extends the stable shell and expressive article interior in [ADR-0013.1](0013.1-publication-visual-layer.md). The [implementation worklist](../worklist/site-design-system/README.md) owns preservation checks, responsive visual review, delivery and measured acceptance.

## Decision

The design package owns readable foreground roles and their supported surfaces, focus geometry and a 44px interaction target. Decorative accents and gradients remain available for illustration and identity. Text uses tested ink roles without additional opacity. Neutral rules separate content; form boundaries use a stronger control role. The 44px scale is an ergonomic interface choice, not a claim of accessibility certification.

Publication composition owns section IDs, the reading outline, table affordances and one provenance slot. It preserves existing section IDs, supplies stable IDs for unaddressed headings, and rejects duplicate IDs in complete built pages. Native contents links appear inline on narrower screens and in the wide reading rail. Repeated preparation does not duplicate the outline or table frames.

Tables retain their complete cells, links, captions and merged relationships. A shared frame supplies keyboard/touch scrolling and an overflow cue. Ordinary rectangular comparisons retain their first-column identity while panning; merged tables keep their original relationships. Progressive enhancement hides an unnecessary cue when the table fits. Authored article illustrations and layouts keep their own expression.

The page assembler renders one research footprint. Custom articles may export `researchNotes()` through the validated post-module contract. The shared renderer owns IDs, measurement totals, timestamps and common audit limits; the article supplies its measured explanation. Both the HTML article and Markdown representation contain that explanation.

Search remains a separate article/passage context. It indexes prepared publication content and ignores added reading navigation and overflow hints. The shared navigation owns the search launcher; the dedicated search page owns its form. Archive content does not duplicate the form. A native disclosure groups topic links into one section-scoped index above the chronology. Archive entries link their titles. Article tags supply search and structured metadata. Enhanced and script-free search honor the same section parameter.

Report presentation consumes the analytics read models. Each independent calendar/window/selection context has its own header, visible scope facts and section index. Presentational changes do not reinterpret source calendars, change stored observations, or collapse unknown evidence into zero. The shared metric, evidence and table patterns retain every value and explanatory detail.

Utility glyphs identify an object or action; decoration does not add a second navigation cue. Single-destination surfaces retain one link, a generous target and complete focus treatment. The design-language page renders the same components and styles as their callers, including real project drawings, report summaries, scope facts, section navigation and reading tables.

## Consequences

Publication structure is prepared before search indexing, rather than being an accidental side effect of search extraction. The existing `parse5` parser becomes an explicit blog dependency; the parser remains in the build path. Browser enhancement stays small and native. No new UI framework, database schema, collection field, identity model or report aggregation is introduced.

Privacy retains its full technical disclosure below a linked overview. The content-license page uses public destinations and concise scope text while linking the complete license terms. Source conversations and private audit captures remain outside public evidence.

## Acceptance

The [delivery receipt](../worklist/site-design-system/acceptance-2026-11-15.json) records checked implementation, content/data preservation, desktop and phone review, source publication, active deployment and fresh hosted acceptance for all thirteen worklist areas.

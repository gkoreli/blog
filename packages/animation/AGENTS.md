# AGENTS.md — Animation Package Context

## Purpose

`@gkoreli/animation` is an independent agent-native TypeScript animation framework experiment.

It is not a blog subsystem. It must not depend on article metadata, publication layout, routes, `@nisli/core`, or gkoreli.com content semantics.

`gkoreli.com` is the current reference host. It provides the Animations Lab and may mount package scenes behind selected article preambles. Default pages and unrelated articles must not load the runtime or Pixi.

Primary decision: `docs/adr/0015.4-agent-native-animation-framework.md`.

## Guiding Statement

The framework should be easy for humans and coding agents to author, inspect, patch, validate, and verify. Its surface is semantic data; its execution is explicit and data-oriented; its renderer backends remain replaceable.

## Agent-Native Means

Every canonical scene has:

- a schema version
- a stable semantic scene ID
- an explicit seed
- plain-data declarations
- stable IDs for referenced objects
- deterministic array order where order matters
- structured diagnostics before runtime allocation
- a JSON-compatible inspection manifest
- an explicit path toward fixed-frame rendering and snapshots

Agent-native does not mean:

- natural-language execution inside the runtime
- a model dependency
- an MCP server inside the package
- an opaque editor database
- Pixi objects in scene declarations
- arbitrary generated code as the only inspectable plan

## Canonical Architecture

| Layer | Folder | Responsibility |
| --- | --- | --- |
| Core | `src/core/` | Scene, frame, primitive, renderer, and mount contracts |
| Authoring | `src/authoring/` | Versioned semantic scene declarations and helpers |
| Compilation | `src/compile/` | Validation, diagnostics, manifests, reference resolution, execution plans |
| Simulation | `src/sim/` | Typed stores, emitters, fields, zones, occupancy, hot-path operations |
| Effects | `src/effects/` | Ordered stages, conditions, channels, and reusable operators |
| Renderer adapter | `src/renderer-pixi/` | All Pixi imports and primitive-to-Pixi mapping |

Concrete lab and article scenes belong to the consuming application. Do not add an `article-scenes` package layer.

## Canonical Consumption Flow

1. A consumer declares a `SceneDefinition` with `createScene(...)`.
2. `analyzeScene(...)` validates the declaration and returns structured diagnostics plus `SceneManifestV1`.
3. `compileScene(...)` rejects invalid declarations before allocating runtime state.
4. Compilation resolves systems, emitters, materials, fields, zones, timelines, and stage phases.
5. `mountScene(...)` owns initialization, resize, visibility, reduced motion, frame scheduling, frame observation, and disposal.
6. A renderer adapter maps renderer-neutral primitives and batches to its backend.

The blog may wrap this flow in lab controls or an article-specific lazy client entry. Those concerns do not enter this package.

## Scene Contract

`SceneDefinition` is the source of truth. The builder is syntax over that data, not a second model.

Current top-level fields:

- `version`
- `id`
- `seed`
- `textSources`
- `polylines`
- `fields`
- `zones`
- `emitters`
- `materials`
- `systems`
- `timelines`

Use semantic IDs that survive refactors and explain the concept. IDs are shared vocabulary for authors, agents, diagnostics, manifests, logs, and the lab.

Compilation must fail on:

- empty or duplicate IDs
- dangling emitter, material, field, zone, timeline, or text-source references
- invalid capacities, ranges, rates, or bursts
- unsupported timeline sources
- unsupported coordinate combinations
- renderer-layer ID collisions
- unsupported visible primitive shapes
- operator/channel combinations the runtime cannot execute
- more active zones than the occupancy representation supports

Silent skipping is prohibited.

## Execution Model

The frame order is:

1. sample time and external modulation
2. consume scheduled bursts and coarse triggers
3. spawn particles
4. apply field influence
5. integrate motion
6. compute zone occupancy
7. emit coarse transition events
8. execute transition stages
9. execute continuous stages
10. decay and retire state
11. prepare renderer-facing primitives and batches
12. render through the adapter

Pipes may contain stages from multiple phases. Classify stages, not entire pipes. Preserve authored pipe and stage order in `SceneManifestV1`.

Time and randomness are inputs. `requestAnimationFrame` belongs only to `mountScene`. Runtime execution must not call unseeded randomness or read wall-clock time directly.

## Effect Composition

Effects are ordered stages over explicit channels.

Preferred:

- small stage definitions
- composition over inheritance
- visible add, multiply, override, decay, field, and timeline semantics
- coarse events for enter, exit, threshold, and scheduled burst
- continuous systems for motion, integration, occupancy, and decay

Avoid:

- class trees for visual variants
- per-particle signal graphs
- global reactive stores
- per-frame semantic event spam
- legal TypeScript operations that the executor silently ignores

Continuous operations must define whether they are time-normalized, cumulative, or derived from a baseline. Refresh-rate-dependent ambiguity is a bug.

## Renderer-Neutral Primitive Layer

Current vocabulary:

| Primitive | Purpose | Pixi mapping |
| --- | --- | --- |
| `TextPrimitive` | Visible text source, bounds, source glow, debug surface | Pixi `Text` |
| visible rectangle zone | Semantic territory with fill and stroke | Pixi `Graphics` |
| particle batch | Hot-path particle rendering and velocity trails | Pixi `Graphics` |
| `PolylinePrimitive` | Fractures, arcs, connectors, field/debug lines | Pixi `Graphics` |

Rules:

- Pixi owns low-level drawing.
- The framework owns semantics, IDs, bounds, source binding, channels, and timelines.
- No Pixi import or Pixi type may appear outside `renderer-pixi`.
- Every claimed material channel must render or fail validation.
- DOM overlays may frame a consumer UI but cannot substitute for a runtime primitive.

## Renderer Isolation

Allowed:

- Pixi imports in `src/renderer-pixi/`
- backend-specific caches, display objects, blend modes, filters, and disposal inside the adapter
- backend mapping from renderer-neutral primitives and prepared batches

Prohibited:

- Pixi imports in core, authoring, compile, sim, or effects
- Pixi objects in `SceneDefinition`, manifests, runtime plans, or public scene APIs
- authoring APIs named after Pixi display objects
- renderer-specific behavior encoded in lab DOM/CSS and described as framework capability

If a backend feature must surface upward, define a renderer-neutral primitive, channel, or adapter capability first.

## Mount Lifecycle

`mountScene(...)` owns:

- renderer initialization
- DPR-aware resize
- viewport suspension
- caller-requested start/stop state
- reduced-motion static rendering
- frame callbacks
- render-once invalidation
- deterministic disposal

Caller pause and viewport visibility are separate states. Scrolling a paused scene offscreen and back must not restart it. Resuming after suspension must not include hidden time in `deltaMs`.

## Performance Rules

- Avoid per-frame allocation in simulation hot loops.
- Prefer typed arrays and stable iteration for particle state.
- Seed random state once; do not create random functions per frame.
- Keep event queues reusable and bounded by semantic transitions.
- Reset all slot-coupled state when a particle slot is reused.
- Keep zone occupancy explicit and bounded.
- Do not expose mutable simulation stores as the long-term renderer contract.
- Do not rebuild text styles or static primitive geometry each frame without evidence that the cost is acceptable.
- Measure real scenes before adding Web Workers, OffscreenCanvas, WebGPU, an ECS, or a spatial index.

Readable authoring syntax must not hide capacity, stage order, renderer cost, or unsupported behavior.

## Animations Lab Boundary

The lab lives in `packages/blog`. It owns:

- experiment registry and copy
- control presentation and defaults
- stress mode
- metrics presentation
- visual acceptance
- scene selection

The package owns the behavior those controls exercise.

A lab experiment is real only when:

- `analyzeScene(...)` returns no errors
- visible semantics come from runtime primitives
- controls change real scene/runtime values
- metrics come from actual runtime frames and live state
- pause, reset, visibility, reduced motion, and disposal work
- the stage does not use CSS art to fake a missing primitive

Prefer fewer real experiments to more convincing labels.

## Blog Integration Boundary

- Existing Canvas 2D and CSS article preambles may remain until a concrete migration earns the cost.
- A framework-backed preamble gets a page-specific lazy entry or scene key.
- Never import Pixi through a shared bundle used by articles that do not need it.
- Preserve complete static article HTML and readable content without JavaScript.
- Do not spread animation to archive/default pages to justify the package.

## Clean Cutovers

One public grammar only:

- keep `SceneDefinition` / `createScene`
- remove unused article-scene builders
- remove legacy effect descriptor and timeline models
- migrate every real caller before deleting an API
- do not keep deprecated aliases or inert metadata paths

Internal primitives may remain reusable, but do not export two authoring routes that appear equally valid.

## Verification

After package changes:

- run `pnpm -C packages/animation typecheck`
- run `pnpm -C packages/blog typecheck` when the blog consumer changes
- run `pnpm -C packages/blog build` only when no blog dev server owns `dist`
- browser-drive `/animations-lab` and exercise lazy mount, controls, pause, reset, stress, offscreen resume, and reduced motion
- verify representative article preambles and one default page

Structural verification must include at least one valid scene analysis and one invalid declaration that returns the expected diagnostic code.

## Anti-Patterns

- Building a general-purpose game engine
- Treating the blog as the package architecture
- Adding substrates without a real scene
- Adding controls that do not affect runtime behavior
- Calling a repeating per-frame spawn count a burst
- Faking zones or fractures with DOM art
- Silent missing-reference fallbacks
- Exposing mutable renderer or simulation internals as the agent contract
- Returning an opaque runtime plan as the only inspection surface
- Treating a particle cloud as proof of text, memory, or fracture semantics
- Adding an editor before deterministic scene inspection exists

## References

| Reference | Role |
| --- | --- |
| `docs/adr/0015.4-agent-native-animation-framework.md` | Accepted ownership and agent-native architecture |
| `docs/adr/0015-animation-library.md` | Pixi backend rationale |
| `docs/adr/0015.1-animation-substrates-and-authoring-model.md` | Substrates, events, pipelines, and hot-path model |
| `docs/adr/0015.2-animations-lab.md` | Lab product and experience direction |
| `docs/adr/0015.3-text-and-render-primitive-layer.md` | Renderer-neutral primitive correction |
| `src/authoring/` | Canonical scene declaration surface |
| `src/compile/` | Validation, manifest, and executable runtime path |
| `src/sim/` | Hot-path state and substrate operations |
| `src/effects/` | Ordered effect stages and channels |
| `src/renderer-pixi/` | Pixi backend only |

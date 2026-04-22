# AGENTS.md — Animation Package Context

## Purpose

`@gkoreli/animation` is the publication animation runtime for `gkoreli.com`.

It exists to make selected essays feel like authored editorial spaces, not pages with decorative motion pasted on top. The package should support article-scale visual storytelling with a small house language: fields, zones, emitters, materials, timelines, and explicit effect pipelines.

The goal is not to build a general-purpose game engine. The goal is a narrow, inspectable runtime that lets important articles become museum pieces while keeping default pages light.

## Guiding Statement

The runtime should read like authored editorial composition at the surface, execute like a disciplined simulation pipeline underneath, and remain narrow enough that every primitive earns its existence through real published work.

## Core Philosophy

- **The article is the product.** The runtime exists to serve published writing, not to become an independent engine project.
- **Motion must carry meaning.** Animation should clarify pressure, memory, drift, fracture, emergence, attention, or transition. Avoid movement that only decorates.
- **Authoring should be semantic.** Scene code should describe what exists and why it matters: `memory`, `thought`, `hero-title`, `ambient-drift`, `section-pulse`.
- **Execution should be explicit.** Effects run in ordered pipelines. If order matters visually or computationally, it must be visible in code.
- **Hot paths are data-oriented.** Large particle sets should use compact stores, typed arrays, stable iteration, and minimal per-frame allocation.
- **Pixi is a backend.** PixiJS is allowed only behind renderer adapter boundaries. Authoring, compile, sim, effects, and article scenes must not expose Pixi objects.
- **Build narrow, then generalize.** Add primitives only when a real article scene needs them.

## Architectural Model

The package follows a layered model:

| Layer | Folder | Responsibility |
| --- | --- | --- |
| Core runtime | `src/core/` | IDs, frame time, lifecycle, scene mounting, event queue, renderer adapter contracts |
| Authoring | `src/authoring/` | Human-readable scene declarations: fields, zones, emitters, materials, timelines, systems |
| Compilation | `src/compile/` | Convert declarations into runtime plans, pipeline groups, stores, renderer bindings |
| Simulation | `src/sim/` | Particle stores, emitters, fields, zones, occupancy, hot-path systems |
| Effects | `src/effects/` | Channels, operators, effect stage definitions, reusable effect modules |
| Timeline | `src/timeline/` | Modulation helpers and source-specific timeline utilities |
| Render primitives | `src/core/` / `src/compile/` | Renderer-neutral visual vocabulary: text, zones, particles, trails, polylines |
| Renderer adapter | `src/renderer-pixi/` | Pixi-backed rendering implementation only |
| Article scenes | `src/article-scenes/` | Concrete editorial scenes, not reusable abstractions until proven |

## Initial Substrates

The first-generation runtime is built around five substrates.

| Substrate | Meaning | Current Role |
| --- | --- | --- |
| Field | Spatial influence over motion or channels | Noise-driven drift and atmospheric movement |
| Zone | Semantic spatial realm or geofence | Memory bands, pressure areas, fracture regions, silence zones |
| Emitter | Source of particles/entities | Point, rectangle, text-box, and future layout-bound emergence |
| Material | Visual identity and render channels | Glow, solid, ember, electric, ghost-style appearance |
| Timeline / Modulation | Choreography over time, scroll, section, visibility, events | Scroll and time-linked parameter shaping |

These substrates are intentionally basic. They should compose into expressive motifs without creating an engine taxonomy.

## Current Architectural Correction

The package currently has more semantic runtime architecture than visual renderer vocabulary.

That is the main bottleneck.

The runtime can describe fields, zones, text-box emitters, materials, timelines, and effect pipelines, but the Pixi adapter currently expresses most of that as particles and circles. This makes the system look less serious than the architecture underneath.

Treat the current particle-heavy output as **runtime smoke testing**, not finished visual language.

Do not keep adding lab experiment labels, controls, or substrates while the renderer can only speak in dots.

The next milestone is:

> Make **Text Emergence** visually undeniable.

Reference: `docs/adr/0015.3-text-and-render-primitive-layer.md`

## Visual Primitive Layer

The runtime needs renderer-neutral visual primitives before the lab can become expressive.

Target vocabulary:

| Primitive | Purpose | Pixi Backend Mapping |
| --- | --- | --- |
| `TextPrimitive` | Visible publication text, text source identity, text bounds, source glow, debug bounds | Pixi `Text` first; optional `SplitText` later |
| `ZonePrimitive` | Visible semantic space, fill, edge, glow, occupancy/debug surface | Pixi `Graphics` |
| `ParticlePrimitive` / particle batches | Hot-path particle rendering | Pixi `Graphics` now; future optimized particle renderer possible |
| `TrailPrimitive` | Temporal richness and persistence | Per-particle velocity trails first; render texture feedback later |
| `PolylinePrimitive` | Fracture lines, arcs, connectors, field vectors | Pixi `Graphics` |

Important rules:

- Pixi owns low-level text rendering. The package must not build a font rasterizer or text layout engine.
- The runtime owns text semantics: source IDs, bounds, emitter binding, timelines, dissolve/return behavior, and effect participation.
- Authoring must remain renderer-neutral. Do not expose Pixi `Text`, `Graphics`, `Container`, filters, textures, or display objects outside `renderer-pixi`.
- DOM overlays may be useful for page scaffolding, but they are not substitutes for runtime primitives.
- If an effect cannot be expressed by renderer-neutral primitives, the runtime is not ready to claim that visual concept.

## Authoring API Model

Authoring code should read like editorial composition:

```ts
createScene('topologies-of-thought')
  .field('hero-noise', noiseField({ strength: 0.35 }))
  .material('thought', glowMaterial({ color: '#6ec9a8', radius: 2.4 }))
  .zone('memory', defineRectZone({ x: 0.18, y: 0.18, width: 0.64, height: 0.42 }))
  .emitter('hero-title', textBoxEmitter({
    x: 0.12,
    y: 0.16,
    width: 0.76,
    height: 0.22,
    rate: 28,
    material: 'thought',
  }))
  .timeline('hero-scroll', scrollTimeline({ inputStart: 0, inputEnd: 0.35 }))
  .system('nodes', particles({
    emitter: 'hero-title',
    material: 'thought',
    pipes: [
      pipe('ambient-drift', [
        applyFieldVelocity('hero-noise', 0.9),
        decayAlpha({ rate: 0.035 }),
      ]),
      pipe('memory-glow', [
        onEnterZone('memory', add('emissive', 0.22)),
        insideZone('memory', multiply('radius', 1.005)),
      ]),
    ],
  }));
```

### API Rules

- Use semantic IDs that explain the article concept, not implementation details.
- Prefer normalized coordinates for article scenes unless the scene is explicitly bound to measured DOM/layout boxes.
- Keep authoring declarations declarative. Do not place renderer calls, Pixi objects, mutable graphics state, or DOM traversal in article scenes.
- Use `pipe()` to make effect order explicit.
- Use effect stages for behavior. Do not create subclasses for visual variants.
- Keep reusable authoring helpers small and named after publication concepts only after multiple scenes prove the abstraction.

## Consumption Model

The consumption path should remain lazy and article-local.

1. A page or article declares a canvas or custom element only where the animation is needed.
2. The blog client lazy-loads the animation scene and Pixi renderer for that article.
3. The scene is authored declaratively with `createScene(...)`.
4. Authoring code declares semantic objects: text sources, emitters, fields, zones, materials, timelines, and effect pipelines.
5. `compileScene(...)` turns the declaration into a `CompiledRuntimeScene`.
6. The compiled scene exposes simulation state and renderer-neutral primitives.
7. `mountScene(...)` owns lifecycle, resize, visibility, reduced-motion behavior, and frame scheduling.
8. `createPixiRenderer(...)` maps primitives to Pixi objects inside the adapter.
9. Dispose on unmount/navigation to release renderer resources and scene state.

Default pages must not pay for Pixi or the runtime.

### Text Consumption Model

Text participates in the runtime as a semantic source, not as a Pixi object in authoring code.

Correct shape:

1. Authoring declares a text source or text-bound emitter using semantic IDs.
2. The text source defines text content, bounds, source visibility, and optional debug behavior.
3. Emitters bind to the text source or its bounds.
4. Effects define peel, drift, dissolve, return, or reform behavior.
5. Compilation produces both particle systems and a renderer-neutral `TextPrimitive`.
6. Pixi renderer maps `TextPrimitive` to Pixi `Text`.

`SplitText` can be used later inside `renderer-pixi` for per-character rendering, but do not make Pixi `SplitText` the public authoring abstraction.

## Runtime Frame Model

The intended frame order is:

1. Update modulation sources.
2. Process scheduled bursts/triggers.
3. Spawn particles from emitters.
4. Apply field influence.
5. Integrate velocity.
6. Query zone occupancy.
7. Enqueue coarse semantic events.
8. Run transition effects bound to events.
9. Run continuous effect pipelines.
10. Decay and clean up dead particles.
11. Prepare renderer-facing batches and visual primitives.
12. Render through the adapter.

Keep this order inspectable. If a change alters the order, update this file and the ADR or add a new ADR.

## Effect Composition

Effects are pipelines over channels, not subclasses.

| Concept | Preferred Model | Avoid |
| --- | --- | --- |
| Reusable behavior | Small effect stage/module | Class hierarchy |
| Visual stacking | Ordered `pipe()` stages | Hidden side effects |
| Transition behavior | Coarse events like `zone.enter` | Per-frame event spam |
| Continuous behavior | Hot-loop systems over stores | Per-particle signal graphs |
| Parameter changes | Channels and modulation | Renderer-specific mutation |

### Channel Semantics

Current effect channels include:

- `velocity`
- `alpha`
- `radius`
- `emissive`
- `noise`
- `trail`
- `color`

Stages must declare whether they add, multiply, override, decay, sample a field, or bind to a timeline. Ambiguous effect semantics are not acceptable.

## Event Model

Events are for semantic transitions only.

Good events:

- `zone.enter`
- `zone.exit`
- `timeline.threshold`
- `emitter.burst`
- viewport suspended/resumed
- section enter/exit

Bad events:

- particle moved slightly
- alpha changed slightly
- radius pulsed this frame
- every integration step

The event model is deliberately coarse. Do not turn it into a universal reactive system.

## Renderer Isolation

PixiJS is only allowed under `src/renderer-pixi/`.

Allowed:

- Importing Pixi in `renderer-pixi/*`.
- Mapping runtime batches to Pixi `Graphics`, containers, textures, and cached renderer resources.
- Backend-specific resource management inside renderer packages.

Not allowed:

- Pixi imports in authoring, compile, sim, effects, timeline, or article-scenes.
- Returning Pixi objects from public APIs.
- Storing Pixi objects in runtime plans or authoring definitions.
- Designing scene APIs around Pixi concepts.
- Using DOM overlays to fake runtime primitives and then treating them as engine progress.

If a renderer feature needs to surface upward, define a renderer-neutral channel, material field, or adapter capability first.

## Text Emergence Milestone

The next serious experiment is **Text Emergence V1**.

It must include:

- visible Pixi-rendered source text
- particles emitted from the text source
- text remains legible while particles peel away
- source glow or material identity
- basic trail / persistence
- controls that affect real behavior, not just labels
- debug bounds for the text source

Acceptable v1 compromise:

- Use text bounds for emission before true glyph sampling.

Not acceptable:

- Particles spawning near DOM text while the runtime does not render or own the text.
- Calling a rectangle emitter "Text Emergence" without a runtime text primitive.
- Adding more experiments before Text Emergence reads as language becoming motion.

## Performance Rules

- Avoid per-frame object allocation in particle hot loops.
- Prefer typed arrays for large particle state.
- Keep event queues reusable and bounded by meaningful transitions.
- Use bitmasks for first-generation zone occupancy while zone counts remain intentionally small.
- Keep renderer-facing state compact and incremental.
- Do not introduce a global immutable store for simulation state.
- Do not introduce per-particle signals.
- Do not optimize blindly before a real scene demonstrates the bottleneck.

## Best Practices

- Start from a concrete article scene, then extract shared primitives only when repeated.
- Keep IDs stable and meaningful; they become debugging vocabulary.
- Use named pipes for every effect stack.
- Keep visual motifs small: ambient drift, zone glow, pulse, emergence, sparse electric accents.
- Build one visually undeniable experiment before expanding the lab.
- Prefer `TextPrimitive` and `ZonePrimitive` work over new controls or labels.
- Prefer scroll/time/section modulation over arbitrary animation constants.
- Respect `prefers-reduced-motion` through `mountScene(...)`.
- Preserve progressive enhancement: articles must remain readable without JS.
- Keep default pages light; import renderer code only from scene-specific client entries.
- Run `pnpm -C packages/animation typecheck` after package changes.
- Run `pnpm -r typecheck` before considering cross-package work complete.

## Anti-Patterns

- Building a general ECS before article scenes need it.
- Adding a substrate because it is interesting rather than because a published scene requires it.
- Hiding runtime cost behind cute authoring syntax.
- Encoding article semantics in renderer code.
- Letting Pixi leak into public authoring APIs.
- Treating zones, fields, and materials as decorative effects instead of semantic primitives.
- Treating a particle cloud as proof of every concept.
- Calling lab smoke tests finished experiments.
- Building more simulation substrates while the renderer still lacks text, zones, trails, and lines.
- Using inheritance trees for visual behavior.
- Emitting events for numerical changes that happen every frame.
- Making every page load Pixi by default.

## Insights And Rationale

| Insight | Rationale | Practical Rule |
| --- | --- | --- |
| Pure events are wrong for motion | Integration, decay, and renderer preparation are continuous work | Use systems/pipelines for per-frame computation |
| Pure signals are wrong for particles | Fine-grained reactive graphs would hide cost and broaden invalidation | Keep signals at orchestration boundaries only |
| Inheritance is wrong for effects | Visual behavior needs stacking, ordering, and reuse | Compose effect stages through pipes |
| Zones convert motion into meaning | Enter/exit/inside semantics let visuals carry article concepts | Model zones as first-class substrates |
| Materials define house style | Visual identity should be reusable across scenes | Route appearance through material channels |
| Emitters bind motion to content | Particles should emerge from article structure, not random screen space | Prefer text-box/layout-bound emitters for editorial scenes |
| Compilation protects performance | Declarative APIs can be readable while runtime plans stay compact | Compile definitions before frame execution |
| Renderer isolation protects ownership | Pixi is useful plumbing, not the product language | Keep adapter contracts renderer-neutral |
| Renderer vocabulary limits expression | Semantic runtime state is invisible without visual primitives | Add text, zone, trail, and polyline primitives before expanding the lab |
| Pixi text is plumbing, not product | Pixi already renders text; the runtime must define what text means | Use Pixi `Text` behind `TextPrimitive` |
| Text Emergence is the forcing function | It connects runtime work directly to the publication | Build this before Memory Zone or Fracture Pulse |

## References

| Reference | Role | Use When |
| --- | --- | --- |
| `docs/adr/0015-animation-library.md` | Base decision: Pixi-backed custom runtime | Re-checking renderer ownership, package boundaries, and site integration |
| `docs/adr/0015.1-animation-substrates-and-authoring-model.md` | Substrate, authoring, pipeline/event architecture | Adding primitives, effects, stores, or compile/runtime behavior |
| `docs/adr/0015.3-text-and-render-primitive-layer.md` | Renderer primitive correction and Text Emergence milestone | Deciding what to build next in renderer and lab work |
| `src/authoring/` | Public scene declaration surface | Changing how article scenes are written |
| `src/compile/` | Internal executable runtime plan | Changing how declarations become stores and pipelines |
| `src/sim/` | Hot-path storage and systems | Changing particle, zone, field, emitter, or occupancy behavior |
| `src/effects/` | Effect channels and pipeline stages | Adding visual behavior or operators |
| `src/renderer-pixi/` | Pixi backend implementation | Changing rendering details or Pixi resource management |
| `src/article-scenes/foundation-scene.ts` | First compiled scene example | Checking the intended authoring and consumption shape |

## Distilled Direction

- Build an animation language for essays, not an engine for everything.
- Keep authoring semantic, declarative, and pleasant.
- Keep runtime execution explicit, compiled, and data-oriented.
- Keep effects composable through ordered pipelines.
- Keep events coarse and meaningful.
- Make renderer-neutral visual primitives real before adding more lab concepts.
- Use Pixi text; own text semantics.
- Build Text Emergence before expanding the lab.
- Keep Pixi replaceable by isolating it behind renderer adapters.
- Let real articles decide which primitives deserve to exist.

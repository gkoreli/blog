# ADR-0015: Adopt a Pixi-backed custom animation runtime for gkoreli.com

* **Status:** Proposed
* **Date:** 2026-04-19
* **Owner:** Goga Koreli
* **Decision Type:** Foundational architecture
* **Supersedes:** None
* **Related:** Future ADRs for scene DSL, renderer abstraction, article hydration strategy, and performance budgets

---

## 1. Context

[gkoreli.com](https://gkoreli.com/) is not intended to behave like a conventional blog. It is a personal publication where selected essays are treated as **museum pieces**: each article may include bespoke motion, spatial storytelling, and interactive visual systems that express both artistic taste and engineering depth.

The publication is therefore both:

1. a writing surface for ideas, and
2. a vehicle for original visual computation.

The goal is not to sprinkle decorative animation across the site. The goal is to build a **personal animation/runtime layer** that enables article-specific visual systems such as:

* particles and fields
* rectangular or arbitrary geofences / spatial realms
* transitions triggered by entering or exiting zones
* glow, flame, electric, pulse, and compositing effects
* scroll-linked or time-linked choreography
* reusable pipes that transform behavior and rendering over time

The author strongly values:

* low-level systems thinking
* architectural coherence
* modular TypeScript design
* performance
* artistic control
* the ability to evolve the system into a house visual language over time

At the same time, the publication itself must continue to ship. The engine must serve the work, not permanently delay it.

This creates a central architectural question:

> Should the publication adopt a fully custom rendering engine from the start, or should it use an existing high-performance 2D rendering substrate while preserving a custom, opinionated authoring and simulation layer?

This ADR proposes the first answer.

---

## 2. Problem Statement

The publication needs an animation/runtime architecture that:

* supports highly bespoke article visuals
* preserves authorial control over motion language and systems design
* performs well for 2D article-centric effects
* avoids excessive time spent rebuilding commodity rendering infrastructure
* leaves open a path toward lower-level rendering ownership later
* keeps the default site payload restrained for non-animated pages

The wrong decision would create one of two failure modes:

### Failure Mode A: Over-reliance on a general-purpose engine

A large framework or engine could push the publication toward generic patterns, leaky abstractions, or unnecessary capability breadth. This would weaken architectural ownership and dilute the visual identity.

### Failure Mode B: Premature engine construction

A fully custom raw WebGL/WebGPU renderer from day one could consume disproportionate time in plumbing, lifecycle management, compatibility handling, batching, and graphics infrastructure before enough article pieces exist to justify the abstraction.

The publication requires a middle path.

---

## 3. Decision

**We will adopt PixiJS as the rendering substrate for the first generation of the animation system, while building a custom, opinionated TypeScript runtime on top of it.**

PixiJS will be used as a **rendering backend**, not as the authoring model.

The publication will expose its own primitives for:

* scenes
* timelines
* particle stores
* zone/geofence systems
* effect pipes
* signals/events
* article choreography
* renderer adapters

PixiJS will be isolated behind a renderer package or adapter boundary.

### In short

* **Rendering substrate:** PixiJS
* **Public authoring model:** custom
* **Simulation/runtime model:** custom
* **Scene/effect vocabulary:** custom
* **Article integration:** custom
* **Future backend option:** raw WebGL/WebGPU, if and when justified

---

## 4. Decision Drivers

The decision is driven by the following priorities, in order.

### 4.1 Ship article experiences without surrendering architectural ownership

The publication must produce real pieces, not only infrastructure. A rendering substrate is useful if it accelerates publishing while still allowing a custom visual language to emerge.

### 4.2 Keep the engine narrow and publication-specific

The desired runtime is not a general-purpose game engine. It is a deliberately constrained visual operating layer for essays and publication pieces.

### 4.3 Preserve room for low-level engineering

Even while adopting PixiJS, the architecture should preserve the ability to own:

* scene composition semantics
* state transition design
* signal/event propagation
* effect pipelines
* shader/material design
* performance strategy
* eventual renderer replacement for hot paths or future backends

### 4.4 Favor high performance for 2D visual storytelling

The runtime must support visually rich article scenes while maintaining a disciplined performance envelope.

### 4.5 Avoid rebuilding commodity graphics plumbing prematurely

Features such as renderer bootstrapping, texture/resource management, batching, transforms, render targets, filters, and scene submission are costly to rebuild before the publication’s own repeated needs are well understood.

---

## 5. Vision Alignment

This decision aligns with the publication’s vision in the following way.

### 5.1 The publication is the product

The primary artifact is the published essay or piece. The engine exists to intensify the reading experience and express a recognizable authorship.

### 5.2 The runtime becomes a personal visual language

The goal is not merely to animate DOM elements. The goal is to build a reusable vocabulary of motion and computational motifs, such as:

* thought clusters
* attractor fields
* realm transitions
* glowing memory zones
* electric fracture motifs
* scroll-activated compositional shifts
* signal-linked article rhythm

These primitives should feel like part of the same authored world across multiple essays.

### 5.3 Engineering excellence remains visible

Using PixiJS does not eliminate engineering ambition. It relocates it:

* from renderer bootstrapping to runtime design
* from generic engine breadth to custom scene semantics
* from broad capability ownership to precise creative leverage

The publication should feel technically authored, not library-driven.

---

## 6. Considered Options

### Option A: Build the full renderer from scratch immediately (raw WebGL/WebGPU)

#### Description

Build a bespoke rendering engine, likely in TypeScript, directly on top of WebGL or WebGPU from the beginning.

#### Benefits

* maximal ownership
* lowest-level control over buffers, passes, and shaders
* potentially strongest long-term performance ceiling
* engine itself becomes part of the artistic statement

#### Costs

* significantly more boilerplate and infrastructure work
* higher time-to-first-piece
* large surface area: batching, textures, state changes, DPR, lifecycle, resources, browser behavior, debugging
* risk of building generic infrastructure before repeated needs are known

#### Why not chosen now

This path is attractive and remains viable later. It is not selected for the first generation because the publication benefits more from quickly discovering its scene vocabulary and repeated patterns before committing to a fully custom renderer stack.

---

### Option B: Use PixiJS directly throughout article code

#### Description

Use PixiJS as both substrate and de facto authoring model, allowing article implementations to directly manipulate Pixi containers, sprites, graphics, and filters.

#### Benefits

* fastest initial development path
* low ceremony
* easy to prototype

#### Costs

* leaks rendering concerns into content and article code
* tightly couples authored pieces to Pixi primitives
* weakens long-term renderer abstraction
* makes future backend substitution far harder
* risks having the publication speak Pixi’s language instead of its own

#### Why not chosen

The publication needs its own authoring grammar. Direct Pixi usage everywhere would create convenience now at the expense of architectural coherence later.

---

### Option C: Adopt PixiJS as a backend behind a custom runtime (**chosen**)

#### Description

Use PixiJS for rendering while keeping the public API and scene model custom.

#### Benefits

* fast enough to ship real pieces
* high-performance 2D substrate
* preserves custom visual language
* isolates dependency risk
* allows future renderer replacement or specialization
* good balance between creative velocity and engineering control

#### Costs

* some performance overhead relative to raw rendering
* requires discipline to keep Pixi isolated
* may still require custom shaders/materials for signature effects
* some abstractions will need careful design to avoid merely wrapping Pixi poorly

#### Why chosen

It best matches the publication’s current phase: ambitious, systems-oriented, artistic, but still needing to ship.

---

## 7. Architectural Principles

The following principles govern the design.

### 7.1 Pixi is an implementation detail

PixiJS must not become the conceptual model of the publication.

The publication should author scenes in terms of:

* fields
* zones
* particles
* transitions
* motifs
* timelines
* article sections
* visual events

not in terms of:

* containers
* sprites
* graphics objects
* Pixi filter wiring

### 7.2 The runtime is layered

The system will separate:

1. **authoring layer** — the DSL used by article code
2. **simulation layer** — particles, zones, transitions, signals
3. **renderer adapter** — maps runtime primitives to Pixi constructs
4. **site integration layer** — hydration, lazy loading, lifecycle per article/page

### 7.3 Default pages remain light

The entire publication should not pay the cost of the animation runtime. Animated scenes should be mounted only on pages or sections that need them.

### 7.4 Build narrow, then generalize

No primitive becomes part of the engine unless it proves reusable across multiple real pieces.

### 7.5 Performance is designed, not assumed

Performance must be treated as an explicit product property:

* clear budgets
* lazy loading
* limited scene scope
* selective effect use
* measured profiling
* avoidance of unnecessary reactivity in hot paths

---

## 8. Proposed Technical Stack

### 8.1 Core language and tooling

* **TypeScript** for all engine/runtime code
* existing site stack for the publication shell and content rendering
* package-level separation for engine modules

### 8.2 Rendering substrate

* **PixiJS** as first-generation renderer backend

Expected uses:

* GPU-backed 2D drawing
* sprites and particle-like visual primitives
* filters, render textures, blend modes where needed
* scene submission and frame rendering

### 8.3 Internal engine packages

Proposed package boundaries:

```text
engine/
  core/
  sim/
  effects/
  timeline/
  renderer-pixi/
  authoring/
  article-scenes/
```

#### `core/`

Responsibilities:

* lifecycle
* frame loop integration
* clocks and timing
* shared types
* IDs and registries
* internal event bus / signal contracts

#### `sim/`

Responsibilities:

* particle state stores
* typed-array runtime state where useful
* emitters
* zones/geofences
* spatial queries
* enter/exit detection
* effect state transitions

#### `effects/`

Responsibilities:

* effect pipe definitions
* glow/flame/electric/pulse motifs
* material parameter models
* composition rules

#### `timeline/`

Responsibilities:

* scroll-linked choreography
* time-based progression
* section-triggered scene changes
* orchestration policies

#### `renderer-pixi/`

Responsibilities:

* all direct Pixi imports
* mapping runtime data to Pixi display/render objects
* shader/filter adapter logic
* render target and resource handling
* resize/DPR handling

#### `authoring/`

Responsibilities:

* scene DSL
* article-friendly APIs
* composition helpers
* high-level scene declarations

#### `article-scenes/`

Responsibilities:

* concrete article-specific scene implementations
* experiments and one-off compositions
* reusable visual motifs promoted only after repetition proves value

---

## 9. Runtime Model

### 9.1 Authoring model

Article code should declare scenes in publication-oriented language.

Example shape:

```ts
createArticleScene('topologies-of-thought')
  .hero(hero => {
    hero.addField('nodes', graphParticles({ density: 120 }));
    hero.addZone('insight', rectZone({ x: 0.2, y: 0.1, w: 0.3, h: 0.4 }));
    hero.pipe('nodes', enterZone('insight', glow({ color: '#ffb36b' })));
  })
  .section('intro', section => {
    section.timeline(scrollModulates('nodes', 'intensity'));
  });
```

This is illustrative, not final.

### 9.2 Simulation model

The simulation runtime should favor:

* incremental updates
* stable object identity only where needed
* typed arrays / packed state for hot paths where justified
* spatial indexing for zone queries
* coarse-grained events for transitions

The runtime should avoid a naive global-store model where every change recomputes an entire scene graph.

### 9.3 Signal model

Signals are allowed and desirable at the orchestration layer, but not as the universal model for every hot-path primitive.

Good uses for signals:

* article section entry
* timeline state
* viewport changes
* user interaction modes
* effect parameter shifts
* scene-level transitions

Bad uses for signals:

* per-particle x/y updates if they introduce avoidable reactive overhead
* broad invalidation graphs that recompute unrelated visual state every frame

### 9.4 Renderer model

The renderer adapter consumes runtime state and produces a frame. The renderer remains replaceable in principle.

Example interface shape:

```ts
interface RendererAdapter {
  init(canvas: HTMLCanvasElement): Promise<void> | void;
  resize(width: number, height: number, dpr: number): void;
  beginFrame(): void;
  render(scene: RuntimeScene): void;
  endFrame(): void;
  dispose(): void;
}
```

This interface must remain owned by the publication, not by Pixi.

---

## 10. Site Integration Strategy

### 10.1 Tiered animation policy

The publication will use animation in tiers.

#### Tier 1: default pages

* no Pixi runtime
* standard DOM/CSS behavior only
* no additional canvas cost

#### Tier 2: enhanced articles

* lightweight scene mount
* subtle ambient or section-specific effects
* lazy-loaded runtime

#### Tier 3: museum pieces

* dedicated scene orchestration
* full effect pipelines
* article-specific choreography
* stronger performance budgets and profiling

### 10.2 Hydration strategy

* scenes load only on pages that declare them
* article content should render first
* animation runtime hydrates after page readiness or at a chosen article lifecycle point
* heavy scenes should be code-split from the base publication shell

### 10.3 DOM/canvas relationship

The publication should preserve readable, indexable, semantic content in the DOM.

The animation runtime augments the essay; it does not replace the document model.

---

## 11. Performance Strategy

### 11.1 Performance posture

PixiJS introduces some abstraction overhead compared to raw WebGL/WebGPU. This is accepted for generation one because the expected bottlenecks for article-scale 2D scenes are more likely to come from:

* effect design choices
* scene scope
* excessive filter usage
* excessive object churn
* poor batching
* unnecessary redraw/update patterns
* CPU-side simulation costs

rather than from Pixi itself in isolation.

### 11.2 Constraints

The runtime must preserve these habits:

* prefer limited, intentional canvases
* lazy-load per article
* keep scenes bounded in scope
* profile real pieces before generalizing
* avoid universal engine complexity
* avoid turning every page into a rendering surface

### 11.3 Hot-path rules

* do not rebuild scene objects unnecessarily each frame
* avoid fine-grained reactivity in tight loops
* prefer pooled runtime state for particle systems
* limit expensive filters and masks
* isolate experiment-only effects from common runtime paths

### 11.4 Measurement

Each museum-piece article should be profiled in practice. Performance decisions should be made using actual scenes, not hypothetical benchmarks.

---

## 12. Consequences

### Positive consequences

* the publication can ship visually rich article experiences sooner
* the engine retains a custom voice and architecture
* Pixi absorbs substantial rendering infrastructure complexity
* future backend replacement remains possible if boundaries are respected
* the publication develops a coherent house style through custom primitives rather than direct library usage

### Negative consequences

* renderer abstraction may add some design overhead up front
* some low-level control is deferred rather than owned immediately
* future migration away from Pixi will still be costly, though less costly than if Pixi leaked everywhere
* performance tuning may still require renderer-specific understanding and custom shader work

### Neutral consequences

* the system becomes a hybrid: not a raw engine, not a pure library app
* the publication must maintain discipline around package boundaries and scene budgets

---

## 13. Risks and Mitigations

### Risk 1: Pixi leaks into authoring code

**Risk:** article code begins depending directly on Pixi constructs, weakening abstraction.

**Mitigation:**

* direct Pixi imports allowed only in `renderer-pixi/`
* code review standard: no Pixi types in authoring layer APIs

### Risk 2: The engine becomes too general

**Risk:** the runtime grows into a pseudo-game-engine.

**Mitigation:**

* no feature promotion without repeated use in real pieces
* optimize for publication scenarios only

### Risk 3: Performance regressions from convenience abstractions

**Risk:** elegant APIs conceal expensive update patterns.

**Mitigation:**

* keep hot paths explicit
* separate orchestration APIs from simulation storage
* profile article scenes early

### Risk 4: Over-animation weakens editorial tone

**Risk:** the site becomes visually noisy or self-indulgent.

**Mitigation:**

* use the tiered policy
* reserve strongest effects for pieces that warrant them
* preserve reading clarity as a hard constraint

### Risk 5: Backend lock-in becomes stronger over time

**Risk:** custom abstractions slowly mirror Pixi internals.

**Mitigation:**

* maintain a strict renderer interface
* define scene primitives in publication language, not display-object language
* keep backend-specific concerns internal

---

## 14. Non-Goals

The first generation does **not** aim to:

* become a public general-purpose animation framework
* support every 2D rendering use case
* reproduce all capabilities of PixiJS
* solve arbitrary game-engine problems
* optimize every scene for absolute maximum theoretical GPU throughput
* commit to WebGPU immediately

This is a publication runtime first.

---

## 15. Implementation Plan

### Phase 1: Foundation

Build:

* package boundaries
* renderer adapter contract
* Pixi-backed renderer package
* scene lifecycle and mount/unmount flow
* one minimal article scene

Deliverable:

* one article page with a dedicated Pixi-backed scene, lazy-loaded and isolated

### Phase 2: Core primitives

Build:

* particle field primitive
* rectangular geofence primitive
* enter/exit transitions
* one or two signature effects (for example glow and electric)
* simple timeline/scroll orchestration

Deliverable:

* a reusable minimal visual vocabulary shared by at least two pieces or experiments

### Phase 3: House language

Build:

* better authoring DSL
* motif library
* stronger scene composition tools
* article section choreography
* profiling and performance budgets

Deliverable:

* a recognizable visual identity across multiple essays

### Phase 4: Evaluate backend evolution

Only after several real scenes exist, evaluate:

* whether Pixi is the bottleneck
* which subsystems deserve lower-level ownership
* whether a WebGL or WebGPU experimental backend is justified

Deliverable:

* data-driven ADR for backend specialization, if needed

---

## 16. Exit Criteria for Reconsideration

This ADR should be revisited if any of the following become true:

* Pixi materially blocks a core visual effect the publication depends on
* performance ceilings are reached in real article scenes despite disciplined design
* the publication begins requiring GPU-side simulation that is awkward under the current backend
* the authoring/runtime abstractions stabilize enough to justify a more custom renderer
* the publication’s identity increasingly depends on lower-level rendering techniques beyond what the current backend can support comfortably

---

## 17. Decision Summary

For the first generation of the animation runtime powering gkoreli.com, we will:

* adopt **PixiJS** as the rendering substrate
* build a **custom TypeScript runtime and scene DSL** on top of it
* keep Pixi isolated behind a renderer adapter boundary
* use animation selectively, preserving the publication’s editorial tone
* treat the runtime as a **personal visual operating layer** for essays and museum-piece articles
* preserve a future path toward lower-level renderer ownership if and when the work proves it necessary

This decision optimizes for the right balance of:

* artistic control
* engineering depth
* shipping velocity
* performance
* long-term architectural leverage

---

## 18. Appendix: Guiding Statement

> The publication is not a blog with animation added.
> It is an authored editorial space where writing, computation, and motion are composed as one medium.
> PixiJS is adopted not as the language of the work, but as the substrate beneath a more personal visual language.

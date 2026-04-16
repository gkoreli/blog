# ADR-0012: Animation Engine — Pipeline Architecture for a Zero-Dependency, High-Performance Canvas Framework

## Status

Accepted — 2026-04-16. Foundation implemented. Engine expansion in progress.

---

## Context

The blog needed ambient canvas animations for article preambles and section heroes. The naive approach — one self-contained animation file with its own loop, observers, and mouse tracking — worked for the first animation but immediately collapsed under composition. Adding a second animation meant duplicating all the infrastructure. Adding a cursor interaction meant reaching into the animation and mutating its internals.

The real constraint was more interesting: this is a personal blog with no production SLAs. That's not a reason to write bad code — it's an invitation to build something *correct* from scratch with zero constraints on approach. No framework to blame, no team to coordinate with. The architecture should be a learning artifact as much as a runtime one.

Three tensions defined the design space:

1. **Composition vs. coupling** — animations and effects need to combine freely without either knowing about the other.
2. **Performance vs. simplicity** — canvas animations are easy to write and catastrophically easy to make slow. The architecture had to make the fast path the obvious path.
3. **Declarative vs. imperative** — the call site should read like a description of *what* runs, not *how* the loop works.

---

## Decision

Build a first-party animation engine around a **unidirectional data pipeline** per frame. Each frame flows through a fixed sequence of pure transforms before touching the canvas. The runner owns all infrastructure; modules and effects own only their domain logic.

### Core Contracts

```
AnimationModule     — what an animation *is*
Effect              — what a transform *does*
AnimationRunner     — what the loop *manages*
AnimationPoint[]    — the currency between them
```

**`AnimationModule`** implements four methods:
- `resize(w, h)` — rebuild any size-dependent state
- `tick(t, w, h) → AnimationPoint[]` — advance state, return base positions for this frame
- `draw(ctx, points, t, w, h)` — render; `points` are post-effects, `ctx` is already DPR-scaled
- `dispose?()` — clean up owned resources

**`Effect`** implements:
- `apply(points, ctx) → AnimationPoint[]` — pure transform, no side effects
- `pause?() / resume?()` — lifecycle hooks for effects with background work
- `dispose?()` — clean up owned resources

The key invariant: **`tick()` returns base positions. `draw()` receives post-effects positions.** The module never sees effects and effects never see the module. They share only `AnimationPoint[]`.

### The Runner

The runner is the only place that owns infrastructure:

- **DPR scaling** — `canvas.width = w * devicePixelRatio`, `ctx.scale(dpr, dpr)` before every draw
- **60fps cap** — `TARGET_MS = 15` threshold (not `1000/60`; 16.67ms causes jitter-drops at 60Hz)
- **ResizeObserver** — calls `module.resize()` on canvas size change; also called synchronously at startup to avoid the race condition where IntersectionObserver fires before ResizeObserver
- **IntersectionObserver** — pauses the rAF loop and calls `effect.pause()` on all effects when off-screen; resumes and calls `effect.resume()` when back. Zero CPU when scrolled away.
- **Cleanup function** — `start()` returns `() => void` that disconnects everything and calls `dispose()` on the module and all effects

### Call Site (Declarative Composition)

```ts
animate(caustic())
  .pipe(cursorRepulsion(host))
  .pipe(someOtherEffect())
  .start(canvas, container)
```

This reads as a description. The runner wires the pipeline; the caller never touches a loop.

### Per-Frame Flow

```
module.tick(t, w, h)
  → AnimationPoint[]          // base positions — pure animation math

applyEffects(points, effects, { w, h, t })
  → AnimationPoint[]          // post-effects positions — pure transforms, left-to-right

ctx.save()
ctx.scale(dpr, dpr)
module.draw(ctx, points, t, w, h)
ctx.restore()

t++
```

Each stage is a function over data. Nothing mutates shared state. Effects are referentially transparent given the same input.

---

## Rationale

### Why unidirectional pipeline over direct mutation?

The alternative — effects that directly mutate animation internal state — makes composition impossible. You can't chain two effects, you can't swap effects in/out, and you can't test an effect in isolation. The pipeline means each effect is a pure function `(points, ctx) → points`. They compose trivially because they're just function composition.

This is the same insight as Redux or event sourcing: don't let side effects reach into your state directly. Transform data through a defined channel.

### Why `AnimationPoint[]` as the currency?

`AnimationPoint` is the minimum viable data that makes sense to transform: a 2D position in logical pixels. Effects that need more information (velocity, charge, color) get it from their own captured state — not from the point itself. This keeps the pipeline narrow and effects decoupled from animation-specific semantics.

Future consideration: `AnimationPoint` may grow optional fields (`meta?: Record<string, unknown>`) for effects that need per-point metadata without breaking the contract.

### Why does the module get `draw()` rather than returning render data?

Early iterations considered making `draw()` return a descriptor (what to draw) rather than painting directly. This would enable headless testing and serialization. It was rejected for now because: the Canvas 2D API is stateful by design (clip paths, transforms, composite ops), encoding that as data creates a shadow DOM problem. The payoff isn't worth the complexity at this stage. The separation of concerns is preserved by the fact that `draw()` only receives `points` — it can't see effects or the runner.

### Why not Web Workers or OffscreenCanvas?

For animations at this scale (22–200 points, 60fps, single canvas per page), the CPU overhead is negligible after fixing the real perf bugs. The actual bottleneck was `fillRect(0, 0, w, h)` × N with screen blend mode — a GPU fill-rate problem, not a JS CPU problem. Fixing the fill rect to the gradient's bounding box resolved the tab-wide slowdown. OffscreenCanvas would be the right call for particle simulations in the thousands or when the main thread is genuinely saturated.

### Why `TARGET_MS = 15` and not `1000/60`?

At 60Hz, rAF fires every ~16–17ms. With `TARGET_MS = 16.67`, frames that arrive at 16ms are below the threshold and get skipped. The next frame arrives at 33ms and gets drawn. This silently degrades to 30fps. `TARGET_MS = 15` gives a 1.67ms window that passes all 60fps frames while still blocking 120Hz frames from burning double the work.

### Why does cursor-force have its own rAF loop?

The cursor-force smoothing needs to run at display rate to produce clean velocity values — if it only ran when the animation drew, you'd get stale velocity readings on skipped frames. The two loops are intentionally independent: cursor-force smooths at display rate, the animation draws at 60fps. The IntersectionObserver pause/resume lifecycle ensures cursor-force stops when the canvas is off-screen.

### Why document-level mousemove, not canvas-level?

The canvas typically sits under a card or overlay that captures pointer events. Canvas-level `mousemove` would stop firing the moment the cursor enters any child element above the canvas. Document-level tracking uses `getBoundingClientRect()` to compute relative position — it works regardless of the z-index stack, and the `passive: true` flag means it adds zero frame cost.

---

## Performance Invariants

These are the decisions that keep the engine fast. Violating any of them will degrade the entire tab, not just the animation.

- **Never `fillRect(0, 0, w, h)` inside a loop.** Fill only the bounding box of what you're drawing. A full-canvas fill with any composite mode reads and writes every pixel — O(w×h) per call, N calls per frame.
- **`globalCompositeOperation` changes are expensive.** Set once before the loop, reset once after. Never toggle per-point.
- **No allocations in the hot path.** `applyEffects` reuses the same array. Effects should mutate velocity structs in-place rather than allocating new objects per frame.
- **Effects must stop their rAF loops on `pause()`.** The IntersectionObserver is the only gate between "on-screen" and "off-screen" work. If an effect ignores `pause()`, it will run forever.
- **Zero dependencies.** Canvas 2D, rAF, ResizeObserver, IntersectionObserver, MutationObserver — all native, all available in every browser that can render the blog. No bundle overhead, no version drift, no supply chain.

---

## What Was Implemented

- `pipeline.ts` — `AnimationPoint`, `EffectContext`, `Effect`, `AnimationModule`, `applyEffects()`
- `runner.ts` — `AnimationRunner` class, `animate()` factory, 60fps cap, DPR scaling, ResizeObserver, IntersectionObserver, effect lifecycle
- `caustic.ts` — Lissajous orbital points with radial gradient screen-blend draw (22 points, bounding-box fill)
- `neural.ts` — `threshold()` and `flow()` modules — charge-based neural network, theme-aware, shared `buildNetwork()`
- `cursor-force.ts` — document-level cursor tracking, dual lerp rates (enter 0.07 / leave 0.035), own rAF loop with pause/resume
- `effects/cursor-repulsion.ts` — velocity accumulation, quadratic falloff, explicit px/frame magnitude, pause/resume lifecycle
- `components/neural-canvas.ts` — declarative web component: `<nisli-neural-canvas mode="caustic|flow|threshold">`

---

## Next Vision: Animations Engine v2

The current foundation is intentionally minimal. The next phase is building this into a complete, self-contained engine — still zero dependencies, still native-only — with the following expansions.

### Effects Store

A library of composable, reusable effects:

- `cursorRepulsion(container, opts)` — ✅ implemented
- `cursorAttraction(container, opts)` — opposite polarity, points drift toward cursor
- `turbulence(seed, opts)` — per-point noise displacement using a fast value-noise function
- `gravity(direction, strength)` — constant directional force accumulation
- `springReturn(stiffness)` — explicit spring force pulling toward base position (alternative to damping)
- `vortex(cx, cy, opts)` — rotational force around a point
- `waveform(frequency, amplitude, axis)` — sinusoidal displacement on one axis
- `colorShift(effect)` — first effect to carry non-positional data (requires `AnimationPoint` metadata extension)

Effects compose left-to-right. Order matters — repulsion before turbulence is physically different from turbulence before repulsion. This is the store.

### Animations Store

A library of `AnimationModule` implementations, each with clean separation from effects:

- `caustic()` — ✅ orbital Lissajous + screen-blend gradients
- `threshold()` / `flow()` — ✅ neural network charge propagation
- `particles(count, opts)` — basic particle system with birth/death cycle
- `constellation(count, opts)` — point network with proximity-based edges
- `fluid(opts)` — velocity field with curl noise
- `typography(text, opts)` — text exploded into point cloud, effects manipulate letter positions
- `terrain(opts)` — height-map as point grid, draw as wireframe or filled

Each module lives in `animations/` and is a pure function returning `AnimationModule`. No global state. No shared mutable singletons.

### Engine Layer

Between the current runner and the modules, a proper engine layer:

```
Scene
  └── Layer[]
        └── AnimationModule + Effect[]
```

- **Scene** manages multiple layers composited together (different blend modes per layer)
- **Layer** is what the current `AnimationRunner` implements — one module + one pipeline
- **Scheduler** owns the single rAF loop for the whole scene, distributes `tick()` calls, enforces frame budget
- **FrameBudget** — configurable ms limit per frame; if a layer exceeds its allocation it gets frame-skipped, not the whole scene

### Reactive Signals

The cursor-force is currently a polling model (the effect reads `force.x/y` each frame). The next model is signals:

```ts
const cursor = cursorSignal(container);    // Signal<{ x, y, strength }>
const scroll = scrollSignal();             // Signal<{ y, velocity }>
const time   = clockSignal();              // Signal<{ t, dt }>

animate(caustic())
  .pipe(repulsion(cursor))
  .pipe(turbulence(time))
  .start(canvas, container)
```

Signals are lazy observables with a single subscription per frame. The runner subscribes once; effects read the current value without owning the tracking infrastructure. This inverts the current model (effect creates cursor tracking) into a cleaner dependency injection.

### Debug Overlay

A toggleable `?debug=1` overlay that draws:
- Base positions (pre-effects) as small dots
- Post-effects positions as displaced dots
- Velocity vectors per point
- Frame time graph
- Active effect list with per-effect transform cost

Zero overhead in production (tree-shaken when `debug` flag not set).

### Serialization / Replay

Because each frame is deterministic given `(module, effects, t, w, h)`, a recording is just: initial state + input events + frame count. A replay is re-running the pipeline with the same seed. This enables:
- Screenshot-quality export of any frame
- Regression testing: save a reference frame, compare after changes
- Blog embeds where the animation plays from a deterministic seed (no live canvas on low-power devices)

---

## Rejected Approaches

| Approach | Reason rejected |
|---|---|
| Three.js / PixiJS | Dependency overhead; engine would own the render loop making the architecture impossible |
| Web Workers + OffscreenCanvas | JS is not the bottleneck at this scale; adds significant API complexity for zero current gain |
| Returning render descriptors from `draw()` | Canvas 2D is stateful; descriptor model becomes a shadow DOM — complexity without payoff |
| Global event bus for cursor | Makes effect instantiation order matter implicitly; the explicit `createCursorForce(container)` makes dependencies visible |
| Per-animation CSS animations | Can't compose, can't respond to physics, can't be driven by the pipeline |
| `1000/60` fps threshold | Causes 30fps on 60Hz displays due to frame timing jitter; 15ms is the correct threshold |

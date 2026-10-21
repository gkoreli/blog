---
title: "OpenClaw Chose Solid. Here’s Why I’d Choose Nisli."
date: "2026-10-21"
description: "OpenClaw’s Lit-to-Solid migration, examined through Nisli’s native components, async ownership, and reproducible browser comparisons."
seoTitle: "Nisli vs Solid and Lit: Why I’d Choose Nisli"
alternativeHeadline: "Nisli, Solid 2, and Lit compared through update boundaries and component ownership"
section: engineering
tags: [nisli, web-components, solidjs, lit]
---

# OpenClaw Chose Solid. Here’s Why I’d Choose Nisli.

OpenClaw moved its web frontend from Lit to Solid 2. [Peter Steinberger reported](https://x.com/steipete/status/2112597162924351909) roughly six days to remove Lit, another week to make the result idiomatic Solid, and about 600 pull requests overall. He described smaller JavaScript and CSS and a more responsive interface. The [migration plan](https://github.com/openclaw/openclaw/issues/168114) makes the architectural motivation explicit:

> The gain is deleting hand-built reactivity, not raw render speed

That is the part I want to examine. A streaming workspace needs more than efficient DOM writes. Someone has to connect state to the view, dispose subscriptions, reject obsolete results, and decide what happens when a pane stays alive but disappears from the screen.

I built [Nisli](https://github.com/gkoreli/nisli), a TypeScript UI framework, around related problems in my own application. I would reach for it because it combines native custom elements, binding-level reactivity, and component-owned cleanup in ordinary TypeScript and tagged templates. OpenClaw’s migration gives me a concrete way to examine that choice.

Three findings shape that argument:

- Web Components and fine-grained reactivity are independent choices. Nisli combines them; modern Lit can combine them too.
- Resource ownership changes how much coordination reaches application code. Async correctness and a consistent pending view are separate responsibilities.
- Native rendering still has costs. The initial fixture exposed slower Nisli mounts and faster narrow Lit updates. Investigating those results produced a faster candidate and exposed compatibility regressions that the release review had to repair.

## The rendering library disappeared before the old architecture did

OpenClaw’s initial plan inventoried 833 `requestUpdate()` calls, 47 reactive-controller classes, and numerous subscriptions, tasks, and stale-result counters. Those are the plan’s historical counts. They describe the amount of machinery the application had accumulated; the existence of a controller or an explicit update call is not itself a defect. [Migration plan](https://github.com/openclaw/openclaw/issues/168114).

The public timeline reports a more revealing transition: 666 textual `requestUpdate` references remained when direct Lit usage was retired. By its October 20 scan, the count was zero in the same source scope. Those references include declarations and types as well as calls. The timeline is an AI-authored reconstruction whose underlying tool results are omitted from the public page; its counts remain reported evidence. Its useful distinction is between converting the renderer and changing the architecture. [Timeline](https://team.openclaw.ai/chat/roboclaw/timeline-of-solid-js-to-lit-pr-refactors-5ba10f632c29434c9f79a92c3c16a7a3).

The merged [retirement PR](https://github.com/openclaw/openclaw/pull/174213) independently establishes the narrower dependency milestone: Control UI Lit imports and direct dependencies were removed, while the separate Canvas renderer retained transitive Lit packages.

Changing a template language can leave the application’s old coordination rules intact. If an external store still tells a controller to tell a component to redraw, putting JSX at the end of that chain does not remove its earlier stages. OpenClaw’s follow-up work moved toward reactive projections and ownership that could make more of those connections implicit.

That is a useful question for anyone choosing a UI framework: how much code will the application need between a domain event and the smallest correct view update?

## Nisli came from years of frontend work, then a specific application failure

Nisli grew out of my experience with Angular, React, Vue, Svelte, Web Components, and other frontend systems. I wanted the semantics and ergonomics I found strongest across them: components and composition, fine-grained state, useful dependency injection, and a rendering model close to the browser.

The immediate pressure came from backlog-mcp’s viewer. Its original custom elements assigned `innerHTML` on state changes. That destroyed child state, scroll positions, and focus. A backend event could rebuild the task list even when one task changed. Event listeners had to be reattached, and cleanup was inconsistent. The [original design record](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0001-web-component-framework.md) documents those failures. The [backlog-mcp article](/one-hundred-pull-requests) explains the broader project that produced them.

My starting point was already native Web Components. I needed a better reactive and ownership model around them. I wanted targeted updates and reliable ownership while keeping those native boundaries.

Nisli’s component authoring looks like this:

```ts
import { component, html, signal } from '@nisli/core';

component('size-counter', () => {
  const count = signal(0);
  return html`
    <button @click=${() => count.value++}>Count: ${count}</button>
  `;
});

document.body.append(document.createElement('size-counter'));
```

That is the [standalone counter from the browser validation](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/repro/src/size-nisli.ts). Setup creates the state and the template bindings for that mounted component lifetime. An ordinary state update changes a binding; it does not call setup again. A genuine removal and later reconnect can create a new lifetime.

The browser still sees a registered custom element. Inside its light DOM are ordinary buttons, text nodes, and event listeners. The framework owns the subscriptions that connect those nodes to signals.

For typed composition, `component()` also returns a factory whose props accept plain values or signals. Inside setup, props are signals. That keeps the TypeScript contract at the call site and preserves a live binding when a caller passes a signal. It does not make the HTML inside a tagged string fully type-checked; template diagnostics and browser tests still do work. [Component contracts](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/component.ts#L124).

The state boundary is deliberate too. Application services use `inject` and `provide`; related descendants use subtree-scoped `createContext`. An external store still needs a projection into signals. Once that bridge exists, views can consume signals directly instead of receiving a redraw request. These APIs do not decide domain authority, and app-global services should not be mistaken for per-pane state. [App services](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/injector.ts), [subtree context](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/element-context.ts).

## A render call and a DOM replacement are different events

Lit’s ordinary model starts an update when a reactive property changes or code requests one. The component’s `render()` method evaluates its template expressions. Lit then updates the changed DOM parts. It does not replace the entire subtree on every render. My old `innerHTML` implementation and Lit are very different on that point. [Lit rendering](https://lit.dev/docs/components/rendering/).

Suppose one component renders 1,000 values and one value changes. The DOM mutation can be a single text update while the component still reevaluates the expressions for all 1,000 values. Separating those kinds of work explains the difference between a broad update boundary and a narrow one.

Nisli creates an effect for a signal-bound slot. The primitive-text path retains the existing text node and assigns its `data`. Its attribute path creates a similarly targeted effect. There is no component-level render function to reevaluate for an ordinary signal write. [Text and attribute bindings](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/template.ts#L613).

Solid also establishes fine-grained reactive expressions. Its JSX compiler can generate the DOM construction and update instructions ahead of time. Nisli discovers bindings from tagged templates at runtime. The shared idea is a dependency graph that can update a small part of the view; the implementation and authoring costs differ. [Solid’s reactive model](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity).

Lit has two important answers here. An application can put the frequently changing value behind a smaller component boundary. Its experimental `@lit-labs/signals` integration also offers `watch()` for pinpoint bindings that can skip the other template expressions. A fair comparison includes both. [Lit signals](https://lit.dev/docs/data/signals/).

A separate instrumented pass made ten changes to one cell in a 1,000-row panel. The broad Lit component evaluated 10,000 row values. The narrow Lit component, Solid, and Nisli evaluated ten. Reads inside Lit’s `watch()` were not instrumented, so its expression count is unreported. All five variants produced ten mutation records in the observed subtree.

That result explains the work being avoided. It also prevents the easy, wrong explanation that Lit was rebuilding 1,000 DOM rows.

## The benchmark makes the boundary matter more than the brand

For this article, I had Codex inspect the pinned implementations, build the comparison fixtures, and operate the browser. The resulting five production variants use one Lit component, Lit with pinpoint signals, a Lit component per row, compiled Solid 2, and Nisli. Each mounted 1,000 rows, then changed the first value 10,000 times. Every update received the same six microtask turns, followed by a check that the DOM text matched. Instrumentation counters were disabled for timing.

The publication comparison uses the **published Nisli core 0.57.0 package**, Lit 3.3.3, Lit signals 0.3.0, and the compiled Solid 2.0.0-rc.14 family named in OpenClaw’s migration plan. It ran in Chrome 155 on an arm64 Mac with macOS 27.0.1. Each variant had one unreported warmup and seven measured samples, with run order rotated. The table reports medians. [Source, exact conditions, and every sample](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/publication/README.md).

| Variant | Mount 1,000 rows, ms | 10,000 verified updates, ms |
|---|---:|---:|
| Lit, one component | 3.8 | 355.6 |
| Lit, pinpoint signals | 4.8 | 29.3 |
| Lit, component per row | 6.4 | 3.9 |
| Solid 2, compiled signals | 3.6 | 6.0 |
| Nisli 0.57.0, direct signals | 8.6 | 6.2 |

Nisli and Solid are in the same small range for hot updates here. Their 0.2 ms difference across 10,000 updates does not establish an application-performance ranking. The narrow Lit component is faster than both. Its additional component boundaries cost more at mounting time than the broad Lit component, but pay off during these tiny updates.

These are DOM-update throughput measurements with scheduling and verification overhead. The loop does not wait for paint, measure input latency, exercise Markdown parsing, or reproduce OpenClaw’s workspace. It changes one fixed cell; it is not a general list or UI benchmark. Passing every update check establishes that the implementations performed the requested updates, not that a person would perceive a difference.

The Nisli mount result is a real cost I own. Released core caches parsed templates, but a new mount still clones and walks the DOM to establish bindings. Solid’s compiler can prepare more of that work ahead of time. The old [compiled-positional-template proposal](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0014-compiled-positional-templates.md) describes a more ambitious binding blueprint; it is not the implementation measured here.

The result I can defend is that Nisli offers narrow updates as its normal authoring model without a framework-specific compiler. It does not establish that Nisli wins every operation.

## Following a losing benchmark into the runtime

The slower mount led to a separate experiment, begun against core 0.56.0. That branch remains unmerged. Core 0.57.0 subsequently shipped a different change: production diagnostic removal. The table above measures the published 0.57.0 package; the before/after table below records the earlier branch experiment. The two changes have not been combined or measured together.

Parsing once was already implemented. The repeated work was discovering bindings in each clone: visiting static nodes, copying child lists, inspecting attributes, and recognizing the same markers again. The experimental branch caches binding locations alongside the parsed template. A native TreeWalker locates target elements and comments in each clone, and all targets are resolved before binding expands or removes earlier siblings.

This still uses the browser’s parser. Mounts still clone nodes, traverse the clone, and create effects. Targeted elements still have their attributes processed. Caching a complete set of binding instructions would remove more repeated work, but that further idea is unimplemented.

The first prototype also broke cases that passed on the baseline. Ref accessors and custom-element prop setters could replace descendants during binding, leaving pre-collected targets pointing into discarded subtrees. The hardened branch keeps live discovery for templates containing dynamic refs, literal custom elements, customized built-ins, or `html:inner`. DOM shims use node-type guards and retain live discovery when TreeWalker is absent. These fallbacks preserve behavior and limit where the mount optimization applies.

A separate update experiment skipped copying and sorting queues with zero or one pending effect. One effect is already ordered. Removing it before execution preserves a later pass for work it schedules; multiple effects retain the existing creation-order sort.

The larger update gain came from changing the scheduling transport to a reused fulfilled Promise. **Both that callback and `queueMicrotask` use the browser’s microtask queue.** A Promise does not give the flush higher priority. The measured difference is in the tested implementation path; the engine internals were not profiled. Queue handling alone moved the update fixture from 6.10 to 5.90 ms. Adding the bare Promise transport reached 3.70 ms.

The complete hardened branch was measured in two fresh Chrome page loads, with three warmups and fifteen measured rounds per load. These are pooled medians of all thirty samples:

| Operation | Core 0.56.0 baseline | Experimental branch | Less elapsed time |
|---|---:|---:|---:|
| Mount 1,000 ordinary rows | 8.90 ms | 7.20 ms | 19% |
| Mount 1,000 rows with more static markup | 39.10 ms | 30.30 ms | 23% |
| Mount 1,000 rows with more bindings | 16.40 ms | 14.20 ms | 13% |
| 10,000 individually verified updates | 6.10 ms | 3.50 ms | 43% |

Fallback mounts were roughly unchanged: 8.60 → 8.65 ms with refs and 10.90 → 10.70 ms with literal custom elements, with variation between runs. Parsing and mounting 300 fresh template identities measured 2.80 → 2.60 ms in one small shape; that is no cold-start guarantee. Narrow Lit still won the paired update fixture at 2.70 ms. [Method, exact patch, and raw runs](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/release/README.md).

The branch has costs. The same tiny counter application grew from 8,237 to 8,692 gzip bytes when built against it: **455 extra bytes (+5.5%)** for that application. The cache retains numeric locations per callsite; retained heap has not been profiled. Its public declarations stayed byte-identical to 0.56.0, but declarations cannot establish behavioral compatibility.

The Promise path also changes error handling. A throwing callback rejects the returned Promise, whereas `queueMicrotask` reports an uncaught exception. The branch catches an unexpected escaping scheduler failure and schedules a throwing microtask to retain uncaught-exception reporting. Other queued microtasks can run before that report. Ordinary effect errors keep their existing containment, but this adapter does not recover an interrupted flush. **That error contract remains under review.** The measured speedup is evidence for an experiment, not sufficient reason to accept the scheduling change.

## A small API still needs a scheduler

The first Nisli proposal wanted a very small framework and rejected a runtime scheduler. Current Nisli does have one: signal writes push invalidation through a dependency graph, computed values pull fresh results when read, and effects coalesce through microtasks. Historical intent is useful context, but it cannot substitute for the [current implementation](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/signal.ts).

One decision I still like is removing explicit `batch()`. The application was wrapping writes that microtask coalescing could already group. The [accepted decision](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0015-eliminate-batch-automatic-coalescing.md) kept one normal scheduling model and a `flush()` escape hatch for code that truly needs the DOM updated synchronously.

That is the kind of ergonomics I wanted: remove a decision the caller usually does not need to make. A signal write is readable immediately in TypeScript; its effects normally run later. Imperative focus or geometry work still has to respect that scheduling boundary.

The runtime has a byte cost as well. Four independent counter applications were built with the same Vite production pipeline, and their emitted JavaScript was measured with Node’s gzip defaults. This table uses the published Nisli 0.57.0 package:

| Counter application | Gzip bytes of emitted JavaScript |
|---|---:|
| Lit | 5,939 |
| Lit plus pinpoint signals | 9,693 |
| Solid 2 | 11,516 |
| Nisli 0.57.0 | 6,295 |

These are complete JavaScript artifacts for the same small app, with framework code included. They are not npm tarball sizes or predictions for every application. They exclude HTML and build tools. The new Nisli bundle was opened and clicked; the other three bundles were byte-identical to the previously clicked builds. Nisli’s zero runtime dependencies describe its package graph; this counter still ships slightly more JavaScript than ordinary Lit. The separate 0.57.0 production-artifact work reduced its earlier 8,237-byte result to 6,295 bytes. [Release](https://github.com/gkoreli/nisli/releases/tag/core-v0.57.0). [Sources and size results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/publication/README.md#bundle-size).

## Correct async results and a consistent async view are different promises

Nisli’s `resource()` came from another concrete consumer. The backlog-mcp Markdown component was coordinating an effect and signals by hand, without adequate stale-result, rejection, or disconnect protection. A cached query would introduce policies that a local transformation did not need. [Resource decision](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0028-local-async-resource.md).

The API separates the tracked source from the asynchronous loader:

```ts
const result = resource(
  () => selected.value,
  (selectedId, abortSignal) => load(selectedId, abortSignal),
);
```

Here `selected` is a signal and `load` is an application-supplied promise-returning function. Only reads inside the source callback establish dependencies. The loader receives that source value and an abort signal. A new run or disposal invalidates the previous generation; a result may commit only while its generation is current. When the resource is created during component setup, that component owns its disposal. [Implementation](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/resource.ts).

The async fixture checked cancellation and correctness separately. Request A began, then B began and completed. A completed afterward while deliberately ignoring its abort signal. Nisli kept B’s result. It also aborted a third pending request when the owning component was removed.

Lit’s `Task` also kept B and aborted the superseded A. Its plain task in this fixture did not abort the third request when its host disconnected. A Lit component can add that cleanup; it is a difference in the tested default ownership, not an inability to cancel work. Lit already provides latest-invocation race protection, so describing this capability as unique to Nisli would be false. [Task’s documented behavior](https://lit.dev/docs/data/task/), [fixture](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/repro/src/lit.ts).

Solid 2’s async memo also suppressed the obsolete result. The memo callback did not receive an abort signal in the tested API; an application can supply its own cancellation adapter. Its more distinctive feature is how async work participates in the reactive graph.

Consider a selected account with two panels. Both initially show A. The user selects B. The fast panel finishes, but the slow panel is still pending. The fixture produced these default states:

| At that intermediate point | Selection | Fast panel | Slow panel |
|---|---|---|---|
| Nisli local resources | B | B | A |
| Solid 2 async memos | A | A | A |

Solid 2 held the settled view until both new results were ready. Nisli independently published the fast result and retained the slow resource’s previous successful value. The race guard prevented stale completions from overwriting newer results; retained data could still leave the screen showing different subjects.

That difference in visible behavior can decide the framework. A set of financial totals may need coordinated consistency. A workspace’s independent panels may need immediate, separate progress. Solid offers pending indicators, `latest`, and loading boundaries to control the experience. With Nisli I need to express the appropriate view policy myself—for example, gating related results on a shared identity, clearing a changed subject, or showing a pending state instead of old data. [Solid 2 async model](https://v2.solidjs.com/concepts/async-reactivity), [Nisli fixture](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/repro/src/nisli.ts), [Solid fixture](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/repro/src/solid.tsx).

Nisli’s local abstraction suits the way I want to divide responsibilities. Solid supplies additional coordination that Nisli applications must express themselves. The application still owns mutation authority, shared cache policy, and any side effect that happened inside a loader before its result was discarded.

## The browser owns more state than the component does

Nisli’s most useful native-platform lesson came from a bug in Nisli itself. Moving a connected component with an ordinary DOM insertion caused disconnect and reconnect callbacks. Nisli tore down its scope and ran setup again, duplicating rendered output and losing state. Keyed reorders and light-DOM projection both exercised that path. [Lifecycle repair](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0023-move-resilient-component-lifecycle.md).

The repair defers teardown by a microtask and checks whether the element has reconnected:

```ts
queueMicrotask(() => {
  if (this.isConnected) return;
  this._teardownNow();
});
```

That is an excerpt of the [component’s internal disconnect path](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/component.ts#L614). The full path also guards against scheduling duplicate teardown. Component authors do not write it. Same-tick moves preserve the scope; a genuine removal disposes it a microtask later.

Native `moveBefore()` can preserve additional browser-owned state, and Nisli uses it for eligible keyed moves. The empty `connectedMoveCallback` opts its custom elements into move-preserving lifecycle behavior. The [HTML standard](https://html.spec.whatwg.org/multipage/custom-elements.html#preserving-custom-element-state-when-moved) explains that distinction.

Both paths ran in the same Chrome instance. An ordinary `insertBefore` move preserved the Nisli setup scope and input node but lost focus. The native move preserved focus too. Removing the component produced one cleanup, and changing its signal afterward did not rerun the disposed effect. These observations establish the tested Chrome behavior; forcing the fallback in Chrome is not a Safari test.

This is why I like building on native capabilities while keeping the guarantees precise. A framework can preserve its own state through a fallback and still lose browser-managed state. Native APIs also have preconditions and limits; retaining an input node does not prove every aspect of editing state survived.

There is another boundary: hiding a pane is not disposing it. The hidden Nisli component continued updating. OpenClaw explicitly models retained, presented, retiring, and disposed lifetimes and parks projections while a retained surface is hidden. Nisli does not infer those application states from `hidden`. A long-lived workspace still needs presentation gates. [OpenClaw’s lifetime contract](https://github.com/openclaw/openclaw/issues/168114).

## What I would choose, and what the migration does not establish

The combination I would choose Nisli for is specific: native custom elements with typed factory composition, fine-grained bindings as the ordinary path, synchronous state reads, and component-owned effects and local async resources. I want to author those behaviors directly in TypeScript and tagged templates without making a framework compiler part of the requirement.

OpenClaw’s migration makes that combination relevant. Its team wanted to remove hand-built reactive connections while preserving existing TypeScript domain owners. Nisli offers primitives for that shape of application. Whether it would have reduced OpenClaw’s migration cost or improved its runtime performance would require porting representative OpenClaw surfaces and testing their actual contracts. I have not done that port.

Solid is a strong choice when its compiled authoring model and coordinated async semantics are the desired foundation. Lit remains a strong choice when its component lifecycle and ecosystem fit, especially when update boundaries are chosen deliberately. My own benchmark’s fastest hot-update variant was Lit.

The asset story needs the same separation. OpenClaw’s Web Awesome retirement reported startup CSS falling from 45,321 to 38,844 gzip bytes, while JavaScript changed by only 18 bytes in that paired build. Those savings came from removing vendor assets and support. They cannot be credited to fine-grained rendering, and I cannot claim them for Nisli. [Removal PR](https://github.com/openclaw/openclaw/pull/173590).

I still prefer Nisli’s combination for the applications I want to build. If I were evaluating it for OpenClaw, I would start with one transcript pane and its existing store, then check update scope, cancellation, focus, retention, and disposal against the current behavior. The question would be whether the same user contract takes less application-level coordination. That is the next test the architectural preference has to survive.

---

## Glossary

| Term / claim | Primary source | Date / scope |
|---|---|---|
| OpenClaw’s reported Lit-to-Solid migration | [Peter Steinberger](https://x.com/steipete/status/2112597162924351909) | October 20, 2026; firsthand report |
| Deleting hand-built reactivity and preserving domain owners | [OpenClaw issue #168114](https://github.com/openclaw/openclaw/issues/168114) | Historical working plan, checked October 20 |
| Direct Lit retirement and transitive Canvas exception | [PR #174213](https://github.com/openclaw/openclaw/pull/174213) | Merged retirement; checked October 20 |
| Targeted DOM writes versus component template evaluation | [Lit rendering](https://lit.dev/docs/components/rendering/) | Checked October 20 |
| Pinpoint signal bindings | [Lit Labs signals](https://lit.dev/docs/data/signals/) | Experimental integration; 0.3.0 tested |
| Async task supersession and abort signals | [Lit Task](https://lit.dev/docs/data/task/) | 1.0.3 tested |
| Integrated async reactivity and held updates | [Solid 2 async documentation](https://v2.solidjs.com/concepts/async-reactivity) | 2.0.0-rc.14 tested |
| Custom-element state during moves | [HTML standard](https://html.spec.whatwg.org/multipage/custom-elements.html#preserving-custom-element-state-when-moved) | Checked October 20; Chrome native and forced-fallback paths tested |
| Nisli’s implemented behavior | [Pinned core source](https://github.com/gkoreli/nisli/tree/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src) | Core 0.57.0 at `1d055cabdffbea8ff8d82cbfd88a6081882ca8b2` |
| Historical optimization branch | [Exact patch and experiment record](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/release/README.md) | Based on 0.56.0; unmerged; scheduling contract under review |
| Current production artifact | [Core 0.57.0 release](https://github.com/gkoreli/nisli/releases/tag/core-v0.57.0) | Published October 20 Pacific; separate from the optimization branch |

Written with assistance from Codex, including source inspection, fixture construction, browser checks, and drafting. The [claim ledger](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/02-claims.md) records the evidence boundaries. The [publication comparison](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/publication/README.md) includes source, package identity, individual samples, and limitations; the [original reproduction](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/repro/README.md) preserves the earlier 0.56.0 results.

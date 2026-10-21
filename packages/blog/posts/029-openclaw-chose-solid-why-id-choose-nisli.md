---
title: "OpenClaw Chose Solid. Here’s Why I’d Choose Nisli."
date: "2026-10-21"
description: "OpenClaw’s Lit-to-Solid migration before and after, plus two practical Nisli examples: streaming text without rerendering and cancellable session previews."
seoTitle: "Nisli vs Solid and Lit: Why I’d Choose Nisli"
alternativeHeadline: "OpenClaw’s migration and practical comparisons of Nisli, Solid, and Lit"
section: engineering
tags: [nisli, web-components, solidjs, lit]
---

# OpenClaw Chose Solid. Here’s Why I’d Choose Nisli.

OpenClaw moved its web frontend from Lit to Solid 2. [Peter Steinberger reported](https://x.com/steipete/status/2112597162924351909) roughly six days to remove Lit, another week to make the code idiomatic Solid, and about 600 pull requests overall. He described smaller assets and a more responsive interface.

The part that interests me is how much code existed just to keep the screen current. OpenClaw’s [migration plan](https://github.com/openclaw/openclaw/issues/168114) counted 833 `requestUpdate()` calls and 47 reactive-controller classes. Its stated goal:

> The gain is deleting hand-built reactivity, not raw render speed

I built [Nisli](https://github.com/gkoreli/nisli) to solve related problems while keeping native Web Components. For the workspaces I build, I want three things together:

- **Update one value without rerunning the component’s template.** A streaming reply should update its text without reevaluating the rest of the pane.
- **Keep the component a real browser element.** Register it, compose it through a typed TypeScript factory, and let its lifetime own its work.
- **Make async cleanup routine.** Switching sessions or removing a preview should cancel its request and prevent an old response from replacing the new one.

Nisli gives me that combination without requiring a framework-specific compiler. The examples below show what I mean. The benchmarks also show where Lit and Solid beat it.

## What OpenClaw actually changed

The migration had two distinct jobs: replace Lit rendering, then remove the old machinery around it. The [shared timeline](https://team.openclaw.ai/chat/roboclaw/timeline-of-solid-js-to-lit-pr-refactors-5ba10f632c29434c9f79a92c3c16a7a3) describes that progression. For the before and after here, I checked the source and merged pull requests.

The chat page shows why a renderer swap was only the beginning:

| Stage | What the chat page did |
|---|---|
| Original Lit page | Extended `OpenClawLightDomElement`, declared reactive fields, installed a `SubscriptionsController`, and owned a separate viewer-presence controller. |
| Intermediate Solid page | Still obtained `ChatPageState` from a host registry, connected it manually, forwarded prop changes through `state.requestUpdate()`, and called `state.disconnect()` during cleanup. |
| After the lifecycle refactor | Created state inside the Solid lifetime with `createChatPageState(host, props, application)` and read `state.snapshot()`. Viewer presence registered its own `onCleanup(clear)`. |

Those stages are visible in the [original Lit source](https://github.com/openclaw/openclaw/blob/88b4ae9fba33/ui/src/pages/chat/chat-page.ts) and [chat-page lifecycle diff](https://github.com/openclaw/openclaw/pull/173833/files). The later change removed a parallel component lifecycle. The session rules, attachment handling, and other application behavior still needed an owner.

A smaller example makes the change easier to see. OpenClaw’s agent-memory panel copied configuration into local state, subscribed for changes, and notified its view. This is the relevant code **before a follow-up Solid refactor**, with unrelated setup and cleanup omitted:

```ts
function syncConfigSnapshot() {
  dreaming.configSnapshot = context.runtimeConfig.state.configSnapshot;
}

// During setup:
syncConfigSnapshot();
const unsubscribe = context.runtimeConfig.subscribe(() => {
  syncConfigSnapshot();
  notify();
});

// During cleanup:
unsubscribe();
```

Afterward, it used a shared helper to read that store reactively:

```ts
const config = projectOwner(context.runtimeConfig, source => source.state);

// Inside the returned view() method:
config.read();
```

The same patch replaced the copied `configSnapshot` field with a getter into the original owner. The view no longer needed its own copy-and-notify subscription. [Before/after diff](https://github.com/openclaw/openclaw/pull/175006/files).

`projectOwner` is OpenClaw code. It still subscribes to the external store and registers disposal with Solid. The useful improvement is that callers share that implementation instead of repeating it. [Projection implementation at this refactor](https://github.com/openclaw/openclaw/blob/c70a4fd2252072c4f55b200c5c8cc68a94a1085c/ui/src/lib/reactive/projection.ts).

Nisli would also need an adapter for OpenClaw’s existing stores. Signals do not automatically make an arbitrary TypeScript object reactive. Once that adapter exists, I want views to read signals directly, with no extra redraw callback.

## Why I built Nisli this way

Nisli grew out of years with Angular, React, Vue, Svelte, Web Components, and other frontend systems. I wanted useful parts of those experiences together: typed composition, fine-grained state, dependency injection, and direct use of the browser’s DOM.

The immediate problem was [backlog-mcp’s viewer](/one-hundred-pull-requests). Its custom elements assigned `innerHTML` on state changes. That destroyed child state, scroll positions, and focus, then required event listeners to be attached again. The [original design record](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0001-web-component-framework.md) records those failures.

I wanted to keep the custom elements and fix how they updated. Lit already avoids wholesale DOM replacement; the failure was in my old implementation. Nisli’s further choice was to make individual signal bindings the normal update path.

The following examples use public `@nisli/core` 0.57.0. They are small, runnable examples of the behavior I would want in a workspace, not ports of OpenClaw components.

## Example 1: stream a reply without disturbing a draft

A reply receives new text while the user types in a nearby draft. The reply should change. The draft’s DOM node, value, and focus should stay put.

```ts
import { component, html, signal } from '@nisli/core';

const Reply = component<{ text: string }>(
  'demo-reply',
  props => html`
    <article>
      <p>${props.text}</p>
      <label>Draft <input aria-label="Draft"></label>
    </article>
  `,
);

const reply = signal('Thinking…');
const view = html`${Reply({ text: reply })}`;
view.mount(document.body);

// A later event from the application's stream:
reply.value = 'Here is the first part of the answer.';
```

`Reply({ text: reply })` checks the prop type and keeps the connection to the signal. Passing a plain string would also work. Inside the component, `props.text` is a signal either way.

When the stream changes `reply.value`:

- Nisli updates the bound text node.
- It does not run the component’s setup function again.
- It does not rebuild or write to the draft input.

That leaves room to put several independently changing values in one component without turning each value into a child component solely to limit template evaluation. The browser sees a registered `<demo-reply>` containing ordinary light-DOM elements. [Factory contracts](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/component.ts#L124), [binding implementation](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/template.ts#L613).

**Compared with Lit:** ordinary Lit updates rerun the component’s template expressions, then change only the DOM parts that need it. Lit can preserve this draft too. Nisli’s benefit here is avoiding the other expression evaluations by default. Lit offers narrower components and experimental `watch()` signal bindings when that matters. [Lit rendering](https://lit.dev/docs/components/rendering/), [Lit signals](https://lit.dev/docs/data/signals/).

**Compared with Solid:** Solid also provides fine-grained updates. Its JSX compiler prepares DOM construction and bindings ahead of time. Nisli resolves tagged-template bindings at runtime and keeps a native custom-element boundary. I prefer that combination when components need to live in browser-owned markup or an existing page. It costs mount time, as the measurements below show.

There is a typing tradeoff: the factory call checks props, but HTML inside the tagged string is not fully type-checked like JSX. Template diagnostics and browser tests still matter.

## Example 2: switch sessions without showing an old response

A user selects session A, then B. B responds first. A responds later. Closing the preview should also stop its outstanding request.

Nisli’s `resource()` puts those responsibilities in one place:

```ts
import { component, computed, html, resource, signal } from '@nisli/core';

const SessionPreview = component<{ sessionId: string }>(
  'demo-session-preview',
  props => {
    const preview = resource(
      () => props.sessionId.value,
      async (id, signal) => {
        const response = await fetch(
          `/api/sessions/${encodeURIComponent(id)}/preview`,
          { signal },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      },
    );

    const text = computed(() => {
      if (preview.loading.value) return 'Loading…';
      if (preview.error.value) return 'Could not load this session.';
      return preview.data.value ?? '';
    });

    return html`<pre>${text}</pre>`;
  },
);

const selected = signal('A');
const view = html`${SessionPreview({ sessionId: selected })}`;
view.mount(document.body);

// A later selection event:
selected.value = 'B';
```

The endpoint is application code and returns plain text. The component supplies the request and its loading/error presentation. Nisli handles:

1. Tracking the selected session.
2. Aborting the previous run when a new run starts.
3. Rejecting obsolete results even if the loader ignores cancellation.
4. Aborting outstanding work when the component is genuinely removed and its scope is disposed.

I do not need a request counter, an `AbortController` field, or a separate disconnect handler in this component. The loading branch deliberately hides the previous session’s data while the new request runs. A transport abort cannot undo a server-side mutation; this example is a read.

This API came from backlog-mcp’s Markdown component, which had hand-written async effects without adequate stale-result, rejection, or disconnect protection. [Resource decision](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0028-local-async-resource.md), [implementation](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src/resource.ts).

**Compared with Lit:** `Task` already aborts superseded requests and rejects stale results. In our fixture, it did not abort the pending request when the host disconnected; the component needed to add that cleanup. Nisli includes that ownership when `resource()` is created during setup. [Lit Task](https://lit.dev/docs/data/task/).

**Compared with Solid 2:** the tested async memo also rejected obsolete results, but its callback did not receive an `AbortSignal`. OpenClaw’s plan explicitly calls for a cancellation adapter when immediate transport cancellation matters. Nisli supplies that signal directly. Solid offers something broader in return: coordinating pending async reads across the view.

For example, with two panels changing from A to B, our default Nisli resources showed the fast panel’s B result while the slow panel still retained A. Solid 2 held the settled A view until both B results were ready. The loading branch above handles this one preview; it does not add Solid’s coordinated async behavior to Nisli. [Solid async model](https://v2.solidjs.com/concepts/async-reactivity), [behavior fixtures and results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/publication/README.md).

## What the browser checks and benchmarks say

The two examples above have [reproducible browser checks](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/examples/README.md). Those checks cover draft preservation, reactive props, request races, errors, and removal. They do not establish OpenClaw performance.

The separate timing fixture mounts 1,000 rows, then changes one value 10,000 times. Every write gets six microtask turns and a DOM correctness check. These are medians from seven samples per variant after one warmup, in rotated order, using Chrome 155 on an arm64 Mac running macOS 27.0.1.

| Variant | Mount 1,000 rows, ms | 10,000 verified updates, ms |
|---|---:|---:|
| Lit, one component | 3.8 | 355.6 |
| Lit, pinpoint signals | 4.8 | 29.3 |
| Lit, component per row | 6.4 | 3.9 |
| Solid 2, compiled signals | 3.6 | 6.0 |
| Nisli 0.57.0, direct signals | 8.6 | 6.2 |

Versions: published Nisli 0.57.0, Lit 3.3.3, Lit signals 0.3.0, and Solid 2.0.0-rc.14. OpenClaw has since [merged an upgrade to rc.16](https://github.com/openclaw/openclaw/pull/179116). These are **rc.14 measurements**, not results for its current dependency. [Fixture, conditions, and every sample](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/publication/README.md).

The useful conclusions are specific:

- **Update scope matters.** In a separate ten-write check, broad Lit evaluated 10,000 row values; narrow Lit, Solid, and Nisli evaluated ten. All five variants made ten observed DOM mutations. Lit’s `watch()` reads were not instrumented.
- **Nisli’s hot updates were close to Solid’s here.** A 0.2 ms difference over 10,000 writes does not rank real applications. Narrow Lit was faster than both.
- **Nisli mounted slowest.** It caches parsing, but still clones and walks each new DOM tree to establish bindings. Solid’s compiler can prepare more of that work beforehand.

This loop measures DOM-update throughput, including scheduling and verification overhead. It does not measure paint, input latency, Markdown rendering, or a real chat workload.

Four counter apps built through the same production pipeline emitted **5,939 gzip bytes for Lit**, **9,693 for Lit plus signals**, **11,516 for Solid 2**, and **6,295 for Nisli 0.57.0**. These are complete small-app JavaScript artifacts, not universal framework sizes. [Build sources and sizes](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/publication/README.md#bundle-size).

The slow mount prompted an optimization experiment. A historical 0.56.0-based candidate reduced the ordinary-row mount median from 8.90 to 7.20 ms and the update loop from 6.10 to 3.50 ms across 30 Chrome samples. It also added 455 gzip bytes to that counter app and changed unexpected-error timing. A later queue-only attempt briefly reached main, then was reverted after a three-engine check showed no convincing overall gain. **Neither optimization shipped in the measured 0.57.0 package.** The [full experiment](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/release/README.md) and [negative follow-up](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/integration/README.md) remain available.

## Where I would choose Nisli

For a workspace built from native components, Nisli lets me write the two examples above directly: typed props, small updates, local async state, and cleanup tied to the element’s lifetime. That is the practical reason I would choose it.

There are a few additional details I care about:

- **State reads are immediate.** After a Nisli signal write, TypeScript reads the new value; effects normally run in a coalesced microtask. OpenClaw kept its synchronous domain owners because Solid 2’s deferred setters could not replace their mutate-then-read contracts. Nisli’s semantics fit that style, though they do not eliminate domain rules. [Scheduling decision](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0015-eliminate-batch-automatic-coalescing.md).
- **Moving a component need not recreate it.** Nisli preserves its setup scope through same-tick moves. For eligible keyed moves, native `moveBefore()` can also preserve browser state such as focus. The fallback can preserve the component while losing focus; native support matters. [Lifecycle decision](https://github.com/gkoreli/nisli/blob/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/docs/adr/0023-move-resilient-component-lifecycle.md).
- **Hidden is still alive.** Hiding a Nisli pane does not stop its effects or requests. OpenClaw’s hidden-pane gates, cache policies, and awaited teardown for embedded applications would still need explicit design.

I would choose **Solid** when compiled JSX and coordinated async presentation are priorities. I would choose **Lit** when its component model fits the project and I am happy to select smaller update boundaries or add signal bindings where needed. I would choose **Nisli** when I want fine-grained bindings and owned async work inside native custom elements, with no required framework compiler.

That makes Nisli a concrete option for this kind of application. It does not establish that OpenClaw chose incorrectly. I have not ported its transcript pane or measured its migration cost. That port, with its existing behavior tests, would be the next useful comparison.

---

## Glossary

| Term / claim | Primary source | Date / scope |
|---|---|---|
| OpenClaw’s migration goals | [Plan #168114](https://github.com/openclaw/openclaw/issues/168114) | Historical inventory at `88b4ae9fba33` |
| Component-owned chat state | [PR #173833](https://github.com/openclaw/openclaw/pull/173833) | Merged October 16, 2026 |
| Removing copied configuration and redraw subscriptions | [PR #175006](https://github.com/openclaw/openclaw/pull/175006) | Merged October 17, 2026 |
| Lit’s template updates and async tasks | [Rendering](https://lit.dev/docs/components/rendering/), [Task](https://lit.dev/docs/data/task/) | Lit 3.3.3 and Task 1.0.3 tested |
| Solid’s coordinated async updates | [Solid 2 docs](https://v2.solidjs.com/concepts/async-reactivity) | rc.14 tested; OpenClaw upgraded to rc.16 October 21 |
| Nisli’s component, signal, and resource behavior | [Pinned implementation](https://github.com/gkoreli/nisli/tree/1d055cabdffbea8ff8d82cbfd88a6081882ca8b2/packages/core/src) | Published core 0.57.0 |

Written with assistance from Codex, including source inspection, fixture construction, browser checks, and drafting. The [claim ledger](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/nisli-framework/02-claims.md) records evidence and limits.

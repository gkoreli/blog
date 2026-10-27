# A successful browser action needs an observed target and result

October 27, 2026 UTC. Continues [the denominator repair](29-unreported-classifications-and-denominators.md), whose release recorded unexplained pointer no-effects. Human-operated trials remain deferred. This experiment uses agent-operated input and synthetic local reports; it supplies no human or hardware label.

## Reproduced failure

The dashboard's filter summary combined `white-space: nowrap` with `overflow-x: auto`. At a 390×844 viewport, the summary containing Page `/audit` and Kind Unresolved needed **483px inside 354px**. Its Clear button was 29.4px tall. An overlay scrollbar covered part of that row.

A local diagnostic served the actual isolated built HTML/client with the already-native-accepted synthetic report corpus from research 29. Its baseline mode serves the exact stylesheet from `baf6c2e`. A bounded, wrapping diagnostic element records event type, reviewed control label, target tag/id, coordinates and `isTrusted`; it neither widens the page nor calls production. External script tags are stripped from the preview. Source file and native event captures are committed only as closed synthetic evidence; raw operational copies remain private.

On the reproduced failing pointer action, both `pointerdown` and `pointerup` targeted **P#stats-scope**, not the Clear button; no click was observed. The selected URL and five-event result stayed unchanged. The whole page remained 390px wide, so a page-wide overflow test alone did not expose this internal hit-target problem. Keyboard activation cleared the selection in the earlier experiment.

This locates the failed delivery before the dashboard's delegated click handler. The overlay geometry and the controlled CSS comparison support scrollbar interception; the exact engine-internal hit-test implementation is not established. It is not evidence of a lost API request or incorrect classification.

[Closed synthetic results](filter-pointer-local.json) preserve targets, dimensions and trust flags. The final diagnostic limits itself to stats controls, retains only activation keys, caps the trace at 100 events and wraps its own output.

## Small layout repair

Remove the filter summary's no-wrap/scroll behavior and apply `overflow-wrap: anywhere`. Labels and existing native Clear buttons can occupy multiple lines. The JavaScript click handler, filters, collector, classifier, report SQL/cache version and data remain unchanged.

With the repaired stylesheet and identical corpus/viewport, the summary occupies **354px inside 354px**, with normal whitespace and visible overflow. The attempted clear produces `pointerdown`, `pointerup` and `click`, all targeting **BUTTON / Clear kind filter**. The URL loses the kind constraint and the displayed result changes **five → ten**, as the corpus requires. This is acceptance of the observed control and layout, not universal browser/device usability.

The maintained [local preview](../../../scripts/preview-stats-scope.mjs) accepts an isolated `DIST`, the private fixture JSON emitted by [the native report helper](../../../scripts/check-unreported-kinds.mjs), and `before|after`. Run it from the repository root. At 390×844, open `/stats?range=7d&path=%2Faudit&kind=unresolved`, inspect the diagnostic, and activate Clear kind filter. The helper binds only localhost, uses synthetic reports, disables caching and rejects selections outside its corpus. Stop both owned servers afterward; reset the viewport. The diagnostic is never shipped in the site's HTML.

## A browser-trust flag is not a human label

The agent-driven pointer events in both failing and successful actions have **`isTrusted=true`**. The earlier keyboard activation also produced a trusted click. This is a concrete counterexample to treating the browser trust flag as proof of human input. The current analytics collector does not use that flag; this experiment does not add event monitoring or a new detection heuristic.

| Primary source checked October 27 | What it establishes | Implementation consequence |
|---|---|---|
| [WHATWG DOM, Event.isTrusted](https://dom.spec.whatwg.org/#dom-event-istrusted) | Browser dispatch versus script dispatch; not human provenance | Keep operator labels external to this flag. |
| [W3C WebDriver, processing actions](https://www.w3.org/TR/webdriver2/#actions) | The July 2026 working draft explicitly describes trusted events for automated activation | An automation interface can produce trusted browser events; this does not identify which backend this experiment uses. |
| [Pointer Events Level 3, firing events](https://www.w3.org/TR/pointerevents3/#firing-events-using-the-pointerevent-interface) | Event targeting uses capture or hit testing; detailed hit testing is outside that specification | Inspect the actual target before blaming event-handler or request logic. |
| [CSS Overflow 3, scrollbar layout](https://drafts.csswg.org/css-overflow-3/#scrollbar-layout) | The editor's draft distinguishes overlay scrollbars, whose size/appearance varies and which occupy content | Prefer wrapping for this short mixed text/control summary; gutter reservation does not solve overlay scrollbars generally. |
| [UI Events, activation order](https://www.w3.org/TR/uievents/#legacy-event-types) | The February 2026 working draft describes keyboard activation generating click | Keep native button activation and keyboard access; no pointer-specific handler is needed. |

[Source checks](filter-pointer-source-checks.json) accept preview syntax/runtime, frontmatter validation, 32-post isolated generation and the final bounded helper producing the same successful three-event trace. The article is 1,249 body words with 31 shaping prompts. Unchanged analytics/site suites are reused from the prior accepted source, not reported as fresh runs. Local results, source delivery, production activation and live rendered acceptance are separate gates. A narrow viewport is not a phone, and browser-generated input is not a human-operated trial. This UI repair does not resolve the broader organic vendor/native, replay/DNS, retention, sampling/loss or human-accuracy questions.

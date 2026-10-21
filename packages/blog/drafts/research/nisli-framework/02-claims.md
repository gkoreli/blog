# Claim ledger

| Claim | Evidence state | Basis | Article treatment |
|---|---|---|---|
| OpenClaw moved its Control UI from Lit to Solid 2 and continued refactoring after dependency removal | Reported / primary documented | Peter’s post, timeline, issue/PRs | Attribute and distinguish direct Control UI dependency removal from every transitive Lit dependency |
| Manual redraw and ownership plumbing was an explicit motivation | Primary documented | Issue #168114 | Central opening finding; do not infer from PR count alone |
| Nisli was designed by choosing between Lit and Solid | Rejected | Owner correction | Its origin is Goga’s broader frontend experience and actual backlog-viewer problems |
| Nisli binds signals directly to individual DOM values | Code-inspected | template.ts reactive child/attribute effects | Explain; validate in browser fixture |
| Lit cannot do fine-grained updates | Rejected | Lit Labs watch() | Include a Lit-signals comparator |
| Lit requires every consumer to hand-roll race protection | Rejected | @lit/task | Compare actual task/resource semantics rather than claiming a missing capability |
| Nisli effects created in setup belong to the component’s lifetime | Code-inspected | component.ts context hook, signal.ts effect disposal | Validate removal and same-tick move separately |
| Nisli local resources suppress obsolete result commits and signal cancellation | Code-inspected | resource.ts guards and AbortController | Validate an abort-ignoring loader and teardown |
| Nisli resource() is equivalent to Solid 2’s integrated async graph | Rejected | Nisli ADR 0028; Solid 2 docs | Explain local pending state versus coordinated settled views; compare UI semantics explicitly |
| Hiding a retained pane automatically suspends Nisli’s work | Unsupported | Cleanup is tied to removal, not visibility | Explain that presentation gates remain application policy |
| Web Awesome retirement reduced startup CSS by about 14.3% in one paired build | Reported | PR #173590 | Attribute to vendor retirement; do not label a framework rendering win |
| Nisli would outperform Solid in OpenClaw | Untested | No actual OpenClaw port | Do not claim; title expresses a reasoned architectural preference |
| Native DOM updates are universally faster | Rejected | No controlled whole-application evidence | Measure specific workloads; report losses and limits |
| Core is buildless but has no runtime parsing or scheduling | Rejected | parseTemplate/processNode; queueMicrotask | Explain the work that remains and compare cold mounts separately |
| Browser and framework state survive DOM moves identically across engines | Unsupported | Native capability + fallback differ | Record capabilities and check actual focus/identity/setup separately |

## Reproduced October 20, 2026

| Finding | Evidence | Disposition |
|---|---|---|
| One broad Lit component reads 1,000 row values per changed cell; narrow Lit, Solid, and Nisli read one in the instrumented fixture | browser-results.json probes | Report as a controlled update-boundary demonstration, not inherent DOM replacement |
| Every variant produced ten mutation records for ten instrumented changes | browser-results.json probes | Preserve: broad reevaluation is distinct from broad DOM mutation |
| Median 10,000-update loops: Lit-wide 350.8 ms; Lit-signals 28.1; narrow Lit 3.2; Solid 6.2; Nisli 5.6 | Seven individual samples per variant, common microtask/check allowance | Narrow Lit is fastest here; Nisli/Solid are close; no FPS, paint or OpenClaw claim |
| Median warm-template mounts: 3.8 / 4.8 / 7.0 / 3.9 / 9.1 ms respectively | Same samples | Nisli loses this operation; current runtime binding discovery is a cost, positional blueprints are proposed |
| All three async abstractions suppress obsolete A after B; Lit Task and Nisli resource abort superseded A | Deferred promises ignoring abort | Reproduced; no actual network transport was exercised |
| Nisli aborts pending C on owning-component removal; bare Lit Task does not | Browser behavior record | Scope to defaults tested; explicit Lit cleanup is available |
| Nisli independently shows B / fast B / slow A; Solid holds A / fast A / slow A until slow B resolves | Two-panel consistency fixture | Different view semantics, not a general correctness ranking |
| Same-tick fallback moves preserve Nisli scope but lose focus; native Chrome move preserves focus too | Positive-control setup/cleanup/input-identity fixture | No cross-browser support or undo/iframe claim |
| Hidden Nisli pane still updates; true removal disposes | Effect-run counter and later signal write | Presentation policy remains application work |
| Standalone counter gzip bytes: Lit 5,939; Lit-signals 9,693; Solid 11,516; Nisli 8,237 | Independent production builds; each button also clicked | Program-specific emitted JS, not universal package size |

Raw records and exact conditions: [reproduction](repro/README.md). No OpenClaw surface was ported. An “ultrafast web apps” superiority headline remains unsupported; the selected title expresses the author's framework preference.

## Hardened 0.56.1 candidate, October 20 release review

| Finding | Evidence | Disposition |
|---|---|---|
| Runtime binding-location caching reduces repeated native-template discovery | Exact patch; two paired browser runs with rotating cases | Warm ordinary/static-heavy/binding-heavy mounts fall 19%/23%/13%; still runtime parsing, clone traversal, binding/effect creation |
| All templates gain faster mounting | Rejected by conservative fallback and samples | Dynamic refs, literal custom elements, customized built-ins, HTML sinks, and missing TreeWalker retain live discovery |
| Prototype was safe because its first suite passed | Rejected | Release audit reproduced DOM-shim and synchronous custom-prop/ref failures that pass on 0.56.0; repaired and regression-tested |
| Candidate's 10,000 verified writes fall 6.10 → 3.50 ms | Thirty raw samples per case; queue-only 5.90, bare-Promise 3.70, scheduling controls 5.30/2.55 | Local transport ablation supports update improvement; narrow Lit still wins at 2.70; no input/paint or cross-engine speed claim |
| No public type/export/dependency break detected | Exact byte comparison of 22 declarations and structural manifests from actual packed artifacts | Supports patch-release preparation; not proof of universal behavioral compatibility |
| Scheduler behavior is entirely unobservable | Rejected | Unexpected escaping failure reports one microtask later; ordinary effect containment preserved; instrumentation can distinguish Promise jobs |
| Cache adds no cost | Rejected | Counter +455 gzip bytes (+5.5%); added metadata unprofiled; fresh-callsite batch 2.80 → 2.60 ms is limited to one shape, not startup |
| Candidate is released and production-accepted | False at this review | Local 2,349-test/build/typecheck gates, 168-preview sweep and three-engine move proof are distinct from main CI, npm and deployment |

Methods, exact limits, raw results, and next action: [pre-landing review](release/README.md).

## Publication comparison on the released 0.57.0 artifact

The [new record](publication/README.md) governs the main article tables; the
older findings above remain dated observations. All 35 measured trials remain
in the raw results. No old/new runs are pooled.

| Finding | Evidence | Article treatment |
|---|---|---|
| Current npm core 0.57.0 is published | npm metadata, downloaded public tarball, GitHub release and pinned commit | Use published artifact for the main comparison; do not call the experimental branch released |
| Current mount/update medians: broad Lit 3.8/355.6 ms; signals 4.8/29.3; narrow Lit 6.4/3.9; Solid 3.6/6.0; Nisli 8.6/6.2 | Seven samples each; original workload and adapters | Preserve Nisli's mount loss, narrow Lit's update win, and the small Nisli/Solid difference |
| Current counter gzip bytes: Lit 5,939; signals 9,693; Solid 11,516; Nisli 6,295 | Independent builds; new Nisli button clicked; other three match previously clicked bytes exactly | Attribute Nisli's reduction to released production-artifact work, separate from old branch's +455 bytes |
| Resource/lifetime/async-state findings still reproduce on 0.57.0 | Full behavior probes against the npm artifact | Preserve scoped ownership differences and Solid's settled-view behavior |
| Promise transport gets a different queue or higher priority | Rejected by platform semantics | Both use browser microtasks; observed engine path is unprofiled; error adapter remains under review |
| Cached locations are missing from the optimization branch | Rejected by source | Branch implements them already; complete binding-instruction caching remains a separate proposal |

No prompt file, prompt route, or token-footprint claim is prepared, following
the owner's explicit instruction. The AI-assistance disclosure remains.

## October 21 practical rewrite

- Actual OpenClaw history now anchors the argument: original Lit chat page,
  intermediate Solid host/controller bridge, then component-owned state;
  memory configuration loses its copied snapshot/redraw subscription. Source
  identities and merged PRs are in the [source ledger](01-source-ledger.md).
- The displayed Nisli reply and preview examples pass strict typechecking and
  [three-engine browser checks](examples/README.md) against public 0.57.0.
  Draft identity/value/focus/input selection, typed prop updates, immediate
  state reads, cancellation, ignored-abort races, errors, and removal are checked.
- Preference: native custom elements + direct signal bindings + local resource
  ownership without a required compiler. This is an authoring/design case,
  not evidence that Solid lacks fine-grained updates or Lit cannot preserve DOM.
- Solid's coordinated async advantage and narrow Lit's update win remain in
  the body. Runtime template discovery and incomplete tagged-HTML typing are
  explicit costs of Nisli's chosen authoring model.
- OpenClaw has merged rc.16. Historical rc.14 results are retained and labeled;
  no rerun or current-version performance conclusion is invented.
- Dense optimization history is condensed, with measured gains, costs,
  non-release status, rollback, and links preserved. No proposal is reopened.
- No prompts are captured, following the owner's continuing exception.

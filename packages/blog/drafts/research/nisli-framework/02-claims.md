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

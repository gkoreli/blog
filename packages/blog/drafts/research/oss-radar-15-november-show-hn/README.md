# OSS Radar #15 — November launches and a return visit

November 15, 2026, America/Los_Angeles. **The [reviewed manuscript](article.md) is ready as source for Monday November 16. Final selection, factual/usefulness/prose review and isolated rendering are accepted in the [readiness record](08-review-and-readiness.md). Publication remains paused; no queue entry or live article exists.** This issue follows the project-selection form of [#1](../../../posts/002-oss-radar-01-vercel-winter-2026-cohort.md) and [#14](../../../posts/045-oss-radar-14-november-show-hn.md), under the [current format](../../../../../.agents/skills/writing/references/oss-radar-format.md) and [participant workflow](../../../../../.agents/skills/writing/references/oss-radar-due-diligence.md). The Modern Web Guidance embedder explanation remains a separate engineering draft. Eight open-source Show HN projects plus returning Takumi form the final nine-entry selection. Future issues can draw from the broader [source portfolio](../../../../../docs/worklist/oss-radar-weekly/sources.md).

## Source and current sample

Source: **November 11–14, 2026 UTC Show HN appearances**, following #14's November 1–10 window. The submission window is now closed. Current [method and daily queries](inventory-closed-method.json), [normalized inventory](inventory-closed-2026-11-15.csv), [nine direct-GitHub candidates](sample-closed-2026-11-15.csv) and [repository baselines](baselines.json). The [early Sunday record](06-sunday-closed-window.md) owns the population change; [later fieldwork](07-sunday-fieldwork.md) and [acceptance](08-review-and-readiness.md) settle selection and readiness.

The Sunday pass retrieved 178 / 181 / 148 / 96 entries by day, **603 unique submissions**. Each partition's returned length matched its reported exhaustive count at retrieval. Sixteen had at least 50 points; nine linked directly to GitHub. This is an attention-filtered sample, biased toward earlier launches and developer tooling. It is not every open-source launch, and an HN date is not the start of development. Scores remain a dated snapshot. Saturday's [584-entry provisional method](inventory-method.json), [inventory](inventory-provisional-2026-11-14.csv) and [sample](sample-provisional-2026-11-14.csv) remain historical receipts. The accepted manuscript uses the closed population and final selection.

Klad explicitly identifies its main application as source-available, not open source. Its [pinned main license](https://github.com/klad-app/klad/blob/4a2496a34f4947a6890adec078203c43c951b0d8/LICENSE) is a modified PolyForm Internal Use license; some client/docs components have separate MIT terms. Exclude the main project from the open-source reviews and disclose that exclusion in the source section. Do not classify the entire direct-GitHub sample as OSS.

**Fursoy**, the RISC-V CPU core newly qualifying on Sunday, earned inclusion after source/discussion review, the actual upstream interrupt suite and a directed CSR control. Its declared Apache license has a customized trademark paragraph; GitHub's `NOASSERTION` is retained in the baseline. The [initial audit](06-sunday-closed-window.md#fursoy-initial-source-and-discussion-review) and [executed continuation](07-sunday-fieldwork.md) retain that distinction and the hardware limits.

| Project | Problem / initial product question | Current evidence / next action |
| --- | --- | --- |
| Yogurt | Local meeting notes and optional assistant retrieval | Selected recording/transcription/notes wiring read; queue interruption/restart and MCP/socket off/on/off controls passed. No real audio, model quality or memory trial |
| AssemblyForNeovim | Assembly feedback inside the editor | Full implementation read; actual plugin exposed a quoted-command compilation-context failure and saved-file/unsaved-comment mismatch |
| bo2-mac | Run an old Windows game on Apple Silicon through ahead-of-time translation | Selected lifting/runtime/Metal paths read; interpreter fallback qualifies launch wording. No game build/gameplay/FPS trial |
| AgentRun | Durable execution, learning and control around existing agent harnesses | Real kernel/bridge interruption controls distinguish never/safe/completed effects; three upstream faux-adapter tests passed. Beta.38 scoring controls distinguish accuracy, hand-back coverage and excluded failures. No disk recovery, cost or learned-outcome comparison |
| Fursoy | Study and extend a RISC-V core and verification environment | Unchanged interrupt/trap suite passed 7 properties and 25,500 stress operations; directed CSR and one-operand mutation distinguish external/software pending state. No independent Linux boot, Sail, timing or hardware result |
| ZigZag | Own an embroidery workflow and export machine-readable designs | Core CLI built; two synthetic SVG exports and a PES reopen executed. Over-hoop error still writes files and exits 0; no hardware trial |
| DeepSeek V3 in JAX | Make architecture mechanisms inspectable in a small educational implementation | Full model read; tiny CPU routing/cache/all-expert compute controls executed. No training/quality result |
| Agweb | Keep several agents' browser work visible without focus disruption | Official 0.2.0 app confirmed cookie/storage separation for unnamed/different profiles and sharing for one named profile. Source build's missing-Xcode failure retained; no memory/focus benchmark |

These are the launch participants; Takumi is the separate return visit. Sunday's current-release checks and added AgentRun beta.38 scoring trial are recorded below. Article judgments retain the actual scope of this evidence and give entries unequal space.

## Work completed and evidence

[Participant dossiers](03-participant-dossiers.md) record the called paths, claim audits, firsthand reports, judgments, contrary evidence and the next consequential check for each candidate. [Declared controls](02-review-protocol.md) and [reproduction guide](repro/README.md) keep narrow trials separate from complete product reviews.

[First manuscript review and continuation](04-manuscript-review.md) records the factual/usefulness/prose pass, preparation checks, remaining Sunday acceptance and publication boundary.

Latest handoff: [November 15 editorial and render acceptance](08-review-and-readiness.md). Final selection is nine entries, eight with focused executed paths; bo2 remains source-only. [Sunday's additional fieldwork](07-sunday-fieldwork.md) includes Fursoy's RTL controls, AgentRun beta.38's actual scoring module, current release/discussion checks and bo2's actual fallback/shader callers. The [November 14 afternoon Takumi fieldwork](05-takumi-afternoon-fieldwork.md) remains accepted: resource preparation and a separately reproduced current font report. The manuscript distinguishes the fixed registration case from the matching limit.

Takumi's return visit compares a reconstructed March 19 checkpoint, current master and released 2.20.0 source. Its broader shared-layout/resource scope is documented and source-inspected. Copied buffers and an ArrayBuffer/view pair passed in both native releases. The changed JavaScript cache keys explain why: those inputs have different object identities. A separately declared exact-same-object condition reproduced the registration contrast—2.19 returned Alpha for the requested Beta face; 2.20 returned Beta. Identical PNGs alone missed it. All three receipts remain. No original #1 audit SHA, other-descriptor/WASM or all-format acceptance is claimed.

The afternoon trial additionally showed native `prepare` fetching the drawn CSS image once, skipping the hidden image and reusing bytes for PNG/SVG/measurement. Raw native rendering without bytes did not fetch; the higher-level wrapper uses preparation. On a separate font condition, native 2.20.0 successfully registered the reported Cyrillic face as `Geist` yet drew boxes; an alias worked, while removing the built-in fixed Cyrillic but lost Latin fallback. These checks support advice about the actual API, scripts and font names, not general conformance or a performance claim.

Public GitHub feed leads were independently checked and saved in the source portfolio. They remain discovery-only while the current participant work is unfinished. No project earns a featured entry merely by appearing in a feed.

## Article shape

Opening with concrete projects → **Sources and selection** → **The projects** → **What this cohort shows** → **The distillation** → **Sources**. Each entry explains problem/user, a consequential implementation choice, history where it matters, evidence that qualifies it and an actual take or hard question. Code/trial detail serves the review; long protocols stay here. Reader prose should retain the plain style of #14 without stock prognosis labels or research-process narration.

## Weekend work

Saturday: close the current projects' source/license/discussion reviews and run representative controls where they can change a judgment. Write the project entries from that evidence. Keep the next issue's unrelated scouting secondary.

Saturday milestone: canonical series format and due-diligence workflow established; discovery portfolio includes public GitHub and earlier cohorts. Participant dossiers cover the seven OSS launch candidates, excluded Klad and returning Takumi. Actual controls now cover seven participants (two distinct Yogurt components, plugin compilation context, ZigZag export constraints, JAX mechanisms, AgentRun kernel recovery, Agweb's running app and three Takumi input modes). Selected release/history work and discussion are recorded. The first manuscript follows the stable structure and keeps source-only/report-only claims explicit. Per-project elapsed time was not recorded.

Sunday completion: settled all eight OSS launch entries plus Takumi, added the directed RTL and learning-score controls, revised changed-release claims, reviewed the manuscript in factual/usefulness/prose passes and rendered the exact candidate in isolation. All article representations, metadata, social card, desktop and narrow-width reading are accepted in the readiness record. Private source instructions were backed up with remote acceptance confirmed.

Next bounded action: preserve the accepted source/hash and check only consequential new facts before the target. Do not reopen passed experiments without a changed claim or result. If release is explicitly authorized, follow the existing queue procedure and recheck its exact source and then-current site build; deployment/live acceptance are separate. The earlier publication pause remains in force.

Raw API responses, source transcripts, build logs and machine captures live outside Git in `/private/tmp/oss-radar-15-november-2026`; Sunday's new population responses are in `/private/tmp/oss-radar-15-sunday-2026-11-15`. Public records contain methods, normalized metadata, inspectable fixtures, results and limits. Raw author messages remain in the private writing archive.

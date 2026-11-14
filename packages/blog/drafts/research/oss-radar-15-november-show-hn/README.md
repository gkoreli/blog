# OSS Radar #15 — November launches and a return visit

November 14, 2026, America/Los_Angeles. **Active preparation for Monday November 16; a [first manuscript](article.md) exists, but is not reviewed, release-ready or queued. Automatic publication remains paused.** This issue follows the project-selection form of [#1](../../../posts/002-oss-radar-01-vercel-winter-2026-cohort.md) and [#14](../../../posts/045-oss-radar-14-november-show-hn.md), under the [current format](../../../../../.agents/skills/writing/references/oss-radar-format.md) and [participant workflow](../../../../../.agents/skills/writing/references/oss-radar-due-diligence.md). The Modern Web Guidance embedder explanation remains a separate engineering draft and is not this issue. Show HN is the initial bounded pool; Takumi is a separately selected return-visit candidate from #1. Future issues can draw from the broader [source portfolio](../../../../../docs/worklist/oss-radar-weekly/sources.md).

## Source and current sample

Source: **November 11–14, 2026 UTC Show HN appearances**, following #14's November 1–10 window. The November 14 partition is still open. [Method and daily queries](inventory-method.json), [normalized provisional inventory](inventory-provisional-2026-11-14.csv), [eight direct-GitHub candidates](sample-provisional-2026-11-14.csv), [repository baselines](baselines.json).

The first pass retrieved 178 / 181 / 148 / 77 entries by day, **584 unique submissions**. Each partition's returned length matched its reported exhaustive count at retrieval. Fifteen had at least 50 points; eight linked directly to GitHub. This is a provisional attention-filtered sample, biased toward earlier launches and developer tooling. It is not every open-source launch, and an HN date is not the start of development.

Klad explicitly identifies its main application as source-available, not open source. Its [pinned main license](https://github.com/klad-app/klad/blob/4a2496a34f4947a6890adec078203c43c951b0d8/LICENSE) is a modified PolyForm Internal Use license; some client/docs components have separate MIT terms. Exclude the main project from the open-source reviews and disclose that exclusion in the source section. Do not call all eight candidates OSS.

Seven current open-source review candidates remain:

| Project | Problem / initial product question | Current evidence / next action |
| --- | --- | --- |
| Yogurt | Local meeting notes and optional assistant retrieval | Selected recording/transcription/notes wiring read; queue interruption/restart and MCP/socket off/on/off controls passed. No real audio, model quality or memory trial |
| AssemblyForNeovim | Assembly feedback inside the editor | Full implementation read; actual plugin exposed a quoted-command compilation-context failure and saved-file/unsaved-comment mismatch |
| bo2-mac | Run an old Windows game on Apple Silicon through ahead-of-time translation | Selected lifting/runtime/Metal paths read; interpreter fallback qualifies launch wording. No game build/gameplay/FPS trial |
| AgentRun | Durable execution, learning and control around existing agent harnesses | Real kernel/bridge interruption controls distinguish never/safe/completed effects; three upstream faux-adapter recovery tests passed. No disk recovery, cost or learned-outcome comparison |
| ZigZag | Own an embroidery workflow and export machine-readable designs | Core CLI built; two synthetic SVG exports and a PES reopen executed. Over-hoop error still writes files and exits 0; no hardware trial |
| DeepSeek V3 in JAX | Make architecture mechanisms inspectable in a small educational implementation | Full model read; tiny CPU routing/cache/all-expert compute controls executed. No training/quality result |
| Agweb | Keep several agents' browser work visible without focus disruption | Official 0.2.0 app confirmed cookie/storage separation for unnamed/different profiles and sharing for one named profile. Source build's missing-Xcode failure retained; no memory/focus benchmark |

These are research questions, not article verdicts. Check each license and consequential issue/release state at the pinned baseline. Give entries unequal space according to the useful insight and evidence. Do not force a shared market thesis before understanding the set.

## Work completed and evidence

[Participant dossiers](03-participant-dossiers.md) record the called paths, claim audits, firsthand reports, judgments, contrary evidence and the next consequential check for each candidate. [Declared controls](02-review-protocol.md) and [reproduction guide](repro/README.md) keep narrow trials separate from complete product reviews.

[First manuscript review and continuation](04-manuscript-review.md) records the factual/usefulness/prose pass, preparation checks, remaining Sunday acceptance and publication boundary.

Takumi's return visit compares a reconstructed March 19 checkpoint, current master and released 2.20.0 source. Its broader shared-layout/resource scope is documented and source-inspected. Copied buffers and an ArrayBuffer/view pair passed in both native releases. The changed JavaScript cache keys explain why: those inputs have different object identities. A separately declared exact-same-object condition reproduced the registration contrast—2.19 returned Alpha for the requested Beta face; 2.20 returned Beta. Identical PNGs alone missed it. All three receipts remain. No original #1 audit SHA, other-descriptor/WASM or all-format acceptance is claimed.

Public GitHub feed leads were independently checked and saved in the source portfolio. They remain discovery-only while the current participant work is unfinished. No project earns a featured entry merely by appearing in a feed.

## Article shape

Opening with concrete projects → **Sources and selection** → **The projects** → **What this cohort shows** → **The distillation** → **Sources**. Each entry explains problem/user, a consequential implementation choice, history where it matters, evidence that qualifies it and an actual take or hard question. Code/trial detail serves the review; long protocols stay here. Reader prose should retain the plain style of #14 without stock prognosis labels or research-process narration.

## Weekend work

Saturday: close the current projects' source/license/discussion reviews and run representative controls where they can change a judgment. Write the project entries from that evidence. Keep the next issue's unrelated scouting secondary.

Saturday milestone: canonical series format and due-diligence workflow established; discovery portfolio includes public GitHub and earlier cohorts. Participant dossiers cover the seven OSS launch candidates, excluded Klad and returning Takumi. Actual controls now cover seven participants (two distinct Yogurt components, plugin compilation context, ZigZag export constraints, JAX mechanisms, AgentRun kernel recovery, Agweb's running app and three Takumi input modes). Selected release/history work and discussion are recorded. The first manuscript follows the stable structure and keeps source-only/report-only claims explicit. Per-project elapsed time was not recorded.

Sunday: refresh the now-closed November 11–14 inventory and points snapshot, reconcile qualifying entrants and exclusions, finish outstanding project work, derive cohort patterns/distillation, edit the manuscript and rehearse its rendering. Preserve the publication pause; do not silently queue or release an unfinished or misclassified manuscript.

Next bounded action: refresh the closed inventory, decide whether late entrants materially change this selection, and review the first manuscript against the dossiers. If a production durability recommendation is added for AgentRun, exercise the actual disk/journal path. If the Agweb entry makes a focus/memory claim, it needs a matched representative workload. Do not promote existing component results into those claims. The manuscript's source count/date/title and all consequential current release facts need final reconciliation before render acceptance.

Raw API responses, source transcripts, build logs and machine captures live outside Git in `/private/tmp/oss-radar-15-november-2026`. Public records contain methods, normalized metadata, inspectable fixtures, results and limits. Raw author messages remain in the private writing archive.

# November 17 — selection revision and Hermes memory

**Next action advanced:** [the later November 17 session](05-tuesday-inbox-ownership.md) completed Plannotator's store/wake component trial and selects GoDoxy's actual health monitor next. The Hermes results and discovery policy below remain accepted; the then-proposed Plannotator action is now historical.

**Milestone:** #16 now uses a project-led selection without HN discovery. A real released-code Hermes memory trial and a checked portable reproduction are complete. The issue, its project reviews and its manuscript remain unfinished. Target: November 23; publication remains paused.

This record supersedes the active selection and next action in the [November 16 source selection](01-source-selection.md) and [Monday handoff](03-monday-handoff.md). Their inventory, source origins and completed CodeRelay research remain historical evidence. It does not change either published #14 or #15.

## Current selection

The #14 launch-cohort source had been carried forward as a recurring discovery habit. That was separate from the series' useful editorial form: declared selection, substantive project reviews, interpretation and distillation. The [source policy](../../../../../docs/worklist/oss-radar-weekly/sources.md) and [participant workflow](../../../../../.agents/skills/writing/references/oss-radar-due-diligence.md) now make the distinction explicit. HN submissions, scores and launch windows are excluded from selection for #16. A future HN cohort needs an explicit request for that issue. An attributed HN discussion can still supply criticism or testimony for an independently selected project.

| Working prospect | Existing independent origin and reason to continue | Consequential question |
| --- | --- | --- |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | Public GitHub lead; released, inspectable continuity mechanisms, with a concrete operating report | What survives a new session, what actually enters the prompt, and does a saved skill help on a later task? |
| [NemoClaw](https://github.com/NVIDIA/NemoClaw) | Public GitHub lead; substantive OpenShell orchestration and policy-authority work | Which runtime enforces the boundary, and can the supported installation demonstrate policy/lifecycle behavior? |
| [Plannotator](https://github.com/backnotprop/plannotator) | Public GitHub lead; shipped review/inbox expansion and a recent reply-ownership correction | Can a reply remain assigned to the right recipient through another reader, a late grant and a disappeared session? |
| [GoDoxy](https://github.com/yusing/godoxy) | Return to #1; a new checked release, useful health-notification work and a firsthand backup-window use case | Does the actual monitor defer failure notices during silence and handle later recovery correctly? What changed since the earlier coverage? |

CodeRelay is removed from the active #16 selection. Bright Lines remains background research. Both retain their recorded November 14 HN-scout origin; finding their code on GitHub does not give them a new discovery provenance. Their useful existing artifacts are preserved. Browser-ai and InsForge are earlier-cohort reserves, not automatic replacements. There is no four-project quota, final roster or predetermined shared thesis. Each prospect still has to earn space through substantive work.

The recurring preparation task's discovery instructions were updated through the app, then read back. Its daily 09:00/14:00 Pacific starts, active preparation status and target thread were preserved. Its explicit publication hold remains. No publisher, queue or release authorization was changed.

## Hermes: prompt memory and disk memory diverge

**Executed source:** [v0.23.2, ae2a81ccc00e9b7c06301523e5bb09608397149c](https://github.com/NousResearch/hermes-agent/tree/ae2a81ccc00e9b7c06301523e5bb09608397149c). The called path is `MemoryStore.load_from_disk` → real memory-directory resolution and file parsing → strict threat scan → frozen prompt snapshot; mutations use the actual lock, disk reread and atomic writer. [Protocol and portable fixture](hermes/README.md), [results](hermes/results/memory-2026-11-17.json), [all attempt dispositions](hermes/results/attempts-2026-11-17.json).

The environment was Python 3.14.6 on Darwin arm64 in an owned venv, with the pinned `ruamel.yaml` 0.18.16 and `ruamel.yaml.clib` 0.2.15. Every case used a fresh authored `HERMES_HOME`; storage, scanning, locks and imports were not stubbed. Twenty-seven imported upstream files have checked hashes. No installer, personal profile, model/provider, gateway or shell configuration was used. The archive and exact raw GitHub memory files matched. Two older materialized scratch files had an extra trailing newline; they were not executed.

| Condition actually exercised | Observed state | Consequence |
| --- | --- | --- |
| Clean profile | Clean fact reached the prompt; disk bytes stayed unchanged | The ordinary load path works for the control |
| Authored sentence about editing drafts and keeping `CLAUDE.md` | Strict scan returned `agent_config_mod`; replacing the filename with `NOTES.md`, or mentioning `CLAUDE.md` without the editing verb, returned no finding. An explicit instruction override triggered the positive control | This is a specific false-positive shape in the selected release, not a claim that mentioning any agent file always blocks memory |
| Clean fact plus that sentence in one prose entry | The prompt contained a blocked-entry notice; neither fact appeared. The live entry and exact original disk bytes retained both | The lost context is prompt visibility. Loading did not delete the file |
| Same two facts separated by the supported entry delimiter | The clean fact remained in the prompt; only the matching entry was masked. Disk stayed unchanged | Entry boundaries determine how much otherwise clean context one match can hide |
| Successful add, then reopen | Disk and live entries contained the addition; the existing prompt stayed frozen; a newly loaded store included it | A successful write is durable but does not rewrite the current prompt prefix |
| Attempted add of the matching sentence | Refused; existing disk bytes unchanged | The write path also scans, rather than only filtering on reload |
| Two stores loaded before either wrote | A later fresh load contained both sequential additions and the original fact | Actual disk rereading preserved stale-writer additions in this sequence; this is not concurrent stress evidence |
| Patch selected a repeated span | Refused without altering bytes | The first fixture attempt incorrectly expected the drift path; the store had correctly rejected an ambiguous patch first |
| Unique-span patch on an oversized external entry | Refused, original unchanged, exact backup created | The drift protection was exercised after correcting that fixture condition |
| Prune oversized entry; add against invalid UTF-8 | Prune retained another exact backup; reopened prompt was empty. Invalid UTF-8 caused add refusal without overwriting original bytes | Recovery and unreadable-input safeguards had positive controls, rather than being inferred from source alone |

The first trial stopped with a fixture `KeyError` after the repeated-span refusal. The second completed the ten recorded conditions. The final portable reproduction, with added source-closure verification, completed the same conditions in a new output directory. These are retained separately; a failing fixture is not presented as a failing product.

The originating [report #156389](https://github.com/NousResearch/hermes-agent/issues/156389) was still open when reread November 17. Its author reported a locally modified v0.23.0 setup and a later scanner-only main check. Our result establishes the bounded store mechanism on v0.23.2 with a small authored profile; it does not reproduce the reporter's entire agent session or establish incidence. The contributor's alternative masking design remains a fork experiment, not an upstream fix.

**Provisional judgment:** the useful product feature is inspectable, curated continuity, with explicit persistence and recovery behavior. Prompt inclusion depends on parsing and screening, and it has a different lifetime from the stored facts. Operators maintaining profiles as prose should understand the entry format and inspect actual prompt inclusion. This evidence supports that operational advice; it does not establish better task performance or justify disabling scanning.

## What the broader learning claim still needs

Additional released-source reading followed [agent review spawning](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/run_agent.py#L763), [background-review settings](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/agent/background_review.py#L304), the [review tool whitelist](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/agent/background_review.py#L1192), [skill management](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/tools/skill_manager_tool.py#L44) and [skill viewing](https://github.com/NousResearch/hermes-agent/blob/ae2a81ccc00e9b7c06301523e5bb09608397149c/tools/skills_tool.py#L634). These paths were inspected, not executed.

Automatic post-turn review can fork a model-backed review of a conversation snapshot, with gates and an idle-defer path for the managed local runtime. The reviewed default settings enable review outside specific finite/safe-worker conditions. The fork restricts dispatched tools; skill-only review does not automatically acquire the memory tool. Ordinary skill listing exposes metadata, while viewing resolves and loads the content. This is a concrete workflow for maintaining procedural files. Its existence is not a demonstration that the next task gets better. Model/runtime costs, successful creation and successful later reuse need separate evidence. The trial above establishes none of them.

## Current limits and next session

Hermes' memory component is exercised; its whole-agent continuity/skill claim is unfinished. NemoClaw, Plannotator and GoDoxy still have the implementation/history/discussion evidence described in the [initial dossiers](02-participant-dossiers.md), with their consequential runtime trials pending. No project entry is written or reviewed. No elapsed per-project research total is claimed.

**Next bounded action:** advance Plannotator at the pinned v0.28.66 source. Declare and run an owned Inbox-store trial for the intended recipient versus another reader before a grant, then a late grant and confirmed-ended recipient; inspect delivery state across reopening. Keep temporary unreachability distinct from authoritative disappearance. Use the actual store and supported runtime; preserve setup failures and do not call a store result a full host integration. Then return to Hermes skill creation/retrieval/reuse and GoDoxy's actual notification sequence.

Raw source archives, public API captures, profiles, backup files and stdout/stderr remain outside Git at `/private/tmp/oss-radar-16-20261117`. Public evidence contains authored inputs, source hashes, normalized results and limits. Private author prompts were captured and synced to the private archive separately.

## Verification

The final fixture completed all ten cases and verified the 27-file import closure. A separate artifact inspection checked original profile hashes, both exact drift backups, the pruned file and retained invalid UTF-8 bytes. JSON/source-hash consistency, Python syntax, Markdown fences and 95 local file/anchor links passed. The private-prompt guard passed. #15's published source hash is unchanged and the publication manifest is still empty. No production build or fresh production-health claim is needed for these research and guidance changes.

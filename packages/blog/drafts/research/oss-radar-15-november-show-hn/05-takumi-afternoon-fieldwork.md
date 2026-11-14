# Takumi return visit — November 14 afternoon

Continues the [participant dossier](03-participant-dossiers.md#takumi--returning-project) and [declared controls](02-review-protocol.md#shared-preparation-and-image-resources--1400-continuation). This record adds implementation understanding and two bounded trials to the existing two-version registration comparison. It does not select another project or release the issue. Automatic publication remains paused, with an empty manifest; GitHub returned `disabled_manually` for workflow 408698342 during this session.

## What changed in the take

The current native release's preparation work is now exercised, rather than solely described by release notes. It collects a drawn CSS image and reuses the loaded bytes across output operations. A separately read user report exposed a font-matching condition that survives a successful registration in that same release. The article now explains both the useful resource path and a concrete multilingual limitation, instead of implying one fixed registration case settles font behavior.

## Source and history

Release source `ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d`, published native `@takumi-rs/core` 2.20.0, Node 24.14.1, macOS arm64. The release list and master checkpoint were rechecked; the relevant release remains November 8's 2.20.0 and master remains `8a55f0b673ad1a707a422457876783b658183f33`. Earlier native 2.19/2.20 registration receipts remain unchanged.

Read the released native facade, full shared `prepared.ts`, image helper, selected upstream preparation tests, embedded-font registration, family selection, capability-bucket ranking and fallback path. [PR 2435](https://github.com/kane50613/takumi/pull/2435) explains how the JavaScript host downloads font resources that Rust reports; [PR 2444](https://github.com/kane50613/takumi/pull/2444) connects the registration fix to [user issue 2439](https://github.com/kane50613/takumi/issues/2439). Automated PR comments were not counted as independent user testimony.

[The v3 tracker](https://github.com/kane50613/takumi/issues/2372) describes consolidation and a Rust parse/cascade handle. Its last edit predates 2.19/2.20, whose releases already contain related groundwork. The current JavaScript `Prepared` record and the proposed parse-once handle must not be treated as identical, nor unchecked roadmap boxes as current release proof. No future shipping or speed outcome is claimed.

## Native resource path

[Declared fixture](repro/takumi-prepared-resources.mjs), [normalized receipt](results/takumi-prepared-resources-01.json). Authored HTML draws an owned red image as a CSS background and hides another image through CSS. An owned loopback HTTP server records transport independently of the fetch hook.

| Condition | Observed result |
| --- | --- |
| Raw native `render`, no image bytes | No HTTP request; PNG differs from the loaded-image result |
| Native `prepare` with loopback-restricted fetch | One request for `/used.png`; none for `/hidden.png` |
| PNG, SVG and measurement from the prepared object | No additional fetch; SVG contains embedded image data and no fixture-origin reference |
| Direct render with supplied image bytes | PNG equals prepared rendering |
| Preparation with supplied bytes | No additional fetch; PNG equals the fetched/prepared result |
| Preparation with `allowUrl` denying the URL | Rejects before the fetch hook/transport |

PNG signatures and 64 × 32 dimensions were checked; measurement reports 64 × 32. Full PNG/SVG/measurement artifacts and logs stay outside Git, with hashes in the receipt. The source path explains the native raw/prepared distinction; the higher-level `takumi-js` wrapper already prepares its source. The owned server closed in `finally`. This does not establish cached layout, broad network-policy security, public-network behavior, PDF/paint/WASM equivalence or performance.

## A successful family registration can still draw boxes

[Issue 2558](https://github.com/kane50613/takumi/issues/2558), posted November 14 by `pjborowiecki`, was open with no comments at retrieval. Its report concerns a supplied Cyrillic face named `Geist` colliding with the built-in family. This is separate from the fixed same-object registration key.

The [authored fixture](repro/takumi-font-shadow.mjs) used Fontsource Geist 5.3.0's Cyrillic WOFF2, installed as data with scripts disabled. Font bytes and package integrity are recorded in the [receipt](results/takumi-font-shadow-01.json). Four fresh renderers kept registration state separate. The word `Файли` and the ASCII control `Files` were drawn at weight 400, with identical geometry.

| Condition | Registration / actual output |
| --- | --- |
| Built-in font only | Cyrillic shows five boxes; ASCII draws |
| Supplied Cyrillic face registered as `Geist` | Returns `Geist`, but both PNGs equal their built-in-only controls |
| Same file registered as `Radar Cyrillic` | Cyrillic draws the word; ASCII retains its built-in fallback |
| Built-in family removed, then same-name registration | Cyrillic equals the alias result; ASCII now shows boxes |

The same-name and alias Cyrillic PNGs and removed-fallback ASCII PNG were visually inspected; the output identity checks and SVG hashes are retained. In the checked source, built-in and supplied faces share family matching; capability buckets are ranked before fallback. This supports the report's mechanism and explains why a returned family name alone is insufficient acceptance. The original report's older-version onset, other weights, Latin Extended/Unicode-range variants and WASM behavior were not reproduced. Removing the fallback family is a diagnostic control with a cost, not general adoption advice.

## Handoff

Both new fixtures passed their declared controls. The Takumi entry and dossier now carry the additional evidence and narrower advice. Per-project elapsed time was not tracked. No real user fonts, public webpage, model provider or external message was used.

New fixture syntax and research JSON checks passed. Local link/anchor/fence checks passed across eight issue/worklist Markdown files, resolving 82 local targets and three local anchors. No site build was needed for this preparation-only change; final selected-article rendering remains unfinished.

The November 14 UTC launch window is still open during this work. Next bounded action: on Sunday refresh the closed population/points snapshot, reconcile final entrants and edit the actual manuscript against its dossiers. Recheck the live state of issue 2558 before final copy. Keep publication paused and the manuscript outside the queue; do not reopen unrelated scouting or repeat passed controls without a new question.

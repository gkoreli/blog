# Mechanism experiments — November 13, 2026

Continuation of the [cohort worklist](README.md), preserving the [product interpretations](05-product-mechanisms-and-positioning.md) and original dated evidence. This pass tests the mechanisms that underpin the product judgments. A setup attempt is not a product outcome. Keep the cohort form and update prose only where evidence improves its explanation or decision.

## Declared questions and acceptance

| Project | Question | Acceptance / comparison | Boundary |
| --- | --- | --- | --- |
| Stroq 0.32.0 | Does the same harmless proposed command receive a different decision after clean versus suspicious tool output introduces its package name? Does evidence survive a fresh engine instance, stay scoped by session, and remain suspicious after a clean repetition? | Synthetic pre/post events on actual released engine; compare no-source, clean-source, suspicious-source, reload, other-session and repeated-source cases. Record decisions and source/rule evidence without executing any command | No live host or private transcript. Text matching is not proof of semantic influence; a report of cause must match recorded evidence |
| Waymark 0.30.1 | Does a workflow preserve completed progress across a killed executor, and how does uncertain action completion interact with retry policy? | Existing sleep/default-lost/explicit-retry cases, now with a standalone locally built PostgreSQL 16.2 including pgcrypto. Completed action should not repeat across durable sleep; lost action should surface uncertainty by default; explicit retry may repeat the journal append | Isolated Unix-socket database and loopback executor/bridge, synthetic append-only journal, explicit owned-process cleanup. Never use a shared VM, real API or product migrations modified to bypass requirements |
| Spindle pinned source | Does changing a validation bound alter both actual request handling and generated OpenAPI/Zod, and can CI drift checking detect stale artifacts? | Prepare temporary OCaml/opam toolchain, build a small route, compare valid/invalid HTTP requests and generated bounds before/after; retain intentionally stale schema and run project's CLI check | Temporary root/switch only, no global shell setup; no full protocol-conformance certification. A missing toolchain/package remains setup evidence |
| OmniDiff v0.4.0 | Can it ignore archive serialization noise while retaining content changes? | Same logical ZIP members, changed timestamps/order/compression versus a one-member logical edit. Compare content result and ordinary Git's binary result | Small synthetic files, no throughput or adversarial-decoder claim |
| HolyArrs 1.1.0 | Does its consolidated acquisition state prevent a duplicate send after a downloader outcome becomes uncertain? | Read and run relevant upstream synthetic downloader/reconciliation tests, checking how send counts and persistent attempts are asserted | No media library, public source, real downloader or acquisition of content |
| Flide pinned source | What does its returned confidence actually measure? | Execute its pure answer assembly on fixed probability vectors; compare returned choice, expected score and confidence with the documented formula | No GPU, weights, inference speed, classification accuracy or empirical calibration claim |

Build/download logs and full outputs stay outside Git. Public artifacts contain synthetic fixtures, precise versions, normalized outcomes and consequences. New runtimes stay temporary. Read authoritative installation guidance and inspected source when toolchain choices are uncertain; do not change global installations or unrelated running services.

## Progress

- Declared questions before executing the product cases. All six planned project paths now have outcomes below.
- The previous auxiliary pgserver setup remains a historical failed setup; the new standalone build is a separate environment, not a repair to Waymark.

## Stroq: source-sensitive decisions, plus an inert-command false positive

The released 0.32.0 engine allowed a synthetic runner command with no prior source, asked after a clean tool result named the package, and denied it after suspicious tool output named it. The denial survived a fresh engine instance using the same stores. A different session and a different package were allowed. A later clean repetition did not launder the suspicious origin.

A meaningful negative control also triggered: the same package name inside a literal `printf`, `echo`, and Git commit message was still attributed and denied after suspicious input. A fresh clean-source case asked about the literal-print command. The independently executed `/bin/sh` literal `printf` with an empty executable directory on PATH printed the string and exited 0; no runner was invoked. This is a narrow false-positive example in the released engine, not a claim that all quoting is mishandled or every installed host would enforce the same result. Current source includes explicit inert-command parsing, but its nearby tests use unrelated package names in quote controls. No cause or fix is inferred from their presence alone. The GitHub latest-release endpoint still returned v0.32.0 when checked.

[Fixture](repro/stroq-provenance.mjs), [normalized output](results/stroq-provenance.json). The judged runner commands were never executed. No personal transcripts or credentials were read.

## OmniDiff: content equality and exit status are different interfaces

A ZIP was rebuilt with different member order, timestamps and compression, retaining identical member contents. OmniDiff reported two unchanged members and no changed member. An edited control identified `policy.txt`. Ordinary Git reported binary differences in both cases.

Both OmniDiff invocations nevertheless exited 1 under `--exit-code`. The inspected `src/main.rs::run_binary` explicitly computes its `differed` input from raw byte inequality before asking the content decoder for a richer description. This is a useful boundary: the content view can suppress packaging noise, while the process exit code remains a byte-change signal. Do not use that exit code alone as a semantic-equality test.

## Flide: confidence is a formula over supplied probabilities

The actual pure `api/answers.py` functions ran without weights or a GPU. For two choices with probabilities 0.9/0.1, the returned confidence is 0.8, not 0.9: the formula rescales the peak from uniform to certainty. Swapping which label gets the 0.9 preserves confidence. Uniform distributions over two and four labels returned confidence 0. A bimodal score distribution 0.49/0.02/0.49 returned expected score 1 with confidence 0; the numeric mean is not a claim that the middle level is likely.

The labels here are invented controls, not observed ground truth from inference. These outputs illustrate API semantics, not empirical calibration or model accuracy. They strengthen the adoption question: a stable probability computation and a calibrated decision are separate properties.

[Shared pure-answer/archive fixture](repro/answer-and-archive.py), [normalized result](results/answer-and-archive.json).

## HolyArrs: durable acquisition state is part of the consolidation

Four inspected upstream top-level tests passed, including the optional-torrent test's Transmission, Deluge, rTorrent and aria2 subcases. They check durable intent before a send, reconciliation after an accepted append loses its response, a database restart retaining the original attempt marker/downloader, and adoption of an existing download instead of sending again. Some crash states are deliberately constructed in the test; this is not four live process-kill integrations.

This supports the earlier code interpretation: consolidating applications can also consolidate the account of what was sent and what remains uncertain. It is not a claim about a real library migration, public media source or downloader installation. [Normalized result and exact test names](results/holyarrs-acquisition.json).

## Waymark: the released delivery contract differs from the later source

The standalone database build resolved the old auxiliary-Postgres setup limit. PostgreSQL 16.2 was compiled from the previously checksum-verified archive, including pgcrypto. A fresh Unix-socket cluster ran Waymark 0.30.1; its executor, bridge and metrics used only loopback. All owned processes and the database were stopped afterward.

- Durable sleep: after a killed/restarted executor, the workflow completed; the journal contained one `before-sleep` and one `after-sleep` effect.
- Lost action, no retry policy: the first external-effect append happened before the executor was killed. After restart the effect appended again and the workflow completed.
- Lost action, explicit retry policy: the same two-effect outcome occurred.

A separate read of the retained synthetic database confirmed exactly one successful workflow instance for each scenario. The duplicated effects were within one workflow, not two client-submitted instances.

This initially conflicted with the November 11 source interpretation. Comparing release tag `v0.30.1` (`ed5bb7cd410bc36a051ba1384488ef9bfb252794`) to original source pin `d40e7d53a484ad53a7d1e93baec4d02a81539ea6` resolved the boundary: one intervening commit, merged [PR 886](https://github.com/piercefreeman/waymark/pull/886) on November 9, changes lapsed node-owned calls from redelivery to `ActionExecutionLost`. The release's own retry docs explicitly describe redelivery after node death; the later docs describe lost execution. The latest GitHub release remained v0.30.1 at this check. The live [PyPI metadata](https://pypi.org/pypi/waymark/json) also reported 0.30.1, with its latest file uploaded November 6 at 22:51:53.891676 UTC; the [package description](https://pypi.org/project/waymark/) advises against production use.

Therefore the observed duplicate effect is consistent with the **released** node-failure contract, rather than proof of a defect in the unexecuted later source. The article must distinguish released runtime behavior from the merged change. No claim that PR 886's runtime behavior was reproduced is made. [Fixture](repro/waymark-standalone.py), [normalized outcomes and database audit](results/waymark-standalone.json).

## Spindle: one bound reaches the server, schema and client validator

Built the pinned framework with OCaml 5.5.0 in a temporary opam root. The fixture defines one POST route with an integer `units`, minimum 1 and maximum 10. Changing only the bound to 2 altered all three relevant interfaces:

- Real loopback HTTP: `units: 3` changed from status 200 to 400 with `body.units` / `too_large`; 1 and 2 remained accepted, zero/11/text remained rejected.
- Generated OpenAPI: `maximum` changed from 10 to 2 while `minimum` stayed 1.
- Actual generated Zod schema executed with Zod 4.3.6: the same six inputs matched server acceptance before and after.
- The framework's strict CLI check returned 1 against intentionally stale pre-change artifacts and 0 after regeneration.

The constraint is a runtime validation rule; TypeScript's underlying numeric type alone does not encode this upper bound. Consumers must execute the generated validator to get the same check. One synthetic route does not establish all protocol or generator behavior.

[OCaml fixture](repro/spindle-contract.ml), [Dune stanza](repro/spindle-contract.dune), [runner](repro/spindle-contract.py), [normalized results](results/spindle-contract.json). Only the fixture's own directory changed in the temporary checkout; upstream framework source was not patched. A missing explicit Wiretype dependency in the initial fixture was corrected under the project's `implicit_transitive_deps false`; this was a harness build error. Dune's initial IPC bind was sandbox-blocked, then the local build ran with the required permission.

## Temporary toolchain and cleanup record

- PostgreSQL 16.2 source archive SHA-256: `446e88294dbc2c9085ab4b7061a646fa604b4bec03521d5ea671c2e5ad9b2952`. Built under the temporary experiment directory with pgcrypto and existing OpenSSL headers/libraries; no system installation.
- Official opam 2.6.1 arm64-macos asset SHA-256: `3e7f67bda3ba0bf72f597917b17dc337ed5a1bd48224df8b747bb35ce05c569e`. OCaml 5.5.0 and project dependencies installed in a dedicated root/switch with no shell setup. Used the project's documented open-opam repository in addition to the default repository.
- pkgconf 3.0.10 official release tar.gz SHA-256: `d01a1b82f0884112d08c6dfad46f43f415d070a6a5a6aaa77ebf2674e973a9b5`. Built under temporary tools with a local `pkg-config` alias because that helper was absent. Used already installed GMP through explicit include/library/pkg-config paths. No Homebrew install or global configuration change.
- Waymark executor/bridge groups, both uses of the fresh PostgreSQL cluster and Spindle fixture servers were stopped. Temporary sources, caches and logs remain outside Git for inspection; no unrelated service or VM was started/stopped.

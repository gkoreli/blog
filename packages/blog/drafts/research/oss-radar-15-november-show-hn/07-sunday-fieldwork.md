# Sunday implementation and experiment follow-up

November 15, 2026, America/Los_Angeles. Continuation of the [closed-window record](06-sunday-closed-window.md). This record owns the additional trials, current-release corrections and final inclusion decision. Results are added after execution; declarations below are not outcomes.

## Declared Fursoy trial

Pin: `377ae9563ab1b88ee0a037f2223ab49822968396`. Run the upstream `tools/run_s1_m9_phase_a.py` unchanged, using Verilator 5.054 extracted from Homebrew's verified official bottle into a temporary directory. No system-wide tool installation is required.

Question: can the actual RTL execute the upstream interrupt/trap controls in this host environment? Acceptance is a built executable, all six mandatory properties passing, and zero mismatches in the declared multi-seed interrupt stress. Retain compilation failures and warnings as well as the machine-readable result. The testbench explicitly disables the frontend and injects operations; this cannot establish fetched-instruction correctness, Sail equivalence, Linux boot, timing, FPGA behavior or fabricated hardware performance. The public source and maintainer's reported results are comparison material, not independent acceptance.

## AgentRun release correction to investigate

The November 15 live check found platform `v0.1.0-beta.38`, published November 14 at 23:10:31 UTC, with source `d10f0053e09cd7ac0186006b13f7a6a52aa8bc22`. GitHub's `releases/latest` selects a separate observation-CLI release; the platform release collection is required here. Beta.38 says compile/guards/replay/promotion now ship. The manuscript's beta.37 statement that this stack is absent is superseded for the current platform release.

Read the actual compile → promotion → workflow-first dispatch path, minimum evidence rules, replay scoring and fallback conditions before revising the take. Preserve the older real-kernel controls at their original source pin. A released learning mechanism is separate from demonstrated improvement on held-out work.

## Declared AgentRun learning-scoring trial

Bundle the unchanged beta.38 `packages/serve/src/learn/promote.ts` and its actual local imports to run on Node 24.22.3 without a model/provider. Feed its real `replayScore` and `clears` functions synthetic graded rows. Compare 20 correct autonomous answers, one correct autonomous answer plus 19 hand-backs, all hand-backs, one wrong answer among 20, and five correct answers plus 15 failed replays. Also check a changed answer with no expected label. Independently assert the resulting denominator, handed-back count, accuracy and two-point bar. This tests how to interpret a promotion score, not model learning, cost savings, the runner's persistent orchestration or a complete promotion. Read the runner separately for the minimum-five-evaluable-input rule and the below-five dry-run exception.

## Declared Fursoy CSR comparison

Exercise the actual `fursoy_s1_csr` module with a directed CSRRC issue/retire handshake: software clears STIP while external SEIP is asserted, then the external pin goes low. The read value must include the external interrupt, but the later software pending bit must not retain it. Controls: no external interrupt, an intentionally software-set SEIP bit, and an external pin pulse with no CSR operation. Repeat with a temporary source mutation that substitutes the combined read value for the software-only SEIP write operand, matching the earlier behavior described by the maintainer. Expect the unmodified RTL to pass all controls and the mutation to retain SEIP only in the relevant CSRRC condition. This tests one reported correction and its distinguishing input, not a reproduced historical checkout, the full Linux livelock or all CSR instructions.

## Executed results and inclusion

Fursoy earns a featured entry as an inspectable processor/verification project, with a source-traced coherence mechanism and independently executed RTL controls. Its 500 MHz and Linux claims remain attributed and bounded.

- The unchanged phase-A runner built and passed **7/7 properties**, including the six mandatory interrupt properties and the additional seventh precise-exception property. Its stress result reports **25,500 accepted operations**, seeds `42`, `20260920`, `20261009`, and zero mismatches. The run took 24.49 seconds including build on this host; that is not a performance benchmark. [Normalized receipt](results/fursoy-m9-phase-a-01.json). The runner uses `-Wno-fatal`; passing it is not lint acceptance.

  Verilator reported two `LATCH` warnings for `sign_ext` and `raw_fmt`, block-local temporaries in the MMIO load-formatting block of `fursoy_s1_lsu_queues.sv:1331`. They are assigned on its load path and unused on its store path. This warning observation does not establish an output-latch defect or a functional failure; the suite does not settle lint or synthesis correctness.
- The [directed CSR fixture](repro/fursoy-csr-seip.py) passed against unmodified RTL: after the external pin fell, SEIP was zero. The single write-operand mutation retained SEIP as one. No-pin and pin-only controls cleared; a deliberately software-set SEIP stayed set in both. [Receipt](results/fursoy-csr-seip-01.json). This isolates the operand's consequence without claiming a historical-checkout or complete Linux regression reproduction.
- Two earlier directed harness attempts failed before this acceptance: reset was initially left in U-mode and rejected the machine CSR; the next assumed the test-injection switch supported `mip`, but it has no such case. The accepted fixture sets M-mode and seeds software state through real CSRRW issue/retire, without patching original RTL. These are corrected harness assumptions, not project failures. Logs and intermediate builds remain outside Git.
- AgentRun's actual beta.38 scoring module passed all five declared synthetic comparisons, plus the changed-unlabelled-answer control. One autonomous correct answer and nineteen hand-backs score 100% and clear the bar, while twenty hand-backs do not. One wrong answer in twenty falls five points below the recorded agent and fails. Fifteen failed rows plus five correct ones produce a five-row, 100% score; failed rows are excluded, and the orchestration's reason string reports them separately. [Receipt](results/agentrun-learning-score-01.json). No model, persistent store or complete promotion was run.
- The first scoring bundle lacked TypeBox resolution; the accepted bundle uses the project's declared `typebox@1.3.27` from the isolated dependency runtime. A fixture argument-mapping error was corrected before accepted execution. Neither failure is evidence of a product defect.

The new AgentRun release changes the project take: a workflow can now be compiled and run before the agent, with guards and recorded promotion decisions. The [runner](https://github.com/Parcha-ai/agentrun/blob/d10f0053e09cd7ac0186006b13f7a6a52aa8bc22/packages/serve/src/runner/promotion.ts) promotes on a passing dry run with fewer than five suitable graded inputs; otherwise it needs at least five evaluable replay rows and the scoring bar. The [workflow-first path](https://github.com/Parcha-ai/agentrun/blob/d10f0053e09cd7ac0186006b13f7a6a52aa8bc22/packages/serve/src/runner/workflow-first.ts) hands work back on failure/escalation and compares all-in cost once enough runs exist. That cost rule explicitly does not catch confidently wrong answers. The useful operating question is answer quality together with autonomous coverage, failure exclusions and total cost on fresh tasks.

## Consequential current-release checks

Checked November 15 at approximately 15:25–15:33 UTC. Selected code and receipts keep their actual pins; a new release does not retroactively change which binary or source was tested.

| Project | Current checked state | Consequence for the manuscript |
| --- | --- | --- |
| AgentRun | Platform beta.38, source `d10f0053e09cd7ac0186006b13f7a6a52aa8bc22`; separate observation-CLI latest pointer is not the platform version | Replace the beta.37-only learning statement. Beta.38 keeps SQLite version 11 and can open beta.37 data, but drops `mcp_pins`; rolling back requires the pre-upgrade copy. Postgres has separate migrations. Keep prior recovery trials at `b98a6c0`, new scoring at beta.38 |
| Yogurt | v0.3.21, source `a7596ec6471763ea059effed8be1ad7d8efd5959` | Inspected comparison from the trial pin: no MCP server/socket or notes-queue changes. Newer note/title/calendar handling does not establish recognition quality. Merged [PR 39](https://github.com/FrigadeHQ/yogurt/pull/39) fixes microphone sample-rate startup, first shipped in v0.3.20 |
| ZigZag | v0.1.5, source `429a028054145fc3e541525bb05b57596fa49d22`; v0.1.4/5 add substantial editing/shape work | `src/main.rs` is unchanged from the exercised pin; `checks.rs` changes test construction only. Planning/geometry changed, so retain the exact older source for the 225-stitch result and do not claim current design-output equivalence. Mention the newer editor direction without a GUI/sew-out claim |
| Agweb | v0.3.0, source `1d97f056b8727f7278cb4da4d11c1af22cda2ec9` | Source comparison retains the profile/store behavior exercised in released 0.2.0. New Workspace now exposes profile selection; click-cover checks and error/version reporting also changed. Closed [PR 1](https://github.com/paul-nameless/agweb/pull/1) records a user's strict-YAML skill-install failure and fix |
| Takumi | 2.20.0 remains current; master `8a55f0b673ad1a707a422457876783b658183f33` unchanged | Font issue [2558](https://github.com/kane50613/takumi/issues/2558) remains open with no comments. Keep the separately reproduced matching condition; no maintainer resolution is claimed |
| AssemblyForNeovim | No GitHub releases returned | Use the pinned implementation and actual compiler-context result |
| bo2-mac | v0.2.0-test.4 remains latest returned | Keep source-only/gameplay boundaries |
| JAX implementation | v1.0 remains latest returned | Keep the educational architecture trial distinct from the author's training result |

The AgentRun open-items page inspected during this check was dominated by bot-authored pull requests. Those are implementation/proposal evidence, not independent customer testimony. The Agweb YAML report describes actual installation friction; Yogurt's microphone contribution describes a concrete capture failure. No maintainer was contacted and no external message was sent.

The bo2 source follow-up closed the earlier caller gap. At the existing pin, `win32_runtime.cpp:20563–20570` actually calls `bo2_interp` for an untranslated target; `interp.cpp:129–134` enables this by default unless `BO2_INTERP=0` and limits eligibility to the text range. `remaining_dlls_impl.cpp`'s `translate_shader` calls `bo2_dxbc_translate2` and registers source/resource maps with the graphics backend; the Metal backend compiles supplied MSL source. This is selected caller/control-flow inspection, not a game or graphics execution trial. The manuscript now links the actual dispatch and shader callers.

## Next action

Finalize nine entries: eight open-source launch projects after Klad's exclusion, plus returning Takumi. Update the closed-window counts and current release qualifications, then complete factual/usefulness/prose review and isolated site rendering. The publisher remains paused; no manifest entry is authorized by completing this research.
